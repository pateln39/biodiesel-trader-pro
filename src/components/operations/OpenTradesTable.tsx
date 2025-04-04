import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useOpenTrades, OpenTrade } from '@/hooks/useOpenTrades';
import { formatDate } from '@/utils/dateUtils';
import { Loader2, Edit, Truck, ArrowUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import FormulaCellDisplay from '@/components/trades/physical/FormulaCellDisplay';
import CommentsCellInput from '@/components/trades/physical/CommentsCellInput';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

interface OpenTradesTableProps {
  onRefresh?: () => void;
}

const OpenTradesTable: React.FC<OpenTradesTableProps> = ({ onRefresh }) => {
  const { openTrades, loading, error, refetchOpenTrades } = useOpenTrades();
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const handleRefresh = () => {
    refetchOpenTrades();
    if (onRefresh) onRefresh();
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
      
      // Handle different data types
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

  const createMovement = async (trade: OpenTrade) => {
    try {
      // Generate a simple movement reference using the trade reference plus a timestamp
      const movementReference = `${trade.trade_reference}-M${Date.now().toString().slice(-6)}`;
      
      // Insert a new movement record based on the trade data
      const { data, error } = await supabase
        .from('movements')
        .insert({
          trade_leg_id: trade.trade_leg_id,
          parent_trade_id: trade.parent_trade_id,
          vessel_name: trade.vessel_name,
          loadport: trade.loadport,
          disport: trade.disport,
          trade_reference: trade.trade_reference,
          counterparty: trade.counterparty,
          buy_sell: trade.buy_sell,
          product: trade.product,
          sustainability: trade.sustainability,
          inco_term: trade.inco_term,
          quantity: trade.quantity,
          tolerance: trade.tolerance,
          loading_period_start: trade.loading_period_start,
          loading_period_end: trade.loading_period_end,
          pricing_type: trade.pricing_type,
          pricing_formula: trade.pricing_formula,
          unit: trade.unit,
          comments: trade.comments,
          movement_reference: movementReference,
          nominated_date: new Date().toISOString().split('T')[0],
          status: 'pending',
          bl_quantity: null,
          actualized: false,
          actualized_date: null,
          actualized_quantity: null,
          bl_date: null,
          cash_flow_date: null
        })
        .select();
      
      if (error) {
        console.error('Error creating movement:', error);
        toast.error("Failed to create movement");
        return;
      }
      
      toast.success("Movement created successfully");
      // Refresh data if needed
      handleRefresh();
    } catch (err) {
      console.error('Error in createMovement:', err);
      toast.error("An unexpected error occurred");
    }
  };

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
          {sortedTrades.map((trade) => (
            <TableRow key={trade.id} className="border-b border-white/5 hover:bg-brand-navy/80">
              <TableCell>
                <Link to={`/trades/${trade.parent_trade_id}`} className="hover:underline">
                  {trade.trade_reference}
                </Link>
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
                <CommentsCellInput
                  tradeId={trade.parent_trade_id}
                  legId={trade.trade_leg_id}
                  initialValue={trade.comments || ''}
                />
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
                    trade.contract_status === 'sent' ? "default" :
                    trade.contract_status === 'action needed' ? "destructive" :
                    "outline"
                  }>
                    {trade.contract_status}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">{trade.nominated_value || '-'}</TableCell>
              <TableCell className="text-right">{trade.balance || '-'}</TableCell>
              <TableCell className="text-center">
                <div className="flex justify-center space-x-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/trades/${trade.parent_trade_id}`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View/Edit Trade</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => createMovement(trade)}
                        >
                          <Truck className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Create Movement</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default OpenTradesTable;
