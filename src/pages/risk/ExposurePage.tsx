
import React, { useMemo, useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent 
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Helmet } from 'react-helmet-async';
import { validateAndParsePricingFormula } from '@/utils/formulaUtils';
import { getNextMonths } from '@/utils/dateUtils';
import TableLoadingState from '@/components/trades/TableLoadingState';
import TableErrorState from '@/components/trades/TableErrorState';
import { Checkbox } from "@/components/ui/checkbox";
import { 
  mapProductToCanonical, 
  parsePaperInstrument, 
  formatExposureTableProduct,
  isPricingInstrument,
  shouldUseSpecialBackground,
  getExposureProductBackgroundClass
} from '@/utils/productMapping';
import { calculateNetExposure } from '@/utils/tradeUtils';
import { calculateProRatedExposure } from '@/utils/businessDayUtils';
import { Json } from '@/integrations/supabase/types';

interface ExposureData {
  physical: number;
  pricing: number;
  paper: number;
  netExposure: number;
}

interface ProductExposure {
  [product: string]: ExposureData;
}

interface MonthlyExposure {
  month: string;
  products: ProductExposure;
  totals: ExposureData;
}

interface PricingInstrument {
  id: string;
  display_name: string;
  instrument_code: string;
  is_active: boolean;
}

function hasExposureByMonth(exposures: Json | undefined | null): exposures is { byMonth: Record<string, number> } {
  return !!exposures && 
         typeof exposures === 'object' && 
         exposures !== null && 
         'byMonth' in exposures && 
         !!exposures.byMonth;
}

const CATEGORY_ORDER = ['Physical', 'Pricing', 'Paper', 'Exposure'];

const usePricingInstruments = () => {
  return useQuery({
    queryKey: ['pricing-instruments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing_instruments')
        .select('id, display_name, instrument_code, is_active')
        .eq('is_active', true);
        
      if (error) throw error;
      return data || [];
    }
  });
};

const calculateProductGroupTotal = (
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

const ExposurePage = () => {
  const [showDetails, setShowDetails] = useState(false);
  const [months, setMonths] = useState<string[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<Set<string>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set(CATEGORY_ORDER));
  
  const { data: pricingInstruments, isLoading: loadingInstruments } = usePricingInstruments();
  
  const { data: exposureData, isLoading, error, refetch } = useQuery({
    queryKey: ['exposure-data'],
    queryFn: async () => {
      // Fetch Physical trades with exposures
      const { data: physicalTradeLegs, error: physicalError } = await supabase
        .from('trade_legs')
        .select(`
          id, parent_trade_id, buy_sell, product, quantity, 
          pricing_period_start, pricing_period_end, trading_period, exposures
        `)
        .eq('parent_trade_id', supabase.from('parent_trades').select('id').eq('trade_type', 'physical').toString());
        
      if (physicalError) throw physicalError;

      // Fetch Paper trades with exposures
      const { data: paperTradeLegs, error: paperError } = await supabase
        .from('paper_trade_legs')
        .select(`
          id, paper_trade_id, buy_sell, product, quantity, 
          pricing_period_start, pricing_period_end, trading_period, exposures
        `);
        
      if (paperError) throw paperError;
      
      return { 
        physical: physicalTradeLegs || [],
        paper: paperTradeLegs || []
      };
    }
  });
  
  // Update months when exposure data changes
  useEffect(() => {
    if (exposureData) {
      // Extract unique months from all trade legs
      const allMonths = new Set<string>();
      
      // Process physical trade legs
      exposureData.physical.forEach(leg => {
        if (leg.exposures && typeof leg.exposures === 'object') {
          if (hasExposureByMonth(leg.exposures)) {
            Object.keys(leg.exposures.byMonth).forEach(month => {
              allMonths.add(month);
            });
          }
        }
        
        // Add trading period if available
        if (leg.trading_period) {
          allMonths.add(leg.trading_period);
        }
      });
      
      // Process paper trade legs
      exposureData.paper.forEach(leg => {
        if (leg.exposures && typeof leg.exposures === 'object') {
          if (hasExposureByMonth(leg.exposures)) {
            Object.keys(leg.exposures.byMonth).forEach(month => {
              allMonths.add(month);
            });
          }
        }
        
        // Add trading period if available
        if (leg.trading_period) {
          allMonths.add(leg.trading_period);
        }
      });
      
      // If no months from exposures, generate next 6 months
      let monthsList = Array.from(allMonths);
      if (monthsList.length === 0) {
        monthsList = getNextMonths(6);
      }
      
      // Sort months
      monthsList.sort();
      
      setMonths(monthsList);
      setSelectedMonths(new Set(monthsList));
    }
  }, [exposureData]);
  
  const monthlyExposures = useMemo(() => {
    if (!exposureData || !months.length) return [];
    
    const result: MonthlyExposure[] = [];
    
    // Initialize each month with empty products
    months.forEach(month => {
      if (selectedMonths.has(month)) {
        result.push({
          month,
          products: {},
          totals: { physical: 0, pricing: 0, paper: 0, netExposure: 0 }
        });
      }
    });
    
    // Skip processing if no months selected
    if (result.length === 0) return result;
    
    // Process physical trades
    exposureData.physical.forEach(leg => {
      const canonicalProduct = mapProductToCanonical(leg.product);
      const buySell = leg.buy_sell === 'buy' ? 1 : -1;
      const quantity = (leg.quantity || 0) * buySell;
      
      let exposureByMonth: Record<string, number> = {};
      
      // Check if we have stored exposures
      if (leg.exposures && hasExposureByMonth(leg.exposures)) {
        exposureByMonth = leg.exposures.byMonth;
      } else if (leg.pricing_period_start && leg.pricing_period_end) {
        // Calculate exposures based on pricing period
        exposureByMonth = calculateProRatedExposure(
          new Date(leg.pricing_period_start),
          new Date(leg.pricing_period_end),
          quantity
        );
      } else if (leg.trading_period) {
        // Use trading period if available
        exposureByMonth = { [leg.trading_period]: quantity };
      }
      
      // Add exposures to each month
      Object.entries(exposureByMonth).forEach(([month, exposure]) => {
        const monthIndex = result.findIndex(m => m.month === month);
        if (monthIndex === -1) return; // Skip if month not selected
        
        const monthData = result[monthIndex];
        
        // Initialize product if not exists
        if (!monthData.products[canonicalProduct]) {
          monthData.products[canonicalProduct] = {
            physical: 0,
            pricing: 0,
            paper: 0,
            netExposure: 0
          };
        }
        
        // Add physical exposure
        monthData.products[canonicalProduct].physical += exposure;
        
        // Update net exposure
        monthData.products[canonicalProduct].netExposure = calculateNetExposure(
          monthData.products[canonicalProduct].physical,
          monthData.products[canonicalProduct].pricing
        );
        
        // Update month totals
        monthData.totals.physical += exposure;
        monthData.totals.netExposure = calculateNetExposure(
          monthData.totals.physical,
          monthData.totals.pricing
        );
      });
    });
    
    // Process paper trades
    exposureData.paper.forEach(leg => {
      // Use the product directly since we don't have instrument in this context
      // Fixed: Use product directly instead of missing 'instrument' property
      const { baseProduct, oppositeProduct, relationshipType } = parsePaperInstrument(leg.product);
      const buySell = leg.buy_sell === 'buy' ? 1 : -1;
      const quantity = (leg.quantity || 0) * buySell;
      
      let exposureByMonth: Record<string, number> = {};
      
      // Check if we have stored exposures
      if (leg.exposures && hasExposureByMonth(leg.exposures)) {
        exposureByMonth = leg.exposures.byMonth;
      } else if (leg.pricing_period_start && leg.pricing_period_end) {
        // Calculate exposures based on pricing period
        exposureByMonth = calculateProRatedExposure(
          new Date(leg.pricing_period_start),
          new Date(leg.pricing_period_end),
          quantity
        );
      } else if (leg.trading_period) {
        // Use trading period if available
        exposureByMonth = { [leg.trading_period]: quantity };
      }
      
      // Add base product exposure
      Object.entries(exposureByMonth).forEach(([month, exposure]) => {
        const monthIndex = result.findIndex(m => m.month === month);
        if (monthIndex === -1) return; // Skip if month not selected
        
        const monthData = result[monthIndex];
        
        // Handle base product
        if (!monthData.products[baseProduct]) {
          monthData.products[baseProduct] = {
            physical: 0,
            pricing: 0,
            paper: 0,
            netExposure: 0
          };
        }
        
        // Add paper exposure for product
        if (isPricingInstrument(baseProduct)) {
          monthData.products[baseProduct].pricing += exposure;
        } else {
          monthData.products[baseProduct].paper += exposure;
        }
        
        // Update net exposure
        monthData.products[baseProduct].netExposure = calculateNetExposure(
          monthData.products[baseProduct].physical,
          monthData.products[baseProduct].pricing
        );
        
        // Update month totals for paper
        monthData.totals.paper += exposure;
        
        // Handle opposite product for spreads if applicable
        if (oppositeProduct && relationshipType === 'SPREAD') {
          if (!monthData.products[oppositeProduct]) {
            monthData.products[oppositeProduct] = {
              physical: 0,
              pricing: 0,
              paper: 0,
              netExposure: 0
            };
          }
          
          // Add opposite exposure with inverted sign
          if (isPricingInstrument(oppositeProduct)) {
            monthData.products[oppositeProduct].pricing -= exposure;
          } else {
            monthData.products[oppositeProduct].paper -= exposure;
          }
          
          // Update net exposure for opposite product
          monthData.products[oppositeProduct].netExposure = calculateNetExposure(
            monthData.products[oppositeProduct].physical,
            monthData.products[oppositeProduct].pricing
          );
        }
        
        // Update net exposure total
        monthData.totals.netExposure = calculateNetExposure(
          monthData.totals.physical,
          monthData.totals.pricing
        );
      });
    });
    
    return result;
  }, [exposureData, months, selectedMonths]);
  
  // Get unique products across all months
  const uniqueProducts = useMemo(() => {
    const products = new Set<string>();
    
    monthlyExposures.forEach(month => {
      Object.keys(month.products).forEach(product => {
        products.add(product);
      });
    });
    
    // Sort products - pricing instruments first, then others
    return Array.from(products).sort((a, b) => {
      const aIsPricing = isPricingInstrument(a);
      const bIsPricing = isPricingInstrument(b);
      
      if (aIsPricing && !bIsPricing) return -1;
      if (!aIsPricing && bIsPricing) return 1;
      
      return a.localeCompare(b);
    });
  }, [monthlyExposures]);
  
  // Group products by type
  const productGroups = useMemo(() => {
    const pricingProducts: string[] = [];
    const bioProducts: string[] = [];
    
    uniqueProducts.forEach(product => {
      if (isPricingInstrument(product)) {
        pricingProducts.push(product);
      } else {
        bioProducts.push(product);
      }
    });
    
    return {
      pricingProducts,
      bioProducts
    };
  }, [uniqueProducts]);
  
  const toggleMonthSelection = (month: string) => {
    const newSelected = new Set(selectedMonths);
    if (newSelected.has(month)) {
      newSelected.delete(month);
    } else {
      newSelected.add(month);
    }
    setSelectedMonths(newSelected);
  };
  
  const toggleCategorySelection = (category: string) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(category)) {
      if (newSelected.size > 1) { // Keep at least one category selected
        newSelected.delete(category);
      }
    } else {
      newSelected.add(category);
    }
    setSelectedCategories(newSelected);
  };
  
  const toggleAllMonths = () => {
    if (selectedMonths.size === months.length) {
      setSelectedMonths(new Set());
    } else {
      setSelectedMonths(new Set(months));
    }
  };
  
  const handleExportCSV = () => {
    // Export functionality placeholder
    console.log('Export CSV');
  };

  const handleRetry = () => {
    refetch();
  };
  
  if (isLoading || loadingInstruments) {
    return (
      <Layout>
        <Helmet>
          <title>Exposure Report | RiskTracker</title>
        </Helmet>
        <div className="container mx-auto p-4">
          <h1 className="text-2xl font-bold mb-4">Exposure Report</h1>
          <TableLoadingState />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Helmet>
          <title>Exposure Report | RiskTracker</title>
        </Helmet>
        <div className="container mx-auto p-4">
          <h1 className="text-2xl font-bold mb-4">Exposure Report</h1>
          <TableErrorState error={error} onRetry={handleRetry} />
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <Helmet>
        <title>Exposure Report | RiskTracker</title>
      </Helmet>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Exposure Report</h1>
          <Button onClick={handleExportCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
        
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 mb-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Show Details</h3>
                <Checkbox 
                  id="show-details" 
                  checked={showDetails}
                  onCheckedChange={() => setShowDetails(!showDetails)}
                />
                <label htmlFor="show-details" className="ml-2 text-sm">
                  Show Category Breakdown
                </label>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Categories</h3>
                <div className="flex gap-2">
                  {CATEGORY_ORDER.map(category => (
                    <label key={category} className="flex items-center">
                      <Checkbox 
                        checked={selectedCategories.has(category)}
                        onCheckedChange={() => toggleCategorySelection(category)}
                        className="mr-1"
                      />
                      <span className="text-sm">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Months</h3>
                <div className="flex gap-2">
                  <label className="flex items-center">
                    <Checkbox 
                      checked={selectedMonths.size === months.length}
                      onCheckedChange={toggleAllMonths}
                      className="mr-1"
                    />
                    <span className="text-sm">All</span>
                  </label>
                  {months.map(month => (
                    <label key={month} className="flex items-center">
                      <Checkbox 
                        checked={selectedMonths.has(month)}
                        onCheckedChange={() => toggleMonthSelection(month)}
                        className="mr-1"
                      />
                      <span className="text-sm">{month}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-0 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-40 font-bold">Product</TableHead>
                  {Array.from(selectedMonths).sort().map(month => (
                    <TableHead key={month} className="font-bold text-center">
                      {month}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Pricing products section */}
                {productGroups.pricingProducts.length > 0 && (
                  <>
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={selectedMonths.size + 1} className="font-semibold bg-purple-100 text-black">
                        Pricing Instruments
                      </TableCell>
                    </TableRow>
                    
                    {productGroups.pricingProducts.map(product => (
                      <React.Fragment key={product}>
                        <TableRow>
                          <TableCell className="font-medium">
                            {formatExposureTableProduct(product)}
                          </TableCell>
                          
                          {Array.from(selectedMonths).sort().map(month => {
                            const monthData = monthlyExposures.find(m => m.month === month);
                            const productData = monthData?.products[product];
                            
                            const netExposure = productData?.netExposure || 0;
                            
                            return (
                              <TableCell key={month} className="text-right">
                                {showDetails ? (
                                  <div className="flex flex-col">
                                    {selectedCategories.has('Physical') && (
                                      <span className={productData?.physical ? 'font-semibold' : 'text-gray-400'}>
                                        P: {productData?.physical?.toLocaleString() || 0}
                                      </span>
                                    )}
                                    {selectedCategories.has('Pricing') && (
                                      <span className={productData?.pricing ? 'font-semibold' : 'text-gray-400'}>
                                        $: {productData?.pricing?.toLocaleString() || 0}
                                      </span>
                                    )}
                                    {selectedCategories.has('Paper') && (
                                      <span className={productData?.paper ? 'font-semibold' : 'text-gray-400'}>
                                        T: {productData?.paper?.toLocaleString() || 0}
                                      </span>
                                    )}
                                    {selectedCategories.has('Exposure') && (
                                      <span className="font-bold border-t mt-1 pt-1">
                                        E: {netExposure?.toLocaleString() || 0}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="font-medium">
                                    {netExposure?.toLocaleString() || 0}
                                  </span>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      </React.Fragment>
                    ))}
                    
                    {/* Pricing instrument totals */}
                    <TableRow className="bg-purple-300">
                      <TableCell className="font-bold">
                        Pricing Instruments Total
                      </TableCell>
                      
                      {Array.from(selectedMonths).sort().map(month => {
                        const monthData = monthlyExposures.find(m => m.month === month);
                        
                        const pricingTotal = monthData ? calculateProductGroupTotal(
                          monthData.products,
                          productGroups.pricingProducts,
                          'netExposure'
                        ) : 0;
                        
                        return (
                          <TableCell key={month} className="font-bold text-right">
                            {pricingTotal.toLocaleString()}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  </>
                )}
                
                {/* Biodiesel products section */}
                {productGroups.bioProducts.length > 0 && (
                  <>
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={selectedMonths.size + 1} className="font-semibold bg-green-100 text-black">
                        Biodiesel Products
                      </TableCell>
                    </TableRow>
                    
                    {productGroups.bioProducts.map(product => (
                      <React.Fragment key={product}>
                        <TableRow>
                          <TableCell className="font-medium">
                            {formatExposureTableProduct(product)}
                          </TableCell>
                          
                          {Array.from(selectedMonths).sort().map(month => {
                            const monthData = monthlyExposures.find(m => m.month === month);
                            const productData = monthData?.products[product];
                            
                            const netExposure = productData?.netExposure || 0;
                            
                            return (
                              <TableCell key={month} className="text-right">
                                {showDetails ? (
                                  <div className="flex flex-col">
                                    {selectedCategories.has('Physical') && (
                                      <span className={productData?.physical ? 'font-semibold' : 'text-gray-400'}>
                                        P: {productData?.physical?.toLocaleString() || 0}
                                      </span>
                                    )}
                                    {selectedCategories.has('Pricing') && (
                                      <span className={productData?.pricing ? 'font-semibold' : 'text-gray-400'}>
                                        $: {productData?.pricing?.toLocaleString() || 0}
                                      </span>
                                    )}
                                    {selectedCategories.has('Paper') && (
                                      <span className={productData?.paper ? 'font-semibold' : 'text-gray-400'}>
                                        T: {productData?.paper?.toLocaleString() || 0}
                                      </span>
                                    )}
                                    {selectedCategories.has('Exposure') && (
                                      <span className="font-bold border-t mt-1 pt-1">
                                        E: {netExposure?.toLocaleString() || 0}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="font-medium">
                                    {netExposure?.toLocaleString() || 0}
                                  </span>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      </React.Fragment>
                    ))}
                    
                    {/* Biodiesel product totals */}
                    <TableRow className="bg-green-600 text-white">
                      <TableCell className="font-bold">
                        Biodiesel Products Total
                      </TableCell>
                      
                      {Array.from(selectedMonths).sort().map(month => {
                        const monthData = monthlyExposures.find(m => m.month === month);
                        
                        const bioTotal = monthData ? calculateProductGroupTotal(
                          monthData.products,
                          productGroups.bioProducts,
                          'netExposure'
                        ) : 0;
                        
                        return (
                          <TableCell key={month} className="font-bold text-right">
                            {bioTotal.toLocaleString()}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  </>
                )}
                
                {/* Grand Total Row */}
                <TableRow className="bg-gray-500 text-white">
                  <TableCell className="font-bold">
                    Grand Total
                  </TableCell>
                  
                  {Array.from(selectedMonths).sort().map(month => {
                    const monthData = monthlyExposures.find(m => m.month === month);
                    const totalExposure = monthData?.totals.netExposure || 0;
                    
                    return (
                      <TableCell key={month} className="font-bold text-right">
                        {totalExposure.toLocaleString()}
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ExposurePage;
