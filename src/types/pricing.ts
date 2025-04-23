
import { Instrument, OperatorType, ExposureResult } from './common';

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
  display?: string;
}

// Update the MonthlyDistribution to handle both simple and nested formats
// Ensure monthCode is in the format "MMM-YY"
export interface MonthlyDistribution {
  [instrumentOrMonthCode: string]: number | Record<string, number>;
}

export interface PricingFormula {
  tokens: FormulaToken[];
  exposures: ExposureResult;
  monthlyDistribution?: MonthlyDistribution;
  result?: number;
}

// Utility type to handle potentially incomplete data from the database
export type PartialExposureResult = {
  physical?: Partial<Record<Instrument, number>>;
  pricing?: Partial<Record<Instrument, number>>;
};

export type PartialPricingFormula = {
  tokens: FormulaToken[];
  exposures?: PartialExposureResult;
  monthlyDistribution?: MonthlyDistribution;
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
  // Include compatibility fields with the index.ts PriceDetail
  date?: string;
  price?: number;
  instrument_id?: string;
  instrument_code?: string;
}

export interface MTMPriceDetail {
  instruments: Record<Instrument, { price: number; date: Date | null }>;
  evaluatedPrice: number;
  fixedComponents?: FixedComponent[];
  // Include compatibility fields with the index.ts MTMPriceDetail
  date?: string;
  price?: number;
  mtm_price?: number;
  delta?: number;
  mtm_date?: string;
  instrument_id?: string;
  instrument_code?: string;
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
