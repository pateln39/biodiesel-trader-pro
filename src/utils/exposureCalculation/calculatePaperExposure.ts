
import { mapProductToCanonical, parsePaperInstrument } from '@/utils/productMapping';
import { validateAndParsePricingFormula } from '@/utils/formulaUtils';
import { getBusinessDaysByMonth, distributeValueByBusinessDays, countBusinessDays } from '@/utils/dateUtils';
import { getMonthDates } from '@/utils/paperTrade';

export interface PaperExposureResult {
  paperExposures: Record<string, Record<string, number>>;
  pricingFromPaperExposures: Record<string, Record<string, number>>;
}

/**
 * Calculate exposure for paper trade legs
 * @param paperTradeLegs Array of paper trade legs
 * @param periods Array of periods (months) to calculate for
 * @param useOnlyDailyDistribution Whether to use only daily distribution data (for date filtering)
 * @returns Object containing paper exposures and pricing exposures from paper trades
 */
export const calculatePaperExposure = (
  paperTradeLegs: any[],
  periods: string[],
  useOnlyDailyDistribution: boolean = false
): PaperExposureResult => {
  // Initialize exposure objects
  const paperExposures: Record<string, Record<string, number>> = {};
  const pricingFromPaperExposures: Record<string, Record<string, number>> = {};
  
  // Initialize periods
  periods.forEach(month => {
    paperExposures[month] = {};
    pricingFromPaperExposures[month] = {};
  });

  // Track which product/month combinations have already been processed from daily distributions
  const processedPaperProducts = new Set<string>();
  const processedPricingProducts = new Set<string>();
  
  // Log which processing mode we're in
  console.log(`[EXPOSURE] Processing paper exposures with ${useOnlyDailyDistribution ? 'ONLY daily distribution' : 'direct exposure data'}`);

  for (const leg of paperTradeLegs) {
    const month = leg.period || leg.trading_period || '';
    if (!month || !periods.includes(month)) {
      continue;
    }
    
    // Calculate business days for this month to use for daily distribution
    const monthDates = getMonthDates(month);
    let businessDaysInMonth = 0;
    let businessDaysByDate: Record<string, number> = {};
    
    if (monthDates) {
      businessDaysInMonth = countBusinessDays(monthDates.startDate, monthDates.endDate);
      
      // Create a map of business days by date for this month
      const currentDate = new Date(monthDates.startDate);
      while (currentDate <= monthDates.endDate) {
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) { // Not weekend
          const dateStr = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
          businessDaysByDate[dateStr] = 1;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    // Process using exposures object if available (Primary method now)
    if (leg.exposures && typeof leg.exposures === 'object') {
      const exposuresData = leg.exposures as Record<string, any>;
      
      // CASE 1: Date filtering is ON - ONLY use daily distribution data
      if (useOnlyDailyDistribution) {
        // Only process daily distribution data when filter is applied
        if (exposuresData.paperDailyDistribution && typeof exposuresData.paperDailyDistribution === 'object') {
          // Skip processing if we've already processed this leg's daily distribution
          Object.entries(exposuresData.paperDailyDistribution).forEach(([product, dailyValues]) => {
            if (typeof dailyValues !== 'object') return;
            
            Object.entries(dailyValues).forEach(([dateStr, exposure]) => {
              const date = new Date(dateStr);
              if (isNaN(date.getTime())) return;
              
              const monthOfDate = new Date(date).toLocaleString('en-US', { month: 'short' }) + '-' + 
                              date.getFullYear().toString().slice(2);
                              
              if (monthOfDate === month) {
                const canonicalProduct = mapProductToCanonical(product);
                const key = `${monthOfDate}-${canonicalProduct}`;
                
                if (!paperExposures[month][canonicalProduct]) {
                  paperExposures[month][canonicalProduct] = 0;
                }
                
                // For monthly summary, add up all daily values
                if (typeof exposure === 'number') {
                  paperExposures[month][canonicalProduct] += exposure;
                  processedPaperProducts.add(key);
                }
              }
            });
          });
        }
        
        if (exposuresData.pricingDailyDistribution && typeof exposuresData.pricingDailyDistribution === 'object') {
          Object.entries(exposuresData.pricingDailyDistribution).forEach(([product, dailyValues]) => {
            if (typeof dailyValues !== 'object') return;
            
            Object.entries(dailyValues).forEach(([dateStr, exposure]) => {
              const date = new Date(dateStr);
              if (isNaN(date.getTime())) return;
              
              const monthOfDate = new Date(date).toLocaleString('en-US', { month: 'short' }) + '-' + 
                              date.getFullYear().toString().slice(2);
                              
              if (monthOfDate === month) {
                const canonicalProduct = mapProductToCanonical(product);
                const key = `${monthOfDate}-${canonicalProduct}`;
                
                if (!pricingFromPaperExposures[month][canonicalProduct]) {
                  pricingFromPaperExposures[month][canonicalProduct] = 0;
                }
                
                // For monthly summary, add up all daily values
                if (typeof exposure === 'number') {
                  pricingFromPaperExposures[month][canonicalProduct] += exposure;
                  processedPricingProducts.add(key);
                }
              }
            });
          });
        }
      }
      // CASE 2: Date filtering is OFF - ONLY use direct exposure data
      else {
        // Process paper exposures
        if (exposuresData.paper && typeof exposuresData.paper === 'object') {
          Object.entries(exposuresData.paper).forEach(([prodName, value]) => {
            const canonicalProduct = mapProductToCanonical(prodName);
            
            if (!paperExposures[month][canonicalProduct]) {
              paperExposures[month][canonicalProduct] = 0;
            }
            
            const exposureValue = Number(value) || 0;
            paperExposures[month][canonicalProduct] += exposureValue;
            console.log(`[EXPOSURE] Adding direct paper exposure: ${month}, ${canonicalProduct}, ${exposureValue}`);
          });
        }
        
        // Process pricing exposures
        if (exposuresData.pricing && typeof exposuresData.pricing === 'object') {
          Object.entries(exposuresData.pricing).forEach(([instrument, value]) => {
            const canonicalInstrument = mapProductToCanonical(instrument);
            
            if (!pricingFromPaperExposures[month][canonicalInstrument]) {
              pricingFromPaperExposures[month][canonicalInstrument] = 0;
            }
            
            const exposureValue = Number(value) || 0;
            pricingFromPaperExposures[month][canonicalInstrument] += exposureValue;
            console.log(`[EXPOSURE] Adding direct pricing exposure: ${month}, ${canonicalInstrument}, ${exposureValue}`);
          });
        }
      }
    } 
    // CASE 3: Process using MTM formula - retained for backward compatibility
    else if (leg.mtm_formula && typeof leg.mtm_formula === 'object' && !useOnlyDailyDistribution) {
      // Only process mtm_formula when we are NOT using daily distribution
      const mtmFormula = validateAndParsePricingFormula(leg.mtm_formula);
      
      if (mtmFormula.exposures) {
        const buySellMultiplier = leg.buy_sell === 'buy' ? 1 : -1;
        
        // Process physical exposures from MTM formula
        if (mtmFormula.exposures.physical) {
          Object.entries(mtmFormula.exposures.physical).forEach(([pBaseProduct, weight]) => {
            const canonicalBaseProduct = mapProductToCanonical(pBaseProduct);
            
            if (!paperExposures[month][canonicalBaseProduct]) {
              paperExposures[month][canonicalBaseProduct] = 0;
            }
            
            const actualExposure = typeof weight === 'number' ? weight * buySellMultiplier : 0;
            paperExposures[month][canonicalBaseProduct] += actualExposure;
            
            // Add to pricing exposures as well unless there's an explicit pricing exposure
            if (!mtmFormula.exposures.pricing || !(pBaseProduct in (mtmFormula.exposures.pricing || {}))) {
              if (!pricingFromPaperExposures[month][canonicalBaseProduct]) {
                pricingFromPaperExposures[month][canonicalBaseProduct] = 0;
              }
              pricingFromPaperExposures[month][canonicalBaseProduct] += actualExposure;
            }
          });
        }
        
        // Process pricing exposures from MTM formula
        if (mtmFormula.exposures.pricing) {
          Object.entries(mtmFormula.exposures.pricing).forEach(([pBaseProduct, weight]) => {
            const canonicalBaseProduct = mapProductToCanonical(pBaseProduct);
            
            if (!pricingFromPaperExposures[month][canonicalBaseProduct]) {
              pricingFromPaperExposures[month][canonicalBaseProduct] = 0;
            }
            
            const actualExposure = typeof weight === 'number' ? weight * buySellMultiplier : 0;
            pricingFromPaperExposures[month][canonicalBaseProduct] += actualExposure;
          });
        }
      }
    } 
    // CASE 4: Simple product-based approach (fallback, only when not using daily distribution)
    else if (!useOnlyDailyDistribution) {
      // Only process simple product-based when we are NOT using daily distribution
      const canonicalProduct = mapProductToCanonical(leg.product || 'Unknown');
      
      if (!paperExposures[month][canonicalProduct]) {
        paperExposures[month][canonicalProduct] = 0;
      }
      if (!pricingFromPaperExposures[month][canonicalProduct]) {
        pricingFromPaperExposures[month][canonicalProduct] = 0;
      }
      
      const buySellMultiplier = leg.buy_sell === 'buy' ? 1 : -1;
      const paperExposure = (leg.quantity || 0) * buySellMultiplier;
      
      paperExposures[month][canonicalProduct] += paperExposure;
      pricingFromPaperExposures[month][canonicalProduct] += paperExposure;
    }
  }

  // Log summary to help with debugging
  const paperTotal = Object.values(paperExposures).reduce((total, month) => 
    total + Object.values(month).reduce((sum, val) => sum + val, 0), 0);
  const pricingTotal = Object.values(pricingFromPaperExposures).reduce((total, month) => 
    total + Object.values(month).reduce((sum, val) => sum + val, 0), 0);
  
  console.log(`[EXPOSURE] Paper exposure calculation complete. Mode: ${useOnlyDailyDistribution ? 'daily-distribution' : 'direct-exposure'}`);
  console.log(`[EXPOSURE] Paper total: ${paperTotal}, Pricing total: ${pricingTotal}`);
  
  return { paperExposures, pricingFromPaperExposures };
};
