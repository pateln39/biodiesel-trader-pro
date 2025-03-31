
import { PhysicalTradeLeg, MTMPriceDetail, PricingFormula } from '@/types';
import { validateAndParsePricingFormula, formulaToString } from './formulaUtils';
import { fetchPreviousDayPrice } from './efpUtils';

// Define PricingPeriodType enum for export
export type PricingPeriodType = 'historical' | 'current' | 'future';

// Interface for price calculation result
export interface PriceDetail {
  instruments: Record<string, { average: number; prices: { date: Date; price: number }[] }>;
  evaluatedPrice: number;
  fixedComponents?: { value: number; displayValue: string }[];
}

// Update calculateMTMPrice to handle EFP legs
export const calculateMTMPrice = async (
  formula: PricingFormula | PhysicalTradeLeg
): Promise<{ price: number; details: MTMPriceDetail }> => {
  // Check if this is a leg with EFP properties
  if ('efpPremium' in formula && formula.efpPremium !== undefined) {
    const leg = formula as PhysicalTradeLeg;
    const details: MTMPriceDetail = {
      instruments: {},
      evaluatedPrice: 0,
      fixedComponents: []
    };
    
    // Handle EFP pricing
    if (leg.efpAgreedStatus) {
      // For agreed EFP, use fixed value + premium
      if (leg.efpFixedValue !== undefined) {
        details.evaluatedPrice = leg.efpFixedValue + leg.efpPremium;
        details.fixedComponents = [
          { value: leg.efpFixedValue, displayValue: `EFP Fixed: ${leg.efpFixedValue}` },
          { value: leg.efpPremium, displayValue: `Premium: ${leg.efpPremium}` }
        ];
      } else {
        // Missing fixed value
        details.evaluatedPrice = leg.efpPremium || 0;
        details.fixedComponents = [
          { value: leg.efpPremium || 0, displayValue: `Premium: ${leg.efpPremium}` }
        ];
      }
    } else {
      // For unagreed EFP, use previous day's price + premium
      const gasoilPrice = await fetchPreviousDayPrice('ICE_GASOIL');
      
      if (gasoilPrice) {
        details.instruments['ICE GASOIL FUTURES'] = {
          price: gasoilPrice.price,
          date: gasoilPrice.date
        };
        
        details.evaluatedPrice = gasoilPrice.price + (leg.efpPremium || 0);
        details.fixedComponents = [
          { value: leg.efpPremium || 0, displayValue: `Premium: ${leg.efpPremium}` }
        ];
      } else {
        // No price available
        details.evaluatedPrice = leg.efpPremium || 0;
        details.fixedComponents = [
          { value: leg.efpPremium || 0, displayValue: `Premium: ${leg.efpPremium}` }
        ];
      }
    }
    
    return { price: details.evaluatedPrice, details };
  }
  
  // Original formula evaluation logic for non-EFP legs or formula objects
  let price = 0;
  const formulaObj = 'tokens' in formula ? formula : { tokens: [] };
  
  // Simple placeholder implementation - in real app, this would parse and evaluate the formula
  const details: MTMPriceDetail = {
    instruments: {},
    evaluatedPrice: price
  };
  
  // For empty or invalid formula, return zero
  if (!formulaObj.tokens || formulaObj.tokens.length === 0) {
    return { price: 0, details };
  }
  
  // For demonstration, just use a fixed price
  price = 850;
  details.evaluatedPrice = price;
  
  // Add some dummy instrument data
  details.instruments['Argus FAME0'] = {
    price: 850,
    date: new Date()
  };
  
  return { price, details };
};

// Add the missing calculateTradeLegPrice function
export const calculateTradeLegPrice = async (
  formula: PricingFormula,
  startDate: Date,
  endDate: Date
): Promise<{ price: number; periodType: PricingPeriodType; priceDetails: PriceDetail }> => {
  // Determine period type based on dates
  const now = new Date();
  let periodType: PricingPeriodType = 'current';
  
  if (endDate < now) {
    periodType = 'historical';
  } else if (startDate > now) {
    periodType = 'future';
  }
  
  // Process formula to get a price
  const price = 850; // Fixed price for demonstration
  
  // Create price details
  const priceDetails: PriceDetail = {
    instruments: {
      'Argus FAME0': {
        average: 850,
        prices: [
          { date: new Date(), price: 850 }
        ]
      }
    },
    evaluatedPrice: price
  };
  
  return { price, periodType, priceDetails };
};

// Add the calculateMTMValue function
export const calculateMTMValue = (
  tradePrice: number,
  mtmPrice: number,
  quantity: number,
  buySell: 'buy' | 'sell'
): number => {
  // Buy positions: negative when market price higher than trade price
  // Sell positions: positive when market price higher than trade price
  const direction = buySell === 'buy' ? -1 : 1;
  return (tradePrice - mtmPrice) * quantity * direction;
};

// Add the applyPricingFormula function
export const applyPricingFormula = (
  formula: PricingFormula,
  instrumentPrices: Record<string, number>
): number => {
  if (!formula.tokens || formula.tokens.length === 0) {
    return 0;
  }
  
  // Simple implementation for demonstration
  let price = 0;
  
  // Assuming a simple average of all instrument prices for demonstration
  const prices = Object.values(instrumentPrices);
  if (prices.length > 0) {
    price = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  }
  
  return price;
};
