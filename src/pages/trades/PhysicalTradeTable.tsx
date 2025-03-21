
import React, { useState, useCallback, useRef } from 'react';
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
import { PhysicalTrade, PhysicalTradeLeg } from '@/types';
import { formulaToDisplayString } from '@/utils/formulaUtils';
import PhysicalTradeDeleteDialog from '@/components/trades/PhysicalTradeDeleteDialog';
import { deletePhysicalTrade, deletePhysicalTradeLeg, safelyCloseDialog } from '@/utils/physicalTradeDeleteUtils';
import { pausePhysicalSubscriptions, resumePhysicalSubscriptions } from '@/utils/physicalTradeSubscriptionUtils';

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
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionProgress, setDeletionProgress] = useState(0);
  const [tradeToDelete, setTradeToDelete] = useState<{ id: string, reference: string, isLeg: boolean, parentId?: string }>({ id: '', reference: '', isLeg: false });
  const isProcessingRef = useRef(false);

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

  const handleDeleteTrade = (tradeId: string, tradeReference: string) => {
    setTradeToDelete({ id: tradeId, reference: tradeReference, isLeg: false });
    setShowDeleteConfirmation(true);
  };

  const handleDeleteLeg = (legId: string, legReference: string, parentId: string) => {
    setTradeToDelete({ 
      id: legId, 
      reference: legReference, 
      isLeg: true,
      parentId
    });
    setShowDeleteConfirmation(true);
  };

  const handleCancelDelete = () => {
    console.log('[PHYSICAL] Delete operation cancelled');
    // Reset state in a controlled sequence
    setDeletionProgress(0);
  };

  const handleConfirmDelete = async () => {
    try {
      console.log('[PHYSICAL] Starting delete operation');
      isProcessingRef.current = true;
      setIsDeleting(true);
      setDeletionProgress(0);
      
      // Pause subscriptions to prevent race conditions during delete
      if (realtimeChannelsRef) {
        pausePhysicalSubscriptions(realtimeChannelsRef.current);
      }
      
      let success = false;
      
      if (tradeToDelete.isLeg && tradeToDelete.parentId) {
        success = await deletePhysicalTradeLeg(
          tradeToDelete.id, 
          tradeToDelete.parentId,
          setDeletionProgress
        );
      } else {
        success = await deletePhysicalTrade(
          tradeToDelete.id,
          setDeletionProgress
        );
      }
      
      // Only close dialog after ensuring success
      if (success) {
        // Wait for animations to complete before closing dialog
        await safelyCloseDialog(setShowDeleteConfirmation);
        
        // Reset delete state in controlled sequence
        setTradeToDelete({ id: '', reference: '', isLeg: false });
        setDeletionProgress(0);
        
        // Resume subscriptions and refetch trades
        if (realtimeChannelsRef) {
          resumePhysicalSubscriptions(realtimeChannelsRef.current);
        }
        
        refetchTrades();
      }
    } catch (error) {
      console.error('[PHYSICAL] Error during delete operation:', error);
    } finally {
      console.log('[PHYSICAL] Delete operation finalized');
      setIsDeleting(false);
      isProcessingRef.current = false;
    }
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
                        <Button variant="ghost" size="sm">Actions</Button>
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
                            onClick={() => handleDeleteLeg(leg.id, leg.legReference, trade.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Trade Leg
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem 
                            onClick={() => handleDeleteTrade(trade.id, trade.tradeReference)}
                            className="text-destructive focus:text-destructive"
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

      <PhysicalTradeDeleteDialog
        showDeleteConfirmation={showDeleteConfirmation}
        onOpenChange={setShowDeleteConfirmation}
        onConfirmDelete={handleConfirmDelete}
        onCancelDelete={handleCancelDelete}
        isDeleting={isDeleting}
        tradeName={tradeToDelete.reference}
        isLegDelete={tradeToDelete.isLeg}
        deletionProgress={deletionProgress}
      />
    </>
  );
};

export default PhysicalTradeTable;
