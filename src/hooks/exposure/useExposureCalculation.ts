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
import { 
  isDateInRange, 
  parseISODate, 
  getMonthCodesBetweenDates,
  formatMonthCode 
} from '@/utils/dateUtils';

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
    const { physicalExposures, pricingExposures } = 
      calculatePhysicalExposure(tradeData.physicalTradeLegs, periods);
    
    // Calculate paper exposures
    const { paperExposures, pricingFromPaperExposures } = 
      calculatePaperExposure(tradeData.paperTradeLegs, periods);
    
    // Create a deep copy of the exposures for date filtered results
    let filteredPhysicalExposures = { ...physicalExposures };
    let filteredPricingExposures = { ...pricingExposures };
    let filteredPaperExposures = { ...paperExposures };
    let filteredPricingFromPaperExposures = { ...pricingFromPaperExposures };
    
    // If date range filtering is enabled, apply filtering
    if (dateRangeEnabled && dateRange?.from) {
      const startDate = dateRange.from;
      const endDate = dateRange.to || dateRange.from;
      
      console.log("[EXPOSURE] Filtering by date range:", startDate, "to", endDate);
      
      // Identify months that are fully or partially covered by the date range
      const monthsInDateRange = getMonthCodesBetweenDates(startDate, endDate);
      console.log("[EXPOSURE] Months covered by date range:", monthsInDateRange);
      
      // Step 1: For physical exposures, keep only the months that are in the date range
      // Initialize with empty objects for all months
      filteredPhysicalExposures = {};
      periods.forEach(period => {
        filteredPhysicalExposures[period] = {};
      });
      
      // Copy physical exposures for months that are in the date range
      monthsInDateRange.forEach(month => {
        if (periods.includes(month) && physicalExposures[month]) {
          filteredPhysicalExposures[month] = { ...physicalExposures[month] };
        }
      });
      
      console.log("[EXPOSURE] Filtered physical exposure months:", Object.keys(filteredPhysicalExposures).filter(m => Object.keys(filteredPhysicalExposures[m]).length > 0));
      
      // Step 2: Filter and adjust daily pricing exposures from physical trades
      filteredPricingExposures = {};
      periods.forEach(period => {
        filteredPricingExposures[period] = {};
      });
      
      // Process physical trades with daily distributions
      if (tradeData.physicalTradeLegs) {
        tradeData.physicalTradeLegs.forEach(leg => {
          if (leg.pricing_formula?.dailyDistribution) {
            // Process each instrument in the daily distribution
            Object.entries(leg.pricing_formula.dailyDistribution).forEach(([instrument, dailyValues]) => {
              if (typeof dailyValues === 'object') {
                // Filter and aggregate daily values that fall within the date range
                Object.entries(dailyValues).forEach(([dateStr, exposure]) => {
                  const date = parseISODate(dateStr);
                  
                  // Check if the date is in the specified range
                  if (isDateInRange(date, startDate, endDate)) {
                    const month = formatMonthCode(date);
                    
                    // Only process if this month is in our periods list
                    if (periods.includes(month) && typeof exposure === 'number') {
                      // Initialize if needed
                      if (!filteredPricingExposures[month]) {
                        filteredPricingExposures[month] = {};
                      }
                      
                      if (!filteredPricingExposures[month][instrument]) {
                        filteredPricingExposures[month][instrument] = 0;
                      }
                      
                      // Add this daily exposure to the filtered pricing exposure
                      filteredPricingExposures[month][instrument] += exposure;
                    }
                  }
                });
              }
            });
          } else {
            // For trades without daily distribution, use monthly distribution but only for months in date range
            const periodStart = leg.pricing_period_start ? new Date(leg.pricing_period_start) : null;
            if (periodStart) {
              const month = formatMonthCode(periodStart);
              
              // If this month is in the date range and our periods list
              if (monthsInDateRange.includes(month) && periods.includes(month) && pricingExposures[month]) {
                // Copy all instruments for this month
                Object.entries(pricingExposures[month]).forEach(([instrument, value]) => {
                  if (!filteredPricingExposures[month]) {
                    filteredPricingExposures[month] = {};
                  }
                  filteredPricingExposures[month][instrument] = value;
                });
              }
            }
          }
        });
      }
      
      // Step 3: Filter paper exposures using daily distributions
      filteredPaperExposures = {};
      filteredPricingFromPaperExposures = {};
      periods.forEach(period => {
        filteredPaperExposures[period] = {};
        filteredPricingFromPaperExposures[period] = {};
      });
      
      // Process paper trades
      if (tradeData.paperTradeLegs) {
        tradeData.paperTradeLegs.forEach(leg => {
          const month = leg.period || leg.trading_period || '';
          if (!month || !periods.includes(month)) {
            return;
          }
          
          // Process paperDailyDistribution if available
          if (leg.exposures?.paperDailyDistribution) {
            Object.entries(leg.exposures.paperDailyDistribution).forEach(([product, dailyValues]) => {
              if (typeof dailyValues === 'object') {
                Object.entries(dailyValues).forEach(([dateStr, exposure]) => {
                  const date = parseISODate(dateStr);
                  
                  // Check if the date is in the date range
                  if (isDateInRange(date, startDate, endDate)) {
                    // Only process if this month is in our periods list
                    if (typeof exposure === 'number') {
                      const exposureMonth = formatMonthCode(date);
                      
                      if (!filteredPaperExposures[exposureMonth]) {
                        filteredPaperExposures[exposureMonth] = {};
                      }
                      
                      if (!filteredPaperExposures[exposureMonth][product]) {
                        filteredPaperExposures[exposureMonth][product] = 0;
                      }
                      
                      filteredPaperExposures[exposureMonth][product] += exposure;
                    }
                  }
                });
              }
            });
          } else if (monthsInDateRange.includes(month)) {
            // If no daily distribution but month is in range, copy all exposures for this month
            if (paperExposures[month]) {
              Object.entries(paperExposures[month]).forEach(([product, value]) => {
                if (!filteredPaperExposures[month]) {
                  filteredPaperExposures[month] = {};
                }
                filteredPaperExposures[month][product] = value;
              });
            }
          }
          
          // Process pricingDailyDistribution if available
          if (leg.exposures?.pricingDailyDistribution) {
            Object.entries(leg.exposures.pricingDailyDistribution).forEach(([product, dailyValues]) => {
              if (typeof dailyValues === 'object') {
                Object.entries(dailyValues).forEach(([dateStr, exposure]) => {
                  const date = parseISODate(dateStr);
                  
                  // Check if the date is in the date range
                  if (isDateInRange(date, startDate, endDate)) {
                    // Only process if exposure is a number
                    if (typeof exposure === 'number') {
                      const exposureMonth = formatMonthCode(date);
                      
                      if (!filteredPricingFromPaperExposures[exposureMonth]) {
                        filteredPricingFromPaperExposures[exposureMonth] = {};
                      }
                      
                      if (!filteredPricingFromPaperExposures[exposureMonth][product]) {
                        filteredPricingFromPaperExposures[exposureMonth][product] = 0;
                      }
                      
                      filteredPricingFromPaperExposures[exposureMonth][product] += exposure;
                    }
                  }
                });
              }
            });
          } else if (monthsInDateRange.includes(month)) {
            // If no daily pricing distribution but month is in range, copy all exposures for this month
            if (pricingFromPaperExposures[month]) {
              Object.entries(pricingFromPaperExposures[month]).forEach(([product, value]) => {
                if (!filteredPricingFromPaperExposures[month]) {
                  filteredPricingFromPaperExposures[month] = {};
                }
                filteredPricingFromPaperExposures[month][product] = value;
              });
            }
          }
        });
      }
    }
    
    // Merge all exposures - use filtered ones if date range is enabled
    const { allProductsFound, exposuresByMonth: mergedData } = mergeExposureData(
      exposuresByMonth,
      dateRangeEnabled ? filteredPhysicalExposures : physicalExposures,
      dateRangeEnabled ? filteredPricingExposures : pricingExposures, 
      dateRangeEnabled ? filteredPaperExposures : paperExposures,
      dateRangeEnabled ? filteredPricingFromPaperExposures : pricingFromPaperExposures
    );
    
    // Format the final data structure for the exposure table
    return formatExposureData(mergedData, periods, allowedProducts);
  }, [tradeData, periods, allowedProducts, dateRangeEnabled, dateRange]);

  return {
    exposureData
  };
};
