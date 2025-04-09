
import { PricingFormula } from '@/types/pricing';
import { BuySell } from '@/types/physical';
import { createEmptyExposureResult } from './formulaCalculation';

/**
 * Creates an EFP formula object for the given parameters
 */
export const createEfpFormula = (
  quantity: number,
  buySell: BuySell,
  isAgreed: boolean,
  designatedMonth?: string
): PricingFormula => {
  // For EFP trades, we're not actually using a dynamic formula with tokens
  // So we just return an empty formula structure with the proper exposure type
  return {
    tokens: [],
    exposures: createEmptyExposureResult()
  };
};

/**
 * Generates display text for EFP formulas based on the parameters
 */
export const generateEfpFormulaDisplay = (
  efpAgreedStatus: boolean,
  efpFixedValue: number | null | undefined,
  efpPremium: number | null | undefined,
  efpDesignatedMonth?: string
): string => {
  if (efpAgreedStatus) {
    // For agreed EFP trades, show the calculated total value
    const fixedValue = efpFixedValue || 0;
    const premium = efpPremium || 0;
    return `${fixedValue + premium}`;
  } else {
    // For unagreed EFP trades, show "ICE GASOIL FUTURES (month) + premium"
    const designatedMonth = efpDesignatedMonth ? ` (${efpDesignatedMonth})` : '';
    return `ICE GASOIL FUTURES${designatedMonth} + ${efpPremium || 0}`;
  }
};

/**
 * Updates a formula with EFP exposure calculations
 */
export const updateFormulaWithEfpExposure = (
  formula: PricingFormula,
  quantity: number,
  buySell: BuySell
): PricingFormula => {
  // Future implementation for EFP exposure calculations
  return formula;
};
