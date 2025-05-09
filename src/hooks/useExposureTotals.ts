
import { useMemo } from 'react';
import { MonthlyExposure, GrandTotals, GroupTotals } from '@/types/exposure';
import { calculateGrandTotals, calculateGroupTotals } from '@/utils/exposureCalculationUtils';
import { orderVisibleCategories } from '@/utils/exposureTableUtils';

export const useExposureTotals = (
  exposureData: MonthlyExposure[], 
  allProducts: string[],
  biodieselProducts: string[],
  pricingInstrumentProducts: string[],
  visibleCategories: string[],
  categoryOrder: readonly string[]
) => {
  // Calculate grand totals
  const grandTotals = useMemo<GrandTotals>(() => {
    return calculateGrandTotals(exposureData, allProducts);
  }, [exposureData, allProducts]);

  // Calculate group totals
  const groupGrandTotals = useMemo<GroupTotals>(() => {
    return calculateGroupTotals(grandTotals, biodieselProducts, pricingInstrumentProducts);
  }, [grandTotals, biodieselProducts, pricingInstrumentProducts]);

  // Get ordered visible categories
  const orderedVisibleCategories = useMemo(() => {
    return orderVisibleCategories(visibleCategories, categoryOrder);
  }, [visibleCategories, categoryOrder]);

  // Get filtered products (currently using all products)
  const filteredProducts = useMemo(() => {
    return allProducts;
  }, [allProducts]);

  return {
    grandTotals,
    groupGrandTotals,
    orderedVisibleCategories,
    filteredProducts
  };
};
