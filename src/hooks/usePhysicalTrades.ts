
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PhysicalTrade, PricingFormula } from '@/types';
import { validateAndParsePricingFormula } from '@/utils/formulaUtils';
import { createEmptyExposureResult, calculateExposures, calculatePhysicalExposure } from '@/utils/formulaCalculation';

export const usePhysicalTrades = () => {
  const { mutate: updatePhysicalTrade } = useMutation({
    mutationFn: async (updatedTrade: any) => {
      console.log('[PHYSICAL] Updating trade:', updatedTrade);

      // First validate and ensure proper formula structure for both formulas
      let validatedFormula: PricingFormula;
      if (updatedTrade.formula) {
        validatedFormula = validateAndParsePricingFormula(updatedTrade.formula);
      } else {
        validatedFormula = createEmptyExposureResult() as PricingFormula;
      }
      
      // Create a deep copy of the formula for MTM to avoid reference issues
      let validatedMtmFormula: PricingFormula;
      if (updatedTrade.mtmFormula) {
        validatedMtmFormula = validateAndParsePricingFormula(updatedTrade.mtmFormula);
      } else if (validatedFormula) {
        // Deep clone the validatedFormula for mtmFormula
        validatedMtmFormula = JSON.parse(JSON.stringify(validatedFormula));
      } else {
        validatedMtmFormula = createEmptyExposureResult() as PricingFormula;
      }

      // Calculate physical exposures based on MTM formula tokens
      const mtmExposures = calculateExposures(
        validatedMtmFormula.tokens || [], 
        updatedTrade.quantity, 
        updatedTrade.buySell,
        updatedTrade.product
      );

      console.log('[PHYSICAL] Calculated MTM exposures:', mtmExposures);

      // Update MTM formula exposures
      validatedMtmFormula.exposures = mtmExposures;

      // Sync physical exposures from MTM formula to pricing formula
      if (validatedFormula && validatedMtmFormula.exposures?.physical) {
        if (!validatedFormula.exposures) {
          validatedFormula.exposures = createEmptyExposureResult();
        }
        
        validatedFormula.exposures = {
          ...validatedFormula.exposures,
          physical: { ...validatedMtmFormula.exposures.physical }
        };
      }

      console.log('[PHYSICAL] Final formulas after exposure sync:');
      console.log('Pricing Formula:', validatedFormula);
      console.log('MTM Formula:', validatedMtmFormula);

      // Update parent trade with synced formulas
      const { data, error: tradeUpdateError } = await supabase
        .from('trade_legs')
        .update({
          quantity: updatedTrade.quantity,
          tolerance: updatedTrade.tolerance,
          loading_period_start: updatedTrade.loadingPeriodStart,
          loading_period_end: updatedTrade.loadingPeriodEnd,
          pricing_period_start: updatedTrade.pricingPeriodStart,
          pricing_period_end: updatedTrade.pricingPeriodEnd,
          pricing_formula: validatedFormula as any,
          mtm_formula: validatedMtmFormula as any,
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
        throw new Error(`Error updating trade: ${tradeUpdateError.message}`);
      }

      return updatedTrade;
    },
    onSuccess: () => {
      toast.success('Trade updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update trade', {
        description: error.message
      });
    }
  });

  return {
    updatePhysicalTrade
  };
};
