import { PhysicalTradeLeg, MTMPriceDetail, PriceDetail, PricingFormula } from '@/types/pricing';
import { validateAndParsePricingFormula, formulaToString } from './formulaUtils';
import { fetchPreviousDayPrice } from './efpUtils';
import { extractInstrumentsFromFormula } from './exposureUtils';
import { supabase } from '@/integrations/supabase/client';
import { parseFormula } from './formulaCalculation';
import { fetchForwardPrice } from './forwardPriceUtils';
import { isDateRangeInFuture } from './dateUtils';

// Define PricingPeriodType enum for export
export type PricingPeriodType = 'historical' | 'current' | 'future';

// Interface for price calculation result
export interface PriceDetail {
  instruments: Record<string, { average: number; prices: { date: Date; price: number }[] }>;
  evaluatedPrice: number;
  fixedComponents?: { value: number; displayValue: string }[];
  futureMonth?: string;
}

// Fallback mock price data if database fetch fails
const MOCK_PRICES: Record<string, number> = {
  'Argus FAME0': 850,
  'Argus RME': 900,
  'Argus UCOME': 1250,
  'Platts LSGO': 800,
  'Platts Diesel': 950,
  'ICE GASOIL FUTURES': 780,
  'ICE GASOIL FUTURES (EFP)': 780
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
  if ('efpPremium' in formula && formula.efpPremium !== undefined) {
    return calculateEfpMTMPrice(formula as PhysicalTradeLeg);
  }
  
  // Handle standard formula calculation
  // If we have a full leg with mtmFutureMonth, we can use that for future calculations
  if ('mtmFutureMonth' in formula && formula.mtmFutureMonth && 
      'pricingPeriodStart' in formula && 'pricingPeriodEnd' in formula &&
      isDateRangeInFuture(formula.pricingPeriodStart, formula.pricingPeriodEnd)) {
    return calculateFutureMTMPrice(formula as PhysicalTradeLeg);
  }
  
  return calculateStandardMTMPrice(formula as PricingFormula);
};

// New function to handle future MTM calculations
const calculateFutureMTMPrice = async (
  leg: PhysicalTradeLeg
): Promise<{ price: number; details: MTMPriceDetail }> => {
  const details: MTMPriceDetail = {
    instruments: {} as Record<Instrument, { price: number; date: Date | null }>,
    evaluatedPrice: 0,
    fixedComponents: []
  };
  
  // Get the instruments from the MTM formula if available, or fall back to regular pricing formula
  const mtmFormula = leg.mtmFormula || leg.formula;
  if (!mtmFormula || !mtmFormula.tokens || mtmFormula.tokens.length === 0) {
    return { price: 0, details };
  }
  
  const instruments = extractInstrumentsFromFormula(mtmFormula);
  if (instruments.length === 0) {
    return { price: 0, details };
  }
  
  // For future trades, use forward prices based on selected month
  const selectedMonth = leg.mtmFutureMonth;
  if (!selectedMonth) {
    return { price: 0, details };
  }
  
  // Fetch forward prices for all instruments in the formula
  const instrumentPrices: Record<string, number> = {};
  
  for (const instrument of instruments) {
    const forwardPrice = await fetchForwardPrice(instrument, selectedMonth);
    
    if (forwardPrice !== null) {
      details.instruments[instrument] = {
        price: forwardPrice,
        date: null // No specific date for forward prices
      };
      instrumentPrices[instrument] = forwardPrice;
    } else if (MOCK_PRICES[instrument]) {
      // Fallback to mock prices if forward price not found
      console.warn(`Using mock price for ${instrument}`);
      details.instruments[instrument] = {
        price: MOCK_PRICES[instrument],
        date: null
      };
      instrumentPrices[instrument] = MOCK_PRICES[instrument];
    }
  }
  
  // Calculate price using formula evaluation with forward prices
  const price = applyPricingFormula(mtmFormula, instrumentPrices);
  details.evaluatedPrice = price;
  details.futureMonth = selectedMonth;
  
  return { price, details };
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

// Calculate trade leg price for a specific period
export const calculateTradeLegPrice = async (
  formulaOrLeg: PricingFormula | PhysicalTradeLeg,
  startDate: Date,
  endDate: Date
): Promise<{ price: number; periodType: PricingPeriodType; priceDetails: PriceDetail }> => {
  // Check if this is an EFP trade leg
  if ('efpPremium' in formulaOrLeg && formulaOrLeg.efpPremium !== undefined) {
    return calculateEfpTradeLegPrice(formulaOrLeg as PhysicalTradeLeg, startDate, endDate);
  }
  
  // Check if this is a future trade with specified future month
  if ('mtmFutureMonth' in formulaOrLeg && formulaOrLeg.mtmFutureMonth && 
      isDateRangeInFuture(startDate, endDate)) {
    return calculateFutureTradeLegPrice(formulaOrLeg as PhysicalTradeLeg);
  }
  
  // For standard trades, continue with the existing implementation
  return calculateStandardTradeLegPrice(formulaOrLeg as PricingFormula, startDate, endDate);
};

export const calculateStandardTradeLegPrice = async (
  formula: PricingFormula, 
  startDate: Date, 
  endDate: Date
) => {
  // Determine period type based on dates
  const now = new Date();
  let periodType: PricingPeriodType = 'current';
  
  if (endDate < now) {
    periodType = 'historical';
  } else if (startDate > now) {
    periodType = 'future';
  }
  
  // Create price details object
  const priceDetails: PriceDetail = {
    instruments: {},
    evaluatedPrice: 0
  };
  
  // For empty or invalid formula, return zero
  if (!formula.tokens || formula.tokens.length === 0) {
    return { price: 0, periodType, priceDetails };
  }
  
  // Extract instruments from formula
  const instruments = extractInstrumentsFromFormula(formula);
  if (instruments.length === 0) {
    return { price: 0, periodType, priceDetails };
  }
  
  // Fetch historical prices for all instruments in the formula
  const instrumentPrices: Record<string, number> = {};
  
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
      
      instrumentPrices[instrument] = average;
    } else if (MOCK_HISTORICAL_PRICES[instrument]) {
      // Fallback to mock historical prices if database query fails
      console.warn(`Using mock historical prices for ${instrument}`);
      priceDetails.instruments[instrument] = {
        average: MOCK_HISTORICAL_PRICES[instrument][0].price,
        prices: MOCK_HISTORICAL_PRICES[instrument]
      };
      instrumentPrices[instrument] = MOCK_HISTORICAL_PRICES[instrument][0].price;
    } else if (MOCK_PRICES[instrument]) {
      // Fallback to mock prices if historical prices not available
      console.warn(`Using mock price for ${instrument}`);
      priceDetails.instruments[instrument] = {
        average: MOCK_PRICES[instrument],
        prices: [{ date: new Date(), price: MOCK_PRICES[instrument] }]
      };
      instrumentPrices[instrument] = MOCK_PRICES[instrument];
    }
  }
  
  // Calculate price using formula evaluation
  const price = applyPricingFormula(formula, instrumentPrices);
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
  
  // Create price details object
  const priceDetails: PriceDetail = {
    instruments: {},
    evaluatedPrice: 0,
    fixedComponents: []
  };
  
  let price = 0;
  const instrumentName = 'ICE GASOIL FUTURES (EFP)';
  
  // Handle agreed EFP trades - use fixed value + premium
  if (leg.efpAgreedStatus && leg.efpFixedValue !== undefined) {
    price = leg.efpFixedValue + (leg.efpPremium || 0);
    priceDetails.evaluatedPrice = price;
    priceDetails.fixedComponents = [
      { value: leg.efpFixedValue, displayValue: `EFP Fixed: ${leg.efpFixedValue}` },
      { value: leg.efpPremium || 0, displayValue: `Premium: ${leg.efpPremium || 0}` }
    ];
  } 
  // Handle unagreed EFP trades - use historical prices within the period + premium
  else {
    // Get historical prices for ICE GASOIL FUTURES within the pricing period
    const prices = await fetchHistoricalPrices(instrumentName, startDate, endDate);
    
    if (prices.length > 0) {
      // Calculate average price for the period
      const sum = prices.reduce((acc, p) => acc + p.price, 0);
      const average = sum / prices.length;
      
      priceDetails.instruments[instrumentName] = {
        average,
        prices
      };
      
      // Add premium to the average price
      price = average + (leg.efpPremium || 0);
      priceDetails.evaluatedPrice = price;
      priceDetails.fixedComponents = [
        { value: leg.efpPremium || 0, displayValue: `Premium: ${leg.efpPremium || 0}` }
      ];
    } else {
      // If no historical prices found, try to get the latest price
      const latestPrice = await fetchLatestPrice(instrumentName);
      if (latestPrice) {
        price = latestPrice.price + (leg.efpPremium || 0);
        priceDetails.instruments[instrumentName] = {
          average: latestPrice.price,
          prices: [{ date: latestPrice.date || new Date(), price: latestPrice.price }]
        };
      } else if (MOCK_PRICES[instrumentName]) {
        // Fallback to mock prices
        price = MOCK_PRICES[instrumentName] + (leg.efpPremium || 0);
        priceDetails.instruments[instrumentName] = {
          average: MOCK_PRICES[instrumentName],
          prices: [{ date: new Date(), price: MOCK_PRICES[instrumentName] }]
        };
      }
      
      priceDetails.evaluatedPrice = price;
      priceDetails.fixedComponents = [
        { value: leg.efpPremium || 0, displayValue: `Premium: ${leg.efpPremium || 0}` }
      ];
    }
  }
  
  return { price, periodType, priceDetails };
};

// New function to handle future trade leg price calculation with selected month
const calculateFutureTradeLegPrice = async (
  leg: PhysicalTradeLeg
): Promise<{ price: number; periodType: PricingPeriodType; priceDetails: PriceDetail }> => {
  const periodType: PricingPeriodType = 'future';
  
  // Create price details object
  const priceDetails: PriceDetail = {
    instruments: {},
    evaluatedPrice: 0,
    fixedComponents: []
  };
  
  // Get formula to use
  const formula = leg.formula;
  if (!formula || !formula.tokens || formula.tokens.length === 0) {
    return { price: 0, periodType, priceDetails };
  }
  
  // Extract instruments from formula
  const instruments = extractInstrumentsFromFormula(formula);
  if (instruments.length === 0) {
    return { price: 0, periodType, priceDetails };
  }
  
  // Get the selected future month
  const selectedMonth = leg.mtmFutureMonth;
  if (!selectedMonth) {
    return { price: 0, periodType, priceDetails };
  }
  
  // Fetch forward prices for all instruments in the formula
  const instrumentPrices: Record<string, number> = {};
  
  for (const instrument of instruments) {
    const forwardPrice = await fetchForwardPrice(instrument, selectedMonth);
    
    if (forwardPrice !== null) {
      priceDetails.instruments[instrument] = {
        average: forwardPrice,
        prices: [{ date: new Date(), price: forwardPrice }]
      };
      instrumentPrices[instrument] = forwardPrice;
    } else if (MOCK_PRICES[instrument]) {
      // Fallback to mock prices
      const mockPrice = MOCK_PRICES[instrument];
      priceDetails.instruments[instrument] = {
        average: mockPrice,
        prices: [{ date: new Date(), price: mockPrice }]
      };
      instrumentPrices[instrument] = mockPrice;
    }
  }
  
  // Calculate price using formula evaluation
  const price = applyPricingFormula(formula, instrumentPrices);
  priceDetails.evaluatedPrice = price;
  priceDetails.futureMonth = selectedMonth;
  
  return { price, periodType, priceDetails };
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
  ],
  'ICE GASOIL FUTURES (EFP)': [
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
