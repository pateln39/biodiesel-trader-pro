import { PhysicalTradeLeg, PriceDetail, MTMPriceDetail, PricingPeriodType, FixedComponent } from './priceCalculationTypes';
import { Instrument } from '@/types/common';
import { PricingFormula } from '@/types/pricing';

import { validateAndParsePricingFormula, formulaToString } from './formulaUtils';
import { fetchPreviousDayPrice } from './efpUtils';
import { extractInstrumentsFromFormula } from './exposureUtils';
import { supabase } from '@/integrations/supabase/client';
import { parseFormula } from './formulaCalculation';
import { isDateRangeInFuture, parseMonthCodeToDbDate } from './mtmUtils';

export type PricingPeriodType = 'historical' | 'current' | 'future';

export interface PriceDetail {
  instruments: Record<string, { average: number; prices: { date: Date; price: number }[] }>;
  evaluatedPrice: number;
  fixedComponents?: FixedComponent[];
}

const MOCK_PRICES: Record<string, number> = {
  'Argus FAME0': 850,
  'Argus RME': 900,
  'Argus UCOME': 1250,
  'Platts LSGO': 800,
  'Platts Diesel': 950,
  'ICE GASOIL FUTURES': 780,
  'ICE GASOIL FUTURES (EFP)': 780
};

async function fetchLatestPrice(instrument: string): Promise<{ price: number; date: Date | null } | null> {
  try {
    const { data: instrumentData, error: instrumentError } = await supabase
      .from('pricing_instruments')
      .select('id')
      .eq('display_name', instrument)
      .single();
      
    if (instrumentError || !instrumentData) {
      console.error('Error fetching instrument ID:', instrumentError);
      return null;
    }
    
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

async function fetchHistoricalPrices(
  instrument: string, 
  startDate: Date, 
  endDate: Date
): Promise<{ date: Date; price: number }[]> {
  try {
    const { data: instrumentData, error: instrumentError } = await supabase
      .from('pricing_instruments')
      .select('id')
      .eq('display_name', instrument)
      .single();
      
    if (instrumentError || !instrumentData) {
      console.error('Error fetching instrument ID:', instrumentError);
      return [];
    }
    
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];
    
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

async function fetchForwardPrice(
  instrument: string,
  monthCode: string
): Promise<number | null> {
  try {
    console.log(`Fetching forward price for ${instrument} with month code ${monthCode}`);
    
    const formattedDate = parseMonthCodeToDbDate(monthCode);
    
    if (!formattedDate) {
      console.error(`Failed to parse month code: ${monthCode}`);
      return null;
    }
    
    console.log(`Looking for forward price for date: ${formattedDate}`);
    
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
    
    console.warn(`No forward price found for ${instrument} ${monthCode}, falling back to latest`);
    const latestPrice = await fetchLatestPrice(instrument);
    return latestPrice?.price || null;
  } catch (error) {
    console.error('Error in fetchForwardPrice:', error);
    return null;
  }
}

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

  const effectiveMtmFutureMonth = mtmFutureMonth || 
    ('mtmFutureMonth' in formula ? formula.mtmFutureMonth as string : undefined);

  if (effectiveMtmFutureMonth && 
      startDate && endDate && 
      isDateRangeInFuture(startDate, endDate)) {
    console.log(`Using future MTM calculation with month: ${effectiveMtmFutureMonth}`);
    return calculateFutureMTMPrice(formula, effectiveMtmFutureMonth);
  }
  
  if ('efpPremium' in formula && formula.efpPremium !== undefined) {
    console.log('Using EFP MTM calculation');
    return calculateEfpMTMPrice(formula as PhysicalTradeLeg);
  }
  
  console.log('Using standard MTM calculation');
  return calculateStandardMTMPrice(formula as PricingFormula);
};

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
  
  if ('mtmFormula' in leg && leg.mtmFormula && leg.mtmFormula.tokens && leg.mtmFormula.tokens.length > 0) {
    console.log('Using MTM formula for future calculation:', leg.mtmFormula);
    const instruments = extractInstrumentsFromFormula(leg.mtmFormula);
    console.log('Extracted instruments from formula:', instruments);
    
    const instrumentPrices: Record<string, number> = {};
    
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
    
    console.log('Evaluating formula with prices:', instrumentPrices);
    const price = applyPricingFormula(leg.mtmFormula, instrumentPrices);
    console.log(`Formula evaluation result: ${price}`);
    details.evaluatedPrice = price;
    
    return { price, details };
  } 
  else if ('tokens' in leg && leg.tokens && leg.tokens.length > 0) {
    console.log('Using direct tokens for future calculation:', leg.tokens);
    const instruments = extractInstrumentsFromFormula(leg as PricingFormula);
    console.log('Extracted instruments:', instruments);
    
    const instrumentPrices: Record<string, number> = {};
    
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
    
    console.log('Evaluating formula with prices:', instrumentPrices);
    const price = applyPricingFormula(leg as PricingFormula, instrumentPrices);
    console.log(`Formula evaluation result: ${price}`);
    details.evaluatedPrice = price;
    
    return { price, details };
  }
  else if ('product' in leg && leg.product) {
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
  
  console.warn(`Could not determine MTM price for future month ${mtmFutureMonth}`);
  return { price: 0, details };
};

const calculateEfpMTMPrice = async (
  leg: PhysicalTradeLeg
): Promise<{ price: number; details: MTMPriceDetail }> => {
  const details: MTMPriceDetail = {
    instruments: {} as Record<Instrument, { price: number; date: Date | null }>,
    evaluatedPrice: 0,
    fixedComponents: []
  };
  
  if (leg.efpAgreedStatus) {
    if (leg.efpFixedValue !== undefined) {
      details.evaluatedPrice = leg.efpFixedValue + leg.efpPremium;
      details.fixedComponents = [
        { value: leg.efpFixedValue, displayValue: `EFP Fixed: ${leg.efpFixedValue}` },
        { value: leg.efpPremium, displayValue: `Premium: ${leg.efpPremium}` }
      ];
    } else {
      details.evaluatedPrice = leg.efpPremium || 0;
      details.fixedComponents = [
        { value: leg.efpPremium || 0, displayValue: `Premium: ${leg.efpPremium}` }
      ];
    }
  } else {
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
      details.evaluatedPrice = leg.efpPremium || 0;
      details.fixedComponents = [
        { value: leg.efpPremium || 0, displayValue: `Premium: ${leg.efpPremium}` }
      ];
    }
  }
  
  return { price: details.evaluatedPrice, details };
};

const calculateStandardMTMPrice = async (
  formula: PricingFormula
): Promise<{ price: number; details: MTMPriceDetail }> => {
  const details: MTMPriceDetail = {
    instruments: {} as Record<Instrument, { price: number; date: Date | null }>,
    evaluatedPrice: 0
  };
  
  if (!formula.tokens || formula.tokens.length === 0) {
    return { price: 0, details };
  }
  
  const instruments = extractInstrumentsFromFormula(formula);
  
  if (instruments.length === 0) {
    return { price: 0, details };
  }
  
  const instrumentPrices: Record<string, number> = {};
  
  for (const instrument of instruments) {
    const latestPrice = await fetchLatestPrice(instrument);
    
    if (latestPrice) {
      details.instruments[instrument] = {
        price: latestPrice.price,
        date: latestPrice.date
      };
      
      instrumentPrices[instrument] = latestPrice.price;
    } else if (MOCK_PRICES[instrument]) {
      console.warn(`Using mock price for ${instrument}`);
      details.instruments[instrument] = {
        price: MOCK_PRICES[instrument],
        date: new Date()
      };
      
      instrumentPrices[instrument] = MOCK_PRICES[instrument];
    }
  }
  
  const price = applyPricingFormula(formula, instrumentPrices);
  details.evaluatedPrice = price;
  
  return { price, details };
};

export const calculateTradeLegPrice = async (
  formulaOrLeg: PricingFormula | PhysicalTradeLeg,
  startDate: Date,
  endDate: Date,
  mtmFutureMonth?: string
): Promise<{ price: number; periodType: PricingPeriodType; priceDetails: PriceDetail }> => {
  console.log('calculateTradeLegPrice called with params:', { formulaOrLeg, startDate, endDate, mtmFutureMonth });
  
  const effectiveMtmFutureMonth = mtmFutureMonth || 
    ('mtmFutureMonth' in formulaOrLeg && formulaOrLeg.mtmFutureMonth ? 
      formulaOrLeg.mtmFutureMonth : undefined);

  if (effectiveMtmFutureMonth && isDateRangeInFuture(startDate, endDate)) {
    console.log(`Using future trade leg calculation with month: ${effectiveMtmFutureMonth}`);
    return calculateFutureTradeLegPrice(formulaOrLeg, startDate, endDate, effectiveMtmFutureMonth);
  }
  
  if ('efpPremium' in formulaOrLeg && formulaOrLeg.efpPremium !== undefined) {
    console.log('Using EFP trade leg calculation');
    return calculateEfpTradeLegPrice(formulaOrLeg as PhysicalTradeLeg, startDate, endDate);
  }
  
  console.log('Using standard trade leg calculation');
  return calculateStandardTradeLegPrice(formulaOrLeg as PricingFormula, startDate, endDate);
};

const calculateFutureTradeLegPrice = async (
  leg: PhysicalTradeLeg | PricingFormula,
  startDate: Date,
  endDate: Date,
  mtmFutureMonth: string
): Promise<{ price: number; periodType: PricingPeriodType; priceDetails: PriceDetail }> => {
  console.log(`calculateFutureTradeLegPrice called with month: ${mtmFutureMonth}`);
  
  const periodType: PricingPeriodType = 'future';
  
  console.log(`Using month code: ${mtmFutureMonth}`);
  
  const priceDetails: PriceDetail = {
    instruments: {},
    evaluatedPrice: 0,
    fixedComponents: []
  };

  if ('formula' in leg && leg.formula && leg.formula.tokens && leg.formula.tokens.length > 0) {
    console.log('Using formula for future trade leg calculation:', leg.formula);
    const instruments = extractInstrumentsFromFormula(leg.formula);
    console.log('Extracted instruments:', instruments);
    
    const instrumentPrices: Record<string, number> = {};
    
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
        console.log(`Using mock price for ${instrument}: ${MOCK_PRICES[instrument]}`);
        priceDetails.instruments[instrument] = {
          average: MOCK_PRICES[instrument],
          prices: [{ date: new Date(), price: MOCK_PRICES[instrument] }]
        };
        
        instrumentPrices[instrument] = MOCK_PRICES[instrument];
      }
    }
    
    console.log('Evaluating formula with prices:', instrumentPrices);
    const price = applyPricingFormula(leg.formula, instrumentPrices);
    console.log(`Formula evaluation result: ${price}`);
    priceDetails.evaluatedPrice = price;
    
    return { price, periodType, priceDetails };
  } 
  else if ('tokens' in leg && leg.tokens && leg.tokens.length > 0) {
    console.log('Using direct tokens for future trade leg calculation:', leg.tokens);
    const instruments = extractInstrumentsFromFormula(leg as PricingFormula);
    console.log('Extracted instruments from direct tokens:', instruments);
    
    const instrumentPrices: Record<string, number> = {};
    
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
        console.log(`Using mock price for ${instrument}: ${MOCK_PRICES[instrument]}`);
        priceDetails.instruments[instrument] = {
          average: MOCK_PRICES[instrument],
          prices: [{ date: new Date(), price: MOCK_PRICES[instrument] }]
        };
        
        instrumentPrices[instrument] = MOCK_PRICES[instrument];
      }
    }
    
    console.log('Evaluating formula with prices:', instrumentPrices);
    const price = applyPricingFormula(leg as PricingFormula, instrumentPrices);
    console.log(`Formula evaluation result: ${price}`);
    priceDetails.evaluatedPrice = price;
    
    return { price, periodType, priceDetails };
  }
  
  if ('pricingType' in leg && leg.pricingType === 'efp' && 'efpPremium' in leg && leg.efpPremium !== undefined) {
    console.log('Using EFP-specific future calculation');
    let basePrice = 0;
    const instrumentName = 'ICE GASOIL FUTURES (EFP)';
    
    if ('efpAgreedStatus' in leg && leg.efpAgreedStatus && leg.efpFixedValue !== undefined) {
      basePrice = leg.efpFixedValue;
      console.log(`Using agreed EFP fixed value: ${basePrice}`);
      priceDetails.fixedComponents = [
        { value: leg.efpFixedValue, displayValue: `EFP Fixed: ${leg.efpFixedValue}` }
      ];
    } 
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
        basePrice = MOCK_PRICES[instrumentName] || 0;
        console.log(`Using mock price: ${basePrice}`);
        priceDetails.instruments[instrumentName] = {
          average: basePrice,
          prices: [{ date: new Date(), price: basePrice }]
        };
      }
    }
    
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

const calculateEfpTradeLegPrice = async (
  leg: PhysicalTradeLeg,
  startDate: Date,
  endDate: Date
): Promise<{ price: number; periodType: PricingPeriodType; priceDetails: PriceDetail }> => {
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
  
  let price = 0;
  const instrumentName = 'ICE GASOIL FUTURES (EFP)';
  
  if (leg.efpAgreedStatus && leg.efpFixedValue !== undefined) {
    price = leg.efpFixedValue + (leg.efpPremium || 0);
    priceDetails.evaluatedPrice = price;
    priceDetails.fixedComponents = [
      { value: leg.efpFixedValue, displayValue: `EFP Fixed: ${leg.efpFixedValue}` },
      { value: leg.efpPremium || 0, displayValue: `Premium: ${leg.efpPremium || 0}` }
    ];
  } 
  else {
    const prices = await fetchHistoricalPrices(instrumentName, startDate, endDate);
    
    if (prices.length > 0) {
      const sum = prices.reduce((acc, p) => acc + p.price, 0);
      const average = sum / prices.length;
      
      priceDetails.instruments[instrumentName] = {
        average,
        prices
      };
      
      price = average + (leg.efpPremium || 0);
      priceDetails.evaluatedPrice = price;
      priceDetails.fixedComponents = [
        { value: leg.efpPremium || 0, displayValue: `Premium: ${leg.efpPremium || 0}` }
      ];
    } else {
      const latestPrice = await fetchLatestPrice(instrumentName);
      if (latestPrice) {
        price = latestPrice.price + (leg.efpPremium || 0);
        priceDetails.instruments[instrumentName] = {
          average: latestPrice.price,
          prices: [{ date: latestPrice.date || new Date(), price: latestPrice.price }]
        };
      } else if (MOCK_PRICES[instrumentName]) {
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

const calculateStandardTradeLegPrice = async (
  formula: PricingFormula,
  startDate: Date,
  endDate: Date
): Promise<{ price: number; periodType: PricingPeriodType; priceDetails: PriceDetail }> => {
  const now = new Date();
  let periodType: PricingPeriodType = 'current';
  
  if (endDate < now) {
    periodType = 'historical';
  } else if (startDate > now) {
    periodType = 'future';
  }
  
  const instruments = extractInstrumentsFromFormula(formula);
  
  const priceDetails: PriceDetail = {
    instruments: {},
    evaluatedPrice: 0
  };
  
  if (instruments.length === 0) {
    return { price: 0, periodType, priceDetails };
  }
  
  const instrumentAveragePrices: Record<string, number> = {};
  
  for (const instrument of instruments) {
    const prices = await fetchHistoricalPrices(instrument, startDate, endDate);
    
    if (prices.length > 0) {
      const sum = prices.reduce((acc, p) => acc + p.price, 0);
      const average = sum / prices.length;
      
      priceDetails.instruments[instrument] = {
        average,
        prices
      };
      
      instrumentAveragePrices[instrument] = average;
    } else if (MOCK_HISTORICAL_PRICES[instrument]) {
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
  
  const price = applyPricingFormula(formula, instrumentAveragePrices);
  priceDetails.evaluatedPrice = price;
  
  return { price, periodType, priceDetails };
};

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

export const calculateMTMValue = (
  tradePrice: number,
  mtmPrice: number,
  quantity: number,
  buySell: 'buy' | 'sell'
): number => {
  const direction = buySell === 'buy' ? -1 : 1;
  return (tradePrice - mtmPrice) * quantity * direction;
};

interface Node {
  type: string;
  value?: any;
  left?: Node;
  right?: Node;
  operator?: string;
}

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

export const applyPricingFormula = (
  formula: PricingFormula,
  instrumentPrices: Record<string, number>
): number => {
  if (!formula.tokens || formula.tokens.length === 0) {
    return 0;
  }
  
  try {
    const ast = parseFormula(formula.tokens);
    
    return evaluateFormulaAST(ast, instrumentPrices);
  } catch (error) {
    console.error('Error evaluating pricing formula:', error);
    
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

export type { PricingPeriodType, PriceDetail, MTMPriceDetail };
