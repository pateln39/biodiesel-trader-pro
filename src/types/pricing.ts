
import { Instrument, OperatorType, ExposureResult } from './common';

// Add PricingInstrument interface that was removed from exposure.ts
export interface PricingInstrument {
  id: string;
  display_name: string;
  instrument_code: string;
  is_active: boolean;
}

export interface FormulaNode {
  id: string;
  type: "instrument" | "fixedValue" | "operator" | "group" | "percentage" | "openBracket" | "closeBracket";
  value: string;
  children?: FormulaNode[];
}

export interface FormulaToken {
  id?: string;
  type: "instrument" | "fixedValue" | "operator" | "percentage" | "openBracket" | "closeBracket" | "parenthesis" | "number" | "variable";
  value: string | number;
}

// Daily distribution format: {[date: string]: number}
export interface DailyDistribution {
  [instrumentOrDate: string]: number | Record<string, number>;
}

// Update the MonthlyDistribution to handle both simple and nested formats
// Ensure monthCode is in the format "MMM-YY"
export interface MonthlyDistribution {
  [instrumentOrMonthCode: string]: number | Record<string, number>;
}

export interface PricingFormula {
  tokens: FormulaToken[];
  mtmTokens?: FormulaToken[]; // Added mtmTokens property
  exposures: ExposureResult;
  monthlyDistribution?: MonthlyDistribution;
  dailyDistribution?: DailyDistribution; // Property for daily distribution
  paperDailyDistribution?: Record<string, Record<string, number>>; // New property for paper daily distribution
  pricingDailyDistribution?: Record<string, Record<string, number>>; // New property for pricing daily distribution
  result?: number;
}

// Utility type to handle potentially incomplete data from the database
export type PartialExposureResult = {
  physical?: Partial<Record<Instrument, number>>;
  pricing?: Partial<Record<Instrument, number>>;
};

export type PartialPricingFormula = {
  tokens: FormulaToken[];
  mtmTokens?: FormulaToken[]; // Added mtmTokens property
  exposures?: PartialExposureResult;
  monthlyDistribution?: MonthlyDistribution;
  dailyDistribution?: DailyDistribution; // Add to partial type as well
  paperDailyDistribution?: Record<string, Record<string, number>>; // Add to partial type as well
  pricingDailyDistribution?: Record<string, Record<string, number>>; // Add to partial type as well
};

// Define FixedComponent type for formula analysis
export interface FixedComponent {
  value: number;
  displayValue: string;
}

// Enhanced price detail interfaces
export interface PriceDetail {
  instruments: Record<Instrument, { average: number; prices: { date: Date; price: number }[] }>;
  evaluatedPrice: number;
  fixedComponents?: FixedComponent[];
}

export interface MTMPriceDetail {
  instruments: Record<Instrument, { price: number; date: Date | null }>;
  evaluatedPrice: number;
  fixedComponents?: FixedComponent[];
}

// Add PricingComponent interface which is referenced in imports but was missing
export interface PricingComponent {
  type: string;
  value: string | number;
  instrument?: Instrument;
  operator?: OperatorType;
}

// Re-export OperatorType for external usage
export type { OperatorType };
