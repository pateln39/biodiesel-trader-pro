
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PhysicalTrade, PricingFormula } from '@/types';

export const usePhysicalTrades = () => {
  const { mutate: updatePhysicalTrade } = useMutation({
    mutationFn: async (updatedTrade: any) => {
      console.log('[PHYSICAL] Updating trade:', updatedTrade);
      
      // Validate formulas exist
      if (!updatedTrade.formula) {
        throw new Error('Pricing formula is required');
      }

      // Create a complete copy of the MTM formula
      const updatedMtmFormula = {
        ...(updatedTrade.mtmFormula || {}),
        tokens: updatedTrade.mtmFormula?.tokens || [],
        exposures: {
          physical: { ...updatedTrade.formula.exposures.physical },
          pricing: { ...updatedTrade.formula.exposures.pricing }
        }
      };

      console.log('[PHYSICAL] Original MTM formula:', updatedTrade.mtmFormula);
      console.log('[PHYSICAL] Updated MTM formula:', updatedMtmFormula);
      console.log('[PHYSICAL] Pricing formula exposures:', updatedTrade.formula.exposures);

      // Update trade with synchronized formulas
      const { data: updatedData, error: tradeUpdateError } = await supabase
        .from('trade_legs')
        .update({
          quantity: updatedTrade.quantity,
          tolerance: updatedTrade.tolerance,
          loading_period_start: updatedTrade.loadingPeriodStart,
          loading_period_end: updatedTrade.loadingPeriodEnd,
          pricing_period_start: updatedTrade.pricingPeriodStart,
          pricing_period_end: updatedTrade.pricingPeriodEnd,
          pricing_formula: updatedTrade.formula,
          mtm_formula: updatedMtmFormula,
          buy_sell: updatedTrade.buySell,
          product: updatedTrade.product,
          sustainability: updatedTrade.sustainability,
          inco_term: updatedTrade.incoTerm,
          unit: updatedTrade.unit,
          payment_term: updatedTrade.paymentTerm,
          credit_status: updatedTrade.creditStatus,
          customs_status: updatedTrade.customsStatus,
          efp_premium: updatedTrade.efpPremium,
          efp_agreed_status: updatedTrade.efpAgreedStatus,
          efp_fixed_value: updatedTrade.efpFixedValue,
          efp_designated_month: updatedTrade.efpDesignatedMonth,
          pricing_type: updatedTrade.pricingType,
          comments: updatedTrade.comments,
          contract_status: updatedTrade.contractStatus,
          mtm_future_month: updatedTrade.mtmFutureMonth,
        })
        .eq('id', updatedTrade.id)
        .select();

      if (tradeUpdateError) {
        console.error('[PHYSICAL] Error updating trade:', tradeUpdateError);
        throw new Error(`Error updating trade: ${tradeUpdateError.message}`);
      }

      // Verify the update was successful by checking the returned data
      if (updatedData && updatedData[0]) {
        const result = updatedData[0];
        console.log('[PHYSICAL] Trade updated successfully. Verifying formulas:');
        
        // Safely access deeply nested properties with type checking
        const pricingFormula = result.pricing_formula as PricingFormula | null;
        const mtmFormula = result.mtm_formula as PricingFormula | null;
        
        console.log('[PHYSICAL] Pricing formula exposures:', pricingFormula?.exposures || 'No exposures found');
        console.log('[PHYSICAL] MTM formula exposures:', mtmFormula?.exposures || 'No exposures found');
      }

      return updatedTrade;
    },
    onSuccess: () => {
      toast.success('Trade updated successfully');
    },
    onError: (error: Error) => {
      console.error('[PHYSICAL] Trade update error:', error);
      toast.error('Failed to update trade', {
        description: error.message
      });
    }
  });

  return {
    updatePhysicalTrade
  };
};
