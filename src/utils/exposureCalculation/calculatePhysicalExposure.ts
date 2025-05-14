
import { formatMonthCode } from '@/utils/dateUtils';
import { mapProductToCanonical } from '@/utils/productMapping';
import { validateAndParsePricingFormula } from '@/utils/formulaUtils';
import { PhysicalTrade } from '@/types';

export interface PhysicalExposureResult {
  physicalExposures: Record<string, Record<string, number>>;
  pricingExposures: Record<string, Record<string, number>>;
}

/**
 * Calculate exposure for physical trade legs
 */
export const calculatePhysicalExposure = (
  physicalTradeLegs: any[],
  periods: string[]
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
    
    // Process physical exposure
    if (physicalExposureMonth && periods.includes(physicalExposureMonth)) {
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
    
    // Process pricing exposure - using daily distribution for all trades 
    // SIMPLIFIED: Treat EFP trades the same as other trades with dailyDistribution
    const pricingFormula = validateAndParsePricingFormula(leg.pricing_formula);

    // Primary approach: Use daily distribution if it exists for all trades 
    if (pricingFormula.dailyDistribution) {
      // Process daily distribution data - this will be filtered by date range in useExposureCalculation.ts
      Object.entries(pricingFormula.dailyDistribution).forEach(([instrument, dailyValues]) => {
        const canonicalInstrument = mapProductToCanonical(instrument);
        
        if (typeof dailyValues === 'object') {
          // Daily distribution will be processed in useExposureCalculation.ts
          // Just set up the structure here
          if (!pricingExposures[pricingExposureMonth][canonicalInstrument]) {
            pricingExposures[pricingExposureMonth][canonicalInstrument] = 0;
          }
        }
      });
    } 
    // Secondary approach: Handle monthly distribution if available
    else if (pricingFormula.monthlyDistribution) {
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
    // Tertiary approach: Use direct pricing exposures
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
  }
  
  return { physicalExposures, pricingExposures };
};
