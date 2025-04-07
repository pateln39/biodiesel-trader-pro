
import React, { useMemo, useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Helmet } from 'react-helmet-async';
import { validateAndParsePricingFormula } from '@/utils/formulaUtils';
import { getNextMonths, formatMonthCode } from '@/utils/dateUtils';
import TableLoadingState from '@/components/trades/TableLoadingState';
import TableErrorState from '@/components/trades/TableErrorState';
import { Checkbox } from "@/components/ui/checkbox";
import { mapProductToCanonical, parsePaperInstrument, formatExposureTableProduct, isPricingInstrument, shouldUseSpecialBackground, getExposureProductBackgroundClass } from '@/utils/productMapping';
import { calculateNetExposure } from '@/utils/tradeUtils';
import { calculateTradeExposures } from '@/utils/exposureUtils';

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
      const {
        data,
        error
      } = await supabase.from('pricing_instruments').select('id, display_name, instrument_code, is_active').eq('is_active', true);
      if (error) throw error;
      return data || [];
    }
  });
};

const calculateProductGroupTotal = (monthProducts: ProductExposure, productGroup: string[], category: keyof ExposureData = 'netExposure'): number => {
  return productGroup.reduce((total, product) => {
    if (monthProducts[product]) {
      return total + (monthProducts[product][category] || 0);
    }
    return total;
  }, 0);
};

const getValueColorClass = (value: number): string => {
  if (value > 0) return 'text-green-400';
  if (value < 0) return 'text-red-400';
  return 'text-gray-500';
};

const formatValue = (value: number): string | React.ReactElement => {
  if (value === 0) return <span className="text-brand-lime text-xs">-</span>;
  return `${value >= 0 ? '+' : ''}${value.toLocaleString()}`;
};

const ExposurePage = () => {
  const [periods] = React.useState<string[]>(getNextMonths(13));
  const [visibleCategories, setVisibleCategories] = useState<string[]>(CATEGORY_ORDER);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const {
    data: pricingInstruments = [],
    isLoading: instrumentsLoading
  } = usePricingInstruments();

  const ALLOWED_PRODUCTS = useMemo(() => {
    const instrumentProducts = pricingInstruments.map((inst: PricingInstrument) => mapProductToCanonical(inst.display_name));
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
    data: tradeData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['exposure-data'],
    queryFn: async () => {
      console.log('Fetching exposure data...');
      
      const {
        data: physicalTradeLegs,
        error: physicalError
      } = await supabase.from('trade_legs').select(`
          id,
          leg_reference,
          buy_sell,
          product,
          quantity,
          tolerance,
          pricing_formula,
          mtm_formula,
          trading_period,
          pricing_period_start,
          loading_period_start,
          pricing_type,
          efp_designated_month,
          efp_agreed_status,
          parent_trade_id
        `).order('trading_period', {
        ascending: true
      });
      
      if (physicalError) {
        console.error('Error fetching physical trade legs:', physicalError);
        throw physicalError;
      }
      
      console.log(`Fetched ${physicalTradeLegs?.length || 0} physical trade legs`);
      
      const parentTradeIds = [...new Set(physicalTradeLegs?.map(leg => leg.parent_trade_id) || [])];
      console.log(`Found ${parentTradeIds.length} unique parent trade IDs`);
      
      const {
        data: parentTrades,
        error: parentTradeError
      } = await supabase
        .from('parent_trades')
        .select('*')
        .in('id', parentTradeIds);
      
      if (parentTradeError) {
        console.error('Error fetching parent trades:', parentTradeError);
        throw parentTradeError;
      }
      
      console.log(`Fetched ${parentTrades?.length || 0} parent trades`);
      
      const {
        data: paperTradeLegs,
        error: paperError
      } = await supabase.from('paper_trade_legs').select(`
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
        `).order('period', {
        ascending: true
      });
      
      if (paperError) {
        console.error('Error fetching paper trade legs:', paperError);
        throw paperError;
      }
      
      console.log(`Fetched ${paperTradeLegs?.length || 0} paper trade legs`);
      
      const mappedTrades = parentTrades?.map(parent => {
        const legs = physicalTradeLegs?.filter(leg => leg.parent_trade_id === parent.id) || [];
        
        return {
          id: parent.id,
          tradeReference: parent.trade_reference,
          tradeType: parent.trade_type as 'physical' | 'paper' | 'fx',
          createdAt: new Date(parent.created_at),
          updatedAt: new Date(parent.updated_at),
          physicalType: parent.physical_type as 'spot' | 'term',
          counterparty: parent.counterparty,
          legs: legs.map(leg => ({
            id: leg.id,
            parentTradeId: leg.parent_trade_id,
            legReference: leg.leg_reference,
            buySell: leg.buy_sell as 'buy' | 'sell',
            product: leg.product,
            quantity: leg.quantity,
            tolerance: leg.tolerance || 0,
            loadingPeriodStart: leg.loading_period_start ? new Date(leg.loading_period_start) : undefined,
            pricingPeriodStart: leg.pricing_period_start ? new Date(leg.pricing_period_start) : undefined,
            pricingType: leg.pricing_type as 'standard' | 'efp' || 'standard',
            formula: validateAndParsePricingFormula(leg.pricing_formula),
            efpDesignatedMonth: leg.efp_designated_month,
            efpAgreedStatus: leg.efp_agreed_status
          }))
        };
      }) || [];
      
      console.log(`Mapped ${mappedTrades.length} physical trades with legs`);
      
      return {
        physicalTrades: mappedTrades,
        physicalTradeLegs: physicalTradeLegs || [],
        paperTradeLegs: paperTradeLegs || []
      };
    }
  });
  
  const exposureData = useMemo(() => {
    console.log('Calculating exposure data from trades...');
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
      if (tradeData.physicalTrades && tradeData.physicalTrades.length > 0) {
        console.log(`Using calculateTradeExposures for ${tradeData.physicalTrades.length} physical trades`);
        const physicalResult = calculateTradeExposures(tradeData.physicalTrades);
        
        Object.entries(physicalResult.monthlyPhysical).forEach(([month, products]) => {
          if (periods.includes(month)) {
            Object.entries(products).forEach(([product, volume]) => {
              const canonicalProduct = mapProductToCanonical(product);
              allProductsFound.add(canonicalProduct);
              
              if (!exposuresByMonth[month][canonicalProduct]) {
                exposuresByMonth[month][canonicalProduct] = {
                  physical: 0,
                  pricing: 0,
                  paper: 0,
                  netExposure: 0
                };
              }
              
              exposuresByMonth[month][canonicalProduct].physical += volume;
              console.log(`Added ${volume} to physical exposure for ${canonicalProduct} in ${month}`);
            });
          }
        });
        
        Object.entries(physicalResult.monthlyPricing).forEach(([month, products]) => {
          if (periods.includes(month)) {
            Object.entries(products).forEach(([product, volume]) => {
              const canonicalProduct = mapProductToCanonical(product);
              allProductsFound.add(canonicalProduct);
              
              if (!exposuresByMonth[month][canonicalProduct]) {
                exposuresByMonth[month][canonicalProduct] = {
                  physical: 0,
                  pricing: 0,
                  paper: 0,
                  netExposure: 0
                };
              }
              
              exposuresByMonth[month][canonicalProduct].pricing += volume;
              console.log(`Added ${volume} to pricing exposure for ${canonicalProduct} in ${month}`);
            });
          }
        });
      }
      
      if (tradeData.paperTradeLegs && tradeData.paperTradeLegs.length > 0) {
        paperTradeLegs.forEach(leg => {
          const month = leg.period || leg.trading_period || '';
          if (!month || !periods.includes(month)) {
            return;
          }
          if (leg.instrument) {
            const {
              baseProduct,
              oppositeProduct,
              relationshipType
            } = parsePaperInstrument(leg.instrument);
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
                  if (!exposuresData.pricing || typeof exposuresData.pricing !== 'object' || !exposuresData.pricing[prodName]) {
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
                    if (!mtmExposures.pricing || !(prodName in (mtmExposures.pricing || {}))) {
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
                    if (!mtmFormula.exposures.pricing || !(pBaseProduct in (mtmFormula.exposures.pricing || {}))) {
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
                if (!exposuresData.pricing || typeof exposuresData.pricing !== 'object' || !exposuresData.pricing[prodName]) {
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
                  if (!mtmExposures.pricing || !(prodName in (mtmExposures.pricing || {}))) {
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
                  if (!mtmFormula.exposures.pricing || !(pBaseProduct in (mtmFormula.exposures.pricing || {}))) {
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
      Object.entries(exposuresByMonth[month]).forEach(([product, exposure]) => {
        exposure.netExposure = calculateNetExposure(exposure.physical, exposure.pricing);
      });
    });
    
    const monthlyExposures: MonthlyExposure[] = periods.map(month => {
      const monthData = exposuresByMonth[month];
      const productsData: Record<string, ExposureData> = {};
      const totals: ExposureData = {
        physical: 0,
        pricing: 0,
        paper: 0,
        netExposure: 0
      };

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
    const totals: ExposureData = {
      physical: 0,
      pricing: 0,
      paper: 0,
      netExposure: 0
    };
    const productTotals: Record<string, ExposureData> = {};
    allProducts.forEach(product => {
      productTotals[product] = {
        physical: 0,
        pricing: 0,
        paper: 0,
        netExposure: 0
      };
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
          productTotals[product].netExposure = calculateNetExposure(productTotals[product].physical, productTotals[product].pricing);
        }
      });
    });

    return {
      totals,
      productTotals
    };
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
    if (category === 'Physical' && (product === 'ICE GASOIL FUTURES (EFP)' || product === 'ICE GASOIL FUTURES' || product === 'EFP')) {
      return false;
    }
    
    if (category === 'Paper' && (product === 'ICE GASOIL FUTURES (EFP)' || product === 'EFP')) {
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
              </div>
            </div>
          </CardContent>
        </Card>
        
      </div>
    </Layout>
  );
};

export default ExposurePage;
