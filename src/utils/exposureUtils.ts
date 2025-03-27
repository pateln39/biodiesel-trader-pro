
import { ExposureResult, DailyDistribution, DailyDistributionByInstrument, MonthlyDistribution } from '@/types';
import { Instrument } from '@/types/common';
import { PaperTrade } from '@/types/paper';
import { PhysicalTrade } from '@/types/physical';
import { countWorkingDays, formatMonthCode, standardizeMonthCode } from './workingDaysUtils';
// Import monthCodeToDates from workingDaysUtils to avoid conflict
import { monthCodeToDates } from './workingDaysUtils';

// Store a cache of daily distributions to avoid recalculating
let dailyDistributionCache: Record<string, DailyDistributionByInstrument> = {};

// Clear the cache when trades change
export function clearDailyDistributionCache(): void {
  dailyDistributionCache = {};
}

// Get days overlap between a date range and a pricing period
export function getOverlappingDays(
  filterStart: Date,
  filterEnd: Date,
  periodStart: Date,
  periodEnd: Date
): { start: Date; end: Date } | null {
  // Ensure dates are properly compared
  const start = new Date(Math.max(filterStart.getTime(), periodStart.getTime()));
  const end = new Date(Math.min(filterEnd.getTime(), periodEnd.getTime()));
  
  // If no overlap, return null
  if (start > end) {
    return null;
  }
  
  return { start, end };
}

// Check if a date is within a pricing period
export function isDateWithinPricingPeriod(
  date: Date,
  periodStart: Date,
  periodEnd: Date
): boolean {
  return date >= periodStart && date <= periodEnd;
}

// Calculate daily distribution from monthly distribution
export function calculateDailyDistribution(
  monthlyDistribution: Record<string, MonthlyDistribution>,
  filterStart?: Date,
  filterEnd?: Date
): DailyDistributionByInstrument {
  const result: DailyDistributionByInstrument = {};
  
  // Process each instrument's monthly distribution
  Object.entries(monthlyDistribution).forEach(([instrument, distribution]) => {
    result[instrument] = {};
    
    // Process each month in the distribution
    Object.entries(distribution).forEach(([monthCode, quantity]) => {
      // Convert month code to date range
      const { start, end } = monthCodeToDates(monthCode);
      
      // If filter dates are provided, check for overlap
      if (filterStart && filterEnd) {
        const overlap = getOverlappingDays(filterStart, filterEnd, start, end);
        if (!overlap) return; // Skip if no overlap
        
        // Adjust start and end dates to the overlap period
        const adjustedStart = overlap.start;
        const adjustedEnd = overlap.end;
        
        // Calculate working days in the overlap period
        const workingDaysInPeriod = countWorkingDays(adjustedStart, adjustedEnd);
        const totalWorkingDaysInMonth = countWorkingDays(start, end);
        
        // Calculate the proportion of the month that overlaps with the filter period
        const proportion = workingDaysInPeriod / totalWorkingDaysInMonth;
        
        // Distribute the quantity proportionally to each working day in the overlap
        if (workingDaysInPeriod > 0) {
          const dailyQuantity = (quantity * proportion) / workingDaysInPeriod;
          
          // Create a date iterator
          const currentDate = new Date(adjustedStart);
          while (currentDate <= adjustedEnd) {
            if (!countWorkingDays(currentDate, currentDate)) {
              // Skip weekends
              currentDate.setDate(currentDate.getDate() + 1);
              continue;
            }
            
            const dateString = currentDate.toISOString().split('T')[0];
            result[instrument][dateString] = (result[instrument][dateString] || 0) + dailyQuantity;
            
            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
          }
        }
      } else {
        // No filter - distribute across all working days in the month
        const workingDaysInMonth = countWorkingDays(start, end);
        
        if (workingDaysInMonth > 0) {
          const dailyQuantity = quantity / workingDaysInMonth;
          
          // Create a date iterator
          const currentDate = new Date(start);
          while (currentDate <= end) {
            if (!countWorkingDays(currentDate, currentDate)) {
              // Skip weekends
              currentDate.setDate(currentDate.getDate() + 1);
              continue;
            }
            
            const dateString = currentDate.toISOString().split('T')[0];
            result[instrument][dateString] = (result[instrument][dateString] || 0) + dailyQuantity;
            
            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
          }
        }
      }
    });
  });
  
  return result;
}

// Calculate daily distribution by instrument with pricing periods
export function calculateDailyDistributionByInstrument(
  monthlyDistribution: Record<string, MonthlyDistribution>,
  pricingPeriods: Record<string, { start: Date, end: Date }>
): DailyDistributionByInstrument {
  const result: DailyDistributionByInstrument = {};
  
  // Process each instrument's monthly distribution
  Object.entries(monthlyDistribution).forEach(([instrument, distribution]) => {
    // Check if we have a cached result
    const cacheKey = `${instrument}-${JSON.stringify(distribution)}`;
    if (dailyDistributionCache[cacheKey]) {
      result[instrument] = dailyDistributionCache[cacheKey][instrument];
      return;
    }
    
    result[instrument] = {};
    
    // Get pricing period for this instrument
    const pricingPeriod = pricingPeriods[instrument];
    
    // Process each month in the distribution
    Object.entries(distribution).forEach(([monthCode, quantity]) => {
      // Convert month code to date range
      const { start, end } = monthCodeToDates(monthCode);
      
      // If there's a pricing period, check for overlap
      if (pricingPeriod) {
        const overlap = getOverlappingDays(pricingPeriod.start, pricingPeriod.end, start, end);
        if (!overlap) return; // Skip if no overlap
        
        // Adjust start and end dates to the overlap period
        const adjustedStart = overlap.start;
        const adjustedEnd = overlap.end;
        
        // Calculate working days in the overlap period
        const workingDaysInPeriod = countWorkingDays(adjustedStart, adjustedEnd);
        const totalWorkingDaysInMonth = countWorkingDays(start, end);
        
        // Calculate the proportion of the month that overlaps with the pricing period
        const proportion = workingDaysInPeriod / totalWorkingDaysInMonth;
        
        // Distribute the quantity proportionally to each working day in the overlap
        if (workingDaysInPeriod > 0) {
          const dailyQuantity = (quantity * proportion) / workingDaysInPeriod;
          
          // Create a date iterator
          const currentDate = new Date(adjustedStart);
          while (currentDate <= adjustedEnd) {
            if (!countWorkingDays(currentDate, currentDate)) {
              // Skip weekends
              currentDate.setDate(currentDate.getDate() + 1);
              continue;
            }
            
            const dateString = currentDate.toISOString().split('T')[0];
            result[instrument][dateString] = (result[instrument][dateString] || 0) + dailyQuantity;
            
            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
          }
        }
      } else {
        // No pricing period - distribute across all working days in the month
        const workingDaysInMonth = countWorkingDays(start, end);
        
        if (workingDaysInMonth > 0) {
          const dailyQuantity = quantity / workingDaysInMonth;
          
          // Create a date iterator
          const currentDate = new Date(start);
          while (currentDate <= end) {
            if (!countWorkingDays(currentDate, currentDate)) {
              // Skip weekends
              currentDate.setDate(currentDate.getDate() + 1);
              continue;
            }
            
            const dateString = currentDate.toISOString().split('T')[0];
            result[instrument][dateString] = (result[instrument][dateString] || 0) + dailyQuantity;
            
            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
          }
        }
      }
    });
    
    // Cache the result
    dailyDistributionCache[cacheKey] = { [instrument]: result[instrument] };
  });
  
  return result;
}

// Process physical trade for daily distribution
export function processPhysicalTradeForDailyDistribution(
  trade: PhysicalTrade,
  filterStart?: Date,
  filterEnd?: Date
): DailyDistributionByInstrument {
  // Check if the trade has monthly distribution data
  if (!trade.formula?.exposures?.monthlyDistribution) {
    console.log(`Trade ${trade.tradeReference} has no monthly distribution data`);
    return {};
  }
  
  return calculateDailyDistribution(
    trade.formula.exposures.monthlyDistribution,
    filterStart,
    filterEnd
  );
}

// Process paper trade for daily distribution
export function processPaperTradeForDailyDistribution(
  trade: PaperTrade,
  filterStart?: Date, 
  filterEnd?: Date
): DailyDistributionByInstrument {
  // For paper trades, we need to handle the distribution differently
  // as they might not have the same structure as physical trades
  const result: DailyDistributionByInstrument = {};
  
  // Check if the trade has legs with exposures
  if (!trade.legs || trade.legs.length === 0) {
    return result;
  }
  
  // Process each leg
  trade.legs.forEach(leg => {
    // Paper trades don't have monthlyDistribution, they have direct paper/pricing exposures
    if (!leg.exposures) {
      return; // Skip legs without exposures
    }
    
    // Process paper exposures
    if (leg.exposures.paper) {
      // Create daily distribution for paper exposures
      const paperDaily = processPaperTradeExposures(
        leg.exposures.paper as Record<Instrument, number>,
        leg.period
      );
      
      // Merge with result
      Object.entries(paperDaily).forEach(([instrument, dailyDist]) => {
        if (!result[instrument]) {
          result[instrument] = {};
        }
        
        Object.entries(dailyDist).forEach(([date, quantity]) => {
          result[instrument][date] = (result[instrument][date] || 0) + quantity;
        });
      });
    }
    
    // Process pricing exposures if needed
    if (leg.exposures.pricing) {
      // Similar processing for pricing exposures can be added here if needed
      // For now, we're focusing on paper exposures
    }
  });
  
  return result;
}

// Process paper trade exposures by period
export function processPaperTradeExposures(
  exposures: Record<Instrument, number>,
  period: string
): DailyDistributionByInstrument {
  const result: DailyDistributionByInstrument = {};
  
  // Convert period to date range
  const { start, end } = monthCodeToDates(period);
  
  // Calculate working days in the period
  const workingDaysInPeriod = countWorkingDays(start, end);
  
  // Process each instrument
  Object.entries(exposures).forEach(([instrument, quantity]) => {
    result[instrument] = {};
    
    if (workingDaysInPeriod > 0) {
      const dailyQuantity = quantity / workingDaysInPeriod;
      
      // Create a date iterator
      const currentDate = new Date(start);
      while (currentDate <= end) {
        if (!countWorkingDays(currentDate, currentDate)) {
          // Skip weekends
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
        }
        
        const dateString = currentDate.toISOString().split('T')[0];
        result[instrument][dateString] = dailyQuantity;
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
  });
  
  return result;
}

// Filter daily distribution by date range
export function filterDailyDistributionByDateRange(
  dailyDistribution: DailyDistributionByInstrument,
  startDate: Date,
  endDate: Date
): DailyDistributionByInstrument {
  const result: DailyDistributionByInstrument = {};
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  
  Object.entries(dailyDistribution).forEach(([instrument, distribution]) => {
    result[instrument] = {};
    
    Object.entries(distribution).forEach(([dateStr, quantity]) => {
      if (dateStr >= startDateStr && dateStr <= endDateStr) {
        result[instrument][dateStr] = quantity;
      }
    });
  });
  
  return result;
}

// Filter daily distributions by date range with pricing periods
export function filterDailyDistributionsByDateRange(
  dailyDistribution: DailyDistributionByInstrument,
  startDate: Date,
  endDate: Date,
  pricingPeriods?: Record<string, { start: Date, end: Date }>
): DailyDistributionByInstrument {
  const result: DailyDistributionByInstrument = {};
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  
  Object.entries(dailyDistribution).forEach(([instrument, distribution]) => {
    result[instrument] = {};
    
    // Get pricing period for this instrument
    const pricingPeriod = pricingPeriods ? pricingPeriods[instrument] : null;
    
    Object.entries(distribution).forEach(([dateStr, quantity]) => {
      const date = new Date(dateStr);
      
      // Check if date is within filter range
      const isWithinFilter = dateStr >= startDateStr && dateStr <= endDateStr;
      
      // Check if date is within pricing period (if provided)
      const isWithinPricing = pricingPeriod 
        ? isDateWithinPricingPeriod(date, pricingPeriod.start, pricingPeriod.end) 
        : true;
      
      // Only include if date is within both ranges
      if (isWithinFilter && isWithinPricing) {
        result[instrument][dateStr] = quantity;
      }
    });
  });
  
  return result;
}

// Filter paper trade distributions by date range
export function filterPaperTradeDistributions(
  dailyDistribution: DailyDistributionByInstrument,
  startDate: Date,
  endDate: Date,
  period: string
): DailyDistributionByInstrument {
  const result: DailyDistributionByInstrument = {};
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  
  // Convert period to date range
  const { start: periodStart, end: periodEnd } = monthCodeToDates(period);
  
  // Check if filter range overlaps with period
  const overlap = getOverlappingDays(startDate, endDate, periodStart, periodEnd);
  if (!overlap) {
    return result;
  }
  
  Object.entries(dailyDistribution).forEach(([instrument, distribution]) => {
    result[instrument] = {};
    
    Object.entries(distribution).forEach(([dateStr, quantity]) => {
      if (dateStr >= startDateStr && dateStr <= endDateStr) {
        result[instrument][dateStr] = quantity;
      }
    });
  });
  
  return result;
}

// Calculate total exposure values by instrument
export function calculateTotalExposureByInstrument(
  dailyDistribution: DailyDistributionByInstrument
): Record<Instrument, number> {
  const result: Record<Instrument, number> = {
    'Argus UCOME': 0,
    'Argus RME': 0,
    'Argus FAME0': 0,
    'Argus HVO': 0,
    'Platts LSGO': 0,
    'Platts Diesel': 0,
    'ICE GASOIL FUTURES': 0,
  };
  
  Object.entries(dailyDistribution).forEach(([instrument, distribution]) => {
    if (instrument in result) {
      result[instrument as Instrument] = Object.values(distribution).reduce(
        (sum, value) => sum + value, 
        0
      );
    }
  });
  
  return result;
}

// Calculate total exposure from daily distributions
export function calculateTotalExposureFromDailyDistributions(
  dailyDistribution: DailyDistributionByInstrument
): Record<Instrument, number> {
  return calculateTotalExposureByInstrument(dailyDistribution);
}

// Combine multiple daily distributions into one
export function combineDailyDistributions(
  distributions: DailyDistributionByInstrument[]
): DailyDistributionByInstrument {
  const result: DailyDistributionByInstrument = {};
  
  distributions.forEach(distribution => {
    Object.entries(distribution).forEach(([instrument, dailyDist]) => {
      if (!result[instrument]) {
        result[instrument] = {};
      }
      
      Object.entries(dailyDist).forEach(([date, quantity]) => {
        result[instrument][date] = (result[instrument][date] || 0) + quantity;
      });
    });
  });
  
  return result;
}

// Merge exposure objects
export function mergeExposures(
  exposures: ExposureResult[]
): ExposureResult {
  const result: ExposureResult = {
    physical: {
      'Argus UCOME': 0,
      'Argus RME': 0,
      'Argus FAME0': 0,
      'Argus HVO': 0,
      'Platts LSGO': 0,
      'Platts Diesel': 0,
      'ICE GASOIL FUTURES': 0,
    },
    pricing: {
      'Argus UCOME': 0,
      'Argus RME': 0,
      'Argus FAME0': 0,
      'Argus HVO': 0,
      'Platts LSGO': 0,
      'Platts Diesel': 0,
      'ICE GASOIL FUTURES': 0,
    },
    monthlyDistribution: {}
  };
  
  // Merge physical and pricing exposures
  exposures.forEach(exposure => {
    // Merge physical exposures
    Object.entries(exposure.physical).forEach(([instrument, value]) => {
      result.physical[instrument as Instrument] = 
        (result.physical[instrument as Instrument] || 0) + value;
    });
    
    // Merge pricing exposures
    Object.entries(exposure.pricing).forEach(([instrument, value]) => {
      result.pricing[instrument as Instrument] = 
        (result.pricing[instrument as Instrument] || 0) + value;
    });
    
    // Merge paper exposures if they exist
    if (exposure.paper) {
      if (!result.paper) {
        result.paper = {
          'Argus UCOME': 0,
          'Argus RME': 0,
          'Argus FAME0': 0,
          'Argus HVO': 0,
          'Platts LSGO': 0,
          'Platts Diesel': 0,
          'ICE GASOIL FUTURES': 0,
        };
      }
      
      Object.entries(exposure.paper).forEach(([instrument, value]) => {
        result.paper![instrument as Instrument] = 
          (result.paper![instrument as Instrument] || 0) + value;
      });
    }
    
    // Merge monthly distributions
    if (exposure.monthlyDistribution) {
      if (!result.monthlyDistribution) {
        result.monthlyDistribution = {};
      }
      
      Object.entries(exposure.monthlyDistribution).forEach(([instrument, distribution]) => {
        if (!result.monthlyDistribution![instrument]) {
          result.monthlyDistribution![instrument] = {};
        }
        
        Object.entries(distribution).forEach(([month, value]) => {
          result.monthlyDistribution![instrument][month] = 
            (result.monthlyDistribution![instrument][month] || 0) + value;
        });
      });
    }
  });
  
  return result;
}
