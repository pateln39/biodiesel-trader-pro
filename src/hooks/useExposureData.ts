
import { useState, useEffect, useCallback } from 'react';
import { useExposurePeriods } from './exposure/useExposurePeriods';
import { useExposureProductMapping } from './exposure/useExposureProductMapping';
import { useExposureFetching } from './exposure/useExposureFetching';
import { useExposureCalculation } from './exposure/useExposureCalculation';
import { DateRange } from 'react-day-picker';
import { toast } from 'sonner';
import { ExposureCategory, CATEGORY_ORDER } from '@/types/exposure';

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
  
  // Manage date range state
  const [dateRangeEnabled, setDateRangeEnabled] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  
  // Manage selected month state - only for business days display, not for filtering
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  
  // Get fetched trade data for exposure calculation
  const { 
    tradeData,
    isLoading,
    error,
    refetch
  } = useExposureFetching();
  
  // Calculate exposure data with date filtering only
  const { exposureData } = useExposureCalculation(
    tradeData, 
    periods, 
    allowedProducts, 
    dateRangeEnabled, 
    dateRange
  );
  
  // Manage UI state for visible categories
  // Update type to ExposureCategory[] explicitly
  const [visibleCategories, setVisibleCategories] = useState<ExposureCategory[]>(['Physical', 'Pricing', 'Paper', 'Exposure']);
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
      // Make sure we're working with the correct type
      const validCategory = category as ExposureCategory;
      if (prev.includes(validCategory)) {
        return prev.filter(cat => cat !== validCategory);
      } else {
        const newCategories = [...prev, validCategory];
        // Return categories in the order defined by CATEGORY_ORDER
        return CATEGORY_ORDER.filter(cat => newCategories.includes(cat));
      }
    });
  };

  // Toggle date range filtering
  const toggleDateRangeEnabled = useCallback(() => {
    setDateRangeEnabled(prev => {
      const newValue = !prev;
      if (!newValue && dateRange) {
        // When disabling, clear the date range
        setDateRange(undefined);
        toast.info("Date range filtering disabled");
      }
      return newValue;
    });
  }, [dateRange]);

  // Handle date range change
  const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && (range?.to || range?.from)) {
      toast.success("Date range selected", {
        description: `Filtering exposure from ${range.from.toLocaleDateString()} to ${(range.to || range.from).toLocaleDateString()}`
      });
    }
  }, []);

  // Handle month selection - only for business days display
  const handleMonthSelect = useCallback((month: string) => {
    console.log('[EXPOSURE] Month selected for business days display:', month);
    setSelectedMonth(month);
  }, []);

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
    ALLOWED_PRODUCTS: allowedProducts,
    dateRangeEnabled,
    toggleDateRangeEnabled,
    dateRange,
    handleDateRangeChange,
    selectedMonth,
    handleMonthSelect
  };
};
