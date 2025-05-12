import { formatMonthCode } from '@/utils/dateUtils';
import { mapProductToCanonical } from '@/utils/productMapping';
import { validateAndParsePricingFormula } from '@/utils/formulaUtils';
import { PhysicalTrade } from '@/types';
import { doesMonthOverlapRange, isDateInRange, parseISODate } from '@/utils/dateUtils';

export interface PhysicalExposureResult {
  physicalExposures: Record<string, Record<string, number>>;
  pricingExposures: Record<string, Record<string, number>>;
}

/**
 * Calculate exposure for physical trade legs
 */
export const calculatePhysicalExposure = (
  physicalTradeLegs: any[],
  periods: string[],
  dateRangeEnabled: boolean = false,
  dateRange?: { from: Date, to: Date } | undefined
): PhysicalExposureResult => {
  // Initialize exposure objects
  const physicalExposures: Record<string, Record<string, number>> = {};
  const pricingExposures: Record<string, Record<string, number>> = {};
  
  // Initialize periods
  periods.forEach(month => {
    physicalExposures[month] = {};
    pricingExposures[month] = {};
  });
  
  // Default month for cases where it's missing
  const defaultMonth = 'Dec-24';
  
  for (const leg of physicalTradeLegs) {
    // Determine physical exposure month
    let physicalExposureMonth = '';
    if (leg.loading_period_start) {
      physicalExposureMonth = formatMonthCode(new Date(leg.loading_period_start));
    } else if (leg.trading_period) {
      physicalExposureMonth = leg.trading_period;
    } else if (leg.pricing_period_start) {
      physicalExposureMonth = formatMonthCode(new Date(leg.pricing_period_start));
    } else {
      physicalExposureMonth = defaultMonth;
    }

    // Determine pricing exposure month
    let pricingExposureMonth = '';
    if (leg.pricing_type === 'efp' && leg.efp_designated_month) {
      pricingExposureMonth = leg.efp_designated_month;
    } else if (leg.trading_period) {
      pricingExposureMonth = leg.trading_period;
    } else if (leg.pricing_period_start) {
      pricingExposureMonth = formatMonthCode(new Date(leg.pricing_period_start));
    } else {
      pricingExposureMonth = defaultMonth;
    }
    
    // PROCESS PHYSICAL EXPOSURE
    // If date range filtering is enabled, only include physical exposures
    // for months that overlap with the date range
    const includePhysicalExposure = !dateRangeEnabled || 
      !dateRange?.from || 
      (physicalExposureMonth && periods.includes(physicalExposureMonth) && 
       doesMonthOverlapRange(physicalExposureMonth, dateRange.from, dateRange.to || dateRange.from));
    
    if (includePhysicalExposure) {
      const canonicalProduct = mapProductToCanonical(leg.product || 'Unknown');
      if (canonicalProduct !== 'ICE GASOIL FUTURES') { // Skip ICE GASOIL FUTURES for physical exposure
        // CHANGE: Use pricing_formula.exposures.physical as the primary source
        const pricingFormula = validateAndParsePricingFormula(leg.pricing_formula);
        let hasPhysicalExposure = false;
        
        // Check if pricing_formula has physical exposures
        if (pricingFormula && 
            pricingFormula.exposures && 
            pricingFormula.exposures.physical) {
          
          Object.entries(pricingFormula.exposures.physical).forEach(([baseProduct, weight]) => {
            const canonicalBaseProduct = mapProductToCanonical(baseProduct);
            if (!physicalExposures[physicalExposureMonth][canonicalBaseProduct]) {
              physicalExposures[physicalExposureMonth][canonicalBaseProduct] = 0;
            }
            const actualExposure = typeof weight === 'number' ? weight : 0;
            physicalExposures[physicalExposureMonth][canonicalBaseProduct] += actualExposure;
            hasPhysicalExposure = true;
          });
        }
        
        // If pricing_formula doesn't have physical exposures, fall back to default behavior
        if (!hasPhysicalExposure) {
          const quantityMultiplier = leg.buy_sell === 'buy' ? 1 : -1;
          const quantity = (leg.quantity || 0) * quantityMultiplier;
          
          if (!physicalExposures[physicalExposureMonth][canonicalProduct]) {
            physicalExposures[physicalExposureMonth][canonicalProduct] = 0;
          }
          
          // Standard calculation for products without specific formula exposures
          physicalExposures[physicalExposureMonth][canonicalProduct] += quantity;
        }
      }
    }
    
    // PROCESS PRICING EXPOSURE
    // Process pricing exposure based on date range filtering if enabled
    if (dateRangeEnabled && dateRange?.from && dateRange?.to) {
      // For date range filtering, use daily distribution data
      const pricingFormula = validateAndParsePricingFormula(leg.pricing_formula);
      
      // First, check if there's daily distribution data available
      if (pricingFormula.dailyDistribution) {
        // Process each instrument in the daily distribution
        Object.entries(pricingFormula.dailyDistribution).forEach(([instrument, dailyValues]) => {
          if (typeof dailyValues === 'object') {
            const canonicalInstrument = mapProductToCanonical(instrument);
            
            // Process each day's exposure
            Object.entries(dailyValues).forEach(([dateStr, exposure]) => {
              const date = parseISODate(dateStr);
              
              // Check if the date is in the specified range
              if (isDateInRange(date, dateRange.from, dateRange.to || dateRange.from)) {
                const month = formatMonthCode(date);
                
                // Only process if this month is in our periods list
                if (periods.includes(month) && typeof exposure === 'number') {
                  // Add this daily exposure to the pricing exposure for this month and instrument
                  if (!pricingExposures[month][canonicalInstrument]) {
                    pricingExposures[month][canonicalInstrument] = 0;
                  }
                  
                  pricingExposures[month][canonicalInstrument] += exposure;
                }
              }
            });
          }
        });
      }
    } else {
      // Fallback to monthly distribution or standard pricing exposure calculation if no date range filter
      const pricingFormula = validateAndParsePricingFormula(leg.pricing_formula);

      // Handle monthly distribution if exists
      if (pricingFormula.monthlyDistribution) {
        Object.entries(pricingFormula.monthlyDistribution).forEach(([instrument, monthlyValues]) => {
          const canonicalInstrument = mapProductToCanonical(instrument);
          
          Object.entries(monthlyValues).forEach(([monthCode, value]) => {
            if (periods.includes(monthCode) && value !== 0) {
              if (!pricingExposures[monthCode][canonicalInstrument]) {
                pricingExposures[monthCode][canonicalInstrument] = 0;
              }
              pricingExposures[monthCode][canonicalInstrument] += Number(value);
            }
          });
        });
      } 
      // Otherwise use direct pricing exposures
      else if (pricingExposureMonth && periods.includes(pricingExposureMonth) && 
               pricingFormula.exposures && pricingFormula.exposures.pricing) {
        Object.entries(pricingFormula.exposures.pricing).forEach(([instrument, value]) => {
          const canonicalInstrument = mapProductToCanonical(instrument);
          
          if (!pricingExposures[pricingExposureMonth][canonicalInstrument]) {
            pricingExposures[pricingExposureMonth][canonicalInstrument] = 0;
          }
          pricingExposures[pricingExposureMonth][canonicalInstrument] += Number(value) || 0;
        });
      }
      
      // Special handling for EFP trades
      if (leg.pricing_type === 'efp' && pricingExposureMonth && periods.includes(pricingExposureMonth)) {
        if (!leg.efp_agreed_status) {
          const instrumentKey = 'ICE GASOIL FUTURES (EFP)';
          
          if (!pricingExposures[pricingExposureMonth][instrumentKey]) {
            pricingExposures[pricingExposureMonth][instrumentKey] = 0;
          }
          
          const volume = leg.quantity * (leg.tolerance ? (1 + leg.tolerance / 100) : 1);
          const direction = leg.buy_sell === 'buy' ? 1 : -1;
          
          // For EFP trades, the direction is opposite of the physical trade
          const pricingDirection = direction * -1;
          pricingExposures[pricingExposureMonth][instrumentKey] += volume * pricingDirection;
        }
      }
    }
  }
  
  return { physicalExposures, pricingExposures };
};
