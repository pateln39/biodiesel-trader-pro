
import { DateRange } from "react-day-picker";
import { ExposureCategory, ExposureData } from "@/types/exposure";

export interface ExposureExportParams {
  exposureData: Array<{
    month: string;
    products: Record<string, ExposureData>;
    totals: ExposureData;
  }>;
  visibleCategories: ExposureCategory[];
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
  dateRange?: DateRange;  // Added for date filter export
}
