import { FormulaToken, PricingFormula, FixedComponent, PriceDetail, MTMPriceDetail } from '@/types/pricing';
import { Instrument } from '@/types/common';
import { Direction } from '@/types/common';
import { evaluateFormula } from './formulaEvaluator';
import { fetchHistoricalPrices, fetchSpotPrices } from '@/services/priceService';
import { differenceInDays, isAfter, isBefore, isEqual, isWithinInterval, startOfDay } from 'date-fns';

export type PricingPeriodType = 'historical' | 'current' | 'future';

// Function to determine what type of pricing period a date range represents
export const determinePricingPeriodType = (startDate: Date, endDate: Date): PricingPeriodType => {
  const today = startOfDay(new Date());

  // If both dates are in the past, it's a historical period
  if (isBefore(endDate, today)) {
    return 'historical';
  }
  
  // If both dates are in the future, it's a future period
  if (isAfter(startDate, today)) {
    return 'future';
  }
  
  // Otherwise, it's a current period (spans today)
  return 'current';
};

// Fixed components for premium calculations
export interface PremiumCalculation {
  premium: number;
  freightCost: number;
  blendingCost: number;
  customsCost: number;
  operationalCost: number;
  marginValue: number;
}

// Parse a premium calculation object from fixed components
export const parsePremiumCalculation = (fixedComponents?: FixedComponent[]): PremiumCalculation => {
  if (!fixedComponents || fixedComponents.length === 0) {
    return {
      premium: 0,
      freightCost: 0,
      blendingCost: 0,
      customsCost: 0,
      operationalCost: 0,
      marginValue: 0
    };
  }
  
  const result: PremiumCalculation = {
    premium: 0,
    freightCost: 0,
    blendingCost: 0,
    customsCost: 0,
    operationalCost: 0,
    marginValue: 0
  };
  
  fixedComponents.forEach(component => {
    const lowerDesc = component.description.toLowerCase();
    
    if (lowerDesc.includes('premium')) {
      result.premium = component.value;
    } else if (lowerDesc.includes('freight')) {
      result.freightCost = component.value;
    } else if (lowerDesc.includes('blending')) {
      result.blendingCost = component.value;
    } else if (lowerDesc.includes('customs')) {
      result.customsCost = component.value;
    } else if (lowerDesc.includes('operational')) {
      result.operationalCost = component.value;
    } else if (lowerDesc.includes('margin')) {
      result.marginValue = component.value;
    }
  });
  
  return result;
};

// Main function to calculate the price for a trade leg's formula
export const calculateTradeLegPrice = async (
  formula: PricingFormula, 
  startDate: Date, 
  endDate: Date
): Promise<{ price: number; periodType: PricingPeriodType; details?: PriceDetail }> => {
  try {
    console.log('[PRICE] Calculating trade leg price:', { startDate, endDate });
    
    if (!formula || !formula.tokens || formula.tokens.length === 0) {
      return { price: 0, periodType: 'future' };
    }
    
    // Determine the type of pricing period we're dealing with
    const periodType = determinePricingPeriodType(startDate, endDate);
    console.log('[PRICE] Period type:', periodType);
    
    // Extract all instruments from the formula
    const instrumentTokens = formula.tokens.filter(token => token.type === 'instrument');
    
    if (instrumentTokens.length === 0) {
      return { price: 0, periodType };
    }
    
    const instruments = instrumentTokens.map(token => token.value as Instrument);
    console.log('[PRICE] Found instruments:', instruments);
    
    // Fetch historical prices for all instruments
    const historicalPrices = await fetchHistoricalPrices(instruments, startDate, endDate);
    
    // Prepare the price details object
    const priceDetails: PriceDetail = {
      instruments: {} as Record<Instrument, { average: number; prices: { date: Date; price: number }[] }>,
      evaluatedPrice: 0,
      fixedComponents: []
    };
    
    // Create an average price map for formula evaluation
    const averagePriceMap: Record<string, number> = {};
    
    // For each instrument, calculate the average price over the pricing period
    for (const instrument of instruments) {
      const instrumentPrices = historicalPrices[instrument] || [];
      
      if (instrumentPrices.length === 0) {
        console.warn(`[PRICE] No historical prices found for ${instrument}`);
        averagePriceMap[instrument] = 0;
        
        priceDetails.instruments[instrument] = {
          average: 0,
          prices: []
        };
        
        continue;
      }
      
      // Calculate the average price
      const sum = instrumentPrices.reduce((total, p) => total + p.price, 0);
      const average = instrumentPrices.length > 0 ? sum / instrumentPrices.length : 0;
      
      console.log(`[PRICE] Average price for ${instrument}: ${average} (from ${instrumentPrices.length} prices)`);
      
      averagePriceMap[instrument] = average;
      
      // Store all prices in the details object
      priceDetails.instruments[instrument] = {
        average,
        prices: instrumentPrices
      };
    }
    
    // Add fixed components to the price details
    const fixedComponents: FixedComponent[] = [];
    
    const fixedValueTokens = formula.tokens.filter(token => token.type === 'fixedValue');
    
    for (const token of fixedValueTokens) {
      const value = parseFloat(token.value);
      if (!isNaN(value)) {
        fixedComponents.push({
          value,
          description: `Fixed component`,
          displayValue: value.toString()
        });
      }
    }
    
    priceDetails.fixedComponents = fixedComponents;
    
    // Evaluate the formula with the average prices
    const calculatedPrice = evaluateFormula(formula.tokens, (token) => {
      if (token.type === 'instrument') {
        return averagePriceMap[token.value] || 0;
      }
      return parseFloat(token.value);
    });
    
    priceDetails.evaluatedPrice = calculatedPrice;
    
    console.log('[PRICE] Calculated price:', calculatedPrice);
    
    return {
      price: calculatedPrice,
      periodType,
      details: priceDetails
    };
  } catch (error) {
    console.error('[PRICE] Error calculating trade leg price:', error);
    return { price: 0, periodType: 'future' };
  }
};

// Calculate Mark-to-Market price for a formula using spot prices
export const calculateMTMPrice = async (
  formula: PricingFormula
): Promise<{ price: number; details?: MTMPriceDetail }> => {
  try {
    console.log('[MTM] Calculating MTM price');
    
    if (!formula || !formula.tokens || formula.tokens.length === 0) {
      return { price: 0 };
    }
    
    // Extract all instruments from the formula
    const instrumentTokens = formula.tokens.filter(token => token.type === 'instrument');
    
    if (instrumentTokens.length === 0) {
      return { price: 0 };
    }
    
    const instruments = instrumentTokens.map(token => token.value as Instrument);
    console.log('[MTM] Found instruments:', instruments);
    
    // Fetch spot prices for all instruments
    const spotPrices = await fetchSpotPrices(instruments);
    
    // Prepare the MTM price details object
    const mtmPriceDetails: MTMPriceDetail = {
      instruments: {} as Record<Instrument, { price: number; date: Date | null }>,
      evaluatedPrice: 0,
      fixedComponents: []
    };
    
    // Create a price map for formula evaluation
    const priceMap: Record<string, number> = {};
    
    // For each instrument, get the spot price
    for (const instrument of instruments) {
      const spotPrice = spotPrices[instrument];
      
      if (!spotPrice) {
        console.warn(`[MTM] No spot price found for ${instrument}`);
        priceMap[instrument] = 0;
        
        mtmPriceDetails.instruments[instrument] = {
          price: 0,
          date: null
        };
        
        continue;
      }
      
      console.log(`[MTM] Spot price for ${instrument}: ${spotPrice.price} (from ${spotPrice.date})`);
      
      priceMap[instrument] = spotPrice.price;
      
      // Store the price in the details object
      mtmPriceDetails.instruments[instrument] = {
        price: spotPrice.price,
        date: spotPrice.date
      };
    }
    
    // Add fixed components to the MTM price details
    const fixedComponents: FixedComponent[] = [];
    
    const fixedValueTokens = formula.tokens.filter(token => token.type === 'fixedValue');
    
    for (const token of fixedValueTokens) {
      const value = parseFloat(token.value);
      if (!isNaN(value)) {
        fixedComponents.push({
          value,
          description: `Fixed component`,
          displayValue: value.toString()
        });
      }
    }
    
    mtmPriceDetails.fixedComponents = fixedComponents;
    
    // Evaluate the formula with the spot prices
    const calculatedPrice = evaluateFormula(formula.tokens, (token) => {
      if (token.type === 'instrument') {
        return priceMap[token.value] || 0;
      }
      return parseFloat(token.value);
    });
    
    mtmPriceDetails.evaluatedPrice = calculatedPrice;
    
    console.log('[MTM] Calculated MTM price:', calculatedPrice);
    
    return {
      price: calculatedPrice,
      details: mtmPriceDetails
    };
  } catch (error) {
    console.error('[MTM] Error calculating MTM price:', error);
    return { price: 0 };
  }
};

// Calculate the MTM value based on original price and MTM price
export const calculateMTMValue = (
  originalPrice: number,
  mtmPrice: number,
  quantity: number,
  buySell: 'buy' | 'sell'
): number => {
  const priceDifference = mtmPrice - originalPrice;
  
  // For buys, a positive price difference is a gain, negative is a loss
  // For sells, a positive price difference is a loss, negative is a gain
  const multiplier = buySell === 'buy' ? 1 : -1;
  
  return priceDifference * quantity * multiplier;
};

// Get mock prices for development
export const getMockPrices = (
  instruments: Instrument[]
): Record<Instrument, number> => {
  const mockPrices: Partial<Record<Instrument, number>> = {
    'Argus UCOME': 1250,
    'Argus RME': 950,
    'Argus FAME0': 850,
    'Platts LSGO': 700,
    'Platts Diesel': 720,
    'Argus HVO': 1350,
    'ICE GASOIL FUTURES': 680,
  };
  
  const result = {} as Record<Instrument, number>;
  
  for (const instrument of instruments) {
    result[instrument] = mockPrices[instrument] || 0;
  }
  
  return result;
};

// Get mock historical prices for development
export const getMockHistoricalPrices = (
  instruments: Instrument[],
  startDate: Date,
  endDate: Date
): Record<Instrument, { date: Date; price: number }[]> => {
  const basePrices: Partial<Record<Instrument, number>> = {
    'Argus UCOME': 1250,
    'Argus RME': 950,
    'Argus FAME0': 850,
    'Platts LSGO': 700,
    'Platts Diesel': 720,
    'Argus HVO': 1350,
    'ICE GASOIL FUTURES': 680,
  };
  
  const result = {} as Record<Instrument, { date: Date; price: number }[]>;
  
  const days = differenceInDays(endDate, startDate) + 1;
  
  for (const instrument of instruments) {
    const basePrice = basePrices[instrument] || 0;
    const prices: { date: Date; price: number }[] = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // Add some randomness to the price
      const randomFactor = 0.98 + Math.random() * 0.04; // Random between 0.98 and 1.02
      const price = basePrice * randomFactor;
      
      prices.push({
        date,
        price
      });
    }
    
    result[instrument] = prices;
  }
  
  return result;
};

// Get a random mock price with some volatility
export const getRandomPrice = (basePrice: number): number => {
  const volatility = 0.05; // 5% volatility
  const change = (Math.random() - 0.5) * 2 * volatility; // Random between -volatility and +volatility
  return basePrice * (1 + change);
};
