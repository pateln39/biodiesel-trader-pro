
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
    
    // CASE 1 has been removed - no more instrument field parsing
    
    // Process using exposures object if available (Primary method now)
    if (leg.exposures && typeof leg.exposures === 'object') {
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
          if (businessDaysInMonth > 0 && !exposuresData.paperDailyDistribution) {
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
            if (businessDaysInMonth > 0 && !exposuresData.pricingDailyDistribution) {
              const dailyExposure = exposureValue / businessDaysInMonth;
              
              Object.keys(businessDaysByDate).forEach(dateStr => {
                if (!pricingDailyDistributions[canonicalProduct]) pricingDailyDistributions[canonicalProduct] = {};
                pricingDailyDistributions[canonicalProduct][dateStr] = dailyExposure;
              });
            }
          }
        });
      }
      
      // Process paper exposures
      if (exposuresData.paper && typeof exposuresData.paper === 'object') {
        Object.entries(exposuresData.paper).forEach(([prodName, value]) => {
          const canonicalProduct = mapProductToCanonical(prodName);
          
          if (!paperExposures[month][canonicalProduct]) {
            paperExposures[month][canonicalProduct] = 0;
          }
          
          const exposureValue = Number(value) || 0;
          paperExposures[month][canonicalProduct] += exposureValue;
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
        });
      }
      
      // Use the pre-calculated daily distributions if available
      if (exposuresData.paperDailyDistribution && typeof exposuresData.paperDailyDistribution === 'object') {
        Object.entries(exposuresData.paperDailyDistribution).forEach(([product, dailyValues]) => {
          if (typeof dailyValues !== 'object') return;
          
          Object.entries(dailyValues).forEach(([dateStr, exposure]) => {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return;
            
            const monthOfDate = new Date(date).toLocaleString('en-US', { month: 'short' }) + '-' + 
                              date.getFullYear().toString().slice(2);
                              
            if (monthOfDate === month) {
              const canonicalProduct = mapProductToCanonical(product);
              
              if (!paperExposures[month][canonicalProduct]) {
                paperExposures[month][canonicalProduct] = 0;
              }
              
              // For monthly summary, add up all daily values
              if (typeof exposure === 'number') {
                paperExposures[month][canonicalProduct] += exposure;
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
              
              if (!pricingFromPaperExposures[month][canonicalProduct]) {
                pricingFromPaperExposures[month][canonicalProduct] = 0;
              }
              
              // For monthly summary, add up all daily values
              if (typeof exposure === 'number') {
                pricingFromPaperExposures[month][canonicalProduct] += exposure;
              }
            }
          });
        });
      }
    } 
    // CASE 2: Process using MTM formula - retained for backward compatibility
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
      }
    } 
    // CASE 3: Simple product-based approach (fallback)
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
    }
    
    // Add the daily distributions to the leg if they don't exist
    if (Object.keys(paperDailyDistributions).length > 0) {
      if (!leg.exposures) {
        leg.exposures = {
          physical: {},
          pricing: {},
          paper: {},
          paperDailyDistribution: paperDailyDistributions,
          pricingDailyDistribution: pricingDailyDistributions
        };
      } else if (typeof leg.exposures === 'object' && !leg.exposures.paperDailyDistribution) {
        leg.exposures.paperDailyDistribution = paperDailyDistributions;
        leg.exposures.pricingDailyDistribution = pricingDailyDistributions;
      }
    }
  }
  
  return { paperExposures, pricingFromPaperExposures };
};
