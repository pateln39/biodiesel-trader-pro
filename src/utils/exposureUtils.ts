
import { PhysicalTrade, Trade } from '@/types';
import { format } from 'date-fns';

export interface ExposureRow {
  month: string;
  [product: string]: number | string;
}

export interface ExposureData {
  months: string[];
  rows: ExposureRow[];
  summary: ExposureRow;
}

export const calculateTradeExposures = (trades: Trade[]): ExposureData => {
  // Filter to only physical trades
  const physicalTrades = trades.filter((trade): trade is PhysicalTrade => trade.tradeType === 'physical');
  
  // Initialize data structures
  const monthlyPhysical: Record<string, Record<string, number>> = {};
  const monthlyPricing: Record<string, Record<string, number>> = {};
  const productColumns = new Set<string>();
  const pricingColumns = new Set<string>();
  
  // Get the default month in MMM-YY format for today
  const today = new Date();
  const defaultMonth = format(today, 'MMM-yy');
  
  // Helper function to map product name to canonical form
  const mapProductToCanonical = (product: string) => {
    return product.includes('UCOME') ? 'UCOME' : product;
  };
  
  // Process each trade
  for (const trade of physicalTrades) {
    for (const leg of trade.legs || []) {
      // Get net volume with tolerance
      const volume = leg.quantity;
      
      // Get the month code - assuming pricing period or loading period defines the month
      // If we have no dates, use current month
      const startDate = leg.pricingPeriodStart || leg.loadingPeriodStart || new Date();
      const endDate = leg.pricingPeriodEnd || leg.loadingPeriodEnd || new Date();
      
      // If pricing period spans multiple months, we need to distribute the volume
      // For simplicity, we'll assume single month here - this would need enhancement for real scenarios
      const month = format(startDate, 'MMM-yy');
      
      // Ensure month structures exist
      if (!monthlyPhysical[month]) monthlyPhysical[month] = {};
      if (!monthlyPricing[month]) monthlyPricing[month] = {};
      
      // Physical side
      const productKey = mapProductToCanonical(leg.product);
      if (!monthlyPhysical[month][productKey]) monthlyPhysical[month][productKey] = 0;
      monthlyPhysical[month][productKey] += volume * (leg.buySell === 'buy' ? 1 : -1);
      productColumns.add(productKey);
      
      // Pricing side
      if (leg.efpPremium !== undefined) {
        // This is an EFP leg
        if (!monthlyPricing[month]) monthlyPricing[month] = {};
        
        if (leg.efpAgreedStatus) {
          // Agreed EFP - use standard ICE GASOIL FUTURES column
          const pricingKey = 'ICE GASOIL FUTURES';
          if (!monthlyPricing[month][pricingKey]) monthlyPricing[month][pricingKey] = 0;
          monthlyPricing[month][pricingKey] += volume * (leg.buySell === 'buy' ? -1 : 1);
          pricingColumns.add(pricingKey);
        } else {
          // Unagreed EFP - use dedicated EFP column
          const efpKey = 'ICE GASOIL FUTURES (EFP)';
          if (!monthlyPricing[month][efpKey]) monthlyPricing[month][efpKey] = 0;
          monthlyPricing[month][efpKey] += volume * (leg.buySell === 'buy' ? -1 : 1);
          pricingColumns.add(efpKey);
        }
      } else if (leg.formula && leg.formula.exposures) {
        // Standard formula with exposures
        Object.entries(leg.formula.exposures.pricing || {}).forEach(([instrument, amount]) => {
          if (!monthlyPricing[month][instrument]) monthlyPricing[month][instrument] = 0;
          monthlyPricing[month][instrument] += amount;
          pricingColumns.add(instrument);
        });
      }
    }
  }
  
  // Convert to rows for display
  const months = Object.keys(monthlyPhysical).sort();
  const rows: ExposureRow[] = [];
  
  const productColumnOrder = [
    'UCOME',
    'FAME0',
    'RME',
    'HVO',
  ];
  
  const pricingColumnOrder = [
    'Platts LSGO',
    'Platts diesel',
    'ICE GASOIL FUTURES',
    'ICE GASOIL FUTURES (EFP)', // New EFP column placed right after ICE GASOIL
  ];
  
  // Summary totals
  const physicalTotals: Record<string, number> = {};
  const pricingTotals: Record<string, number> = {};
  let totalPhysicalAll = 0;
  let totalPricingAll = 0;
  
  for (const month of months) {
    const row: ExposureRow = { month };
    
    let totalPhysical = 0;
    // Add physical columns
    for (const product of productColumnOrder) {
      if (productColumns.has(product)) {
        const amount = monthlyPhysical[month][product] || 0;
        row[product] = amount;
        totalPhysical += amount;
        
        // Add to summary
        if (!physicalTotals[product]) physicalTotals[product] = 0;
        physicalTotals[product] += amount;
      }
    }
    row['Total physical'] = totalPhysical;
    totalPhysicalAll += totalPhysical;
    
    let totalPricing = 0;
    // Add pricing columns
    for (const instrument of pricingColumnOrder) {
      if (pricingColumns.has(instrument)) {
        const amount = monthlyPricing[month][instrument] || 0;
        row[instrument] = amount;
        totalPricing += amount;
        
        // Add to summary
        if (!pricingTotals[instrument]) pricingTotals[instrument] = 0;
        pricingTotals[instrument] += amount;
      }
    }
    row['Total pricing instrument'] = totalPricing;
    totalPricingAll += totalPricing;
    
    // Net exposure for the month
    row['Net exposure'] = totalPhysical + totalPricing;
    
    rows.push(row);
  }
  
  // Create summary row
  const summary: ExposureRow = { month: 'Total' };
  for (const product of productColumnOrder) {
    if (productColumns.has(product)) {
      summary[product] = physicalTotals[product] || 0;
    }
  }
  summary['Total physical'] = totalPhysicalAll;
  
  for (const instrument of pricingColumnOrder) {
    if (pricingColumns.has(instrument)) {
      summary[instrument] = pricingTotals[instrument] || 0;
    }
  }
  summary['Total pricing instrument'] = totalPricingAll;
  summary['Net exposure'] = totalPhysicalAll + totalPricingAll;
  
  return {
    months,
    rows,
    summary
  };
};

// Export the column order to ensure consistent display
export const PHYSICAL_COLUMN_ORDER = [
  'UCOME',
  'FAME0',
  'RME',
  'HVO',
];

export const PRICING_COLUMN_ORDER = [
  'Platts LSGO',
  'Platts diesel',
  'ICE GASOIL FUTURES',
  'ICE GASOIL FUTURES (EFP)', // New EFP column
];

// All columns including totals
export const PRODUCT_COLUMN_ORDER = [
  ...PHYSICAL_COLUMN_ORDER,
  'Total physical',
  ...PRICING_COLUMN_ORDER,
  'Total pricing instrument',
  'Net exposure'
];
