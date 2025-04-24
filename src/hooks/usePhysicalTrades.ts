
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PhysicalTrade, PricingFormula } from '@/types';
import { validateAndParsePricingFormula } from '@/utils/formulaUtils';

export const usePhysicalTrades = () => {
  const { mutate: updatePhysicalTrade } = useMutation({
    mutationFn: async (updatedTrade: any) => {
      console.log('[PHYSICAL] Updating trade:', updatedTrade);

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
        
        // Ensure mtmFormula has an exposures object
        validatedMtmFormula.exposures = validatedMtmFormula.exposures || {};
        
        // Sync the physical exposures
        validatedMtmFormula.exposures.physical = { ...validatedFormula.exposures.physical };
        
        console.log('Synced mtmFormula physical exposures:', validatedMtmFormula.exposures.physical);
      }

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
          pricing_formula: validatedFormula,
          mtm_formula: validatedMtmFormula,
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
        
        // Validate that the formulas were correctly synced
        const returnedFormula = updatedTradeData.pricing_formula 
          ? validateAndParsePricingFormula(updatedTradeData.pricing_formula)
          : null;
        
        const returnedMtmFormula = updatedTradeData.mtm_formula 
          ? validateAndParsePricingFormula(updatedTradeData.mtm_formula) 
          : null;

        // Log the validation results
        console.log('[PHYSICAL] Updated formula:', returnedFormula);
        console.log('[PHYSICAL] Updated mtmFormula:', returnedMtmFormula);
        
        // Verify physical exposures are synced
        if (returnedFormula?.exposures?.physical && returnedMtmFormula?.exposures?.physical) {
          console.log('[PHYSICAL] Verifying physical exposures sync:');
          console.log('Formula physical:', returnedFormula.exposures.physical);
          console.log('MtmFormula physical:', returnedMtmFormula.exposures.physical);
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
