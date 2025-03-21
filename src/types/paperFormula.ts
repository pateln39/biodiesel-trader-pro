
import { Instrument, OperatorType } from './common';

// Paper formula types
export interface PaperFormulaNode {
  id: string;
  type: "instrument" | "fixedValue" | "operator" | "group" | "percentage" | "openBracket" | "closeBracket";
  value: string;
  children?: PaperFormulaNode[];
}

export interface PaperFormulaToken {
  id: string;
  type: "instrument" | "fixedValue" | "operator" | "percentage" | "openBracket" | "closeBracket";
  value: string;
}

export interface PaperExposureResult {
  physical: Record<Instrument, number>;
  pricing: Record<Instrument, number>;
}

export interface PaperPricingFormula {
  tokens: PaperFormulaToken[];
  exposures: PaperExposureResult;
}

// Utility type to handle potentially incomplete data from the database
export type PartialPaperExposureResult = {
  physical?: Partial<Record<Instrument, number>>;
  pricing?: Partial<Record<Instrument, number>>;
};

export type PartialPaperPricingFormula = {
  tokens: PaperFormulaToken[];
  exposures?: PartialPaperExposureResult;
};

// Define FixedComponent type for formula analysis
export interface PaperFixedComponent {
  value: number;
  displayValue: string;
}

// Enhanced price detail interfaces for paper trades
export interface PaperPriceDetail {
  instruments: Record<Instrument, { average: number; prices: { date: Date; price: number }[] }>;
  evaluatedPrice: number;
  fixedComponents?: PaperFixedComponent[]; 
}

export interface PaperMTMPriceDetail {
  instruments: Record<Instrument, { price: number; date: Date | null }>;
  evaluatedPrice: number;
  fixedComponents?: PaperFixedComponent[]; 
}
