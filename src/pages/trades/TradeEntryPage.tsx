
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Layout from '@/components/Layout';
import PhysicalTradeForm from '@/components/trades/PhysicalTradeForm';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generateTradeReference } from '@/utils/tradeUtils';
import { useQueryClient } from '@tanstack/react-query';

const TradeEntryPage = () => {
  const navigate = useNavigate();
  const tradeReference = generateTradeReference();
  const queryClient = useQueryClient();
  
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
        mtm_formula: leg.mtmFormula, // Save the MTM formula
      }));
      
      const { error: legsError } = await supabase
        .from('trade_legs')
        .insert(legs);
        
      if (legsError) {
        throw new Error(`Error inserting trade legs: ${legsError.message}`);
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
            Create a new physical trade by filling out the form below
          </p>
        </div>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Trade Details</CardTitle>
            <CardDescription>
              Enter physical trade details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PhysicalTradeForm 
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

export default TradeEntryPage;
