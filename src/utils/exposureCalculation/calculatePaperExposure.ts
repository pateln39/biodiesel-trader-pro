
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
    
    // To store daily distributions
    const paperDailyDistributions: Record<string, Record<string, number>> = {};
    const pricingDailyDistributions: Record<string, Record<string, number>> = {};
    
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
        
        // Create daily distribution for base product
        if (businessDaysInMonth > 0) {
          const dailyExposure = quantity / businessDaysInMonth;
          
          Object.keys(businessDaysByDate).forEach(dateStr => {
            if (!paperDailyDistributions[baseProduct]) paperDailyDistributions[baseProduct] = {};
            if (!pricingDailyDistributions[baseProduct]) pricingDailyDistributions[baseProduct] = {};
            
            paperDailyDistributions[baseProduct][dateStr] = dailyExposure;
            pricingDailyDistributions[baseProduct][dateStr] = dailyExposure;
          });
        }
        
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
          
          // Create daily distribution for opposite product
          if (businessDaysInMonth > 0) {
            const dailyExposure = -quantity / businessDaysInMonth;
            
            Object.keys(businessDaysByDate).forEach(dateStr => {
              if (!paperDailyDistributions[oppositeProduct]) paperDailyDistributions[oppositeProduct] = {};
              if (!pricingDailyDistributions[oppositeProduct]) pricingDailyDistributions[oppositeProduct] = {};
              
              paperDailyDistributions[oppositeProduct][dateStr] = dailyExposure;
              pricingDailyDistributions[oppositeProduct][dateStr] = dailyExposure;
            });
          }
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
          
          const exposureValue = Number(value) || 0;
          paperExposures[month][canonicalProduct] += exposureValue;
          
          // Create daily distribution for this product
          if (businessDaysInMonth > 0) {
            const dailyExposure = exposureValue / businessDaysInMonth;
            
            Object.keys(businessDaysByDate).forEach(dateStr => {
              if (!paperDailyDistributions[canonicalProduct]) paperDailyDistributions[canonicalProduct] = {};
              paperDailyDistributions[canonicalProduct][dateStr] = dailyExposure;
            });
          }
          
          // Add to pricing exposures as well unless there's an explicit pricing exposure
          if (!exposuresData.pricing || typeof exposuresData.pricing !== 'object' || !exposuresData.pricing[prodName]) {
            if (!pricingFromPaperExposures[month][canonicalProduct]) {
              pricingFromPaperExposures[month][canonicalProduct] = 0;
            }
            pricingFromPaperExposures[month][canonicalProduct] += exposureValue;
            
            // Create daily distribution for pricing
            if (businessDaysInMonth > 0) {
              const dailyExposure = exposureValue / businessDaysInMonth;
              
              Object.keys(businessDaysByDate).forEach(dateStr => {
                if (!pricingDailyDistributions[canonicalProduct]) pricingDailyDistributions[canonicalProduct] = {};
                pricingDailyDistributions[canonicalProduct][dateStr] = dailyExposure;
              });
            }
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
          
          const exposureValue = Number(value) || 0;
          pricingFromPaperExposures[month][canonicalInstrument] += exposureValue;
          
          // Create daily distribution for this instrument
          if (businessDaysInMonth > 0) {
            const dailyExposure = exposureValue / businessDaysInMonth;
            
            Object.keys(businessDaysByDate).forEach(dateStr => {
              if (!pricingDailyDistributions[canonicalInstrument]) pricingDailyDistributions[canonicalInstrument] = {};
              pricingDailyDistributions[canonicalInstrument][dateStr] = dailyExposure;
            });
          }
        });
      }
      
      // Add the daily distributions to the exposures object if they don't already exist
      if (Object.keys(paperDailyDistributions).length > 0 && !exposuresData.paperDailyDistribution) {
        exposuresData.paperDailyDistribution = paperDailyDistributions;
        leg.exposures.paperDailyDistribution = paperDailyDistributions;
      }
      
      if (Object.keys(pricingDailyDistributions).length > 0 && !exposuresData.pricingDailyDistribution) {
        exposuresData.pricingDailyDistribution = pricingDailyDistributions;
        leg.exposures.pricingDailyDistribution = pricingDailyDistributions;
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
            
            // Create daily distribution
            if (businessDaysInMonth > 0) {
              const dailyExposure = actualExposure / businessDaysInMonth;
              
              Object.keys(businessDaysByDate).forEach(dateStr => {
                if (!paperDailyDistributions[canonicalBaseProduct]) paperDailyDistributions[canonicalBaseProduct] = {};
                paperDailyDistributions[canonicalBaseProduct][dateStr] = dailyExposure;
              });
            }
            
            // Add to pricing exposures as well unless there's an explicit pricing exposure
            if (!mtmFormula.exposures.pricing || !(pBaseProduct in (mtmFormula.exposures.pricing || {}))) {
              if (!pricingFromPaperExposures[month][canonicalBaseProduct]) {
                pricingFromPaperExposures[month][canonicalBaseProduct] = 0;
              }
              pricingFromPaperExposures[month][canonicalBaseProduct] += actualExposure;
              
              // Create daily distribution for pricing
              if (businessDaysInMonth > 0) {
                const dailyExposure = actualExposure / businessDaysInMonth;
                
                Object.keys(businessDaysByDate).forEach(dateStr => {
                  if (!pricingDailyDistributions[canonicalBaseProduct]) pricingDailyDistributions[canonicalBaseProduct] = {};
                  pricingDailyDistributions[canonicalBaseProduct][dateStr] = dailyExposure;
                });
              }
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
            
            // Create daily distribution
            if (businessDaysInMonth > 0) {
              const dailyExposure = actualExposure / businessDaysInMonth;
              
              Object.keys(businessDaysByDate).forEach(dateStr => {
                if (!pricingDailyDistributions[canonicalBaseProduct]) pricingDailyDistributions[canonicalBaseProduct] = {};
                pricingDailyDistributions[canonicalBaseProduct][dateStr] = dailyExposure;
              });
            }
          });
        }
        
        // Add the daily distributions to MTM formula if they don't exist
        if (Object.keys(paperDailyDistributions).length > 0 && !mtmFormula.paperDailyDistribution) {
          mtmFormula.paperDailyDistribution = paperDailyDistributions;
          if (!leg.exposures) {
            leg.exposures = {
              physical: {},
              pricing: {},
              paper: {},
              paperDailyDistribution: paperDailyDistributions,
              pricingDailyDistribution: pricingDailyDistributions
            };
          } else if (typeof leg.exposures === 'object') {
            leg.exposures.paperDailyDistribution = paperDailyDistributions;
            leg.exposures.pricingDailyDistribution = pricingDailyDistributions;
          }
        }
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
      
      // Create daily distribution
      if (businessDaysInMonth > 0) {
        const dailyExposure = paperExposure / businessDaysInMonth;
        
        Object.keys(businessDaysByDate).forEach(dateStr => {
          if (!paperDailyDistributions[canonicalProduct]) paperDailyDistributions[canonicalProduct] = {};
          paperDailyDistributions[canonicalProduct][dateStr] = dailyExposure;
        });
        
        // Add the same for pricing
        Object.keys(businessDaysByDate).forEach(dateStr => {
          if (!pricingDailyDistributions[canonicalProduct]) pricingDailyDistributions[canonicalProduct] = {};
          pricingDailyDistributions[canonicalProduct][dateStr] = dailyExposure;
        });
      }
      
      // Add the daily distributions to the leg
      if (Object.keys(paperDailyDistributions).length > 0) {
        if (!leg.exposures) {
          leg.exposures = {
            physical: {},
            pricing: {},
            paper: {},
            paperDailyDistribution: paperDailyDistributions,
            pricingDailyDistribution: pricingDailyDistributions
          };
        } else if (typeof leg.exposures === 'object') {
          leg.exposures.paperDailyDistribution = paperDailyDistributions;
          leg.exposures.pricingDailyDistribution = pricingDailyDistributions;
        }
      }
    }
  }
  
  return { paperExposures, pricingFromPaperExposures };
};
