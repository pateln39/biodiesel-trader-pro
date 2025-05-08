
import React, { useMemo, useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { toast } from 'sonner';
import { exportExposureToExcel, exportExposureByTrade } from '@/utils/excelExportUtils';

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
      const {
        data: physicalTradeLegs,
        error: physicalError
      } = await supabase.from('trade_legs').select(`
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
        `).order('trading_period', {
        ascending: true
      });
      if (physicalError) throw physicalError;

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
      const {
        physicalTradeLegs,
        paperTradeLegs
      } = tradeData;

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

          let pricingExposureMonth = '';
          if (leg.pricing_type === 'efp' && leg.efp_designated_month) {
            pricingExposureMonth = leg.efp_designated_month;
          } else if (leg.trading_period) {
            pricingExposureMonth = leg.trading_period;
          } else if (leg.pricing_period_start) {
            pricingExposureMonth = formatMonthCode(new Date(leg.pricing_period_start));
          }

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

          const pricingFormula = validateAndParsePricingFormula(leg.pricing_formula);

          if (pricingFormula.monthlyDistribution) {
            Object.entries(pricingFormula.monthlyDistribution).forEach(([instrument, monthlyValues]) => {
              const canonicalInstrument = mapProductToCanonical(instrument);
              allProductsFound.add(canonicalInstrument);
              Object.entries(monthlyValues).forEach(([monthCode, value]) => {
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
          } else if (pricingExposureMonth && periods.includes(pricingExposureMonth) && pricingFormula.exposures && pricingFormula.exposures.pricing) {
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

  const handleExportExcel = () => {
    try {
      exportExposureToExcel(
        exposureData,
        orderedVisibleCategories,
        filteredProducts,
        grandTotals,
        groupGrandTotals,
        BIODIESEL_PRODUCTS,
        PRICING_INSTRUMENT_PRODUCTS
      );
      toast.success("Export successful", {
        description: "Exposure report has been downloaded"
      });
    } catch (error) {
      console.error('[EXPOSURE] Export error:', error);
      toast.error("Export failed", {
        description: "There was an error exporting the exposure report"
      });
    }
  };

  const handleExportByTrade = async () => {
    try {
      await exportExposureByTrade();
      toast.success("Export successful", {
        description: "Exposure by trade report has been downloaded"
      });
    } catch (error) {
      console.error('[EXPOSURE] Export by trade error:', error);
      toast.error("Export failed", {
        description: "There was an error exporting the exposure by trade report"
      });
    }
  };

  return <Layout>
      <Helmet>
        <title>Exposure Reporting</title>
      </Helmet>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Exposure Reporting</h1>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={handleExportByTrade}>
              <Download className="mr-2 h-3 w-3" /> Export by Trade
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel}>
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
                  {exposureCategories.map(category => <div key={category} className="flex items-center space-x-2">
                      <Checkbox id={`category-${category}`} checked={visibleCategories.includes(category)} onCheckedChange={() => toggleCategory(category)} />
                      <label htmlFor={`category-${category}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {category}
                      </label>
                    </div>)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoadingData ? <Card>
            <CardContent className="pt-4">
              <TableLoadingState />
            </CardContent>
          </Card> : error ? <Card>
            <CardContent className="pt-4">
              <TableErrorState error={error as Error} onRetry={refetch} />
            </CardContent>
          </Card> : exposureData.length === 0 || filteredProducts.length === 0 ? <Card>
            <CardContent className="pt-4">
              <div className="flex justify-center items-center h-40">
                <p className="text-muted-foreground">No exposure data found.</p>
              </div>
            </CardContent>
          </Card> : <Card className="overflow-hidden">
            <CardContent className="p-0 overflow-auto">
              <ScrollArea className="w-full" orientation="horizontal">
                <div className="min-w-[1800px]" style={{
                  width: "max-content",
                  minWidth: "100%"
                }}>
                  <Table className="border-collapse">
                    <TableHeader>
                      <TableRow className="bg-muted/50 border-b-[1px] border-black">
                        <TableHead rowSpan={2} className="border-r-[1px] border-b-[1px] border-black text-left p-1 font-bold text-white text-xs bg-brand-navy sticky left-0 z-10">
                          Month
                        </TableHead>
                        {orderedVisibleCategories.map((category, catIndex) => {
                      let colSpan = filteredProducts.filter(product => shouldShowProductInCategory(product, category)).length;
                      if (category === 'Exposure') {
                        if (shouldShowPricingInstrumentTotal) colSpan += 1;
                        if (shouldShowTotalRow) colSpan += 1;
                      }
                      return <TableHead key={category} colSpan={colSpan} className={`text-center p-1 font-bold text-white text-xs border-b-[1px] ${catIndex < orderedVisibleCategories.length - 1 ? 'border-r-[1px]' : ''} border-black`}>
                              {category}
                            </TableHead>;
                    })}
                      </TableRow>
                      
                      <TableRow className="bg-muted/30 border-b-[1px] border-black">
                        {orderedVisibleCategories.flatMap((category, catIndex) => {
                      const categoryProducts = filteredProducts.filter(product => shouldShowProductInCategory(product, category));
                      if (category === 'Exposure') {
                        const ucomeIndex = categoryProducts.findIndex(p => p === 'Argus UCOME');
                        const headers = [];
                        categoryProducts.forEach((product, index) => {
                          headers.push(<TableHead key={`${category}-${product}`} className={`text-right p-1 text-xs whitespace-nowrap border-t-0 border-r-[1px] border-black ${getExposureProductBackgroundClass(product)} text-white font-bold`}>
                                  {formatExposureTableProduct(product)}
                                </TableHead>);
                          if (index === ucomeIndex && shouldShowBiodieselTotal) {
                            headers.push(<TableHead key={`${category}-biodiesel-total`} className={`text-right p-1 text-xs whitespace-nowrap border-t-0 border-r-[1px] border-black ${getCategoryColorClass(category)} text-white font-bold`}>
                                    Total Biodiesel
                                  </TableHead>);
                          }
                        });
                        if (shouldShowPricingInstrumentTotal) {
                          headers.push(<TableHead key={`${category}-pricing-instrument-total`} className={`text-right p-1 text-xs whitespace-nowrap border-t-0 border-r-[1px] border-black ${getExposureProductBackgroundClass('', false, true)} text-white font-bold`}>
                                  Total Pricing Instrument
                                </TableHead>);
                        }
                        if (shouldShowTotalRow) {
                          headers.push(<TableHead key={`${category}-total-row`} className={`text-right p-1 text-xs whitespace-nowrap border-t-0 ${getExposureProductBackgroundClass('', true)} ${catIndex < orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : ''} text-white font-bold`}>
                                  Total Row
                                </TableHead>);
                        }
                        return headers;
                      } else {
                        return categoryProducts.map((product, index) => <TableHead key={`${category}-${product}`} className={`text-right p-1 text-xs whitespace-nowrap border-t-0 ${getCategoryColorClass(category)} ${index === categoryProducts.length - 1 && catIndex < orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : ''} ${index > 0 ? 'border-l-[0px]' : ''} text-white font-bold`}>
                                {formatExposureTableProduct(product)}
                              </TableHead>);
                      }
                    })}
                      </TableRow>
                    </TableHeader>
                    
                    <TableBody>
                      {exposureData.map(monthData => <TableRow key={monthData.month} className="bg-brand-navy">
                          <TableCell className="font-medium border-r-[1px] border-black text-xs sticky left-0 z-10 bg-brand-navy text-white">
                            {monthData.month}
                          </TableCell>
                          
                          {orderedVisibleCategories.map((category, catIndex) => {
                      const categoryProducts = filteredProducts.filter(product => shouldShowProductInCategory(product, category));
                      const cells = [];
                      if (category === 'Physical') {
                        categoryProducts.forEach((product, index) => {
                          const productData = monthData.products[product] || {
                            physical: 0,
                            pricing: 0,
                            paper: 0,
                            netExposure: 0
                          };
                          cells.push(
                            <TableCell 
                              key={`${monthData.month}-physical-${product}`} 
                              className={`text-right text-xs p-1 text-white font-bold bg-brand-navy ${getValueColorClass(productData.physical)} ${index === categoryProducts.length - 1 && catIndex < orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : ''}`}
                            >
                              {typeof formatValue(productData.physical) === 'string' 
                                ? formatValue(productData.physical) 
                                : formatValue(productData.physical)}
                            </TableCell>
                          );
                        });
                      } else if (category === 'Pricing') {
                        categoryProducts.forEach((product, index) => {
                          const productData = monthData.products[product] || {
                            physical: 0,
                            pricing: 0,
                            paper: 0,
                            netExposure: 0
                          };
                          cells.push(
                            <TableCell 
                              key={`${monthData.month}-pricing-${product}`} 
                              className={`text-right text-xs p-1 text-white font-bold bg-brand-navy ${getValueColorClass(productData.pricing)} ${index === categoryProducts.length - 1 && catIndex < orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : ''}`}
                            >
                              {typeof formatValue(productData.pricing) === 'string' 
                                ? formatValue(productData.pricing) 
                                : formatValue(productData.pricing)}
                            </TableCell>
                          );
                        });
                      } else if (category === 'Paper') {
                        categoryProducts.forEach((product, index) => {
                          const productData = monthData.products[product] || {
                            physical: 0,
                            pricing: 0,
                            paper: 0,
                            netExposure: 0
                          };
                          cells.push(
                            <TableCell 
                              key={`${monthData.month}-paper-${product}`} 
                              className={`text-right text-xs p-1 text-white font-bold bg-brand-navy ${getValueColorClass(productData.paper)} ${index === categoryProducts.length - 1 && catIndex < orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : ''}`}
                            >
                              {typeof formatValue(productData.paper) === 'string' 
                                ? formatValue(productData.paper) 
                                : formatValue(productData.paper)}
                            </TableCell>
                          );
                        });
                      } else if (category === 'Exposure') {
                        const ucomeIndex = categoryProducts.findIndex(p => p === 'Argus UCOME');
                        categoryProducts.forEach((product, index) => {
                          const productData = monthData.products[product] || {
                            physical: 0,
                            pricing: 0,
                            paper: 0,
                            netExposure: 0
                          };
                          cells.push(
                            <TableCell 
                              key={`${monthData.month}-net-${product}`} 
                              className={`text-right text-xs p-1 font-medium border-r-[1px] border-black ${getValueColorClass(productData.netExposure)} bg-brand-navy`}
                            >
                              {typeof formatValue(productData.netExposure) === 'string' 
                                ? formatValue(productData.netExposure) 
                                : formatValue(productData.netExposure)}
                            </TableCell>
                          );
                          if (index === ucomeIndex && shouldShowBiodieselTotal) {
                            const biodieselTotal = calculateProductGroupTotal(monthData.products, BIODIESEL_PRODUCTS);
                            cells.push(
                              <TableCell 
                                key={`${monthData.month}-biodiesel-total`} 
                                className={`text-right text-xs p-1 font-medium border-r-[1px] border-black ${getValueColorClass(biodieselTotal)} bg-brand-navy`}
                              >
                                {typeof formatValue(biodieselTotal) === 'string' 
                                  ? formatValue(biodieselTotal) 
                                  : formatValue(biodieselTotal)}
                              </TableCell>
                            );
                          }
                        });
                        if (shouldShowPricingInstrumentTotal) {
                          const pricingInstrumentTotal = calculateProductGroupTotal(monthData.products, PRICING_INSTRUMENT_PRODUCTS);
                          cells.push(
                            <TableCell 
                              key={`${monthData.month}-pricing-instrument-total`} 
                              className={`text-right text-xs p-1 font-medium border-r-[1px] border-black ${getValueColorClass(pricingInstrumentTotal)} bg-brand-navy`}
                            >
                              {typeof formatValue(pricingInstrumentTotal) === 'string' 
                                ? formatValue(pricingInstrumentTotal) 
                                : formatValue(pricingInstrumentTotal)}
                            </TableCell>
                          );
                        }
                        if (shouldShowTotalRow) {
                          const biodieselTotal = calculateProductGroupTotal(monthData.products, BIODIESEL_PRODUCTS);
                          const pricingInstrumentTotal = calculateProductGroupTotal(monthData.products, PRICING_INSTRUMENT_PRODUCTS);
                          const totalRow = biodieselTotal + pricingInstrumentTotal;
                          cells.push(
                            <TableCell 
                              key={`${monthData.month}-total-row`} 
                              className={`text-right text-xs p-1 font-medium ${getValueColorClass(totalRow)} bg-brand-navy ${catIndex < orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : ''}`}
                            >
                              {typeof formatValue(totalRow) === 'string' 
                                ? formatValue(totalRow) 
                                : formatValue(totalRow)}
                            </TableCell>
                          );
                        }
                      }
                      return cells;
                    })}
                        </TableRow>)}
                      
                      <TableRow className="bg-gray-700 text-white font-bold border-t-[1px] border-black">
                        <TableCell className="border-r-[1px] border-black text-xs p-1 sticky left-0 bg-gray-700 z-10 text-white">
                          Total
                        </TableCell>
                        
                        {orderedVisibleCategories.map((category, catIndex) => {
                      const categoryProducts = filteredProducts.filter(product => shouldShowProductInCategory(product, category));
                      const cells = [];
                      if (category === 'Physical') {
                        categoryProducts.forEach((product, index) => {
                          cells.push(
                            <TableCell 
                              key={`total-physical-${product}`} 
                              className={`text-right text-xs p-1 ${grandTotals.productTotals[product]?.physical > 0 ? 'text-green-300' : grandTotals.productTotals[product]?.physical < 0 ? 'text-red-300' : 'text-gray-300'} font-bold ${index === categoryProducts.length - 1 && catIndex < orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : ''}`}
                            >
                              {typeof formatValue(grandTotals.productTotals[product]?.physical || 0) === 'string' 
                                ? formatValue(grandTotals.productTotals[product]?.physical || 0) 
                                : formatValue(grandTotals.productTotals[product]?.physical || 0)}
                            </TableCell>
                          );
                        });
                      } else if (category === 'Pricing') {
                        categoryProducts.forEach((product, index) => {
                          cells.push(
                            <TableCell 
                              key={`total-pricing-${product}`} 
                              className={`text-right text-xs p-1 ${grandTotals.productTotals[product]?.pricing > 0 ? 'text-green-300' : grandTotals.productTotals[product]?.pricing < 0 ? 'text-red-300' : 'text-gray-300'} font-bold ${index === categoryProducts.length - 1 && catIndex < orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : ''}`}
                            >
                              {typeof formatValue(grandTotals.productTotals[product]?.pricing || 0) === 'string' 
                                ? formatValue(grandTotals.productTotals[product]?.pricing || 0) 
                                : formatValue(grandTotals.productTotals[product]?.pricing || 0)}
                            </TableCell>
                          );
                        });
                      } else if (category === 'Paper') {
                        categoryProducts.forEach((product, index) => {
                          cells.push(
                            <TableCell 
                              key={`total-paper-${product}`} 
                              className={`text-right text-xs p-1 ${grandTotals.productTotals[product]?.paper > 0 ? 'text-green-300' : grandTotals.productTotals[product]?.paper < 0 ? 'text-red-300' : 'text-gray-300'} font-bold ${index === categoryProducts.length - 1 && catIndex < orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : ''}`}
                            >
                              {typeof formatValue(grandTotals.productTotals[product]?.paper || 0) === 'string' 
                                ? formatValue(grandTotals.productTotals[product]?.paper || 0) 
                                : formatValue(grandTotals.productTotals[product]?.paper || 0)}
                            </TableCell>
                          );
                        });
                      } else if (category === 'Exposure') {
                        const ucomeIndex = categoryProducts.findIndex(p => p === 'Argus UCOME');
                        categoryProducts.forEach((product, index) => {
                          cells.push(
                            <TableCell 
                              key={`total-net-${product}`} 
                              className={`text-right text-xs p-1 border-r-[1px] border-black ${grandTotals.productTotals[product]?.netExposure > 0 ? 'text-green-300' : grandTotals.productTotals[product]?.netExposure < 0 ? 'text-red-300' : 'text-gray-300'} font-bold`}
                            >
                              {typeof formatValue(grandTotals.productTotals[product]?.netExposure || 0) === 'string' 
                                ? formatValue(grandTotals.productTotals[product]?.netExposure || 0) 
                                : formatValue(grandTotals.productTotals[product]?.netExposure || 0)}
                            </TableCell>
                          );
                          if (index === ucomeIndex && shouldShowBiodieselTotal) {
                            cells.push(
                              <TableCell 
                                key={`total-biodiesel-total`} 
                                className={`text-right text-xs p-1 border-r-[1px] border-black ${groupGrandTotals.biodieselTotal > 0 ? 'text-green-300' : groupGrandTotals.biodieselTotal < 0 ? 'text-red-300' : 'text-gray-300'} font-bold bg-green-900`}
                              >
                                {typeof formatValue(groupGrandTotals.biodieselTotal) === 'string' 
                                  ? formatValue(groupGrandTotals.biodieselTotal) 
                                  : formatValue(groupGrandTotals.biodieselTotal)}
                              </TableCell>
                            );
                          }
                        });
                        if (shouldShowPricingInstrumentTotal) {
                          cells.push(
                            <TableCell 
                              key={`total-pricing-instrument-total`} 
                              className={`text-right text-xs p-1 border-r-[1px] border-black ${groupGrandTotals.pricingInstrumentTotal > 0 ? 'text-green-300' : groupGrandTotals.pricingInstrumentTotal < 0 ? 'text-red-300' : 'text-gray-300'} font-bold bg-blue-900`}
                            >
                              {typeof formatValue(groupGrandTotals.pricingInstrumentTotal) === 'string' 
                                ? formatValue(groupGrandTotals.pricingInstrumentTotal) 
                                : formatValue(groupGrandTotals.pricingInstrumentTotal)}
                            </TableCell>
                          );
                        }
                        if (shouldShowTotalRow) {
                          cells.push(
                            <TableCell 
                              key={`total-total-row`} 
                              className={`text-right text-xs p-1 ${groupGrandTotals.totalRow > 0 ? 'text-green-300' : groupGrandTotals.totalRow < 0 ? 'text-red-300' : 'text-gray-300'} font-bold bg-gray-800 ${catIndex < orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : ''}`}
                            >
                              {typeof formatValue(groupGrandTotals.totalRow) === 'string' 
                                ? formatValue(groupGrandTotals.totalRow) 
                                : formatValue(groupGrandTotals.totalRow)}
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
              </ScrollArea>
            </CardContent>
          </Card>}
      </div>
    </Layout>;
};

export default ExposurePage;
