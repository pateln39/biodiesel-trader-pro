
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
  dateRange: DateRange | undefined = undefined,
  selectedMonth: string | null = null
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
      
      console.log("[EXPOSURE] Filtering by date range:", startDate.toISOString(), "to", endDate.toISOString());
      
      // Identify months that are fully or partially covered by the date range
      const monthsInDateRange = getMonthCodesBetweenDates(startDate, endDate);
      console.log("[EXPOSURE] Months covered by date range:", monthsInDateRange);
      
      // Step 1: For physical exposures, KEEP ENTIRE MONTHS that are in the date range
      // Initialize with empty objects for all months
      filteredPhysicalExposures = {};
      periods.forEach(period => {
        filteredPhysicalExposures[period] = {};
      });
      
      // Copy physical exposures for months that are in the date range
      // IMPORTANT: For physical exposures, we keep the entire month's data if it's in the range
      monthsInDateRange.forEach(month => {
        if (periods.includes(month) && physicalExposures[month]) {
          filteredPhysicalExposures[month] = { ...physicalExposures[month] };
        }
      });
      
      console.log("[EXPOSURE] Showing physical exposure for entire months:", monthsInDateRange);
      
      // Step 2: Filter pricing exposures from physical trades using daily distribution when available
      filteredPricingExposures = {};
      periods.forEach(period => {
        filteredPricingExposures[period] = {};
      });
      
      // Process physical trades with daily distributions
      if (tradeData.physicalTradeLegs) {
        tradeData.physicalTradeLegs.forEach(leg => {
          // Check if the leg has daily distribution data for more precise filtering
          if (leg.pricing_formula?.dailyDistribution) {
            // Process each instrument in the daily distribution
            Object.entries(leg.pricing_formula.dailyDistribution).forEach(([instrument, dailyValues]) => {
              if (typeof dailyValues === 'object') {
                // Filter and aggregate daily values that fall within the date range
                Object.entries(dailyValues).forEach(([dateStr, exposure]) => {
                  const date = parseISODate(dateStr);
                  
                  // Check if the date is in the specified range
                  if (date && isDateInRange(date, startDate, endDate)) {
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
            // For trades without daily distribution, include monthly data if:
            // 1. The pricing period start/end falls within our date range, OR
            // 2. The date range falls entirely within the pricing period
            if (leg.pricing_period_start && leg.pricing_period_end) {
              const periodStart = new Date(leg.pricing_period_start);
              const periodEnd = new Date(leg.pricing_period_end);
              
              // Check if pricing period overlaps with our date range
              const isOverlapping = 
                (periodStart <= endDate && periodEnd >= startDate) ||
                (startDate <= periodEnd && endDate >= periodStart);
              
              if (isOverlapping) {
                // If overlapping, include the entire pricing exposure for each relevant month
                const pricingMonths = getMonthCodesBetweenDates(periodStart, periodEnd);
                
                // Filter to only include months that are in both the pricing period and our date range
                const relevantMonths = pricingMonths.filter(month => monthsInDateRange.includes(month));
                
                // Add pricing exposures for these months
                relevantMonths.forEach(month => {
                  if (periods.includes(month) && pricingExposures[month]) {
                    Object.entries(pricingExposures[month]).forEach(([instrument, value]) => {
                      if (!filteredPricingExposures[month]) {
                        filteredPricingExposures[month] = {};
                      }
                      
                      if (!filteredPricingExposures[month][instrument]) {
                        filteredPricingExposures[month][instrument] = 0;
                      }
                      
                      filteredPricingExposures[month][instrument] += value;
                    });
                  }
                });
              }
            } else {
              // Fallback: if no pricing period dates, use loading period start date to determine the month
              const periodStart = leg.loading_period_start ? new Date(leg.loading_period_start) : null;
              if (periodStart) {
                const month = formatMonthCode(periodStart);
                
                // Include only if this month is in the date range
                if (monthsInDateRange.includes(month) && periods.includes(month) && pricingExposures[month]) {
                  Object.entries(pricingExposures[month]).forEach(([instrument, value]) => {
                    if (!filteredPricingExposures[month]) {
                      filteredPricingExposures[month] = {};
                    }
                    filteredPricingExposures[month][instrument] = value;
                  });
                }
              }
            }
          }
        });
      }
      
      // Step 3: Filter paper exposures using daily distributions when available
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
          
          // Skip if month is invalid or not in our periods
          if (!month || !periods.includes(month)) {
            return;
          }
          
          // First handle paper exposures
          // Check if we have daily distribution data for more precise filtering
          if (leg.exposures?.paperDailyDistribution) {
            Object.entries(leg.exposures.paperDailyDistribution).forEach(([product, dailyValues]) => {
              if (typeof dailyValues === 'object') {
                Object.entries(dailyValues).forEach(([dateStr, exposure]) => {
                  const date = parseISODate(dateStr);
                  
                  // Check if the date is in the date range
                  if (date && isDateInRange(date, startDate, endDate)) {
                    // Only process if exposure is a number
                    if (typeof exposure === 'number') {
                      const exposureMonth = formatMonthCode(date);
                      
                      // Skip if the month is not in our periods
                      if (!periods.includes(exposureMonth)) {
                        return;
                      }
                      
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
            // Without daily distribution, use monthly data if the month is in our date range
            if (paperExposures[month]) {
              Object.entries(paperExposures[month]).forEach(([product, value]) => {
                if (!filteredPaperExposures[month]) {
                  filteredPaperExposures[month] = {};
                }
                filteredPaperExposures[month][product] = value;
              });
            }
          }
          
          // Now handle pricing exposures from paper trades
          // Check if we have daily distribution data
          if (leg.exposures?.pricingDailyDistribution) {
            Object.entries(leg.exposures.pricingDailyDistribution).forEach(([product, dailyValues]) => {
              if (typeof dailyValues === 'object') {
                Object.entries(dailyValues).forEach(([dateStr, exposure]) => {
                  const date = parseISODate(dateStr);
                  
                  // Check if the date is in the date range
                  if (date && isDateInRange(date, startDate, endDate)) {
                    // Only process if exposure is a number
                    if (typeof exposure === 'number') {
                      const exposureMonth = formatMonthCode(date);
                      
                      // Skip if the month is not in our periods
                      if (!periods.includes(exposureMonth)) {
                        return;
                      }
                      
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
            // Without daily distribution, use monthly data if the month is in our date range
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
    
    // If month filtering is enabled (and date range is disabled), filter by selected month
    if (selectedMonth && !dateRangeEnabled) {
      console.log('[EXPOSURE] Filtering by selected month:', selectedMonth);
      
      // Initialize with empty objects for all months
      filteredPhysicalExposures = {};
      filteredPricingExposures = {};
      filteredPaperExposures = {};
      filteredPricingFromPaperExposures = {};
      
      // For each month, initialize an empty object
      periods.forEach(period => {
        filteredPhysicalExposures[period] = {};
        filteredPricingExposures[period] = {};
        filteredPaperExposures[period] = {};
        filteredPricingFromPaperExposures[period] = {};
      });
      
      // Copy data only for the selected month
      if (physicalExposures[selectedMonth]) {
        filteredPhysicalExposures[selectedMonth] = { ...physicalExposures[selectedMonth] };
      }
      
      if (pricingExposures[selectedMonth]) {
        filteredPricingExposures[selectedMonth] = { ...pricingExposures[selectedMonth] };
      }
      
      if (paperExposures[selectedMonth]) {
        filteredPaperExposures[selectedMonth] = { ...paperExposures[selectedMonth] };
      }
      
      if (pricingFromPaperExposures[selectedMonth]) {
        filteredPricingFromPaperExposures[selectedMonth] = { ...pricingFromPaperExposures[selectedMonth] };
      }
    }
    
    // Choose which exposures to use based on filters
    const useFilters = dateRangeEnabled || (selectedMonth !== null && !dateRangeEnabled);
    
    // Merge all exposures - use filtered ones if date range or month filtering is enabled
    const { allProductsFound, exposuresByMonth: mergedData } = mergeExposureData(
      exposuresByMonth,
      useFilters ? filteredPhysicalExposures : physicalExposures,
      useFilters ? filteredPricingExposures : pricingExposures, 
      useFilters ? filteredPaperExposures : paperExposures,
      useFilters ? filteredPricingFromPaperExposures : pricingFromPaperExposures
    );
    
    // Format the final data structure for the exposure table
    return formatExposureData(mergedData, periods, allowedProducts);
  }, [tradeData, periods, allowedProducts, dateRangeEnabled, dateRange, selectedMonth]);

  return {
    exposureData
  };
};
