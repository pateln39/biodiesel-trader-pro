
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
  paper?: Record<Instrument, number>; // Added for paper trade exposures
}
