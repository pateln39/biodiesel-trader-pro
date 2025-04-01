import { PhysicalTradeLeg, MTMPriceDetail, PricingFormula, Instrument } from '@/types';
import { validateAndParsePricingFormula, formulaToString } from './formulaUtils';
import { fetchPreviousDayPrice } from './efpUtils';
import { extractInstrumentsFromFormula } from './exposureUtils';
import { supabase } from '@/integrations/supabase/client';
import { parseFormula } from './formulaCalculation';

// Define PricingPeriodType enum for export
export type PricingPeriodType = 'historical' | 'current' | 'future';

// Interface for price calculation result
export interface PriceDetail {
  instruments: Record<string, { average: number; prices: { date: Date; price: number }[] }>;
  evaluatedPrice: number;
  fixedComponents?: { value: number; displayValue: string }[];
}

// Fallback mock price data if database fetch fails
const MOCK_PRICES: Record<string, number> = {
  'Argus FAME0': 850,
  'Argus RME': 900,
  'Argus UCOME': 1250,
  'Platts LSGO': 800,
  'Platts Diesel': 950,
  'ICE GASOIL FUTURES': 780
};

// Fetch the latest price for an instrument from the database
async function fetchLatestPrice(instrument: string): Promise<{ price: number; date: Date | null } | null> {
  try {
    // Query pricing_instruments to get the instrument ID
    const { data: instrumentData, error: instrumentError } = await supabase
      .from('pricing_instruments')
      .select('id')
      .eq('display_name', instrument)
      .single();
      
    if (instrumentError || !instrumentData) {
      console.error('Error fetching instrument ID:', instrumentError);
      return null;
    }
    
    // Query historical_prices to get the latest price for this instrument
    const { data: priceData, error: priceError } = await supabase
      .from('historical_prices')
      .select('price, price_date')
      .eq('instrument_id', instrumentData.id)
      .order('price_date', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    if (priceError || !priceData) {
      console.error('Error fetching latest price:', priceError);
      return null;
    }
    
    return { 
      price: priceData.price, 
      date: priceData.price_date ? new Date(priceData.price_date) : null 
    };
  } catch (error) {
    console.error('Error in fetchLatestPrice:', error);
    return null;
  }
}

// Fetch historical prices for an instrument within a given date range
async function fetchHistoricalPrices(
  instrument: string, 
  startDate: Date, 
  endDate: Date
): Promise<{ date: Date; price: number }[]> {
  try {
    // Query pricing_instruments to get the instrument ID
    const { data: instrumentData, error: instrumentError } = await supabase
      .from('pricing_instruments')
      .select('id')
      .eq('display_name', instrument)
      .single();
      
    if (instrumentError || !instrumentData) {
      console.error('Error fetching instrument ID:', instrumentError);
      return [];
    }
    
    // Format dates for the query
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];
    
    // Query historical_prices to get prices within the date range
    const { data: pricesData, error: pricesError } = await supabase
      .from('historical_prices')
      .select('price, price_date')
      .eq('instrument_id', instrumentData.id)
      .gte('price_date', formattedStartDate)
      .lte('price_date', formattedEndDate)
      .order('price_date', { ascending: true });
      
    if (pricesError || !pricesData) {
      console.error('Error fetching historical prices:', pricesError);
      return [];
    }
    
    return pricesData.map(p => ({
      date: new Date(p.price_date),
      price: p.price
    }));
  } catch (error) {
    console.error('Error in fetchHistoricalPrices:', error);
    return [];
  }
}

// Update calculateMTMPrice to handle both standard formulas and EFP legs
export const calculateMTMPrice = async (
  formula: PricingFormula | PhysicalTradeLeg
): Promise<{ price: number; details: MTMPriceDetail }> => {
  // Check if this is a leg with EFP properties
  if ('efpPremium' in formula && formula.pricingType === 'efp') {
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
    instruments: {} as Record<Instrument, { price: number; date: Date | null }>,
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
    const gasoilPrice = await fetchLatestPrice('ICE GASOIL FUTURES');
    
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
};

// Handle standard formula MTM price calculation
const calculateStandardMTMPrice = async (
  formula: PricingFormula
): Promise<{ price: number; details: MTMPriceDetail }> => {
  const details: MTMPriceDetail = {
    instruments: {} as Record<Instrument, { price: number; date: Date | null }>,
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
  
  // Fetch current prices from database
  const instrumentPrices: Record<string, number> = {};
  
  for (const instrument of instruments) {
    const latestPrice = await fetchLatestPrice(instrument);
    
    if (latestPrice) {
      // Add instrument with current price to the details
      details.instruments[instrument] = {
        price: latestPrice.price,
        date: latestPrice.date
      };
      
      instrumentPrices[instrument] = latestPrice.price;
    } else if (MOCK_PRICES[instrument]) {
      // Fallback to mock prices if database query fails
      console.warn(`Using mock price for ${instrument}`);
      details.instruments[instrument] = {
        price: MOCK_PRICES[instrument],
        date: new Date()
      };
      
      instrumentPrices[instrument] = MOCK_PRICES[instrument];
    }
  }
  
  // Calculate price using formula evaluation
  const price = applyPricingFormula(formula, instrumentPrices);
  details.evaluatedPrice = price;
  
  return { price, details };
};

// Calculate trade leg price for a specific period - this is where we need the main EFP fix
export const calculateTradeLegPrice = async (
  formula: PricingFormula | PhysicalTradeLeg,
  startDate: Date,
  endDate: Date
): Promise<{ price: number; periodType: PricingPeriodType; priceDetails: PriceDetail }> => {
  // First, check if this is an EFP trade leg
  if ('pricingType' in formula && formula.pricingType === 'efp') {
    return calculateEfpTradeLegPrice(formula as PhysicalTradeLeg, startDate, endDate);
  }
  
  // Determine period type based on dates
  const now = new Date();
  let periodType: PricingPeriodType = 'current';
  
  if (endDate < now) {
    periodType = 'historical';
  } else if (startDate > now) {
    periodType = 'future';
  }
  
  // Extract instruments from the formula
  const instruments = extractInstrumentsFromFormula(formula as PricingFormula);
  
  // Create price details object
  const priceDetails: PriceDetail = {
    instruments: {},
    evaluatedPrice: 0
  };
  
  // If there are no instruments, return default values
  if (instruments.length === 0) {
    return { price: 0, periodType, priceDetails };
  }
  
  // Create a record to store average prices per instrument
  const instrumentAveragePrices: Record<string, number> = {};
  
  // For each instrument, fetch historical prices in the period from database
  for (const instrument of instruments) {
    const prices = await fetchHistoricalPrices(instrument, startDate, endDate);
    
    if (prices.length > 0) {
      // Calculate average price for the period
      const sum = prices.reduce((acc, p) => acc + p.price, 0);
      const average = sum / prices.length;
      
      priceDetails.instruments[instrument] = {
        average,
        prices
      };
      
      instrumentAveragePrices[instrument] = average;
    } else if (MOCK_HISTORICAL_PRICES[instrument]) {
      // Fallback to mock historical prices if database query fails
      console.warn(`Using mock historical prices for ${instrument}`);
      const mockPrices = MOCK_HISTORICAL_PRICES[instrument].filter(
        p => p.date >= startDate && p.date <= endDate
      );
      
      if (mockPrices.length > 0) {
        const sum = mockPrices.reduce((acc, p) => acc + p.price, 0);
        const average = sum / mockPrices.length;
        
        priceDetails.instruments[instrument] = {
          average,
          prices: mockPrices
        };
        
        instrumentAveragePrices[instrument] = average;
      }
    }
  }
  
  // Calculate price using formula evaluation with average prices
  const price = applyPricingFormula(formula as PricingFormula, instrumentAveragePrices);
  priceDetails.evaluatedPrice = price;
  
  return { price, periodType, priceDetails };
};

// New function to handle EFP trade leg price calculation
const calculateEfpTradeLegPrice = async (
  leg: PhysicalTradeLeg,
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
  
  const priceDetails: PriceDetail = {
    instruments: {},
    evaluatedPrice: 0,
    fixedComponents: []
  };
  
  let calculatedPrice = 0;
  
  if (leg.efpAgreedStatus) {
    // For agreed EFP, use fixed value + premium
    if (leg.efpFixedValue !== undefined) {
      calculatedPrice = leg.efpFixedValue + (leg.efpPremium || 0);
      priceDetails.fixedComponents = [
        { value: leg.efpFixedValue, displayValue: `Fixed: ${leg.efpFixedValue}` },
        { value: leg.efpPremium || 0, displayValue: `Premium: ${leg.efpPremium}` }
      ];
    } else {
      // Missing fixed value
      calculatedPrice = leg.efpPremium || 0;
      priceDetails.fixedComponents = [
        { value: leg.efpPremium || 0, displayValue: `Premium: ${leg.efpPremium}` }
      ];
    }
  } else {
    // For unagreed EFP, use latest ICE GASOIL price + premium
    const gasoilPrices = await fetchHistoricalPrices('ICE GASOIL FUTURES', startDate, endDate);
    
    if (gasoilPrices.length > 0) {
      // Calculate average price for the period
      const sum = gasoilPrices.reduce((acc, p) => acc + p.price, 0);
      const average = sum / gasoilPrices.length;
      
      priceDetails.instruments['ICE GASOIL FUTURES'] = {
        average,
        prices: gasoilPrices
      };
      
      calculatedPrice = average + (leg.efpPremium || 0);
      priceDetails.fixedComponents = [
        { value: leg.efpPremium || 0, displayValue: `Premium: ${leg.efpPremium}` }
      ];
    } else {
      // If no historical prices found, try to get the latest price
      const latestPrice = await fetchLatestPrice('ICE GASOIL FUTURES');
      
      if (latestPrice) {
        priceDetails.instruments['ICE GASOIL FUTURES'] = {
          average: latestPrice.price,
          prices: [{ date: latestPrice.date || new Date(), price: latestPrice.price }]
        };
        
        calculatedPrice = latestPrice.price + (leg.efpPremium || 0);
        priceDetails.fixedComponents = [
          { value: leg.efpPremium || 0, displayValue: `Premium: ${leg.efpPremium}` }
        ];
      } else {
        // Last resort - use mock price if available
        const mockPrice = MOCK_PRICES['ICE GASOIL FUTURES'];
        if (mockPrice) {
          calculatedPrice = mockPrice + (leg.efpPremium || 0);
          priceDetails.fixedComponents = [
            { value: leg.efpPremium || 0, displayValue: `Premium: ${leg.efpPremium}` }
          ];
          
          priceDetails.instruments['ICE GASOIL FUTURES'] = {
            average: mockPrice,
            prices: [{ date: new Date(), price: mockPrice }]
          };
        } else {
          // Nothing available, just use the premium
          calculatedPrice = leg.efpPremium || 0;
          priceDetails.fixedComponents = [
            { value: leg.efpPremium || 0, displayValue: `Premium: ${leg.efpPremium}` }
          ];
        }
      }
    }
  }
  
  priceDetails.evaluatedPrice = calculatedPrice;
  
  return {
    price: calculatedPrice,
    periodType,
    priceDetails
  };
};

// Mock historical prices - used as fallback if database query fails
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
  'Argus UCOME': [
    { date: new Date('2024-03-01'), price: 1240 },
    { date: new Date('2024-03-15'), price: 1250 },
    { date: new Date('2024-04-01'), price: 1260 }
  ],
  'Argus RME': [
    { date: new Date('2024-03-01'), price: 890 },
    { date: new Date('2024-03-15'), price: 900 },
    { date: new Date('2024-04-01'), price: 910 }
  ],
  'Platts Diesel': [
    { date: new Date('2024-03-01'), price: 940 },
    { date: new Date('2024-03-15'), price: 950 },
    { date: new Date('2024-04-01'), price: 960 }
  ],
  'ICE GASOIL FUTURES': [
    { date: new Date('2024-03-01'), price: 770 },
    { date: new Date('2024-03-15'), price: 780 },
    { date: new Date('2024-04-01'), price: 790 }
  ]
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

// Node type for AST evaluation
interface Node {
  type: string;
  value?: any;
  left?: Node;
  right?: Node;
  operator?: string;
}

// New function to evaluate formula AST with actual instrument prices
const evaluateFormulaAST = (node: Node, instrumentPrices: Record<string, number>): number => {
  if (!node) {
    return 0;
  }

  switch (node.type) {
    case 'instrument':
      return instrumentPrices[node.value] || 0;
    
    case 'value':
      return Number(node.value) || 0;
    
    case 'binary':
      const leftValue = evaluateFormulaAST(node.left!, instrumentPrices);
      const rightValue = evaluateFormulaAST(node.right!, instrumentPrices);
      
      switch (node.operator) {
        case '+': return leftValue + rightValue;
        case '-': return leftValue - rightValue;
        case '*': return leftValue * rightValue;
        case '/': return rightValue === 0 ? 0 : leftValue / rightValue;
        default: return 0;
      }
    
    case 'unary':
      const rightVal = evaluateFormulaAST(node.right!, instrumentPrices);
      return node.operator === '-' ? -rightVal : rightVal;
    
    default:
      return 0;
  }
};

// Apply pricing formula to calculate final price using proper evaluation
export const applyPricingFormula = (
  formula: PricingFormula,
  instrumentPrices: Record<string, number>
): number => {
  if (!formula.tokens || formula.tokens.length === 0) {
    return 0;
  }
  
  try {
    // Parse formula into AST
    const ast = parseFormula(formula.tokens);
    
    // Evaluate the AST with actual prices
    return evaluateFormulaAST(ast, instrumentPrices);
  } catch (error) {
    console.error('Error evaluating pricing formula:', error);
    
    // Fallback to average calculation if evaluation fails
    const instruments = extractInstrumentsFromFormula(formula);
    let totalPrice = 0;
    let instrumentCount = 0;
    
    for (const instrument of instruments) {
      if (instrumentPrices[instrument]) {
        totalPrice += instrumentPrices[instrument];
        instrumentCount++;
      }
    }
    
    return instrumentCount > 0 ? totalPrice / instrumentCount : 0;
  }
};
