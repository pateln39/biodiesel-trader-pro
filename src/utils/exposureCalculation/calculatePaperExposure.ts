
import { mapProductToCanonical, parsePaperInstrument } from '@/utils/productMapping';
import { validateAndParsePricingFormula } from '@/utils/formulaUtils';

export interface PaperExposureResult {
  paperExposures: Record<string, Record<string, number>>;
  pricingFromPaperExposures: Record<string, Record<string, number>>;
}

/**
 * Calculate exposure for paper trade legs
 */
export const calculatePaperExposure = (
  paperTradeLegs: any[],
  periods: string[]
): PaperExposureResult => {
  // Initialize exposure objects
  const paperExposures: Record<string, Record<string, number>> = {};
  const pricingFromPaperExposures: Record<string, Record<string, number>> = {};
  
  // Initialize periods
  periods.forEach(month => {
    paperExposures[month] = {};
    pricingFromPaperExposures[month] = {};
  });
  
  for (const leg of paperTradeLegs) {
    const month = leg.period || leg.trading_period || '';
    if (!month || !periods.includes(month)) {
      continue;
    }
    
    // CASE 1: Process using instrument field if available
    if (leg.instrument) {
      const { baseProduct, oppositeProduct, relationshipType } = parsePaperInstrument(leg.instrument);
      
      if (baseProduct) {
        if (!paperExposures[month][baseProduct]) {
          paperExposures[month][baseProduct] = 0;
        }
        if (!pricingFromPaperExposures[month][baseProduct]) {
          pricingFromPaperExposures[month][baseProduct] = 0;
        }
        
        const buySellMultiplier = leg.buy_sell === 'buy' ? 1 : -1;
        const quantity = (leg.quantity || 0) * buySellMultiplier;
        
        paperExposures[month][baseProduct] += quantity;
        pricingFromPaperExposures[month][baseProduct] += quantity;
        
        // Handle DIFF or SPREAD relationships
        if ((relationshipType === 'DIFF' || relationshipType === 'SPREAD') && oppositeProduct) {
          if (!paperExposures[month][oppositeProduct]) {
            paperExposures[month][oppositeProduct] = 0;
          }
          if (!pricingFromPaperExposures[month][oppositeProduct]) {
            pricingFromPaperExposures[month][oppositeProduct] = 0;
          }
          
          paperExposures[month][oppositeProduct] += -quantity;
          pricingFromPaperExposures[month][oppositeProduct] += -quantity;
        }
      }
    } 
    // CASE 2: Process using exposures object if available
    else if (leg.exposures && typeof leg.exposures === 'object') {
      const exposuresData = leg.exposures as Record<string, any>;
      
      // Process physical exposures
      if (exposuresData.physical && typeof exposuresData.physical === 'object') {
        Object.entries(exposuresData.physical).forEach(([prodName, value]) => {
          const canonicalProduct = mapProductToCanonical(prodName);
          
          if (!paperExposures[month][canonicalProduct]) {
            paperExposures[month][canonicalProduct] = 0;
          }
          
          paperExposures[month][canonicalProduct] += Number(value) || 0;
          
          // Add to pricing exposures as well unless there's an explicit pricing exposure
          if (!exposuresData.pricing || typeof exposuresData.pricing !== 'object' || !exposuresData.pricing[prodName]) {
            if (!pricingFromPaperExposures[month][canonicalProduct]) {
              pricingFromPaperExposures[month][canonicalProduct] = 0;
            }
            pricingFromPaperExposures[month][canonicalProduct] += Number(value) || 0;
          }
        });
      }
      
      // Process pricing exposures
      if (exposuresData.pricing && typeof exposuresData.pricing === 'object') {
        Object.entries(exposuresData.pricing).forEach(([instrument, value]) => {
          const canonicalInstrument = mapProductToCanonical(instrument);
          
          if (!pricingFromPaperExposures[month][canonicalInstrument]) {
            pricingFromPaperExposures[month][canonicalInstrument] = 0;
          }
          
          pricingFromPaperExposures[month][canonicalInstrument] += Number(value) || 0;
        });
      }
    } 
    // CASE 3: Process using MTM formula
    else if (leg.mtm_formula && typeof leg.mtm_formula === 'object') {
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
      } else {
        // Fall back to simple product/quantity approach
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
    // CASE 4: Simple product-based approach
    else {
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
  
  return { paperExposures, pricingFromPaperExposures };
};
