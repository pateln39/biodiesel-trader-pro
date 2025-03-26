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
          console.log(`Processing physical leg ${leg.leg_reference}:`, leg);
          
          const mtmFormula = validateAndParsePricingFormula(leg.mtm_formula);
          const pricingFormula = validateAndParsePricingFormula(leg.pricing_formula);
          
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
          
          const physicalDistribution = getMonthlyDistribution(mtmFormula.exposures, 'physical');
          const pricingDistribution = getMonthlyDistribution(pricingFormula.exposures, 'pricing');
          
          const hasMonthlyDistribution = 
            Object.keys(physicalDistribution).length > 0 || 
            Object.keys(pricingDistribution).length > 0;
          
          console.log(`Leg ${leg.leg_reference} has monthly distribution:`, hasMonthlyDistribution);
          
          if (hasMonthlyDistribution) {
            if (Object.keys(physicalDistribution).length > 0) {
              Object.entries(physicalDistribution).forEach(([product, monthDistribution]) => {
                const canonicalBaseProduct = mapProductToCanonical(product);
                allProductsFound.add(canonicalBaseProduct);
                
                Object.entries(monthDistribution).forEach(([month, exposure]) => {
                  if (periods.includes(month) && 
                      exposuresByMonth[month] && 
                      exposuresByMonth[month][canonicalBaseProduct]) {
                    
                    const physicalExposure = Number(exposure) || 0;
                    exposuresByMonth[month][canonicalBaseProduct].physical += physicalExposure;
                    
                    console.log(`Adding physical exposure for ${canonicalBaseProduct} in ${month}: ${physicalExposure}`);
                  }
                });
              });
            } 
            else if (mtmFormula.exposures && mtmFormula.exposures.physical) {
              if (leg.pricing_period_start && leg.pricing_period_end) {
                Object.entries(mtmFormula.exposures.physical).forEach(([baseProduct, weight]) => {
                  const canonicalBaseProduct = mapProductToCanonical(baseProduct);
                  allProductsFound.add(canonicalBaseProduct);
                  
                  const startDate = new Date(leg.pricing_period_start as string);
                  const endDate = new Date(leg.pricing_period_end as string);
                  const weightValue = typeof weight === 'number' ? weight : quantity;
                  
                  const monthlyDistribution = {};
                  const actualValue = weightValue;
                  
                  const startMonth = formatMonthCode(startDate);
                  const endMonth = formatMonthCode(endDate);
                  
                  if (startMonth === endMonth) {
                    if (periods.includes(startMonth) && exposuresByMonth[startMonth][canonicalBaseProduct]) {
                      exposuresByMonth[startMonth][canonicalBaseProduct].physical += actualValue;
                      console.log(`Adding entire physical exposure for ${canonicalBaseProduct} in ${startMonth}: ${actualValue}`);
                    }
                  } 
                  else {
                    const startMonthDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
                    const endMonthDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
                    
                    let monthCount = 0;
                    const currentMonth = new Date(startMonthDate);
                    while (currentMonth <= endMonthDate) {
                      monthCount++;
                      currentMonth.setMonth(currentMonth.getMonth() + 1);
                    }
                    
                    const perMonthValue = actualValue / monthCount;
                    
                    const distributionMonth = new Date(startMonthDate);
                    while (distributionMonth <= endMonthDate) {
                      const monthKey = formatMonthCode(distributionMonth);
                      
                      if (periods.includes(monthKey) && exposuresByMonth[monthKey][canonicalBaseProduct]) {
                        exposuresByMonth[monthKey][canonicalBaseProduct].physical += perMonthValue;
                        console.log(`Adding divided physical exposure for ${canonicalBaseProduct} in ${monthKey}: ${perMonthValue}`);
                      }
                      
                      distributionMonth.setMonth(distributionMonth.getMonth() + 1);
                    }
                  }
                });
              }
              else if (leg.trading_period) {
                const primaryMonth = leg.trading_period;
                
                Object.entries(mtmFormula.exposures.physical).forEach(([baseProduct, weight]) => {
                  const canonicalBaseProduct = mapProductToCanonical(baseProduct);
                  allProductsFound.add(canonicalBaseProduct);
                  
                  if (primaryMonth && exposuresByMonth[primaryMonth][canonicalBaseProduct]) {
                    const actualExposure = typeof weight === 'number' ? weight : 0;
                    exposuresByMonth[primaryMonth][canonicalBaseProduct].physical += actualExposure;
                    console.log(`Using legacy trading_period for physical exposure for ${canonicalBaseProduct} in ${primaryMonth}: ${actualExposure}`);
                  }
                });
              }
              else if (leg.pricing_period_start) {
                const date = new Date(leg.pricing_period_start);
                const primaryMonth = formatMonthCode(date);
                
                Object.entries(mtmFormula.exposures.physical).forEach(([baseProduct, weight]) => {
                  const canonicalBaseProduct = mapProductToCanonical(baseProduct);
                  allProductsFound.add(canonicalBaseProduct);
                  
                  if (primaryMonth && exposuresByMonth[primaryMonth][canonicalBaseProduct]) {
                    const actualExposure = typeof weight === 'number' ? weight : 0;
                    exposuresByMonth[primaryMonth][canonicalBaseProduct].physical += actualExposure;
                    console.log(`Using derived month for physical exposure for ${canonicalBaseProduct} in ${primaryMonth}: ${actualExposure}`);
                  }
                });
              }
            }
            
            if (Object.keys(pricingDistribution).length > 0) {
              Object.entries(pricingDistribution).forEach(([product, monthDistribution]) => {
                const canonicalBaseProduct = mapProductToCanonical(product);
                allProductsFound.add(canonicalBaseProduct);
                
                Object.entries(monthDistribution).forEach(([month, exposure]) => {
                  if (periods.includes(month) && 
                      exposuresByMonth[month] && 
                      exposuresByMonth[month][canonicalBaseProduct]) {
                    
                    const pricingExposure = Number(exposure) || 0;
                    exposuresByMonth[month][canonicalBaseProduct].pricing += pricingExposure;
                    
                    console.log(`Adding pricing exposure for ${canonicalBaseProduct} in ${month}: ${pricingExposure}`);
                  }
                });
              });
            }
            else if (Object.keys(physicalDistribution).length > 0 && pricingFormula.exposures && pricingFormula.exposures.pricing) {
              Object.entries(pricingFormula.exposures.pricing).forEach(([instrument, value]) => {
                const canonicalInstrument = mapProductToCanonical(instrument);
                allProductsFound.add(canonicalInstrument);
                
                const pricingValue = Number(value) || 0;
                let totalPhysicalExposure = 0;
                
                for (const product in physicalDistribution) {
                  for (const month in physicalDistribution[product]) {
                    totalPhysicalExposure += Number(physicalDistribution[product][month]) || 0;
                  }
                }
                
                if (totalPhysicalExposure === 0) return;
                
                for (const product in physicalDistribution) {
                  for (const month in physicalDistribution[product]) {
                    if (periods.includes(month) && exposuresByMonth[month][canonicalInstrument]) {
                      const physicalAmount = Number(physicalDistribution[product][month]) || 0;
                      const ratio = physicalAmount / totalPhysicalExposure;
                      const pricingAmount = pricingValue * ratio;
                      
                      exposuresByMonth[month][canonicalInstrument].pricing += pricingAmount;
                      console.log(`Distributing pricing exposure for ${canonicalInstrument} in ${month} based on physical pattern: ${pricingAmount}`);
                    }
                  }
                }
              });
            }
            else if (pricingFormula.exposures && pricingFormula.exposures.pricing) {
              if (leg.trading_period) {
                const primaryMonth = leg.trading_period;
                
                Object.entries(pricingFormula.exposures.pricing).forEach(([instrument, value]) => {
                  const canonicalInstrument = mapProductToCanonical(instrument);
                  allProductsFound.add(canonicalInstrument);
                  
                  if (primaryMonth && exposuresByMonth[primaryMonth][canonicalInstrument]) {
                    const pricingExposure = Number(value) || 0;
                    exposuresByMonth[primaryMonth][canonicalInstrument].pricing += pricingExposure;
                    console.log(`Using legacy trading_period for pricing exposure for ${canonicalInstrument} in ${primaryMonth}: ${pricingExposure}`);
                  }
                });
              }
              else if (leg.pricing_period_start) {
                const date = new Date(leg.pricing_period_start);
                const primaryMonth = formatMonthCode(date);
                
                Object.entries(pricingFormula.exposures.pricing).forEach(([instrument, value]) => {
                  const canonicalInstrument = mapProductToCanonical(instrument);
                  allProductsFound.add(canonicalInstrument);
                  
                  if (primaryMonth && exposuresByMonth[primaryMonth][canonicalInstrument]) {
                    const pricingExposure = Number(value) || 0;
                    exposuresByMonth[primaryMonth][canonicalInstrument].pricing += pricingExposure;
                    console.log(`Using derived month for pricing exposure for ${canonicalInstrument} in ${primaryMonth}: ${pricingExposure}`);
                  }
                });
              }
            }
          }
          else {
            const hasPricingPeriod = leg.pricing_period_start && leg.pricing_period_end;
            
            let primaryMonth = leg.trading_period || '';
            
            if (!primaryMonth && leg.pricing_period_start) {
              const date = new Date(leg.pricing_period_start);
              primaryMonth = formatMonthCode(date);
            }
            
            if (!primaryMonth && !hasPricingPeriod) {
              console.log(`Skipping leg ${leg.leg_reference} - no monthly information available`);
              return;
            }
            
            if (mtmFormula.tokens.length > 0) {
              if (mtmFormula.exposures && mtmFormula.exposures.physical) {
                Object.entries(mtmFormula.exposures.physical).forEach(([baseProduct, weight]) => {
                  const canonicalBaseProduct = mapProductToCanonical(baseProduct);
                  allProductsFound.add(canonicalBaseProduct);
                  
                  if (primaryMonth && exposuresByMonth[primaryMonth][canonicalBaseProduct]) {
                    const actualExposure = typeof weight === 'number' ? weight : 0;
                    exposuresByMonth[primaryMonth][canonicalBaseProduct].physical += actualExposure;
                    console.log(`Legacy: Adding physical exposure for ${canonicalBaseProduct} in ${primaryMonth}: ${actualExposure}`);
                  }
                });
              } else if (primaryMonth && exposuresByMonth[primaryMonth][canonicalProduct]) {
                exposuresByMonth[primaryMonth][canonicalProduct].physical += quantity;
                console.log(`Legacy: Adding simple physical exposure for ${canonicalProduct} in ${primaryMonth}: ${quantity}`);
              }
            } else if (primaryMonth && exposuresByMonth[primaryMonth][canonicalProduct]) {
              exposuresByMonth[primaryMonth][canonicalProduct].physical += quantity;
              console.log(`Legacy: Adding fallback physical exposure for ${canonicalProduct} in ${primaryMonth}: ${quantity}`);
            }
            
            if (pricingFormula.exposures && pricingFormula.exposures.pricing) {
              Object.entries(pricingFormula.exposures.pricing).forEach(([instrument, value]) => {
                const canonicalInstrument = mapProductToCanonical(instrument);
                allProductsFound.add(canonicalInstrument);
                
                if (primaryMonth && exposuresByMonth[primaryMonth][canonicalInstrument]) {
                  exposuresByMonth[primaryMonth][canonicalInstrument].pricing += Number(value) || 0;
                  console.log(`Legacy: Adding pricing exposure for ${canonicalInstrument} in ${primaryMonth}: ${Number(value) || 0}`);
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
    
    Object.keys(exposuresByMonth).forEach(month => {
      Object.keys(exposuresByMonth[month]).forEach(product => {
        const data = exposuresByMonth[month][product];
        data.netExposure = calculateNetExposure(data.physical, data.pricing);
      });
    });
    
    const exposureArray = periods.map(month => {
      const products = exposuresByMonth[month] || {};
      
      const monthTotals: ExposureData = {
        physical: 0,
        pricing: 0,
        paper: 0,
        netExposure: 0
      };
      
      Object.values(products).forEach(data => {
        monthTotals.physical += data.physical;
        monthTotals.pricing += data.pricing;
        monthTotals.paper += data.paper;
        monthTotals.netExposure += data.netExposure;
      });
      
      return {
        month,
        products,
        totals: monthTotals
      };
    });
    
    return {
      monthlyData: exposureArray,
      productsFound: Array.from(allProductsFound)
    };
  }, [tradeData, periods]);

  return (
    <Layout>
      <Helmet>
        <title>Exposure | Trading Risk Management</title>
      </Helmet>
      
      <div className="container p-4 mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Exposure Report</h1>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-6">
            {isLoading ? (
              <TableLoadingState columns={5} rows={5} />
            ) : error ? (
              <TableErrorState 
                error={error as Error} 
                retryFn={refetch} 
              />
            ) : (
              <>
                <div className="mb-4 flex flex-wrap gap-4">
                  <div className="flex flex-col">
                    <h3 className="text-lg font-semibold mb-2">Categories</h3>
                    <div className="space-y-2">
                      {CATEGORY_ORDER.map((category) => (
                        <div key={category} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`category-${category}`}
                            checked={visibleCategories.includes(category)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setVisibleCategories([...visibleCategories, category]);
                              } else {
                                setVisibleCategories(
                                  visibleCategories.filter(c => c !== category)
                                );
                              }
                            }}
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
                  
                  <div className="flex flex-col">
                    <h3 className="text-lg font-semibold mb-2">Products</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {exposureData?.productsFound.sort().map((product) => (
                        <div key={product} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`product-${product}`}
                            checked={selectedProducts.length === 0 || selectedProducts.includes(product)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedProducts([...selectedProducts, product]);
                              } else {
                                setSelectedProducts(
                                  selectedProducts.filter(p => p !== product)
                                );
                              }
                            }}
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
                
                <div className="border rounded-md overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 bg-background z-10 min-w-[150px]">
                          Product / Month
                        </TableHead>
                        {exposureData?.monthlyData.map((data) => (
                          <TableHead key={data.month} className="text-center">
                            {data.month}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {BIODIESEL_PRODUCTS.filter(p => 
                        selectedProducts.length === 0 || selectedProducts.includes(p)
                      ).map((product) => (
                        <TableRow key={product}>
                          <TableCell 
                            className={`sticky left-0 bg-background z-10 font-medium ${
                              shouldUseSpecialBackground(product) ? 
                              getExposureProductBackgroundClass(product) : ''
                            }`}
                          >
                            {formatExposureTableProduct(product)}
                          </TableCell>
                          {exposureData?.monthlyData.map((month) => {
                            const productData = month.products[product];
                            if (!productData) return <TableCell key={month.month}>-</TableCell>;
                            
                            return (
                              <TableCell 
                                key={month.month} 
                                className="text-right"
                              >
                                <div className="flex flex-col">
                                  {visibleCategories.includes('Physical') && 
                                    <span className="text-sm">
                                      P: {productData.physical.toLocaleString(undefined, {maximumFractionDigits: 2})}
                                    </span>
                                  }
                                  {visibleCategories.includes('Pricing') && 
                                    <span className="text-sm">
                                      F: {productData.pricing.toLocaleString(undefined, {maximumFractionDigits: 2})}
                                    </span>
                                  }
                                  {visibleCategories.includes('Paper') && 
                                    <span className="text-sm">
                                      S: {productData.paper.toLocaleString(undefined, {maximumFractionDigits: 2})}
                                    </span>
                                  }
                                  {visibleCategories.includes('Exposure') && 
                                    <span className="font-bold text-sm">
                                      E: {productData.netExposure.toLocaleString(undefined, {maximumFractionDigits: 2})}
                                    </span>
                                  }
                                </div>
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                      
                      {PRICING_INSTRUMENT_PRODUCTS.filter(p => 
                        selectedProducts.length === 0 || selectedProducts.includes(p)
                      ).map((product) => (
                        <TableRow key={product}>
                          <TableCell 
                            className={`sticky left-0 bg-background z-10 font-medium ${
                              shouldUseSpecialBackground(product) ? 
                              getExposureProductBackgroundClass(product) : ''
                            }`}
                          >
                            {formatExposureTableProduct(product)}
                          </TableCell>
                          {exposureData?.monthlyData.map((month) => {
                            const productData = month.products[product];
                            if (!productData) return <TableCell key={month.month}>-</TableCell>;
                            
                            return (
                              <TableCell 
                                key={month.month} 
                                className="text-right"
                              >
                                <div className="flex flex-col">
                                  {visibleCategories.includes('Physical') && 
                                    <span className="text-sm">
                                      P: {productData.physical.toLocaleString(undefined, {maximumFractionDigits: 2})}
                                    </span>
                                  }
                                  {visibleCategories.includes('Pricing') && 
                                    <span className="text-sm">
                                      F: {productData.pricing.toLocaleString(undefined, {maximumFractionDigits: 2})}
                                    </span>
                                  }
                                  {visibleCategories.includes('Paper') && 
                                    <span className="text-sm">
                                      S: {productData.paper.toLocaleString(undefined, {maximumFractionDigits: 2})}
                                    </span>
                                  }
                                  {visibleCategories.includes('Exposure') && 
                                    <span className="font-bold text-sm">
                                      E: {productData.netExposure.toLocaleString(undefined, {maximumFractionDigits: 2})}
                                    </span>
                                  }
                                </div>
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                      
                      <TableRow className="font-bold">
                        <TableCell className="sticky left-0 bg-background z-10">
                          TOTALS
                        </TableCell>
                        {exposureData?.monthlyData.map((month) => (
                          <TableCell 
                            key={month.month} 
                            className="text-right"
                          >
                            <div className="flex flex-col">
                              {visibleCategories.includes('Physical') && 
                                <span className="text-sm">
                                  P: {month.totals.physical.toLocaleString(undefined, {maximumFractionDigits: 2})}
                                </span>
                              }
                              {visibleCategories.includes('Pricing') && 
                                <span className="text-sm">
                                  F: {month.totals.pricing.toLocaleString(undefined, {maximumFractionDigits: 2})}
                                </span>
                              }
                              {visibleCategories.includes('Paper') && 
                                <span className="text-sm">
                                  S: {month.totals.paper.toLocaleString(undefined, {maximumFractionDigits: 2})}
                                </span>
                              }
                              {visibleCategories.includes('Exposure') && 
                                <span className="font-bold text-sm">
                                  E: {month.totals.netExposure.toLocaleString(undefined, {maximumFractionDigits: 2})}
                                </span>
                              }
                            </div>
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ExposurePage;
