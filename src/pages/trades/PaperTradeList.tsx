import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PaperTrade } from '@/types/paper';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { formatDate } from '@/utils/dateUtils';
import TableLoadingState from '@/components/trades/TableLoadingState';
import TableErrorState from '@/components/trades/TableErrorState';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatLegReference } from '@/utils/tradeUtils';
import { formatProductDisplay, calculateDisplayPrice } from '@/utils/productMapping';
import PaperTradeRowActions from '@/components/trades/paper/PaperTradeRowActions';

interface PaperTradeListProps {
  paperTrades: PaperTrade[];
  isLoading: boolean;
  error: Error | null;
  refetchPaperTrades: () => void;
  onDataChange?: (data: any[]) => void;
}

const PaperTradeList: React.FC<PaperTradeListProps> = ({ 
  paperTrades, 
  isLoading, 
  error, 
  refetchPaperTrades,
  onDataChange
}) => {
  const queryClient = useQueryClient();
  const [expandedTrades, setExpandedTrades] = useState<Record<string, boolean>>({});

  // Toggle expanded state for a trade
  const toggleTradeExpanded = (tradeId: string) => {
    setExpandedTrades(prev => ({
      ...prev,
      [tradeId]: !prev[tradeId]
    }));
  };

  // Prepare data for export
  useEffect(() => {
    if (paperTrades.length > 0 && onDataChange) {
      const exportData: any[] = [];
      
      paperTrades.forEach(trade => {
        trade.legs?.forEach(leg => {
          let productDisplay = formatProductDisplay(
            leg.product,
            leg.relationshipType,
            leg.rightSide?.product
          );
          
          const displayReference = `${trade.tradeReference}${leg.legReference ? `-${leg.legReference.split('-').pop()}` : '-a'}`;

          exportData.push({
            reference: displayReference,
            buySell: leg.buySell,
            quantity: leg.quantity,
            product: productDisplay,
            period: leg.period || '',
            broker: trade.broker || '',
            counterparty: trade.counterparty,
            instrument: leg.instrument || '',
            tradingPeriod: leg.tradingPeriod || '',
            price: calculateDisplayPrice(
              leg.relationshipType,
              leg.price,
              leg.rightSide?.price
            )
          });
        });
      });
      
      onDataChange(exportData);
    }
  }, [paperTrades, onDataChange]);

  // Delete paper trade mutation
  const deletePaperTradeMutation = useMutation({
    mutationFn: async (tradeId: string) => {
      // First delete legs
      const { error: legsError } = await supabase
        .from('paper_trade_legs')
        .delete()
        .eq('paper_trade_id', tradeId);
      
      if (legsError) throw legsError;
      
      // Then delete the trade
      const { error: tradeError } = await supabase
        .from('paper_trades')
        .delete()
        .eq('id', tradeId);
      
      if (tradeError) throw tradeError;
      return tradeId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paperTrades'] });
      toast.success("Paper trade deleted", {
        description: "The paper trade has been deleted successfully"
      });
    },
    onError: (error) => {
      console.error('Error deleting paper trade:', error);
      toast.error("Failed to delete paper trade", {
        description: "There was an error deleting the paper trade"
      });
    }
  });

  const handleDeleteTrade = (tradeId: string) => {
    deletePaperTradeMutation.mutate(tradeId);
  };

  if (isLoading) {
    return <TableLoadingState />;
  }

  if (error) {
    return (
      <TableErrorState
        error={error}
        onRetry={refetchPaperTrades}
      />
    );
  }

  if (paperTrades.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground mb-4">No paper trades found</p>
        <Link to="/trades/paper/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Paper Trade
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-white/10 overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-white/10">
            <TableHead>Reference</TableHead>
            <TableHead>Counterparty</TableHead>
            <TableHead>Broker</TableHead>
            <TableHead>Positions</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paperTrades && paperTrades.length > 0 ? (
            paperTrades.map((trade) => (
              <React.Fragment key={trade.id}>
                <TableRow className="border-b border-white/5 hover:bg-brand-navy/80">
                  <TableCell>
                    <Button variant="link" onClick={() => toggleTradeExpanded(trade.id)}>
                      {trade.tradeReference}
                    </Button>
                  </TableCell>
                  <TableCell>{trade.counterparty}</TableCell>
                  <TableCell>{trade.broker}</TableCell>
                  <TableCell>{trade.legs.length} positions</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link to={`/trades/paper/edit/${trade.id}`}>
                              <Button variant="ghost" size="icon">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Trade</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this trade? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteTrade(trade.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
                {expandedTrades[trade.id] && (
                  trade.legs.map((leg, legIndex) => {
                    let productDisplay = formatProductDisplay(
                      leg.product,
                      leg.relationshipType,
                      leg.rightSide?.product
                    );
                    
                    const displayReference = `${trade.tradeReference}${legIndex > 0 ? `-${String.fromCharCode(97 + legIndex)}` : '-a'}`;
                    const isMultiLeg = trade.legs.length > 1;
                    
                    // Calculate the display price based on relationship type
                    const displayPrice = calculateDisplayPrice(
                      leg.relationshipType,
                      leg.price,
                      leg.rightSide?.price
                    );
                    
                    return (
                      <TableRow key={`${trade.id}-${leg.id}`} className="border-b border-white/5 hover:bg-brand-navy/80">
                        <TableCell>
                          <Link to={`/trades/paper/edit/${trade.id}`} className="text-white hover:text-white/80">
                            {displayReference}
                          </Link>
                        </TableCell>
                        <TableCell>{trade.counterparty}</TableCell>
                        <TableCell>{leg.broker || trade.broker}</TableCell>
                        <TableCell>{productDisplay}</TableCell>
                        <TableCell className="text-center">
                          <PaperTradeRowActions
                            tradeId={trade.id}
                            legId={leg.id}
                            isMultiLeg={isMultiLeg}
                            legReference={leg.legReference}
                            tradeReference={trade.tradeReference}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </React.Fragment>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                No paper trades found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default PaperTradeList;
