
import { PhysicalTrade } from '@/types';
import { mapProductToCanonical } from './productMapping';
import { parseForwardMonth } from './dateParsingUtils';

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
      // Handle physical exposure first (this is the same for all trade types)
      const physicalMonth = leg.loadingPeriodStart?.toLocaleDateString('default', { 
        month: 'short', 
        year: '2-digit' 
      }) || defaultMonth;
      
      // Physical side - don't add ICE GASOIL FUTURES to physical exposure
      if (!monthlyPhysical[physicalMonth]) monthlyPhysical[physicalMonth] = {};
      const productKey = mapProductToCanonical(leg.product);
      
      // Skip ICE GASOIL FUTURES for physical exposure
      if (productKey !== 'ICE GASOIL FUTURES') {
        if (!monthlyPhysical[physicalMonth][productKey]) monthlyPhysical[physicalMonth][productKey] = 0;
        const volume = leg.quantity * (leg.tolerance ? (1 + leg.tolerance / 100) : 1);
        const direction = leg.buySell === 'buy' ? 1 : -1;
        monthlyPhysical[physicalMonth][productKey] += volume * direction;
      }
      
      // Now handle pricing exposure - with special case for EFP trades
      if (leg.pricingType === 'efp') {
        // For EFP trades, always use the designated month instead of the pricing period
        const pricingMonth = leg.efpDesignatedMonth || defaultMonth;
        
        if (!monthlyPricing[pricingMonth]) monthlyPricing[pricingMonth] = {};
        
        // Only add exposure for unagreed EFPs
        if (!leg.efpAgreedStatus) {
          // Always use the consistent name 'ICE GASOIL FUTURES (EFP)'
          const instrumentKey = 'ICE GASOIL FUTURES (EFP)';
          
          if (!monthlyPricing[pricingMonth][instrumentKey]) {
            monthlyPricing[pricingMonth][instrumentKey] = 0;
          }
          
          const volume = leg.quantity * (leg.tolerance ? (1 + leg.tolerance / 100) : 1);
          const direction = leg.buySell === 'buy' ? 1 : -1;
          
          // In exposure table: Buy shows as negative in pricing column, Sell as positive
          // For EFP trades, the direction is opposite of the physical trade
          const pricingDirection = direction * -1;
          monthlyPricing[pricingMonth][instrumentKey] += volume * pricingDirection;
        }
      } 
      else {
        // Standard trades - use the pricing period and formula
        const pricingMonth = leg.pricingPeriodStart?.toLocaleDateString('default', { 
          month: 'short', 
          year: '2-digit' 
        }) || defaultMonth;
        
        // Handle monthly distribution if it exists - IMPORTANT: Process regardless of physical month
        if (leg.formula && leg.formula.monthlyDistribution) {
          const { monthlyDistribution } = leg.formula;
          
          Object.entries(monthlyDistribution).forEach(([instrument, monthlyValues]) => {
            const canonicalInstrument = mapProductToCanonical(instrument);
            
            Object.entries(monthlyValues).forEach(([monthCode, value]) => {
              // Process each monthly distribution value regardless of the physical month's validity
              if (!monthlyPricing[monthCode]) {
                monthlyPricing[monthCode] = {};
              }
              
              if (!monthlyPricing[monthCode][canonicalInstrument]) {
                monthlyPricing[monthCode][canonicalInstrument] = 0;
              }
              
              monthlyPricing[monthCode][canonicalInstrument] += value;
            });
          });
        } 
        // Otherwise use the formula exposures
        else if (leg.formula && leg.formula.exposures && leg.formula.exposures.pricing) {
          if (!monthlyPricing[pricingMonth]) monthlyPricing[pricingMonth] = {};
          
          const instruments = extractInstrumentsFromFormula(leg.formula);
          const volume = leg.quantity * (leg.tolerance ? (1 + leg.tolerance / 100) : 1);
          const direction = leg.buySell === 'buy' ? 1 : -1;
          
          instruments.forEach(instrument => {
            if (!monthlyPricing[pricingMonth][instrument]) {
              monthlyPricing[pricingMonth][instrument] = 0;
            }
            // In exposure table: Buy shows as negative in pricing column, Sell as positive
            monthlyPricing[pricingMonth][instrument] += volume * (direction * -1);
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
  
  // Check for direct exposure in the exposures object
  if (formula.exposures && formula.exposures.pricing) {
    Object.entries(formula.exposures.pricing).forEach(([instrument, exposure]) => {
      if (exposure !== 0) {
        instruments.add(instrument);
      }
    });
  }
  
  // Also extract instrument references from tokens as before
  if (formula.tokens.length > 0) {
    formula.tokens.forEach((token: any) => {
      if (token.type === 'instrument' && token.value) {
        instruments.add(token.value);
      }
    });
  }
  
  return Array.from(instruments);
};
