
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PhysicalTrade, PricingFormula } from '@/types';
import { validateAndParsePricingFormula } from '@/utils/formulaUtils';

export const usePhysicalTrades = () => {
  const { mutate: updatePhysicalTrade } = useMutation({
    mutationFn: async (updatedTrade: any) => {
      console.log('[PHYSICAL] Updating trade:', updatedTrade);

      // Validate and ensure proper formula structure
      const validatedFormula = updatedTrade.formula ? { ...updatedTrade.formula } : null;
      const validatedMtmFormula = updatedTrade.mtmFormula ? { ...updatedTrade.mtmFormula } : null;

      // Make sure we sync exposures between formula and mtmFormula
      if (validatedFormula && validatedFormula.exposures && validatedMtmFormula) {
        console.log('[PHYSICAL] Syncing exposures from formula to mtmFormula');
        validatedMtmFormula.exposures = { ...validatedFormula.exposures };
      }

      // Update parent trade
      const { data, error: tradeUpdateError } = await supabase
        .from('trade_legs')
        .update({
          quantity: updatedTrade.quantity,
          tolerance: updatedTrade.tolerance,
          loading_period_start: updatedTrade.loadingPeriodStart,
          loading_period_end: updatedTrade.loadingPeriodEnd,
          pricing_period_start: updatedTrade.pricingPeriodStart,
          pricing_period_end: updatedTrade.pricingPeriodEnd,
          formula: validatedFormula,
          // Ensure mtm_formula gets the same exposure values as formula
          mtm_formula: validatedMtmFormula,
          // Update other fields...
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
          pricing_formula: validatedFormula,
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
        // Access the correct property names from Supabase response
        const returnedFormula = updatedTradeData.pricing_formula 
          ? validateAndParsePricingFormula(updatedTradeData.pricing_formula)
          : null;
        
        const returnedMtmFormula = updatedTradeData.mtm_formula 
          ? validateAndParsePricingFormula(updatedTradeData.mtm_formula) 
          : null;

        console.log('[PHYSICAL] Updated formula:', returnedFormula);
        console.log('[PHYSICAL] Updated mtmFormula:', returnedMtmFormula);
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
