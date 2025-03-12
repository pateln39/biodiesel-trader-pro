
import { Instrument, OperatorType } from './common';

export interface FormulaNode {
  id: string;
  type: "instrument" | "fixedValue" | "operator" | "group";
  value: string;
  children?: FormulaNode[];
}

export interface FormulaToken {
  id: string;
  type: "instrument" | "fixedValue" | "operator";
  value: string;
}

export interface PricingFormula {
  tokens: FormulaToken[];
  exposures: Record<Instrument, number>;
}

export interface PricingComponent {
  instrument: Instrument;
  percentage: number;
  adjustment: number;
}
