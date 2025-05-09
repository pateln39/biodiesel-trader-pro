
import { ExposureData, MonthlyExposure } from '@/types/exposure';

/**
 * Type definition for exposure export parameters
 */
export interface ExposureExportParams {
  exposureData: MonthlyExposure[];
  visibleCategories: string[];
  filteredProducts: string[];
  grandTotals: {
    totals: ExposureData;
    productTotals: Record<string, ExposureData>;
  };
  groupGrandTotals: {
    biodieselTotal: number;
    pricingInstrumentTotal: number;
    totalRow: number;
  };
  biodieselProducts: string[];
  pricingInstrumentProducts: string[];
}
