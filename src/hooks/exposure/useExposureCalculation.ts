
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

export const useExposureCalculation = (
  tradeData: ExposureTradeData | undefined,
  periods: string[],
  allowedProducts: string[]
) => {
  const exposureData = useMemo<MonthlyExposure[]>(() => {
    if (!tradeData) {
      return [];
    }

    // Initialize exposure data structure
    const exposuresByMonth = initializeExposureData(periods, allowedProducts);
    
    // Calculate physical exposures - now prioritizing pricing_formula.exposures.physical
    const { physicalExposures, pricingExposures } = 
      calculatePhysicalExposure(tradeData.physicalTradeLegs, periods);
    
    // Calculate paper exposures
    const { paperExposures, pricingFromPaperExposures } = 
      calculatePaperExposure(tradeData.paperTradeLegs, periods);
    
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
  }, [tradeData, periods, allowedProducts]);

  return {
    exposureData
  };
};
