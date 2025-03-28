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
          pricing_period_end,
          loading_period_start,
          loading_period_end
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
    if (isDateFilterActive) {
      const monthlyExposures: MonthlyExposure[] = [];
      
      const filteredMonth = `${format(startDate, 'MMM')}-${format(startDate, 'yy')} to ${format(endDate, 'MMM')}-${format(endDate, 'yy')}`;
      
      const productsData: Record<string, ExposureData> = {};
      const totals: ExposureData = { physical: 0, pricing: 0, paper: 0, netExposure: 0 };
      
      Object.entries(filteredExposures.physical).forEach(([product, exposure]) => {
        if (ALLOWED_PRODUCTS.includes(product)) {
          productsData[product] = {
            physical: exposure,
            pricing: filteredExposures.pricing[product] || 0,
            paper: 0,
            netExposure: calculateNetExposure(exposure, filteredExposures.pricing[product] || 0)
          };
          
          totals.physical += exposure;
          totals.pricing += filteredExposures.pricing[product] || 0;
        }
      });
      
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
            
            if (!primaryMonth && leg.loading_period_start) {
              const date = new Date(leg.loading_period_start);
              primaryMonth = formatMonthCode(date);
            } else if (!primaryMonth && leg.pricing_period_start) {
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
            
            if (mtmFormula.tokens.length > 0 && leg.mtm_formula) {
              if (mtmFormula.exposures && mtmFormula.exposures.physical) {
                Object.entries(mtmFormula.exposures.physical).forEach(([baseProduct, weight]) => {
                  const canonicalBaseProduct = mapProductToCanonical(baseProduct);
                  allProductsFound.add(canonicalBaseProduct);
                  
                  let physicalExposureMonth = primaryMonth;
                  
                  if (leg.loading_period_start) {
                    const loadingDate = new Date(leg.loading_period_start);
                    physicalExposureMonth = formatMonthCode(loadingDate);
                  }
                  
                  if (physicalExposureMonth && exposuresByMonth[physicalExposureMonth] && 
                      exposuresByMonth[physicalExposureMonth][canonicalBaseProduct]) {
                    const actualExposure = typeof weight === 'number' ? weight : 0;
                    exposuresByMonth[physicalExposureMonth][canonicalBaseProduct].physical += actualExposure;
                  }
                });
              } else if (primaryMonth && leg.loading_period_start) {
                const loadingDate = new Date(leg.loading_period_start);
                const physicalExposureMonth = formatMonthCode(loadingDate);
                
                if (exposuresByMonth[physicalExposureMonth] && 
                    exposuresByMonth[physicalExposureMonth][canonicalProduct]) {
                  exposuresByMonth[physicalExposureMonth][canonicalProduct].physical += quantity;
                }
              } else if (primaryMonth && exposuresByMonth[primaryMonth][canonicalProduct]) {
                exposuresByMonth[primaryMonth][canonicalProduct].physical += quantity;
              }
            } else if (primaryMonth && exposuresByMonth[primaryMonth][canonicalProduct]) {
              exposuresByMonth[primaryMonth][canonicalProduct].physical += quantity;
            }
            
            if (pricingFormula.exposures && pricingFormula.exposures.pricing) {
              const pricingMonthlyDistribution = getMonthlyDistribution(pricingFormula.exposures, 'pricing');
              
              if (Object.keys(pricingMonthlyDistribution).length > 0) {
                Object.entries(pricingMonthlyDistribution).forEach(([instrument, distribution]) => {
                  const canonicalInstrument = mapProductToCanonical(instrument);
                  allProductsFound.add(canonicalInstrument);
                  
                  Object.entries(distribution).forEach(([month, value]) => {
                    if (exposuresByMonth[month] && exposuresByMonth[month][canonicalInstrument]) {
                      exposuresByMonth[month][canonicalInstrument].pricing += Number(value) || 0;
                    }
                  });
                });
              } else {
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
      
      periods.forEach(month => {
        if (exposuresByMonth[month]) {
          Object.keys(exposuresByMonth[month]).forEach(product => {
            if (exposuresByMonth[month][product]) {
              const { physical, pricing } = exposuresByMonth[month][product];
              exposuresByMonth[month][product].netExposure = calculateNetExposure(physical, pricing);
            }
          });
        }
      });
      
      return periods.map(month => {
        const products: ProductExposure = {};
        let totalPhysical = 0;
        let totalPricing = 0;
        let totalPaper = 0;
        
        if (exposuresByMonth[month]) {
          Object.entries(exposuresByMonth[month]).forEach(([productName, productData]) => {
            if (productData.physical !== 0 || productData.pricing !== 0 || productData.paper !== 0) {
              products[productName] = productData;
              totalPhysical += productData.physical;
              totalPricing += productData.pricing;
              totalPaper += productData.paper;
            }
          });
        }
        
        const netTotalExposure = calculateNetExposure(totalPhysical, totalPricing);
        
        return {
          month,
          products,
          totals: {
            physical: totalPhysical,
            pricing: totalPricing,
            paper: totalPaper,
            netExposure: netTotalExposure
          }
        };
      });
    }
  }, [periods, tradeData, ALLOWED_PRODUCTS, isDateFilterActive, filteredExposures, startDate, endDate]);
  
  useEffect(() => {
    setSelectedProducts([]);
  }, [isDateFilterActive]);
  
  const handleDateFilterApply = (start: Date, end: Date) => {
    updateDateRange(start, end);
    setIsDateFilterActive(true);
  };
  
  const handleDateFilterClear = () => {
    setIsDateFilterActive(false);
    refetchTrades();
  };
  
  const handleExportCSV = () => {
    console.log('Exporting to CSV');
  };
  
  const toggleCategory = (category: string) => {
    if (visibleCategories.includes(category)) {
      setVisibleCategories(visibleCategories.filter(c => c !== category));
    } else {
      setVisibleCategories([...visibleCategories, category]);
    }
  };
  
  const toggleProductSelection = (product: string) => {
    if (selectedProducts.includes(product)) {
      setSelectedProducts(selectedProducts.filter(p => p !== product));
    } else {
      setSelectedProducts([...selectedProducts, product]);
    }
  };
  
  const shouldShowProduct = (product: string) => {
    if (selectedProducts.length === 0) {
      return true;
    }
    return selectedProducts.includes(product);
  };
  
  const groupProducts = (monthData: MonthlyExposure) => {
    const pricingProducts: string[] = [];
    const biodieselProducts: string[] = [];
    const otherProducts: string[] = [];
    
    Object.keys(monthData.products).forEach(product => {
      if (BIODIESEL_PRODUCTS.includes(product)) {
        biodieselProducts.push(product);
      } else if (PRICING_INSTRUMENT_PRODUCTS.includes(product)) {
        pricingProducts.push(product);
      } else {
        otherProducts.push(product);
      }
    });
    
    return {
      pricingProducts: pricingProducts.sort(),
      biodieselProducts: biodieselProducts.sort(),
      otherProducts: otherProducts.sort()
    };
  };
  
  return (
    <Layout>
      <Helmet>
        <title>Exposure | Risk</title>
      </Helmet>
      
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Exposure Overview</h1>
          
          <div className="flex items-center space-x-2">
            <DateRangeFilter 
              onApply={handleDateFilterApply} 
              onClear={handleDateFilterClear}
              isActive={isDateFilterActive}
              defaultStartDate={startDate}
              defaultEndDate={endDate}
            />
            
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="physical-toggle"
                    checked={visibleCategories.includes('Physical')}
                    onCheckedChange={() => toggleCategory('Physical')}
                  />
                  <label
                    htmlFor="physical-toggle"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Physical
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="pricing-toggle"
                    checked={visibleCategories.includes('Pricing')}
                    onCheckedChange={() => toggleCategory('Pricing')}
                  />
                  <label
                    htmlFor="pricing-toggle"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Pricing
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="paper-toggle" 
                    checked={visibleCategories.includes('Paper')}
                    onCheckedChange={() => toggleCategory('Paper')}
                  />
                  <label
                    htmlFor="paper-toggle"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Paper
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="exposure-toggle"
                    checked={visibleCategories.includes('Exposure')}
                    onCheckedChange={() => toggleCategory('Exposure')}
                  />
                  <label
                    htmlFor="exposure-toggle"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Net Exposure
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-md font-medium mb-3">Products</h3>
              <div className="flex flex-wrap gap-3">
                {ALLOWED_PRODUCTS.map(product => (
                  <div key={product} className="flex items-center space-x-2 bg-gray-50 rounded-md p-2">
                    <Checkbox 
                      id={`product-${product}`}
                      checked={selectedProducts.length === 0 || selectedProducts.includes(product)}
                      onCheckedChange={() => toggleProductSelection(product)}
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
            </CardContent>
          </Card>
          
          {isLoading || filteredExposuresLoading ? (
            <TableLoadingState message="Loading exposure data..." />
          ) : error || filteredExposuresError ? (
            <TableErrorState 
              message="Error loading exposure data"
              error={(error || filteredExposuresError)?.toString() || 'Unknown error'}
            />
          ) : (
            exposureData.map((monthData, index) => (
              <Card key={monthData.month} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-gray-50 p-4 border-b">
                    <h3 className="text-lg font-medium">{monthData.month}</h3>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Product</TableHead>
                        {visibleCategories.includes('Physical') && (
                          <TableHead>Physical</TableHead>
                        )}
                        {visibleCategories.includes('Pricing') && (
                          <TableHead>Pricing</TableHead>
                        )}
                        {visibleCategories.includes('Paper') && (
                          <TableHead>Paper</TableHead>
                        )}
                        {visibleCategories.includes('Exposure') && (
                          <TableHead>Net Exposure</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.keys(monthData.products).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={visibleCategories.length + 1} className="text-center py-4">
                            No exposure data for this month
                          </TableCell>
                        </TableRow>
                      ) : (
                        <>
                          {(() => {
                            const { pricingProducts, biodieselProducts, otherProducts } = groupProducts(monthData);
                            
                            return (
                              <>
                                {pricingProducts.length > 0 && pricingProducts.map(product => {
                                  if (!shouldShowProduct(product)) return null;
                                  const { physical, pricing, paper, netExposure } = monthData.products[product];
                                  return (
                                    <TableRow key={product} className={shouldUseSpecialBackground(product) ? getExposureProductBackgroundClass(product) : ""}>
                                      <TableCell className="font-medium">
                                        {formatExposureTableProduct(product)}
                                        {isPricingInstrument(product) && <span className="ml-1 text-xs text-gray-500">(Instrument)</span>}
                                      </TableCell>
                                      {visibleCategories.includes('Physical') && (
                                        <TableCell>{physical.toFixed(2)}</TableCell>
                                      )}
                                      {visibleCategories.includes('Pricing') && (
                                        <TableCell>{pricing.toFixed(2)}</TableCell>
                                      )}
                                      {visibleCategories.includes('Paper') && (
                                        <TableCell>{paper.toFixed(2)}</TableCell>
                                      )}
                                      {visibleCategories.includes('Exposure') && (
                                        <TableCell className={netExposure > 0 ? "text-green-600" : netExposure < 0 ? "text-red-600" : ""}>
                                          {netExposure.toFixed(2)}
                                        </TableCell>
                                      )}
                                    </TableRow>
                                  );
                                })}
                                
                                {biodieselProducts.length > 0 && biodieselProducts.map(product => {
                                  if (!shouldShowProduct(product)) return null;
                                  const { physical, pricing, paper, netExposure } = monthData.products[product];
                                  return (
                                    <TableRow key={product} className={shouldUseSpecialBackground(product) ? getExposureProductBackgroundClass(product) : ""}>
                                      <TableCell className="font-medium">
                                        {formatExposureTableProduct(product)}
                                      </TableCell>
                                      {visibleCategories.includes('Physical') && (
                                        <TableCell>{physical.toFixed(2)}</TableCell>
                                      )}
                                      {visibleCategories.includes('Pricing') && (
                                        <TableCell>{pricing.toFixed(2)}</TableCell>
                                      )}
                                      {visibleCategories.includes('Paper') && (
                                        <TableCell>{paper.toFixed(2)}</TableCell>
                                      )}
                                      {visibleCategories.includes('Exposure') && (
                                        <TableCell className={netExposure > 0 ? "text-green-600" : netExposure < 0 ? "text-red-600" : ""}>
                                          {netExposure.toFixed(2)}
                                        </TableCell>
                                      )}
                                    </TableRow>
                                  );
                                })}
                                
                                {otherProducts.length > 0 && otherProducts.map(product => {
                                  if (!shouldShowProduct(product)) return null;
                                  const { physical, pricing, paper, netExposure } = monthData.products[product];
                                  return (
                                    <TableRow key={product}>
                                      <TableCell className="font-medium">
                                        {formatExposureTableProduct(product)}
                                      </TableCell>
                                      {visibleCategories.includes('Physical') && (
                                        <TableCell>{physical.toFixed(2)}</TableCell>
                                      )}
                                      {visibleCategories.includes('Pricing') && (
                                        <TableCell>{pricing.toFixed(2)}</TableCell>
                                      )}
                                      {visibleCategories.includes('Paper') && (
                                        <TableCell>{paper.toFixed(2)}</TableCell>
                                      )}
                                      {visibleCategories.includes('Exposure') && (
                                        <TableCell className={netExposure > 0 ? "text-green-600" : netExposure < 0 ? "text-red-600" : ""}>
                                          {netExposure.toFixed(2)}
                                        </TableCell>
                                      )}
                                    </TableRow>
                                  );
                                })}
                                
                                <TableRow className="bg-gray-50 font-semibold">
                                  <TableCell>TOTAL</TableCell>
                                  {visibleCategories.includes('Physical') && (
                                    <TableCell>{monthData.totals.physical.toFixed(2)}</TableCell>
                                  )}
                                  {visibleCategories.includes('Pricing') && (
                                    <TableCell>{monthData.totals.pricing.toFixed(2)}</TableCell>
                                  )}
                                  {visibleCategories.includes('Paper') && (
                                    <TableCell>{monthData.totals.paper.toFixed(2)}</TableCell>
                                  )}
                                  {visibleCategories.includes('Exposure') && (
                                    <TableCell className={monthData.totals.netExposure > 0 ? "text-green-600" : monthData.totals.netExposure < 0 ? "text-red-600" : ""}>
                                      {monthData.totals.netExposure.toFixed(2)}
                                    </TableCell>
                                  )}
                                </TableRow>
                              </>
                            );
                          })()}
                        </>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ExposurePage;
