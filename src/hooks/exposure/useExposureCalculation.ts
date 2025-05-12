
import { useMemo } from 'react';
import { MonthlyExposure } from '@/types/exposure';
import { calculatePhysicalExposure } from '@/utils/exposureCalculation/calculatePhysicalExposure';
import { calculatePaperExposure } from '@/utils/exposureCalculation/calculatePaperExposure';
import { 
  initializeExposureData,
  mergeExposureData, 
  formatExposureData 
} from '@/utils/exposureCalculation/normalizeExposureData';
import { ExposureTradeData } from './useExposureFetching';
import { DateRange } from 'react-day-picker';

export const useExposureCalculation = (
  tradeData: ExposureTradeData | undefined,
  periods: string[],
  allowedProducts: string[],
  dateRangeEnabled: boolean = false,
  dateRange: DateRange | undefined = undefined
) => {
  const exposureData = useMemo<MonthlyExposure[]>(() => {
    if (!tradeData) {
      return [];
    }

    // Initialize exposure data structure
    const exposuresByMonth = initializeExposureData(periods, allowedProducts);
    
    // Calculate physical exposures with date range filtering if enabled
    const { physicalExposures, pricingExposures } = 
      calculatePhysicalExposure(
        tradeData.physicalTradeLegs, 
        periods,
        dateRangeEnabled,
        dateRange?.from && dateRange?.to ? 
          { from: dateRange.from, to: dateRange.to || dateRange.from } : 
          undefined
      );
    
    // Calculate paper exposures with date range filtering if enabled
    const { paperExposures, pricingFromPaperExposures } = 
      calculatePaperExposure(
        tradeData.paperTradeLegs, 
        periods,
        dateRangeEnabled,
        dateRange?.from && dateRange?.to ? 
          { from: dateRange.from, to: dateRange.to || dateRange.from } : 
          undefined
      );
    
    // Merge all exposures
    const { allProductsFound, exposuresByMonth: mergedData } = mergeExposureData(
      exposuresByMonth,
      physicalExposures,
      pricingExposures,
      paperExposures,
      pricingFromPaperExposures
    );
    
    // Format the final data structure for the exposure table
    return formatExposureData(mergedData, periods, allowedProducts);
  }, [tradeData, periods, allowedProducts, dateRangeEnabled, dateRange]);

  return {
    exposureData
  };
};
