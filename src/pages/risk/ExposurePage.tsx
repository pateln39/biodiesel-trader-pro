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
          
          // Parse formulas to get exposure data
          const mtmFormula = validateAndParsePricingFormula(leg.mtm_formula);
          const pricingFormula = validateAndParsePricingFormula(leg.pricing_formula);
          
          const canonicalProduct = mapProductToCanonical(leg.product || 'Unknown');
          const quantityMultiplier = leg.buy_sell === 'buy' ? 1 : -1;
          const quantity = (leg.quantity || 0) * quantityMultiplier;
          
          allProductsFound.add(canonicalProduct);
          
          // Ensure product exists in all months
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
          
          // Check if we have monthly distribution data in either formula
          const physicalDistribution = getMonthlyDistribution(mtmFormula.exposures, 'physical');
          const pricingDistribution = getMonthlyDistribution(pricingFormula.exposures, 'pricing');
          
          const hasMonthlyDistribution = 
            Object.keys(physicalDistribution).length > 0 || 
            Object.keys(pricingDistribution).length > 0;
          
          console.log(`Leg ${leg.leg_reference} has monthly distribution:`, hasMonthlyDistribution);
          
          if (hasMonthlyDistribution) {
            // Process physical exposure distribution from MTM formula
            if (Object.keys(physicalDistribution).length > 0) {
              Object.entries(physicalDistribution).forEach(([product, monthDistribution]) => {
                const canonicalBaseProduct = mapProductToCanonical(product);
                allProductsFound.add(canonicalBaseProduct);
                
                // Apply monthly distribution
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
              // If no monthly distribution, but the pricing period is defined,
              // we distribute the physical exposure across the pricing period
              if (leg.pricing_period_start && leg.pricing_period_end) {
                Object.entries(mtmFormula.exposures.physical).forEach(([baseProduct, weight]) => {
                  const canonicalBaseProduct = mapProductToCanonical(baseProduct);
                  allProductsFound.add(canonicalBaseProduct);
                  
                  // Calculate distribution by working days
                  const startDate = new Date(leg.pricing_period_start as string);
                  const endDate = new Date(leg.pricing_period_end as string);
                  const weightValue = typeof weight === 'number' ? weight : quantity;
                  
                  const monthlyDistribution = {};
                  const actualValue = weightValue;
                  
                  // Get start and end month
                  const startMonth = formatMonthCode(startDate);
                  const endMonth = formatMonthCode(endDate);
                  
                  // If both dates are in the same month
                  if (startMonth === endMonth) {
                    if (periods.includes(startMonth) && exposuresByMonth[startMonth][canonicalBaseProduct]) {
                      exposuresByMonth[startMonth][canonicalBaseProduct].physical += actualValue;
                      console.log(`Adding entire physical exposure for ${canonicalBaseProduct} in ${startMonth}: ${actualValue}`);
                    }
                  } 
                  // If dates span multiple months, let's divide the exposure evenly
                  else {
                    const startMonthDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
                    const endMonthDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
                    
                    // Count total months
                    let monthCount = 0;
                    const currentMonth = new Date(startMonthDate);
                    while (currentMonth <= endMonthDate) {
                      monthCount++;
                      currentMonth.setMonth(currentMonth.getMonth() + 1);
                    }
                    
                    // Distribute evenly across months
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
              // Legacy approach - just use primary month if no pricing period or monthly distribution
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
              // Last resort - derive month from pricing_period_start
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
            
            // Process pricing exposure distribution from pricing formula
            if (Object.keys(pricingDistribution).length > 0) {
              Object.entries(pricingDistribution).forEach(([product, monthDistribution]) => {
                const canonicalBaseProduct = mapProductToCanonical(product);
                allProductsFound.add(canonicalBaseProduct);
                
                // Apply monthly distribution
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
            // If no monthly distribution for pricing, try to use physical distribution structure
            else if (Object.keys(physicalDistribution).length > 0 && pricingFormula.exposures && pricingFormula.exposures.pricing) {
              // For each product that has pricing exposure
              Object.entries(pricingFormula.exposures.pricing).forEach(([instrument, value]) => {
                const canonicalInstrument = mapProductToCanonical(instrument);
                allProductsFound.add(canonicalInstrument);
                
                // Try to match the distribution pattern of the physical exposure
                const pricingValue = Number(value) || 0;
                let totalPhysicalExposure = 0;
                
                // Calculate total physical exposure for normalization
                for (const product in physicalDistribution) {
                  for (const month in physicalDistribution[product]) {
                    totalPhysicalExposure += Number(physicalDistribution[product][month]) || 0;
                  }
                }
                
                // If there's no physical exposure, we can't normalize
                if (totalPhysicalExposure === 0) return;
                
                // Distribute pricing using the same pattern as physical
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
            // If no monthly distribution for pricing, use legacy approach
            else if (pricingFormula.exposures && pricingFormula.exposures.pricing) {
              // Try to use trading_period first
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
              // If no trading_period, try to derive from pricing_period_start
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
          // Legacy approach - no monthly distribution available
          else {
            // Check if we have a pricing period defined for more precise distribution
            const hasPricingPeriod = leg.pricing_period_start && leg.pricing_period_end;
            
            // Determine which month to use - trading_period first, then derived from pricing_period_start
            let primaryMonth = leg.trading_period || '';
            
            if (!primaryMonth && leg.pricing_period_start) {
              const date = new Date(leg.pricing_period_start);
              primaryMonth = formatMonthCode(date);
            }
            
            // Skip if no monthly information is available
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
