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
  paper?: Record<Instrument, number>; 
  monthlyDistribution?: Record<string, MonthlyDistribution>;
}

// Formula token types
export type TokenType = 'instrument' | 'fixedValue' | 'percentage' | 'operator' | 'openBracket' | 'closeBracket';

// Formula token structure
export interface FormulaToken {
  id: string;
  type: TokenType;
  value: string;
}

// Formula structure with tokens and exposures
export interface PricingFormula {
  tokens: FormulaToken[];
  exposures: ExposureResult;
}

// Partial formula structure for validation
export interface PartialPricingFormula {
  tokens: FormulaToken[];
  exposures?: Partial<ExposureResult>;
}

// Fixed component in a pricing formula
export interface FixedComponent {
  value: number;
  displayValue: string;
}

// Price detail for a specific instrument
export interface InstrumentPriceDetail {
  average: number;
  prices: { date: Date; price: number }[];
}

// Price detail for MTM calculations
export interface InstrumentMTMPriceDetail {
  price: number;
  date: Date | null;
}

// Price detail structure for reporting
export interface PriceDetail {
  instruments: Record<Instrument, InstrumentPriceDetail>;
  evaluatedPrice: number;
  fixedComponents?: FixedComponent[];
}

// MTM price detail structure
export interface MTMPriceDetail {
  instruments: Record<Instrument, InstrumentMTMPriceDetail>;
  evaluatedPrice: number;
  fixedComponents?: FixedComponent[];
}
