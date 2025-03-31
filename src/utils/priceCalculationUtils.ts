
import { PhysicalTradeLeg, MTMPriceDetail, PricingFormula } from '@/types';
import { validateAndParsePricingFormula, formulaToString } from './formulaUtils';
import { fetchPreviousDayPrice } from './efpUtils';
import { extractInstrumentsFromFormula } from './exposureUtils';

// Define PricingPeriodType enum for export
export type PricingPeriodType = 'historical' | 'current' | 'future';

// Interface for price calculation result
export interface PriceDetail {
  instruments: Record<string, { average: number; prices: { date: Date; price: number }[] }>;
  evaluatedPrice: number;
  fixedComponents?: { value: number; displayValue: string }[];
}

// Mock price data - in real application, this would come from API
const MOCK_PRICES: Record<string, number> = {
  'Argus FAME0': 850,
  'Argus RME': 900,
  'Argus UCOME': 1250,
  'Platts LSGO': 800,
  'Platts Diesel': 950,
  'ICE GASOIL FUTURES': 780,
  'ICE GASOIL FUTURES (EFP)': 780  // Added EFP-specific price
};

// Mock historical prices - in real application, these would come from API
const MOCK_HISTORICAL_PRICES: Record<string, { date: Date; price: number }[]> = {
  'Argus FAME0': [
    { date: new Date('2024-03-01'), price: 840 },
    { date: new Date('2024-03-15'), price: 850 },
    { date: new Date('2024-04-01'), price: 855 }
  ],
  'Platts LSGO': [
    { date: new Date('2024-03-01'), price: 790 },
    { date: new Date('2024-03-15'), price: 800 },
    { date: new Date('2024-04-01'), price: 810 }
  ],
  'ICE GASOIL FUTURES': [
    { date: new Date('2024-03-01'), price: 775 },
    { date: new Date('2024-03-15'), price: 780 },
    { date: new Date('2024-04-01'), price: 785 }
  ],
  'ICE GASOIL FUTURES (EFP)': [
    { date: new Date('2024-03-01'), price: 775 },
    { date: new Date('2024-03-15'), price: 780 },
    { date: new Date('2024-04-01'), price: 785 }
  ]
};

// Update calculateMTMPrice to handle both standard formulas and EFP legs
export const calculateMTMPrice = async (
  formula: PricingFormula | PhysicalTradeLeg
): Promise<{ price: number; details: MTMPriceDetail }> => {
  // Check if this is a leg with EFP properties
  if ('efpPremium' in formula && formula.efpPremium !== undefined) {
    return calculateEfpMTMPrice(formula as PhysicalTradeLeg);
  }
  
  // Handle standard formula calculation
  return calculateStandardMTMPrice(formula as PricingFormula);
};

// Handle EFP-specific MTM price calculation
const calculateEfpMTMPrice = async (
  leg: PhysicalTradeLeg
): Promise<{ price: number; details: MTMPriceDetail }> => {
  const details: MTMPriceDetail = {
    instruments: {},
    evaluatedPrice: 0,
    fixedComponents: []
  };
  
  // Handle EFP pricing
  if (leg.efpAgreedStatus) {
    // For agreed EFP, use fixed value + premium
    if (leg.efpFixedValue !== undefined) {
      details.evaluatedPrice = leg.efpFixedValue + (leg.efpPremium || 0);
      details.fixedComponents = [
        { value: leg.efpFixedValue, displayValue: `EFP Fixed: ${leg.efpFixedValue}` },
        { value: leg.efpPremium || 0, displayValue: `Premium: ${leg.efpPremium}` }
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
      details.instruments['ICE GASOIL FUTURES (EFP)'] = {
        price: gasoilPrice.price,
        date: gasoilPrice.date
      };
      
      details.evaluatedPrice = gasoilPrice.price + (leg.efpPremium || 0);
      details.fixedComponents = [
        { value: leg.efpPremium || 0, displayValue: `Premium: ${leg.efpPremium}` }
      ];
    } else {
      // No price available, use mock data
      details.instruments['ICE GASOIL FUTURES (EFP)'] = {
        price: MOCK_PRICES['ICE GASOIL FUTURES (EFP)'],
        date: new Date()
      };
      
      details.evaluatedPrice = MOCK_PRICES['ICE GASOIL FUTURES (EFP)'] + (leg.efpPremium || 0);
      details.fixedComponents = [
        { value: leg.efpPremium || 0, displayValue: `Premium: ${leg.efpPremium}` }
      ];
    }
  }
  
  return { price: details.evaluatedPrice, details };
};

// Handle standard formula MTM price calculation
const calculateStandardMTMPrice = async (
  formula: PricingFormula
): Promise<{ price: number; details: MTMPriceDetail }> => {
  const details: MTMPriceDetail = {
    instruments: {},
    evaluatedPrice: 0
  };
  
  // For empty or invalid formula, return zero
  if (!formula.tokens || formula.tokens.length === 0) {
    return { price: 0, details };
  }
  
  // Extract instruments from formula
  const instruments = extractInstrumentsFromFormula(formula);
  
  if (instruments.length === 0) {
    return { price: 0, details };
  }
  
  // In a real implementation, we would fetch current market prices
  // For now, use our mock prices
  let totalPrice = 0;
  let instrumentCount = 0;
  
  for (const instrument of instruments) {
    if (MOCK_PRICES[instrument]) {
      // Add instrument with current price to the details
      details.instruments[instrument] = {
        price: MOCK_PRICES[instrument],
        date: new Date() // Current date for MTM
      };
      
      totalPrice += MOCK_PRICES[instrument];
      instrumentCount++;
    }
  }
  
  // Simple average for demonstration purposes
  // In a real system, you'd apply the actual formula calculation
  const price = instrumentCount > 0 ? totalPrice / instrumentCount : 0;
  details.evaluatedPrice = price;
  
  return { price, details };
};

// Calculate trade leg price for a specific period
export const calculateTradeLegPrice = async (
  formula: PricingFormula | PhysicalTradeLeg,
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

  // Check if this is an EFP leg
  if ('efpPremium' in formula && formula.efpPremium !== undefined) {
    return calculateEfpTradeLegPrice(formula as PhysicalTradeLeg, startDate, endDate, periodType);
  }
  
  // Handle standard formula calculation
  return calculateStandardTradeLegPrice(formula as PricingFormula, startDate, endDate, periodType);
};

// Calculate EFP trade leg price
const calculateEfpTradeLegPrice = async (
  leg: PhysicalTradeLeg,
  startDate: Date,
  endDate: Date,
  periodType: PricingPeriodType
): Promise<{ price: number; periodType: PricingPeriodType; priceDetails: PriceDetail }> => {
  const priceDetails: PriceDetail = {
    instruments: {},
    evaluatedPrice: 0,
    fixedComponents: []
  };
  
  if (leg.efpAgreedStatus && leg.efpFixedValue !== undefined) {
    // Agreed EFP with fixed value
    const fixedPrice = leg.efpFixedValue;
    const premium = leg.efpPremium || 0;
    
    priceDetails.evaluatedPrice = fixedPrice + premium;
    priceDetails.fixedComponents = [
      { value: fixedPrice, displayValue: `EFP Fixed: ${fixedPrice}` },
      { value: premium, displayValue: `Premium: ${premium}` }
    ];
    
    return { price: priceDetails.evaluatedPrice, periodType, priceDetails };
  } else {
    // Unagreed EFP or agreed without fixed value
    // Get historical prices for the instrument in the period
    const instrumentKey = 'ICE GASOIL FUTURES (EFP)';
    const prices = MOCK_HISTORICAL_PRICES[instrumentKey]?.filter(
      p => p.date >= startDate && p.date <= endDate
    ) || [];
    
    if (prices.length > 0) {
      // Calculate average price for the period
      const sum = prices.reduce((acc, p) => acc + p.price, 0);
      const average = sum / prices.length;
      
      priceDetails.instruments[instrumentKey] = {
        average,
        prices
      };
      
      const premium = leg.efpPremium || 0;
      priceDetails.evaluatedPrice = average + premium;
      priceDetails.fixedComponents = [
        { value: premium, displayValue: `Premium: ${premium}` }
      ];
      
      return { price: priceDetails.evaluatedPrice, periodType, priceDetails };
    } else {
      // No historical prices available, use mock current price
      const currentPrice = MOCK_PRICES[instrumentKey] || 0;
      const premium = leg.efpPremium || 0;
      
      priceDetails.instruments[instrumentKey] = {
        average: currentPrice,
        prices: [{ date: new Date(), price: currentPrice }]
      };
      
      priceDetails.evaluatedPrice = currentPrice + premium;
      priceDetails.fixedComponents = [
        { value: premium, displayValue: `Premium: ${premium}` }
      ];
      
      return { price: priceDetails.evaluatedPrice, periodType, priceDetails };
    }
  }
};

// Calculate standard formula trade leg price
const calculateStandardTradeLegPrice = async (
  formula: PricingFormula,
  startDate: Date,
  endDate: Date,
  periodType: PricingPeriodType
): Promise<{ price: number; periodType: PricingPeriodType; priceDetails: PriceDetail }> => {
  // Create price details object
  const priceDetails: PriceDetail = {
    instruments: {},
    evaluatedPrice: 0
  };
  
  // Extract instruments from the formula
  const instruments = extractInstrumentsFromFormula(formula);
  
  // If there are no instruments, return default values
  if (instruments.length === 0) {
    return { price: 0, periodType, priceDetails };
  }
  
  let totalPrice = 0;
  let instrumentCount = 0;
  
  // For each instrument, get historical prices in the period
  for (const instrument of instruments) {
    if (MOCK_HISTORICAL_PRICES[instrument]) {
      const prices = MOCK_HISTORICAL_PRICES[instrument].filter(
        p => p.date >= startDate && p.date <= endDate
      );
      
      if (prices.length > 0) {
        // Calculate average price for the period
        const sum = prices.reduce((acc, p) => acc + p.price, 0);
        const average = sum / prices.length;
        
        priceDetails.instruments[instrument] = {
          average,
          prices
        };
        
        totalPrice += average;
        instrumentCount++;
      }
    }
  }
  
  // Calculate average price across all instruments
  // In a real system, we'd properly evaluate the formula
  const price = instrumentCount > 0 ? totalPrice / instrumentCount : 0;
  priceDetails.evaluatedPrice = price;
  
  return { price, periodType, priceDetails };
};

// Calculate MTM value based on trade price and MTM price
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

// Apply pricing formula to calculate final price
export const applyPricingFormula = (
  formula: PricingFormula,
  instrumentPrices: Record<string, number>
): number => {
  if (!formula.tokens || formula.tokens.length === 0) {
    return 0;
  }
  
  // Simple implementation for demonstration
  const instruments = extractInstrumentsFromFormula(formula);
  
  if (instruments.length === 0) {
    return 0;
  }
  
  // Simple average calculation for demo purposes
  // In a real system, you'd evaluate the formula with the actual prices
  let totalPrice = 0;
  let instrumentCount = 0;
  
  for (const instrument of instruments) {
    if (instrumentPrices[instrument]) {
      totalPrice += instrumentPrices[instrument];
      instrumentCount++;
    }
  }
  
  return instrumentCount > 0 ? totalPrice / instrumentCount : 0;
};
