
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useOpenTrades, OpenTrade } from '@/hooks/useOpenTrades';
import { formatDate } from '@/utils/dateUtils';
import { Loader2, Edit, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import FormulaCellDisplay from '@/components/trades/physical/FormulaCellDisplay';

interface OpenTradesTableProps {
  onRefresh?: () => void;
}

const OpenTradesTable: React.FC<OpenTradesTableProps> = ({ onRefresh }) => {
  const { openTrades, loading, error, refetchOpenTrades } = useOpenTrades();
  const [selectedTrade, setSelectedTrade] = useState<OpenTrade | null>(null);
  const [comments, setComments] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  const handleRefresh = () => {
    refetchOpenTrades();
    if (onRefresh) onRefresh();
  };

  const handleOpenCommentsDialog = (trade: OpenTrade) => {
    setSelectedTrade(trade);
    setComments(trade.comments || '');
  };

  const saveComments = async () => {
    if (!selectedTrade) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('open_trades')
        .update({ comments })
        .eq('id', selectedTrade.id);
      
      if (error) throw error;
      
      toast.success('Comments saved successfully');
      refetchOpenTrades();
    } catch (err: any) {
      toast.error('Failed to save comments', {
        description: err.message
      });
    } finally {
      setIsUpdating(false);
    }
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
            <TableHead>Trade Ref</TableHead>
            <TableHead>Buy/Sell</TableHead>
            <TableHead>Incoterm</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead>Sustainability</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Loading Start</TableHead>
            <TableHead>Loading End</TableHead>
            <TableHead>Counterparty</TableHead>
            <TableHead>Pricing Type</TableHead>
            <TableHead>Formula</TableHead>
            <TableHead className="text-center">Comments</TableHead>
            <TableHead>Customs Status</TableHead>
            <TableHead>Credit Status</TableHead>
            <TableHead>Contract Status</TableHead>
            <TableHead className="text-right">Nominated Value</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {openTrades.map((trade) => (
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
              <TableCell className="text-center">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleOpenCommentsDialog(trade)}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Comments for {trade.trade_reference}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <Textarea
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="Add your comments here..."
                        className="min-h-[120px] resize-none"
                        rows={6}
                      />
                      <div className="flex justify-end space-x-2 pt-2">
                        <DialogClose asChild>
                          <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <DialogClose asChild>
                          <Button onClick={saveComments} disabled={isUpdating} className="bg-brand-lime hover:bg-brand-lime/90 text-black">
                            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Save
                          </Button>
                        </DialogClose>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
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
