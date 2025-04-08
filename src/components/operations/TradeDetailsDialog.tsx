import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { PhysicalTrade, PhysicalTradeLeg } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import TradeMovementsDialog from './TradeMovementsDialog';

interface TradeDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tradeId?: string;
  legId?: string;
}

const TradeDetailsDialog: React.FC<TradeDetailsDialogProps> = ({
  open,
  onOpenChange,
  tradeId,
  legId
}) => {
  const [activeTab, setActiveTab] = React.useState("details");
  const [movementsDialogOpen, setMovementsDialogOpen] = React.useState(false);

  const { data: trade, isLoading, error } = useQuery({
    queryKey: ['tradeDetails', tradeId],
    queryFn: async () => {
      if (!tradeId) return null;

      const { data: parentTrade, error: parentError } = await supabase
        .from('parent_trades')
        .select('*')
        .eq('id', tradeId)
        .single();

      if (parentError) throw parentError;

      if (parentTrade?.trade_type === 'physical') {
        const { data: legs, error: legsError } = await supabase
          .from('trade_legs')
          .select('*')
          .eq('parent_trade_id', tradeId);

        if (legsError) throw legsError;

        const selectedLeg = legId 
          ? legs.find(leg => leg.id === legId)
          : legs[0];

        return {
          ...parentTrade,
          legs: legs.map(leg => ({
            id: leg.id,
            parentTradeId: leg.parent_trade_id,
            legReference: leg.leg_reference,
            buySell: leg.buy_sell,
            product: leg.product,
            sustainability: leg.sustainability,
            incoTerm: leg.inco_term,
            quantity: leg.quantity,
            tolerance: leg.tolerance,
            loadingPeriodStart: leg.loading_period_start ? new Date(leg.loading_period_start) : undefined,
            loadingPeriodEnd: leg.loading_period_end ? new Date(leg.loading_period_end) : undefined,
            pricingPeriodStart: leg.pricing_period_start ? new Date(leg.pricing_period_start) : undefined,
            pricingPeriodEnd: leg.pricing_period_end ? new Date(leg.pricing_period_end) : undefined,
            unit: leg.unit,
            paymentTerm: leg.payment_term,
            creditStatus: leg.credit_status,
            customsStatus: leg.customs_status,
            formula: leg.pricing_formula,
            mtmFormula: leg.mtm_formula,
            pricingType: leg.pricing_type,
            efpPremium: leg.efp_premium,
            efpAgreedStatus: leg.efp_agreed_status,
            efpFixedValue: leg.efp_fixed_value,
            efpDesignatedMonth: leg.efp_designated_month,
            mtmFutureMonth: leg.mtm_future_month,
            comments: leg.comments,
            contractStatus: leg.contract_status,
          })),
          selectedLeg: selectedLeg ? {
            id: selectedLeg.id,
            parentTradeId: selectedLeg.parent_trade_id,
            legReference: selectedLeg.leg_reference,
            buySell: selectedLeg.buy_sell,
            product: selectedLeg.product,
            sustainability: selectedLeg.sustainability,
            incoTerm: selectedLeg.inco_term,
            quantity: selectedLeg.quantity,
            tolerance: selectedLeg.tolerance,
            loadingPeriodStart: selectedLeg.loading_period_start ? new Date(selectedLeg.loading_period_start) : undefined,
            loadingPeriodEnd: selectedLeg.loading_period_end ? new Date(selectedLeg.loading_period_end) : undefined,
            pricingPeriodStart: selectedLeg.pricing_period_start ? new Date(selectedLeg.pricing_period_start) : undefined,
            pricingPeriodEnd: selectedLeg.pricing_period_end ? new Date(selectedLeg.pricing_period_end) : undefined,
            unit: selectedLeg.unit,
            paymentTerm: selectedLeg.payment_term,
            creditStatus: selectedLeg.credit_status,
            customsStatus: selectedLeg.customs_status,
            formula: selectedLeg.pricing_formula,
            mtmFormula: selectedLeg.mtm_formula,
            pricingType: selectedLeg.pricing_type,
            efpPremium: selectedLeg.efp_premium,
            efpAgreedStatus: selectedLeg.efp_agreed_status,
            efpFixedValue: selectedLeg.efp_fixed_value,
            efpDesignatedMonth: selectedLeg.efp_designated_month,
            mtmFutureMonth: selectedLeg.mtm_future_month,
            comments: selectedLeg.comments,
            contractStatus: selectedLeg.contract_status,
          } : undefined
        };
      }

      return null;
    },
    enabled: open && !!tradeId,
  });

  const getEfpFormulaDisplay = (item: PhysicalTrade | PhysicalTradeLeg) => {
    if ('pricingType' in item && item.pricingType !== 'efp') return null;
    
    if ('efpAgreedStatus' in item && item.efpAgreedStatus) {
      return '';
    } else {
      const efpPremium = 'efpPremium' in item ? item.efpPremium || 0 : 0;
      return `ICE GASOIL FUTURES (EFP) + ${efpPremium}`;
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trade Details</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !trade) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trade Details</DialogTitle>
          </DialogHeader>
          <div className="text-center p-4">
            <p className="text-destructive">Error loading trade details</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const selectedLeg = trade.selectedLeg;

  if (!selectedLeg) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trade Details</DialogTitle>
          </DialogHeader>
          <div className="text-center p-4">
            <p className="text-muted-foreground">No leg details available</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[80vw]">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Trade Details: {trade.trade_reference}
              {selectedLeg.legReference && ` - Leg ${selectedLeg.legReference.split('-').pop()}`}
            </DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid grid-cols-3 w-[400px]">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="formula">Pricing Formula</TabsTrigger>
              <TabsTrigger value="movements" onClick={() => setMovementsDialogOpen(true)}>Movements</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="mt-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Trade Information</h3>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium w-1/3">Trade Reference</TableCell>
                        <TableCell>{trade.trade_reference}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Leg Reference</TableCell>
                        <TableCell>{selectedLeg.legReference}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Counterparty</TableCell>
                        <TableCell>{trade.counterparty}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Buy/Sell</TableCell>
                        <TableCell className="capitalize">{selectedLeg.buySell}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Product</TableCell>
                        <TableCell>{selectedLeg.product}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Sustainability</TableCell>
                        <TableCell>{selectedLeg.sustainability || '-'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Quantity</TableCell>
                        <TableCell>{selectedLeg.quantity?.toLocaleString()} MT</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Incoterm</TableCell>
                        <TableCell>{selectedLeg.incoTerm || '-'}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Dates and Status</h3>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium w-1/3">Loading Period</TableCell>
                        <TableCell>
                          {selectedLeg.loadingPeriodStart && selectedLeg.loadingPeriodEnd
                            ? `${format(selectedLeg.loadingPeriodStart, 'dd MMM yyyy')} - ${format(selectedLeg.loadingPeriodEnd, 'dd MMM yyyy')}`
                            : '-'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Pricing Period</TableCell>
                        <TableCell>
                          {selectedLeg.pricingPeriodStart && selectedLeg.pricingPeriodEnd
                            ? `${format(selectedLeg.pricingPeriodStart, 'dd MMM yyyy')} - ${format(selectedLeg.pricingPeriodEnd, 'dd MMM yyyy')}`
                            : '-'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Credit Status</TableCell>
                        <TableCell className="capitalize">{selectedLeg.creditStatus || '-'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Contract Status</TableCell>
                        <TableCell className="capitalize">{selectedLeg.contractStatus || '-'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Customs Status</TableCell>
                        <TableCell className="capitalize">{selectedLeg.customsStatus || '-'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Comments</TableCell>
                        <TableCell>{selectedLeg.comments || '-'}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="formula">
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-4">Pricing Formula</h3>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium w-1/4">Pricing Type</TableCell>
                      <TableCell className="capitalize">{selectedLeg.pricingType || 'Standard'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Formula</TableCell>
                      <TableCell>
                        {selectedLeg.pricingType === 'efp' 
                          ? getEfpFormulaDisplay(selectedLeg) 
                          : (selectedLeg.formula ? JSON.stringify(selectedLeg.formula) : '-')}
                      </TableCell>
                    </TableRow>
                    {selectedLeg.pricingType === 'efp' && (
                      <>
                        <TableRow>
                          <TableCell className="font-medium">EFP Status</TableCell>
                          <TableCell>{selectedLeg.efpAgreedStatus ? 'Agreed' : 'Not Agreed'}</TableCell>
                        </TableRow>
                        {selectedLeg.efpAgreedStatus && (
                          <TableRow>
                            <TableCell className="font-medium">EFP Fixed Value</TableCell>
                            <TableCell>{selectedLeg.efpFixedValue || '-'}</TableCell>
                          </TableRow>
                        )}
                        <TableRow>
                          <TableCell className="font-medium">EFP Premium</TableCell>
                          <TableCell>{selectedLeg.efpPremium || '-'}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Designated Month</TableCell>
                          <TableCell>{selectedLeg.efpDesignatedMonth || '-'}</TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      
      {movementsDialogOpen && selectedLeg && (
        <TradeMovementsDialog
          tradeLegId={selectedLeg.id}
          tradeReference={trade.trade_reference}
        />
      )}
    </>
  );
};

export default TradeDetailsDialog;
