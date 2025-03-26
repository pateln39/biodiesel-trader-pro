
import { Instrument, OperatorType } from './common';

export interface FormulaNode {
  id: string;
  type: "instrument" | "fixedValue" | "operator" | "group" | "percentage" | "openBracket" | "closeBracket";
  value: string;
  children?: FormulaNode[];
}

export interface FormulaToken {
  id: string;
  type: "instrument" | "fixedValue" | "operator" | "percentage" | "openBracket" | "closeBracket";
  value: string;
}

export interface MonthlyDistribution {
  [monthCode: string]: number; // e.g., "Mar-24": 363.63
}

export interface DailyDistribution {
  [dayCode: string]: number; // e.g., "2024-03-15": 30.25
}

export interface ExposureResult {
  physical: Record<Instrument, number>;
  pricing: Record<Instrument, number>;
  monthlyDistribution?: Record<Instrument, MonthlyDistribution>;
  dailyDistribution?: Record<Instrument, DailyDistribution>;
}

// Utility type to handle potentially incomplete data from the database
export type PartialExposureResult = {
  physical?: Partial<Record<Instrument, number>>;
  pricing?: Partial<Record<Instrument, number>>;
  monthlyDistribution?: Partial<Record<Instrument, Partial<MonthlyDistribution>>>;
  dailyDistribution?: Partial<Record<Instrument, Partial<DailyDistribution>>>;
};

export type PartialPricingFormula = {
  tokens: FormulaToken[];
  exposures?: PartialExposureResult;
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
  fixedComponents?: FixedComponent[]; // Make this optional to maintain backward compatibility
}

export interface MTMPriceDetail {
  instruments: Record<Instrument, { price: number; date: Date | null }>;
  evaluatedPrice: number;
  fixedComponents?: FixedComponent[]; // Make this optional to maintain backward compatibility
}
