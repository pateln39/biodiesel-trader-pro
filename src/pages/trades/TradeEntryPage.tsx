
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/Layout';
import PhysicalTradeForm from '@/components/trades/PhysicalTradeForm';
import PaperTradeForm from '@/components/trades/PaperTradeForm';
import { generateTradeReference } from '@/utils/tradeUtils';
import { useQueryClient } from '@tanstack/react-query';
import { TradeType } from '@/types';
import { usePaperTrades } from '@/hooks/usePaperTrades';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { calculateExposures } from '@/utils/formulaCalculation';

const TradeEntryPage = () => {
  const navigate = useNavigate();
  const tradeReference = generateTradeReference();
  const queryClient = useQueryClient();
  const [tradeType, setTradeType] = useState<TradeType>('physical');
  const { createPaperTrade } = usePaperTrades();
  
  const handlePhysicalSubmit = async (tradeData: any) => {
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
      
      // For physical trades, insert all legs with properly calculated exposures
      const legs = tradeData.legs.map((leg: any) => {
        // Ensure formula has proper exposures with correct signs
        if (leg.formula && leg.formula.tokens) {
          // Calculate exposures for the formula with the correct buySell direction
          const buySellMultiplier = leg.buySell === 'buy' ? -1 : 1;
          
          // Update exposures in the formula
          if (leg.pricingPeriodStart && leg.pricingPeriodEnd) {
            leg.formula.exposures = calculateExposures(
              leg.formula.tokens, 
              leg.quantity, 
              buySellMultiplier,
              leg.pricingPeriodStart, 
              leg.pricingPeriodEnd
            );
          }
        }
        
        // Do the same for MTM formula if it exists
        if (leg.mtmFormula && leg.mtmFormula.tokens) {
          // Calculate exposures for the formula with the correct buySell direction
          const buySellMultiplier = leg.buySell === 'buy' ? -1 : 1;
          
          // Update exposures in the formula
          if (leg.pricingPeriodStart && leg.pricingPeriodEnd) {
            leg.mtmFormula.exposures = calculateExposures(
              leg.mtmFormula.tokens, 
              leg.quantity, 
              buySellMultiplier,
              leg.pricingPeriodStart, 
              leg.pricingPeriodEnd
            );
          }
        }
        
        return {
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
        };
      });
      
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
  
  const handlePaperSubmit = async (tradeData: any) => {
    try {
      // Use the createPaperTrade from usePaperTrades hook
      createPaperTrade(tradeData, {
        onSuccess: () => {
          navigate('/trades', { state: { created: true, tradeReference: tradeData.tradeReference } });
        }
      });
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
              Select trade type and enter details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue="physical"
              value={tradeType}
              onValueChange={(value) => setTradeType(value as TradeType)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="physical">Physical Trade</TabsTrigger>
                <TabsTrigger value="paper">Paper Trade</TabsTrigger>
              </TabsList>
              
              <TabsContent value="physical">
                <PhysicalTradeForm 
                  tradeReference={tradeReference} 
                  onSubmit={handlePhysicalSubmit} 
                  onCancel={handleCancel} 
                />
              </TabsContent>
              
              <TabsContent value="paper">
                <PaperTradeForm 
                  tradeReference={tradeReference} 
                  onSubmit={handlePaperSubmit} 
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
