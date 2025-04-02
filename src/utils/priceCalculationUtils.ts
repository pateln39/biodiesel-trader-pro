import { PhysicalTradeLeg, MTMPriceDetail, PricingFormula, Instrument } from '@/types';
import { validateAndParsePricingFormula, formulaToString } from './formulaUtils';
import { fetchPreviousDayPrice } from './efpUtils';
import { extractInstrumentsFromFormula } from './exposureUtils';
import { supabase } from '@/integrations/supabase/client';
import { parseFormula } from './formulaCalculation';
import { isDateRangeInFuture, parseMonthCodeToDbDate } from './mtmUtils';

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

// Add a function to fetch forward prices
async function fetchForwardPrice(
  instrument: string,
  monthCode: string
): Promise<number | null> {
  try {
    console.log(`Fetching forward price for ${instrument} with month code ${monthCode}`);
    
    // Parse the month code to get date format required by database
    const formattedDate = parseMonthCodeToDbDate(monthCode);
    
    if (!formattedDate) {
      console.error(`Failed to parse month code: ${monthCode}`);
      return null;
    }
    
    console.log(`Looking for forward price for date: ${formattedDate}`);
    
    // Query pricing_instruments to get the instrument ID
    const { data: instrumentData, error: instrumentError } = await supabase
      .from('pricing_instruments')
      .select('id')
      .eq('display_name', instrument)
      .single();
      
    if (instrumentError || !instrumentData) {
      console.error(`Error fetching instrument ID for ${instrument}:`, instrumentError);
      return null;
    }
    
    console.log(`Found instrument ID for ${instrument}: ${instrumentData.id}`);
    
    // Query forward_prices to get the price for this instrument and month
    const { data: forwardData, error: forwardError } = await supabase
      .from('forward_prices')
      .select('price')
      .eq('instrument_id', instrumentData.id)
      .eq('forward_month', formattedDate)
      .maybeSingle();
      
    if (forwardError) {
      console.error(`Error fetching forward price for ${instrument} ${monthCode}:`, forwardError);
      return null;
    }
    
    if (forwardData) {
      console.log(`Found forward price for ${instrument} ${monthCode}: ${forwardData.price}`);
      return forwardData.price;
    }
    
    // If no forward price is found, fall back to the latest price
    console.warn(`No forward price found for ${instrument} ${monthCode}, falling back to latest`);
    const latestPrice = await fetchLatestPrice(instrument);
    return latestPrice?.price || null;
  } catch (error) {
    console.error('Error in fetchForwardPrice:', error);
    return null;
  }
}

// Update calculateMTMPrice to properly handle MTM future month option
export const calculateMTMPrice = async (
  formula: PricingFormula | PhysicalTradeLeg,
  startDate?: Date,
  endDate?: Date,
  mtmFutureMonth?: string
): Promise<{ price: number; details: MTMPriceDetail }> => {
  console.log('calculateMTMPrice called with params:', { 
    formula, 
    startDate, 
    endDate, 
    mtmFutureMonth: mtmFutureMonth || ('mtmFutureMonth' in formula ? formula.mtmFutureMonth : undefined)
  });

  // Check if an explicit mtmFutureMonth was provided or is available in the formula
  const effectiveMtmFutureMonth = mtmFutureMonth || 
    ('mtmFutureMonth' in formula ? formula.mtmFutureMonth as string : undefined);

  // Check if this is a leg with future pricing period that needs forward price calculation
  if (effectiveMtmFutureMonth && 
      startDate && endDate && 
      isDateRangeInFuture(startDate, endDate)) {
    console.log(`Using future MTM calculation with month: ${effectiveMtmFutureMonth}`);
    return calculateFutureMTMPrice(formula, effectiveMtmFutureMonth);
  }
  
  // Check if this is a leg with EFP properties
  if ('efpPremium' in formula && formula.efpPremium !== undefined) {
    console.log('Using EFP MTM calculation');
    return calculateEfpMTMPrice(formula as PhysicalTradeLeg);
  }
  
  // Handle standard formula calculation
  console.log('Using standard MTM calculation');
  return calculateStandardMTMPrice(formula as PricingFormula);
};

// New function to handle MTM calculation for future trades with specified month
const calculateFutureMTMPrice = async (
  leg: PhysicalTradeLeg | PricingFormula,
  mtmFutureMonth: string
): Promise<{ price: number; details: MTMPriceDetail }> => {
  console.log(`calculateFutureMTMPrice called with month: ${mtmFutureMonth}`);
  
  const details: MTMPriceDetail = {
    instruments: {} as Record<Instrument, { price: number; date: Date | null }>,
    evaluatedPrice: 0,
    fixedComponents: []
  };
  
  // If the leg has an MTM formula, use it to determine which instruments to fetch
  if ('mtmFormula' in leg && leg.mtmFormula && leg.mtmFormula.tokens && leg.mtmFormula.tokens.length > 0) {
    console.log('Using MTM formula for future calculation:', leg.mtmFormula);
    const instruments = extractInstrumentsFromFormula(leg.mtmFormula);
    console.log('Extracted instruments from formula:', instruments);
    
    const instrumentPrices: Record<string, number> = {};
    
    // Fetch forward prices for each instrument based on the specified month
    for (const instrument of instruments) {
      console.log(`Fetching forward price for ${instrument} with month ${mtmFutureMonth}`);
      const forwardPrice = await fetchForwardPrice(instrument, mtmFutureMonth);
      
      if (forwardPrice !== null) {
        console.log(`Found forward price for ${instrument}: ${forwardPrice}`);
        details.instruments[instrument] = {
          price: forwardPrice,
          date: null // We don't have a specific date for forward prices
        };
        
        instrumentPrices[instrument] = forwardPrice;
      } else if (MOCK_PRICES[instrument]) {
        console.log(`Using mock price for ${instrument}: ${MOCK_PRICES[instrument]}`);
        details.instruments[instrument] = {
          price: MOCK_PRICES[instrument],
          date: new Date()
        };
        
        instrumentPrices[instrument] = MOCK_PRICES[instrument];
      }
    }
    
    // Calculate price using formula evaluation
    console.log('Evaluating formula with prices:', instrumentPrices);
    const price = applyPricingFormula(leg.mtmFormula, instrumentPrices);
    console.log(`Formula evaluation result: ${price}`);
    details.evaluatedPrice = price;
    
    return { price, details };
  } 
  // If leg has tokens property directly, use it (for PricingFormula objects)
  else if ('tokens' in leg && leg.tokens && leg.tokens.length > 0) {
    console.log('Using direct tokens for future calculation:', leg.tokens);
    const instruments = extractInstrumentsFromFormula(leg as PricingFormula);
    console.log('Extracted instruments:', instruments);
    
    const instrumentPrices: Record<string, number> = {};
    
    // Fetch forward prices for each instrument based on the specified month
    for (const instrument of instruments) {
      console.log(`Fetching forward price for ${instrument} with month ${mtmFutureMonth}`);
      const forwardPrice = await fetchForwardPrice(instrument, mtmFutureMonth);
      
      if (forwardPrice !== null) {
        console.log(`Found forward price for ${instrument}: ${forwardPrice}`);
        details.instruments[instrument] = {
          price: forwardPrice,
          date: null
        };
        
        instrumentPrices[instrument] = forwardPrice;
      } else if (MOCK_PRICES[instrument]) {
        console.log(`Using mock price for ${instrument}: ${MOCK_PRICES[instrument]}`);
        details.instruments[instrument] = {
          price: MOCK_PRICES[instrument],
          date: new Date()
        };
        
        instrumentPrices[instrument] = MOCK_PRICES[instrument];
      }
    }
    
    // Calculate price using formula evaluation
    console.log('Evaluating formula with prices:', instrumentPrices);
    const price = applyPricingFormula(leg as PricingFormula, instrumentPrices);
    console.log(`Formula evaluation result: ${price}`);
    details.evaluatedPrice = price;
    
    return { price, details };
  }
  // If no MTM formula exists but we have a product, use that as a direct instrument
  else if ('product' in leg && leg.product) {
    // Try to fetch forward price for the product
    const instrument = `Argus ${leg.product}`;
    console.log(`Using product-based calculation for ${instrument} with month ${mtmFutureMonth}`);
    
    const forwardPrice = await fetchForwardPrice(instrument, mtmFutureMonth);
    
    if (forwardPrice !== null) {
      console.log(`Found forward price for ${instrument}: ${forwardPrice}`);
      details.instruments[instrument] = {
        price: forwardPrice,
        date: null
      };
      
      details.evaluatedPrice = forwardPrice;
      return { price: forwardPrice, details };
    } else if (MOCK_PRICES[instrument]) {
      console.log(`Using mock price for ${instrument}: ${MOCK_PRICES[instrument]}`);
      details.instruments[instrument] = {
        price: MOCK_PRICES[instrument],
        date: new Date()
      };
      
      details.evaluatedPrice = MOCK_PRICES[instrument];
      return { price: MOCK_PRICES[instrument], details };
    }
  }
  
  // Fallback to zero if we can't determine a price
  console.warn(`Could not determine MTM price for future month ${mtmFutureMonth}`);
  return { price: 0, details };
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
  console.log('calculateTradeLegPrice called with params:', { formulaOrLeg, startDate, endDate });
  
  // Check if this is a future pricing period with mtmFutureMonth specified
  if ('mtmFutureMonth' in formulaOrLeg && 
      formulaOrLeg.mtmFutureMonth && 
      isDateRangeInFuture(startDate, endDate)) {
    console.log(`Using future trade leg calculation with month: ${formulaOrLeg.mtmFutureMonth}`);
    return calculateFutureTradeLegPrice(formulaOrLeg as PhysicalTradeLeg, startDate, endDate);
  }
  
  // Check if this is an EFP trade leg
  if ('efpPremium' in formulaOrLeg && formulaOrLeg.efpPremium !== undefined) {
    console.log('Using EFP trade leg calculation');
    return calculateEfpTradeLegPrice(formulaOrLeg as PhysicalTradeLeg, startDate, endDate);
  }
  
  // For standard trades, continue with the existing implementation
  console.log('Using standard trade leg calculation');
  return calculateStandardTradeLegPrice(formulaOrLeg as PricingFormula, startDate, endDate);
};

// New function to handle trade leg price calculation for future pricing periods
const calculateFutureTradeLegPrice = async (
  leg: PhysicalTradeLeg,
  startDate: Date,
  endDate: Date
): Promise<{ price: number; periodType: PricingPeriodType; priceDetails: PriceDetail }> => {
  console.log('calculateFutureTradeLegPrice called');
  
  // This is always a future period
  const periodType: PricingPeriodType = 'future';
  
  const mtmFutureMonth = leg.mtmFutureMonth as string;
  console.log(`Using month code: ${mtmFutureMonth}`);
  
  // Create price details object
  const priceDetails: PriceDetail = {
    instruments: {},
    evaluatedPrice: 0,
    fixedComponents: []
  };
  
  // If the leg has a formula, use it to determine which instruments to fetch
  if (leg.formula && leg.formula.tokens && leg.formula.tokens.length > 0) {
    console.log('Using formula for future trade leg calculation:', leg.formula);
    const instruments = extractInstrumentsFromFormula(leg.formula);
    console.log('Extracted instruments:', instruments);
    
    const instrumentPrices: Record<string, number> = {};
    
    // Fetch forward prices for each instrument based on the specified month
    for (const instrument of instruments) {
      console.log(`Fetching forward price for ${instrument} with month ${mtmFutureMonth}`);
      const forwardPrice = await fetchForwardPrice(instrument, mtmFutureMonth);
      
      if (forwardPrice !== null) {
        console.log(`Found forward price for ${instrument}: ${forwardPrice}`);
        priceDetails.instruments[instrument] = {
          average: forwardPrice,
          prices: [{ date: new Date(), price: forwardPrice }]
        };
        
        instrumentPrices[instrument] = forwardPrice;
      } else if (MOCK_PRICES[instrument]) {
        // Fallback to mock price
        console.log(`Using mock price for ${instrument}: ${MOCK_PRICES[instrument]}`);
        priceDetails.instruments[instrument] = {
          average: MOCK_PRICES[instrument],
          prices: [{ date: new Date(), price: MOCK_PRICES[instrument] }]
        };
        
        instrumentPrices[instrument] = MOCK_PRICES[instrument];
      }
    }
    
    // Calculate price using formula evaluation
    console.log('Evaluating formula with prices:', instrumentPrices);
    const price = applyPricingFormula(leg.formula, instrumentPrices);
    console.log(`Formula evaluation result: ${price}`);
    priceDetails.evaluatedPrice = price;
    
    return { price, periodType, priceDetails };
  } 
  
  // For EFP pricing without a formula
  if (leg.pricingType === 'efp' && leg.efpPremium !== undefined) {
    // Handle EFP pricing for future month
    console.log('Using EFP-specific future calculation');
    let basePrice = 0;
    const instrumentName = 'ICE GASOIL FUTURES (EFP)';
    
    // For agreed EFP, use the fixed value
    if (leg.efpAgreedStatus && leg.efpFixedValue !== undefined) {
      basePrice = leg.efpFixedValue;
      console.log(`Using agreed EFP fixed value: ${basePrice}`);
      priceDetails.fixedComponents = [
        { value: leg.efpFixedValue, displayValue: `EFP Fixed: ${leg.efpFixedValue}` }
      ];
    } 
    // For unagreed EFP, fetch the forward price for the target month
    else {
      console.log(`Fetching future month price for ${instrumentName} with month ${mtmFutureMonth}`);
      const forwardPrice = await fetchForwardPrice(instrumentName, mtmFutureMonth);
      if (forwardPrice !== null) {
        basePrice = forwardPrice;
        console.log(`Found forward price: ${forwardPrice}`);
        priceDetails.instruments[instrumentName] = {
          average: forwardPrice,
          prices: [{ date: new Date(), price: forwardPrice }]
        };
      } else {
        // Fallback to mock price
        basePrice = MOCK_PRICES[instrumentName] || 0;
        console.log(`Using mock price: ${basePrice}`);
        priceDetails.instruments[instrumentName] = {
          average: basePrice,
          prices: [{ date: new Date(), price: basePrice }]
        };
      }
    }
    
    // Add premium to the base price
    const price = basePrice + (leg.efpPremium || 0);
    console.log(`Final price with premium: ${price}`);
    priceDetails.evaluatedPrice = price;
    
    if (!priceDetails.fixedComponents) {
      priceDetails.fixedComponents = [];
    }
    priceDetails.fixedComponents.push(
      { value: leg.efpPremium || 0, displayValue: `Premium: ${leg.efpPremium || 0}` }
    );
    
    return { price, periodType, priceDetails };
  }
  
  // Fallback to zero if we can't determine a price
  console.warn('Could not determine price for future trade leg');
  return { 
    price: 0, 
    periodType, 
    priceDetails: {
      instruments: {},
      evaluatedPrice: 0
    }
  };
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
        // Fallback to mock price
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

// Keep the original function but rename it
const calculateStandardTradeLegPrice = async (
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
  
  // Extract instruments from the formula
  const instruments = extractInstrumentsFromFormula(formula);
  
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
  const price = applyPricingFormula(formula, instrumentAveragePrices);
  priceDetails.evaluatedPrice = price;
  
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
