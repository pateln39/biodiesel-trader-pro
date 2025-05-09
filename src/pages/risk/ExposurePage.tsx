
import React from 'react';
import Layout from '@/components/Layout';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { CATEGORY_ORDER } from '@/types/exposure';
import { useExposureData } from '@/hooks/useExposureData';
import { useExposureTotals } from '@/hooks/useExposureTotals';
import ExposureControls from '@/components/exposure/ExposureControls';
import ExposureTable from '@/components/exposure/ExposureTable';
import { exportExposureToExcel, exportExposureByTrade } from '@/utils/export';

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
  } = useExposureData();

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
    CATEGORY_ORDER
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

  // Handler for exporting by trade
  const handleExportByTrade = async () => {
    try {
      await exportExposureByTrade();
      toast.success("Export successful", {
        description: "Exposure by trade report has been downloaded"
      });
    } catch (error) {
      console.error('[EXPOSURE] Export by trade error:', error);
      toast.error("Export failed", {
        description: "There was an error exporting the exposure by trade report"
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
          onExportByTrade={handleExportByTrade}
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
        />
      </div>
    </Layout>
  );
};

export default ExposurePage;
