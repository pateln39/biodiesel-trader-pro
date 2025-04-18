
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { File } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { PhysicalTrade, PhysicalTradeLeg, BuySell, Product, IncoTerm, Unit, PaymentTerm, CreditStatus, CustomsStatus, PricingType, ContractStatus } from '@/types/physical';
import { validateAndParsePricingFormula } from '@/utils/formulaUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import TableLoadingState from '@/components/trades/TableLoadingState';
import TableErrorState from '@/components/trades/TableErrorState';

interface TradeDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tradeId?: string;
  legId?: string;
  tradeReference?: string;
}

const TradeDetailsDialog: React.FC<TradeDetailsDialogProps> = ({
  open,
  onOpenChange,
  tradeId,
  legId,
  tradeReference
}) => {
  const [activeTab, setActiveTab] = useState('details');

  const { data: trade, isLoading, error, refetch } = useQuery({
    queryKey: ['tradeDetails', tradeId, legId],
    queryFn: async () => {
      if (!tradeId) return null;

      // Fetch parent trade data
      const { data: parentTrade, error: parentError } = await supabase
        .from('parent_trades')
        .select('*')
        .eq('id', tradeId)
        .single();

      if (parentError) throw new Error(`Error fetching parent trade: ${parentError.message}`);
      if (!parentTrade) return null;

      // Fetch all legs for this trade
      const { data: tradeLegs, error: legsError } = await supabase
        .from('trade_legs')
        .select('*')
        .eq('parent_trade_id', tradeId);

      if (legsError) throw new Error(`Error fetching trade legs: ${legsError.message}`);

      // Find the first leg or the specific leg if legId is provided
      const selectedLeg = legId 
        ? tradeLegs.find(leg => leg.id === legId)
        : tradeLegs[0];

      if (!selectedLeg) throw new Error('No trade leg found');

      // Map the data to our PhysicalTrade type
      const mappedTrade: PhysicalTrade = {
        id: parentTrade.id,
        tradeReference: parentTrade.trade_reference,
        tradeType: 'physical',
        createdAt: new Date(parentTrade.created_at),
        updatedAt: new Date(parentTrade.updated_at),
        physicalType: (parentTrade.physical_type || 'spot') as 'spot' | 'term',
        counterparty: parentTrade.counterparty,
        // Add the required properties from the selected leg
        buySell: selectedLeg.buy_sell as BuySell,
        product: selectedLeg.product as Product,
        sustainability: selectedLeg.sustainability || '',
        incoTerm: selectedLeg.inco_term as IncoTerm,
        quantity: selectedLeg.quantity,
        tolerance: selectedLeg.tolerance || 0,
        loadingPeriodStart: selectedLeg.loading_period_start ? new Date(selectedLeg.loading_period_start) : new Date(),
        loadingPeriodEnd: selectedLeg.loading_period_end ? new Date(selectedLeg.loading_period_end) : new Date(),
        pricingPeriodStart: selectedLeg.pricing_period_start ? new Date(selectedLeg.pricing_period_start) : new Date(),
        pricingPeriodEnd: selectedLeg.pricing_period_end ? new Date(selectedLeg.pricing_period_end) : new Date(),
        unit: selectedLeg.unit as Unit,
        paymentTerm: selectedLeg.payment_term as PaymentTerm,
        creditStatus: selectedLeg.credit_status as CreditStatus,
        customsStatus: selectedLeg.customs_status as CustomsStatus,
        formula: validateAndParsePricingFormula(selectedLeg.pricing_formula),
        mtmFormula: validateAndParsePricingFormula(selectedLeg.mtm_formula),
        pricingType: selectedLeg.pricing_type as PricingType,
        efpPremium: selectedLeg.efp_premium,
        efpAgreedStatus: selectedLeg.efp_agreed_status,
        efpFixedValue: selectedLeg.efp_fixed_value,
        efpDesignatedMonth: selectedLeg.efp_designated_month,
        mtmFutureMonth: selectedLeg.mtm_future_month,
        comments: selectedLeg.comments,
        contractStatus: selectedLeg.contract_status as ContractStatus,
        // Map all legs
        legs: tradeLegs.map(leg => ({
          id: leg.id,
          parentTradeId: leg.parent_trade_id,
          legReference: leg.leg_reference,
          buySell: leg.buy_sell as BuySell,
          product: leg.product as Product,
          sustainability: leg.sustainability || '',
          incoTerm: leg.inco_term as IncoTerm,
          quantity: leg.quantity,
          tolerance: leg.tolerance || 0,
          loadingPeriodStart: leg.loading_period_start ? new Date(leg.loading_period_start) : new Date(),
          loadingPeriodEnd: leg.loading_period_end ? new Date(leg.loading_period_end) : new Date(),
          pricingPeriodStart: leg.pricing_period_start ? new Date(leg.pricing_period_start) : new Date(),
          pricingPeriodEnd: leg.pricing_period_end ? new Date(leg.pricing_period_end) : new Date(),
          unit: leg.unit as Unit,
          paymentTerm: leg.payment_term as PaymentTerm,
          creditStatus: leg.credit_status as CreditStatus,
          customsStatus: leg.customs_status as CustomsStatus,
          formula: validateAndParsePricingFormula(leg.pricing_formula),
          mtmFormula: validateAndParsePricingFormula(leg.mtm_formula),
          pricingType: leg.pricing_type as PricingType,
          efpPremium: leg.efp_premium,
          efpAgreedStatus: leg.efp_agreed_status,
          efpFixedValue: leg.efp_fixed_value,
          efpDesignatedMonth: leg.efp_designated_month,
          mtmFutureMonth: leg.mtm_future_month,
          comments: leg.comments,
          contractStatus: leg.contract_status as ContractStatus
        }))
      };

      return mappedTrade;
    },
    enabled: open && !!tradeId,
    refetchOnWindowFocus: false,
  });

  // Reset active tab when dialog opens
  useEffect(() => {
    if (open) {
      setActiveTab('details');
    }
  }, [open]);

  const formatFormula = (formula: any) => {
    if (!formula || !formula.tokens) return 'No formula defined';
    
    return formula.tokens.map((token: any) => {
      if (token.type === 'instrument') return token.value;
      if (token.type === 'fixedValue') return token.value;
      if (token.type === 'operator') return ` ${token.value} `;
      if (token.type === 'percentage') return `${token.value}%`;
      return token.value;
    }).join('');
  };

  // Modified to accept either a PhysicalTrade or PhysicalTradeLeg
  const getEfpFormulaDisplay = (item: PhysicalTrade | PhysicalTradeLeg) => {
    if (item.pricingType !== 'efp') return null;
    
    if (item.efpAgreedStatus) {
      // For agreed EFP, return an empty string
      return '';
    } else {
      // For unagreed EFP, show "ICE GASOIL FUTURES (EFP) + premium"
      const efpPremium = item.efpPremium || 0;
      return `ICE GASOIL FUTURES (EFP) + ${efpPremium}`;
    }
  };

  if (!open) return null;

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loading Trade Details...</DialogTitle>
          </DialogHeader>
          <TableLoadingState />
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Error Loading Trade Details</DialogTitle>
          </DialogHeader>
          <TableErrorState error={error as Error} onRetry={refetch} />
        </DialogContent>
      </Dialog>
    );
  }

  if (!trade) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Trade Not Found</DialogTitle>
          </DialogHeader>
          <p className="text-center py-8 text-muted-foreground">
            The requested trade could not be found. It may have been deleted.
          </p>
        </DialogContent>
      </Dialog>
    );
  }

  // For spot trades, only show main details
  if (trade.physicalType === 'spot') {
    const efpFormulaDisplay = trade.pricingType === 'efp' ? getEfpFormulaDisplay(trade) : null;

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <File className="h-5 w-5" />
              Spot Trade Details: {trade.tradeReference}
            </DialogTitle>
          </DialogHeader>

          <Card>
            <CardHeader>
              <CardTitle>Trade Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Reference</p>
                  <p>{trade.tradeReference}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                  <p>{trade.physicalType}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Buy/Sell</p>
                  <Badge variant={trade.buySell === 'buy' ? "default" : "outline"}>
                    {trade.buySell}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Counterparty</p>
                  <p>{trade.counterparty}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Product</p>
                  <p>{trade.product}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Sustainability</p>
                  <p>{trade.sustainability || 'N/A'}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Quantity</p>
                  <p>{trade.quantity?.toLocaleString()} {trade.unit}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Tolerance</p>
                  <p>{trade.tolerance}%</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Incoterm</p>
                  <p>{trade.incoTerm}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Loading Period</p>
                  <p>
                    {format(trade.loadingPeriodStart, 'dd MMM yyyy')} - {format(trade.loadingPeriodEnd, 'dd MMM yyyy')}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Pricing Period</p>
                  <p>
                    {format(trade.pricingPeriodStart, 'dd MMM yyyy')} - {format(trade.pricingPeriodEnd, 'dd MMM yyyy')}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Payment Term</p>
                  <p>{trade.paymentTerm}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Credit Status</p>
                  <Badge variant={
                    trade.creditStatus === 'approved' ? "default" :
                    trade.creditStatus === 'rejected' ? "destructive" :
                    "outline"
                  }>
                    {trade.creditStatus || 'pending'}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Customs Status</p>
                  <Badge variant={
                    trade.customsStatus === 'approved' ? "default" :
                    trade.customsStatus === 'rejected' ? "destructive" :
                    "outline"
                  }>
                    {trade.customsStatus || 'pending'}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Pricing Information</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Pricing Type</p>
                    <p>{trade.pricingType === 'efp' ? 'EFP' : 'Standard'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Formula</p>
                    <div className="p-2 bg-muted rounded-md">
                      {trade.pricingType === 'efp' 
                        ? (efpFormulaDisplay || 'No formula required')
                        : formatFormula(trade.formula)}
                    </div>
                  </div>
                  {trade.pricingType === 'efp' && (
                    <>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">EFP Premium</p>
                        <p>{trade.efpPremium}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">EFP Agreed</p>
                        <p>{trade.efpAgreedStatus ? 'Yes' : 'No'}</p>
                      </div>
                      {trade.efpFixedValue && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">EFP Fixed Value</p>
                          <p>{trade.efpFixedValue}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {trade.comments && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Comments</p>
                    <p className="p-2 bg-muted rounded-md">{trade.comments}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    );
  }

  // For term trades, show tabs for each leg with full details
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <File className="h-5 w-5" />
            Term Trade Details: {trade.tradeReference}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-auto-fit gap-2">
            <TabsTrigger value="details">Main Details</TabsTrigger>
            {trade.legs.map((leg, index) => (
              <TabsTrigger key={leg.id} value={leg.id}>
                Leg {index + 1}: {leg.legReference}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Trade Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Reference</p>
                    <p>{trade.tradeReference}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Type</p>
                    <p>{trade.physicalType}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Counterparty</p>
                    <p>{trade.counterparty}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Legs Summary</p>
                    <div className="grid grid-cols-3 gap-2 text-sm font-medium text-muted-foreground">
                      <div>Leg Reference</div>
                      <div>Buy/Sell</div>
                      <div>Quantity</div>
                    </div>
                    {trade.legs.map((leg) => (
                      <div key={leg.id} className="grid grid-cols-3 gap-2">
                        <div>{leg.legReference}</div>
                        <div>
                          <Badge variant={leg.buySell === 'buy' ? "default" : "outline"}>
                            {leg.buySell}
                          </Badge>
                        </div>
                        <div>{leg.quantity?.toLocaleString()} {leg.unit}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {trade.legs.map((leg) => {
            const efpFormulaDisplay = leg.pricingType === 'efp' ? getEfpFormulaDisplay(leg) : null;
            
            return (
              <TabsContent key={leg.id} value={leg.id} className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Leg: {leg.legReference}</span>
                      <Badge variant={leg.buySell === 'buy' ? "default" : "outline"}>
                        {leg.buySell}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Product</p>
                        <p>{leg.product}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Sustainability</p>
                        <p>{leg.sustainability || 'N/A'}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Incoterm</p>
                        <p>{leg.incoTerm}</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Quantity</p>
                        <p>{leg.quantity?.toLocaleString()} {leg.unit}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Tolerance</p>
                        <p>{leg.tolerance}%</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Contract Status</p>
                        <Badge variant={
                          leg.contractStatus === 'confirmed' ? "default" :
                          leg.contractStatus === 'cancelled' ? "destructive" :
                          "outline"
                        }>
                          {leg.contractStatus || 'pending'}
                        </Badge>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Loading Period</p>
                        <p>
                          {format(leg.loadingPeriodStart, 'dd MMM yyyy')} - {format(leg.loadingPeriodEnd, 'dd MMM yyyy')}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Pricing Period</p>
                        <p>
                          {format(leg.pricingPeriodStart, 'dd MMM yyyy')} - {format(leg.pricingPeriodEnd, 'dd MMM yyyy')}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Payment Term</p>
                        <p>{leg.paymentTerm}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Credit Status</p>
                        <Badge variant={
                          leg.creditStatus === 'approved' ? "default" :
                          leg.creditStatus === 'rejected' ? "destructive" :
                          "outline"
                        }>
                          {leg.creditStatus || 'pending'}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Customs Status</p>
                        <Badge variant={
                          leg.customsStatus === 'approved' ? "default" :
                          leg.customsStatus === 'rejected' ? "destructive" :
                          "outline"
                        }>
                          {leg.customsStatus || 'pending'}
                        </Badge>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Pricing Information</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Pricing Type</p>
                          <p>{leg.pricingType === 'efp' ? 'EFP' : 
                             leg.pricingType === 'fixed' ? 'Fixed' : 'Standard'}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Formula</p>
                          <div className="p-2 bg-muted rounded-md">
                            {leg.pricingType === 'efp' 
                              ? (efpFormulaDisplay || 'No formula required')
                              : formatFormula(leg.formula)}
                          </div>
                        </div>
                        {leg.pricingType === 'efp' && (
                          <>
                            <div className="space-y-2">
                              <p className="text-sm font-medium">EFP Premium</p>
                              <p>{leg.efpPremium}</p>
                            </div>
                            <div className="space-y-2">
                              <p className="text-sm font-medium">EFP Agreed</p>
                              <p>{leg.efpAgreedStatus ? 'Yes' : 'No'}</p>
                            </div>
                            {leg.efpFixedValue && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium">EFP Fixed Value</p>
                                <p>{leg.efpFixedValue}</p>
                              </div>
                            )}
                          </>
                        )}
                        
                        {leg.mtmFormula && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">MTM Formula</p>
                            <div className="p-2 bg-muted rounded-md">
                              {formatFormula(leg.mtmFormula)}
                            </div>
                          </div>
                        )}
                        
                        {leg.mtmFutureMonth && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">MTM Future Month</p>
                            <p>{leg.mtmFutureMonth}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {leg.comments && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">Comments</p>
                          <p className="p-2 bg-muted rounded-md">{leg.comments}</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default TradeDetailsDialog;
