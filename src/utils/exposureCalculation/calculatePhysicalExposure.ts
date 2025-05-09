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
        const quantityMultiplier = leg.buy_sell === 'buy' ? 1 : -1;
        const quantity = (leg.quantity || 0) * quantityMultiplier;
        
        if (!physicalExposures[physicalExposureMonth][canonicalProduct]) {
          physicalExposures[physicalExposureMonth][canonicalProduct] = 0;
        }
        
        const mtmFormula = validateAndParsePricingFormula(leg.mtm_formula);
        if (mtmFormula.tokens.length > 0) {
          if (mtmFormula.exposures && mtmFormula.exposures.physical) {
            Object.entries(mtmFormula.exposures.physical).forEach(([baseProduct, weight]) => {
              const canonicalBaseProduct = mapProductToCanonical(baseProduct);
              if (!physicalExposures[physicalExposureMonth][canonicalBaseProduct]) {
                physicalExposures[physicalExposureMonth][canonicalBaseProduct] = 0;
              }
              const actualExposure = typeof weight === 'number' ? weight : 0;
              physicalExposures[physicalExposureMonth][canonicalBaseProduct] += actualExposure;
            });
          } else {
            physicalExposures[physicalExposureMonth][canonicalProduct] += quantity;
          }
        } else {
          physicalExposures[physicalExposureMonth][canonicalProduct] += quantity;
        }
      }
    }
    
    // Process pricing exposure
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
  
  return { physicalExposures, pricingExposures };
};
