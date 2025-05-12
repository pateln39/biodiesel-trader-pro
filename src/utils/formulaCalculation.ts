import { calculateExposures as calculateExposuresFromCalc } from './exposureCalculationUtils';
import { FormulaToken } from '@/types/pricing';
import { Instrument } from '@/types/common';
import { formatMonthCode } from './dateUtils';

// Export this function since it's needed by other modules
export const calculateExposures = calculateExposuresFromCalc;

/**
 * Create an empty exposure result structure
 */
export const createEmptyExposureResult = () => {
  return {
    physical: {
      'Argus UCOME': 0,
      'Argus RME': 0,
      'Argus FAME0': 0,
      'Platts LSGO': 0,
      'Platts Diesel': 0,
      'Argus HVO': 0,
      'ICE GASOIL FUTURES': 0,
      'ICE GASOIL FUTURES (EFP)': 0
    },
    pricing: {
      'Argus UCOME': 0,
      'Argus RME': 0,
      'Argus FAME0': 0,
      'Platts LSGO': 0,
      'Platts Diesel': 0,
      'Argus HVO': 0,
      'ICE GASOIL FUTURES': 0,
      'ICE GASOIL FUTURES (EFP)': 0
    }
  };
};

/**
 * Calculate physical exposure from formula tokens
 */
export const calculatePhysicalExposure = (
  tokens: FormulaToken[], 
  quantity: number, 
  buySell: string,
  dateRange?: { from: Date, to: Date }
) => {
  // Implementation of physical exposure calculation
  const direction = buySell.toLowerCase() === 'buy' ? 1 : -1;
  const exposures: Record<string, number> = {};
  
  for (const token of tokens) {
    if (token.type === 'instrument') {
      const instrument = token.value as Instrument;
      if (!exposures[instrument]) {
        exposures[instrument] = 0;
      }
      exposures[instrument] += quantity * direction;
    }
  }
  
  return exposures;
};

/**
 * Calculate pricing exposure from formula tokens
 */
export const calculatePricingExposure = (
  tokens: FormulaToken[], 
  quantity: number, 
  buySell: string,
  dateRange?: { from: Date, to: Date }
) => {
  // Implementation of pricing exposure calculation
  const direction = buySell.toLowerCase() === 'buy' ? 1 : -1;
  const exposures: Record<string, number> = {};
  
  for (const token of tokens) {
    if (token.type === 'instrument') {
      const instrument = token.value as Instrument;
      if (!exposures[instrument]) {
        exposures[instrument] = 0;
      }
      exposures[instrument] -= quantity * direction; // Pricing exposure is opposite of physical
    }
  }
  
  return exposures;
};

/**
 * Check if a token type can be added at the current position
 */
export const canAddTokenType = (tokens: FormulaToken[], type: string): boolean => {
  if (tokens.length === 0) {
    return ['instrument', 'fixedValue', 'openBracket'].includes(type);
  }
  
  const lastToken = tokens[tokens.length - 1];
  
  switch (type) {
    case 'instrument':
    case 'fixedValue':
    case 'openBracket':
      return lastToken.type === 'operator' || lastToken.type === 'openBracket';
    case 'operator':
      return lastToken.type === 'instrument' || lastToken.type === 'fixedValue' || 
             lastToken.type === 'percentage' || lastToken.type === 'closeBracket';
    case 'percentage':
      return lastToken.type === 'instrument' || lastToken.type === 'fixedValue';
    case 'closeBracket':
      // Need to check bracket balance
      const openCount = tokens.filter(t => t.type === 'openBracket').length;
      const closeCount = tokens.filter(t => t.type === 'closeBracket').length;
      return openCount > closeCount && (lastToken.type === 'instrument' || 
             lastToken.type === 'fixedValue' || lastToken.type === 'percentage' || 
             lastToken.type === 'closeBracket');
    default:
      return false;
  }
};

/**
 * Parse formula from string representation
 */
export const parseFormula = (formulaStr: string): FormulaToken[] => {
  // Implementation of formula parsing
  const tokens: FormulaToken[] = [];
  
  // Simplified implementation for now
  return tokens;
};

/**
 * Calculate daily pricing distribution for a given period
 */
export const calculateDailyPricingDistribution = (
  tokens: any[],
  quantity: number,
  buySell: string,
  startDate: Date,
  endDate: Date
): Record<string, Record<string, number>> => {
  // Implementation of daily pricing distribution calculation
  const distribution: Record<string, Record<string, number>> = {};
  
  // Existing implementation
  
  return distribution;
};

/**
 * Calculate monthly pricing distribution (renamed from calculateMonthlyPricingDistribution)
 */
export const calculateMonthlyPricingDistribution = (
  tokens: any[],
  quantity: number,
  buySell: string,
  startDate: Date,
  endDate: Date
): Record<string, Record<string, number>> => {
  // Implementation of monthly pricing distribution
  const distribution: Record<string, Record<string, number>> = {};
  
  // Get all months between start and end date
  const monthCodes: string[] = [];
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    monthCodes.push(formatMonthCode(currentDate));
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  // For each month code, calculate the distribution
  monthCodes.forEach(monthCode => {
    // Parse month code to get year and month
    const [monthName, yearStr] = monthCode.split('-');
    const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      .findIndex(m => m === monthName);
    
    if (monthIndex !== -1 && yearStr) {
      const year = 2000 + parseInt(yearStr);
      const monthStart = new Date(year, monthIndex, 1);
      const monthEnd = new Date(year, monthIndex + 1, 0); // Last day of month
      
      // Get distribution for this month
      const monthDistribution = calculateDailyPricingDistribution(
        tokens,
        quantity,
        buySell,
        monthStart,
        monthEnd
      );
      
      // Add to overall distribution
      Object.entries(monthDistribution).forEach(([instrument, dates]) => {
        if (!distribution[instrument]) {
          distribution[instrument] = {};
        }
        Object.entries(dates).forEach(([dateStr, amount]) => {
          distribution[instrument][dateStr] = amount;
        });
      });
    }
  });
  
  return distribution;
};
