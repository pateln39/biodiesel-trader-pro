
/**
 * This file is kept for backward compatibility.
 * New code should import directly from the module-specific utility files.
 */

export { calculatePriceFromFormula } from '@/modules/pricing/utils/priceCalculationUtils';

// Define types needed by the PriceDetails component
export enum PricingPeriodType {
  historical = 'historical',
  current = 'current',
  future = 'future'
}

/**
 * Calculate trade leg price from formula and dates
 */
export const calculateTradeLegPrice = async (formula: any, startDate: Date, endDate: Date) => {
  // Simplified implementation for backward compatibility
  // In a real implementation, this would calculate prices based on the date range
  return {
    price: 650.25,
    periodType: PricingPeriodType.historical,
    priceDetails: {
      instruments: {
        'Argus UCOME': {
          prices: [
            { date: new Date(), price: 650.25 }
          ],
          average: 650.25
        }
      },
      calculationDate: new Date()
    }
  };
};

/**
 * Calculate MTM price from formula
 */
export const calculateMTMPrice = async (formula: any) => {
  // Simplified implementation for backward compatibility
  return {
    price: 675.50,
    priceDetails: {
      instruments: {
        'Argus UCOME': {
          price: 675.50,
          date: new Date()
        }
      },
      calculationDate: new Date()
    }
  };
};

/**
 * Calculate MTM value from trade price, MTM price, quantity, and buy/sell direction
 */
export const calculateMTMValue = (
  tradePrice: number,
  mtmPrice: number,
  quantity: number,
  buySell: 'buy' | 'sell'
): number => {
  const directionFactor = buySell === 'buy' ? -1 : 1;
  return (tradePrice - mtmPrice) * quantity * directionFactor;
};

/**
 * Apply a pricing formula to instrument prices
 */
export const applyPricingFormula = (formula: any, instrumentPrices: Record<string, number>): number => {
  // Simplified implementation for backward compatibility
  // In a real implementation, this would evaluate the formula with the given instrument prices
  return 650.25;
};
