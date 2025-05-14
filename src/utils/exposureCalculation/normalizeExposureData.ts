
import { MonthlyExposure, ExposureData, ProductExposure } from '@/types/exposure';
import { calculateNetExposure } from '@/utils/tradeUtils';

export interface NormalizedExposureResult {
  allProductsFound: Set<string>;
  exposuresByMonth: Record<string, Record<string, ExposureData>>;
}

/**
 * Initialize exposure data structure by months and products
 */
export const initializeExposureData = (
  periods: string[],
  allowedProducts: string[]
): Record<string, Record<string, ExposureData>> => {
  const exposuresByMonth: Record<string, Record<string, ExposureData>> = {};
  
  periods.forEach(month => {
    exposuresByMonth[month] = {};
    allowedProducts.forEach(product => {
      exposuresByMonth[month][product] = {
        physical: 0,
        pricing: 0,
        paper: 0,
        netExposure: 0
      };
    });
  });
  
  return exposuresByMonth;
};

/**
 * Merge multiple exposure objects together
 */
export const mergeExposureData = (
  exposuresByMonth: Record<string, Record<string, ExposureData>>,
  physicalExposures: Record<string, Record<string, number>>,
  pricingExposures: Record<string, Record<string, number>>,
  paperExposures: Record<string, Record<string, number>>,
  pricingFromPaperExposures: Record<string, Record<string, number>>
): NormalizedExposureResult => {
  const allProductsFound = new Set<string>();
  
  // Debug counters for monitoring the merge process
  const mergeStats = {
    physicalProducts: 0,
    pricingProducts: 0,
    paperProducts: 0,
    pricingFromPaperProducts: 0,
    efpProductsFound: 0
  };
  
  // Process physical exposures
  Object.entries(physicalExposures).forEach(([month, products]) => {
    if (!exposuresByMonth[month]) return;
    
    Object.entries(products).forEach(([product, amount]) => {
      allProductsFound.add(product);
      mergeStats.physicalProducts++;
      
      if (!exposuresByMonth[month][product]) {
        exposuresByMonth[month][product] = {
          physical: 0,
          pricing: 0,
          paper: 0,
          netExposure: 0
        };
      }
      
      exposuresByMonth[month][product].physical += amount;
    });
  });
  
  // Process pricing exposures
  Object.entries(pricingExposures).forEach(([month, products]) => {
    if (!exposuresByMonth[month]) return;
    
    Object.entries(products).forEach(([product, amount]) => {
      allProductsFound.add(product);
      mergeStats.pricingProducts++;
      
      if (product === 'ICE GASOIL FUTURES (EFP)') {
        mergeStats.efpProductsFound++;
        console.log(`[EXPOSURE] Merging EFP pricing exposure for ${month}: ${amount}`);
      }
      
      if (!exposuresByMonth[month][product]) {
        exposuresByMonth[month][product] = {
          physical: 0,
          pricing: 0,
          paper: 0,
          netExposure: 0
        };
      }
      
      // For EFP, explicitly log the before and after values
      if (product === 'ICE GASOIL FUTURES (EFP)') {
        const beforeValue = exposuresByMonth[month][product].pricing;
        exposuresByMonth[month][product].pricing += amount;
        console.log(`[EXPOSURE] EFP pricing exposure for ${month} updated: ${beforeValue} → ${exposuresByMonth[month][product].pricing}`);
      } else {
        exposuresByMonth[month][product].pricing += amount;
      }
    });
  });
  
  // Process paper exposures
  Object.entries(paperExposures).forEach(([month, products]) => {
    if (!exposuresByMonth[month]) return;
    
    Object.entries(products).forEach(([product, amount]) => {
      allProductsFound.add(product);
      mergeStats.paperProducts++;
      
      if (!exposuresByMonth[month][product]) {
        exposuresByMonth[month][product] = {
          physical: 0,
          pricing: 0,
          paper: 0,
          netExposure: 0
        };
      }
      
      exposuresByMonth[month][product].paper += amount;
    });
  });
  
  // Process pricing from paper exposures
  Object.entries(pricingFromPaperExposures).forEach(([month, products]) => {
    if (!exposuresByMonth[month]) return;
    
    Object.entries(products).forEach(([product, amount]) => {
      allProductsFound.add(product);
      mergeStats.pricingFromPaperProducts++;
      
      if (!exposuresByMonth[month][product]) {
        exposuresByMonth[month][product] = {
          physical: 0,
          pricing: 0,
          paper: 0,
          netExposure: 0
        };
      }
      
      // Add paper exposure as pricing exposure too
      exposuresByMonth[month][product].pricing += amount;
    });
  });
  
  // Calculate net exposure for each product
  Object.values(exposuresByMonth).forEach(monthProducts => {
    Object.values(monthProducts).forEach(exposure => {
      exposure.netExposure = calculateNetExposure(exposure.physical, exposure.pricing);
    });
  });
  
  // Log merge statistics to help with debugging
  console.log(`[EXPOSURE] Merge statistics:`, mergeStats);
  
  // If EFP products were found, log their final values
  if (mergeStats.efpProductsFound > 0) {
    console.log(`[EXPOSURE] Final EFP exposures after merging:`);
    Object.entries(exposuresByMonth).forEach(([month, products]) => {
      if (products['ICE GASOIL FUTURES (EFP)'] && products['ICE GASOIL FUTURES (EFP)'].pricing !== 0) {
        console.log(`  ${month}: ${products['ICE GASOIL FUTURES (EFP)'].pricing}`);
      }
    });
  }
  
  return { allProductsFound, exposuresByMonth };
};

/**
 * Format normalized exposure data into the final MonthlyExposure structure
 */
export const formatExposureData = (
  exposuresByMonth: Record<string, Record<string, ExposureData>>,
  periods: string[],
  allowedProducts: string[]
): MonthlyExposure[] => {
  return periods.map(month => {
    const monthData = exposuresByMonth[month];
    const productsData: Record<string, ExposureData> = {};
    const totals: ExposureData = {
      physical: 0,
      pricing: 0,
      paper: 0,
      netExposure: 0
    };

    Object.entries(monthData).forEach(([product, exposure]) => {
      if (allowedProducts.includes(product)) {
        productsData[product] = exposure;
        totals.physical += exposure.physical;
        totals.pricing += exposure.pricing;
        totals.paper += exposure.paper;
      }
    });

    totals.netExposure = calculateNetExposure(totals.physical, totals.pricing);
    
    return {
      month,
      products: productsData,
      totals
    };
  });
};
