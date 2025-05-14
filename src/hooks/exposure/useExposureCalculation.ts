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

    console.log('[EXPOSURE] Starting exposure calculation. Date range enabled:', dateRangeEnabled);
    
    // Initialize exposure data structure
    const exposuresByMonth = initializeExposureData(periods, allowedProducts);
    
    // Calculate physical exposures
    const { physicalExposures, pricingExposures } = 
      calculatePhysicalExposure(tradeData.physicalTradeLegs, periods);
    
    // Calculate paper exposures - without date filtering for initial calculation
    const { paperExposures, pricingFromPaperExposures } = 
      calculatePaperExposure(tradeData.paperTradeLegs, periods, false);
    
    // Create a deep copy of the exposures for date filtered results
    let filteredPhysicalExposures = { ...physicalExposures };
    let filteredPricingExposures = {};
    let filteredPaperExposures = {};
    let filteredPricingFromPaperExposures = {};
    
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
      
      // Step 2: Initialize filtered pricing exposures
      filteredPricingExposures = {};
      periods.forEach(period => {
        filteredPricingExposures[period] = {};
      });
      
      // Step 3: Process all physical trades' daily distributions
      if (tradeData.physicalTradeLegs) {
        // Counter to track EFP filtering statistics
        let efpTradesProcessed = 0;
        let efpDailyDistributionFound = 0;
        let efpTotalExposureAdded = 0;
        
        // Process each physical trade leg
        tradeData.physicalTradeLegs.forEach(leg => {
          // Determine if this is an EFP trade
          const isEfpTrade = leg.pricing_type === 'efp';
          
          if (isEfpTrade) {
            efpTradesProcessed++;
            console.log(`[EXPOSURE] Processing EFP trade #${efpTradesProcessed}:`, {
              month: leg.efp_designated_month,
              quantity: leg.quantity,
              agreed: leg.efp_agreed_status,
              buySell: leg.buy_sell,
              legId: leg.id
            });
          }
          
          // Ensure pricing_formula is properly parsed
          const pricingFormula = leg.pricing_formula ? 
            (typeof leg.pricing_formula === 'string' ? 
              JSON.parse(leg.pricing_formula) : leg.pricing_formula) : {};
          
          // Check if the leg has daily distribution data
          if (pricingFormula.dailyDistribution) {
            if (isEfpTrade) {
              efpDailyDistributionFound++;
              const instrumentKeys = Object.keys(pricingFormula.dailyDistribution);
              console.log(`[EXPOSURE] EFP trade #${efpTradesProcessed} has dailyDistribution with instruments:`, instrumentKeys);
              
              // Log daily entries count
              instrumentKeys.forEach(instrument => {
                const dailyEntries = pricingFormula.dailyDistribution[instrument];
                console.log(`[EXPOSURE] EFP instrument ${instrument} has ${Object.keys(dailyEntries).length} daily entries`);
              });
            }
            
            // Process each instrument in the daily distribution
            Object.entries(pricingFormula.dailyDistribution).forEach(([instrument, dailyValues]) => {
              const isEfpInstrument = instrument.includes('EFP');
              
              if (isEfpTrade) {
                console.log(`[EXPOSURE] Processing ${isEfpInstrument ? 'EFP' : 'standard'} dailyDistribution for instrument: ${instrument}`);
              }
              
              if (typeof dailyValues === 'object' && dailyValues !== null) {
                // Debug daily values data structure
                if (isEfpTrade) {
                  const dateKeys = Object.keys(dailyValues);
                  console.log(`[EXPOSURE] EFP trade #${efpTradesProcessed} dailyDistribution dates sample:`, 
                    dateKeys.slice(0, 3), '... (and', dateKeys.length - 3, 'more)');
                }
                
                // Create counters for included/excluded dates
                let includedDatesCount = 0;
                let excludedDatesCount = 0;
                
                // Filter and aggregate daily values that fall within the date range
                Object.entries(dailyValues).forEach(([dateStr, exposure]) => {
                  const date = parseISODate(dateStr);
                  
                  if (!date) {
                    console.warn(`[EXPOSURE] Invalid date format in dailyDistribution: ${dateStr}`);
                    return;
                  }
                  
                  // Check if the date is in the specified range
                  if (isDateInRange(date, startDate, endDate)) {
                    includedDatesCount++;
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
                      
                      // For EFP trades, log each date's contribution
                      if (isEfpTrade && isEfpInstrument) {
                        console.log(`[EXPOSURE] Adding EFP daily exposure: ${month}, ${instrument}, ${exposure}, date: ${dateStr}`);
                        efpTotalExposureAdded += exposure;
                      }
                    }
                  } else {
                    excludedDatesCount++;
                    
                    // Only log a sample of excluded dates to avoid console spam
                    if (excludedDatesCount <= 3 && isEfpTrade) {
                      console.log(`[EXPOSURE] Excluding EFP date: ${dateStr} outside range: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`);
                    }
                  }
                });
                
                if (isEfpTrade) {
                  console.log(`[EXPOSURE] EFP trade #${efpTradesProcessed}: Included ${includedDatesCount} dates, excluded ${excludedDatesCount} dates`);
                }
              }
            });
          } else if (isEfpTrade) {
            // Handle EFP trades without daily distribution
            console.warn(`[EXPOSURE] EFP trade #${efpTradesProcessed} (id: ${leg.id}) has NO dailyDistribution data!`);
            
            // For EFP trades without daily distribution, use fallback
            if (leg.efp_designated_month && !leg.efp_agreed_status) {
              console.log(`[EXPOSURE] Using synthetic daily distribution for EFP trade #${efpTradesProcessed}`);
              
              const month = leg.efp_designated_month;
              const instrumentKey = 'ICE GASOIL FUTURES (EFP)';
              
              // Calculate exposure value
              const volume = leg.quantity * (leg.tolerance ? (1 + leg.tolerance / 100) : 1);
              const direction = leg.buy_sell === 'buy' ? -1 : 1; // Opposite for EFP trades
              const exposureValue = volume * direction;
              
              // Use the designated month to determine if it overlaps with our date range
              const monthOverlaps = monthsInDateRange.includes(month);
              
              if (monthOverlaps) {
                if (!filteredPricingExposures[month]) {
                  filteredPricingExposures[month] = {};
                }
                
                if (!filteredPricingExposures[month][instrumentKey]) {
                  filteredPricingExposures[month][instrumentKey] = 0;
                }
                
                filteredPricingExposures[month][instrumentKey] += exposureValue;
                console.log(`[EXPOSURE] Added synthetic EFP exposure for ${month}: ${exposureValue}`);
                efpTotalExposureAdded += exposureValue;
              }
            }
          } else {
            // Handle trades without daily distribution using other methods
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
                    
                    if (!filteredPricingExposures[month][instrument]) {
                      filteredPricingExposures[month][instrument] = 0;
                    }
                    
                    filteredPricingExposures[month][instrument] += value;
                  });
                }
              }
            }
          }
        });
        
        // Log EFP filtering summary
        if (efpTradesProcessed > 0) {
          console.log(`[EXPOSURE] EFP Summary: ${efpTradesProcessed} trades processed, ${efpDailyDistributionFound} with dailyDistribution, total exposure added: ${efpTotalExposureAdded}`);
        }
      }
      
      // Process paper trade exposures with date filtering
      // Step 4: For paper trades, recalculate exposures using ONLY daily distributions and date filtering
      console.log("[EXPOSURE] Calculating paper exposures for date filtering using ONLY daily distribution data with date range");
      
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
      
      // Copy the recalculated (and already date-filtered) exposures
      Object.entries(recalculatedPaperExposures).forEach(([month, products]) => {
        if (periods.includes(month)) {
          filteredPaperExposures[month] = { ...products };
        }
      });
      
      Object.entries(recalculatedPricingExposures).forEach(([month, products]) => {
        if (periods.includes(month)) {
          filteredPricingFromPaperExposures[month] = { ...products };
        }
      });
      
      // Additional logging to verify we've processed all types of exposures
      console.log("[EXPOSURE] Date range filtering summary:");
      console.log("Physical months processed:", Object.keys(filteredPhysicalExposures).filter(m => Object.keys(filteredPhysicalExposures[m]).length > 0).length);
      console.log("Pricing months processed:", Object.keys(filteredPricingExposures).filter(m => Object.keys(filteredPricingExposures[m]).length > 0).length);
      console.log("Paper months processed:", Object.keys(filteredPaperExposures).filter(m => Object.keys(filteredPaperExposures[m]).length > 0).length);
      console.log("Pricing from paper months processed:", Object.keys(filteredPricingFromPaperExposures).filter(m => Object.keys(filteredPricingFromPaperExposures[m]).length > 0).length);
      
      // Debug the pricing exposures specifically for ICE GASOIL FUTURES (EFP)
      const efpMonths = Object.entries(filteredPricingExposures)
        .filter(([month, products]) => products['ICE GASOIL FUTURES (EFP)'])
        .map(([month, products]) => `${month}: ${products['ICE GASOIL FUTURES (EFP)']}`);
      
      if (efpMonths.length > 0) {
        console.log("[EXPOSURE] Filtered ICE GASOIL FUTURES (EFP) exposures:", efpMonths);
      } else {
        console.warn("[EXPOSURE] No filtered ICE GASOIL FUTURES (EFP) exposures found!");
      }
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

    // Debug the merging results specifically for EFP
    if (dateRangeEnabled) {
      console.log("[EXPOSURE] Checking merged EFP exposures in final data:");
      Object.entries(mergedData).forEach(([month, products]) => {
        if (products['ICE GASOIL FUTURES (EFP)']?.pricing) {
          console.log(`[EXPOSURE] Merged data: ${month} EFP exposure = ${products['ICE GASOIL FUTURES (EFP)'].pricing}`);
        }
      });
    }
    
    // Format the final data structure for the exposure table
    const formattedData = formatExposureData(mergedData, periods, allowedProducts);
    
    // Final verification of EFP exposures in formatted data
    if (dateRangeEnabled) {
      console.log("[EXPOSURE] Final verification of EFP exposures in formatted data:");
      formattedData.forEach(monthData => {
        if (monthData.products['ICE GASOIL FUTURES (EFP)']?.pricing) {
          console.log(`[EXPOSURE] Final data: ${monthData.month} EFP pricing = ${monthData.products['ICE GASOIL FUTURES (EFP)'].pricing}`);
        }
      });
    }
    
    return formattedData;
  }, [tradeData, periods, allowedProducts, dateRangeEnabled, dateRange]);

  return {
    exposureData
  };
};
