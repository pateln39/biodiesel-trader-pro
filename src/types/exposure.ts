
import { PhysicalTrade } from '@/types';

export interface ExposureData {
  physical: number;
  pricing: number;
  paper: number;
  netExposure: number;
}

// Add ProductData type which is the same as ExposureData
export type ProductData = ExposureData;

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
  productTotals: Record<string, ProductData>;
}

export interface GroupTotals {
  biodieselTotal: number;
  pricingInstrumentTotal: number;
  totalRow: number;
}

export const CATEGORY_ORDER = ['Physical', 'Pricing', 'Paper', 'Exposure'] as const;
export type ExposureCategory = (typeof CATEGORY_ORDER)[number];
