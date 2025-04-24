import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PhysicalTrade, PricingFormula, FormulaToken } from '@/types';
import { validateAndParsePricingFormula } from '@/utils/formulaUtils';
import { createEmptyExposureResult, calculateExposures, parseFormula } from '@/utils/formulaCalculation';

export const usePhysicalTrades = () => {
  const { mutate: updatePhysicalTrade } = useMutation({
    mutationFn: async (updatedTrade: any) => {
      console.log('[PHYSICAL] Updating trade:', updatedTrade);
      
      // First validate and ensure proper formula structure for both formulas
      const validatedPricingFormula = updatedTrade.formula 
        ? validateAndParsePricingFormula(updatedTrade.formula)
        : null;
      
      // Create a deep copy of the mtm formula to avoid reference issues
      const validatedMtmFormula = updatedTrade.mtmFormula 
        ? validateAndParsePricingFormula(updatedTrade.mtmFormula)
        : null;

      console.log('[PHYSICAL] Validated pricing formula:', validatedPricingFormula);
      console.log('[PHYSICAL] Validated MTM formula:', validatedMtmFormula);

      // Now calculate the appropriate exposure types for each formula
      
      // For pricing formula - only calculate pricing exposures
      if (validatedPricingFormula?.tokens?.length > 0) {
        console.log('[PHYSICAL] Calculating pricing exposures from pricing formula');
        
        // Ensure we have a properly structured exposures object
        if (!validatedPricingFormula.exposures) {
          validatedPricingFormula.exposures = createEmptyExposureResult();
        }
        
        // Calculate pricing exposure based on pricing formula
        const pricingExposure = calculateExposures(
          validatedPricingFormula.tokens,
          updatedTrade.quantity,
          updatedTrade.buySell,
          updatedTrade.product
        ).pricing;
        
        console.log('[PHYSICAL] Calculated pricing exposures:', pricingExposure);
        
        // Only keep the pricing exposures in the pricing formula
        validatedPricingFormula.exposures = {
          pricing: pricingExposure,
          physical: {} // Empty physical exposures for pricing formula
        };
      }
      
      // For MTM formula - only calculate physical exposures
      if (validatedMtmFormula?.tokens?.length > 0) {
        console.log('[PHYSICAL] Calculating physical exposures from MTM formula');
        
        // Ensure we have a properly structured exposures object
        if (!validatedMtmFormula.exposures) {
          validatedMtmFormula.exposures = createEmptyExposureResult();
        }
        
        // Calculate physical exposure based on MTM formula
        const physicalExposure = calculateExposures(
          validatedMtmFormula.tokens,
          updatedTrade.quantity,
          updatedTrade.buySell,
          updatedTrade.product
        ).physical;
        
        console.log('[PHYSICAL] Calculated physical exposures from MTM formula:', physicalExposure);
        
        // Only keep the physical exposures in the MTM formula
        validatedMtmFormula.exposures = {
          physical: physicalExposure,
          pricing: {} // Empty pricing exposures for MTM formula
        };
      }
      // If MTM formula is null/empty but pricing formula exists, use pricing formula tokens
      // to calculate physical exposure as a fallback
      else if (!validatedMtmFormula?.tokens?.length && validatedPricingFormula?.tokens?.length > 0) {
        console.log('[PHYSICAL] Using pricing formula to calculate physical exposures for empty MTM formula');
        
        // Create empty MTM formula if it doesn't exist
        if (!validatedMtmFormula) {
          validatedMtmFormula = {
            tokens: [],
            exposures: createEmptyExposureResult()
          };
        }
        
        // Calculate physical exposure based on pricing formula
        const physicalExposure = calculateExposures(
          validatedPricingFormula.tokens,
          updatedTrade.quantity,
          updatedTrade.buySell,
          updatedTrade.product
        ).physical;
        
        console.log('[PHYSICAL] Calculated fallback physical exposures:', physicalExposure);
        
        // Only store physical exposures in the MTM formula
        validatedMtmFormula.exposures = {
          physical: physicalExposure,
          pricing: {} // Empty pricing exposures
        };
      }
      
      console.log('[PHYSICAL] Final pricing formula exposures:', 
        validatedPricingFormula?.exposures
      );
      console.log('[PHYSICAL] Final MTM formula exposures:', 
        validatedMtmFormula?.exposures
      );

      // Update parent trade with the properly structured formulas
      const { data, error: tradeUpdateError } = await supabase
        .from('trade_legs')
        .update({
          quantity: updatedTrade.quantity,
          tolerance: updatedTrade.tolerance,
          loading_period_start: updatedTrade.loadingPeriodStart,
          loading_period_end: updatedTrade.loadingPeriodEnd,
          pricing_period_start: updatedTrade.pricingPeriodStart,
          pricing_period_end: updatedTrade.pricingPeriodEnd,
          pricing_formula: validatedPricingFormula as any, // Type assertion to avoid JSON compatibility issue
          mtm_formula: validatedMtmFormula as any, // Type assertion to avoid JSON compatibility issue
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

      // After successful update, validate the returned data
      const updatedTradeData = data?.[0];
      if (updatedTradeData) {
        console.log('[PHYSICAL] Trade updated successfully:', updatedTradeData);
        
        // Add detailed validation checks for the updated trade
        const returnedPricingFormula = updatedTradeData.pricing_formula 
          ? validateAndParsePricingFormula(updatedTradeData.pricing_formula)
          : null;
        
        const returnedMtmFormula = updatedTradeData.mtm_formula 
          ? validateAndParsePricingFormula(updatedTradeData.mtm_formula) 
          : null;

        // Log formula details
        console.log('[PHYSICAL] Updated pricing formula details:', {
          hasFormula: !!returnedPricingFormula,
          formulaTokens: returnedPricingFormula?.tokens,
          formulaExposures: returnedPricingFormula?.exposures
        });
        
        console.log('[PHYSICAL] Updated MTM formula details:', {
          hasFormula: !!returnedMtmFormula,
          formulaTokens: returnedMtmFormula?.tokens,
          formulaExposures: returnedMtmFormula?.exposures
        });
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
