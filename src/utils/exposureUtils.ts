import { PhysicalTrade } from '@/types';
import { mapProductToCanonical } from './productMapping';
import { parseForwardMonth } from './dateParsingUtils';
import { formatMonthCode } from './dateUtils';
import { formatProductDisplay } from './tradeUtils';

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

// Type definitions for exposure data
export interface ProductExposure {
  physical: number;
  pricing: number;
  paper: number;
  netExposure: number;
}

export interface MonthData {
  products: {
    [product: string]: ProductExposure;
  };
}

export interface ExposureData {
  [month: string]: MonthData;
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
      const physicalMonth = leg.loadingPeriodStart ? 
        formatMonthCode(leg.loadingPeriodStart) : defaultMonth;
      
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
        const pricingMonth = leg.pricingPeriodStart ? 
          formatMonthCode(leg.pricingPeriodStart) : defaultMonth;
        
        // Handle monthly distribution if it exists - IMPORTANT: Process regardless of physical month
        if (leg.formula && leg.formula.monthlyDistribution) {
          const { monthlyDistribution } = leg.formula;
          
          // First, check and handle the case where monthlyDistribution is a mapping of instruments to months
          for (const [key, value] of Object.entries(monthlyDistribution)) {
            if (typeof value === 'object') {
              // This is the format we want: instrument -> month -> value
              const instrument = key;
              const canonicalInstrument = mapProductToCanonical(instrument);
              
              for (const [monthCode, monthValue] of Object.entries(value)) {
                // Make sure the monthCode is in the correct format (MMM-YY)
                // Handle all possible formats: "Apr-24", "Apr 24", "2024-04"
                let formattedMonthCode = monthCode;
                
                // Convert "Apr 24" to "Apr-24"
                if (monthCode.match(/^[A-Za-z]{3}\s\d{2}$/)) {
                  formattedMonthCode = monthCode.replace(' ', '-');
                }
                // Check if the monthCode is in YYYY-MM format and convert it
                else if (monthCode.match(/^\d{4}-\d{2}$/)) {
                  const [year, month] = monthCode.split('-');
                  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
                  formattedMonthCode = formatMonthCode(date);
                }
                
                // Process each monthly distribution value
                if (!monthlyPricing[formattedMonthCode]) {
                  monthlyPricing[formattedMonthCode] = {};
                }
                
                if (!monthlyPricing[formattedMonthCode][canonicalInstrument]) {
                  monthlyPricing[formattedMonthCode][canonicalInstrument] = 0;
                }
                
                monthlyPricing[formattedMonthCode][canonicalInstrument] += Number(monthValue);
              }
            } else if (typeof value === 'number') {
              // This is the old format where we have monthCode -> volume
              // In this case, we need to extract instruments from the formula
              const monthCode = key;
              let formattedMonthCode = monthCode;
              
              // Convert "Apr 24" to "Apr-24"
              if (monthCode.match(/^[A-Za-z]{3}\s\d{2}$/)) {
                formattedMonthCode = monthCode.replace(' ', '-');
              }
              // Check if the monthCode is in YYYY-MM format and convert it
              else if (monthCode.match(/^\d{4}-\d{2}$/)) {
                const [year, month] = monthCode.split('-');
                const date = new Date(parseInt(year), parseInt(month) - 1, 1);
                formattedMonthCode = formatMonthCode(date);
              }
              
              // Get instruments from the formula
              const instruments = extractInstrumentsFromFormula(leg.formula);
              
              if (!monthlyPricing[formattedMonthCode]) {
                monthlyPricing[formattedMonthCode] = {};
              }
              
              // Distribute the volume across all instruments in the formula
              instruments.forEach(instrument => {
                const canonicalInstrument = mapProductToCanonical(instrument);
                
                if (!monthlyPricing[formattedMonthCode][canonicalInstrument]) {
                  monthlyPricing[formattedMonthCode][canonicalInstrument] = 0;
                }
                
                monthlyPricing[formattedMonthCode][canonicalInstrument] += Number(value);
              });
            }
          }
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

/**
 * Create initial exposure data structure with empty values
 */
export const createInitialExposureData = (): ExposureData => {
  const months = [];
  const currentDate = new Date();
  
  // Generate the next 12 months
  for (let i = 0; i < 12; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
    const monthCode = formatMonthCode(date);
    months.push(monthCode);
  }
  
  const initialData: ExposureData = {};
  
  // Initialize each month with empty products
  months.forEach(month => {
    initialData[month] = {
      products: {}
    };
  });
  
  return initialData;
};

/**
 * Update exposure data with trades data
 */
export const updateExposureData = (
  exposureData: ExposureData,
  trades: any[],
  tradeType: 'openTrades' | 'paperTrades'
): ExposureData => {
  if (!trades || trades.length === 0) {
    return exposureData;
  }
  
  const updatedData = { ...exposureData };
  
  trades.forEach(trade => {
    if (tradeType === 'openTrades') {
      // Handle physical trades
      const month = trade.loading_period_start ? formatMonthCode(new Date(trade.loading_period_start)) : null;
      const pricingMonth = trade.pricing_period_start ? formatMonthCode(new Date(trade.pricing_period_start)) : month;
      const product = mapProductToCanonical(trade.product);
      const buySellFactor = trade.buy_sell === 'buy' ? 1 : -1;
      const quantity = trade.quantity * (trade.tolerance ? (1 + trade.tolerance / 100) : 1);
      
      // Add physical exposure
      if (month && month in updatedData) {
        if (!updatedData[month].products[product]) {
          updatedData[month].products[product] = { physical: 0, pricing: 0, paper: 0, netExposure: 0 };
        }
        updatedData[month].products[product].physical += quantity * buySellFactor;
        updatedData[month].products[product].netExposure = 
          updatedData[month].products[product].physical +
          updatedData[month].products[product].pricing +
          updatedData[month].products[product].paper;
      }
      
      // Add pricing exposure if formula exists
      if (pricingMonth && pricingMonth in updatedData && trade.pricing_formula) {
        // Handle EFP trades differently
        if (trade.pricing_type === 'efp') {
          const efpMonth = trade.efp_designated_month || pricingMonth;
          const efpProduct = 'ICE GASOIL FUTURES (EFP)';
          
          if (!updatedData[efpMonth].products[efpProduct]) {
            updatedData[efpMonth].products[efpProduct] = { physical: 0, pricing: 0, paper: 0, netExposure: 0 };
          }
          
          // Only add exposure for unagreed EFPs
          if (!trade.efp_agreed_status) {
            updatedData[efpMonth].products[efpProduct].pricing += quantity * buySellFactor * -1;
            updatedData[efpMonth].products[efpProduct].netExposure = 
              updatedData[efpMonth].products[efpProduct].physical +
              updatedData[efpMonth].products[efpProduct].pricing +
              updatedData[efpMonth].products[efpProduct].paper;
          }
        } 
        // Handle regular pricing formula
        else if (trade.pricing_formula.tokens) {
          const instruments = extractInstrumentsFromFormula(trade.pricing_formula);
          
          instruments.forEach(instrument => {
            if (!updatedData[pricingMonth].products[instrument]) {
              updatedData[pricingMonth].products[instrument] = { physical: 0, pricing: 0, paper: 0, netExposure: 0 };
            }
            
            updatedData[pricingMonth].products[instrument].pricing += quantity * buySellFactor * -1;
            updatedData[pricingMonth].products[instrument].netExposure = 
              updatedData[pricingMonth].products[instrument].physical +
              updatedData[pricingMonth].products[instrument].pricing +
              updatedData[pricingMonth].products[instrument].paper;
          });
        }
      }
    } else if (tradeType === 'paperTrades') {
      // Handle paper trades
      trade.legs.forEach((leg: any) => {
        // Extract the trading period from the leg
        const month = leg.period ? parseForwardMonth(leg.period) : null;
        if (!month || !(formatMonthCode(month) in updatedData)) {
          return;
        }
        
        const formattedMonth = formatMonthCode(month);
        const buySellFactor = leg.buySell === 'buy' ? 1 : -1;
        
        // Format product name based on relationship type and right side product
        const displayProduct = formatProductDisplay(
          leg.product,
          leg.relationshipType || 'FP',
          leg.rightSide?.product
        );
        
        if (!updatedData[formattedMonth].products[displayProduct]) {
          updatedData[formattedMonth].products[displayProduct] = { physical: 0, pricing: 0, paper: 0, netExposure: 0 };
        }
        
        updatedData[formattedMonth].products[displayProduct].paper += leg.quantity * buySellFactor;
        updatedData[formattedMonth].products[displayProduct].netExposure = 
          updatedData[formattedMonth].products[displayProduct].physical +
          updatedData[formattedMonth].products[displayProduct].pricing +
          updatedData[formattedMonth].products[displayProduct].paper;
      });
    }
  });
  
  return updatedData;
};

/**
 * Generate a list of filtered products that have non-zero exposure
 */
export const generateFilteredProducts = (exposureData: ExposureData): string[] => {
  const productSet = new Set<string>();
  
  // Collect all products with non-zero exposure
  Object.values(exposureData).forEach(monthData => {
    Object.entries(monthData.products).forEach(([product, data]) => {
      if (data.physical !== 0 || data.pricing !== 0 || data.paper !== 0) {
        productSet.add(product);
      }
    });
  });
  
  // Group products by category
  const biodieselProducts = Array.from(productSet).filter(product => 
    ['FAME0', 'RME', 'UCOME', 'UCOME-5', 'HVO'].some(p => product.includes(p)) &&
    !product.includes('ICE')
  );
  
  const pricingInstrumentProducts = Array.from(productSet).filter(product => 
    ['ICE GASOIL FUTURES', 'Platts LSGO', 'Platts Diesel', 'ICE GASOIL FUTURES (EFP)'].some(p => product.includes(p))
  );
  
  // Combine and sort products by category
  return [...biodieselProducts.sort(), ...pricingInstrumentProducts.sort()];
};

/**
 * Filter products by category
 */
export const filterProductsByCategory = (products: string[], category: 'Biodiesel' | 'Pricing Instrument'): string[] => {
  if (category === 'Biodiesel') {
    return products.filter(product => 
      ['FAME0', 'RME', 'UCOME', 'UCOME-5', 'HVO'].some(p => product.includes(p)) &&
      !product.includes('ICE')
    );
  } else if (category === 'Pricing Instrument') {
    return products.filter(product => 
      ['ICE GASOIL FUTURES', 'Platts LSGO', 'Platts Diesel', 'ICE GASOIL FUTURES (EFP)'].some(p => product.includes(p))
    );
  }
  return [];
};

/**
 * Calculate product totals across all months
 */
export const calculateProductTotals = (exposureData: ExposureData, products: string[]): Record<string, ProductExposure> => {
  const productTotals: Record<string, ProductExposure> = {};
  
  products.forEach(product => {
    productTotals[product] = { physical: 0, pricing: 0, paper: 0, netExposure: 0 };
    
    Object.values(exposureData).forEach(monthData => {
      if (monthData.products[product]) {
        productTotals[product].physical += monthData.products[product].physical;
        productTotals[product].pricing += monthData.products[product].pricing;
        productTotals[product].paper += monthData.products[product].paper;
      }
    });
    
    productTotals[product].netExposure = 
      productTotals[product].physical + 
      productTotals[product].pricing + 
      productTotals[product].paper;
  });
  
  return productTotals;
};

/**
 * Calculate category totals across all months
 */
export const calculateCategoryTotals = (exposureData: ExposureData, products: string[]): Record<string, ProductExposure> => {
  const categoryTotals: Record<string, ProductExposure> = {
    Biodiesel: { physical: 0, pricing: 0, paper: 0, netExposure: 0 },
    PricingInstrument: { physical: 0, pricing: 0, paper: 0, netExposure: 0 }
  };
  
  const biodieselProducts = filterProductsByCategory(products, 'Biodiesel');
  const pricingInstrumentProducts = filterProductsByCategory(products, 'Pricing Instrument');
  
  Object.values(exposureData).forEach(monthData => {
    // Calculate Biodiesel totals
    biodieselProducts.forEach(product => {
      if (monthData.products[product]) {
        categoryTotals.Biodiesel.physical += monthData.products[product].physical;
        categoryTotals.Biodiesel.pricing += monthData.products[product].pricing;
        categoryTotals.Biodiesel.paper += monthData.products[product].paper;
      }
    });
    
    // Calculate Pricing Instrument totals
    pricingInstrumentProducts.forEach(product => {
      if (monthData.products[product]) {
        categoryTotals.PricingInstrument.physical += monthData.products[product].physical;
        categoryTotals.PricingInstrument.pricing += monthData.products[product].pricing;
        categoryTotals.PricingInstrument.paper += monthData.products[product].paper;
      }
    });
  });
  
  categoryTotals.Biodiesel.netExposure = 
    categoryTotals.Biodiesel.physical + 
    categoryTotals.Biodiesel.pricing + 
    categoryTotals.Biodiesel.paper;
  
  categoryTotals.PricingInstrument.netExposure = 
    categoryTotals.PricingInstrument.physical + 
    categoryTotals.PricingInstrument.pricing + 
    categoryTotals.PricingInstrument.paper;
  
  return categoryTotals;
};

/**
 * Calculate grand totals for products and categories
 */
export const calculateGrandTotals = (
  productTotals: Record<string, ProductExposure>,
  categoryTotals: Record<string, ProductExposure>
) => {
  return {
    productTotals,
    categoryTotals
  };
};

/**
 * Calculate group grand totals for biodiesel and pricing instruments
 */
export const calculateGroupGrandTotals = (
  exposureData: ExposureData,
  biodieselProducts: string[],
  pricingInstrumentProducts: string[]
) => {
  let biodieselTotal = 0;
  let pricingInstrumentTotal = 0;
  
  Object.values(exposureData).forEach(monthData => {
    // Sum up all biodiesel exposure
    biodieselProducts.forEach(product => {
      if (monthData.products[product]) {
        biodieselTotal += monthData.products[product].netExposure;
      }
    });
    
    // Sum up all pricing instrument exposure
    pricingInstrumentProducts.forEach(product => {
      if (monthData.products[product]) {
        pricingInstrumentTotal += monthData.products[product].netExposure;
      }
    });
  });
  
  return {
    biodieselTotal,
    pricingInstrumentTotal,
    totalRow: biodieselTotal + pricingInstrumentTotal
  };
};
