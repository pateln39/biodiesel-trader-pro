

import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PhysicalTrade, PricingFormula } from '@/types';
import { validateAndParsePricingFormula, createEmptyFormula } from '@/utils/formulaUtils';
import { createEmptyExposureResult, calculateExposures, calculateDailyPricingDistribution } from '@/utils/formulaCalculation';
import { updateFormulaWithEfpExposure } from '@/utils/efpFormulaUtils';

export const usePhysicalTrades = () => {
  const { mutate: updatePhysicalTrade } = useMutation({
    mutationFn: async (updatedTrade: any) => {
      console.log('[PHYSICAL] Updating trade:', updatedTrade);

      // First validate and ensure proper formula structure for the pricing formula
      let validatedFormula: PricingFormula;
      if (updatedTrade.formula) {
        validatedFormula = validateAndParsePricingFormula(updatedTrade.formula);
      } else {
        validatedFormula = createEmptyFormula();
      }
      
      // Get the MTM formula tokens and physical exposures
      let mtmTokens = [];
      let physicalExposures = {};
      
      if (updatedTrade.mtmFormula) {
        // Parse the MTM formula to extract its tokens and physical exposures
        const mtmFormulaObj = validateAndParsePricingFormula(updatedTrade.mtmFormula);
        mtmTokens = mtmFormulaObj.tokens || [];
        
        // Calculate physical exposures with MTM formula tokens
        const mtmExposures = calculateExposures(
          mtmTokens, 
          updatedTrade.quantity, 
          updatedTrade.buySell,
          updatedTrade.product
        );
        
        physicalExposures = mtmExposures.physical || {};
        
        console.log('[PHYSICAL] Extracted MTM tokens and physical exposures:', { 
          mtmTokens, 
          physicalExposures 
        });
      }
      
      // Handle special case for EFP pricing type
      let dailyDistribution = {};
      if (updatedTrade.pricingType === 'efp' && !updatedTrade.efpAgreedStatus) {
        // For EFP trades, use the updateFormulaWithEfpExposure function
        const efpFormula = updateFormulaWithEfpExposure(
          validatedFormula,
          updatedTrade.quantity,
          updatedTrade.buySell,
          updatedTrade.efpAgreedStatus,
          updatedTrade.efpDesignatedMonth
        );
        
        // Extract the dailyDistribution from the EFP formula
        dailyDistribution = efpFormula.dailyDistribution || {};
        
        // Update validatedFormula with EFP-specific values
        validatedFormula = efpFormula;
        
        console.log('[PHYSICAL] Generated EFP daily distribution:', dailyDistribution);
      }
      // Calculate daily pricing distribution if standard pricing with tokens
      else if (updatedTrade.formula?.tokens?.length > 0 && 
          updatedTrade.pricingPeriodStart && 
          updatedTrade.pricingPeriodEnd) {
        
        dailyDistribution = calculateDailyPricingDistribution(
          updatedTrade.formula.tokens,
          updatedTrade.quantity,
          updatedTrade.buySell,
          new Date(updatedTrade.pricingPeriodStart),
          new Date(updatedTrade.pricingPeriodEnd)
        );
        
        console.log('[PHYSICAL] Calculated daily distribution:', dailyDistribution);
      }
      
      // Consolidate everything into the pricing_formula
      const consolidatedFormula = {
        ...validatedFormula,
        mtmTokens: mtmTokens,
        exposures: {
          pricing: validatedFormula.exposures?.pricing || {},
          physical: physicalExposures
        },
        dailyDistribution: dailyDistribution // Add the daily distribution
      };
      
      console.log('[PHYSICAL] Consolidated formula:', consolidatedFormula);

      // For backward compatibility, keep the mtm_formula but it's no longer the primary source
      const mtmFormulaForDb = updatedTrade.mtmFormula ? 
        validateAndParsePricingFormula(updatedTrade.mtmFormula) : 
        createEmptyFormula();

      // Update parent trade with consolidated formula
      const { data, error: tradeUpdateError } = await supabase
        .from('trade_legs')
        .update({
          quantity: updatedTrade.quantity,
          tolerance: updatedTrade.tolerance,
          loading_period_start: updatedTrade.loadingPeriodStart,
          loading_period_end: updatedTrade.loadingPeriodEnd,
          pricing_period_start: updatedTrade.pricingPeriodStart,
          pricing_period_end: updatedTrade.pricingPeriodEnd,
          pricing_formula: consolidatedFormula as any,
          mtm_formula: mtmFormulaForDb as any, // Keep for backward compatibility temporarily
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
