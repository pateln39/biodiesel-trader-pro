import { ExposureResult, DailyDistribution, DailyDistributionByInstrument, MonthlyDistribution } from '@/types';
import { Instrument } from '@/types/common';
import { PaperTrade } from '@/types/paper';
import { PhysicalTrade } from '@/types/physical';
import { countWorkingDays, formatMonthCode, standardizeMonthCode, monthCodeToDates } from './workingDaysUtils';
// Remove the conflicting import and use the function from workingDaysUtils instead

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
    if (!leg.exposures?.monthlyDistribution) {
      return; // Skip legs without monthly distribution
    }
    
    // Calculate daily distribution for this leg
    const legDistribution = calculateDailyDistribution(
      leg.exposures.monthlyDistribution,
      filterStart,
      filterEnd
    );
    
    // Merge with the result
    Object.entries(legDistribution).forEach(([instrument, dailyDist]) => {
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
