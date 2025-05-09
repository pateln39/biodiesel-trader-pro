
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Movement } from '@/types';
import { Table, TableBody, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import MovementEditDialog from './MovementEditDialog';
import CommentsCellInput from '@/components/trades/physical/CommentsCellInput';
import TradeDetailsDialog from './TradeDetailsDialog';
import { SortableTable } from '@/components/ui/sortable-table';
import { StorageFormDialog } from './movements/StorageFormDialog';
import { toast } from 'sonner';
import { useMovementDateSort } from '@/hooks/useMovementDateSort';
import DemurrageCalculatorDialog from './demurrage/DemurrageCalculatorDialog';
import { getGroupColorClasses } from '@/utils/colorUtils';
import MovementTableHeader from './movements/MovementTableHeader';
import MovementRow from './movements/MovementRow';

interface MovementsTableProps {
  filteredMovements: Movement[];
  selectedMovementIds: string[];
  onToggleSelect: (id: string) => void;
  onReorder: (reorderedItems: Movement[]) => Promise<void>;
  onUngroupMovement: (groupId: string) => void;
  isUngrouping: boolean;
}

const MovementsTable: React.FC<MovementsTableProps> = ({ 
  filteredMovements,
  selectedMovementIds,
  onToggleSelect,
  onReorder,
  onUngroupMovement,
  isUngrouping
}) => {
  const queryClient = useQueryClient();
  const [selectedMovement, setSelectedMovement] = React.useState<Movement | null>(null);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [isCommentsDialogOpen, setIsCommentsDialogOpen] = useState(false);
  const [selectedMovementForComments, setSelectedMovementForComments] = useState<Movement | null>(null);
  const [tradeDetailsOpen, setTradeDetailsOpen] = useState(false);
  const [selectedTradeId, setSelectedTradeId] = useState<string | undefined>(undefined);
  const [selectedLegId, setSelectedLegId] = useState<string | undefined>(undefined);
  const [isStorageFormOpen, setIsStorageFormOpen] = useState(false);
  const [selectedMovementForStorage, setSelectedMovementForStorage] = useState<Movement | null>(null);
  const [isDemurrageDialogOpen, setIsDemurrageDialogOpen] = useState(false);
  const [selectedMovementForDemurrage, setSelectedMovementForDemurrage] = useState<Movement | null>(null);
  const [confirmUngroupDialogOpen, setConfirmUngroupDialogOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Get row group classes
  const getRowGroupClasses = (item: Movement, index: number, items: Movement[]) => {
    if (!item.group_id) return "";
    
    const isFirstInGroup = (i: Movement, idx: number, its: Movement[]) => {
      if (!i.group_id) return false;
      if (idx === 0) return true;
      const previousMovement = its[idx - 1];
      return i.group_id !== previousMovement.group_id;
    };
    
    const isLastInGroup = (i: Movement, idx: number, its: Movement[]) => {
      if (!i.group_id) return false;
      if (idx === its.length - 1) return true;
      const nextMovement = its[idx + 1];
      return i.group_id !== nextMovement.group_id;
    };
    
    const colorClasses = getGroupColorClasses(item.group_id);
    let classes = colorClasses;
    
    if (isFirstInGroup(item, index, items)) {
      classes += " rounded-t-md border-t border-l border-r";
    } else {
      classes += " border-l border-r";
    }
    
    if (isLastInGroup(item, index, items)) {
      classes += " rounded-b-md border-b mb-1";
    }
    
    return classes;
  };

  // Handler functions
  const handleCommentsClick = (movement: Movement) => {
    setSelectedMovementForComments(movement);
    setIsCommentsDialogOpen(true);
  };

  const handleStatusChange = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleViewTradeDetails = (tradeId: string, legId?: string) => {
    setSelectedTradeId(tradeId);
    setSelectedLegId(legId);
    setTradeDetailsOpen(true);
  };

  const handleEditMovement = (movement: Movement) => {
    setSelectedMovement(movement);
    setEditDialogOpen(true);
  };

  const handleStorageClick = (movement: Movement) => {
    setSelectedMovementForStorage(movement);
    setIsStorageFormOpen(true);
  };

  const handleDemurrageCalculatorClick = (movement: Movement) => {
    setSelectedMovementForDemurrage(movement);
    setIsDemurrageDialogOpen(true);
  };

  const handleUngroupClick = (groupId: string) => {
    setSelectedGroupId(groupId);
    setConfirmUngroupDialogOpen(true);
  };

  const handleConfirmUngroup = () => {
    if (selectedGroupId) {
      onUngroupMovement(selectedGroupId);
      setConfirmUngroupDialogOpen(false);
      setSelectedGroupId(null);
    }
  };

  const handleDeleteMovement = (id: string) => {
    deleteMovementMutation.mutate(id);
  };

  const handleEditComplete = () => {
    setEditDialogOpen(false);
    setSelectedMovement(null);
    queryClient.invalidateQueries({ queryKey: ['movements'] });
  };

  // Fix for the type mismatch - create a wrapper function that adapts the interface
  const handleCommentsUpdate = (id: string, comments: string) => {
    updateCommentsMutation.mutate({ id, comments });
  };

  // This is the adapter function that matches CommentsCellInput's expected signature
  const handleSelectedMovementCommentsUpdate = (comments: string) => {
    if (selectedMovementForComments) {
      handleCommentsUpdate(selectedMovementForComments.id, comments);
    }
  };

  // Toggle select all function
  const handleToggleSelectAll = () => {
    if (selectedMovementIds.length === filteredMovements.length) {
      // Deselect all movements
      filteredMovements.forEach(m => {
        if (selectedMovementIds.includes(m.id)) {
          onToggleSelect(m.id);
        }
      });
    } else {
      // Select all movements
      const allIds = filteredMovements.map(m => m.id);
      selectedMovementIds.forEach(id => {
        if (!allIds.includes(id)) {
          onToggleSelect(id);
        }
      });
      allIds.forEach(id => {
        if (!selectedMovementIds.includes(id)) {
          onToggleSelect(id);
        }
      });
    }
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { data, error } = await supabase
        .from('movements')
        .update({ status })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['openTrades'] });
      toast.success("Status updated", {
        description: "Movement status has been updated successfully."
      });
    },
    onError: (error) => {
      console.error('[MOVEMENTS] Error updating status:', error);
      toast.error("Failed to update status", {
        description: "There was an error updating the movement status."
      });
    }
  });

  const updateCommentsMutation = useMutation({
    mutationFn: async ({ id, comments }: { id: string, comments: string }) => {
      const { data, error } = await supabase
        .from('movements')
        .update({ comments })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      setIsCommentsDialogOpen(false);
      setSelectedMovementForComments(null);
      toast.success("Comments updated", {
        description: "Movement comments have been updated successfully."
      });
    },
    onError: (error) => {
      console.error('[MOVEMENTS] Error updating comments:', error);
      toast.error("Failed to update comments", {
        description: "There was an error updating the movement comments."
      });
    }
  });

  const deleteMovementMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('movements')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['openTrades'] });
      
      toast.success("Movement deleted", {
        description: "Movement has been deleted successfully."
      });
    },
    onError: (error) => {
      console.error('[MOVEMENTS] Error deleting movement:', error);
      toast.error("Failed to delete movement", {
        description: "There was an error deleting the movement."
      });
    }
  });

  const {
    sortColumns,
    toggleSortColumn,
    sortMovements,
    hasSorting
  } = useMovementDateSort();

  const sortedMovements = sortMovements(filteredMovements);

  if (filteredMovements.length === 0) {
    return (
      <div className="w-full">
        <div className="text-center py-10">
          <p className="text-muted-foreground mb-4">No movements match the selected filters</p>
        </div>
      </div>
    );
  }

  const renderHeader = () => (
    <MovementTableHeader
      onToggleSelectAll={handleToggleSelectAll}
      allSelected={selectedMovementIds.length === filteredMovements.length}
      filteredMovementsLength={filteredMovements.length}
      sortColumns={sortColumns}
      onToggleSortColumn={toggleSortColumn}
    />
  );

  const renderRow = (movement: Movement, index: number) => (
    <MovementRow
      movement={movement}
      index={index}
      movements={sortedMovements}
      isSelected={selectedMovementIds.includes(movement.id)}
      onToggleSelect={onToggleSelect}
      onStatusChange={handleStatusChange}
      onCommentsClick={handleCommentsClick}
      onViewTradeDetails={handleViewTradeDetails}
      onEditMovement={handleEditMovement}
      onStorageClick={handleStorageClick}
      onDemurrageCalculatorClick={handleDemurrageCalculatorClick}
      onDeleteMovement={handleDeleteMovement}
      onUngroupClick={handleUngroupClick}
      isUngrouping={isUngrouping}
    />
  );

  return (
    <>
      <ScrollArea className="w-full" orientation="horizontal">
        <div className="w-full min-w-[1800px]">
          <SortableTable
            items={sortedMovements}
            onReorder={onReorder}
            renderHeader={renderHeader}
            renderRow={renderRow}
            disableDragAndDrop={hasSorting}
            getRowBgClass={getRowGroupClasses}
            disabledRowClassName=""
            onSelectItem={onToggleSelect}
            selectedItemIds={selectedMovementIds}
          />
        </div>
      </ScrollArea>
      
      {selectedMovement && (
        <MovementEditDialog 
          open={editDialogOpen} 
          onOpenChange={setEditDialogOpen}
          movement={selectedMovement}
          onSuccess={handleEditComplete}
        />
      )}
      
      <Dialog open={isCommentsDialogOpen} onOpenChange={setIsCommentsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle>
            Comments for Movement {selectedMovementForComments?.referenceNumber}
          </DialogTitle>
          <div className="space-y-2 py-4">
            {selectedMovementForComments && (
              <CommentsCellInput
                tradeId={selectedMovementForComments.id}
                initialValue={selectedMovementForComments.comments || ''}
                onSave={handleSelectedMovementCommentsUpdate}
                showButtons={true}
                onCancel={() => setIsCommentsDialogOpen(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {selectedMovementForStorage && (
        <StorageFormDialog 
          open={isStorageFormOpen} 
          onOpenChange={setIsStorageFormOpen}
          movement={selectedMovementForStorage}
        />
      )}

      {selectedMovementForDemurrage && (
        <Dialog open={isDemurrageDialogOpen} onOpenChange={setIsDemurrageDialogOpen}>
          <DemurrageCalculatorDialog
            movement={selectedMovementForDemurrage}
            onClose={() => setIsDemurrageDialogOpen(false)}
          />
        </Dialog>
      )}

      <TradeDetailsDialog
        open={tradeDetailsOpen}
        onOpenChange={setTradeDetailsOpen}
        tradeId={selectedTradeId}
        legId={selectedLegId}
      />

      <AlertDialog open={confirmUngroupDialogOpen} onOpenChange={setConfirmUngroupDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ungroup Movements</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to ungroup these movements? This will allow them to be moved independently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmUngroup}>
              Ungroup
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MovementsTable;
