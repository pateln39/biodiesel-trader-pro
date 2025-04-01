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
          loading_period_start,
          pricing_type,
          efp_designated_month
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
          let physicalExposureMonth = '';
          
          if (leg.loading_period_start) {
            physicalExposureMonth = formatMonthCode(new Date(leg.loading_period_start));
          } else if (leg.trading_period) {
            physicalExposureMonth = leg.trading_period;
          } else if (leg.pricing_period_start) {
            physicalExposureMonth = formatMonthCode(new Date(leg.pricing_period_start));
          }
          
          // For pricing exposure month, check if it's an EFP trade first
          let pricingExposureMonth = '';
          if (leg.pricing_type === 'efp' && leg.efp_designated_month) {
            pricingExposureMonth = leg.efp_designated_month;
          } else if (leg.trading_period) {
            pricingExposureMonth = leg.trading_period;
          } else if (leg.pricing_period_start) {
            pricingExposureMonth = formatMonthCode(new Date(leg.pricing_period_start));
          }
          
          // Process physical exposure only if it's in the current/future periods
          if (physicalExposureMonth && periods.includes(physicalExposureMonth)) {
            const canonicalProduct = mapProductToCanonical(leg.product || 'Unknown');
            const quantityMultiplier = leg.buy_sell === 'buy' ? 1 : -1;
            const quantity = (leg.quantity || 0) * quantityMultiplier;
            
            allProductsFound.add(canonicalProduct);
            
            if (!exposuresByMonth[physicalExposureMonth][canonicalProduct]) {
              exposuresByMonth[physicalExposureMonth][canonicalProduct] = {
                physical: 0,
                pricing: 0,
                paper: 0,
                netExposure: 0
              };
            }
            
            const mtmFormula = validateAndParsePricingFormula(leg.mtm_formula);
            
            if (mtmFormula.tokens.length > 0) {
              if (mtmFormula.exposures && mtmFormula.exposures.physical) {
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
                  
                  const actualExposure = typeof weight === 'number' ? weight * quantityMultiplier : 0;
                  exposuresByMonth[physicalExposureMonth][canonicalBaseProduct].physical += actualExposure;
                });
              } else {
                exposuresByMonth[physicalExposureMonth][canonicalProduct].physical += quantity;
              }
            } else {
              exposuresByMonth[physicalExposureMonth][canonicalProduct].physical += quantity;
            }
          }
          
          // Process pricing exposures separately - always process monthlyDistribution regardless of period
          const pricingFormula = validateAndParsePricingFormula(leg.pricing_formula);
          
          // First check for monthly distribution which can span multiple periods
          if (pricingFormula.monthlyDistribution) {
            Object.entries(pricingFormula.monthlyDistribution).forEach(([instrument, monthlyValues]) => {
              const canonicalInstrument = mapProductToCanonical(instrument);
              allProductsFound.add(canonicalInstrument);
              
              Object.entries(monthlyValues).forEach(([monthCode, value]) => {
                // Only include exposure for months in our periods list
                if (periods.includes(monthCode) && value !== 0) {
                  if (!exposuresByMonth[monthCode][canonicalInstrument]) {
                    exposuresByMonth[monthCode][canonicalInstrument] = {
                      physical: 0,
                      pricing: 0,
                      paper: 0,
                      netExposure: 0
                    };
                  }
                  
                  exposuresByMonth[monthCode][canonicalInstrument].pricing += value;
                }
              });
            });
          } 
          // For standard pricing exposures, use the pricing month if it's valid
          else if (pricingExposureMonth && periods.includes(pricingExposureMonth) && 
                  pricingFormula.exposures && pricingFormula.exposures.pricing) {
            
            Object.entries(pricingFormula.exposures.pricing).forEach(([instrument, value]) => {
              const canonicalInstrument = mapProductToCanonical(instrument);
              allProductsFound.add(canonicalInstrument);
              
              if (!exposuresByMonth[pricingExposureMonth][canonicalInstrument]) {
                exposuresByMonth[pricingExposureMonth][canonicalInstrument] = {
                  physical: 0,
                  pricing: 0,
                  paper: 0,
                  netExposure: 0
                };
              }
              
              exposuresByMonth[pricingExposureMonth][canonicalInstrument].pricing += Number(value) || 0;
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
    
    // Calculate net exposure for all products in all months
    periods.forEach(month => {
      Object.entries(exposuresByMonth[month]).forEach(([product, exposure]) => {
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
    if (value === 0) return 'exposure-value-zero';
    return value > 0 ? 'exposure-value-positive' : 'exposure-value-negative';
  };

  const formatValue = (value: number): string => {
    if (value === 0) return '—'; // Em dash for zero values
    return `${value >= 0 ? '+' : ''}${value.toLocaleString()}`;
  };

  const exposureCategories = CATEGORY_ORDER;

  const getCategoryColorClass = (category: string): string => {
    switch (category) {
      case 'Physical':
        return 'exposure-header-physical';
      case 'Pricing':
        return 'exposure-header-pricing';
      case 'Paper':
        return 'exposure-header-paper';
      case 'Exposure':
        return 'exposure-header-exposure';
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
    if ((category === 'Physical' || category === 'Paper') && 
        (product === 'ICE GASOIL FUTURES' || product === 'EFP' || product === 'ICE GASOIL FUTURES (EFP)')) {
      return false;
    }
    return true;
  };

  const shouldShowBiodieselTotal = true;
  
  const shouldShowPricingInstrumentTotal = true;
  
  const shouldShowTotalRow = true;

  const isLoadingData = isLoading || instrumentsLoading;

  const getCustomProductBackground = (product: string): string => {
    if (product.includes('UCOME')) return 'exposure-product-ucome';
    if (product.includes('FAME')) return 'exposure-product-fame';
    if (product.includes('RME')) return 'exposure-product-rme';
    if (product.includes('HVO')) return 'exposure-product-hvo';
    if (product.includes('GASOIL')) return 'exposure-product-gasoil';
    if (product.includes('EFP')) return 'exposure-product-efp';
    return '';
  };

  return (
    <Layout>
      <Helmet>
        <title>Exposure | TraderPro</title>
      </Helmet>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Exposure</h1>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            {isLoadingData ? (
              <TableLoadingState />
            ) : error ? (
              <TableErrorState 
                title="Error loading exposure data" 
                message="Please try refreshing the page."
                onRetry={() => refetch()}
              />
            ) : (
              <div className="overflow-x-auto">
                <div className="mb-4 flex flex-wrap gap-2">
                  {exposureCategories.map((category) => (
                    <label key={category} className="flex items-center gap-2">
                      <Checkbox
                        checked={visibleCategories.includes(category)}
                        onCheckedChange={() => toggleCategory(category)}
                      />
                      <span>{category}</span>
                    </label>
                  ))}
                </div>

                <div className="overflow-x-auto">
                  <Table className="w-full border-collapse">
                    <TableHeader>
                      <TableRow className="bg-table-header-bg text-table-header-text">
                        <TableHead className="exposure-table-head sticky left-0 z-10 bg-table-header-bg">
                          Month
                        </TableHead>
                        
                        {filteredProducts.map(product => (
                          shouldUseSpecialBackground(product) ? (
                            <React.Fragment key={product}>
                              {orderedVisibleCategories.map(category => (
                                shouldShowProductInCategory(product, category) && (
                                  <TableHead 
                                    key={`${product}-${category}`} 
                                    className={`exposure-table-head ${getExposureProductBackgroundClass(product)}`}
                                  >
                                    {formatExposureTableProduct(product)} {category}
                                  </TableHead>
                                )
                              ))}
                            </React.Fragment>
                          ) : (
                            <React.Fragment key={product}>
                              {orderedVisibleCategories.map(category => (
                                shouldShowProductInCategory(product, category) && (
                                  <TableHead 
                                    key={`${product}-${category}`} 
                                    className="exposure-table-head"
                                  >
                                    {formatExposureTableProduct(product)} {category}
                                  </TableHead>
                                )
                              ))}
                            </React.Fragment>
                          )
                        ))}
                        
                        <TableHead 
                          className="exposure-table-head exposure-total-biodiesel" 
                          colSpan={orderedVisibleCategories.length}
                        >
                          Biodiesel
                        </TableHead>
                        
                        <TableHead 
                          className="exposure-table-head exposure-total-pricing" 
                          colSpan={orderedVisibleCategories.length}
                        >
                          Pricing
                        </TableHead>
                        
                        <TableHead 
                          className="exposure-table-head exposure-total-row" 
                          colSpan={orderedVisibleCategories.length}
                        >
                          Total
                        </TableHead>
                      </TableRow>
                      
                      {/* Category Headers */}
                      <TableRow>
                        <TableHead className="exposure-table-head sticky left-0 z-10 bg-table-header-bg">
                          {/* Empty cell for month column */}
                        </TableHead>
                        
                        {/* Product Categories */}
                        {filteredProducts.map(product => (
                          <React.Fragment key={product}>
                            {orderedVisibleCategories.map(category => (
                              shouldShowProductInCategory(product, category) && (
                                <TableHead 
                                  key={`${product}-${category}-header`}
                                  className={`exposure-table-header-category ${getCategoryColorClass(category)}`}
                                >
                                  {category}
                                </TableHead>
                              )
                            ))}
                          </React.Fragment>
                        ))}
                        
                        {/* Biodiesel Summary Categories */}
                        {shouldShowBiodieselTotal && (
                          <>
                            {orderedVisibleCategories.map(category => (
                              <TableHead 
                                key={`biodiesel-${category}`}
                                className={`exposure-table-header-category ${getCategoryColorClass(category)}`}
                              >
                                {category}
                              </TableHead>
                            ))}
                          </>
                        )}
                        
                        {/* Pricing Instruments Summary Categories */}
                        {shouldShowPricingInstrumentTotal && (
                          <>
                            {orderedVisibleCategories.map(category => (
                              <TableHead 
                                key={`pricing-${category}`}
                                className={`exposure-table-header-category ${getCategoryColorClass(category)}`}
                              >
                                {category}
                              </TableHead>
                            ))}
                          </>
                        )}
                        
                        {/* Total Row Categories */}
                        {shouldShowTotalRow && (
                          <>
                            {orderedVisibleCategories.map(category => (
                              <TableHead 
                                key={`total-${category}`}
                                className={`exposure-table-header-category ${getCategoryColorClass(category)}`}
                              >
                                {category}
                              </TableHead>
                            ))}
                          </>
                        )}
                      </TableRow>
                    </TableHeader>
                    
                    <TableBody>
                      {exposureData.map((monthData, rowIndex) => (
                        <TableRow 
                          key={monthData.month} 
                          className={rowIndex % 2 === 0 ? 'exposure-row-even' : 'exposure-row-odd'}
                        >
                          <TableCell className="exposure-month-cell">
                            {monthData.month}
                          </TableCell>
                          
                          {/* Product Values */}
                          {filteredProducts.map(product => {
                            const productExposure = monthData.products[product] || {
                              physical: 0,
                              pricing: 0,
                              paper: 0,
                              netExposure: 0
                            };
                            
                            return (
                              <React.Fragment key={`${monthData.month}-${product}`}>
                                {orderedVisibleCategories.map(category => {
                                  if (!shouldShowProductInCategory(product, category)) return null;
                                  
                                  const categoryValue = productExposure[category.toLowerCase() as keyof ExposureData];
                                  const valueColorClass = getValueColorClass(categoryValue);
                                  
                                  return (
                                    <TableCell 
                                      key={`${monthData.month}-${product}-${category}`}
                                      className={`exposure-table-cell ${valueColorClass}`}
                                    >
                                      {formatValue(categoryValue)}
                                    </TableCell>
                                  );
                                })}
                              </React.Fragment>
                            );
                          })}
                          
                          {/* Biodiesel Subtotal */}
                          {shouldShowBiodieselTotal && (
                            <>
                              {orderedVisibleCategories.map(category => {
                                const categoryKey = category.toLowerCase() as keyof ExposureData;
                                const totalValue = calculateProductGroupTotal(
                                  monthData.products, 
                                  BIODIESEL_PRODUCTS,
                                  categoryKey
                                );
                                const valueColorClass = getValueColorClass(totalValue);
                                
                                return (
                                  <TableCell 
                                    key={`${monthData.month}-biodiesel-${category}`}
                                    className={`exposure-table-cell exposure-total-biodiesel ${valueColorClass}`}
                                  >
                                    {formatValue(totalValue)}
                                  </TableCell>
                                );
                              })}
                            </>
                          )}
                          
                          {/* Pricing Instruments Subtotal */}
                          {shouldShowPricingInstrumentTotal && (
                            <>
                              {orderedVisibleCategories.map(category => {
                                const categoryKey = category.toLowerCase() as keyof ExposureData;
                                const totalValue = calculateProductGroupTotal(
                                  monthData.products, 
                                  PRICING_INSTRUMENT_PRODUCTS,
                                  categoryKey
                                );
                                const valueColorClass = getValueColorClass(totalValue);
                                
                                return (
                                  <TableCell 
                                    key={`${monthData.month}-pricing-${category}`}
                                    className={`exposure-table-cell exposure-total-pricing ${valueColorClass}`}
                                  >
                                    {formatValue(totalValue)}
                                  </TableCell>
                                );
                              })}
                            </>
                          )}
                          
                          {/* Month Total */}
                          {shouldShowTotalRow && (
                            <>
                              {orderedVisibleCategories.map(category => {
                                const categoryKey = category.toLowerCase() as keyof ExposureData;
                                const totalValue = monthData.totals[categoryKey];
                                const valueColorClass = getValueColorClass(totalValue);
                                
                                return (
                                  <TableCell 
                                    key={`${monthData.month}-total-${category}`}
                                    className={`exposure-table-cell exposure-total-row ${valueColorClass}`}
                                  >
                                    {formatValue(totalValue)}
                                  </TableCell>
                                );
                              })}
                            </>
                          )}
                        </TableRow>
                      ))}
                      
                      {/* Grand Total Row */}
                      <TableRow className="exposure-row-total">
                        <TableCell className="exposure-month-cell">
                          Grand Total
                        </TableCell>
                        
                        {/* Product Grand Totals */}
                        {filteredProducts.map(product => {
                          const productTotalExposure = grandTotals.productTotals[product] || {
                            physical: 0,
                            pricing: 0,
                            paper: 0,
                            netExposure: 0
                          };
                          
                          return (
                            <React.Fragment key={`grand-total-${product}`}>
                              {orderedVisibleCategories.map(category => {
                                if (!shouldShowProductInCategory(product, category)) return null;
                                
                                const categoryValue = productTotalExposure[category.toLowerCase() as keyof ExposureData];
                                const valueColorClass = getValueColorClass(categoryValue);
                                
                                return (
                                  <TableCell 
                                    key={`grand-total-${product}-${category}`}
                                    className={`exposure-table-cell ${valueColorClass}`}
                                  >
                                    {formatValue(categoryValue)}
                                  </TableCell>
                                );
                              })}
                            </React.Fragment>
                          );
                        })}
                        
                        {/* Biodiesel Grand Total */}
                        {shouldShowBiodieselTotal && (
                          <>
                            {orderedVisibleCategories.map(category => {
                              const categoryKey = category.toLowerCase() as keyof ExposureData;
                              const totalValue = BIODIESEL_PRODUCTS.reduce((total, product) => {
                                if (grandTotals.productTotals[product]) {
                                  return total + (grandTotals.productTotals[product][categoryKey] || 0);
                                }
                                return total;
                              }, 0);
                              const valueColorClass = getValueColorClass(totalValue);
                              
                              return (
                                <TableCell 
                                  key={`grand-biodiesel-${category}`}
                                  className={`exposure-table-cell exposure-total-biodiesel ${valueColorClass}`}
                                >
                                  {formatValue(totalValue)}
                                </TableCell>
                              );
                            })}
                          </>
                        )}
                        
                        {/* Pricing Instruments Grand Total */}
                        {shouldShowPricingInstrumentTotal && (
                          <>
                            {orderedVisibleCategories.map(category => {
                              const categoryKey = category.toLowerCase() as keyof ExposureData;
                              const totalValue = PRICING_INSTRUMENT_PRODUCTS.reduce((total, product) => {
                                if (grandTotals.productTotals[product]) {
                                  return total + (grandTotals.productTotals[product][categoryKey] || 0);
                                }
                                return total;
                              }, 0);
                              const valueColorClass = getValueColorClass(totalValue);
                              
                              return (
                                <TableCell 
                                  key={`grand-pricing-${category}`}
                                  className={`exposure-table-cell exposure-total-pricing ${valueColorClass}`}
                                >
                                  {formatValue(totalValue)}
                                </TableCell>
                              );
                            })}
                          </>
                        )}
                        
                        {/* Final Grand Total */}
                        {shouldShowTotalRow && (
                          <>
                            {orderedVisibleCategories.map(category => {
                              const categoryKey = category.toLowerCase() as keyof ExposureData;
                              const totalValue = grandTotals.totals[categoryKey];
                              const valueColorClass = getValueColorClass(totalValue);
                              
                              return (
                                <TableCell 
                                  key={`grand-total-${category}`}
                                  className={`exposure-table-cell exposure-total-row ${valueColorClass}`}
                                >
                                  {formatValue(totalValue)}
                                </TableCell>
                              );
                            })}
                          </>
                        )}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ExposurePage;
