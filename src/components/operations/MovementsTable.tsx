import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Movement } from '@/types';
import { format } from 'date-fns';
import { Edit, Trash2, MessageSquare, FileText, Warehouse, Eye, Calculator, Ungroup, Group } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from "@/components/ui/checkbox";
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
import { SortableTable } from '@/components/ui/sortable-table';
import { StorageFormDialog } from './movements/StorageFormDialog';
import { toast } from 'sonner';
import ProductToken from '@/components/operations/storage/ProductToken';
import { DateSortHeader } from './DateSortHeader';
import { useMovementDateSort } from '@/hooks/useMovementDateSort';
import DemurrageCalculatorDialog from './demurrage/DemurrageCalculatorDialog';

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

  // Helper function to get all movements in a group - using the input array instead of filteredMovements
  const getMovementsInGroup = (items: Movement[], groupId: string | null) => {
    if (!groupId) return [];
    return items.filter(m => m.group_id === groupId);
  };

  // Function to identify if an item is part of a group
  const isGroupedMovement = (item: Movement, index: number, items: Movement[]) => {
    return !!item.group_id;
  };

  // Function to determine if an item is the first in a group
  const isFirstInGroup = (item: Movement, index: number, items: Movement[]) => {
    if (!item.group_id) return false;
    
    if (index === 0) return true;
    
    const previousMovement = items[index - 1];
    
    return item.group_id !== previousMovement.group_id;
  };

  // Function to determine if an item is the last in a group
  const isLastInGroup = (item: Movement, index: number, items: Movement[]) => {
    if (!item.group_id) return false;
    
    if (index === items.length - 1) return true;
    
    const nextMovement = items[index + 1];
    
    return item.group_id !== nextMovement.group_id;
  };

  // Item is disabled for drag if it belongs to a group but is not the first item
  const isItemDisabledForDrag = (item: Movement, index: number, items: Movement[]) => {
    // Only the first item in a group can be dragged
    return !!item.group_id && !isFirstInGroup(item, index, items);
  };

  // Calculate row style based on group membership
  const getRowGroupClasses = (item: Movement, index: number, items: Movement[]) => {
    if (!item.group_id) return "";
    
    let classes = "ring-1 ring-purple-400/30 bg-purple-900/20";
    
    if (isFirstInGroup(item, index, items)) {
      classes += " rounded-t-md border-t border-l border-r border-purple-400/30";
    } else {
      classes += " border-l border-r border-purple-400/30";
    }
    
    if (isLastInGroup(item, index, items)) {
      classes += " rounded-b-md border-b border-purple-400/30 mb-1";
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
      <TableHead>
        <div className="flex items-center">
          <Checkbox
            className="mr-2"
            checked={selectedMovementIds.length > 0 && selectedMovementIds.length === filteredMovements.length}
            onCheckedChange={(checked) => {
              if (checked) {
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
              } else {
                // Deselect all movements
                filteredMovements.forEach(m => {
                  if (selectedMovementIds.includes(m.id)) {
                    onToggleSelect(m.id);
                  }
                });
              }
            }}
          />
          Movement Reference Number
        </div>
      </TableHead>
      <TableHead>Buy/Sell</TableHead>
      <TableHead>Incoterm</TableHead>
      <TableHead>Sustainability</TableHead>
      <TableHead>Product</TableHead>
      <TableHead>
        <DateSortHeader
          column="loading_period_start"
          label="Loading Start"
          sortColumns={sortColumns}
          onSort={toggleSortColumn}
        />
      </TableHead>
      <TableHead>
        <DateSortHeader
          column="loading_period_end"
          label="Loading End"
          sortColumns={sortColumns}
          onSort={toggleSortColumn}
        />
      </TableHead>
      <TableHead>Counterparty</TableHead>
      <TableHead>Comments</TableHead>
      <TableHead>Credit Status</TableHead>
      <TableHead>Scheduled Quantity</TableHead>
      <TableHead>
        <DateSortHeader
          column="nominationEta"
          label="Nomination ETA"
          sortColumns={sortColumns}
          onSort={toggleSortColumn}
        />
      </TableHead>
      <TableHead>
        <DateSortHeader
          column="nominationValid"
          label="Nomination Valid"
          sortColumns={sortColumns}
          onSort={toggleSortColumn}
        />
      </TableHead>
      <TableHead>
        <DateSortHeader
          column="cashFlow"
          label="Cash Flow Date"
          sortColumns={sortColumns}
          onSort={toggleSortColumn}
        />
      </TableHead>
      <TableHead className="bg-gray-700">Barge Name</TableHead>
      <TableHead>Loadport</TableHead>
      <TableHead>Loadport Inspector</TableHead>
      <TableHead>Disport</TableHead>
      <TableHead>Disport Inspector</TableHead>
      <TableHead>
        <DateSortHeader
          column="blDate"
          label="BL Date"
          sortColumns={sortColumns}
          onSort={toggleSortColumn}
        />
      </TableHead>
      <TableHead>Actual Quantity</TableHead>
      <TableHead>
        <DateSortHeader
          column="codDate"
          label="COD Date"
          sortColumns={sortColumns}
          onSort={toggleSortColumn}
        />
      </TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-center">Actions</TableHead>
    </>
  );

  // This function handles the custom behavior for drag and drop with groups
  const handleCustomReorder = async (reorderedItems: Movement[]) => {
    console.log('[MOVEMENTS] Starting reordering process for', reorderedItems.length, 'items');
    
    // Step 1: Extract all groups and standalone items
    const groupMap = new Map<string, Movement[]>();
    const standaloneItems: Movement[] = [];
    
    // Collect all items by their group_id (or lack thereof)
    for (const item of reorderedItems) {
      if (item.group_id) {
        // Initialize group array if this is the first item we encounter from this group
        if (!groupMap.has(item.group_id)) {
          groupMap.set(item.group_id, []);
        }
        
        // Add this item to its group's array
        groupMap.get(item.group_id)?.push(item);
      } else {
        // This is a standalone item
        standaloneItems.push(item);
      }
    }
    
    // Step 2: Sort each group internally by original sort_order to maintain group integrity
    groupMap.forEach((items, groupId) => {
      // Sort group items by their original sort_order to preserve internal group order
      items.sort((a, b) => {
        const aOrder = a.sort_order !== null ? a.sort_order : Infinity;
        const bOrder = b.sort_order !== null ? b.sort_order : Infinity;
        return aOrder - bOrder;
      });
    });
    
    // Step 3: Build the final array preserving user-intended order but keeping groups intact
    const finalItems: Movement[] = [];
    const processedGroupIds = new Set<string>();
    
    // Process items in the order the user intended
    for (const item of reorderedItems) {
      if (item.group_id && !processedGroupIds.has(item.group_id)) {
        // When we encounter a group for the first time, add all items from that group
        const groupItems = groupMap.get(item.group_id) || [];
        finalItems.push(...groupItems);
        processedGroupIds.add(item.group_id);
      } else if (!item.group_id) {
        // Add standalone items
        finalItems.push(item);
      }
      // Skip items from already processed groups
    }
    
    // Verify that all items are included
    if (finalItems.length !== reorderedItems.length) {
      console.warn('[MOVEMENTS] Item count mismatch after reordering:', 
        `Expected ${reorderedItems.length}, got ${finalItems.length}`);
      // Try to recover from any missing items
      const itemIds = new Set(finalItems.map(item => item.id));
      for (const item of reorderedItems) {
        if (!itemIds.has(item.id)) {
          finalItems.push(item);
        }
      }
    }
    
    console.log('[MOVEMENTS] Final reordered items:', finalItems.length);
    
    // Call the onReorder function with our properly sequenced items
    await onReorder(finalItems);
  };

  const renderRow = (movement: Movement, index: number) => {
    // Determine if this item can be dragged (only first in group can be dragged)
    const disableDrag = isItemDisabledForDrag(movement, index, sortedMovements);
    const isInGroup = isGroupedMovement(movement, index, sortedMovements);
    const groupBgClass = getRowGroupClasses(movement, index, sortedMovements);
    const isFirstGroupItem = isInGroup && isFirstInGroup(movement, index, sortedMovements);

    return (
      <>
        <TableCell>
          <div className="flex items-center">
            <Checkbox 
              className="mr-2" 
              checked={selectedMovementIds.includes(movement.id)}
              onCheckedChange={() => onToggleSelect(movement.id)}
            />
            <span className="flex items-center">
              {isInGroup && isFirstGroupItem && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 mr-1 bg-purple-500/20 hover:bg-purple-500/30"
                        onClick={() => handleUngroupClick(movement.group_id as string)}
                        disabled={isUngrouping}
                      >
                        <Ungroup className="h-3 w-3 text-purple-300" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Ungroup these movements</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {isInGroup && !isFirstGroupItem && (
                <Group className="h-3 w-3 text-purple-300 mr-1" />
              )}
              {movement.referenceNumber}
            </span>
          </div>
        </TableCell>
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
        <TableCell>
          <ProductToken 
            product={movement.product}
            value={movement.product}
            showTooltip={true}
          />
        </TableCell>
        <TableCell>
          {movement.loading_period_start ? format(new Date(movement.loading_period_start), 'dd MMM yyyy') : '-'}
        </TableCell>
        <TableCell>
          {movement.loading_period_end ? format(new Date(movement.loading_period_end), 'dd MMM yyyy') : '-'}
        </TableCell>
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
        <TableCell>{movement.nominationEta ? format(new Date(movement.nominationEta), 'dd MMM yyyy') : '-'}</TableCell>
        <TableCell>{movement.nominationValid ? format(new Date(movement.nominationValid), 'dd MMM yyyy') : '-'}</TableCell>
        <TableCell>{movement.cashFlow ? format(new Date(movement.cashFlow), 'dd MMM yyyy') : '-'}</TableCell>
        <TableCell className="bg-gray-700">{movement.bargeName || '-'}</TableCell>
        <TableCell>{movement.loadport || '-'}</TableCell>
        <TableCell>{movement.loadportInspector || '-'}</TableCell>
        <TableCell>{movement.disport || '-'}</TableCell>
        <TableCell>{movement.disportInspector || '-'}</TableCell>
        <TableCell>{movement.blDate ? format(new Date(movement.blDate), 'dd MMM yyyy') : '-'}</TableCell>
        <TableCell>{movement.actualQuantity?.toLocaleString()} MT</TableCell>
        <TableCell>{movement.codDate ? format(new Date(movement.codDate), 'dd MMM yyyy') : '-'}</TableCell>
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
          <div className="flex justify-center space-x-1">
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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => handleStorageClick(movement)}
                  >
                    <Warehouse className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Assign to Storage Terminal</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => handleDemurrageCalculatorClick(movement)}
                  >
                    <Calculator className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Demurrage Calculator</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
  };

  return (
    <>
      <div className="w-full overflow-auto">
        <SortableTable
          items={sortedMovements}
          onReorder={handleCustomReorder}
          renderHeader={renderHeader}
          renderRow={renderRow}
          disableDragAndDrop={hasSorting}
          isItemDisabled={isItemDisabledForDrag}
          isItemPartOfGroup={isGroupedMovement}
          isItemFirstInGroup={isFirstInGroup}
          isItemLastInGroup={isLastInGroup}
          getGroupId={(item) => item.group_id || null}
          findGroupMembers={(items, groupId) => getMovementsInGroup(items, groupId)}
          getRowBgClass={(item, index, items) => getRowGroupClasses(item, index, items)}
          disabledRowClassName=""
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
