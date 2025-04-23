
import { Instrument } from '@/types/common';
import { PhysicalTradeLeg } from '@/types/physical';
import { FormulaToken, PricingFormula } from '@/types/pricing';

// Define PricingPeriodType if not already defined elsewhere
export type PricingPeriodType = 'historical' | 'current' | 'future';

// Export PhysicalTradeLeg to make it accessible to priceCalculationUtils
export type { PhysicalTradeLeg };

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
