import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Movement, PricingType } from '@/types';
import { format } from 'date-fns';
import { Edit, Trash2, MessageSquare, FileText } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import TableLoadingState from '@/components/trades/TableLoadingState';
import TableErrorState from '@/components/trades/TableErrorState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import MovementEditDialog from './MovementEditDialog';
import CommentsCellInput from '@/components/trades/physical/CommentsCellInput';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import TradeDetailsDialog from './TradeDetailsDialog';
import { useSortableMovements } from '@/hooks/useSortableMovements';
import { SortableTable } from '@/components/ui/sortable-table';

interface MovementsTableProps {
  filterStatuses?: string[];
  onDataChange?: (data: any[]) => void;
}

const MovementsTable: React.FC<MovementsTableProps> = ({ 
  filterStatuses = [],
  onDataChange
}) => {
  const queryClient = useQueryClient();
  const { 
    filteredMovements, 
    isLoading, 
    error, 
    refetch,
    handleReorder
  } = useSortableMovements(filterStatuses);

  const [selectedMovement, setSelectedMovement] = React.useState<Movement | null>(null);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [isCommentsDialogOpen, setIsCommentsDialogOpen] = useState(false);
  const [selectedMovementForComments, setSelectedMovementForComments] = useState<Movement | null>(null);
  const [tradeDetailsOpen, setTradeDetailsOpen] = useState(false);
  const [selectedTradeId, setSelectedTradeId] = useState<string | undefined>(undefined);
  const [selectedLegId, setSelectedLegId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (filteredMovements.length > 0 && onDataChange) {
      const exportData = filteredMovements.map(movement => {
        return {
          referenceNumber: movement.referenceNumber,
          buySell: movement.buySell,
          incoTerm: movement.incoTerm,
          sustainability: movement.sustainability || '-',
          product: movement.product,
          loadingStart: movement.nominationEta ? format(movement.nominationEta, 'dd MMM yyyy') : '-',
          loadingEnd: movement.nominationValid ? format(movement.nominationValid, 'dd MMM yyyy') : '-',
          counterpartyName: movement.counterpartyName,
          comments: movement.comments || '',
          creditStatus: movement.creditStatus || '',
          scheduledQuantity: `${movement.scheduledQuantity?.toLocaleString() || '0'} MT`,
          nominationEta: movement.nominationEta ? format(movement.nominationEta, 'dd MMM yyyy') : '-',
          nominationValid: movement.nominationValid ? format(movement.nominationValid, 'dd MMM yyyy') : '-',
          cashFlow: movement.cashFlow ? format(movement.cashFlow, 'dd MMM yyyy') : '-',
          bargeName: movement.bargeName || '-',
          loadport: movement.loadport || '-',
          loadportInspector: movement.loadportInspector || '-',
          disport: movement.disport || '-',
          disportInspector: movement.disportInspector || '-',
          blDate: movement.blDate ? format(movement.blDate, 'dd MMM yyyy') : '-',
          actualQuantity: `${movement.actualQuantity?.toLocaleString() || '0'} MT`,
          codDate: movement.codDate ? format(movement.codDate, 'dd MMM yyyy') : '-',
          status: movement.status
        };
      });
      onDataChange(exportData);
    }
  }, [filteredMovements, onDataChange]);

  const onReorder = async (reorderedItems: Movement[]) => {
    try {
      console.log('[MOVEMENTS] Starting reorder operation');
      toast.info("Reordering movements", {
        description: "Saving new order to database..."
      });
      
      await handleReorder(reorderedItems);
      
      toast.success("Order updated", {
        description: "Movement order has been saved successfully"
      });
    } catch (error) {
      console.error('[MOVEMENTS] Reordering error:', error);
      toast.error("Reordering failed", {
        description: "There was an error saving the movement order"
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
      console.log('[DEBUG] Status mutation successful - invalidating queries');
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
      console.log('[DEBUG] Comments mutation successful - invalidating queries');
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
      console.log('[DEBUG] Delete mutation successful - invalidating queries');
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

  const handleStatusChange = (id: string, newStatus: string) => {
    updateStatusMutation.mutate({ id, status: newStatus });
  };

  const handleCommentsClick = (movement: Movement) => {
    setSelectedMovementForComments(movement);
    setIsCommentsDialogOpen(true);
  };

  const handleCommentsUpdate = (comments: string) => {
    if (selectedMovementForComments) {
      updateCommentsMutation.mutate({ 
        id: selectedMovementForComments.id, 
        comments 
      });
    }
  };

  const handleDeleteMovement = (id: string) => {
    deleteMovementMutation.mutate(id);
  };

  const handleEditMovement = (movement: Movement) => {
    setSelectedMovement(movement);
    setEditDialogOpen(true);
  };

  const handleEditComplete = () => {
    setEditDialogOpen(false);
    setSelectedMovement(null);
    queryClient.invalidateQueries({ queryKey: ['movements'] });
  };

  const handleViewTradeDetails = (parentId: string, legId?: string) => {
    setSelectedTradeId(parentId);
    setSelectedLegId(legId);
    setTradeDetailsOpen(true);
  };

  if (isLoading) {
    return <TableLoadingState />;
  }

  if (error) {
    return <TableErrorState error={error as Error} onRetry={refetch} />;
  }

  if (filteredMovements.length === 0) {
    return (
      <div className="w-full">
        <div className="text-center py-10">
          <p className="text-muted-foreground mb-4">No movements match the selected filters</p>
          <Button variant="outline" onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return "default";
      case 'in progress':
        return "secondary";
      case 'cancelled':
        return "destructive";
      default:
        return "outline";
    }
  };

  const renderHeader = () => (
    <>
      <TableHead>Movement Reference Number</TableHead>
      <TableHead>Buy/Sell</TableHead>
      <TableHead>Incoterm</TableHead>
      <TableHead>Sustainability</TableHead>
      <TableHead>Product</TableHead>
      <TableHead>Loading Start</TableHead>
      <TableHead>Loading End</TableHead>
      <TableHead>Counterparty</TableHead>
      <TableHead>Comments</TableHead>
      <TableHead>Credit Status</TableHead>
      <TableHead>Scheduled Quantity</TableHead>
      <TableHead>Nomination ETA</TableHead>
      <TableHead>Nomination Valid</TableHead>
      <TableHead>Cash Flow Date</TableHead>
      <TableHead className="bg-gray-700">Barge Name</TableHead>
      <TableHead>Loadport</TableHead>
      <TableHead>Loadport Inspector</TableHead>
      <TableHead>Disport</TableHead>
      <TableHead>Disport Inspector</TableHead>
      <TableHead>BL Date</TableHead>
      <TableHead>Actual Quantity</TableHead>
      <TableHead>COD Date</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-center">Actions</TableHead>
    </>
  );

  const renderRow = (movement: Movement) => (
    <>
      <TableCell>{movement.referenceNumber}</TableCell>
      <TableCell>
        {movement.buySell && (
          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            movement.buySell === 'buy' 
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-300' 
              : 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-300'
          }`}>
            {movement.buySell === 'buy' ? 'BUY' : 'SELL'}
          </div>
        )}
      </TableCell>
      <TableCell>{movement.incoTerm}</TableCell>
      <TableCell>{movement.sustainability || '-'}</TableCell>
      <TableCell>{movement.product}</TableCell>
      <TableCell>{movement.nominationEta ? format(movement.nominationEta, 'dd MMM yyyy') : '-'}</TableCell>
      <TableCell>{movement.nominationValid ? format(movement.nominationValid, 'dd MMM yyyy') : '-'}</TableCell>
      <TableCell>{movement.counterpartyName}</TableCell>
      <TableCell>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => handleCommentsClick(movement)}
              >
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                {movement.comments && (
                  <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-blue-500"></span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add or view comments</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      <TableCell>
        {movement.creditStatus && (
          <Badge variant={
            movement.creditStatus === 'approved' ? "default" :
            movement.creditStatus === 'rejected' ? "destructive" :
            "outline"
          }>
            {movement.creditStatus}
          </Badge>
        )}
      </TableCell>
      <TableCell>{movement.scheduledQuantity?.toLocaleString()} MT</TableCell>
      <TableCell>{movement.nominationEta ? format(movement.nominationEta, 'dd MMM yyyy') : '-'}</TableCell>
      <TableCell>{movement.nominationValid ? format(movement.nominationValid, 'dd MMM yyyy') : '-'}</TableCell>
      <TableCell>{movement.cashFlow ? format(movement.cashFlow, 'dd MMM yyyy') : '-'}</TableCell>
      <TableCell className="bg-gray-700">{movement.bargeName || '-'}</TableCell>
      <TableCell>{movement.loadport || '-'}</TableCell>
      <TableCell>{movement.loadportInspector || '-'}</TableCell>
      <TableCell>{movement.disport || '-'}</TableCell>
      <TableCell>{movement.disportInspector || '-'}</TableCell>
      <TableCell>{movement.blDate ? format(movement.blDate, 'dd MMM yyyy') : '-'}</TableCell>
      <TableCell>{movement.actualQuantity?.toLocaleString()} MT</TableCell>
      <TableCell>{movement.codDate ? format(movement.codDate, 'dd MMM yyyy') : '-'}</TableCell>
      <TableCell>
        <Select
          defaultValue={movement.status}
          onValueChange={(value) => {
            console.log(`[DEBUG] Status changing from ${movement.status} to ${value}`);
            handleStatusChange(movement.id, value);
          }}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue>
              <Badge variant={getStatusBadgeVariant(movement.status)}>
                {movement.status.charAt(0).toUpperCase() + movement.status.slice(1)}
              </Badge>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="in progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="text-center">
        <div className="flex justify-center gap-1">
          {movement.parentTradeId && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => handleViewTradeDetails(movement.parentTradeId as string, movement.tradeLegId)}
                  >
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View Trade Details</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            onClick={() => handleEditMovement(movement)}
          >
            <Edit className="h-4 w-4 text-muted-foreground" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Movement</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this movement? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => handleDeleteMovement(movement.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </>
  );

  return (
    <>
      <div className="w-full overflow-auto">
        <SortableTable
          items={filteredMovements}
          onReorder={onReorder}
          renderHeader={renderHeader}
          renderRow={renderRow}
        />
      </div>
      
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
                onSave={handleCommentsUpdate}
                showButtons={true}
                onCancel={() => setIsCommentsDialogOpen(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <TradeDetailsDialog
        open={tradeDetailsOpen}
        onOpenChange={setTradeDetailsOpen}
        tradeId={selectedTradeId}
        legId={selectedLegId}
      />
    </>
  );
};

export default MovementsTable;
