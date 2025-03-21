
import { Instrument, OperatorType } from './common';
import { PaperFormulaToken, PaperExposureResult, PaperPricingFormula, PaperFixedComponent } from './paperFormula';

// Re-export the paper formula types for backward compatibility
export type { 
  PaperFormulaToken as FormulaToken,
  PaperExposureResult as ExposureResult,
  PaperPricingFormula as PricingFormula,
  PaperFixedComponent as FixedComponent
};

// Enhanced price detail interfaces
export interface PriceDetail {
  instruments: Record<Instrument, { average: number; prices: { date: Date; price: number }[] }>;
  evaluatedPrice: number;
  fixedComponents?: PaperFixedComponent[]; // Make this optional to maintain backward compatibility
}

export interface MTMPriceDetail {
  instruments: Record<Instrument, { price: number; date: Date | null }>;
  evaluatedPrice: number;
  fixedComponents?: PaperFixedComponent[]; // Make this optional to maintain backward compatibility
}

// Create aliases to ensure backward compatibility
export { PaperFormulaNode as FormulaNode } from './paperFormula';
export { PartialPaperExposureResult as PartialExposureResult } from './paperFormula';
export { PartialPaperPricingFormula as PartialPricingFormula } from './paperFormula';
