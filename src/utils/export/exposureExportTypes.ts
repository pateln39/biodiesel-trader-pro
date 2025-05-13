
import { MonthlyExposure, GrandTotals, GroupTotals } from '@/types/exposure';
import { DateRange } from 'react-day-picker';

export interface ExposureExportParams {
  exposureData: MonthlyExposure[];
  visibleCategories: string[];
  filteredProducts: string[];
  grandTotals: GrandTotals;
  groupGrandTotals: GroupTotals;
  biodieselProducts: string[];
  pricingInstrumentProducts: string[];
  dateRange?: DateRange;
}
