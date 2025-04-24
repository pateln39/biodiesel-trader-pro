import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PhysicalTrade, PricingFormula } from '@/types';
import { validateAndParsePricingFormula } from '@/utils/formulaUtils';
import { createEmptyExposureResult } from '@/utils/formulaCalculation';

export const usePhysicalTrades = () => {
  const { mutate: updatePhysicalTrade } = useMutation({
    mutationFn: async (updatedTrade: any) => {
      console.log('[PHYSICAL] Updating trade:', updatedTrade);
      console.log('[PHYSICAL] Original formula:', updatedTrade.formula);
      console.log('[PHYSICAL] Original mtmFormula:', updatedTrade.mtmFormula);

      // First validate and ensure proper formula structure for both formulas
      const validatedFormula = updatedTrade.formula 
        ? validateAndParsePricingFormula(updatedTrade.formula)
        : null;
      
      // Create a deep copy of the mtm formula to avoid reference issues
      const validatedMtmFormula = updatedTrade.mtmFormula 
        ? validateAndParsePricingFormula(updatedTrade.mtmFormula)
        : validatedFormula 
          ? { ...validatedFormula }
          : null;

      // If we have valid formulas, ensure the physical exposures are synced
      if (validatedFormula?.exposures?.physical && validatedMtmFormula) {
        console.log('[PHYSICAL] Syncing physical exposures from formula to mtmFormula');
        console.log('Original physical exposures:', validatedFormula.exposures.physical);
        
        // Ensure mtmFormula has a properly structured exposures object
        if (!validatedMtmFormula.exposures) {
          validatedMtmFormula.exposures = createEmptyExposureResult();
        }
        
        // Sync the physical exposures
        validatedMtmFormula.exposures.physical = { ...validatedFormula.exposures.physical };
        
        console.log('Synced mtmFormula physical exposures:', validatedMtmFormula.exposures.physical);
      }

      // Update parent trade with synced formulas - convert to JSON for Supabase
      const { data, error: tradeUpdateError } = await supabase
        .from('trade_legs')
        .update({
          quantity: updatedTrade.quantity,
          tolerance: updatedTrade.tolerance,
          loading_period_start: updatedTrade.loadingPeriodStart,
          loading_period_end: updatedTrade.loadingPeriodEnd,
          pricing_period_start: updatedTrade.pricingPeriodStart,
          pricing_period_end: updatedTrade.pricingPeriodEnd,
          pricing_formula: validatedFormula as any, // Type assertion to avoid JSON compatibility issue
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
        
        // Add detailed validation checks for formula sync
        const returnedFormula = updatedTradeData.pricing_formula 
          ? validateAndParsePricingFormula(updatedTradeData.pricing_formula)
          : null;
        
        const returnedMtmFormula = updatedTradeData.mtm_formula 
          ? validateAndParsePricingFormula(updatedTradeData.mtm_formula) 
          : null;

        // Log formula details
        console.log('[PHYSICAL] Updated formula details:', {
          hasFormula: !!returnedFormula,
          formulaExposures: returnedFormula?.exposures,
          hasMtmFormula: !!returnedMtmFormula,
          mtmFormulaExposures: returnedMtmFormula?.exposures
        });
        
        // Verify physical exposures are synced and log any discrepancies
        if (returnedFormula?.exposures?.physical && returnedMtmFormula?.exposures?.physical) {
          const physicalMatches = JSON.stringify(returnedFormula.exposures.physical) === 
                                JSON.stringify(returnedMtmFormula.exposures.physical);
          
          console.log('[PHYSICAL] Physical exposures sync status:', {
            synced: physicalMatches,
            formula: returnedFormula.exposures.physical,
            mtmFormula: returnedMtmFormula.exposures.physical
          });
          
          if (!physicalMatches) {
            console.warn('[PHYSICAL] Warning: Physical exposures are not synced after update!');
          }
        }
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
