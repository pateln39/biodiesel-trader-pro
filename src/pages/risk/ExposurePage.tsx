
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { CATEGORY_ORDER } from '@/types/exposure';
import { useExposureData } from '@/hooks/useExposureData';
import { useExposureTotals } from '@/hooks/useExposureTotals';
import ExposureControls from '@/components/exposure/ExposureControls';
import ExposureTable from '@/components/exposure/ExposureTable';
import { exportExposureToExcel } from '@/utils/export';
import { DateRange } from 'react-day-picker';

const ExposurePage = () => {
  // Use the custom hook to handle data fetching and state
  const {
    visibleCategories,
    toggleCategory,
    exposureData,
    allProducts,
    BIODIESEL_PRODUCTS,
    PRICING_INSTRUMENT_PRODUCTS,
    isLoading,
    instrumentsLoading,
    error,
    refetch,
    periods
  } = useExposureData();

  // State for selected month in business days dropdown
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  
  // State for date range filtering
  const [dateRangeEnabled, setDateRangeEnabled] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Toggle date range filtering
  const handleToggleDateRange = () => {
    setDateRangeEnabled(prev => !prev);
    if (dateRangeEnabled && dateRange) {
      // When disabling, reset the date range
      setDateRange(undefined);
      toast.info("Date range filtering disabled");
    }
  };

  // Handle date range change
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && (range?.to || range?.from)) {
      toast.success("Date range selected", {
        description: `Filtering exposure from ${range.from.toLocaleDateString()} to ${(range.to || range.from).toLocaleDateString()}`
      });
    }
  };

  // Use the totals hook to calculate all totals and filtered products
  const {
    grandTotals,
    groupGrandTotals,
    orderedVisibleCategories,
    filteredProducts
  } = useExposureTotals(
    exposureData, 
    allProducts, 
    BIODIESEL_PRODUCTS, 
    PRICING_INSTRUMENT_PRODUCTS,
    visibleCategories,
    CATEGORY_ORDER,
    dateRangeEnabled
  );

  // Handler for exporting to Excel
  const handleExportExcel = () => {
    try {
      exportExposureToExcel({
        exposureData,
        visibleCategories: orderedVisibleCategories,
        filteredProducts,
        grandTotals,
        groupGrandTotals,
        biodieselProducts: BIODIESEL_PRODUCTS,
        pricingInstrumentProducts: PRICING_INSTRUMENT_PRODUCTS
      });
      
      toast.success("Export successful", {
        description: "Exposure report has been downloaded"
      });
    } catch (error) {
      console.error('[EXPOSURE] Export error:', error);
      toast.error("Export failed", {
        description: "There was an error exporting the exposure report"
      });
    }
  };

  const isLoadingData = isLoading || instrumentsLoading;

  return (
    <Layout>
      <Helmet>
        <title>Exposure Reporting</title>
      </Helmet>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Exposure Reporting</h1>
        </div>

        <ExposureControls 
          visibleCategories={visibleCategories}
          toggleCategory={toggleCategory}
          exposureCategories={CATEGORY_ORDER}
          onExportExcel={handleExportExcel}
          availableMonths={periods}
          selectedMonth={selectedMonth}
          onMonthSelect={setSelectedMonth}
          dateRangeEnabled={dateRangeEnabled}
          onToggleDateRange={handleToggleDateRange}
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
        />

        <ExposureTable
          exposureData={exposureData}
          orderedVisibleCategories={orderedVisibleCategories}
          filteredProducts={filteredProducts}
          grandTotals={grandTotals}
          groupGrandTotals={groupGrandTotals}
          BIODIESEL_PRODUCTS={BIODIESEL_PRODUCTS}
          isLoadingData={isLoadingData}
          error={error as Error}
          refetch={refetch}
          dateRangeEnabled={dateRangeEnabled}
          dateRange={dateRange}
        />
      </div>
    </Layout>
  );
};

export default ExposurePage;
