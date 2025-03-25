
import React, { useMemo, useState } from 'react';
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
  formatExposureTableProduct 
} from '@/utils/productMapping';

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

const CATEGORY_ORDER = ['Physical', 'Pricing', 'Paper', 'Exposure'];

const PHYSICAL_CATEGORY_EXCLUSIONS = ['ICE GASOIL FUTURES'];

// Product groupings for calculated columns
const BIODIESEL_PRODUCTS = ['FAME0', 'HVO', 'RME', 'UCOME'];
const PRICING_INSTRUMENT_PRODUCTS = ['ICE GASOIL FUTURES', 'LSGO', 'DIESEL'];

// Helper function to calculate the total of a product group for a specific month and category
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
  const [periods] = React.useState<string[]>(getNextMonths(13));
  const [visibleCategories, setVisibleCategories] = useState<string[]>(CATEGORY_ORDER);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const { data: tradeData, isLoading, error, refetch } = useQuery({
    queryKey: ['exposure-data'],
    queryFn: async () => {
      const { data: physicalTradeLegs, error: physicalError } = await supabase
        .from('trade_legs')
        .select(`
          id,
          leg_reference,
          buy_sell,
          product,
          quantity,
          pricing_formula,
          mtm_formula,
          trading_period,
          pricing_period_start
        `)
        .order('trading_period', { ascending: true });
        
      if (physicalError) throw physicalError;
      
      const { data: paperTradeLegs, error: paperError } = await supabase
        .from('paper_trade_legs')
        .select(`
          id,
          leg_reference,
          buy_sell,
          product,
          quantity,
          formula,
          mtm_formula,
          exposures,
          period,
          trading_period,
          instrument
        `)
        .order('period', { ascending: true });
        
      if (paperError) throw paperError;
      
      return {
        physicalTradeLegs: physicalTradeLegs || [],
        paperTradeLegs: paperTradeLegs || []
      };
    }
  });

  const exposureData = useMemo(() => {
    if (!tradeData) return [];

    const { physicalTradeLegs, paperTradeLegs } = tradeData;
    
    const exposuresByMonth: Record<string, Record<string, ExposureData>> = {};
    const allProducts = new Set<string>();
    
    periods.forEach(month => {
      exposuresByMonth[month] = {};
    });
    
    if (physicalTradeLegs && physicalTradeLegs.length > 0) {
      physicalTradeLegs.forEach(leg => {
        let month = leg.trading_period || '';
        
        if (!month && leg.pricing_period_start) {
          const date = new Date(leg.pricing_period_start);
          const monthName = date.toLocaleDateString('en-US', { month: 'short' });
          const year = date.getFullYear().toString().slice(2);
          month = `${monthName}-${year}`;
        }
        
        if (!month || !periods.includes(month)) {
          return;
        }
        
        const canonicalProduct = mapProductToCanonical(leg.product || 'Unknown');
        const quantityMultiplier = leg.buy_sell === 'buy' ? 1 : -1;
        const quantity = (leg.quantity || 0) * quantityMultiplier;
        
        const mtmFormula = validateAndParsePricingFormula(leg.mtm_formula);
        
        if (mtmFormula.tokens.length > 0) {
          if (mtmFormula.exposures && mtmFormula.exposures.physical) {
            Object.entries(mtmFormula.exposures.physical).forEach(([baseProduct, weight]) => {
              const canonicalBaseProduct = mapProductToCanonical(baseProduct);
              allProducts.add(canonicalBaseProduct);
              
              if (!exposuresByMonth[month][canonicalBaseProduct]) {
                exposuresByMonth[month][canonicalBaseProduct] = {
                  physical: 0,
                  pricing: 0,
                  paper: 0,
                  netExposure: 0
                };
              }
              
              const actualExposure = typeof weight === 'number' ? weight * quantityMultiplier : 0;
              exposuresByMonth[month][canonicalBaseProduct].physical += actualExposure;
            });
          } else {
            allProducts.add(canonicalProduct);
            
            if (!exposuresByMonth[month][canonicalProduct]) {
              exposuresByMonth[month][canonicalProduct] = {
                physical: 0,
                pricing: 0,
                paper: 0,
                netExposure: 0
              };
            }
            
            exposuresByMonth[month][canonicalProduct].physical += quantity;
          }
        } else {
          allProducts.add(canonicalProduct);
          
          if (!exposuresByMonth[month][canonicalProduct]) {
            exposuresByMonth[month][canonicalProduct] = {
              physical: 0,
              pricing: 0,
              paper: 0,
              netExposure: 0
            };
          }
          
          exposuresByMonth[month][canonicalProduct].physical += quantity;
        }
        
        const pricingFormula = validateAndParsePricingFormula(leg.pricing_formula);
        if (pricingFormula.exposures && pricingFormula.exposures.pricing) {
          Object.entries(pricingFormula.exposures.pricing).forEach(([instrument, value]) => {
            const canonicalInstrument = mapProductToCanonical(instrument);
            allProducts.add(canonicalInstrument);
            
            if (!exposuresByMonth[month][canonicalInstrument]) {
              exposuresByMonth[month][canonicalInstrument] = {
                physical: 0,
                pricing: 0,
                paper: 0,
                netExposure: 0
              };
            }
            
            exposuresByMonth[month][canonicalInstrument].pricing += Number(value) || 0;
          });
        }
      });
    }
    
    if (paperTradeLegs && paperTradeLegs.length > 0) {
      paperTradeLegs.forEach(leg => {
        const month = leg.period || leg.trading_period || '';
        
        if (!month || !periods.includes(month)) {
          return;
        }
        
        if (leg.instrument) {
          const { baseProduct, oppositeProduct, relationshipType } = parsePaperInstrument(leg.instrument);
          
          if (baseProduct) {
            allProducts.add(baseProduct);
            
            if (!exposuresByMonth[month][baseProduct]) {
              exposuresByMonth[month][baseProduct] = {
                physical: 0,
                pricing: 0,
                paper: 0,
                netExposure: 0
              };
            }
            
            const buySellMultiplier = leg.buy_sell === 'buy' ? 1 : -1;
            const quantity = (leg.quantity || 0) * buySellMultiplier;
            
            exposuresByMonth[month][baseProduct].paper += quantity;
            exposuresByMonth[month][baseProduct].pricing += quantity;
            
            if ((relationshipType === 'DIFF' || relationshipType === 'SPREAD') && oppositeProduct) {
              allProducts.add(oppositeProduct);
              
              if (!exposuresByMonth[month][oppositeProduct]) {
                exposuresByMonth[month][oppositeProduct] = {
                  physical: 0,
                  pricing: 0,
                  paper: 0,
                  netExposure: 0
                };
              }
              
              exposuresByMonth[month][oppositeProduct].paper += -quantity;
              exposuresByMonth[month][oppositeProduct].pricing += -quantity;
            }
          }
        } else if (leg.exposures && typeof leg.exposures === 'object') {
          const exposuresData = leg.exposures as Record<string, any>;
          
          if (exposuresData.physical && typeof exposuresData.physical === 'object') {
            Object.entries(exposuresData.physical).forEach(([prodName, value]) => {
              const canonicalProduct = mapProductToCanonical(prodName);
              allProducts.add(canonicalProduct);
              
              if (!exposuresByMonth[month][canonicalProduct]) {
                exposuresByMonth[month][canonicalProduct] = {
                  physical: 0,
                  pricing: 0,
                  netExposure: 0,
                  paper: 0
                };
              }
              
              exposuresByMonth[month][canonicalProduct].paper += Number(value) || 0;
              
              if (!exposuresData.pricing || 
                  typeof exposuresData.pricing !== 'object' || 
                  !exposuresData.pricing[prodName]) {
                exposuresByMonth[month][canonicalProduct].pricing += Number(value) || 0;
              }
            });
          }
          
          if (exposuresData.pricing && typeof exposuresData.pricing === 'object') {
            Object.entries(exposuresData.pricing).forEach(([instrument, value]) => {
              const canonicalInstrument = mapProductToCanonical(instrument);
              allProducts.add(canonicalInstrument);
              
              if (!exposuresByMonth[month][canonicalInstrument]) {
                exposuresByMonth[month][canonicalInstrument] = {
                  physical: 0,
                  pricing: 0,
                  paper: 0,
                  netExposure: 0
                };
              }
              
              exposuresByMonth[month][canonicalInstrument].pricing += Number(value) || 0;
            });
          }
        } else if (leg.mtm_formula && typeof leg.mtm_formula === 'object') {
          const mtmFormula = leg.mtm_formula as Record<string, any>;
          
          if (mtmFormula.exposures && typeof mtmFormula.exposures === 'object') {
            const mtmExposures = mtmFormula.exposures as Record<string, any>;
            
            if (mtmExposures.physical && typeof mtmExposures.physical === 'object') {
              Object.entries(mtmExposures.physical).forEach(([prodName, value]) => {
                const canonicalProduct = mapProductToCanonical(prodName);
                allProducts.add(canonicalProduct);
                
                if (!exposuresByMonth[month][canonicalProduct]) {
                  exposuresByMonth[month][canonicalProduct] = {
                    physical: 0,
                    pricing: 0,
                    paper: 0,
                    netExposure: 0
                  };
                }
                
                const paperExposure = Number(value) || 0;
                exposuresByMonth[month][canonicalProduct].paper += paperExposure;
                
                if (!mtmExposures.pricing || 
                    !(prodName in (mtmExposures.pricing || {}))) {
                  exposuresByMonth[month][canonicalProduct].pricing += paperExposure;
                }
              });
            }
            
            if (mtmExposures.pricing && typeof mtmExposures.pricing === 'object') {
              Object.entries(mtmExposures.pricing).forEach(([prodName, value]) => {
                const canonicalProduct = mapProductToCanonical(prodName);
                allProducts.add(canonicalProduct);
                
                if (!exposuresByMonth[month][canonicalProduct]) {
                  exposuresByMonth[month][canonicalProduct] = {
                    physical: 0,
                    pricing: 0,
                    paper: 0,
                    netExposure: 0
                  };
                }
                
                exposuresByMonth[month][canonicalProduct].pricing += Number(value) || 0;
              });
            }
          }
        } else {
          const canonicalProduct = mapProductToCanonical(leg.product || 'Unknown');
          
          if (leg.mtm_formula && typeof leg.mtm_formula === 'object') {
            const mtmFormula = validateAndParsePricingFormula(leg.mtm_formula);
            
            if (mtmFormula.exposures && mtmFormula.exposures.physical && Object.keys(mtmFormula.exposures.physical).length > 0) {
              const buySellMultiplier = leg.buy_sell === 'buy' ? 1 : -1;
              
              Object.entries(mtmFormula.exposures.physical).forEach(([pBaseProduct, weight]) => {
                const canonicalBaseProduct = mapProductToCanonical(pBaseProduct);
                allProducts.add(canonicalBaseProduct);
                
                if (!exposuresByMonth[month][canonicalBaseProduct]) {
                  exposuresByMonth[month][canonicalBaseProduct] = {
                    physical: 0,
                    pricing: 0,
                    paper: 0,
                    netExposure: 0
                  };
                }
                
                const actualExposure = typeof weight === 'number' ? weight * buySellMultiplier : 0;
                exposuresByMonth[month][canonicalBaseProduct].paper += actualExposure;
                
                if (!mtmFormula.exposures.pricing || 
                    !(pBaseProduct in (mtmFormula.exposures.pricing || {}))) {
                  exposuresByMonth[month][canonicalBaseProduct].pricing += actualExposure;
                }
              });
              
              if (mtmFormula.exposures.pricing) {
                Object.entries(mtmFormula.exposures.pricing).forEach(([pBaseProduct, weight]) => {
                  const canonicalBaseProduct = mapProductToCanonical(pBaseProduct);
                  allProducts.add(canonicalBaseProduct);
                  
                  if (!exposuresByMonth[month][canonicalBaseProduct]) {
                    exposuresByMonth[month][canonicalBaseProduct] = {
                      physical: 0,
                      pricing: 0,
                      paper: 0,
                      netExposure: 0
                    };
                  }
                  
                  const actualExposure = typeof weight === 'number' ? weight * buySellMultiplier : 0;
                  exposuresByMonth[month][canonicalBaseProduct].pricing += actualExposure;
                });
              }
            } else {
              allProducts.add(canonicalProduct);
              
              if (!exposuresByMonth[month][canonicalProduct]) {
                exposuresByMonth[month][canonicalProduct] = {
                  physical: 0,
                  pricing: 0,
                  paper: 0,
                  netExposure: 0
                };
              }
              
              const buySellMultiplier = leg.buy_sell === 'buy' ? 1 : -1;
              const paperExposure = (leg.quantity || 0) * buySellMultiplier;
              exposuresByMonth[month][canonicalProduct].paper += paperExposure;
              exposuresByMonth[month][canonicalProduct].pricing += paperExposure;
            }
          } else {
            allProducts.add(canonicalProduct);
            
            if (!exposuresByMonth[month][canonicalProduct]) {
              exposuresByMonth[month][canonicalProduct] = {
                physical: 0,
                pricing: 0,
                paper: 0,
                netExposure: 0
              };
            }
            
            const buySellMultiplier = leg.buy_sell === 'buy' ? 1 : -1;
            const paperExposure = (leg.quantity || 0) * buySellMultiplier;
            exposuresByMonth[month][canonicalProduct].paper += paperExposure;
            exposuresByMonth[month][canonicalProduct].pricing += paperExposure;
          }
        }
      });
    }
    
    const monthlyExposures: MonthlyExposure[] = periods.map(month => {
      const monthData = exposuresByMonth[month];
      const productsData: Record<string, ExposureData> = {};
      const totals: ExposureData = { physical: 0, pricing: 0, paper: 0, netExposure: 0 };
      
      Array.from(allProducts).forEach(product => {
        const productExposure = monthData[product] || { physical: 0, pricing: 0, paper: 0, netExposure: 0 };
        
        productExposure.netExposure = productExposure.physical + productExposure.pricing + productExposure.paper;
        
        productsData[product] = productExposure;
        
        totals.physical += productExposure.physical;
        totals.pricing += productExposure.pricing;
        totals.paper += productExposure.paper;
        totals.netExposure += productExposure.netExposure;
      });
      
      return {
        month,
        products: productsData,
        totals
      };
    });
    
    return monthlyExposures;
  }, [tradeData, periods]);

  const allProducts = useMemo(() => {
    const productSet = new Set<string>();
    
    exposureData.forEach(monthData => {
      Object.keys(monthData.products).forEach(product => {
        productSet.add(product);
      });
    });
    
    return Array.from(productSet).sort();
  }, [exposureData]);

  React.useEffect(() => {
    if (allProducts.length > 0 && selectedProducts.length === 0) {
      setSelectedProducts([...allProducts]);
    }
  }, [allProducts, selectedProducts.length]);

  const grandTotals = useMemo(() => {
    const totals: ExposureData = { physical: 0, pricing: 0, paper: 0, netExposure: 0 };
    const productTotals: Record<string, ExposureData> = {};
    
    allProducts.forEach(product => {
      productTotals[product] = { physical: 0, pricing: 0, paper: 0, netExposure: 0 };
    });
    
    exposureData.forEach(monthData => {
      totals.physical += monthData.totals.physical;
      totals.pricing += monthData.totals.pricing;
      totals.paper += monthData.totals.paper;
      totals.netExposure += monthData.totals.netExposure;
      
      Object.entries(monthData.products).forEach(([product, exposure]) => {
        productTotals[product].physical += exposure.physical;
        productTotals[product].pricing += exposure.pricing;
        productTotals[product].paper += exposure.paper;
        productTotals[product].netExposure += exposure.netExposure;
      });
    });
    
    return { totals, productTotals };
  }, [exposureData, allProducts]);

  // Calculate grand totals for product groups
  const groupGrandTotals = useMemo(() => {
    const biodieselTotal = BIODIESEL_PRODUCTS.reduce((total, product) => {
      if (grandTotals.productTotals[product]) {
        return total + grandTotals.productTotals[product].netExposure;
      }
      return total;
    }, 0);
    
    const pricingInstrumentTotal = PRICING_INSTRUMENT_PRODUCTS.reduce((total, product) => {
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
  }, [grandTotals]);

  const getValueColorClass = (value: number): string => {
    return value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-muted-foreground';
  };

  const formatValue = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toLocaleString()}`;
  };

  const exposureCategories = CATEGORY_ORDER;

  const getCategoryColorClass = (category: string): string => {
    switch (category) {
      case 'Physical':
        return 'bg-orange-800';
      case 'Pricing':
        return 'bg-green-800';
      case 'Paper':
        return 'bg-blue-800';
      case 'Exposure':
        return 'bg-green-600';
      default:
        return '';
    }
  };

  const toggleCategory = (category: string) => {
    setVisibleCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(cat => cat !== category);
      } else {
        const newCategories = [...prev, category];
        return [...CATEGORY_ORDER].filter(cat => newCategories.includes(cat));
      }
    });
  };

  const toggleProduct = (product: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(product)) {
        return prev.filter(p => p !== product);
      } else {
        return [...prev, product];
      }
    });
  };

  const toggleAllProducts = () => {
    if (selectedProducts.length === allProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts([...allProducts]);
    }
  };

  const filteredProducts = useMemo(() => {
    return allProducts.filter(product => selectedProducts.includes(product));
  }, [allProducts, selectedProducts]);

  const orderedVisibleCategories = useMemo(() => {
    return CATEGORY_ORDER.filter(category => visibleCategories.includes(category));
  }, [visibleCategories]);

  const shouldShowProductInCategory = (product: string, category: string): boolean => {
    if (category === 'Physical' && PHYSICAL_CATEGORY_EXCLUSIONS.includes(product)) {
      return false;
    }
    return true;
  };

  // Determine if we need to render the calculated totals columns (only if the relevant base products are selected)
  const shouldShowBiodieselTotal = useMemo(() => {
    return BIODIESEL_PRODUCTS.some(product => selectedProducts.includes(product));
  }, [selectedProducts]);

  const shouldShowPricingInstrumentTotal = useMemo(() => {
    return PRICING_INSTRUMENT_PRODUCTS.some(product => selectedProducts.includes(product));
  }, [selectedProducts]);

  const shouldShowTotalRow = useMemo(() => {
    return shouldShowBiodieselTotal || shouldShowPricingInstrumentTotal;
  }, [shouldShowBiodieselTotal, shouldShowPricingInstrumentTotal]);

  return (
    <Layout>
      <Helmet>
        <title>Exposure Reporting</title>
      </Helmet>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Exposure Reporting</h1>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <Download className="mr-2 h-3 w-3" /> Export
            </Button>
          </div>
        </div>

        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Category Filters</label>
                <div className="flex flex-wrap gap-2">
                  {exposureCategories.map(category => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`category-${category}`} 
                        checked={visibleCategories.includes(category)} 
                        onCheckedChange={() => toggleCategory(category)}
                      />
                      <label 
                        htmlFor={`category-${category}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {category}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Product Filters</label>
                <div className="flex items-center space-x-2 mb-2">
                  <Checkbox 
                    id="select-all-products" 
                    checked={selectedProducts.length === allProducts.length && allProducts.length > 0} 
                    onCheckedChange={toggleAllProducts}
                  />
                  <label 
                    htmlFor="select-all-products"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Select All
                  </label>
                </div>
                <div className="max-h-[180px] overflow-y-auto pr-2 flex flex-wrap gap-2">
                  {allProducts.map(product => (
                    <div key={product} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`product-${product}`} 
                        checked={selectedProducts.includes(product)} 
                        onCheckedChange={() => toggleProduct(product)}
                      />
                      <label 
                        htmlFor={`product-${product}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {formatExposureTableProduct(product)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <Card>
            <CardContent className="pt-4">
              <TableLoadingState />
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="pt-4">
              <TableErrorState error={error as Error} onRetry={refetch} />
            </CardContent>
          </Card>
        ) : exposureData.length === 0 || filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="pt-4">
              <div className="flex justify-center items-center h-40">
                <p className="text-muted-foreground">No exposure data found.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <CardContent className="p-0 overflow-auto">
              <div className="w-full overflow-auto">
                <div style={{ width: "max-content", minWidth: "100%" }}>
                  <Table className="border-collapse">
                    <TableHeader>
                      <TableRow className="bg-muted/50 border-b-[1px] border-black">
                        <TableHead 
                          rowSpan={2} 
                          className="border-r-[1px] border-b-[1px] border-black text-left p-1 font-bold text-black text-xs bg-white sticky left-0 z-10"
                        >
                          Month
                        </TableHead>
                        {orderedVisibleCategories.map((category, catIndex) => {
                          const categoryProducts = filteredProducts.filter(product => 
                            shouldShowProductInCategory(product, category)
                          );
                          
                          // Add additional calculated columns for the Exposure category
                          let colSpan = categoryProducts.length;
                          if (category === 'Exposure') {
                            if (shouldShowBiodieselTotal) colSpan += 1;
                            if (shouldShowPricingInstrumentTotal) colSpan += 1;
                            if (shouldShowTotalRow) colSpan += 1;
                          }
                          
                          return (
                            <TableHead 
                              key={category} 
                              colSpan={colSpan} 
                              className={`text-center p-1 font-bold text-black text-xs border-b-[1px] ${
                                catIndex < orderedVisibleCategories.length - 1 ? 'border-r-[1px]' : ''
                              } border-black`}
                            >
                              {category}
                            </TableHead>
                          );
                        })}
                      </TableRow>
                      
                      <TableRow className="bg-muted/30 border-b-[1px] border-black">
                        {orderedVisibleCategories.flatMap((category, catIndex) => {
                          const categoryProducts = filteredProducts.filter(product => 
                            shouldShowProductInCategory(product, category)
                          );
                          
                          const headers = categoryProducts.map((product, index) => (
                            <TableHead 
                              key={`${category}-${product}`} 
                              className={`text-right p-1 text-xs whitespace-nowrap border-t-0 ${
                                getCategoryColorClass(category)
                              } ${
                                index === categoryProducts.length - 1 && 
                                catIndex < orderedVisibleCategories.length - 1 && 
                                !(category === 'Exposure' && (shouldShowBiodieselTotal || shouldShowPricingInstrumentTotal || shouldShowTotalRow))
                                  ? 'border-r-[1px] border-black' : ''
                              } ${
                                index > 0 ? 'border-l-[0px]' : ''
                              } text-white font-bold`}
                            >
                              {formatExposureTableProduct(product)}
                            </TableHead>
                          ));
                          
                          // Add calculated column headers for the Exposure category
                          if (category === 'Exposure') {
                            const additionalHeaders = [];
                            
                            if (shouldShowBiodieselTotal) {
                              additionalHeaders.push(
                                <TableHead 
                                  key={`${category}-biodiesel-total`} 
                                  className={`text-right p-1 text-xs whitespace-nowrap border-t-0 ${
                                    getCategoryColorClass(category)
                                  } text-white font-bold`}
                                >
                                  Total Biodiesel
                                </TableHead>
                              );
                            }
                            
                            if (shouldShowPricingInstrumentTotal) {
                              additionalHeaders.push(
                                <TableHead 
                                  key={`${category}-pricing-instrument-total`} 
                                  className={`text-right p-1 text-xs whitespace-nowrap border-t-0 ${
                                    getCategoryColorClass(category)
                                  } text-white font-bold`}
                                >
                                  Total Pricing Instrument
                                </TableHead>
                              );
                            }
                            
                            if (shouldShowTotalRow) {
                              additionalHeaders.push(
                                <TableHead 
                                  key={`${category}-total-row`} 
                                  className={`text-right p-1 text-xs whitespace-nowrap border-t-0 ${
                                    getCategoryColorClass(category)
                                  } ${
                                    catIndex < orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : ''
                                  } text-white font-bold`}
                                >
                                  Total Row
                                </TableHead>
                              );
                            }
                            
                            return [...headers, ...additionalHeaders];
                          }
                          
                          return headers;
                        })}
                      </TableRow>
                    </TableHeader>
                    
                    <TableBody>
                      {exposureData.map((monthData) => (
                        <TableRow key={monthData.month} className="bg-white hover:bg-gray-50">
                          <TableCell className="font-medium border-r-[1px] border-black text-xs sticky left-0 bg-white z-10">
                            {monthData.month}
                          </TableCell>
                          
                          {orderedVisibleCategories.map((category, catIndex) => {
                            const categoryProducts = filteredProducts.filter(product => 
                              shouldShowProductInCategory(product, category)
                            );
                            
                            const cells = [];
                            
                            if (category === 'Physical') {
                              categoryProducts.forEach((product, index) => {
                                const productData = monthData.products[product] || { physical: 0, pricing: 0, paper: 0, netExposure: 0 };
                                cells.push(
                                  <TableCell 
                                    key={`${monthData.month}-physical-${product}`} 
                                    className={`text-right text-xs p-1 ${getValueColorClass(productData.physical)} ${
                                      index === categoryProducts.length - 1 && catIndex < orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : ''
                                    }`}
                                  >
                                    {formatValue(productData.physical)}
                                  </TableCell>
                                );
                              });
                            } else if (category === 'Pricing') {
                              categoryProducts.forEach((product, index) => {
                                const productData = monthData.products[product] || { physical: 0, pricing: 0, paper: 0, netExposure: 0 };
                                cells.push(
                                  <TableCell 
                                    key={`${monthData.month}-pricing-${product}`} 
                                    className={`text-right text-xs p-1 ${getValueColorClass(productData.pricing)} ${
                                      index === categoryProducts.length - 1 && catIndex < orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : ''
                                    }`}
                                  >
                                    {formatValue(productData.pricing)}
                                  </TableCell>
                                );
                              });
                            } else if (category === 'Paper') {
                              categoryProducts.forEach((product, index) => {
                                const productData = monthData.products[product] || { physical: 0, pricing: 0, paper: 0, netExposure: 0 };
                                cells.push(
                                  <TableCell 
                                    key={`${monthData.month}-paper-${product}`} 
                                    className={`text-right text-xs p-1 ${getValueColorClass(productData.paper)} ${
                                      index === categoryProducts.length - 1 && catIndex < orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : ''
                                    }`}
                                  >
                                    {formatValue(productData.paper)}
                                  </TableCell>
                                );
                              });
                            } else if (category === 'Exposure') {
                              // Regular product cells
                              categoryProducts.forEach((product, index) => {
                                const productData = monthData.products[product] || { physical: 0, pricing: 0, paper: 0, netExposure: 0 };
                                cells.push(
                                  <TableCell 
                                    key={`${monthData.month}-net-${product}`} 
                                    className={`text-right text-xs p-1 font-medium ${getValueColorClass(productData.netExposure)} ${
                                      index === categoryProducts.length - 1 && 
                                      catIndex < orderedVisibleCategories.length - 1 && 
                                      !shouldShowBiodieselTotal && !shouldShowPricingInstrumentTotal && !shouldShowTotalRow
                                        ? 'border-r-[1px] border-black' : ''
                                    }`}
                                  >
                                    {formatValue(productData.netExposure)}
                                  </TableCell>
                                );
                              });
                              
                              // Total Biodiesel cell
                              if (shouldShowBiodieselTotal) {
                                const biodieselTotal = calculateProductGroupTotal(
                                  monthData.products,
                                  BIODIESEL_PRODUCTS
                                );
                                
                                cells.push(
                                  <TableCell 
                                    key={`${monthData.month}-biodiesel-total`} 
                                    className={`text-right text-xs p-1 font-medium ${getValueColorClass(biodieselTotal)} bg-green-50`}
                                  >
                                    {formatValue(biodieselTotal)}
                                  </TableCell>
                                );
                              }
                              
                              // Total Pricing Instrument cell
                              if (shouldShowPricingInstrumentTotal) {
                                const pricingInstrumentTotal = calculateProductGroupTotal(
                                  monthData.products,
                                  PRICING_INSTRUMENT_PRODUCTS
                                );
                                
                                cells.push(
                                  <TableCell 
                                    key={`${monthData.month}-pricing-instrument-total`} 
                                    className={`text-right text-xs p-1 font-medium ${getValueColorClass(pricingInstrumentTotal)} bg-blue-50`}
                                  >
                                    {formatValue(pricingInstrumentTotal)}
                                  </TableCell>
                                );
                              }
                              
                              // Total Row cell
                              if (shouldShowTotalRow) {
                                const biodieselTotal = calculateProductGroupTotal(
                                  monthData.products,
                                  BIODIESEL_PRODUCTS
                                );
                                
                                const pricingInstrumentTotal = calculateProductGroupTotal(
                                  monthData.products,
                                  PRICING_INSTRUMENT_PRODUCTS
                                );
                                
                                const totalRow = biodieselTotal + pricingInstrumentTotal;
                                
                                cells.push(
                                  <TableCell 
                                    key={`${monthData.month}-total-row`} 
                                    className={`text-right text-xs p-1 font-medium ${getValueColorClass(totalRow)} bg-gray-100 ${
                                      catIndex < orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : ''
                                    }`}
                                  >
                                    {formatValue(totalRow)}
                                  </TableCell>
                                );
                              }
                            }
                            
                            return cells;
                          })}
                        </TableRow>
                      ))}
                      
                      <TableRow className="bg-gray-700 text-white font-bold border-t-[1px] border-black">
                        <TableCell className="border-r-[1px] border-black text-xs p-1 sticky left-0 bg-gray-700 z-10 text-white">
                          Total
                        </TableCell>
                        
                        {orderedVisibleCategories.map((category, catIndex) => {
                          const categoryProducts = filteredProducts.filter(product => 
                            shouldShowProductInCategory(product, category)
                          );
                          
                          const cells = [];
                          
                          if (category === 'Physical') {
                            categoryProducts.forEach((product, index) => {
                              cells.push(
                                <TableCell 
                                  key={`total-physical-${product}`} 
                                  className={`text-right text-xs p-1 ${
                                    grandTotals.productTotals[product]?.physical > 0 ? 'text-green-300' : 
                                    grandTotals.productTotals[product]?.physical < 0 ? 'text-red-300' : 'text-gray-300'
                                  } font-bold ${
                                    index === categoryProducts.length - 1 && catIndex < orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : ''
                                  }`}
                                >
                                  {formatValue(grandTotals.productTotals[product]?.physical || 0)}
                                </TableCell>
                              );
                            });
                          } else if (category === 'Pricing') {
                            categoryProducts.forEach((product, index) => {
                              cells.push(
                                <TableCell 
                                  key={`total-pricing-${product}`} 
                                  className={`text-right text-xs p-1 ${
                                    grandTotals.productTotals[product]?.pricing > 0 ? 'text-green-300' : 
                                    grandTotals.productTotals[product]?.pricing < 0 ? 'text-red-300' : 'text-gray-300'
                                  } font-bold ${
                                    index === categoryProducts.length - 1 && catIndex < orderedVisibleCategories.length -
                                    1 ? 'border-r-[1px] border-black' : ''
                                  }`}
                                >
                                  {formatValue(grandTotals.productTotals[product]?.pricing || 0)}
                                </TableCell>
                              );
                            });
                          } else if (category === 'Paper') {
                            categoryProducts.forEach((product, index) => {
                              cells.push(
                                <TableCell 
                                  key={`total-paper-${product}`} 
                                  className={`text-right text-xs p-1 ${
                                    grandTotals.productTotals[product]?.paper > 0 ? 'text-green-300' : 
                                    grandTotals.productTotals[product]?.paper < 0 ? 'text-red-300' : 'text-gray-300'
                                  } font-bold ${
                                    index === categoryProducts.length - 1 && catIndex < orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : ''
                                  }`}
                                >
                                  {formatValue(grandTotals.productTotals[product]?.paper || 0)}
                                </TableCell>
                              );
                            });
                          } else if (category === 'Exposure') {
                            // Regular product cells
                            categoryProducts.forEach((product, index) => {
                              cells.push(
                                <TableCell 
                                  key={`total-net-${product}`} 
                                  className={`text-right text-xs p-1 ${
                                    grandTotals.productTotals[product]?.netExposure > 0 ? 'text-green-300' : 
                                    grandTotals.productTotals[product]?.netExposure < 0 ? 'text-red-300' : 'text-gray-300'
                                  } font-bold ${
                                    index === categoryProducts.length - 1 && 
                                    catIndex < orderedVisibleCategories.length - 1 && 
                                    !shouldShowBiodieselTotal && !shouldShowPricingInstrumentTotal && !shouldShowTotalRow
                                      ? 'border-r-[1px] border-black' : ''
                                  }`}
                                >
                                  {formatValue(grandTotals.productTotals[product]?.netExposure || 0)}
                                </TableCell>
                              );
                            });
                            
                            // Total Biodiesel cell
                            if (shouldShowBiodieselTotal) {
                              cells.push(
                                <TableCell 
                                  key={`total-biodiesel-total`} 
                                  className={`text-right text-xs p-1 ${
                                    groupGrandTotals.biodieselTotal > 0 ? 'text-green-300' : 
                                    groupGrandTotals.biodieselTotal < 0 ? 'text-red-300' : 'text-gray-300'
                                  } font-bold bg-green-900`}
                                >
                                  {formatValue(groupGrandTotals.biodieselTotal)}
                                </TableCell>
                              );
                            }
                            
                            // Total Pricing Instrument cell
                            if (shouldShowPricingInstrumentTotal) {
                              cells.push(
                                <TableCell 
                                  key={`total-pricing-instrument-total`} 
                                  className={`text-right text-xs p-1 ${
                                    groupGrandTotals.pricingInstrumentTotal > 0 ? 'text-green-300' : 
                                    groupGrandTotals.pricingInstrumentTotal < 0 ? 'text-red-300' : 'text-gray-300'
                                  } font-bold bg-blue-900`}
                                >
                                  {formatValue(groupGrandTotals.pricingInstrumentTotal)}
                                </TableCell>
                              );
                            }
                            
                            // Total Row cell
                            if (shouldShowTotalRow) {
                              cells.push(
                                <TableCell 
                                  key={`total-total-row`} 
                                  className={`text-right text-xs p-1 ${
                                    groupGrandTotals.totalRow > 0 ? 'text-green-300' : 
                                    groupGrandTotals.totalRow < 0 ? 'text-red-300' : 'text-gray-300'
                                  } font-bold bg-gray-800 ${
                                    catIndex < orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : ''
                                  }`}
                                >
                                  {formatValue(groupGrandTotals.totalRow)}
                                </TableCell>
                              );
                            }
                          }
                          
                          return cells;
                        })}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default ExposurePage;
