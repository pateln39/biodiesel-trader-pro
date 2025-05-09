
import { PhysicalTrade } from '@/types';

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

export interface GrandTotals {
  totals: ExposureData;
  productTotals: Record<string, ExposureData>;
}

export interface GroupTotals {
  biodieselTotal: number;
  pricingInstrumentTotal: number;
  totalRow: number;
}

export interface PricingInstrument {
  id: string;
  display_name: string;
  instrument_code: string;
  is_active: boolean;
}

export const CATEGORY_ORDER = ['Physical', 'Pricing', 'Paper', 'Exposure'] as const;
export type ExposureCategory = (typeof CATEGORY_ORDER)[number];
