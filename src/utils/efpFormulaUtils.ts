
import { PricingFormula } from '@/types/pricing';
import { BuySell } from '@/types';
import { createEmptyExposureResult } from './formulaCalculation';

/**
 * Create a formula object specifically for EFP trades
 * This is needed because EFP trades don't use the traditional formula builder
 * but still need to maintain proper exposure tracking
 */
export const createEfpFormula = (
  quantity: number,
  buySell: BuySell,
  isAgreed: boolean,
  designatedMonth: string
): PricingFormula => {
  // Create base formula structure
  const formula: PricingFormula = {
    tokens: [], // EFP trades don't use formula tokens
    exposures: createEmptyExposureResult(),
    // We don't create monthlyDistribution for EFP because it's handled directly in exposureUtils.ts
  };
  
  // Set the appropriate exposure only for unagreed EFPs
  // For EFP, we track exposure in ICE GASOIL FUTURES (EFP) only
  if (!isAgreed) {
    // The exposure direction is opposite of the physical trade
    // Buy physical = sell futures = negative pricing exposure
    // Sell physical = buy futures = positive pricing exposure
    const exposureDirection = buySell === 'buy' ? -1 : 1;
    const exposureValue = quantity * exposureDirection;
    
    // Set the exposure - use the consistent 'ICE GASOIL FUTURES (EFP)' name
    formula.exposures.pricing['ICE GASOIL FUTURES (EFP)'] = exposureValue;
  }
  
  return formula;
};

/**
 * Update an existing formula with EFP-specific exposure
 */
export const updateFormulaWithEfpExposure = (
  formula: PricingFormula | undefined,
  quantity: number,
  buySell: BuySell,
  isAgreed: boolean
): PricingFormula => {
  if (!formula) {
    return createEfpFormula(quantity, buySell, isAgreed, '');
  }
  
  // Reset existing EFP exposures
  const updatedFormula = { ...formula };
  updatedFormula.exposures = { ...updatedFormula.exposures };
  updatedFormula.exposures.pricing = { ...updatedFormula.exposures.pricing };
  
  // Reset both EFP instruments to avoid contamination
  updatedFormula.exposures.pricing['ICE GASOIL FUTURES'] = 0;
  updatedFormula.exposures.pricing['ICE GASOIL FUTURES (EFP)'] = 0;
  
  // Only set exposure for unagreed EFPs
  if (!isAgreed) {
    // The exposure direction is opposite of the physical trade
    const exposureDirection = buySell === 'buy' ? -1 : 1;
    const exposureValue = quantity * exposureDirection;
    
    // Set the exposure - use the consistent 'ICE GASOIL FUTURES (EFP)' name
    updatedFormula.exposures.pricing['ICE GASOIL FUTURES (EFP)'] = exposureValue;
  }
  
  return updatedFormula;
};
