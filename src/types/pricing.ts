
import { Instrument, OperatorType } from './common';

export interface FormulaNode {
  id: string;
  type: "instrument" | "fixedValue" | "operator" | "group" | "percentage" | "bracket";
  value: string;
  children?: FormulaNode[];
}

export interface FormulaToken {
  id: string;
  type: "instrument" | "fixedValue" | "operator" | "percentage" | "openBracket" | "closeBracket";
  value: string;
}

export interface PricingFormula {
  tokens: FormulaToken[];
  exposures: Record<Instrument, { physical: number; pricing: number }>;
}

export interface PricingComponent {
  instrument: Instrument;
  percentage: number;
  adjustment: number;
}
