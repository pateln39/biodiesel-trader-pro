
import { calculateNetExposure } from '@/utils/tradeUtils';
import { MonthlyExposure, ExposureData, ProductExposure, GrandTotals, GroupTotals } from '@/types/exposure';
import React from 'react';

/**
 * Calculate total for a specific product group and category
 */
export const calculateProductGroupTotal = (
  monthProducts: ProductExposure, 
  productGroup: string[], 
  category: keyof ExposureData = 'netExposure'
): number => {
  return productGroup.reduce((total, product) => {
    if (monthProducts[product]) {
      return total + (monthProducts[product][category] || 0);
    }
    return total;
  }, 0);
};

/**
 * Calculate the grand totals for all products and months
 */
export const calculateGrandTotals = (
  exposureData: MonthlyExposure[],
  allProducts: string[]
): GrandTotals => {
  const totals: ExposureData = {
    physical: 0,
    pricing: 0,
    paper: 0,
    netExposure: 0
  };
  
  const productTotals: Record<string, ExposureData> = {};
  allProducts.forEach(product => {
    productTotals[product] = {
      physical: 0,
      pricing: 0,
      paper: 0,
      netExposure: 0
    };
  });

  exposureData.forEach(monthData => {
    totals.physical += monthData.totals.physical;
    totals.pricing += monthData.totals.pricing;
    totals.paper += monthData.totals.paper;
    totals.netExposure = calculateNetExposure(totals.physical, totals.pricing);

    Object.entries(monthData.products).forEach(([product, exposure]) => {
      if (productTotals[product]) {
        productTotals[product].physical += exposure.physical;
        productTotals[product].pricing += exposure.pricing;
        productTotals[product].paper += exposure.paper;
        productTotals[product].netExposure = calculateNetExposure(
          productTotals[product].physical, 
          productTotals[product].pricing
        );
      }
    });
  });

  return {
    totals,
    productTotals
  };
};

/**
 * Calculate group totals for biodiesel and pricing instrument products
 */
export const calculateGroupTotals = (
  grandTotals: GrandTotals,
  biodieselProducts: string[],
  pricingInstrumentProducts: string[]
): GroupTotals => {
  const biodieselTotal = biodieselProducts.reduce((total, product) => {
    if (grandTotals.productTotals[product]) {
      return total + grandTotals.productTotals[product].netExposure;
    }
    return total;
  }, 0);

  const pricingInstrumentTotal = pricingInstrumentProducts.reduce((total, product) => {
    if (grandTotals.productTotals[product]) {
      return total + grandTotals.productTotals[product].netExposure;
    }
    return total;
  }, 0);

  return {
    biodieselTotal,
    pricingInstrumentTotal,
    totalRow: biodieselTotal + pricingInstrumentTotal
  };
};

/**
 * Get the appropriate CSS class for a value based on whether it's positive, negative, or zero
 */
export const getValueColorClass = (value: number): string => {
  if (value > 0) return 'text-green-400';
  if (value < 0) return 'text-red-400';
  return 'text-gray-500';
};

/**
 * Format a numeric value for display in the exposure table
 */
export const formatValue = (value: number): string | React.ReactElement => {
  if (value === 0) return React.createElement('span', { className: "text-brand-lime text-xs" }, '-');
  return `${value >= 0 ? '+' : ''}${value.toLocaleString()}`;
};
