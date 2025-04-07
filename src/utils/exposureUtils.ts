import { PhysicalTrade } from '@/types';
import { mapProductToCanonical } from './productMapping';
import { parseForwardMonth } from './dateParsingUtils';
import { toast } from '@/hooks/use-toast';

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
  try {
    console.log('Calculating exposures for trades:', trades.length);
    
    // Initialize monthly accumulators
    const monthlyPhysical: MonthlyProductVolume = {};
    const monthlyPricing: MonthlyProductVolume = {};
    
    // Default month for cases where it's missing
    const defaultMonth = 'Dec-24';
    
    for (const trade of trades) {
      console.log(`Processing trade ${trade.tradeReference} with ${trade.legs?.length || 0} legs`);
      
      for (const leg of trade.legs || []) {
        // Determine physical exposure month
        let physicalMonth = defaultMonth;
        if (leg.loadingPeriodStart) {
          physicalMonth = leg.loadingPeriodStart.toLocaleDateString('default', { 
            month: 'short', 
            year: '2-digit' 
          });
          console.log(`Using loading period for physical month: ${physicalMonth}`);
        } else {
          console.log(`No loading period start found, using default month: ${defaultMonth}`);
        }
        
        // Initialize month in the accumulator if needed
        if (!monthlyPhysical[physicalMonth]) monthlyPhysical[physicalMonth] = {};
        
        // Physical side - don't add ICE GASOIL FUTURES to physical exposure
        const productKey = mapProductToCanonical(leg.product);
        console.log(`Mapped product ${leg.product} to canonical: ${productKey}`);
        
        // Skip ICE GASOIL FUTURES for physical exposure
        if (productKey !== 'ICE GASOIL FUTURES') {
          if (!monthlyPhysical[physicalMonth][productKey]) monthlyPhysical[physicalMonth][productKey] = 0;
          const volume = leg.quantity * (leg.tolerance ? (1 + leg.tolerance / 100) : 1);
          const direction = leg.buySell === 'buy' ? 1 : -1;
          monthlyPhysical[physicalMonth][productKey] += volume * direction;
          console.log(`Added ${volume * direction} to physical exposure for ${productKey} in ${physicalMonth}`);
        }
        
        // Now handle pricing exposure - with special case for EFP trades
        if (leg.pricingType === 'efp') {
          // For EFP trades, always use the designated month instead of the pricing period
          const pricingMonth = leg.efpDesignatedMonth || defaultMonth;
          console.log(`EFP trade: using designated month for pricing: ${pricingMonth}`);
          
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
            console.log(`Added ${volume * pricingDirection} to pricing exposure for EFP in ${pricingMonth}`);
          } else {
            console.log(`Skipping agreed EFP - no pricing exposure needed`);
          }
        } 
        else {
          // Standard trades - use the pricing period and formula
          let pricingMonth = defaultMonth;
          if (leg.pricingPeriodStart) {
            pricingMonth = leg.pricingPeriodStart.toLocaleDateString('default', { 
              month: 'short', 
              year: '2-digit' 
            });
            console.log(`Using pricing period for pricing month: ${pricingMonth}`);
          } else {
            console.log(`No pricing period start found, using default month: ${defaultMonth}`);
          }
          
          // Handle monthly distribution if it exists
          if (leg.formula && leg.formula.monthlyDistribution) {
            console.log(`Found monthly distribution in formula:`, leg.formula.monthlyDistribution);
            const { monthlyDistribution } = leg.formula;
            
            Object.entries(monthlyDistribution).forEach(([instrument, monthlyValues]) => {
              const canonicalInstrument = mapProductToCanonical(instrument);
              console.log(`Processing monthly distribution for ${instrument} (${canonicalInstrument})`);
              
              Object.entries(monthlyValues).forEach(([monthCode, value]) => {
                console.log(`Adding distribution of ${value} for ${canonicalInstrument} in ${monthCode}`);
                
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
            console.log(`Found pricing exposures in formula:`, leg.formula.exposures.pricing);
            
            if (!monthlyPricing[pricingMonth]) monthlyPricing[pricingMonth] = {};
            
            const instruments = extractInstrumentsFromFormula(leg.formula);
            console.log(`Extracted instruments from formula:`, instruments);
            
            const volume = leg.quantity * (leg.tolerance ? (1 + leg.tolerance / 100) : 1);
            const direction = leg.buySell === 'buy' ? 1 : -1;
            
            instruments.forEach(instrument => {
              console.log(`Processing pricing exposure for ${instrument}`);
              
              if (!monthlyPricing[pricingMonth][instrument]) {
                monthlyPricing[pricingMonth][instrument] = 0;
              }
              
              // In exposure table: Buy shows as negative in pricing column, Sell as positive
              const pricingValue = volume * (direction * -1);
              monthlyPricing[pricingMonth][instrument] += pricingValue;
              console.log(`Added ${pricingValue} to pricing exposure for ${instrument} in ${pricingMonth}`);
            });
          } else {
            console.log(`No pricing exposures found in formula for leg`);
          }
        }
      }
    }
    
    console.log('Final exposure calculation result:', { monthlyPhysical, monthlyPricing });
    return {
      monthlyPhysical,
      monthlyPricing
    };
  } catch (error) {
    console.error('Error calculating trade exposures:', error);
    toast({
      title: "Exposure Calculation Error",
      description: "There was an error calculating trade exposures. Check the console for details.",
      variant: "destructive"
    });
    return {
      monthlyPhysical: {},
      monthlyPricing: {}
    };
  }
};

/**
 * Extract instrument names from a pricing formula
 */
export const extractInstrumentsFromFormula = (formula: any): string[] => {
  const instruments = new Set<string>();
  
  if (!formula || !formula.tokens) {
    console.log('No formula or tokens found for instrument extraction');
    return [];
  }
  
  // Check for direct exposure in the exposures object
  if (formula.exposures && formula.exposures.pricing) {
    console.log('Extracting instruments from exposures.pricing:', formula.exposures.pricing);
    
    Object.entries(formula.exposures.pricing).forEach(([instrument, exposure]) => {
      if (exposure !== 0) {
        const canonicalInstrument = mapProductToCanonical(instrument);
        instruments.add(canonicalInstrument);
        console.log(`Added instrument from exposures: ${canonicalInstrument}`);
      }
    });
  }
  
  // Also extract instrument references from tokens as before
  if (formula.tokens.length > 0) {
    console.log('Extracting instruments from tokens');
    
    formula.tokens.forEach((token: any) => {
      if (token.type === 'instrument' && token.value) {
        const canonicalInstrument = mapProductToCanonical(token.value);
        instruments.add(canonicalInstrument);
        console.log(`Added instrument from tokens: ${canonicalInstrument}`);
      }
    });
  }
  
  return Array.from(instruments);
};
