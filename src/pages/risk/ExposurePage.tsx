import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useOpenTrades } from '@/hooks/useOpenTrades';
import { usePaperTrades } from '@/hooks/usePaperTrades';
import { Button } from '@/components/ui/button';
import { DownloadIcon } from 'lucide-react';
import { exportExposureToExcel, exportExposureByTrade } from '@/utils/excelExportUtils';
import { toast } from 'sonner';
import {
  calculateCategoryTotals,
  calculateGrandTotals,
  calculateGroupGrandTotals,
  calculateProductTotals,
  createInitialExposureData,
  filterProductsByCategory,
  generateFilteredProducts,
  updateExposureData
} from '@/utils/exposureUtils';

const ExposurePage = () => {
  const { openTrades, loading: openTradesLoading, error: openTradesError } = useOpenTrades();
  const { paperTrades, loading: paperTradesLoading, error: paperTradesError } = usePaperTrades();

  const [exposureData, setExposureData] = useState(() => createInitialExposureData());
  const [visibleCategories, setVisibleCategories] = useState(['Physical', 'Pricing', 'Paper', 'Exposure']);
  const [filteredProducts, setFilteredProducts] = useState<string[]>([]);
  const [grandTotals, setGrandTotals] = useState({ productTotals: {}, categoryTotals: {} });
  const [groupGrandTotals, setGroupGrandTotals] = useState({
    biodieselTotal: 0,
    pricingInstrumentTotal: 0,
    totalRow: 0,
  });

  useEffect(() => {
    if (openTradesLoading || paperTradesLoading) return;
    if (openTradesError || paperTradesError) {
      console.error("Error fetching trades:", openTradesError, paperTradesError);
      return;
    }

    const initialExposureData = createInitialExposureData();
    let updatedExposureData = { ...initialExposureData };

    // Update with open trades
    updatedExposureData = updateExposureData(updatedExposureData, openTrades, 'openTrades');

    // Update with paper trades
    updatedExposureData = updateExposureData(updatedExposureData, paperTrades, 'paperTrades');

    setExposureData(updatedExposureData);
  }, [openTrades, paperTrades, openTradesLoading, paperTradesError, paperTradesLoading, paperTradesError]);

  useEffect(() => {
    const newFilteredProducts = generateFilteredProducts(exposureData);
    setFilteredProducts(newFilteredProducts);
  }, [exposureData]);

  useEffect(() => {
    if (filteredProducts.length === 0) return;

    const productTotals = calculateProductTotals(exposureData, filteredProducts);
    const categoryTotals = calculateCategoryTotals(exposureData, filteredProducts);
    const newGrandTotals = calculateGrandTotals(productTotals, categoryTotals);

    setGrandTotals(newGrandTotals);
  }, [exposureData, filteredProducts]);

  useEffect(() => {
    const biodieselProducts = filterProductsByCategory(filteredProducts, 'Biodiesel');
    const pricingInstrumentProducts = filterProductsByCategory(filteredProducts, 'Pricing Instrument');

    const newGroupGrandTotals = calculateGroupGrandTotals(
      exposureData,
      biodieselProducts,
      pricingInstrumentProducts
    );

    setGroupGrandTotals(newGroupGrandTotals);
  }, [exposureData, filteredProducts]);

  const biodieselProducts = filterProductsByCategory(filteredProducts, 'Biodiesel');
  const pricingInstrumentProducts = filterProductsByCategory(filteredProducts, 'Pricing Instrument');

  const handleExportExcel = async () => {
    try {
      const fileName = await exportExposureToExcel(
        exposureData,
        visibleCategories,
        filteredProducts,
        grandTotals,
        groupGrandTotals,
        biodieselProducts,
        pricingInstrumentProducts
      );
      toast.success(`Successfully exported to ${fileName}`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export to Excel');
    }
  };

  const handleExportByTradeExcel = async () => {
    try {
      const fileName = await exportExposureByTrade();
      toast.success(`Successfully exported to ${fileName}`);
    } catch (error) {
      console.error('Error exporting by trade to Excel:', error);
      toast.error('Failed to export by trade to Excel');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Exposure</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleExportExcel}
              className="flex items-center gap-2"
            >
              <DownloadIcon className="h-4 w-4" />
              Export
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExportByTradeExcel}
              className="flex items-center gap-2"
            >
              <DownloadIcon className="h-4 w-4" />
              Export by Trade
            </Button>
          </div>
        </div>
        
        <div className="grid gap-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Month
                  </th>
                  {visibleCategories.map(category => (
                    <React.Fragment key={category}>
                      {filteredProducts.filter(product => {
                        if (category === 'Physical' && (product === 'ICE GASOIL FUTURES (EFP)' || product === 'ICE GASOIL FUTURES' || product === 'EFP')) {
                          return false;
                        }
                        if (category === 'Paper' && (product === 'ICE GASOIL FUTURES (EFP)' || product === 'EFP')) {
                          return false;
                        }
                        return true;
                      }).map(product => (
                        <th key={product} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {product}
                        </th>
                      ))}
                      {category === 'Exposure' && (
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Biodiesel Total
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Pricing Instrument Total
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Row
                          </th>
                        </>
                      )}
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700">
                {Object.entries(exposureData).map(([month, monthData]) => (
                  <tr key={month}>
                    <td className="px-6 py-4 whitespace-nowrap">{month}</td>
                    {visibleCategories.map(category => (
                      <React.Fragment key={category}>
                        {filteredProducts.filter(product => {
                          if (category === 'Physical' && (product === 'ICE GASOIL FUTURES (EFP)' || product === 'ICE GASOIL FUTURES' || product === 'EFP')) {
                            return false;
                          }
                          if (category === 'Paper' && (product === 'ICE GASOIL FUTURES (EFP)' || product === 'EFP')) {
                            return false;
                          }
                          return true;
                        }).map(product => {
                          const productData = monthData.products[product] || { physical: 0, pricing: 0, paper: 0, netExposure: 0 };
                          let value = 0;
                          if (category === 'Physical') value = productData.physical;
                          else if (category === 'Pricing') value = productData.pricing;
                          else if (category === 'Paper') value = productData.paper;
                          else if (category === 'Exposure') value = productData.netExposure;

                          return (
                            <td key={product} className="px-6 py-4 whitespace-nowrap">
                              {value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </td>
                          );
                        })}
                        {category === 'Exposure' && (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {biodieselProducts.reduce((total, product) => {
                                if (monthData.products[product]) {
                                  return total + monthData.products[product].netExposure;
                                }
                                return total;
                              }, 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {pricingInstrumentProducts.reduce((total, product) => {
                                if (monthData.products[product]) {
                                  return total + monthData.products[product].netExposure;
                                }
                                return total;
                              }, 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {(biodieselProducts.reduce((total, product) => {
                                if (monthData.products[product]) {
                                  return total + monthData.products[product].netExposure;
                                }
                                return total;
                              }, 0) + pricingInstrumentProducts.reduce((total, product) => {
                                if (monthData.products[product]) {
                                  return total + monthData.products[product].netExposure;
                                }
                                return total;
                              }, 0)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </td>
                          </>
                        )}
                      </React.Fragment>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap font-bold">Total</td>
                  {visibleCategories.map(category => (
                    <React.Fragment key={category}>
                      {filteredProducts.filter(product => {
                        if (category === 'Physical' && (product === 'ICE GASOIL FUTURES (EFP)' || product === 'ICE GASOIL FUTURES' || product === 'EFP')) {
                          return false;
                        }
                        if (category === 'Paper' && (product === 'ICE GASOIL FUTURES (EFP)' || product === 'EFP')) {
                          return false;
                        }
                        return true;
                      }).map(product => {
                        let value = 0;
                        if (grandTotals.productTotals[product]) {
                          if (category === 'Physical') value = grandTotals.productTotals[product].physical;
                          else if (category === 'Pricing') value = grandTotals.productTotals[product].pricing;
                          else if (category === 'Paper') value = grandTotals.productTotals[product].paper;
                          else if (category === 'Exposure') value = grandTotals.productTotals[product].netExposure;
                        }
                        return (
                          <td key={product} className="px-6 py-4 whitespace-nowrap font-bold">
                            {value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </td>
                        );
                      })}
                      {category === 'Exposure' && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap font-bold">
                            {groupGrandTotals.biodieselTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-bold">
                            {groupGrandTotals.pricingInstrumentTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-bold">
                            {groupGrandTotals.totalRow.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </td>
                        </>
                      )}
                    </React.Fragment>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ExposurePage;
