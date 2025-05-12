
import { useState, useEffect } from 'react';
import { useExposurePeriods } from './exposure/useExposurePeriods';
import { useExposureProductMapping } from './exposure/useExposureProductMapping';
import { useExposureFetching } from './exposure/useExposureFetching';
import { useExposureCalculation } from './exposure/useExposureCalculation';

export const useExposureData = () => {
  // Get exposure periods (months for the table)
  const { periods } = useExposurePeriods();
  
  // Get product mappings and categories
  const { 
    instrumentsLoading, 
    allowedProducts,
    biodieselProducts,
    pricingInstrumentProducts,
    allProducts
  } = useExposureProductMapping();
  
  // Get fetched trade data for exposure calculation
  const { 
    tradeData,
    isLoading,
    error,
    refetch
  } = useExposureFetching();
  
  // Calculate exposure data
  const { exposureData } = useExposureCalculation(tradeData, periods, allowedProducts);
  
  // Manage UI state for visible categories
  const [visibleCategories, setVisibleCategories] = useState<string[]>(['Physical', 'Pricing', 'Paper', 'Exposure']);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  
  // Update selected products when allProducts changes
  useEffect(() => {
    if (allProducts.length > 0) {
      setSelectedProducts([...allProducts]);
    }
  }, [allProducts]);

  // Toggle category visibility
  const toggleCategory = (category: string) => {
    setVisibleCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(cat => cat !== category);
      } else {
        const newCategories = [...prev, category];
        return ['Physical', 'Pricing', 'Paper', 'Exposure'].filter(cat => newCategories.includes(cat));
      }
    });
  };

  return {
    periods,
    visibleCategories,
    setVisibleCategories,
    toggleCategory,
    selectedProducts,
    setSelectedProducts,
    allProducts,
    exposureData,
    isLoading,
    error,
    refetch,
    instrumentsLoading,
    BIODIESEL_PRODUCTS: biodieselProducts,
    PRICING_INSTRUMENT_PRODUCTS: pricingInstrumentProducts,
    ALLOWED_PRODUCTS: allowedProducts
  };
};
