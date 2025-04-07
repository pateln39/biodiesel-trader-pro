
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useOpenTrades, OpenTrade } from '@/hooks/useOpenTrades';
import { formatDate } from '@/utils/dateUtils';
import { formatLegReference } from '@/utils/tradeUtils';
import { Loader2, ArrowUpDown, Ship, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import FormulaCellDisplay from '@/components/trades/physical/FormulaCellDisplay';
import CommentsCellInput from '@/components/trades/physical/CommentsCellInput';
import ScheduleMovementForm from '@/components/operations/ScheduleMovementForm';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { toast } from "sonner";
import { ContractStatus } from '@/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface OpenTradesTableProps {
  onRefresh?: () => void;
}

const OpenTradesTable: React.FC<OpenTradesTableProps> = ({ onRefresh }) => {
  const { openTrades, loading, error, refetchOpenTrades } = useOpenTrades();
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedTrade, setSelectedTrade] = useState<OpenTrade | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
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
    toast.success("Movement scheduled successfully");
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedTrades = React.useMemo(() => {
    if (!sortField) return openTrades;
    
    return [...openTrades].sort((a, b) => {
      const valueA = a[sortField as keyof OpenTrade];
      const valueB = b[sortField as keyof OpenTrade];
      
      if (valueA === valueB) return 0;
      if (valueA === null || valueA === undefined) return 1;
      if (valueB === null || valueB === undefined) return -1;
      
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortDirection === 'asc' 
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }
      
      if (valueA instanceof Date && valueB instanceof Date) {
        return sortDirection === 'asc' 
          ? valueA.getTime() - valueB.getTime()
          : valueB.getTime() - valueA.getTime();
      }
      
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
      }
      
      return 0;
    });
  }, [openTrades, sortField, sortDirection]);

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    return sortDirection === 'asc' 
      ? <ArrowUpDown className="h-4 w-4 ml-1 text-primary" /> 
      : <ArrowUpDown className="h-4 w-4 ml-1 text-primary rotate-180" />;
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

  if (openTrades.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground mb-4">No open trades found</p>
        <Button variant="outline" onClick={handleRefresh}>
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="data-table-container">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-white/10">
              <TableHead className="cursor-pointer" onClick={() => handleSort('trade_reference')}>
                <div className="flex items-center">
                  Trade Ref
                  <SortIcon field="trade_reference" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('buy_sell')}>
                <div className="flex items-center">
                  Buy/Sell
                  <SortIcon field="buy_sell" />
                </div>
              </TableHead>
              <TableHead>Incoterm</TableHead>
              <TableHead className="text-right cursor-pointer" onClick={() => handleSort('quantity')}>
                <div className="flex items-center justify-end">
                  Quantity
                  <SortIcon field="quantity" />
                </div>
              </TableHead>
              <TableHead>Sustainability</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('product')}>
                <div className="flex items-center">
                  Product
                  <SortIcon field="product" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('loading_period_start')}>
                <div className="flex items-center">
                  Loading Start
                  <SortIcon field="loading_period_start" />
                </div>
              </TableHead>
              <TableHead>Loading End</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('counterparty')}>
                <div className="flex items-center">
                  Counterparty
                  <SortIcon field="counterparty" />
                </div>
              </TableHead>
              <TableHead>Pricing Type</TableHead>
              <TableHead>Formula</TableHead>
              <TableHead>Comments</TableHead>
              <TableHead>Customs Status</TableHead>
              <TableHead>Credit Status</TableHead>
              <TableHead>Contract Status</TableHead>
              <TableHead className="text-right">Nominated Value</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTrades.map((trade) => {
              // Updated to handle null/undefined balance values
              const isZeroBalance = trade.balance !== undefined && trade.balance !== null && trade.balance <= 0;
              
              // Generate proper leg reference display
              const displayReference = trade.trade_leg_id ? 
                formatLegReference(trade.trade_reference, trade.leg_reference || '') : 
                trade.trade_reference;
              
              return (
                <TableRow 
                  key={trade.id} 
                  className={`border-b border-white/5 hover:bg-brand-navy/80 ${isZeroBalance ? 'opacity-50' : ''}`}
                >
                  <TableCell>
                    {/* Just showing the reference without a link */}
                    <span className="font-medium">
                      {displayReference}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={trade.buy_sell === 'buy' ? "default" : "outline"}>
                      {trade.buy_sell}
                    </Badge>
                  </TableCell>
                  <TableCell>{trade.inco_term}</TableCell>
                  <TableCell className="text-right">{trade.quantity} {trade.unit || 'MT'}</TableCell>
                  <TableCell>{trade.sustainability || 'N/A'}</TableCell>
                  <TableCell>{trade.product}</TableCell>
                  <TableCell>{trade.loading_period_start ? formatDate(trade.loading_period_start) : 'N/A'}</TableCell>
                  <TableCell>{trade.loading_period_end ? formatDate(trade.loading_period_end) : 'N/A'}</TableCell>
                  <TableCell>{trade.counterparty}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {trade.pricing_type === 'efp' ? 'EFP' : 'Standard'}
                    </Badge>
                  </TableCell>
                  <TableCell>
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
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                {trade.comments && (
                                  <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-blue-500"></span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0">
                              <div className="p-4 pt-2">
                                <p className="text-sm font-medium mb-2">Comments</p>
                                <CommentsCellInput
                                  tradeId={trade.parent_trade_id}
                                  legId={trade.trade_leg_id}
                                  initialValue={trade.comments || ''}
                                />
                              </div>
                            </PopoverContent>
                          </Popover>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Add or view comments</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
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
                  <TableCell>
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
                  <TableCell>
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
                  <TableCell className="text-right">{trade.nominated_value?.toLocaleString() || '0'} MT</TableCell>
                  <TableCell className="text-right">{trade.balance?.toLocaleString() || trade.quantity?.toLocaleString()} MT</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center space-x-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Dialog open={isDialogOpen && selectedTrade?.id === trade.id} onOpenChange={setIsDialogOpen}>
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
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
};

export default OpenTradesTable;
