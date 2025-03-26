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
import TableErrorState from '@/pages/risk/TableErrorState';
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
import { 
  getMonthlyDistribution, 
  getDailyDistribution, 
  filterDailyDistributionByDateRange,
  aggregateDailyToMonthly
} from '@/utils/workingDaysUtils';
import { DatePicker } from '@/components/ui/date-picker';

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
  const [startDate, setStartDate] = useState<Date>(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1); // First day of current month
  });
  const [endDate, setEndDate] = useState<Date>(() => {
    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of current month
    return lastDay;
  });
  
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

  const { data: tradeData, isLoading, error, refetch } = useQuery({
    queryKey: ['exposure-data', startDate, endDate],
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

  const exposureData = useMemo(() => {
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
          
          // First try to get daily distribution and filter by date range
          const mtmDailyDistribution = getDailyDistribution(mtmFormula.exposures, 'physical');
          const pricingDailyDistribution = getDailyDistribution(pricingFormula.exposures, 'pricing');
          
          const hasDailyDistribution = Object.keys(mtmDailyDistribution).length > 0 || 
                                      Object.keys(pricingDailyDistribution).length > 0;
                                      
          if (hasDailyDistribution) {
            // Filter and process daily distributions
            Object.entries(mtmDailyDistribution).forEach(([product, dayDistribution]) => {
              const canonicalBaseProduct = mapProductToCanonical(product);
              allProductsFound.add(canonicalBaseProduct);
              
              // Filter by date range
              const filteredDailyDist = filterDailyDistributionByDateRange(
                dayDistribution, 
                startDate, 
                endDate
              );
              
              // Aggregate filtered daily to monthly
              const aggregatedMonthly = aggregateDailyToMonthly(filteredDailyDist);
              
              // Update exposure data
              Object.entries(aggregatedMonthly).forEach(([month, exposure]) => {
                if (periods.includes(month) && 
                    exposuresByMonth[month] && 
                    exposuresByMonth[month][canonicalBaseProduct]) {
                  exposuresByMonth[month][canonicalBaseProduct].physical += Number(exposure) || 0;
                }
              });
            });
            
            Object.entries(pricingDailyDistribution).forEach(([product, dayDistribution]) => {
              const canonicalBaseProduct = mapProductToCanonical(product);
              allProductsFound.add(canonicalBaseProduct);
              
              // Filter by date range
              const filteredDailyDist = filterDailyDistributionByDateRange(
                dayDistribution, 
                startDate, 
                endDate
              );
              
              // Aggregate filtered daily to monthly
              const aggregatedMonthly = aggregateDailyToMonthly(filteredDailyDist);
              
              // Update exposure data
              Object.entries(aggregatedMonthly).forEach(([month, exposure]) => {
                if (periods.includes(month) && 
                    exposuresByMonth[month] && 
                    exposuresByMonth[month][canonicalBaseProduct]) {
                  exposuresByMonth[month][canonicalBaseProduct].pricing += Number(exposure) || 0;
                }
              });
            });
          } else {
            // Fall back to monthly distribution
            const mtmMonthlyDistribution = getMonthlyDistribution(mtmFormula.exposures, 'physical');
            const pricingMonthlyDistribution = getMonthlyDistribution(pricingFormula.exposures, 'pricing');
            
            const hasMonthlyDistribution = Object.keys(mtmMonthlyDistribution).length > 0 || 
                                          Object.keys(pricingMonthlyDistribution).length > 0;
            
            if (hasMonthlyDistribution) {
              // Process monthly distributions
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
              // Fall back to simple exposure calculation if no distributions available
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
    
    // Calculate net exposure
    Object.values(exposuresByMonth).forEach(monthData => {
      Object.entries(monthData).forEach(([product, exposure]) => {
        exposure.netExposure = calculateNetExposure(exposure.physical, exposure.pricing);
      });
    });
    
    const monthlyExposures: MonthlyExposure[] = periods.map(month => {
      const monthData = exposuresByMonth[month];
      const productsData: Record<string, ExposureData> = {};
      const totals: ExposureData = { physical: 0, pricing: 0, paper: 0, netExposure: 0 };
      
      Object.entries(monthData).forEach(([product, exposure]) => {
        if (ALLOWED_PRODUCTS.includes(product)) {
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
  }, [tradeData, periods, ALLOWED_PRODUCTS, startDate, endDate]);

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

  const isLoadingData = isLoading || instrumentsLoading;

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
                <label className="text-sm font-medium mb-2 block">Pricing Period Date Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Start Date</label>
                    <DatePicker 
                      date={startDate} 
                      setDate={(date) => {
                        if (date > endDate) {
                          // If selected start date is after end date, set end date to the same date
                          setEndDate(date);
                        }
                        setStartDate(date);
                      }}
                      placeholder="Select start date"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">End Date</label>
                    <DatePicker 
                      date={endDate} 
                      setDate={(date) => {
                        if (date < startDate) {
                          // If selected end date is before start date, set start date to the same date
                          setStartDate(date);
                        }
                        setEndDate(date);
                      }}
                      placeholder="Select end date"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          {isLoadingData ? (
            <TableLoadingState message="Loading exposure data..." />
          ) : error ? (
            <TableErrorState message="Error loading exposure data" error={error as Error} />
          ) : (
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead rowSpan={2} className="w-48 bg-muted/80 sticky left-0 z-10">Product</TableHead>
                    
                    {/* Month Headers */}
                    {exposureData.map(monthData => (
                      <TableHead key={monthData.month} colSpan={orderedVisibleCategories.length} className="text-center border-l">
                        {monthData.month}
                      </TableHead>
                    ))}
                    
                    {/* Totals Header */}
                    <TableHead colSpan={orderedVisibleCategories.length} className="text-center border-l">
                      Total
                    </TableHead>
                  </TableRow>
                  
                  <TableRow>
                    {/* Category Headers for Each Month */}
                    {exposureData.map(monthData => (
                      <React.Fragment key={`cats-${monthData.month}`}>
                        {orderedVisibleCategories.map(category => (
                          <TableHead 
                            key={`${monthData.month}-${category}`} 
                            className="text-center border-l"
                          >
                            <div className="flex justify-center">
                              <span className={`w-3 h-3 rounded-full mr-1 ${getCategoryColorClass(category)}`}></span>
                              {category}
                            </div>
                          </TableHead>
                        ))}
                      </React.Fragment>
                    ))}
                    
                    {/* Category Headers for Totals */}
                    {orderedVisibleCategories.map(category => (
                      <TableHead 
                        key={`total-${category}`} 
                        className="text-center border-l"
                      >
                        <div className="flex justify-center">
                          <span className={`w-3 h-3 rounded-full mr-1 ${getCategoryColorClass(category)}`}></span>
                          {category}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                
                <TableBody>
                  {/* Product Rows */}
                  {filteredProducts.map(product => (
                    <TableRow key={product}>
                      <TableCell className={`font-medium sticky left-0 bg-white z-10 ${shouldUseSpecialBackground(product) ? getExposureProductBackgroundClass(product) : ''}`}>
                        {formatExposureTableProduct(product)}
                      </TableCell>
                      
                      {/* Month Data */}
                      {exposureData.map(monthData => (
                        <React.Fragment key={`data-${monthData.month}-${product}`}>
                          {orderedVisibleCategories.map(category => {
                            if (!shouldShowProductInCategory(product, category)) {
                              return <TableCell key={`${monthData.month}-${product}-${category}`} className="text-center">-</TableCell>;
                            }
                            
                            const categoryKey = category.toLowerCase() === 'exposure' ? 'netExposure' : category.toLowerCase();
                            const value = monthData.products[product] ? monthData.products[product][categoryKey as keyof ExposureData] || 0 : 0;
                            
                            return (
                              <TableCell 
                                key={`${monthData.month}-${product}-${category}`} 
                                className={`text-right ${getValueColorClass(value)}`}
                              >
                                {value !== 0 ? formatValue(value) : ''}
                              </TableCell>
                            );
                          })}
                        </React.Fragment>
                      ))}
                      
                      {/* Product Totals */}
                      {orderedVisibleCategories.map(category => {
                        if (!shouldShowProductInCategory(product, category)) {
                          return <TableCell key={`total-${product}-${category}`} className="text-center">-</TableCell>;
                        }
                        
                        const categoryKey = category.toLowerCase() === 'exposure' ? 'netExposure' : category.toLowerCase();
                        const value = grandTotals.productTotals[product] ? grandTotals.productTotals[product][categoryKey as keyof ExposureData] || 0 : 0;
                        
                        return (
                          <TableCell 
                            key={`total-${product}-${category}`} 
                            className={`text-right ${getValueColorClass(value)}`}
                          >
                            {value !== 0 ? formatValue(value) : ''}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                  
                  {/* Biodiesel Group Total */}
                  {shouldShowBiodieselTotal && (
                    <TableRow className="border-t-2 border-muted">
                      <TableCell className="font-bold sticky left-0 bg-white z-10">
                        Biodiesel Total
                      </TableCell>
                      
                      {/* Month Biodiesel Group Totals */}
                      {exposureData.map(monthData => (
                        <React.Fragment key={`biodiesel-${monthData.month}`}>
                          {orderedVisibleCategories.map(category => {
                            const categoryKey = category.toLowerCase() === 'exposure' ? 'netExposure' : category.toLowerCase();
                            const value = calculateProductGroupTotal(
                              monthData.products,
                              BIODIESEL_PRODUCTS,
                              categoryKey as keyof ExposureData
                            );
                            
                            return (
                              <TableCell 
                                key={`${monthData.month}-biodiesel-${category}`} 
                                className={`text-right font-bold ${getValueColorClass(value)}`}
                              >
                                {value !== 0 ? formatValue(value) : ''}
                              </TableCell>
                            );
                          })}
                        </React.Fragment>
                      ))}
                      
                      {/* Biodiesel Grand Total */}
                      {orderedVisibleCategories.map(category => {
                        if (category.toLowerCase() === 'exposure') {
                          return (
                            <TableCell 
                              key={`total-biodiesel-${category}`} 
                              className={`text-right font-bold ${getValueColorClass(groupGrandTotals.biodieselTotal)}`}
                            >
                              {groupGrandTotals.biodieselTotal !== 0 ? formatValue(groupGrandTotals.biodieselTotal) : ''}
                            </TableCell>
                          );
                        }
                        
                        const categoryKey = category.toLowerCase();
                        const value = BIODIESEL_PRODUCTS.reduce((total, product) => {
                          if (grandTotals.productTotals[product]) {
                            return total + (grandTotals.productTotals[product][categoryKey as keyof ExposureData] || 0);
                          }
                          return total;
                        }, 0);
                        
                        return (
                          <TableCell 
                            key={`total-biodiesel-${category}`} 
                            className={`text-right font-bold ${getValueColorClass(value)}`}
                          >
                            {value !== 0 ? formatValue(value) : ''}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  )}
                  
                  {/* Pricing Instruments Group Total */}
                  {shouldShowPricingInstrumentTotal && (
                    <TableRow>
                      <TableCell className="font-bold sticky left-0 bg-white z-10">
                        Pricing Instruments Total
                      </TableCell>
                      
                      {/* Month Pricing Instruments Group Totals */}
                      {exposureData.map(monthData => (
                        <React.Fragment key={`pricing-instruments-${monthData.month}`}>
                          {orderedVisibleCategories.map(category => {
                            const categoryKey = category.toLowerCase() === 'exposure' ? 'netExposure' : category.toLowerCase();
                            const value = calculateProductGroupTotal(
                              monthData.products,
                              PRICING_INSTRUMENT_PRODUCTS,
                              categoryKey as keyof ExposureData
                            );
                            
                            return (
                              <TableCell 
                                key={`${monthData.month}-pricing-instruments-${category}`} 
                                className={`text-right font-bold ${getValueColorClass(value)}`}
                              >
                                {value !== 0 ? formatValue(value) : ''}
                              </TableCell>
                            );
                          })}
                        </React.Fragment>
                      ))}
                      
                      {/* Pricing Instruments Grand Total */}
                      {orderedVisibleCategories.map(category => {
                        if (category.toLowerCase() === 'exposure') {
                          return (
                            <TableCell 
                              key={`total-pricing-instruments-${category}`} 
                              className={`text-right font-bold ${getValueColorClass(groupGrandTotals.pricingInstrumentTotal)}`}
                            >
                              {groupGrandTotals.pricingInstrumentTotal !== 0 ? formatValue(groupGrandTotals.pricingInstrumentTotal) : ''}
                            </TableCell>
                          );
                        }
                        
                        const categoryKey = category.toLowerCase();
                        const value = PRICING_INSTRUMENT_PRODUCTS.reduce((total, product) => {
                          if (grandTotals.productTotals[product]) {
                            return total + (grandTotals.productTotals[product][categoryKey as keyof ExposureData] || 0);
                          }
                          return total;
                        }, 0);
                        
                        return (
                          <TableCell 
                            key={`total-pricing-instruments-${category}`} 
                            className={`text-right font-bold ${getValueColorClass(value)}`}
                          >
                            {value !== 0 ? formatValue(value) : ''}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  )}
                  
                  {/* Grand Total Row */}
                  {shouldShowTotalRow && (
                    <TableRow className="border-t-2 border-muted dark:border-muted-foreground bg-muted/40">
                      <TableCell className="font-extrabold text-lg sticky left-0 bg-muted/40 z-10">
                        Grand Total
                      </TableCell>
                      
                      {/* Month Grand Totals */}
                      {exposureData.map(monthData => (
                        <React.Fragment key={`grand-total-${monthData.month}`}>
                          {orderedVisibleCategories.map(category => {
                            const categoryKey = category.toLowerCase() === 'exposure' ? 'netExposure' : category.toLowerCase();
                            const value = monthData.totals[categoryKey as keyof ExposureData] || 0;
                            
                            return (
                              <TableCell 
                                key={`${monthData.month}-grand-total-${category}`} 
                                className={`text-right font-extrabold ${getValueColorClass(value)}`}
                              >
                                {value !== 0 ? formatValue(value) : ''}
                              </TableCell>
                            );
                          })}
                        </React.Fragment>
                      ))}
                      
                      {/* Overall Grand Total */}
                      {orderedVisibleCategories.map(category => {
                        if (category.toLowerCase() === 'exposure') {
                          return (
                            <TableCell 
                              key={`total-grand-total-${category}`} 
                              className={`text-right font-extrabold ${getValueColorClass(groupGrandTotals.totalRow)}`}
                            >
                              {groupGrandTotals.totalRow !== 0 ? formatValue(groupGrandTotals.totalRow) : ''}
                            </TableCell>
                          );
                        }
                        
                        const categoryKey = category.toLowerCase();
                        return (
                          <TableCell 
                            key={`total-grand-total-${category}`} 
                            className={`text-right font-extrabold ${getValueColorClass(grandTotals.totals[categoryKey as keyof ExposureData] || 0)}`}
                          >
                            {grandTotals.totals[categoryKey as keyof ExposureData] !== 0 ? formatValue(grandTotals.totals[categoryKey as keyof ExposureData] || 0) : ''}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default ExposurePage;

