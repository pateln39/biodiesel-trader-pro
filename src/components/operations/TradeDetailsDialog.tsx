
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { File } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { PhysicalTrade, PhysicalTradeLeg } from '@/types';
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

      // Map the data to our PhysicalTrade type
      const mappedTrade: PhysicalTrade = {
        id: parentTrade.id,
        tradeReference: parentTrade.trade_reference,
        tradeType: 'physical',
        createdAt: new Date(parentTrade.created_at),
        updatedAt: new Date(parentTrade.updated_at),
        physicalType: (parentTrade.physical_type || 'spot') as 'spot' | 'term',
        counterparty: parentTrade.counterparty,
        legs: tradeLegs.map(leg => ({
          id: leg.id,
          parentTradeId: leg.parent_trade_id,
          legReference: leg.leg_reference,
          buySell: leg.buy_sell,
          product: leg.product,
          sustainability: leg.sustainability || '',
          incoTerm: leg.inco_term,
          quantity: leg.quantity,
          tolerance: leg.tolerance || 0,
          loadingPeriodStart: leg.loading_period_start ? new Date(leg.loading_period_start) : new Date(),
          loadingPeriodEnd: leg.loading_period_end ? new Date(leg.loading_period_end) : new Date(),
          pricingPeriodStart: leg.pricing_period_start ? new Date(leg.pricing_period_start) : new Date(),
          pricingPeriodEnd: leg.pricing_period_end ? new Date(leg.pricing_period_end) : new Date(),
          unit: leg.unit,
          paymentTerm: leg.payment_term,
          creditStatus: leg.credit_status,
          customsStatus: leg.customs_status,
          formula: validateAndParsePricingFormula(leg.pricing_formula),
          mtmFormula: validateAndParsePricingFormula(leg.mtm_formula),
          pricingType: leg.pricing_type,
          efpPremium: leg.efp_premium,
          efpAgreedStatus: leg.efp_agreed_status,
          efpFixedValue: leg.efp_fixed_value,
          efpDesignatedMonth: leg.efp_designated_month,
          mtmFutureMonth: leg.mtm_future_month,
          comments: leg.comments,
          contractStatus: leg.contract_status
        }))
      };

      // If a specific leg ID was provided, filter to just include that leg
      if (legId) {
        const selectedLeg = mappedTrade.legs.find(leg => leg.id === legId);
        if (selectedLeg) {
          mappedTrade.buySell = selectedLeg.buySell;
          mappedTrade.product = selectedLeg.product;
          mappedTrade.incoTerm = selectedLeg.incoTerm;
          mappedTrade.quantity = selectedLeg.quantity;
          mappedTrade.tolerance = selectedLeg.tolerance;
          mappedTrade.loadingPeriodStart = selectedLeg.loadingPeriodStart;
          mappedTrade.loadingPeriodEnd = selectedLeg.loadingPeriodEnd;
          mappedTrade.pricingPeriodStart = selectedLeg.pricingPeriodStart;
          mappedTrade.pricingPeriodEnd = selectedLeg.pricingPeriodEnd;
          mappedTrade.unit = selectedLeg.unit;
          mappedTrade.paymentTerm = selectedLeg.paymentTerm;
          mappedTrade.creditStatus = selectedLeg.creditStatus;
          mappedTrade.customsStatus = selectedLeg.customsStatus;
          mappedTrade.formula = selectedLeg.formula;
          mappedTrade.mtmFormula = selectedLeg.mtmFormula;
          mappedTrade.pricingType = selectedLeg.pricingType;
        }
      } else {
        // If no specific leg ID, use the first leg for main details
        const firstLeg = mappedTrade.legs[0];
        if (firstLeg) {
          mappedTrade.buySell = firstLeg.buySell;
          mappedTrade.product = firstLeg.product;
          mappedTrade.incoTerm = firstLeg.incoTerm;
          mappedTrade.quantity = firstLeg.quantity;
          mappedTrade.tolerance = firstLeg.tolerance;
          mappedTrade.loadingPeriodStart = firstLeg.loadingPeriodStart;
          mappedTrade.loadingPeriodEnd = firstLeg.loadingPeriodEnd;
          mappedTrade.pricingPeriodStart = firstLeg.pricingPeriodStart;
          mappedTrade.pricingPeriodEnd = firstLeg.pricingPeriodEnd;
          mappedTrade.unit = firstLeg.unit;
          mappedTrade.paymentTerm = firstLeg.paymentTerm;
          mappedTrade.creditStatus = firstLeg.creditStatus;
          mappedTrade.customsStatus = firstLeg.customsStatus;
          mappedTrade.formula = firstLeg.formula;
          mappedTrade.mtmFormula = firstLeg.mtmFormula;
          mappedTrade.pricingType = firstLeg.pricingType;
        }
      }

      return mappedTrade;
    },
    enabled: open && !!tradeId,
    refetchOnWindowFocus: false,
  });

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <File className="h-5 w-5" />
            Trade Details: {trade.tradeReference}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full md:w-[400px] grid-cols-2">
            <TabsTrigger value="details">Main Details</TabsTrigger>
            <TabsTrigger value="legs">Legs ({trade.legs.length})</TabsTrigger>
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
                        {formatFormula(trade.formula)}
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
                        {trade.efpDesignatedMonth && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">EFP Designated Month</p>
                            <p>{trade.efpDesignatedMonth}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="legs" className="space-y-4">
            {trade.legs.map((leg, index) => (
              <Card key={leg.id} className={leg.id === legId ? "border-brand-lime/50" : ""}>
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
                      <p className="text-sm font-medium text-muted-foreground">Quantity</p>
                      <p>{leg.quantity?.toLocaleString()} {leg.unit}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Incoterm</p>
                      <p>{leg.incoTerm}</p>
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

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Pricing Information</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Pricing Type</p>
                        <p>{leg.pricingType === 'efp' ? 'EFP' : 'Standard'}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Formula</p>
                        <div className="p-2 bg-muted rounded-md">
                          {formatFormula(leg.formula)}
                        </div>
                      </div>
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
            ))}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default TradeDetailsDialog;
