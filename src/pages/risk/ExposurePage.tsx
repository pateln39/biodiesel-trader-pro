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
  const [isDateFilterActive, setIsDateFilterActive] = useState<boolean>(false);
  
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
    startDate,
    endDate,
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
    if (isDateFilterActive) {
      // When date filter is active, convert filtered exposures to the same format
      // as the original exposure data for compatibility with existing table
      const monthlyExposures: MonthlyExposure[] = [];
      
      // If we're filtering, we'll only show one month that represents the filtered period
      const filteredMonth = `${format(startDate, 'MMM')}-${format(startDate, 'yy')} to ${format(endDate, 'MMM')}-${format(endDate, 'yy')}`;
      
      const productsData: Record<string, ExposureData> = {};
      const totals: ExposureData = { physical: 0, pricing: 0, paper: 0, netExposure: 0 };
      
      // Process physical exposures
      Object.entries(filteredExposures.physical).forEach(([product, exposure]) => {
        if (ALLOWED_PRODUCTS.includes(product)) {
          productsData[product] = {
            physical: exposure,
            pricing: filteredExposures.pricing[product] || 0,
            paper: 0, // No paper trades in this implementation
            netExposure: calculateNetExposure(exposure, filteredExposures.pricing[product] || 0)
          };
          
          totals.physical += exposure;
          totals.pricing += filteredExposures.pricing[product] || 0;
        }
      });
      
      // Process pricing instruments that might not have physical exposure
      Object.entries(filteredExposures.pricing).forEach(([product, exposure]) => {
        if (ALLOWED_PRODUCTS.includes(product) && !productsData[product]) {
          productsData[product] = {
            physical: 0,
            pricing: exposure,
            paper: 0,
            netExposure: calculateNetExposure(0, exposure)
          };
          
          totals.pricing += exposure;
        }
      });
      
      totals.netExposure = calculateNetExposure(totals.physical, totals.pricing);
      
      monthlyExposures.push({
        month: filteredMonth,
        products: productsData,
        totals
      });
      
      return monthlyExposures;
    } else {
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
    isDateFilterActive, 
    filteredExposures, 
    tradeData, 
    periods, 
    ALLOWED_PRODUCTS,
    startDate, 
    endDate
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
          productTotals[product].physical += exposure.physical;
          productTotals[product].pricing += exposure.pricing;
          productTotals[product].paper += exposure.paper;
          
          productTotals[product].netExposure = calculateNetExposure(
            productTotals[product].physical,
            productTotals[product].pricing
          );
        }
      });
    });
    
    return { totals, productTotals };
  }, [exposureData, allProducts]);

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
  }, [grandTotals, BIODIESEL_PRODUCTS, PRICING_INSTRUMENT_PRODUCTS]);

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

  const filteredProducts = useMemo(() => {
    return allProducts;
  }, [allProducts]);

  const orderedVisibleCategories = useMemo(() => {
    return CATEGORY_ORDER.filter(category => visibleCategories.includes(category));
  }, [visibleCategories]);

  const shouldShowProductInCategory = (product: string, category: string): boolean => {
    if (category === 'Physical' && product === 'ICE GASOIL FUTURES') {
      return false;
    }
    return true;
  };

  const shouldShowBiodieselTotal = true;
  
  const shouldShowPricingInstrumentTotal = true;
  
  const shouldShowTotalRow = true;

  // Determine if we're in a loading state from either data source
  const isLoadingData = isLoading || instrumentsLoading || 
                      (isDateFilterActive && filteredExposuresLoading);

  // Handle date range filter changes
  const handleDateRangeChange = (startDate: Date, endDate: Date) => {
    updateDateRange(startDate, endDate);
    setIsDateFilterActive(true);
  };

  return (
    <Layout>
      <Helmet>
        <title>Exposure Reporting</title>
      </Helmet>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Exposure Reporting</h1>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => {
              setIsDateFilterActive(false);
              refetch();
            }}>
              Reset Filters
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <Download className="mr-2 h-3 w-3" /> Export
            </Button>
          </div>
        </div>

        {/* Date Range Filter */}
        <DateRangeFilter 
          onFilterChange={handleDateRangeChange}
          isLoading={filteredExposuresLoading} 
        />

        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
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
            </div>
          </CardContent>
        </Card>

        {isLoadingData ? (
          <Card>
            <CardContent className="pt-4">
              <TableLoadingState />
            </CardContent>
          </Card>
        ) : error || filteredExposuresError ? (
          <Card>
            <CardContent className="pt-4">
              <TableErrorState error={(error || filteredExposuresError) as Error} onRetry={refetch} />
            </CardContent>
          </Card>
        ) : exposureData.length === 0 || filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="pt-4">
              <div className="flex justify-center items-center h-40">
                <p className="text-muted-foreground">No exposure data found for the selected date range.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <CardContent className="p-0 overflow-auto">
              {isDateFilterActive && (
                <div className="bg-blue-50 p-2 border-b">
                  <p className="text-sm text-blue-800 font-medium">
                    Showing filtered exposures from {startDate.toLocaleDateString()} to {endDate.toLocaleDateString()}
                  </p>
                </div>
              )}
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
                          
                          let colSpan = categoryProducts.length;
                          
                          if (category === 'Exposure') {
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
                          
                          if (category === 'Exposure') {
                            const ucomeIndex = categoryProducts.findIndex(p => p === 'Argus UCOME');
                            
                            const headers = [];
                            
                            categoryProducts.forEach((product, index) => {
                              headers.push(
                                <TableHead 
                                  key={`${category}-${product}`} 
                                  className={`text-right p-1 text-xs whitespace-nowrap border-t-0 border-r-[1px] border-black ${
                                    getExposureProductBackgroundClass(product)
                                  } text-white font-bold`}
                                >
                                  {formatExposureTableProduct(product)}
                                </TableHead>
                              );
                              
                              if (index === ucomeIndex && shouldShowBiodieselTotal) {
                                headers.push(
                                  <TableHead 
                                    key={`${category}-biodiesel-total`} 
                                    className={`text-right p-1 text-xs whitespace-nowrap border-t-0 border-r-[1px] border-black ${
                                      getCategoryColorClass(category)
                                    } text-white font-bold`}
                                  >
                                    Total Biodiesel
                                  </TableHead>
                                );
                              }
                            });
                            
                            if (shouldShowPricingInstrumentTotal) {
                              headers.push(
                                <TableHead 
                                  key={`${category}-pricing-instrument-total`} 
                                  className={`text-right p-1 text-xs whitespace-nowrap border-t-0 border-r-[1px] border-black ${
                                    getExposureProductBackgroundClass('', false, true)
                                  } text-white font-bold`}
                                >
                                  Total Pricing Instrument
                                </TableHead>
                              );
                            }
                            
                            if (shouldShowTotalRow) {
                              headers.push(
                                <TableHead 
                                  key={`${category}-total-row`} 
                                  className={`text-right p-1 text-xs whitespace-nowrap border-t-0 ${
                                    getExposureProductBackgroundClass('', true)
                                  } ${
                                    catIndex < orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : ''
                                  } text-white font-bold`}
                                >
                                  Total Row
                                </TableHead>
                              );
                            }
                            
                            return headers;
                          } else {
                            return categoryProducts.map((product, index) => (
                              <TableHead 
                                key={`${category}-${product}`} 
                                className={`text-right p-1 text-xs whitespace-nowrap border-t-0 ${
                                  getCategoryColorClass(category)
                                } ${
                                  index === categoryProducts.length - 1 && 
                                  catIndex < orderedVisibleCategories.length - 1
                                    ? 'border-r-[1px] border-black' : ''
                                } ${
                                  index > 0 ? 'border-l-[0px]' : ''
                                } text-white font-bold`}
                              >
                                {formatExposureTableProduct(product)}
                              </TableHead>
                            ));
                          }
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
                              const ucomeIndex = categoryProducts.findIndex(p => p === 'Argus UCOME');
                              
                              categoryProducts.forEach((product, index) => {
                                const productData = monthData.products[product] || { physical: 0, pricing: 0, paper: 0, netExposure: 0 };
                                cells.push(
                                  <TableCell 
                                    key={`${monthData.month}-net-${product}`} 
                                    className={`text-right text-xs p-1 font-medium border-r-[1px] border-black ${getValueColorClass(productData.netExposure)}`}
                                  >
                                    {formatValue(productData.netExposure)}
                                  </TableCell>
                                );
                                
                                if (index === ucomeIndex && shouldShowBiodieselTotal) {
                                  const biodieselTotal = calculateProductGroupTotal(
                                    monthData.products,
                                    BIODIESEL_PRODUCTS
                                  );
                                  
                                  cells.push(
                                    <TableCell 
                                      key={`${monthData.month}-biodiesel-total`} 
                                      className={`text-right text-xs p-1 font-medium border-r-[1px] border-black ${getValueColorClass(biodieselTotal)} bg-green-50`}
                                    >
                                      {formatValue(biodieselTotal)}
                                    </TableCell>
                                  );
                                }
                              });
                              
                              if (shouldShowPricingInstrumentTotal) {
                                const pricingInstrumentTotal = calculateProductGroupTotal(
                                  monthData.products,
                                  PRICING_INSTRUMENT_PRODUCTS
                                );
                                
                                cells.push(
                                  <TableCell 
                                    key={`${monthData.month}-pricing-instrument-total`} 
                                    className={`text-right text-xs p-1 font-medium border-r-[1px] border-black ${getValueColorClass(pricingInstrumentTotal)} bg-blue-50`}
                                  >
                                    {formatValue(pricingInstrumentTotal)}
                                  </TableCell>
                                );
                              }
                              
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
                                    index === categoryProducts.length - 1 && catIndex < orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : ''
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
                            const ucomeIndex = categoryProducts.findIndex(p => p === 'Argus UCOME');
                            
                            categoryProducts.forEach((product, index) => {
                              cells.push(
                                <TableCell 
                                  key={`total-net-${product}`} 
                                  className={`text-right text-xs p-1 border-r-[1px] border-black ${
                                    grandTotals.productTotals[product]?.netExposure > 0 ? 'text-green-300' : 
                                    grandTotals.productTotals[product]?.netExposure < 0 ? 'text-red-300' : 'text-gray-300'
                                  } font-bold`}
                                >
                                  {formatValue(grandTotals.productTotals[product]?.netExposure || 0)}
                                </TableCell>
                              );
                              
                              if (index === ucomeIndex && shouldShowBiodieselTotal) {
                                cells.push(
                                  <TableCell 
                                    key={`total-biodiesel-total`} 
                                    className={`text-right text-xs p-1 border-r-[1px] border-black ${
                                      groupGrandTotals.biodieselTotal > 0 ? 'text-green-300' : 
                                      groupGrandTotals.biodieselTotal < 0 ? 'text-red-300' : 'text-gray-300'
                                    } font-bold bg-green-900`}
                                  >
                                    {formatValue(groupGrandTotals.biodieselTotal)}
                                  </TableCell>
                                );
                              }
                            });
                            
                            if (shouldShowPricingInstrumentTotal) {
                              cells.push(
                                <TableCell 
                                  key={`total-pricing-instrument-total`} 
                                  className={`text-right text-xs p-1 border-r-[1px] border-black ${
                                    groupGrandTotals.pricingInstrumentTotal > 0 ? 'text-green-300' : 
                                    groupGrandTotals.pricingInstrumentTotal < 0 ? 'text-red-300' : 'text-gray-300'
                                  } font-bold bg-blue-900`}
                                >
                                  {formatValue(groupGrandTotals.pricingInstrumentTotal)}
                                </TableCell>
                              );
                            }
                            
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
