
import { Instrument, FixedComponent, ExposureResult, MonthlyDistribution } from './common';

export interface MTMPriceDetail {
  instruments: Record<Instrument, { price: number; date: Date | null }>;
  evaluatedPrice: number;
  fixedComponents?: FixedComponent[];
  futureMonth?: string;
}

export interface PriceDetail {
  instruments: Record<Instrument, { average: number; prices: { date: Date; price: number }[] }>;
  evaluatedPrice: number;
  fixedComponents?: FixedComponent[];
  futureMonth?: string;
}

// Formula token types
export type FormulaTokenType = 'instrument' | 'percentage' | 'fixedValue' | 'operator' | 'openBracket' | 'closeBracket';

// Formula token interface
export interface FormulaToken {
  id: string;
  type: FormulaTokenType;
  value: string;
}

// Pricing formula interface
export interface PricingFormula {
  tokens: FormulaToken[];
  exposures: ExposureResult;
  monthlyDistribution?: MonthlyDistribution;
}
