
import { useMemo } from 'react';
import { MonthlyExposure, ProductData, GrandTotals, GroupTotals, ExposureData } from '@/types/exposure';
import { orderVisibleCategories } from '@/utils/exposureTableUtils';

export const useExposureTotals = (
  exposureData: MonthlyExposure[],
  allProducts: string[],
  BIODIESEL_PRODUCTS: string[],
  PRICING_INSTRUMENT_PRODUCTS: string[],
  visibleCategories: string[],
  CATEGORY_ORDER: readonly string[],
  dateRangeFiltered: boolean = false
) => {
  // Calculate filtered products based on visible categories
  const filteredProducts = useMemo(() => {
    // Filter products based on selected categories
    const products: string[] = [];
    
    if (visibleCategories.includes('Physical')) {
      products.push(...allProducts.filter(p => p !== 'ICE GASOIL FUTURES'));
    }
    
    if (visibleCategories.includes('Pricing')) {
      products.push(...allProducts);
    }
    
    if (visibleCategories.includes('Paper')) {
      products.push(...allProducts.filter(p => p !== 'EFP'));
    }
    
    if (visibleCategories.includes('Exposure')) {
      products.push(...allProducts);
    }
    
    // Remove duplicates
    return [...new Set(products)];
  }, [visibleCategories, allProducts]);
  
  // Order visible categories based on canonical order
  const orderedVisibleCategories = useMemo(() => {
    return orderVisibleCategories(visibleCategories, CATEGORY_ORDER);
  }, [visibleCategories, CATEGORY_ORDER]);

  // Calculate grand totals for each product across all months
  const grandTotals = useMemo((): GrandTotals => {
    // Initialize the totals object with zeros
    const totals: ExposureData = {
      physical: 0,
      pricing: 0,
      paper: 0,
      netExposure: 0
    };
    
    const productTotals: Record<string, ProductData> = {};
    
    // Initialize with zero values for all products
    filteredProducts.forEach(product => {
      productTotals[product] = {
        physical: 0,
        pricing: 0,
        paper: 0,
        netExposure: 0
      };
    });
    
    // Loop through each month of data
    exposureData.forEach(monthData => {
      // Accumulate monthly totals
      totals.physical += monthData.totals.physical;
      totals.pricing += monthData.totals.pricing;
      totals.paper += monthData.totals.paper;
      totals.netExposure += monthData.totals.netExposure;
      
      // For each product, accumulate the month's values
      Object.entries(monthData.products).forEach(([product, data]) => {
        if (filteredProducts.includes(product)) {
          productTotals[product].physical += data.physical;
          productTotals[product].pricing += data.pricing;
          productTotals[product].paper += data.paper;
          productTotals[product].netExposure += data.netExposure;
        }
      });
    });
    
    return {
      totals,
      productTotals
    };
  }, [exposureData, filteredProducts]);

  // Calculate grand totals for biodiesel and pricing instrument groups
  const groupGrandTotals = useMemo((): GroupTotals => {
    let biodieselTotal = 0;
    let pricingInstrumentTotal = 0;
    
    // Sum up all biodiesel product net exposures
    BIODIESEL_PRODUCTS.forEach(product => {
      if (product in grandTotals.productTotals) {
        biodieselTotal += grandTotals.productTotals[product].netExposure;
      }
    });
    
    // Sum up all pricing instrument net exposures
    PRICING_INSTRUMENT_PRODUCTS.forEach(product => {
      if (product in grandTotals.productTotals) {
        pricingInstrumentTotal += grandTotals.productTotals[product].netExposure;
      }
    });
    
    // Calculate grand total (biodiesel + pricing instruments)
    const totalRow = biodieselTotal + pricingInstrumentTotal;
    
    return {
      biodieselTotal,
      pricingInstrumentTotal,
      totalRow
    };
  }, [grandTotals, BIODIESEL_PRODUCTS, PRICING_INSTRUMENT_PRODUCTS]);

  return {
    filteredProducts,
    orderedVisibleCategories,
    grandTotals,
    groupGrandTotals
  };
};
