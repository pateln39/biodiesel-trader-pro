
import { Instrument } from './common';

// Single month pricing distribution (e.g., { "Mar-24": 3000 })
export interface MonthlyDistribution {
  [monthCode: string]: number;
}

// Daily distribution type for on-the-fly calculations
export interface DailyDistribution {
  [dateString: string]: number; // e.g., "2023-03-15": 3000
}

// Daily distribution organized by instrument
export interface DailyDistributionByInstrument {
  [instrument: string]: DailyDistribution;
}

// Result type for exposure calculations
export interface ExposureResult {
  physical: Record<Instrument, number>;
  pricing: Record<Instrument, number>;
  paper?: Record<Instrument, number>; // Added for paper trade exposures
  monthlyDistribution?: Record<string, Record<string, number>>;
}

// Formula token types
export type TokenType = 'instrument' | 'fixedValue' | 'percentage' | 'operator' | 'openBracket' | 'closeBracket';

// Formula token interface
export interface FormulaToken {
  id: string;
  type: TokenType;
  value: string;
}

// Pricing formula interface
export interface PricingFormula {
  tokens: FormulaToken[];
  exposures: ExposureResult;
}

// Partial pricing formula for parsing
export interface PartialPricingFormula {
  tokens: FormulaToken[];
  exposures?: Partial<ExposureResult>;
}

// Price component interfaces
export interface FixedComponent {
  value: number;
  description: string;
}

// Price detail interfaces
export interface PriceDetail {
  instrumentComponents: Record<string, number>;
  fixedComponents: FixedComponent[];
  totalPrice: number;
}

export interface MTMPriceDetail {
  instrumentComponents: Record<string, number>;
  fixedComponents: FixedComponent[];
  totalPrice: number;
}
