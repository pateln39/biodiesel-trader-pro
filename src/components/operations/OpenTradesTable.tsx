import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OpenTrade } from '@/hooks/useOpenTrades';
import { formatDate } from '@/utils/dateUtils';
import { formatLegReference } from '@/utils/tradeUtils';
import { Loader2, Ship, MessageSquare, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from '@/integrations/supabase/client';
import FormulaCellDisplay from '@/components/trades/physical/FormulaCellDisplay';
import CommentsCellInput from '@/components/trades/physical/CommentsCellInput';
import ScheduleMovementForm from '@/components/operations/ScheduleMovementForm';
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import TradeMovementsDialog from './TradeMovementsDialog';
import { useSortableOpenTrades } from '@/hooks/useSortableOpenTrades';
import { SortableTable } from '@/components/ui/sortable-table';
import { cn } from '@/lib/utils';

const OpenTradesTable: React.FC<{
  onRefresh?: () => void;
  filterStatus?: 'all' | 'in-process' | 'completed';
}> = ({ onRefresh, filterStatus = 'all' }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { 
    filteredTrades: openTrades, 
    loading, 
    error, 
    handleReorder 
  } = useSortableOpenTrades(filterStatus);

  const [isMovementDialogOpen, setIsMovementDialogOpen] = React.useState(false);
  const [selectedTradeLegId, setSelectedTradeLegId] = React.useState<string | null>(null);

  const { mutate: closeTradeMutation, isLoading: isClosingTrade } = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('open_trades')
        .update({ status: 'closed' })
        .eq('id', id);
  
      if (error) {
        console.error('Error closing trade:', error);
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['openTrades'] });
      toast({
        title: 'Trade Closed',
        description: 'The trade has been successfully closed.',
      });
      if (onRefresh) {
        onRefresh();
      }
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error Closing Trade',
        description: error.message || 'Failed to close the trade. Please try again.',
      });
    },
  });

  const handleCloseTrade = (id: string) => {
    closeTradeMutation(id);
  };

  const handleOpenMovementDialog = (tradeLegId: string) => {
    setSelectedTradeLegId(tradeLegId);
    setIsMovementDialogOpen(true);
  };

  const handleCloseMovementDialog = () => {
    setSelectedTradeLegId(null);
    setIsMovementDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        <span>Loading trades...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error: {error.message}</div>;
  }

  return (
    <>
      <SortableTable
        items={openTrades}
        onReorder={handleReorder}
        renderHeader={() => (
          <>
            <TableHead>Trade Ref</TableHead>
            <TableHead>Leg Ref</TableHead>
            <TableHead>Counterparty</TableHead>
            <TableHead>Buy/Sell</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Sustainability</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Tolerance</TableHead>
            <TableHead>Loading Period</TableHead>
            <TableHead>Pricing Period</TableHead>
            <TableHead>Payment Term</TableHead>
            <TableHead>Credit Status</TableHead>
            <TableHead>Customs Status</TableHead>
            <TableHead>Vessel</TableHead>
            <TableHead>Loadport</TableHead>
            <TableHead>Disport</TableHead>
            <TableHead>Scheduled Qty</TableHead>
            <TableHead>Open Qty</TableHead>
            <TableHead>Pricing Type</TableHead>
            <TableHead>Pricing Formula</TableHead>
            <TableHead>Comments</TableHead>
            <TableHead>Actions</TableHead>
          </>
        )}
        renderRow={(trade) => (
          <>
            <TableCell className="font-medium">{trade.trade_reference}</TableCell>
            <TableCell>{formatLegReference(trade.leg_reference)}</TableCell>
            <TableCell>{trade.counterparty}</TableCell>
            <TableCell>{trade.buy_sell}</TableCell>
            <TableCell>{trade.product}</TableCell>
            <TableCell>{trade.sustainability}</TableCell>
            <TableCell>{trade.quantity}</TableCell>
            <TableCell>{trade.unit}</TableCell>
            <TableCell>{trade.tolerance}</TableCell>
            <TableCell>
              {trade.loading_period_start && trade.loading_period_end
                ? `${formatDate(trade.loading_period_start)} - ${formatDate(trade.loading_period_end)}`
                : 'N/A'}
            </TableCell>
            <TableCell>
              {trade.pricing_period_start && trade.pricing_period_end
                ? `${formatDate(trade.pricing_period_start)} - ${formatDate(trade.pricing_period_end)}`
                : 'N/A'}
            </TableCell>
            <TableCell>{trade.payment_term}</TableCell>
            <TableCell>{trade.credit_status}</TableCell>
            <TableCell>{trade.customs_status}</TableCell>
            <TableCell>{trade.vessel_name}</TableCell>
            <TableCell>{trade.loadport}</TableCell>
            <TableCell>{trade.disport}</TableCell>
            <TableCell>{trade.scheduled_quantity}</TableCell>
            <TableCell>{trade.open_quantity}</TableCell>
            <TableCell>{trade.pricing_type}</TableCell>
            <TableCell>
              {trade.pricing_formula && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        Formula
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="w-80">
                      <FormulaCellDisplay trade={trade} />
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </TableCell>
            <TableCell>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Comments
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="w-80">
                    <CommentsCellInput tradeId={trade.id} initialComments={trade.comments} onRefresh={onRefresh} />
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TableCell>
            <TableCell>
              <div className="space-x-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Ship className="mr-2 h-4 w-4" />
                      Schedule
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogTitle>Schedule Movement</DialogTitle>
                    <ScheduleMovementForm tradeLegId={trade.trade_leg_id} onSchedule={() => {
                      toast({
                        title: 'Movement Scheduled',
                        description: 'The movement has been scheduled successfully.',
                      });
                      handleCloseMovementDialog();
                      if (onRefresh) {
                        onRefresh();
                      }
                    }} />
                  </DialogContent>
                </Dialog>
                <Button size="sm" variant="secondary" onClick={() => handleOpenMovementDialog(trade.trade_leg_id)}>
                  <Loader2 className="mr-2 h-4 w-4" />
                  Movements
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={() => handleCloseTrade(trade.id)}
                  disabled={isClosingTrade}
                >
                  {isClosingTrade ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Closing...
                    </>
                  ) : (
                    'Close Trade'
                  )}
                </Button>
              </div>
            </TableCell>
          </>
        )}
        getRowAttributes={(item) => ({
          isZeroBalance: item.balance !== undefined && item.balance !== null && item.balance <= 0,
          'data-state': item.balance !== undefined && item.balance !== null && item.balance <= 0 ? 'completed' : 'in-process',
        })}
      />

      <TradeMovementsDialog 
        isOpen={isMovementDialogOpen}
        onClose={handleCloseMovementDialog}
        tradeLegId={selectedTradeLegId}
      />
    </>
  );
};

export default OpenTradesTable;
