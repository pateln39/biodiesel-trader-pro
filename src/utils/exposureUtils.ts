
import { PhysicalTrade } from '@/types';
import { mapProductToCanonical } from './productMapping';

// Type definitions for exposure calculations
export interface MonthlyProductVolume {
  [month: string]: {
    [product: string]: number;
  };
}

export interface ExposureResult {
  monthlyPhysical: MonthlyProductVolume;
  monthlyPricing: MonthlyProductVolume;
}

/**
 * Calculate exposure for trades
 */
export const calculateTradeExposures = (trades: PhysicalTrade[]): ExposureResult => {
  // Initialize monthly accumulators
  const monthlyPhysical: MonthlyProductVolume = {};
  const monthlyPricing: MonthlyProductVolume = {};
  
  // Default month for cases where it's missing
  const defaultMonth = 'Dec-24';
  
  for (const trade of trades) {
    for (const leg of trade.legs || []) {
      // Handle EFP legs differently
      if (leg.efpPremium !== undefined) {
        const month = leg.efpDesignatedMonth || defaultMonth;
        
        // Pricing side - depends on agreed status
        if (!monthlyPricing[month]) monthlyPricing[month] = {};
        
        // Physical side - add product exposure regardless of EFP status
        if (!monthlyPhysical[month]) monthlyPhysical[month] = {};
        const physicalProductKey = mapProductToCanonical(leg.product);
        if (!monthlyPhysical[month][physicalProductKey]) monthlyPhysical[month][physicalProductKey] = 0;
        const volume = leg.quantity * (leg.tolerance ? (1 + leg.tolerance / 100) : 1);
        const direction = leg.buySell === 'buy' ? 1 : -1;
        monthlyPhysical[month][physicalProductKey] += volume * direction;
        
        // Pricing side - handle according to agreed status
        if (leg.efpAgreedStatus) {
          // Agreed EFP - No pricing exposure as it's fixed
          // Do not add any pricing exposure
        } else {
          // Unagreed EFP - use dedicated EFP column
          const efpKey = 'ICE GASOIL FUTURES (EFP)';
          if (!monthlyPricing[month][efpKey]) monthlyPricing[month][efpKey] = 0;
          // In exposure table: Buy shows as negative in pricing column, Sell as positive
          monthlyPricing[month][efpKey] += volume * (direction * -1);
        }
      } else {
        // Standard trade leg handling (non-EFP)
        const month = leg.pricingPeriodStart?.toLocaleDateString('default', { 
          month: 'short', 
          year: '2-digit' 
        }) || defaultMonth;
        
        // Physical side
        if (!monthlyPhysical[month]) monthlyPhysical[month] = {};
        const productKey = mapProductToCanonical(leg.product);
        if (!monthlyPhysical[month][productKey]) monthlyPhysical[month][productKey] = 0;
        const volume = leg.quantity * (leg.tolerance ? (1 + leg.tolerance / 100) : 1);
        const direction = leg.buySell === 'buy' ? 1 : -1;
        monthlyPhysical[month][productKey] += volume * direction;
        
        // Pricing side
        if (!monthlyPricing[month]) monthlyPricing[month] = {};
        
        if (leg.formula) {
          const instruments = extractInstrumentsFromFormula(leg.formula);
          
          instruments.forEach(instrument => {
            if (!monthlyPricing[month][instrument]) {
              monthlyPricing[month][instrument] = 0;
            }
            // In exposure table: Buy shows as negative in pricing column, Sell as positive
            monthlyPricing[month][instrument] += volume * (direction * -1);
          });
        }
      }
    }
  }
  
  return {
    monthlyPhysical,
    monthlyPricing
  };
};

/**
 * Extract instrument names from a pricing formula
 */
export const extractInstrumentsFromFormula = (formula: any): string[] => {
  const instruments = new Set<string>();
  
  if (!formula || !formula.tokens) {
    return [];
  }
  
  // Extract instrument references from tokens
  formula.tokens.forEach((token: any) => {
    if (token.type === 'instrument' && token.value) {
      instruments.add(token.value);
    }
  });
  
  return Array.from(instruments);
};
