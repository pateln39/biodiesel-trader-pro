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
import { TradeType, PricingFormula } from '@/types';
import { usePaperTrades } from '@/hooks/usePaperTrades';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { formatDateForStorage } from '@/utils/dateUtils';
import { calculateExposures, calculateDailyPricingDistribution } from '@/utils/formulaCalculation';
import { buildCompleteExposuresObject } from '@/utils/paperTrade';

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
        counterparty: tradeData.counterparty
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
      const legs = tradeData.legs.map((leg: any) => {
        // Base leg data
        const legData: any = {
          leg_reference: leg.legReference,
          parent_trade_id: parentTradeId,
          buy_sell: leg.buySell,
          product: leg.product,
          sustainability: leg.sustainability,
          inco_term: leg.incoTerm,
          quantity: leg.quantity,
          tolerance: leg.tolerance,
          loading_period_start: formatDateForStorage(leg.loadingPeriodStart),
          loading_period_end: formatDateForStorage(leg.loadingPeriodEnd),
          pricing_period_start: formatDateForStorage(leg.pricingPeriodStart),
          pricing_period_end: formatDateForStorage(leg.pricingPeriodEnd),
          unit: leg.unit,
          payment_term: leg.paymentTerm,
          credit_status: leg.creditStatus,
          customs_status: leg.customsStatus,
          pricing_type: leg.pricingType,
          mtm_future_month: leg.mtmFutureMonth,
          comments: leg.comments // Keep leg-specific comments
        };
        
        // Calculate physical exposures based on MTM formula tokens and quantity
        let physicalExposures = {};
        
        if (leg.mtmFormula && leg.mtmFormula.tokens && leg.mtmFormula.tokens.length > 0) {
          const mtmExposures = calculateExposures(
            leg.mtmFormula.tokens, 
            leg.quantity, 
            leg.buySell,
            leg.product
          );
          
          physicalExposures = mtmExposures.physical || {};
        }
        
        // Calculate daily distribution based on pricing type
        let dailyDistribution = {};
        
        if (leg.pricingType === 'efp' && !leg.efpAgreedStatus) {
          // For EFP trades, calculate daily distribution based on the designated month
          const exposureDirection = leg.buySell === 'buy' ? -1 : 1;
          const exposureValue = leg.quantity * exposureDirection;
          
          const instrumentKey = 'ICE GASOIL FUTURES (EFP)';
          // We're using the updated formula, which should already have the dailyDistribution
          if (leg.formula && leg.formula.dailyDistribution && leg.formula.dailyDistribution[instrumentKey]) {
            dailyDistribution = {
              [instrumentKey]: leg.formula.dailyDistribution[instrumentKey]
            };
          }
        }
        else if (leg.formula && 
            leg.formula.tokens && 
            leg.formula.tokens.length > 0 && 
            leg.pricingPeriodStart && 
            leg.pricingPeriodEnd) {
          
          dailyDistribution = calculateDailyPricingDistribution(
            leg.formula.tokens,
            leg.quantity,
            leg.buySell,
            new Date(leg.pricingPeriodStart),
            new Date(leg.pricingPeriodEnd)
          );
          
          console.log('[TRADE ENTRY] Calculated daily distribution:', dailyDistribution);
        }
        
        // Create consolidated formula
        const consolidatedFormula = {
          ...leg.formula,
          mtmTokens: leg.mtmFormula ? leg.mtmFormula.tokens || [] : [],
          exposures: {
            pricing: (leg.formula.exposures && leg.formula.exposures.pricing) || {},
            physical: physicalExposures
          },
          dailyDistribution: dailyDistribution // Include daily distribution
        };
        
        // Add the consolidated formula to legData
        legData.pricing_formula = consolidatedFormula;
        
        // Set mtm_formula to null since we're consolidating all data into pricing_formula
        legData.mtm_formula = null;

        // Add EFP fields if they exist
        if (leg.efpPremium !== undefined) {
          Object.assign(legData, {
            efp_premium: leg.efpPremium,
            efp_agreed_status: leg.efpAgreedStatus,
            efp_fixed_value: leg.efpFixedValue,
            efp_designated_month: leg.efpDesignatedMonth,
          });
        }
        
        return legData;
      });
      
      const { error: legsError } = await supabase
        .from('trade_legs')
        .insert(legs);
        
      if (legsError) {
        throw new Error(`Error inserting trade legs: ${legsError.message}`);
      }
      
      // Force invalidate the trades query cache
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      
      // Also invalidate the openTrades query cache to refresh the open trades table
      queryClient.invalidateQueries({ queryKey: ['openTrades'] });

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
      console.log('[PAPER_SUBMIT] Creating paper trade with data:', tradeData);
      
      // Update the trade data to include execution trade date in each leg
      const updatedTradeData = {
        ...tradeData,
        legs: tradeData.legs.map((leg: any) => ({
          ...leg,
          executionTradeDate: tradeData.executionTradeDate
        }))
      };
      
      // This will now use our fixed buildCompleteExposuresObject function
      // which correctly preserves the sign of right-side quantities
      createPaperTrade(updatedTradeData, {
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">New Trade</h1>
            <p className="text-muted-foreground">
              Create a new trade by filling out the form below
            </p>
          </div>
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
