import { cn } from '@/lib/utils';
import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { OpenTrade } from '@/hooks/useOpenTrades';
import { formatDate } from '@/lib/formatters';
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
import { SortableTable } from '@/components/ui/sortable-table';
import { toast } from 'sonner';
import ProductToken from '@/components/operations/storage/ProductToken';
import PaginationNav from '@/components/ui/pagination-nav';
import { PaginationParams } from '@/types/pagination';
import { OpenTradeFilters, useFilteredOpenTrades } from '@/hooks/useFilteredOpenTrades';
import { DateSortColumn, SortConfig } from '@/hooks/useMovementDateSort';
import { DateSortHeader } from '@/components/operations/DateSortHeader';

interface OpenTradesTableProps {
  onRefresh?: () => void;
  filters?: OpenTradeFilters;
  paginationParams?: PaginationParams;
  onPageChange?: (page: number) => void;
  sortColumns?: SortConfig[];
  onSort?: (column: DateSortColumn) => void;
}

const OpenTradesTable: React.FC<OpenTradesTableProps> = ({ 
  onRefresh,
  filters = {},
  paginationParams,
  onPageChange,
  sortColumns = [],
  onSort
}) => {
  const { 
    openTrades,
    pagination, 
    loading, 
    error, 
    refetchOpenTrades,
    activeFilterCount,
    noResultsFound
  } = useFilteredOpenTrades(filters, paginationParams, sortColumns);
  
  const [localTrades, setLocalTrades] = React.useState<OpenTrade[]>([]);
  const [selectedTrade, setSelectedTrade] = React.useState<OpenTrade | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isCommentsDialogOpen, setIsCommentsDialogOpen] = React.useState(false);
  const [selectedTradeForComments, setSelectedTradeForComments] = React.useState<OpenTrade | null>(null);
  const [isMovementsDialogOpen, setIsMovementsDialogOpen] = React.useState(false);
  const [selectedTradeForMovements, setSelectedTradeForMovements] = React.useState<OpenTrade | null>(null);
  const queryClient = useQueryClient();
  const { toast: toastHook } = useToast();
  
  // Update local state when open trades change from the API
  React.useEffect(() => {
    if (openTrades?.length) {
      console.log('[OPEN_TRADES] Updating local trades state with', openTrades.length, 'items');
      // Trades already come sorted by sort_order from the API
      setLocalTrades(openTrades);
    }
  }, [openTrades]);
  
  const handleReorder = async (reorderedItems: OpenTrade[]) => {
    try {
      console.log('[OPEN_TRADES] Starting reorder operation');
      toast.info("Reordering trades", {
        description: "Saving new order to database..."
      });
      
      // Calculate base sort_order for the current page
      const pageOffset = paginationParams && paginationParams.page > 1 
        ? (paginationParams.page - 1) * (paginationParams.pageSize || 15) 
        : 0;

      // Update local state immediately for a responsive UI
      setLocalTrades(reorderedItems);

      // Get the moved item and its new index
      const updatedItems = reorderedItems.map((item, index) => ({
        id: item.id,
        sort_order: pageOffset + index + 1,
      }));

      console.log('[OPEN_TRADES] Prepared sort_order updates:', 
        updatedItems.slice(0, 3).map(i => `${i.id.slice(-4)}: ${i.sort_order}`).join(', '), '...');

      // Update each item's sort order in the database
      try {
        // Use Promise.all to execute all updates in parallel
        await Promise.all(
          updatedItems.map(item => 
            supabase.rpc('update_sort_order', {
              p_table_name: 'open_trades',
              p_id: item.id,
              p_new_sort_order: item.sort_order,
            })
          )
        );
        console.log('[OPEN_TRADES] All sort_order updates completed successfully');
        toast.success("Order updated", {
          description: "Trade order has been saved successfully"
        });
        queryClient.invalidateQueries({ queryKey: ['filteredOpenTrades'] });
      } catch (error) {
        console.error('[OPEN_TRADES] Error updating sort order:', error);
        toast.error("Reordering failed", {
          description: "There was an error saving the trade order"
        });
        // Revert to the original order
        refetchOpenTrades();
      }
    } catch (error) {
      console.error('[OPEN_TRADES] Reordering error:', error);
      toast.error("Reordering failed", {
        description: "There was an error saving the trade order"
      });
    }
  };
  
  const handleRefresh = () => {
    refetchOpenTrades();
    if (onRefresh) onRefresh();
  };

  const handleScheduleMovement = (trade: OpenTrade) => {
    setSelectedTrade(trade);
    setIsDialogOpen(true);
  };

  const handleMovementScheduled = () => {
    setIsDialogOpen(false);
    setSelectedTrade(null);
    handleRefresh();
  };

  const handleCommentsClick = (trade: OpenTrade) => {
    setSelectedTradeForComments(trade);
    setIsCommentsDialogOpen(true);
  };

  const handleViewMovements = (trade: OpenTrade) => {
    setSelectedTradeForMovements(trade);
    setIsMovementsDialogOpen(true);
  };

  const updateOpenTradeCommentsMutation = useMutation({
    mutationFn: async ({ id, comments }: { id: string, comments: string }) => {
      const { data, error } = await supabase
        .from('open_trades')
        .update({ comments })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filteredOpenTrades'] });
      setIsCommentsDialogOpen(false);
      setSelectedTradeForComments(null);
      toastHook({
        title: "Comments updated",
        description: "Trade comments have been updated successfully",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toastHook({
        title: "Failed to update comments",
        description: error.message || "An error occurred",
        variant: "destructive"
      });
    }
  });

  const handleCommentsUpdate = (comments: string) => {
    if (selectedTradeForComments) {
      updateOpenTradeCommentsMutation.mutate({ 
        id: selectedTradeForComments.id, 
        comments 
      });
    }
  };

  const isTradeDisabled = (trade: OpenTrade): boolean => {
    return trade.balance !== undefined && trade.balance !== null && trade.balance <= 0;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading open trades...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-destructive mb-4">Error loading open trades</p>
        <Button variant="outline" onClick={handleRefresh}>
          Try Again
        </Button>
      </div>
    );
  }

  if (noResultsFound || (localTrades.length === 0 && activeFilterCount > 0)) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground mb-4">
          No trades match the selected filters
        </p>
        <div className="flex justify-center space-x-4">
          <Button variant="outline" onClick={handleRefresh}>
            Refresh
          </Button>
          <Button variant="secondary" onClick={() => onPageChange && onPageChange(1)}>
            Clear Filters
          </Button>
        </div>
      </div>
    );
  }

  if (localTrades.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground mb-4">No open trades found</p>
        <Button variant="outline" onClick={handleRefresh}>
          Refresh
        </Button>
      </div>
    );
  }

  const renderHeader = () => (
    <>
      <TableHead>Trade Ref</TableHead>
      <TableHead>Buy/Sell</TableHead>
      <TableHead>Incoterm</TableHead>
      <TableHead className="text-right">Quantity</TableHead>
      <TableHead>Sustainability</TableHead>
      <TableHead>Product</TableHead>
      <TableHead>
        {onSort ? (
          <DateSortHeader
            column="loading_period_start"
            label="Loading Start"
            sortColumns={sortColumns || []}
            onSort={onSort}
          />
        ) : (
          "Loading Start"
        )}
      </TableHead>
      <TableHead>
        {onSort ? (
          <DateSortHeader
            column="loading_period_end"
            label="Loading End"
            sortColumns={sortColumns || []}
            onSort={onSort}
          />
        ) : (
          "Loading End"
        )}
      </TableHead>
      <TableHead>Counterparty</TableHead>
      <TableHead>Pricing Type</TableHead>
      <TableHead>Formula</TableHead>
      <TableHead>Comments</TableHead>
      <TableHead>Customs Status</TableHead>
      <TableHead>Credit Status</TableHead>
      <TableHead>Contract Status</TableHead>
      <TableHead className="text-right">Nominated Value</TableHead>
      <TableHead className="text-right">Balance</TableHead>
      <TableHead className="text-center">Actions</TableHead>
    </>
  );

  const renderRow = (trade: OpenTrade) => {
    const isZeroBalance = isTradeDisabled(trade);
    
    const rowClassName = cn(
      isZeroBalance && "opacity-50 text-muted-foreground bg-muted/50",
      "transition-all duration-200"
    );
    
    const displayReference = trade.trade_reference;
    
    const commentPreview = trade.comments 
      ? (trade.comments.length > 15 
          ? `${trade.comments.substring(0, 15)}...` 
          : trade.comments)
      : '';
    
    return (
      <>
        <TableCell className={cn(isZeroBalance && "text-muted-foreground")}>
          <span className="font-medium">
            {displayReference}
          </span>
        </TableCell>
        <TableCell className={cn(isZeroBalance && "text-muted-foreground")}>
          <Badge 
            variant={trade.buy_sell === 'buy' ? "default" : "outline"}
            className={isZeroBalance ? "opacity-70" : ""}
          >
            {trade.buy_sell}
          </Badge>
        </TableCell>
        <TableCell className={cn(isZeroBalance && "text-muted-foreground")}>{trade.inco_term}</TableCell>
        <TableCell className={cn(
          "text-right",
          isZeroBalance && "text-muted-foreground"
        )}>{trade.quantity} {trade.unit || 'MT'}</TableCell>
        <TableCell className={cn(isZeroBalance && "text-muted-foreground")}>{trade.sustainability || 'N/A'}</TableCell>
        <TableCell className={cn(isZeroBalance && "text-muted-foreground")}>
          <ProductToken 
            product={trade.product}
            value={trade.product}
            showTooltip={true}
          />
        </TableCell>
        <TableCell className={cn(isZeroBalance && "text-muted-foreground")}>{trade.loading_period_start ? formatDate(trade.loading_period_start) : 'N/A'}</TableCell>
        <TableCell className={cn(isZeroBalance && "text-muted-foreground")}>{trade.loading_period_end ? formatDate(trade.loading_period_end) : 'N/A'}</TableCell>
        <TableCell className={cn(isZeroBalance && "text-muted-foreground")}>{trade.counterparty}</TableCell>
        <TableCell className={cn(isZeroBalance && "text-muted-foreground")}>
          <Badge variant="outline">
            {trade.pricing_type === 'efp' ? 'EFP' : 'Standard'}
          </Badge>
        </TableCell>
        <TableCell className={cn(isZeroBalance && "text-muted-foreground")}>
          <FormulaCellDisplay
            tradeId={trade.parent_trade_id}
            legId={trade.trade_leg_id}
            formula={trade.pricing_formula}
            pricingType={trade.pricing_type}
            efpPremium={trade.efp_premium}
            efpDesignatedMonth={trade.efp_designated_month}
            efpAgreedStatus={trade.efp_agreed_status}
            efpFixedValue={trade.efp_fixed_value}
          />
        </TableCell>
        <TableCell className={cn(isZeroBalance && "text-muted-foreground")}>
          <div 
            className={cn(
              "flex items-center gap-1 cursor-pointer",
              isZeroBalance ? "text-muted-foreground" : "hover:text-primary"
            )}
            onClick={() => !isZeroBalance && handleCommentsClick(trade)}
          >
            <MessageSquare className="h-4 w-4" />
            {trade.comments && (
              <span className="text-xs text-muted-foreground">{commentPreview}</span>
            )}
          </div>
        </TableCell>
        <TableCell className={cn(isZeroBalance && "text-muted-foreground")}>
          {trade.customs_status && (
            <Badge variant={
              trade.customs_status === 'approved' ? "default" :
              trade.customs_status === 'rejected' ? "destructive" :
              "outline"
            }>
              {trade.customs_status}
            </Badge>
          )}
        </TableCell>
        <TableCell className={cn(isZeroBalance && "text-muted-foreground")}>
          {trade.credit_status && (
            <Badge variant={
              trade.credit_status === 'approved' ? "default" :
              trade.credit_status === 'rejected' ? "destructive" :
              "outline"
            }>
              {trade.credit_status}
            </Badge>
          )}
        </TableCell>
        <TableCell className={cn(isZeroBalance && "text-muted-foreground")}>
          {trade.contract_status && (
            <Badge variant={
              trade.contract_status === 'signed' ? "default" :
              trade.contract_status === 'cancelled' ? "destructive" :
              "outline"
            }>
              {trade.contract_status}
            </Badge>
          )}
        </TableCell>
        <TableCell className={cn(
          "text-right", 
          isZeroBalance && "text-muted-foreground"
        )}>{trade.nominated_value?.toLocaleString() || '0'} MT</TableCell>
        <TableCell className={cn(
          "text-right", 
          isZeroBalance && "text-muted-foreground"
        )}>
          {trade.balance?.toLocaleString() || trade.quantity?.toLocaleString()} MT
        </TableCell>
        <TableCell className="text-center">
          <div className="flex justify-center space-x-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => handleViewMovements(trade)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View Movements</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Dialog 
                    open={isDialogOpen && selectedTrade?.id === trade.id} 
                    onOpenChange={setIsDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        disabled={isZeroBalance}
                        onClick={() => handleScheduleMovement(trade)}
                      >
                        <Ship className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    {selectedTrade && (
                      <ScheduleMovementForm 
                        trade={selectedTrade} 
                        onSuccess={handleMovementScheduled}
                        onCancel={() => setIsDialogOpen(false)}
                      />
                    )}
                  </Dialog>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Schedule Movement</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </TableCell>
      </>
    );
  };

  return (
    <>
      <ScrollArea className="w-full" orientation="horizontal">
        <div className="w-full min-w-[1800px]">
          <SortableTable
            items={localTrades}
            onReorder={handleReorder}
            renderHeader={renderHeader}
            renderRow={renderRow}
            isItemDisabled={isTradeDisabled}
            disabledRowClassName="opacity-50 text-muted-foreground bg-muted/50"
          />
        </div>
      </ScrollArea>

      {/* Pagination Controls */}
      {pagination && onPageChange && (
        <div className="flex items-center justify-between py-4">
          <div className="text-sm text-muted-foreground">
            Showing page {pagination.currentPage} of {pagination.totalPages}
            {pagination.totalItems > 0 && (
              <span> ({pagination.totalItems} total trades)</span>
            )}
          </div>
          <PaginationNav 
            pagination={pagination}
            onPageChange={onPageChange}
          />
        </div>
      )}

      <Dialog open={isCommentsDialogOpen} onOpenChange={setIsCommentsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle>
            Comments for Trade {selectedTradeForComments?.trade_reference}
          </DialogTitle>
          <div className="space-y-2 py-4">
            {selectedTradeForComments && (
              <CommentsCellInput
                tradeId={selectedTradeForComments.id}
                initialValue={selectedTradeForComments.comments || ''}
                onSave={handleCommentsUpdate}
                showButtons={true}
                onCancel={() => setIsCommentsDialogOpen(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isMovementsDialogOpen} onOpenChange={setIsMovementsDialogOpen}>
        {selectedTradeForMovements && (
          <TradeMovementsDialog 
            tradeLegId={selectedTradeForMovements.trade_leg_id}
            tradeReference={selectedTradeForMovements.trade_reference}
          />
        )}
      </Dialog>
    </>
  );
};

export default OpenTradesTable;
