
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
import { mapProductToCanonical } from '@/utils/productMapping';

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

    console.log('[EXPOSURE] Starting exposure calculation. Date range enabled:', dateRangeEnabled);
    
    // Initialize exposure data structure
    const exposuresByMonth = initializeExposureData(periods, allowedProducts);
    
    // Calculate all exposures without date filtering first
    const { physicalExposures, pricingExposures } = 
      calculatePhysicalExposure(tradeData.physicalTradeLegs, periods);
    
    const { paperExposures, pricingFromPaperExposures } = 
      calculatePaperExposure(tradeData.paperTradeLegs, periods, false);
    
    // Create containers for filtered exposures
    let filteredPhysicalExposures = { ...physicalExposures };
    let filteredPricingExposures = {};
    let filteredPaperExposures = {};
    let filteredPricingFromPaperExposures = {};
    
    // If date range filtering is enabled and valid, apply filtering
    if (dateRangeEnabled && dateRange?.from) {
      const startDate = dateRange.from;
      const endDate = dateRange.to || dateRange.from;
      
      console.log("[EXPOSURE] Filtering by date range:", startDate.toISOString(), "to", endDate.toISOString());
      
      // Get months covered by the date range
      const monthsInDateRange = getMonthCodesBetweenDates(startDate, endDate);
      console.log("[EXPOSURE] Months covered by date range:", monthsInDateRange);
      
      // Step 1: For physical exposures, KEEP ENTIRE MONTHS that are in the date range
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
      
      console.log("[EXPOSURE] Showing physical exposure for entire months:", monthsInDateRange);
      
      // Step 2: Initialize filtered pricing exposures
      filteredPricingExposures = {};
      periods.forEach(period => {
        filteredPricingExposures[period] = {};
      });

      // Step 3: Process daily distributions for ALL TRADES (including EFP) uniformly
      // This is the key change - we process all trades with dailyDistribution through the same code path
      if (tradeData.physicalTradeLegs) {
        // Process each physical trade leg
        tradeData.physicalTradeLegs.forEach(leg => {
          // Ensure pricing_formula is properly parsed
          const pricingFormula = leg.pricing_formula ? 
            (typeof leg.pricing_formula === 'string' ? 
              JSON.parse(leg.pricing_formula) : leg.pricing_formula) : {};
          
          // Check if the leg has daily distribution data
          if (pricingFormula.dailyDistribution) {
            // Process each instrument in the daily distribution
            Object.entries(pricingFormula.dailyDistribution).forEach(([instrument, dailyValues]) => {
              if (typeof dailyValues === 'object' && dailyValues !== null) {
                // Map the instrument name to canonical form for consistency
                const canonicalInstrument = mapProductToCanonical(instrument);
                
                console.log(`[EXPOSURE] Processing daily distribution for instrument: ${instrument}, mapped to: ${canonicalInstrument}`);
                
                // Filter and aggregate daily values that fall within the date range
                Object.entries(dailyValues).forEach(([dateStr, exposure]) => {
                  const date = parseISODate(dateStr);
                  
                  if (!date) {
                    console.warn(`[EXPOSURE] Invalid date format in dailyDistribution: ${dateStr}`);
                    return;
                  }
                  
                  // Check if the date is in the specified range
                  if (isDateInRange(date, startDate, endDate)) {
                    const month = formatMonthCode(date);
                    
                    // Only process if this month is in our periods list
                    if (periods.includes(month) && typeof exposure === 'number') {
                      // Initialize if needed
                      if (!filteredPricingExposures[month]) {
                        filteredPricingExposures[month] = {};
                      }
                      
                      // Use the canonical instrument name for the filtered exposures
                      if (!filteredPricingExposures[month][canonicalInstrument]) {
                        filteredPricingExposures[month][canonicalInstrument] = 0;
                      }
                      
                      // Add this daily exposure to the filtered pricing exposure
                      filteredPricingExposures[month][canonicalInstrument] += exposure;
                      
                      // Log specifically for EFP instruments to track the mapping
                      if (instrument === 'ICE GASOIL FUTURES (EFP)' || canonicalInstrument === 'EFP') {
                        console.log(`[EFP EXPOSURE] Adding ${exposure} to ${canonicalInstrument} for ${month} on ${dateStr}`);
                      }
                    }
                  }
                });
              }
            });
          } else {
            // Handle trades without daily distribution using other methods
            // If no daily distribution, use pricing period dates for filtering
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
                      // Apply product mapping here too
                      const canonicalInstrument = mapProductToCanonical(instrument);
                      
                      if (!filteredPricingExposures[month]) {
                        filteredPricingExposures[month] = {};
                      }
                      
                      if (!filteredPricingExposures[month][canonicalInstrument]) {
                        filteredPricingExposures[month][canonicalInstrument] = 0;
                      }
                      
                      filteredPricingExposures[month][canonicalInstrument] += value;
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
                    // Apply product mapping here too
                    const canonicalInstrument = mapProductToCanonical(instrument);
                    
                    if (!filteredPricingExposures[month]) {
                      filteredPricingExposures[month] = {};
                    }
                    
                    if (!filteredPricingExposures[month][canonicalInstrument]) {
                      filteredPricingExposures[month][canonicalInstrument] = 0;
                    }
                    
                    filteredPricingExposures[month][canonicalInstrument] += value;
                  });
                }
              }
            }
          }
        });
      }
      
      // Process paper trade exposures with date filtering
      console.log("[EXPOSURE] Calculating paper exposures using daily distribution data with date range");
      
      // Use the enhanced calculatePaperExposure with date range filter
      const { paperExposures: recalculatedPaperExposures, pricingFromPaperExposures: recalculatedPricingExposures } = 
        calculatePaperExposure(
          tradeData.paperTradeLegs, 
          periods, 
          true, // useOnlyDailyDistribution
          { startDate, endDate } // Pass date range for explicit filtering
        );
      
      // Initialize with empty objects - these will be populated from recalculated exposures
      filteredPaperExposures = {};
      filteredPricingFromPaperExposures = {};
      periods.forEach(period => {
        filteredPaperExposures[period] = {};
        filteredPricingFromPaperExposures[period] = {};
      });
      
      // Copy the recalculated (and already date-filtered) exposures, applying product mapping
      Object.entries(recalculatedPaperExposures).forEach(([month, products]) => {
        if (periods.includes(month)) {
          Object.entries(products).forEach(([product, value]) => {
            const canonicalProduct = mapProductToCanonical(product);
            
            if (!filteredPaperExposures[month][canonicalProduct]) {
              filteredPaperExposures[month][canonicalProduct] = 0;
            }
            
            filteredPaperExposures[month][canonicalProduct] += value;
          });
        }
      });
      
      Object.entries(recalculatedPricingExposures).forEach(([month, products]) => {
        if (periods.includes(month)) {
          Object.entries(products).forEach(([product, value]) => {
            const canonicalProduct = mapProductToCanonical(product);
            
            if (!filteredPricingFromPaperExposures[month][canonicalProduct]) {
              filteredPricingFromPaperExposures[month][canonicalProduct] = 0;
            }
            
            filteredPricingFromPaperExposures[month][canonicalProduct] += value;
          });
        }
      });
      
      // Log summary of processed exposures
      console.log("[EXPOSURE] Date range filtering summary:");
      console.log("Physical months processed:", Object.keys(filteredPhysicalExposures).filter(m => Object.keys(filteredPhysicalExposures[m]).length > 0).length);
      console.log("Pricing months processed:", Object.keys(filteredPricingExposures).filter(m => Object.keys(filteredPricingExposures[m]).length > 0).length);
      console.log("Paper months processed:", Object.keys(filteredPaperExposures).filter(m => Object.keys(filteredPaperExposures[m]).length > 0).length);
      console.log("Pricing from paper months processed:", Object.keys(filteredPricingFromPaperExposures).filter(m => Object.keys(filteredPricingFromPaperExposures[m]).length > 0).length);
    }
    
    // Choose which exposures to use based on filters
    const useFilters = dateRangeEnabled;
    
    // Merge all exposures - use filtered ones if date range filtering is enabled
    const { allProductsFound, exposuresByMonth: mergedData } = mergeExposureData(
      exposuresByMonth,
      useFilters ? filteredPhysicalExposures : physicalExposures,
      useFilters ? filteredPricingExposures : pricingExposures, 
      useFilters ? filteredPaperExposures : paperExposures,
      useFilters ? filteredPricingFromPaperExposures : pricingFromPaperExposures
    );

    // Format the final data structure for the exposure table
    const formattedData = formatExposureData(mergedData, periods, allowedProducts);
    
    return formattedData;
  }, [tradeData, periods, allowedProducts, dateRangeEnabled, dateRange]);

  return {
    exposureData
  };
};
