
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, Link2, Trash2, Edit } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PhysicalTrade, PhysicalTradeLeg } from '@/types';
import { formulaToDisplayString } from '@/utils/formulaUtils';
import { deletePhysicalTrade, deletePhysicalTradeLeg } from '@/utils/physicalTradeDeleteUtils';
import { pausePhysicalSubscriptions, resumePhysicalSubscriptions, withPausedPhysicalSubscriptions } from '@/utils/physicalTradeSubscriptionUtils';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { useDeleteStateMachine } from '@/hooks/useDeleteStateMachine';

interface PhysicalTradeTableProps {
  trades: PhysicalTrade[];
  loading: boolean;
  error: Error | null;
  refetchTrades: () => void;
  realtimeChannelsRef?: React.MutableRefObject<{ [key: string]: any }>;
}

// Helper functions
const debounce = (func: Function, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const PhysicalTradeTable: React.FC<PhysicalTradeTableProps> = ({
  trades,
  loading,
  error,
  refetchTrades,
  realtimeChannelsRef
}) => {
  const navigate = useNavigate();
  const [comments, setComments] = useState<Record<string, string>>({});
  const [savingComments, setSavingComments] = useState<Record<string, boolean>>({});
  
  // State machine for delete operations
  const { state: deleteState, actions: deleteActions } = useDeleteStateMachine();
  
  // Effect to handle state transitions
  useEffect(() => {
    if (!realtimeChannelsRef) return;

    const handleDeleteState = async () => {
      switch (deleteState.status) {
        case 'deleting':
          // Handle delete operation
          try {
            console.log(`[PHYSICAL] Starting delete operation in state machine`);
            
            // Pause subscriptions before deleting
            deleteActions.pauseSubscriptions();
          } catch (error) {
            console.error('[PHYSICAL] Error preparing for deletion:', error);
            deleteActions.deleteError(error instanceof Error ? error : String(error));
          }
          break;
          
        case 'pausing_subscriptions':
          try {
            console.log('[PHYSICAL] Pausing subscriptions...');
            await pausePhysicalSubscriptions(realtimeChannelsRef.current);
            
            // Now actually perform the delete operation
            if (deleteState.status === 'confirm_requested') {
              const { itemId, itemReference, isLeg, parentId } = deleteState;
              let success = false;
              
              if (isLeg && parentId) {
                success = await deletePhysicalTradeLeg(
                  itemId, 
                  parentId,
                  (progress) => deleteActions.updateProgress(progress)
                );
              } else {
                success = await deletePhysicalTrade(
                  itemId,
                  (progress) => deleteActions.updateProgress(progress)
                );
              }
              
              if (success) {
                deleteActions.deleteSuccess(
                  `${isLeg ? 'Trade leg' : 'Trade'} ${itemReference} deleted successfully`
                );
              } else {
                throw new Error(`Failed to delete ${isLeg ? 'leg' : 'trade'}`);
              }
            } else {
              throw new Error('Invalid state for delete operation');
            }
          } catch (error) {
            console.error('[PHYSICAL] Error during delete operation:', error);
            deleteActions.deleteError(error instanceof Error ? error : String(error));
          }
          break;
          
        case 'resuming_subscriptions':
          try {
            console.log('[PHYSICAL] Resuming subscriptions...');
            await resumePhysicalSubscriptions(realtimeChannelsRef.current);
            
            // After resuming subscriptions, trigger a refetch
            console.log('[PHYSICAL] Refetching trades after subscriptions resumed');
            setTimeout(() => {
              refetchTrades();
              deleteActions.reset();
            }, 300);
          } catch (error) {
            console.error('[PHYSICAL] Error resuming subscriptions:', error);
            // Still reset the state machine
            deleteActions.reset();
          }
          break;
          
        case 'success':
          // On success, show toast and resume subscriptions
          toast.success(deleteState.message);
          deleteActions.resumeSubscriptions();
          break;
          
        case 'error':
          // On error, show toast and resume subscriptions
          toast.error('Delete operation failed', { 
            description: deleteState.error instanceof Error 
              ? deleteState.error.message 
              : String(deleteState.error) 
          });
          deleteActions.resumeSubscriptions();
          break;
          
        case 'cancelled':
          // When cancelled, resume subscriptions and reset state
          console.log('[PHYSICAL] Delete operation cancelled, resuming subscriptions');
          
          // Use withPausedPhysicalSubscriptions to safely resume
          try {
            await resumePhysicalSubscriptions(realtimeChannelsRef.current);
            
            // Reset state after resuming
            setTimeout(() => {
              deleteActions.reset();
            }, 100);
          } catch (error) {
            console.error('[PHYSICAL] Error handling cancellation:', error);
            deleteActions.reset();
          }
          break;
      }
    };
    
    handleDeleteState();
  }, [deleteState, deleteActions, realtimeChannelsRef, refetchTrades]);

  const debouncedSaveComment = useCallback(
    debounce((tradeId: string, comment: string) => {
      setSavingComments(prev => ({ ...prev, [tradeId]: true }));
      
      setTimeout(() => {
        console.log(`[PHYSICAL] Saving comment for trade ${tradeId}: ${comment}`);
        // Add toast functionality here if needed
        setSavingComments(prev => ({ ...prev, [tradeId]: false }));
      }, 500);
    }, 1000),
    []
  );

  const handleCommentChange = (tradeId: string, comment: string) => {
    setComments(prev => ({
      ...prev,
      [tradeId]: comment
    }));
  };

  const handleCommentBlur = (tradeId: string) => {
    debouncedSaveComment(tradeId, comments[tradeId] || '');
  };

  const handleEditTrade = (tradeId: string) => {
    navigate(`/trades/${tradeId}`);
  };

  // Show delete confirmation dialog
  const showDeleteConfirmation = (tradeId: string, tradeReference: string, isLeg = false, parentId = '') => {
    console.log(`[PHYSICAL] Showing delete confirmation for ${isLeg ? 'leg' : 'trade'}: ${tradeId} (${tradeReference})`);
    deleteActions.openConfirmDialog(tradeId, tradeReference, isLeg, parentId);
  };

  // Cancel delete action
  const cancelDelete = () => {
    console.log('[PHYSICAL] Delete operation cancelled by user');
    deleteActions.cancelDelete();
  };

  // Confirm delete action
  const confirmDelete = () => {
    console.log(`[PHYSICAL] Delete confirmed, transitioning to deleting state`);
    deleteActions.startDelete();
  };

  const renderFormula = (trade: PhysicalTrade | PhysicalTradeLeg) => {
    if (!trade.formula || !trade.formula.tokens || trade.formula.tokens.length === 0) {
      return <span className="text-muted-foreground italic">No formula</span>;
    }
    
    const displayText = formulaToDisplayString(trade.formula.tokens);
    
    return (
      <div className="max-w-[300px] overflow-hidden">
        <span 
          className="text-sm font-mono hover:bg-muted px-1 py-0.5 rounded" 
          title={displayText}
        >
          {displayText}
        </span>
      </div>
    );
  };

  const isMultiLegTrade = (trade: PhysicalTrade) => {
    return trade.legs && trade.legs.length > 1;
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <div>
          <h3 className="font-medium">Failed to load trades</h3>
          <p className="text-muted-foreground text-sm">
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetchTrades()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <>
      {deleteState.status === 'deleting' && (
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-1">
            Deleting... Please wait
          </p>
          <Progress value={deleteState.progress} className="h-2" />
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={deleteState.status === 'confirm_requested'} 
        onOpenChange={(open) => {
          // If dialog is being closed without user action, ensure clean state
          if (!open) {
            cancelDelete();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteState.status === 'confirm_requested' && (
                <>
                  Are you sure you want to delete {deleteState.isLeg ? 'leg' : 'trade'} "{deleteState.itemReference}"?
                  This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reference</TableHead>
            <TableHead>Buy/Sell</TableHead>
            <TableHead>INCO</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Counterparty</TableHead>
            <TableHead>Price Formula</TableHead>
            <TableHead>Comments</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trades.length > 0 ? (
            trades.flatMap((trade) => {
              const hasMultipleLegs = isMultiLegTrade(trade);
              const legs = trade.legs || [];
              
              return legs.map((leg, legIndex) => (
                <TableRow 
                  key={leg.id}
                  className={legIndex > 0 ? "border-t-0" : undefined}
                >
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Link to={`/trades/${trade.id}`} className="text-primary hover:underline">
                        {trade.physicalType === 'term' ? 
                          `${trade.tradeReference}-${leg.legReference.split('-').pop()}` : 
                          trade.tradeReference
                        }
                      </Link>
                      {hasMultipleLegs && trade.physicalType === 'term' && (
                        <Badge variant="outline" className="h-5 text-xs">
                          <Link2 className="mr-1 h-3 w-3" />
                          {legIndex === 0 ? "Primary" : `Leg ${legIndex + 1}`}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{leg.buySell}</TableCell>
                  <TableCell>{leg.incoTerm}</TableCell>
                  <TableCell className="text-right">{leg.quantity} {leg.unit}</TableCell>
                  <TableCell>{leg.product}</TableCell>
                  <TableCell>{trade.counterparty}</TableCell>
                  <TableCell>{renderFormula(leg)}</TableCell>
                  <TableCell>
                    <div className="relative">
                      <Textarea 
                        placeholder="Add comments..."
                        value={comments[leg.id] || ''}
                        onChange={(e) => handleCommentChange(leg.id, e.target.value)}
                        onBlur={() => handleCommentBlur(leg.id)}
                        className="min-h-[40px] text-sm resize-none border-transparent hover:border-input focus:border-input transition-colors"
                        rows={1}
                      />
                      {savingComments[leg.id] && (
                        <div className="absolute top-1 right-1">
                          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          disabled={deleteState.status !== 'idle' && deleteState.status !== 'cancelled'}
                        >
                          {deleteState.status === 'deleting' && 
                           deleteState.status === 'confirm_requested' &&
                           (hasMultipleLegs ? leg.id : trade.id) === 
                           (deleteState.status === 'confirm_requested' ? deleteState.itemId : '') ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Deleting...
                            </>
                          ) : (
                            'Actions'
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditTrade(trade.id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Trade
                        </DropdownMenuItem>
                        <Link to={`/trades/${trade.id}`}>
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                        </Link>
                        {hasMultipleLegs && trade.physicalType === 'term' ? (
                          <DropdownMenuItem 
                            onClick={() => showDeleteConfirmation(leg.id, leg.legReference, true, trade.id)}
                            className="text-destructive focus:text-destructive"
                            disabled={deleteState.status !== 'idle'}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Trade Leg
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem 
                            onClick={() => showDeleteConfirmation(trade.id, trade.tradeReference)}
                            className="text-destructive focus:text-destructive"
                            disabled={deleteState.status !== 'idle'}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Trade
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ));
            })
          ) : (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                No physical trades found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );
};

export default PhysicalTradeTable;
