
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Layout from '@/components/Layout';
import PhysicalTradeForm from '@/components/trades/PhysicalTradeForm';
import PaperTradeForm from '@/components/trades/PaperTradeForm';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generateTradeReference } from '@/utils/tradeUtils';
import { useQueryClient } from '@tanstack/react-query';

const TradeEntryPage = () => {
  const navigate = useNavigate();
  const [tradeType, setTradeType] = useState<'physical' | 'paper'>('physical');
  const tradeReference = generateTradeReference();
  const queryClient = useQueryClient();
  
  const handleSubmit = async (tradeData: any) => {
    try {
      // Extract parent trade data with appropriate defaults
      const parentTrade = {
        trade_reference: tradeData.tradeReference,
        trade_type: tradeData.tradeType,
        physical_type: tradeData.physicalType,
        counterparty: tradeData.counterparty || 'Internal', // Default for paper trades
        comment: tradeData.comment || '' // Ensure we have at least an empty string
      };
      
      console.log('Submitting parent trade:', parentTrade);
      
      // Insert parent trade
      const { data: parentTradeData, error: parentTradeError } = await supabase
        .from('parent_trades')
        .insert(parentTrade)
        .select('id')
        .single();
        
      if (parentTradeError) {
        throw new Error(`Error inserting parent trade: ${parentTradeError.message}`);
      }
      
      // Get the parent trade ID
      const parentTradeId = parentTradeData.id;
      
      // Insert trade legs
      if (tradeData.tradeType === 'physical') {
        // For physical trades, insert all legs
        const legs = tradeData.legs.map((leg: any) => ({
          leg_reference: leg.legReference,
          parent_trade_id: parentTradeId,
          buy_sell: leg.buySell,
          product: leg.product,
          sustainability: leg.sustainability,
          inco_term: leg.incoTerm,
          quantity: leg.quantity,
          tolerance: leg.tolerance,
          loading_period_start: leg.loadingPeriodStart,
          loading_period_end: leg.loadingPeriodEnd,
          pricing_period_start: leg.pricingPeriodStart,
          pricing_period_end: leg.pricingPeriodEnd,
          unit: leg.unit,
          payment_term: leg.paymentTerm,
          credit_status: leg.creditStatus,
          pricing_formula: leg.formula,
          mtm_formula: leg.mtmFormula // Save the MTM formula
        }));
        
        const { error: legsError } = await supabase
          .from('trade_legs')
          .insert(legs);
          
        if (legsError) {
          throw new Error(`Error inserting trade legs: ${legsError.message}`);
        }
      } else {
        // For paper trades, insert all legs
        const legs = tradeData.legs.map((leg: any) => ({
          leg_reference: leg.legReference,
          parent_trade_id: parentTradeId,
          buy_sell: leg.buySell,
          product: leg.product,
          instrument: leg.instrument,
          trading_period: leg.tradingPeriod,
          pricing_period_start: leg.periodStart,
          pricing_period_end: leg.periodEnd,
          price: leg.price,
          quantity: leg.quantity,
          broker: leg.broker,
          pricing_formula: leg.formula,
          mtm_formula: leg.mtmFormula
        }));
        
        console.log('Submitting paper trade legs:', legs);
        
        const { error: legsError } = await supabase
          .from('trade_legs')
          .insert(legs);
          
        if (legsError) {
          throw new Error(`Error inserting paper trade legs: ${legsError.message}`);
        }
      }
      
      // Force invalidate the trades query cache
      queryClient.invalidateQueries({ queryKey: ['trades'] });

      toast.success('Trade created successfully', {
        description: `Trade reference: ${tradeData.tradeReference}`
      });
      
      navigate('/trades', { state: { created: true, tradeReference: tradeData.tradeReference } });
    } catch (error: any) {
      toast.error('Failed to create trade', {
        description: error.message
      });
      console.error('Error creating trade:', error);
    }
  };

  const handleCancel = () => {
    navigate('/trades');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Trade</h1>
          <p className="text-muted-foreground">
            Create a new trade by filling out the form below
          </p>
        </div>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Trade Details</CardTitle>
            <CardDescription>
              Select trade type and enter trade details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue="physical"
              value={tradeType}
              onValueChange={(value) => setTradeType(value as 'physical' | 'paper')}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="physical">Physical Trade</TabsTrigger>
                <TabsTrigger value="paper">Paper Trade</TabsTrigger>
              </TabsList>
              
              <TabsContent value="physical">
                <PhysicalTradeForm 
                  tradeReference={tradeReference} 
                  onSubmit={handleSubmit} 
                  onCancel={handleCancel} 
                />
              </TabsContent>
              
              <TabsContent value="paper">
                <PaperTradeForm 
                  tradeReference={tradeReference} 
                  onSubmit={handleSubmit} 
                  onCancel={handleCancel} 
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default TradeEntryPage;
