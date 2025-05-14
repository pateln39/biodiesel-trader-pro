
import { MonthlyExposure, ExposureData, ProductExposure } from '@/types/exposure';
import { calculateNetExposure } from '@/utils/tradeUtils';
import { mapProductToCanonical } from '@/utils/productMapping';

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
    productsWithSignificantValues: 0
  };
  
  // Log the incoming exposure data size
  console.log(`[EXPOSURE] Merging exposures - physical months: ${Object.keys(physicalExposures).length}, pricing months: ${Object.keys(pricingExposures).length}`);
  
  // Special logging for EFP exposures
  const logEfpExposures = (data: Record<string, Record<string, number>>, type: string) => {
    Object.entries(data).forEach(([month, products]) => {
      Object.entries(products).forEach(([product, amount]) => {
        // Check if this is an EFP product (either before or after mapping)
        if (product === 'ICE GASOIL FUTURES (EFP)' || product === 'EFP' || 
            mapProductToCanonical(product) === 'EFP') {
          console.log(`[EFP MERGE] Found ${type} exposure for ${product} in ${month}: ${amount}`);
        }
      });
    });
  };
  
  // Check for EFP exposures in incoming data
  logEfpExposures(pricingExposures, 'pricing');
  
  // Process physical exposures
  Object.entries(physicalExposures).forEach(([month, products]) => {
    if (!exposuresByMonth[month]) return;
    
    Object.entries(products).forEach(([product, amount]) => {
      // Ensure canonical product name for consistent mapping
      const canonicalProduct = mapProductToCanonical(product);
      
      allProductsFound.add(canonicalProduct);
      mergeStats.physicalProducts++;
      
      if (!exposuresByMonth[month][canonicalProduct]) {
        exposuresByMonth[month][canonicalProduct] = {
          physical: 0,
          pricing: 0,
          paper: 0,
          netExposure: 0
        };
      }
      
      exposuresByMonth[month][canonicalProduct].physical += amount;
      
      // Track significant values
      if (Math.abs(amount) > 100) {
        mergeStats.productsWithSignificantValues++;
      }
    });
  });
  
  // Process pricing exposures - treat all instruments the same regardless of type
  Object.entries(pricingExposures).forEach(([month, products]) => {
    if (!exposuresByMonth[month]) return;
    
    Object.entries(products).forEach(([product, amount]) => {
      // Ensure canonical product name for consistent mapping
      const canonicalProduct = mapProductToCanonical(product);
      
      allProductsFound.add(canonicalProduct);
      mergeStats.pricingProducts++;
      
      if (!exposuresByMonth[month][canonicalProduct]) {
        exposuresByMonth[month][canonicalProduct] = {
          physical: 0,
          pricing: 0,
          paper: 0,
          netExposure: 0
        };
      }
      
      // Special logging for EFP exposures
      if (product === 'ICE GASOIL FUTURES (EFP)' || canonicalProduct === 'EFP') {
        console.log(`[EFP MERGE] Adding pricing exposure for ${product} (as ${canonicalProduct}) in ${month}: ${amount}`);
      }
      
      // Track significant values to help with debugging
      if (Math.abs(amount) > 100) {
        console.log(`[EXPOSURE] Significant pricing exposure: ${month} ${canonicalProduct} (from ${product}) ${amount}`);
        mergeStats.productsWithSignificantValues++;
      }
      
      // Add the pricing exposure using the canonical product name
      exposuresByMonth[month][canonicalProduct].pricing += amount;
    });
  });
  
  // Process paper exposures
  Object.entries(paperExposures).forEach(([month, products]) => {
    if (!exposuresByMonth[month]) return;
    
    Object.entries(products).forEach(([product, amount]) => {
      // Ensure canonical product name for consistent mapping
      const canonicalProduct = mapProductToCanonical(product);
      
      allProductsFound.add(canonicalProduct);
      mergeStats.paperProducts++;
      
      if (!exposuresByMonth[month][canonicalProduct]) {
        exposuresByMonth[month][canonicalProduct] = {
          physical: 0,
          pricing: 0,
          paper: 0,
          netExposure: 0
        };
      }
      
      exposuresByMonth[month][canonicalProduct].paper += amount;
    });
  });
  
  // Process pricing from paper exposures
  Object.entries(pricingFromPaperExposures).forEach(([month, products]) => {
    if (!exposuresByMonth[month]) return;
    
    Object.entries(products).forEach(([product, amount]) => {
      // Ensure canonical product name for consistent mapping
      const canonicalProduct = mapProductToCanonical(product);
      
      allProductsFound.add(canonicalProduct);
      mergeStats.pricingFromPaperProducts++;
      
      if (!exposuresByMonth[month][canonicalProduct]) {
        exposuresByMonth[month][canonicalProduct] = {
          physical: 0,
          pricing: 0,
          paper: 0,
          netExposure: 0
        };
      }
      
      // Add paper exposure as pricing exposure too
      exposuresByMonth[month][canonicalProduct].pricing += amount;
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
  
  // Check for EFP values in the merged data
  Object.entries(exposuresByMonth).forEach(([month, products]) => {
    if (products['EFP'] && (products['EFP'].physical !== 0 || products['EFP'].pricing !== 0 || products['EFP'].paper !== 0)) {
      console.log(`[EFP MERGE] Final merged values for EFP in ${month}:`, products['EFP']);
    }
  });
  
  // Log a sample of the merged data to verify
  console.log(`[EXPOSURE] Merged data sample - first month:`);
  const sampleMonth = Object.keys(exposuresByMonth)[0];
  if (sampleMonth) {
    // Find products with non-zero values
    const productsWithValues = Object.entries(exposuresByMonth[sampleMonth])
      .filter(([_, exposure]) => exposure.physical !== 0 || exposure.pricing !== 0 || exposure.paper !== 0)
      .slice(0, 3); // Just show up to 3 products
    
    console.log(`Month: ${sampleMonth}, Products with values: ${productsWithValues.length}`);
    productsWithValues.forEach(([product, exposure]) => {
      console.log(`  ${product}: Physical=${exposure.physical}, Pricing=${exposure.pricing}, Paper=${exposure.paper}, Net=${exposure.netExposure}`);
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
