
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
import { isDateInRange, parseISODate } from '@/utils/dateUtils';

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
    
    // Calculate physical exposures - reading from pricing_formula.exposures.physical
    // This was already reading from pricing_formula.exposures.physical so no changes needed
    const { physicalExposures, pricingExposures } = 
      calculatePhysicalExposure(tradeData.physicalTradeLegs, periods);
    
    // Calculate paper exposures
    const { paperExposures, pricingFromPaperExposures } = 
      calculatePaperExposure(tradeData.paperTradeLegs, periods);
    
    // If date range filtering is enabled, filter the exposures accordingly
    if (dateRangeEnabled && dateRange?.from && dateRange?.to) {
      const startDate = dateRange.from;
      const endDate = dateRange.to || dateRange.from;
      
      // Filter and adjust monthly exposures based on daily distributions 
      // for trades that have daily distribution data
      if (tradeData.physicalTradeLegs) {
        tradeData.physicalTradeLegs.forEach(leg => {
          if (leg.pricing_formula?.dailyDistribution) {
            // Process each instrument in the daily distribution
            Object.entries(leg.pricing_formula.dailyDistribution).forEach(([instrument, dailyValues]) => {
              if (typeof dailyValues === 'object') {
                // Process each day's exposure
                Object.entries(dailyValues).forEach(([dateStr, exposure]) => {
                  const date = parseISODate(dateStr);
                  
                  // Check if the date is in the specified range
                  if (isDateInRange(date, startDate, endDate)) {
                    const month = date.toLocaleDateString('en-US', { month: 'short' }) + '-' + 
                                  date.getFullYear().toString().slice(2);
                    
                    // Only process if this month is in our periods list
                    if (periods.includes(month) && typeof exposure === 'number') {
                      // Add this daily exposure to the pricing exposure for this month and instrument
                      if (!pricingExposures[month]) {
                        pricingExposures[month] = {};
                      }
                      
                      if (!pricingExposures[month][instrument]) {
                        pricingExposures[month][instrument] = 0;
                      }
                      
                      pricingExposures[month][instrument] += exposure;
                    }
                  }
                });
              }
            });
          }
        });
      }
      
      // Similarly, filter paper trade exposures if they have daily distribution data
      if (tradeData.paperTradeLegs) {
        // Similar logic for paper trades (if implemented)
      }
    }
    
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
