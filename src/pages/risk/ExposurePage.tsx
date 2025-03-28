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
import { 
  getNextMonths, 
  formatMonthCode, 
  getBusinessDaysProportion 
} from '@/utils/dateUtils';
import { roundWithSignPreservation, applyTradeExposureSign } from '@/utils/numberUtils';
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
          // For physical exposures, use loading period start date
          const loadingStartDate = leg.loading_period_start ? new Date(leg.loading_period_start) : null;
          
          let physicalExposureMonth = '';
          if (loadingStartDate) {
            physicalExposureMonth = formatMonthCode(loadingStartDate);
          } else {
            // Fallback to trading_period if loading_period_start is not available
            physicalExposureMonth = leg.trading_period || '';
          }
          
          // Skip if month is not valid or not in our periods list
          if (!physicalExposureMonth || !periods.includes(physicalExposureMonth)) {
            return;
          }
          
          // For pricing exposures, use the pricing period range and prorate across months
          const pricingStartDate = leg.pricing_period_start ? new Date(leg.pricing_period_start) : null;
          const pricingEndDate = leg.pricing_period_end ? new Date(leg.pricing_period_end) : null;
          
          const isBuy = leg.buy_sell === 'buy';
          const quantityMultiplier = isBuy ? 1 : -1;
          const quantity = (leg.quantity || 0) * quantityMultiplier;
          
          const canonicalProduct = mapProductToCanonical(leg.product || 'Unknown');
          allProductsFound.add(canonicalProduct);
          
          if (!exposuresByMonth[physicalExposureMonth][canonicalProduct]) {
            exposuresByMonth[physicalExposureMonth][canonicalProduct] = {
              physical: 0,
              pricing: 0,
              paper: 0,
              netExposure: 0
            };
          }
          
          // Add physical exposure to the loading month
          const mtmFormula = validateAndParsePricingFormula(leg.mtm_formula);
          
          if (mtmFormula.tokens.length > 0 && mtmFormula.exposures && mtmFormula.exposures.physical) {
            Object.entries(mtmFormula.exposures.physical).forEach(([baseProduct, weight]) => {
              const canonicalBaseProduct = mapProductToCanonical(baseProduct);
              allProductsFound.add(canonicalBaseProduct);
              
              if (!exposuresByMonth[physicalExposureMonth][canonicalBaseProduct]) {
                exposuresByMonth[physicalExposureMonth][canonicalBaseProduct] = {
                  physical: 0,
                  pricing: 0,
                  paper: 0,
                  netExposure: 0
                };
              }
              
              // Apply the appropriate sign for the physical exposure
              const actualExposure = typeof weight === 'number' 
                ? quantity * weight 
                : 0;
              
              exposuresByMonth[physicalExposureMonth][canonicalBaseProduct].physical += actualExposure;
            });
          } else {
            exposuresByMonth[physicalExposureMonth][canonicalProduct].physical += quantity;
          }
          
          // Handle pricing exposure - distribute across months based on business days
          if (pricingStartDate && pricingEndDate) {
            const pricingFormula = validateAndParsePricingFormula(leg.pricing_formula);
            
            if (pricingFormula.exposures && pricingFormula.exposures.pricing) {
              Object.entries(pricingFormula.exposures.pricing).forEach(([instrument, value]) => {
                const canonicalInstrument = mapProductToCanonical(instrument);
                allProductsFound.add(canonicalInstrument);
                
                // The total pricing exposure value for this instrument
                const totalExposureValue = Number(value) || 0;
                const coefficientSign = Math.sign(totalExposureValue);
                
                // Distribute this exposure across all periods in the pricing window
                periods.forEach(periodMonth => {
                  if (!exposuresByMonth[periodMonth][canonicalInstrument]) {
                    exposuresByMonth[periodMonth][canonicalInstrument] = {
                      physical: 0,
                      pricing: 0,
                      paper: 0,
                      netExposure: 0
                    };
                  }
                  
                  const proportion = getBusinessDaysProportion(
                    pricingStartDate,
                    pricingEndDate,
                    periodMonth
                  );
                  
                  if (proportion > 0) {
                    // Calculate the prorated exposure for this month
                    let proratedExposure = totalExposureValue * proportion;
                    
                    // Round to 2 decimal places while preserving sign
                    proratedExposure = roundWithSignPreservation(proratedExposure, 2);
                    
                    // Apply the correct sign based on buy/sell and coefficient 
                    const signedExposure = applyTradeExposureSign(
                      Math.abs(proratedExposure),
                      isBuy,
                      coefficientSign
                    );
                    
                    exposuresByMonth[periodMonth][canonicalInstrument].pricing += signedExposure;
                  }
                });
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
  }, [tradeData, periods, ALLOWED_PRODUCTS]);

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
  
  const handleCategoryToggle = (category: string) => {
    setVisibleCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const isCategoryVisible = (category: string) => {
    return visibleCategories.includes(category);
  };

  const handleProductSelection = (product: string) => {
    setSelectedProducts(prev =>
      prev.includes(product) ? prev.filter(p => p !== product) : [...prev, product]
    );
  };

  const isProductSelected = (product: string) => {
    return selectedProducts.includes(product);
  };

  const filteredExposureData = useMemo(() => {
    return exposureData.map(monthData => {
      const filteredProducts: Record<string, ExposureData> = {};
      
      Object.entries(monthData.products).forEach(([product, exposure]) => {
        if (selectedProducts.includes(product)) {
          filteredProducts[product] = exposure;
        }
      });
      
      return {
        ...monthData,
        products: filteredProducts
      };
    });
  }, [exposureData, selectedProducts]);

  const filteredGrandTotals = useMemo(() => {
    const totals: ExposureData = { physical: 0, pricing: 0, paper: 0, netExposure: 0 };
    const productTotals: Record<string, ExposureData> = {};
    
    allProducts.forEach(product => {
      if (selectedProducts.includes(product)) {
        productTotals[product] = { physical: 0, pricing: 0, paper: 0, netExposure: 0 };
      }
    });
    
    filteredExposureData.forEach(monthData => {
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
  }, [filteredExposureData, allProducts, selectedProducts]);

  return (
    <Layout>
      <Helmet>
        <title>Exposure</title>
      </Helmet>
      
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Exposure</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {isLoading || instrumentsLoading ? (
              <TableLoadingState />
            ) : error ? (
              <TableErrorState error={error} onRetry={refetch} />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Filters</h3>
                    <div className="flex space-x-4">
                      {CATEGORY_ORDER.map(category => (
                        <Button
                          key={category}
                          variant={isCategoryVisible(category) ? 'default' : 'outline'}
                          onClick={() => handleCategoryToggle(category)}
                        >
                          {category}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold">Products</h3>
                    <div className="flex flex-wrap gap-2">
