
import { Instrument } from './common';

export interface PricingInstrument {
  id: string;
  instrumentCode: string;
  displayName: string;
  description?: string;
  isActive: boolean;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HistoricalPrice {
  id: string;
  instrumentId: string;
  priceDate: string;
  price: number;
  createdAt: string;
  updatedAt: string;
  instrument?: PricingInstrument;
}

export interface ForwardPrice {
  id: string;
  instrumentId: string;
  forwardMonth: string;
  price: number;
  createdAt: string;
  updatedAt: string;
  instrument?: PricingInstrument;
}

export interface PriceUploadData {
  date: string;
  instrument: string;
  price: number;
}

// Adding FormulaToken type
export interface FormulaToken {
  id: string;
  type: 'instrument' | 'fixedValue' | 'percentage' | 'operator' | 'openBracket' | 'closeBracket';
  value: string;
}

// Adding ExposureResult interface with monthlyDistribution property
export interface ExposureResult {
  physical: Record<Instrument, number>;
  pricing: Record<Instrument, number>;
  monthlyDistribution?: Record<string, Record<string, number>>;
}

export interface MonthlyDistribution {
  [monthKey: string]: number; // e.g. "Jan-23": 1000
}

// Add DailyDistribution (needed for imports but will be empty)
export interface DailyDistribution {
  [dateKey: string]: number; // e.g. "2023-01-15": 100
}

// Add DailyDistributionByInstrument (needed for imports but will be empty)
export interface DailyDistributionByInstrument {
  [instrument: string]: DailyDistribution;
}

// Add PricingFormula interface
export interface PricingFormula {
  tokens: FormulaToken[];
  exposures: ExposureResult;
}

// Add PartialPricingFormula for formula utilities
export interface PartialPricingFormula {
  tokens: FormulaToken[];
  exposures?: Partial<ExposureResult>;
}

// Price detail interfaces
export interface FixedComponent {
  value: number;
}

export interface PriceDetail {
  instrumentPrice?: number;
  fixedComponents?: FixedComponent[];
  totalFixedValue?: number;
  finalPrice?: number;
}

export interface MTMPriceDetail {
  instrumentPrice?: number;
  fixedComponents?: FixedComponent[];
  finalMTM?: number;
}

export interface InstrumentWithExposures extends PricingInstrument {
  exposures: number[];
}

export interface MTMRecord {
  month: string;
  [key: string]: any;
}

export interface MTMData {
  records: MTMRecord[];
  total: Record<string, number>;
  grandTotal: number;
}

export interface PNLRecord {
  month: string;
  [key: string]: any;
}

export interface PNLData {
  records: PNLRecord[];
  total: Record<string, number>;
  grandTotal: number;
}
