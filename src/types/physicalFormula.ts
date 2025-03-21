
import { Instrument } from './common';

// Physical formula types
export interface PhysicalFormulaToken {
  type: "number" | "operator" | "variable" | "function";
  value: string | number;
}

export interface PhysicalFormulaConfig {
  tokens: PhysicalFormulaToken[];
}

// Define the exposure types for physical trades
export interface PhysicalExposureResult {
  physical: Record<Instrument, number>;
  pricing: Record<Instrument, number>;
}

// Utility type to handle potentially incomplete data from the database
export type PartialPhysicalExposureResult = {
  physical?: Partial<Record<Instrument, number>>;
  pricing?: Partial<Record<Instrument, number>>;
};

export type PartialPhysicalFormulaConfig = {
  tokens: PhysicalFormulaToken[];
  exposures?: PartialPhysicalExposureResult;
};
