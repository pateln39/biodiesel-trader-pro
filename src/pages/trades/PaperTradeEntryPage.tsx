
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Layout from '@/components/Layout';
import { generateTradeReference } from '@/utils/tradeUtils';
import { useQueryClient } from '@tanstack/react-query';
import PaperTradeForm from '@/components/trades/PaperTradeForm';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const PaperTradeEntryPage = () => {
  const navigate = useNavigate();
  const tradeReference = generateTradeReference();
  const queryClient = useQueryClient();
  
  const handleSubmit = async (tradeData: any) => {
    try {
      // Extract parent trade data
      const parentTrade = {
        trade_reference: tradeData.tradeReference,
        trade_type: 'paper',
        comment: tradeData.comment
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
      
      // Insert legs
      const tradeLegs = tradeData.legs.map((leg: any) => ({
        leg_reference: leg.legReference,
        parent_trade_id: parentTradeId,
        buy_sell: leg.buySell,
        product: leg.product,
        instrument: leg.instrument,
        pricing_period_start: leg.periodStart,
        pricing_period_end: leg.periodEnd,
        price: leg.price,
        quantity: leg.quantity,
        broker: leg.broker,
        pricing_formula: leg.formula,
        mtm_formula: leg.mtmFormula
      }));
      
      const { error: legsError } = await supabase
        .from('trade_legs')
        .insert(tradeLegs);
        
      if (legsError) {
        throw new Error(`Error inserting trade legs: ${legsError.message}`);
      }
      
      // Force invalidate the trades query cache
      queryClient.invalidateQueries({ queryKey: ['trades'] });

      toast.success('Paper trade created successfully', {
        description: `Trade reference: ${tradeData.tradeReference}`
      });
      
      navigate('/trades', { state: { created: true, tradeReference: tradeData.tradeReference } });
    } catch (error: any) {
      toast.error('Failed to create paper trade', {
        description: error.message
      });
      console.error('Error creating paper trade:', error);
    }
  };

  const handleCancel = () => {
    navigate('/trades');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Paper Trade</h1>
          <p className="text-muted-foreground">
            Create a new paper trade by filling out the form below
          </p>
        </div>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Paper Trade Details</CardTitle>
            <CardDescription>
              Enter trade details, legs, and view real-time exposure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PaperTradeForm 
              tradeReference={tradeReference} 
              onSubmit={handleSubmit} 
              onCancel={handleCancel} 
            />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PaperTradeEntryPage;
