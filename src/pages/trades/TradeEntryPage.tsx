import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Layout from '@/components/Layout';
import PhysicalTradeForm from '@/components/trades/PhysicalTradeForm';
import PaperTradeForm from '@/components/trades/PaperTradeForm';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generateTradeReference } from '@/utils/tradeUtils';

const TradeEntryPage = () => {
  const navigate = useNavigate();
  const [tradeType, setTradeType] = useState<'physical' | 'paper'>('physical');
  const tradeReference = generateTradeReference();
  
  const handleSubmit = async (tradeData: any) => {
    try {
      // Extract parent trade data
      const parentTrade = {
        trade_reference: tradeData.tradeReference,
        trade_type: tradeData.tradeType,
        physical_type: tradeData.physicalType,
        counterparty: tradeData.counterparty,
      };
      
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
          mtm_formula: leg.mtmFormula,
        }));
        
        const { error: legsError } = await supabase
          .from('trade_legs')
          .insert(legs);
          
        if (legsError) {
          throw new Error(`Error inserting trade legs: ${legsError.message}`);
        }
      } else {
        // For paper trades, we have to extract leg data differently
        const legData = {
          leg_reference: generateTradeReference() + '-a', // Default leg reference
          parent_trade_id: parentTradeId,
          buy_sell: tradeData.buySell,  // Use buySell from the paper trade data
          product: tradeData.product,   // Use product from the paper trade data
          instrument: tradeData.instrument,
          pricing_period_start: tradeData.pricingPeriodStart,
          pricing_period_end: tradeData.pricingPeriodEnd,
          price: tradeData.price,
          quantity: tradeData.quantity,
          broker: tradeData.broker,
          pricing_formula: tradeData.formula,
          mtm_formula: tradeData.mtmFormula,
        };
        
        const { error: legError } = await supabase
          .from('trade_legs')
          .insert(legData);
          
        if (legError) {
          throw new Error(`Error inserting paper trade leg: ${legError.message}`);
        }
      }
      
      toast.success('Trade created successfully', {
        description: `Trade reference: ${tradeData.tradeReference}`
      });
      
      navigate('/trades');
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
