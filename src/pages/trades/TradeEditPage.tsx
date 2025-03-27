
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import Layout from '@/components/Layout';
import PhysicalTradeForm from '@/components/trades/PhysicalTradeForm';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PhysicalTrade, BuySell, IncoTerm, Unit, PaymentTerm, CreditStatus, Product } from '@/types';
import { validateAndParsePricingFormula } from '@/utils/formulaUtils';
import { useQueryClient } from '@tanstack/react-query';
import { calculateExposures } from '@/utils/formulaCalculation';

const TradeEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{id: string}>();
  const [isLoading, setIsLoading] = useState(true);
  const [tradeData, setTradeData] = useState<PhysicalTrade | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchTradeData = async () => {
      if (!id) {
        navigate('/trades');
        return;
      }

      try {
        const { data: parentTrade, error: parentError } = await supabase
          .from('parent_trades')
          .select('*')
          .eq('id', id)
          .single();

        if (parentError) {
          throw new Error(`Error fetching parent trade: ${parentError.message}`);
        }

        if (parentTrade.trade_type !== 'physical') {
          throw new Error("Only physical trades are supported");
        }

        const { data: tradeLegs, error: legsError } = await supabase
          .from('trade_legs')
          .select('*')
          .eq('parent_trade_id', id)
          .order('created_at', { ascending: true });

        if (legsError) {
          throw new Error(`Error fetching trade legs: ${legsError.message}`);
        }

        if (parentTrade.trade_type === 'physical' && tradeLegs.length > 0) {
          const pricingPeriodStart = tradeLegs[0].pricing_period_start 
            ? new Date(tradeLegs[0].pricing_period_start) 
            : new Date();
          const pricingPeriodEnd = tradeLegs[0].pricing_period_end 
            ? new Date(tradeLegs[0].pricing_period_end) 
            : new Date();

          const formula = validateAndParsePricingFormula(tradeLegs[0].pricing_formula);
          const mtmFormula = validateAndParsePricingFormula(tradeLegs[0].mtm_formula);

          const physicalTrade: PhysicalTrade = {
            id: parentTrade.id,
            tradeReference: parentTrade.trade_reference,
            tradeType: 'physical', 
            createdAt: new Date(parentTrade.created_at),
            updatedAt: new Date(parentTrade.updated_at),
            physicalType: (parentTrade.physical_type || 'spot') as 'spot' | 'term',
            counterparty: parentTrade.counterparty,
            buySell: tradeLegs[0].buy_sell as BuySell,
            product: tradeLegs[0].product as Product,
            sustainability: tradeLegs[0].sustainability || '',
            incoTerm: (tradeLegs[0].inco_term || 'FOB') as IncoTerm,
            quantity: tradeLegs[0].quantity,
            tolerance: tradeLegs[0].tolerance || 0,
            loadingPeriodStart: tradeLegs[0].loading_period_start ? new Date(tradeLegs[0].loading_period_start) : new Date(),
            loadingPeriodEnd: tradeLegs[0].loading_period_end ? new Date(tradeLegs[0].loading_period_end) : new Date(),
            pricingPeriodStart: pricingPeriodStart,
            pricingPeriodEnd: pricingPeriodEnd,
            unit: (tradeLegs[0].unit || 'MT') as Unit,
            paymentTerm: (tradeLegs[0].payment_term || '30 days') as PaymentTerm,
            creditStatus: (tradeLegs[0].credit_status || 'pending') as CreditStatus,
            formula: formula,
            mtmFormula: mtmFormula,
            legs: tradeLegs.map(leg => {
              const legPricingStart = leg.pricing_period_start 
                ? new Date(leg.pricing_period_start) 
                : new Date();
              const legPricingEnd = leg.pricing_period_end 
                ? new Date(leg.pricing_period_end) 
                : new Date();
              
              const legFormula = validateAndParsePricingFormula(leg.pricing_formula);
              const legMtmFormula = validateAndParsePricingFormula(leg.mtm_formula);

              return {
                id: leg.id,
                parentTradeId: leg.parent_trade_id,
                legReference: leg.leg_reference,
                buySell: leg.buy_sell as BuySell,
                product: leg.product as Product,
                sustainability: leg.sustainability || '',
                incoTerm: (leg.inco_term || 'FOB') as IncoTerm,
                quantity: leg.quantity,
                tolerance: leg.tolerance || 0,
                loadingPeriodStart: leg.loading_period_start ? new Date(leg.loading_period_start) : new Date(),
                loadingPeriodEnd: leg.loading_period_end ? new Date(leg.loading_period_end) : new Date(),
                pricingPeriodStart: legPricingStart,
                pricingPeriodEnd: legPricingEnd,
                unit: (leg.unit || 'MT') as Unit,
                paymentTerm: (leg.payment_term || '30 days') as PaymentTerm,
                creditStatus: (leg.credit_status || 'pending') as CreditStatus,
                formula: legFormula,
                mtmFormula: legMtmFormula
              };
            })
          };
          setTradeData(physicalTrade);
        } else {
          throw new Error("Invalid trade data");
        }

      } catch (error: any) {
        console.error('Error fetching trade:', error);
        toast.error("Failed to load trade", {
          description: error.message || "Could not load trade details"
        });
        navigate('/trades');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTradeData();
  }, [id, navigate]);

  const handleSubmit = async (updatedTradeData: any) => {
    try {
      if (!id) return;

      const parentTradeUpdate = {
        trade_reference: updatedTradeData.tradeReference,
        physical_type: updatedTradeData.physicalType,
        counterparty: updatedTradeData.counterparty,
        updated_at: new Date().toISOString()
      };
      
      const { error: parentUpdateError } = await supabase
        .from('parent_trades')
        .update(parentTradeUpdate)
        .eq('id', id);
        
      if (parentUpdateError) {
        throw new Error(`Error updating parent trade: ${parentUpdateError.message}`);
      }

      for (const leg of updatedTradeData.legs) {
        // Recalculate pricing formula exposures
        const updatedPricingExposures = calculateExposures(
          leg.formula.tokens,
          leg.quantity,
          leg.buySell,
          leg.product,
          leg.pricingPeriodStart,
          leg.pricingPeriodEnd,
          'price'
        );

        // Update the pricing formula with recalculated exposures
        const updatedPricingFormula = {
          tokens: leg.formula.tokens,
          exposures: updatedPricingExposures
        };

        // Recalculate MTM formula exposures
        const updatedMtmExposures = calculateExposures(
          leg.mtmFormula.tokens,
          leg.quantity,
          leg.buySell,
          leg.product,
          leg.pricingPeriodStart,
          leg.pricingPeriodEnd,
          'mtm'
        );

        // Update the MTM formula with recalculated exposures
        const updatedMtmFormula = {
          tokens: leg.mtmFormula.tokens,
          exposures: updatedMtmExposures
        };

        // Convert the formulas to plain objects to satisfy the Json type requirements
        const pricingFormulaJson = JSON.parse(JSON.stringify(updatedPricingFormula));
        const mtmFormulaJson = JSON.parse(JSON.stringify(updatedMtmFormula));

        const legData = {
          parent_trade_id: id,
          buy_sell: leg.buySell,
          product: leg.product,
          sustainability: leg.sustainability,
          inco_term: leg.incoTerm,
          quantity: leg.quantity,
          tolerance: leg.tolerance,
          loading_period_start: leg.loadingPeriodStart?.toISOString().split('T')[0],
          loading_period_end: leg.loadingPeriodEnd?.toISOString().split('T')[0],
          pricing_period_start: leg.pricingPeriodStart?.toISOString().split('T')[0],
          pricing_period_end: leg.pricingPeriodEnd?.toISOString().split('T')[0],
          unit: leg.unit,
          payment_term: leg.paymentTerm,
          credit_status: leg.creditStatus,
          pricing_formula: pricingFormulaJson,  // Use the JSON-compatible version
          mtm_formula: mtmFormulaJson,          // Use the JSON-compatible version
          updated_at: new Date().toISOString()
        };

        const { error: legUpdateError } = await supabase
          .from('trade_legs')
          .update(legData)
          .eq('id', leg.id);
          
        if (legUpdateError) {
          throw new Error(`Error updating trade leg: ${legUpdateError.message}`);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['trades'] });

      toast.success("Trade updated", {
        description: `Trade ${updatedTradeData.tradeReference} has been updated successfully`
      });

      navigate('/trades', { state: { updated: true, tradeReference: updatedTradeData.tradeReference } });
    } catch (error: any) {
      console.error('Error updating trade:', error);
      toast.error("Failed to update trade", {
        description: error.message || "An error occurred while updating the trade"
      });
    }
  };

  const handleCancel = () => {
    navigate('/trades');
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading trade data...</p>
        </div>
      </Layout>
    );
  }

  if (!tradeData) {
    return (
      <Layout>
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight mb-4">Trade Not Found</h2>
          <p className="text-muted-foreground mb-6">The trade you're looking for could not be found.</p>
          <Button onClick={() => navigate('/trades')}>Back to Trades</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Trade</h1>
          <p className="text-muted-foreground">
            Edit trade {tradeData.tradeReference}
          </p>
        </div>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Trade Details</CardTitle>
            <CardDescription>
              Update trade information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PhysicalTradeForm 
              tradeReference={tradeData.tradeReference} 
              onSubmit={handleSubmit} 
              onCancel={handleCancel} 
              isEditMode={true}
              initialData={tradeData}
            />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default TradeEditPage;
