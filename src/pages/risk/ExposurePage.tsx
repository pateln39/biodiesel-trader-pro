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
          
          allProductsFound.add(canonicalProduct);
          
          if (!exposuresByMonth[month][canonicalProduct]) {
            exposuresByMonth[month][canonicalProduct] = {
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
              exposuresByMonth[month][canonicalProduct].physical += quantity;
            }
          } else {
            exposuresByMonth[month][canonicalProduct].physical += quantity;
          }
          
          const pricingFormula = validateAndParsePricingFormula(leg.pricing_formula);
          if (pricingFormula.exposures && pricingFormula.exposures.pricing) {
            Object.entries(pricingFormula.exposures.pricing).forEach(([instrument, value]) => {
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
                          className="border-r-[1px] border-black font-bold text-base sticky left-0 bg-white min-w-[150px] z-10"
                        >
                          Product
                        </TableHead>
                        
                        {periods.map(month => (
                          <TableHead 
                            key={month}
                            colSpan={orderedVisibleCategories.length} 
                            className="text-center font-bold border-r-[1px] border-black"
                          >
                            {month}
                          </TableHead>
                        ))}
                        
                        {shouldShowTotalRow && (
                          <TableHead 
                            colSpan={orderedVisibleCategories.length}
                            className="text-center font-bold"
                          >
                            Total
                          </TableHead>
                        )}
                      </TableRow>
                      
                      <TableRow className="bg-muted/50 border-b-[1px] border-black">
                        {periods.map(month => 
                          orderedVisibleCategories.map((category, index) => (
                            <TableHead 
                              key={`${month}-${category}`}
                              className={`text-center text-xs font-semibold text-white ${getCategoryColorClass(category)} ${index === orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : 'border-r-[1px] border-black'}`}
                            >
                              {category}
                            </TableHead>
                          ))
                        )}
                        
                        {shouldShowTotalRow && 
                          orderedVisibleCategories.map((category, index) => (
                            <TableHead 
                              key={`total-${category}`}
                              className={`text-center text-xs font-semibold text-white ${getCategoryColorClass(category)} ${index < orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : ''}`}
                            >
                              {category}
                            </TableHead>
                          ))
                        }
                      </TableRow>
                    </TableHeader>
                    
                    <TableBody>
                      {filteredProducts.map(product => (
                        <TableRow 
                          key={product}
                          className={`
                            ${shouldUseSpecialBackground(product) ? 
                              getExposureProductBackgroundClass(product) : 
                              'hover:bg-muted/50'
                            } border-b-[1px] border-gray-300
                          `}
                        >
                          <TableCell 
                            className="sticky left-0 bg-inherit border-r-[1px] border-black font-medium"
                          >
                            {formatExposureTableProduct(product)}
                          </TableCell>
                          
                          {exposureData.map(monthData => 
                            orderedVisibleCategories.map((category, index) => {
                              const productData = monthData.products[product] || {
                                physical: 0,
                                pricing: 0,
                                paper: 0,
                                netExposure: 0
                              };
                              
                              let value = 0;
                              
                              if (category === 'Physical') {
                                value = productData.physical;
                              } else if (category === 'Pricing') {
                                value = productData.pricing;
                              } else if (category === 'Paper') {
                                value = productData.paper;
                              } else if (category === 'Exposure') {
                                value = productData.netExposure;
                              }
                              
                              if (!shouldShowProductInCategory(product, category)) {
                                return (
                                  <TableCell 
                                    key={`${monthData.month}-${product}-${category}`}
                                    className={`text-center ${index === orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : 'border-r-[1px] border-black'}`}
                                  />
                                );
                              }
                              
                              return (
                                <TableCell 
                                  key={`${monthData.month}-${product}-${category}`}
                                  className={`text-center ${getValueColorClass(value)} ${index === orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : 'border-r-[1px] border-black'}`}
                                >
                                  {formatValue(value)}
                                </TableCell>
                              );
                            })
                          )}
                          
                          {shouldShowTotalRow && orderedVisibleCategories.map((category, index) => {
                            if (!shouldShowProductInCategory(product, category)) {
                              return (
                                <TableCell 
                                  key={`total-${product}-${category}`}
                                  className={`text-center ${index < orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : ''}`}
                                />
                              );
                            }
                            
                            let value = 0;
                            
                            if (grandTotals.productTotals[product]) {
                              if (category === 'Physical') {
                                value = grandTotals.productTotals[product].physical;
                              } else if (category === 'Pricing') {
                                value = grandTotals.productTotals[product].pricing;
                              } else if (category === 'Paper') {
                                value = grandTotals.productTotals[product].paper;
                              } else if (category === 'Exposure') {
                                value = grandTotals.productTotals[product].netExposure;
                              }
                            }
                            
                            return (
                              <TableCell 
                                key={`total-${product}-${category}`}
                                className={`text-center font-semibold ${getValueColorClass(value)} ${index < orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : ''}`}
                              >
                                {formatValue(value)}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                      
                      {shouldShowBiodieselTotal && (
                        <TableRow className="bg-gray-200 border-t-[1px] border-black border-b-[1px] border-gray-300">
                          <TableCell className="sticky left-0 bg-gray-200 font-bold border-r-[1px] border-black">
                            Biodiesel - Total
                          </TableCell>
                          
                          {exposureData.map(monthData => 
                            orderedVisibleCategories.map((category, index) => {
                              let value = 0;
                              
                              if (category === 'Physical') {
                                value = calculateProductGroupTotal(monthData.products, BIODIESEL_PRODUCTS, 'physical');
                              } else if (category === 'Pricing') {
                                value = calculateProductGroupTotal(monthData.products, BIODIESEL_PRODUCTS, 'pricing');
                              } else if (category === 'Paper') {
                                value = calculateProductGroupTotal(monthData.products, BIODIESEL_PRODUCTS, 'paper');
                              } else if (category === 'Exposure') {
                                value = calculateProductGroupTotal(monthData.products, BIODIESEL_PRODUCTS, 'netExposure');
                              }
                              
                              return (
                                <TableCell 
                                  key={`${monthData.month}-biodiesel-total-${category}`}
                                  className={`text-center font-bold ${getValueColorClass(value)} ${index === orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : 'border-r-[1px] border-black'}`}
                                >
                                  {formatValue(value)}
                                </TableCell>
                              );
                            })
                          )}
                          
                          {shouldShowTotalRow && orderedVisibleCategories.map((category, index) => {
                            let value = 0;
                            
                            if (category === 'Exposure') {
                              value = groupGrandTotals.biodieselTotal;
                            } else {
                              value = BIODIESEL_PRODUCTS.reduce((total, product) => {
                                if (grandTotals.productTotals[product]) {
                                  let categoryValue = 0;
                                  
                                  if (category === 'Physical') {
                                    categoryValue = grandTotals.productTotals[product].physical;
                                  } else if (category === 'Pricing') {
                                    categoryValue = grandTotals.productTotals[product].pricing;
                                  } else if (category === 'Paper') {
                                    categoryValue = grandTotals.productTotals[product].paper;
                                  }
                                  
                                  return total + categoryValue;
                                }
                                return total;
                              }, 0);
                            }
                            
                            return (
                              <TableCell 
                                key={`total-biodiesel-${category}`}
                                className={`text-center font-bold ${getValueColorClass(value)} ${index < orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : ''}`}
                              >
                                {formatValue(value)}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      )}
                      
                      {shouldShowPricingInstrumentTotal && (
                        <TableRow className="bg-gray-200 border-b-[1px] border-gray-300">
                          <TableCell className="sticky left-0 bg-gray-200 font-bold border-r-[1px] border-black">
                            Pricing Instruments - Total
                          </TableCell>
                          
                          {exposureData.map(monthData => 
                            orderedVisibleCategories.map((category, index) => {
                              let value = 0;
                              
                              if (category === 'Physical') {
                                value = calculateProductGroupTotal(monthData.products, PRICING_INSTRUMENT_PRODUCTS, 'physical');
                              } else if (category === 'Pricing') {
                                value = calculateProductGroupTotal(monthData.products, PRICING_INSTRUMENT_PRODUCTS, 'pricing');
                              } else if (category === 'Paper') {
                                value = calculateProductGroupTotal(monthData.products, PRICING_INSTRUMENT_PRODUCTS, 'paper');
                              } else if (category === 'Exposure') {
                                value = calculateProductGroupTotal(monthData.products, PRICING_INSTRUMENT_PRODUCTS, 'netExposure');
                              }
                              
                              return (
                                <TableCell 
                                  key={`${monthData.month}-pricing-instruments-total-${category}`}
                                  className={`text-center font-bold ${getValueColorClass(value)} ${index === orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : 'border-r-[1px] border-black'}`}
                                >
                                  {formatValue(value)}
                                </TableCell>
                              );
                            })
                          )}
                          
                          {shouldShowTotalRow && orderedVisibleCategories.map((category, index) => {
                            let value = 0;
                            
                            if (category === 'Exposure') {
                              value = groupGrandTotals.pricingInstrumentTotal;
                            } else {
                              value = PRICING_INSTRUMENT_PRODUCTS.reduce((total, product) => {
                                if (grandTotals.productTotals[product]) {
                                  let categoryValue = 0;
                                  
                                  if (category === 'Physical') {
                                    categoryValue = grandTotals.productTotals[product].physical;
                                  } else if (category === 'Pricing') {
                                    categoryValue = grandTotals.productTotals[product].pricing;
                                  } else if (category === 'Paper') {
                                    categoryValue = grandTotals.productTotals[product].paper;
                                  }
                                  
                                  return total + categoryValue;
                                }
                                return total;
                              }, 0);
                            }
                            
                            return (
                              <TableCell 
                                key={`total-pricing-instruments-${category}`}
                                className={`text-center font-bold ${getValueColorClass(value)} ${index < orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : ''}`}
                              >
                                {formatValue(value)}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      )}
                      
                      {shouldShowTotalRow && (
                        <TableRow className="bg-gray-700 text-white border-t-[1px] border-black">
                          <TableCell className="sticky left-0 bg-gray-700 font-bold border-r-[1px] border-black">
                            Total
                          </TableCell>
                          
                          {exposureData.map(monthData => 
                            orderedVisibleCategories.map((category, index) => {
                              let value = 0;
                              
                              if (category === 'Physical') {
                                value = monthData.totals.physical;
                              } else if (category === 'Pricing') {
                                value = monthData.totals.pricing;
                              } else if (category === 'Paper') {
                                value = monthData.totals.paper;
                              } else if (category === 'Exposure') {
                                value = monthData.totals.netExposure;
                              }
                              
                              return (
                                <TableCell 
                                  key={`${monthData.month}-total-${category}`}
                                  className={`text-center ${category === 'Exposure' ? 'font-bold' : ''} ${value > 0 ? 'text-green-300' : value < 0 ? 'text-red-300' : 'text-gray-300'} ${index === orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : 'border-r-[1px] border-black'}`}
                                >
                                  {formatValue(value)}
                                </TableCell>
                              );
                            })
                          )}
                          
                          {shouldShowTotalRow && orderedVisibleCategories.map((category, index) => {
                            let value = 0;
                            
                            if (category === 'Physical') {
                              value = grandTotals.totals.physical;
                            } else if (category === 'Pricing') {
                              value = grandTotals.totals.pricing;
                            } else if (category === 'Paper') {
                              value = grandTotals.totals.paper;
                            } else if (category === 'Exposure') {
                              value = grandTotals.totals.netExposure;
                            }
                            
                            return (
                              <TableCell 
                                key={`grand-total-${category}`}
                                className={`text-center font-bold ${value > 0 ? 'text-green-300' : value < 0 ? 'text-red-300' : 'text-gray-300'} ${index < orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : ''}`}
                              >
                                {formatValue(value)}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      )}
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

