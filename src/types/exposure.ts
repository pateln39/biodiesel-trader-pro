
/**
 * Types for exposure data calculations and display
 */

export interface ExposureData {
  physical: number;
  pricing: number;
  paper: number;
  netExposure: number;
}

export interface ProductExposure {
  [product: string]: ExposureData;
}

export interface MonthlyExposure {
  month: string;
  products: ProductExposure;
  totals: ExposureData;
}

export interface ProductGroups {
  pricingProducts: string[];
  biodieselProducts: string[];
  otherProducts: string[];
}

export interface FilteredExposureResult {
  physical: Record<string, number>;
  pricing: Record<string, number>;
}

export interface PricingInstrument {
  id: string;
  display_name: string;
  instrument_code: string;
  is_active: boolean;
  description?: string;
  category?: string;
}
