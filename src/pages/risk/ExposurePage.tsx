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
import { getNextMonths, formatMonthCode } from '@/utils/dateUtils';
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
import { getMonthlyDistribution } from '@/utils/workingDaysUtils';
import DateRangeFilter from '@/components/risk/DateRangeFilter';
import { useFilteredExposures } from '@/hooks/useFilteredExposures';
import { startOfMonth, endOfMonth, format } from 'date-fns';

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
  const [periods] = React.useState<string[]>(getNextMonths(13));
  const [visibleCategories, setVisibleCategories] = useState<string[]>(CATEGORY_ORDER);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  
  const { data: pricingInstruments = [], isLoading: instrumentsLoading } = usePricingInstruments();
  
  const ALLOWED_PRODUCTS = useMemo(() => {
    const instrumentProducts = pricingInstruments.map(
      (inst: PricingInstrument) => mapProductToCanonical(inst.display_name)
    );
    
    const biodieselProducts = ['Argus UCOME', 'Argus FAME0', 'Argus RME', 'Argus HVO'];
    
    return Array.from(new Set([...instrumentProducts, ...biodieselProducts]));
  }, [pricingInstruments]);
  
  const BIODIESEL_PRODUCTS = useMemo(() => {
    return ALLOWED_PRODUCTS.filter(p => p.includes('Argus'));
  }, [ALLOWED_PRODUCTS]);
  
  const PRICING_INSTRUMENT_PRODUCTS = useMemo(() => {
    return ALLOWED_PRODUCTS.filter(p => !p.includes('Argus'));
  }, [ALLOWED_PRODUCTS]);

  // Initialize the filtered exposures hook with current month
  const {
    filteredExposures,
    isLoading: filteredExposuresLoading,
    error: filteredExposuresError,
    updateDateRange,
    resetDateFilter,
    startDate,
    endDate,
    isFilterActive,
    refetchTrades
  } = useFilteredExposures({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date())
  });

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
          pricing_period_start,
          pricing_period_end
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

  // Use either filtered or regular exposure data based on date filter
  const exposureData = useMemo(() => {
    // Start with a base exposure data structure for all months
    const monthlyExposures: MonthlyExposure[] = periods.map(month => {
      const productsData: Record<string, ExposureData> = {};
      const totals: ExposureData = { physical: 0, pricing: 0, paper: 0, netExposure: 0 };
      
      // Initialize all products with zero values
      ALLOWED_PRODUCTS.forEach(product => {
        productsData[product] = {
          physical: 0,
          pricing: 0,
          paper: 0,
          netExposure: 0
        };
      });
      
      return {
        month,
        products: productsData,
        totals
      };
    });
    
    // If no data is available, return the zeroed structure
    if (isLoading || instrumentsLoading || 
        (isFilterActive && filteredExposuresLoading) ||
        (!tradeData && !filteredExposures)) {
      return monthlyExposures;
    }
    
    // If filter is active, use filtered exposures
    if (isFilterActive) {
      console.log('Using filtered exposures for table data');
      
      // First, create a map of month codes to their index in the periods array
      const monthIndexMap = Object.fromEntries(periods.map((month, index) => [month, index]));
      
      // Process physical exposures
      Object.entries(filteredExposures.physical).forEach(([product, exposure]) => {
        // Check if the product is in our allowed list
        if (ALLOWED_PRODUCTS.includes(product)) {
          // For filtered data, we'll add the exposure to the corresponding month
          // We need to determine which month(s) the filtered period covers
          const filteredPeriodMonth = format(startDate, 'MMM-yy');
          
          // If the month exists in our periods, add the exposure to that month
          if (filteredPeriodMonth in monthIndexMap) {
            const monthIndex = monthIndexMap[filteredPeriodMonth];
            const monthData = monthlyExposures[monthIndex];
            
            // Add physical exposure
            if (monthData.products[product]) {
              monthData.products[product].physical = exposure;
              monthData.totals.physical += exposure;
            }
          }
        }
      });
      
      // Process pricing exposures
      Object.entries(filteredExposures.pricing).forEach(([product, exposure]) => {
        // Check if the product is in our allowed list
        if (ALLOWED_PRODUCTS.includes(product)) {
          // For filtered data, we'll add the exposure to the corresponding month
          const filteredPeriodMonth = format(startDate, 'MMM-yy');
          
          // If the month exists in our periods, add the exposure to that month
          if (filteredPeriodMonth in monthIndexMap) {
            const monthIndex = monthIndexMap[filteredPeriodMonth];
            const monthData = monthlyExposures[monthIndex];
            
            // Add pricing exposure
            if (monthData.products[product]) {
              monthData.products[product].pricing = exposure;
              monthData.totals.pricing += exposure;
            }
          }
        }
      });
      
      // Calculate net exposures for all products
      monthlyExposures.forEach(monthData => {
        Object.entries(monthData.products).forEach(([product, exposure]) => {
          exposure.netExposure = calculateNetExposure(exposure.physical, exposure.pricing);
        });
        
        // Update month total net exposure
        monthData.totals.netExposure = calculateNetExposure(monthData.totals.physical, monthData.totals.pricing);
      });
      
      return monthlyExposures;
    } else {
      // Use regular unfiltered exposures from tradeData
      
      const exposuresByMonth: Record<string, Record<string, ExposureData>> = {};
      const allProductsFound = new Set<string>();
      
      periods.forEach(month => {
        exposuresByMonth[month] = {};
        
        ALLOWED_PRODUCTS.forEach(product => {
          exposuresByMonth[month][product] = {
            physical: 0,
            pricing: 0,
            paper: 0,
            netExposure: 0
          };
        });
      });
      
      if (tradeData) {
        
        const { physicalTradeLegs, paperTradeLegs } = tradeData;
        
        if (physicalTradeLegs && physicalTradeLegs.length > 0) {
          physicalTradeLegs.forEach(leg => {
            const hasPricingPeriod = leg.pricing_period_start && leg.pricing_period_end;
            
            let primaryMonth = leg.trading_period || '';
            
            if (!primaryMonth && leg.pricing_period_start) {
              const date = new Date(leg.pricing_period_start);
              primaryMonth = formatMonthCode(date);
            }
            
            if (!primaryMonth && !hasPricingPeriod) {
              return;
            }
            
            const canonicalProduct = mapProductToCanonical(leg.product || 'Unknown');
            const quantityMultiplier = leg.buy_sell === 'buy' ? 1 : -1;
            const quantity = (leg.quantity || 0) * quantityMultiplier;
            
            allProductsFound.add(canonicalProduct);
            
            periods.forEach(month => {
              if (!exposuresByMonth[month][canonicalProduct]) {
                exposuresByMonth[month][canonicalProduct] = {
                  physical: 0,
                  pricing: 0,
                  paper: 0,
                  netExposure: 0
                };
              }
            });
            
            const mtmFormula = validateAndParsePricingFormula(leg.mtm_formula);
            const pricingFormula = validateAndParsePricingFormula(leg.pricing_formula);
            
            const mtmMonthlyDistribution = getMonthlyDistribution(mtmFormula.exposures, 'physical');
            const pricingMonthlyDistribution = getMonthlyDistribution(pricingFormula.exposures, 'pricing');
            
            const hasMonthlyDistribution = Object.keys(mtmMonthlyDistribution).length > 0 || 
                                           Object.keys(pricingMonthlyDistribution).length > 0;
            
            if (hasMonthlyDistribution) {
              Object.entries(mtmMonthlyDistribution).forEach(([product, monthDistribution]) => {
                const canonicalBaseProduct = mapProductToCanonical(product);
                allProductsFound.add(canonicalBaseProduct);
                
                Object.entries(monthDistribution).forEach(([month, exposure]) => {
                  if (periods.includes(month) && 
                      exposuresByMonth[month] && 
                      exposuresByMonth[month][canonicalBaseProduct]) {
                    exposuresByMonth[month][canonicalBaseProduct].physical += Number(exposure) || 0;
                  }
                });
              });
              
              Object.entries(pricingMonthlyDistribution).forEach(([product, monthDistribution]) => {
                const canonicalBaseProduct = mapProductToCanonical(product);
                allProductsFound.add(canonicalBaseProduct);
                
                Object.entries(monthDistribution).forEach(([month, exposure]) => {
                  if (periods.includes(month) && 
                      exposuresByMonth[month] && 
                      exposuresByMonth[month][canonicalBaseProduct]) {
                    exposuresByMonth[month][canonicalBaseProduct].pricing += Number(exposure) || 0;
                  }
                });
              });
            } 
            else {
              if (mtmFormula.tokens.length > 0) {
                if (mtmFormula.exposures && mtmFormula.exposures.physical) {
                  Object.entries(mtmFormula.exposures.physical).forEach(([baseProduct, weight]) => {
                    const canonicalBaseProduct = mapProductToCanonical(baseProduct);
                    allProductsFound.add(canonicalBaseProduct);
                    
                    if (primaryMonth && exposuresByMonth[primaryMonth][canonicalBaseProduct]) {
                      const actualExposure = typeof weight === 'number' ? weight : 0;
                      exposuresByMonth[primaryMonth][canonicalBaseProduct].physical += actualExposure;
                    }
                  });
                } else if (primaryMonth && exposuresByMonth[primaryMonth][canonicalProduct]) {
                  exposuresByMonth[primaryMonth][canonicalProduct].physical += quantity;
                }
              } else if (primaryMonth && exposuresByMonth[primaryMonth][canonicalProduct]) {
                exposuresByMonth[primaryMonth][canonicalProduct].physical += quantity;
              }
              
              if (pricingFormula.exposures && pricingFormula.exposures.pricing) {
                Object.entries(pricingFormula.exposures.pricing).forEach(([instrument, value]) => {
                  const canonicalInstrument = mapProductToCanonical(instrument);
                  allProductsFound.add(canonicalInstrument);
                  
                  if (primaryMonth && exposuresByMonth[primaryMonth][canonicalInstrument]) {
                    exposuresByMonth[primaryMonth][canonicalInstrument].pricing += Number(value) || 0;
                  }
                });
              }
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
                allProductsFound.add(baseProduct);
                
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
                  allProductsFound.add(oppositeProduct);
                  
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
              } else if (leg.exposures && typeof leg.exposures === 'object') {
                const exposuresData = leg.exposures as Record<string, any>;
                
                if (exposuresData.physical && typeof exposuresData.physical === 'object') {
                  Object.entries(exposuresData.physical).forEach(([prodName, value]) => {
                    const canonicalProduct = mapProductToCanonical(prodName);
                    allProductsFound.add(canonicalProduct);
                    
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
                    allProductsFound.add(canonicalInstrument);
                    
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
                      allProductsFound.add(canonicalProduct);
                      
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
                      allProductsFound.add(canonicalProduct);
                      
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
                      allProductsFound.add(canonicalBaseProduct);
                      
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
                        allProductsFound.add(canonicalBaseProduct);
                        
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
            } else if (leg.exposures && typeof leg.exposures === 'object') {
              const exposuresData = leg.exposures as Record<string, any>;
              
              if (exposuresData.physical && typeof exposuresData.physical === 'object') {
                Object.entries(exposuresData.physical).forEach(([prodName, value]) => {
                  const canonicalProduct = mapProductToCanonical(prodName);
                  allProductsFound.add(canonicalProduct);
                  
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
                  allProductsFound.add(canonicalInstrument);
                  
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
                    allProductsFound.add(canonicalProduct);
                    
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
                    allProductsFound.add(canonicalProduct);
                    
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
                    allProductsFound.add(canonicalBaseProduct);
                    
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
                      allProductsFound.add(canonicalBaseProduct);
                      
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
      }
      
      const monthlyExposures: MonthlyExposure[] = periods.map(month => {
        const monthData = exposuresByMonth[month];
        const productsData: Record<string, ExposureData> = {};
        const totals: ExposureData = { physical: 0, pricing: 0, paper: 0, netExposure: 0 };
        
        Object.entries(monthData).forEach(([product, exposure]) => {
          if (ALLOWED_PRODUCTS.includes(product)) {
            exposure.netExposure = calculateNetExposure(
              exposure.physical,
              exposure.pricing
            );
            
            productsData[product] = exposure;
            
            totals.physical += exposure.physical;
            totals.pricing += exposure.pricing;
            totals.paper += exposure.paper;
          }
        });
        
        totals.netExposure = calculateNetExposure(totals.physical, totals.pricing);
        
        return {
          month,
          products: productsData,
          totals
        };
      });
      
      return monthlyExposures;
    }
  }, [
    isFilterActive, 
    filteredExposures, 
    tradeData, 
    periods, 
    ALLOWED_PRODUCTS,
    startDate, 
    endDate,
    isLoading,
    instrumentsLoading,
    filteredExposuresLoading
  ]);

  const allProducts = useMemo(() => {
    return [...ALLOWED_PRODUCTS].sort();
  }, [ALLOWED_PRODUCTS]);

  useEffect(() => {
    if (allProducts.length > 0) {
      setSelectedProducts([...allProducts]);
    }
  }, [allProducts]);

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
      
      totals.netExposure = calculateNetExposure(totals.physical, totals.pricing);
      
      Object.entries(monthData.products).forEach(([product, exposure]) => {
        if (productTotals[product]) {
          productTotals[product].physical += exposure
