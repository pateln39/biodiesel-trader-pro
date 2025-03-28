
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

export interface ExposureResult {
  physical: Record<Instrument, number>;
  pricing: Record<Instrument, number>;
}

export interface MonthlyDistribution {
  [monthKey: string]: number; // e.g. "Jan-23": 1000
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
