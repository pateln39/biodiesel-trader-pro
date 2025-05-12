
import { FormulaToken } from '@/types/pricing';
import { Instrument } from '@/types/common';

/**
 * Calculate exposures from formula tokens
 */
export const calculateExposures = (
  tokens: FormulaToken[], 
  quantity: number, 
  buySell: string,
  product?: string
) => {
  const physical = calculatePhysicalExposure(tokens, quantity, buySell, product);
  const pricing = calculatePricingExposure(tokens, quantity, buySell);
  
  return {
    physical,
    pricing
  };
};

/**
 * Calculate physical exposure
 */
const calculatePhysicalExposure = (
  tokens: FormulaToken[], 
  quantity: number, 
  buySell: string,
  product?: string
) => {
  // Physical exposure is typically associated with the physical product
  const exposures: Record<string, number> = {};
  
  if (product) {
    const direction = buySell.toLowerCase() === 'buy' ? 1 : -1;
    exposures[product] = quantity * direction;
  }
  
  return exposures;
};

/**
 * Calculate pricing exposure
 */
const calculatePricingExposure = (
  tokens: FormulaToken[], 
  quantity: number, 
  buySell: string
) => {
  const exposures: Record<string, number> = {};
  const direction = buySell.toLowerCase() === 'buy' ? -1 : 1; // Pricing exposure is opposite of physical
  
  for (const token of tokens) {
    if (token.type === 'instrument') {
      const instrument = token.value as Instrument;
      if (!exposures[instrument]) {
        exposures[instrument] = 0;
      }
      exposures[instrument] += quantity * direction;
    }
  }
  
  return exposures;
};

/**
 * Format value for exposure display
 */
export const formatValue = (value: number): string => {
  return Math.abs(value) < 0.01 && value !== 0
    ? value.toExponential(2)
    : value.toLocaleString('en-US', { maximumFractionDigits: 2 });
};

/**
 * Get color class based on exposure value
 */
export const getValueColorClass = (value: number): string => {
  if (value > 0) return 'text-green-500';
  if (value < 0) return 'text-red-500';
  return 'text-gray-500';
};

/**
 * Calculate total exposure for a group of products
 */
export const calculateProductGroupTotal = (
  products: Record<string, any>,
  groupProducts: string[]
): number => {
  let total = 0;
  
  for (const product of groupProducts) {
    if (products[product] && typeof products[product].netExposure === 'number') {
      total += products[product].netExposure;
    }
  }
  
  return total;
};
