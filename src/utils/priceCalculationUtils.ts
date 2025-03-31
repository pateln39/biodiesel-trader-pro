import { PhysicalTradeLeg, MTMPriceDetail } from '@/types';
import { evaluateFormula } from './formulaUtils';
import { fetchPreviousDayPrice } from './efpUtils';

// Update calculateMTMPrice to handle EFP legs
export const calculateMTMPrice = async (
  leg: PhysicalTradeLeg,
  currentPrices: Record<string, number>
): Promise<{ price: number; details: MTMPriceDetail }> => {
  // Check if this is an EFP leg
  if (leg.efpPremium !== undefined) {
    const details: MTMPriceDetail = {
      instruments: {},
      evaluatedPrice: 0,
      fixedComponents: []
    };
    
    // Handle EFP pricing
    if (leg.efpAgreedStatus) {
      // For agreed EFP, use fixed value + premium
      if (leg.efpFixedValue !== undefined) {
        details.evaluatedPrice = leg.efpFixedValue + leg.efpPremium;
        details.fixedComponents = [
          { value: leg.efpFixedValue, displayValue: `EFP Fixed: ${leg.efpFixedValue}` },
          { value: leg.efpPremium, displayValue: `Premium: ${leg.efpPremium}` }
        ];
      } else {
        // Missing fixed value
        details.evaluatedPrice = leg.efpPremium || 0;
        details.fixedComponents = [
          { value: leg.efpPremium || 0, displayValue: `Premium: ${leg.efpPremium}` }
        ];
      }
    } else {
      // For unagreed EFP, use previous day's price + premium
      const gasoilPrice = await fetchPreviousDayPrice('ICE_GASOIL');
      
      if (gasoilPrice) {
        details.instruments['ICE GASOIL FUTURES'] = {
          price: gasoilPrice.price,
          date: gasoilPrice.date
        };
        
        details.evaluatedPrice = gasoilPrice.price + (leg.efpPremium || 0);
        details.fixedComponents = [
          { value: leg.efpPremium || 0, displayValue: `Premium: ${leg.efpPremium}` }
        ];
      } else {
        // No price available
        details.evaluatedPrice = leg.efpPremium || 0;
        details.fixedComponents = [
          { value: leg.efpPremium || 0, displayValue: `Premium: ${leg.efpPremium}` }
        ];
      }
    }
    
    return { price: details.evaluatedPrice, details };
  }
  
  // Original formula evaluation logic for non-EFP legs
  let formulaResult: { price: number; details: MTMPriceDetail } | null = null;

  if (leg.formula) {
    try {
      formulaResult = await evaluateFormula(leg.formula, currentPrices);
    } catch (error) {
      console.error("Error evaluating formula:", error);
      return { price: 0, details: { instruments: {}, evaluatedPrice: 0, fixedComponents: [] } };
    }
  }

  if (!formulaResult) {
    return { price: 0, details: { instruments: {}, evaluatedPrice: 0, fixedComponents: [] } };
  }

  return formulaResult;
};
