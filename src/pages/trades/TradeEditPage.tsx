
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
import { 
  PhysicalTrade, 
  BuySell, 
  IncoTerm, 
  Unit, 
  PaymentTerm, 
  CreditStatus, 
  Product, 
  PricingType, 
  CustomsStatus 
} from '@/types';
import { validateAndParsePricingFormula } from '@/utils/formulaUtils';
import { useQueryClient } from '@tanstack/react-query';
import { formatDateForStorage } from '@/utils/dateUtils';
import { calculateExposures } from '@/utils/formulaCalculation';

// Helper function to safely access nested object properties
const safeGetNestedProperty = (obj: any, path: string[]): any => {
  return path.reduce((prev, curr) => {
    return (prev && typeof prev === 'object' && curr in prev) ? prev[curr] : undefined;
  }, obj);
};

// Helper function to check if an object has a specific property
const hasProperty = (obj: any, prop: string): boolean => {
  return obj && typeof obj === 'object' && prop in obj;
};

// Helper function to safely check and extract mtmTokens from formula
const safeExtractMtmTokens = (formula: any): any[] | undefined => {
  if (typeof formula !== 'object' || formula === null) {
    return undefined;
  }
  
  return hasProperty(formula, 'mtmTokens') ? formula.mtmTokens : undefined;
};

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
        // Fetch parent trade data
        const { data: parentTrade, error: parentError } = await supabase
          .from('parent_trades')
          .select('*')
          .eq('id', id)
          .single();

        if (parentError) {
          throw new Error(`Error fetching parent trade: ${parentError.message}`);
        }

        // Only handle physical trades
        if (parentTrade.trade_type !== 'physical') {
          throw new Error("Only physical trades are supported");
        }

        // Fetch trade legs
        const { data: tradeLegs, error: legsError } = await supabase
          .from('trade_legs')
          .select('*')
          .eq('parent_trade_id', id)
          .order('created_at', { ascending: true });

        if (legsError) {
          throw new Error(`Error fetching trade legs: ${legsError.message}`);
        }

        // Map trade data to the format expected by PhysicalTradeForm
        if (parentTrade.trade_type === 'physical' && tradeLegs.length > 0) {
          const processedLegs = tradeLegs.map(leg => {
            let formula = validateAndParsePricingFormula(leg.pricing_formula);
            let mtmFormula = null;
            
            // Extract mtmTokens from pricing_formula if available
            // Carefully check for nested properties to avoid type errors
            const hasMtmTokens = 
              typeof leg.pricing_formula === 'object' && 
              leg.pricing_formula !== null && 
              'mtmTokens' in leg.pricing_formula;
              
            if (hasMtmTokens) {
              // Get physical exposures safely
              const physicalExposures = safeGetNestedProperty(leg.pricing_formula, ['exposures', 'physical']) || {};
              
              mtmFormula = {
                tokens: leg.pricing_formula.mtmTokens,
                exposures: {
                  physical: physicalExposures,
                  pricing: {}
                }
              };
            } 
            // Fallback to the separate mtm_formula column if needed (for backward compatibility)
            else if (leg.mtm_formula) {
              mtmFormula = validateAndParsePricingFormula(leg.mtm_formula);
            }
            
            // Remove mtmTokens from formula to avoid duplication
            // Check if formula is an object and has mtmTokens property
            if (hasProperty(formula, 'mtmTokens')) {
              // Use type assertion to tell TypeScript this is a safe operation
              const { mtmTokens, ...formulaWithoutMtmTokens } = formula as any;
              formula = formulaWithoutMtmTokens;
            }

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
              pricingPeriodStart: leg.pricing_period_start ? new Date(leg.pricing_period_start) : new Date(),
              pricingPeriodEnd: leg.pricing_period_end ? new Date(leg.pricing_period_end) : new Date(),
              unit: (leg.unit || 'MT') as Unit,
              paymentTerm: (leg.payment_term || '30 days') as PaymentTerm,
              creditStatus: (leg.credit_status || 'pending') as CreditStatus,
              customsStatus: leg.customs_status as CustomsStatus,
              formula: formula,
              mtmFormula: mtmFormula,
              pricingType: (leg.pricing_type as PricingType) || 'standard',
              mtmFutureMonth: leg.mtm_future_month,
              efpPremium: leg.efp_premium,
              efpAgreedStatus: leg.efp_agreed_status,
              efpFixedValue: leg.efp_fixed_value,
              efpDesignatedMonth: leg.efp_designated_month
            };
          });

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
            pricingPeriodStart: tradeLegs[0].pricing_period_start ? new Date(tradeLegs[0].pricing_period_start) : new Date(),
            pricingPeriodEnd: tradeLegs[0].pricing_period_end ? new Date(tradeLegs[0].pricing_period_end) : new Date(),
            unit: (tradeLegs[0].unit || 'MT') as Unit,
            paymentTerm: (tradeLegs[0].payment_term || '30 days') as PaymentTerm,
            creditStatus: (tradeLegs[0].credit_status || 'pending') as CreditStatus,
            customsStatus: tradeLegs[0].customs_status as CustomsStatus,
            formula: processedLegs[0].formula,
            mtmFormula: processedLegs[0].mtmFormula,
            pricingType: (tradeLegs[0].pricing_type as PricingType) || 'standard',
            mtmFutureMonth: tradeLegs[0].mtm_future_month,
            legs: processedLegs
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

      // Update the parent trade
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

      // For physical trades, we need to update all legs
      for (const leg of updatedTradeData.legs) {
        // Calculate physical exposures based on current quantity and mtmFormula tokens
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
          
        const consolidatedFormula = {
          ...leg.formula,
          mtmTokens: leg.mtmFormula ? leg.mtmFormula.tokens || [] : [],
          exposures: {
            pricing: (leg.formula.exposures && leg.formula.exposures.pricing) || {},
            physical: physicalExposures
          }
        };
        
        const legData = {
          parent_trade_id: id,
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
          pricing_formula: consolidatedFormula,
          mtm_formula: null, // Set to null as we no longer need it
          pricing_type: leg.pricingType,
          mtm_future_month: leg.mtmFutureMonth,
          updated_at: new Date().toISOString()
        };

        if (leg.pricingType === 'efp') {
          Object.assign(legData, {
            efp_premium: leg.efpPremium,
            efp_agreed_status: leg.efpAgreedStatus,
            efp_fixed_value: leg.efpFixedValue,
            efp_designated_month: leg.efpDesignatedMonth,
          });
        }

        const { error: legUpdateError } = await supabase
          .from('trade_legs')
          .update(legData)
          .eq('id', leg.id);
          
        if (legUpdateError) {
          throw new Error(`Error updating trade leg: ${legUpdateError.message}`);
        }
      }

      // Force invalidate the trades query cache to ensure fresh data
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
            Edit trade {tradeData?.tradeReference}
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
              tradeReference={tradeData?.tradeReference || ''}
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
