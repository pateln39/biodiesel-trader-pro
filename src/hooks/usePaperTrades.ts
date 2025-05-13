import { useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BuySell, Product } from '@/types/trade';
import { PaperTrade, PaperTradeLeg } from '@/types/paper';
import { setupPaperTradeSubscriptions } from '@/utils/paperTradeSubscriptionUtils';
import { generateLegReference, generateInstrumentName } from '@/utils/tradeUtils';
import { mapProductToCanonical } from '@/utils/productMapping';
import { buildCompleteExposuresObject } from '@/utils/paperTrade';

// Import these from the paperTrade utility module
import { getMonthDates, formatDateForDatabase } from '@/utils/paperTrade';
import { countBusinessDays } from '@/utils/dateUtils';

const debounce = (fn: Function, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function(...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
};

// Create a new function to calculate daily distribution
const calculateDailyDistribution = (
  period: string,
  product: string,
  quantity: number,
  buySell: BuySell
): Record<string, Record<string, number>> => {
  const monthDates = getMonthDates(period);
  if (!monthDates) {
    return {};
  }
  
  const { startDate, endDate } = monthDates;
  const businessDaysInMonth = countBusinessDays(startDate, endDate);
  
  if (businessDaysInMonth === 0) {
    return {};
  }
  
  const dailyDistribution: Record<string, Record<string, number>> = {};
  const buySellMultiplier = buySell === 'buy' ? 1 : -1;
  const exposureValue = quantity * buySellMultiplier;
  const dailyExposure = exposureValue / businessDaysInMonth;
  
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) { // Not weekend
      const dateStr = formatDateForDatabase(currentDate); // Use timezone-safe formatter
      
      if (!dailyDistribution[product]) {
        dailyDistribution[product] = {};
      }
      
      dailyDistribution[product][dateStr] = dailyExposure;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dailyDistribution;
};

export const createPaperTrade = async (
  formData: Partial<PaperTrade>,
  options?: { onSuccess?: () => void }
): Promise<PaperTrade> => {
  try {
    if (!formData.tradeReference) {
      throw new Error('Trade reference is required');
    }
    
    const { data: paperTrade, error: paperTradeError } = await supabase
      .from('paper_trades')
      .insert({
        trade_reference: formData.tradeReference,
        counterparty: formData.broker || 'Paper Trade',
        broker: formData.broker
      })
      .select('id')
      .single();
      
    if (paperTradeError) {
      throw new Error(`Error creating paper trade: ${paperTradeError.message}`);
    }
    
    if (formData.legs && formData.legs.length > 0) {
      for (let i = 0; i < formData.legs.length; i++) {
        const leg = formData.legs[i];
        const legReference = generateLegReference(formData.tradeReference || '', i);
        
        let tradingPeriod = leg.period;
        
        let pricingPeriodStart = null;
        let pricingPeriodEnd = null;
        
        if (tradingPeriod) {
          try {
            // Get the dates using our utility function
            const dates = getMonthDates(tradingPeriod);
            
            if (dates) {
              // Format dates for database storage without timezone issues
              pricingPeriodStart = formatDateForDatabase(dates.startDate);
              pricingPeriodEnd = formatDateForDatabase(dates.endDate);
            }
          } catch (e) {
            console.error('Error parsing period date:', e);
          }
        }
        
        // Build properly normalized exposures object
        const exposures = buildCompleteExposuresObject(leg);
        
        const instrument = generateInstrumentName(
          leg.product, 
          leg.relationshipType,
          leg.rightSide?.product
        );
        
        let mtmFormulaForDb = null;
        if (leg.mtmFormula) {
          mtmFormulaForDb = typeof leg.mtmFormula === 'string' ? JSON.parse(leg.mtmFormula) : {...leg.mtmFormula};
        } else {
          mtmFormulaForDb = {};
        }
        
        if (leg.rightSide) {
          mtmFormulaForDb.rightSide = {
            ...leg.rightSide,
            price: leg.rightSide.price || 0
          };
        }
        
        const formulaForDb = leg.formula ? (typeof leg.formula === 'string' ? JSON.parse(leg.formula) : leg.formula) : null;
        
        const legData = {
          leg_reference: legReference,
          paper_trade_id: paperTrade.id,
          buy_sell: leg.buySell,
          product: mapProductToCanonical(leg.product) as Product,
          quantity: leg.quantity,
          price: leg.price,
          broker: leg.broker || formData.broker,
          period: tradingPeriod,
          trading_period: tradingPeriod,
          formula: formulaForDb,
          mtm_formula: mtmFormulaForDb,
          pricing_period_start: pricingPeriodStart,
          pricing_period_end: pricingPeriodEnd,
          instrument: instrument,
          exposures: exposures
        };
        
        const { error: legError } = await supabase
          .from('paper_trade_legs')
          .insert(legData);
          
        if (legError) {
          throw new Error(`Error creating trade leg: ${legError.message}`);
        }
      }
    }
    
    return {
      id: paperTrade.id,
      tradeReference: formData.tradeReference,
      tradeType: 'paper',
      broker: formData.broker || '',
      counterparty: formData.counterparty || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      buySell: 'buy',
      product: 'UCOME',
      legs: []
    } as PaperTrade;
  } catch (error: any) {
    throw new Error(`Error creating paper trade: ${error.message}`);
  }
};

export const usePaperTrades = () => {
  const queryClient = useQueryClient();
  const realtimeChannelsRef = useRef<{ [key: string]: any }>({});
  const isProcessingRef = useRef<boolean>(false);
  
  const debouncedRefetch = useRef(debounce((fn: Function) => {
    if (isProcessingRef.current) {
      console.log("[PAPER] Skipping paper trade refetch as an operation is in progress");
      return;
    }
    console.log("[PAPER] Executing debounced paper trade refetch");
    fn();
  }, 500)).current;
  
  const { data: paperTrades, isLoading, error, refetch } = useQuery({
    queryKey: ['paper-trades'],
    queryFn: fetchPaperTrades,
    staleTime: 2000,
    refetchOnWindowFocus: false
  });
  
  async function fetchPaperTrades(): Promise<PaperTrade[]> {
    const { data: paperTradesData, error: paperTradesError } = await supabase
      .from('paper_trades')
      .select(`
        id,
        trade_reference,
        counterparty,
        broker,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });
      
    if (paperTradesError) {
      console.error('[PAPER] Error fetching paper trades:', paperTradesError.message);
      throw paperTradesError;
    }
    
    if (!paperTradesData || paperTradesData.length === 0) {
      return [];
    }
    
    console.log(`[PAPER] Found ${paperTradesData.length} paper trades`);
    
    const tradesWithLegs = await Promise.all(
      paperTradesData.map(async (paperTrade) => {
        const { data: legs, error: legsError } = await supabase
          .from('paper_trade_legs')
          .select('*')
          .eq('paper_trade_id', paperTrade.id)
          .order('leg_reference', { ascending: true });
          
        if (legsError) {
          console.error('[PAPER] Error fetching paper trade legs:', legsError.message);
          return {
            id: paperTrade.id,
            tradeReference: paperTrade.trade_reference,
            tradeType: 'paper' as const,
            counterparty: paperTrade.counterparty,
            broker: paperTrade.broker || '',
            createdAt: new Date(paperTrade.created_at),
            updatedAt: new Date(paperTrade.updated_at),
            buySell: 'buy' as BuySell,
            product: 'UCOME' as Product,
            legs: []
          } as PaperTrade;
        }
        
        return {
          id: paperTrade.id,
          tradeReference: paperTrade.trade_reference,
          tradeType: 'paper' as const,
          counterparty: paperTrade.counterparty,
          broker: paperTrade.broker || '',
          createdAt: new Date(paperTrade.created_at),
          updatedAt: new Date(paperTrade.updated_at),
          buySell: 'buy' as BuySell,
          product: 'UCOME' as Product,
          legs: (legs || []).map((leg) => {
            const instrument = leg.instrument || '';
            let relationshipType: 'FP' | 'DIFF' | 'SPREAD' = 'FP';
            
            if (instrument.includes('DIFF')) {
              relationshipType = 'DIFF';
            } else if (instrument.includes('SPREAD')) {
              relationshipType = 'SPREAD';
            }
            
            let rightSide = undefined;
            
            if (leg.mtm_formula && 
                typeof leg.mtm_formula === 'object' && 
                'rightSide' in leg.mtm_formula) {
              rightSide = leg.mtm_formula.rightSide;
            }
            
            let exposuresObj: PaperTradeLeg['exposures'] = {
              physical: {},
              pricing: {},
              paper: {}
            };
            
            if (leg.exposures) {
              if (typeof leg.exposures === 'object') {
                const exposuresData = leg.exposures as Record<string, any>;
                
                if (exposuresData.physical && typeof exposuresData.physical === 'object') {
                  Object.entries(exposuresData.physical).forEach(([key, value]) => {
                    const canonicalProduct = mapProductToCanonical(key);
                    exposuresObj.physical[canonicalProduct] = value as number;
                  });
                  
                  if (!rightSide && Object.keys(exposuresData.physical).length === 2 && relationshipType !== 'FP') {
                    const products = Object.keys(exposuresData.physical);
                    if (products.length === 2) {
                      const mainProduct = mapProductToCanonical(leg.product);
                      const secondProduct = products.find(p => mapProductToCanonical(p) !== mainProduct);
                      
                      if (secondProduct) {
                        rightSide = {
                          product: secondProduct,
                          quantity: exposuresData.physical[secondProduct],
                          period: leg.period || '',
                        };
                      }
                    }
                  }
                }
                
                if (exposuresData.paper && typeof exposuresData.paper === 'object') {
                  Object.entries(exposuresData.paper).forEach(([key, value]) => {
                    const canonicalProduct = mapProductToCanonical(key);
                    exposuresObj.paper[canonicalProduct] = value as number;
                  });
                }
                
                if (exposuresData.pricing && typeof exposuresData.pricing === 'object') {
                  Object.entries(exposuresData.pricing).forEach(([key, value]) => {
                    const canonicalProduct = mapProductToCanonical(key);
                    exposuresObj.pricing[canonicalProduct] = value as number;
                  });
                }
              }
            } 
            if (leg.mtm_formula && typeof leg.mtm_formula === 'object') {
              const mtmData = leg.mtm_formula as Record<string, any>;
              
              if (mtmData.exposures && typeof mtmData.exposures === 'object') {
                const mtmExposures = mtmData.exposures as Record<string, any>;
                
                if (mtmExposures.physical && typeof mtmExposures.physical === 'object') {
                  Object.entries(mtmExposures.physical).forEach(([key, value]) => {
                    const canonicalProduct = mapProductToCanonical(key);
                    exposuresObj.physical[canonicalProduct] = value as number;
                    exposuresObj.paper[canonicalProduct] = value as number;
                  });
                  
                  if (!rightSide && Object.keys(mtmExposures.physical).length === 2 && relationshipType !== 'FP') {
                    const products = Object.keys(mtmExposures.physical);
                    if (products.length === 2) {
                      const mainProduct = mapProductToCanonical(leg.product);
                      const secondProduct = products.find(p => mapProductToCanonical(p) !== mainProduct);
                      
                      if (secondProduct) {
                        rightSide = {
                          product: secondProduct,
                          quantity: mtmExposures.physical[secondProduct],
                          period: leg.period || '',
                        };
                      }
                    }
                  }
                }
                
                if (mtmExposures.pricing && typeof mtmExposures.pricing === 'object') {
                  Object.entries(mtmExposures.pricing).forEach(([key, value]) => {
                    const canonicalProduct = mapProductToCanonical(key);
                    exposuresObj.pricing[canonicalProduct] = value as number;
                  });
                }
              }
            }
            
            if (rightSide && !rightSide.period && leg.period) {
              rightSide.period = leg.period;
            }
            
            if (rightSide && rightSide.price === undefined) {
              rightSide.price = 0;
            }
            
            if (rightSide && rightSide.product) {
              rightSide.product = mapProductToCanonical(rightSide.product);
            }
            
            return {
              id: leg.id,
              paperTradeId: leg.paper_trade_id,
              legReference: leg.leg_reference,
              buySell: leg.buy_sell as BuySell,
              product: mapProductToCanonical(leg.product) as Product,
              quantity: leg.quantity,
              period: leg.period || leg.trading_period || '', 
              price: leg.price || 0,
              broker: leg.broker,
              instrument: leg.instrument,
              relationshipType,
              rightSide: rightSide,
              formula: leg.formula ? (typeof leg.formula === 'string' ? JSON.parse(leg.formula) : leg.formula) : undefined,
              mtmFormula: leg.mtm_formula ? (typeof leg.mtm_formula === 'string' ? JSON.parse(leg.mtm_formula) : leg.mtm_formula) : undefined,
              exposures: exposuresObj
            } as PaperTradeLeg;
          })
        } as PaperTrade;
      })
    );
    
    return tradesWithLegs;
  };
  
  const setupRealtimeSubscriptions = useCallback(() => {
    return setupPaperTradeSubscriptions(
      realtimeChannelsRef,
      isProcessingRef, 
      debouncedRefetch,
      refetch
    );
  }, [refetch, debouncedRefetch]);
  
  useEffect(() => {
    const cleanup = setupRealtimeSubscriptions();
    
    return () => {
      cleanup();
    };
  }, [setupRealtimeSubscriptions]);
  
  const { mutate: createPaperTrade, isPending: isCreating } = useMutation({
    mutationFn: async (tradeData: Partial<PaperTrade>) => {
      if (!tradeData.tradeReference) {
        throw new Error('Trade reference is required');
      }
      
      const { data: paperTrade, error: paperTradeError } = await supabase
        .from('paper_trades')
        .insert({
          trade_reference: tradeData.tradeReference,
          counterparty: tradeData.broker || 'Paper Trade',
          broker: tradeData.broker
        })
        .select('id, trade_reference, counterparty, broker, created_at, updated_at')
        .single();
        
      if (paperTradeError) {
        throw new Error(`Error creating paper trade: ${paperTradeError.message}`);
      }
      
      if (tradeData.legs && tradeData.legs.length > 0) {
        for (let i = 0; i < tradeData.legs.length; i++) {
          const leg = tradeData.legs[i];
          const legReference = generateLegReference(tradeData.tradeReference || '', i);
          
          let tradingPeriod = leg.period;
          
          let pricingPeriodStart = null;
          let pricingPeriodEnd = null;
          
          if (tradingPeriod) {
            try {
              // Get the dates using our utility function
              const dates = getMonthDates(tradingPeriod);
              
              if (dates) {
                // Format dates for database storage without timezone issues
                pricingPeriodStart = formatDateForDatabase(dates.startDate);
                pricingPeriodEnd = formatDateForDatabase(dates.endDate);
              }
            } catch (e) {
              console.error('Error parsing period date:', e);
            }
          }
          
          // Build properly normalized exposures object using our fixed function
          const exposures = buildCompleteExposuresObject(leg);
          
          console.log(`[PAPER] Built exposures for leg ${i}:`, exposures);
          
          const instrument = generateInstrumentName(
            leg.product, 
            leg.relationshipType,
            leg.rightSide?.product
          );
          
          let mtmFormulaForDb = null;
          if (leg.mtmFormula) {
            mtmFormulaForDb = typeof leg.mtmFormula === 'string' ? JSON.parse(leg.mtmFormula) : {...leg.mtmFormula};
          } else {
            mtmFormulaForDb = {};
          }
          
          if (leg.rightSide) {
            mtmFormulaForDb.rightSide = {
              ...leg.rightSide,
              price: leg.rightSide.price || 0
            };
          }
          
          const formulaForDb = leg.formula ? (typeof leg.formula === 'string' ? JSON.parse(leg.formula) : leg.formula) : null;
          
          const legData = {
            leg_reference: legReference,
            paper_trade_id: paperTrade.id,
            buy_sell: leg.buySell,
            product: mapProductToCanonical(leg.product) as Product,
            quantity: leg.quantity,
            price: leg.price,
            broker: leg.broker || tradeData.broker,
            period: tradingPeriod,
            trading_period: tradingPeriod,
            formula: formulaForDb,
            mtm_formula: mtmFormulaForDb,
            pricing_period_start: pricingPeriodStart,
            pricing_period_end: pricingPeriodEnd,
            instrument: instrument,
            exposures: exposures
          };
          
          const { error: legError } = await supabase
            .from('paper_trade_legs')
            .insert(legData);
            
          if (legError) {
            throw new Error(`Error creating trade leg: ${legError.message}`);
          }
        }
      }
      
      return {
        ...tradeData, 
        id: paperTrade.id,
        createdAt: new Date(paperTrade.created_at),
        updatedAt: new Date(paperTrade.updated_at),
        buySell: 'buy' as BuySell,
        product: 'UCOME' as Product,
      } as PaperTrade;
    },
    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['paper-trades'] });
        queryClient.invalidateQueries({ queryKey: ['exposure-data'] });
        toast.success('Paper trade created successfully');
      }, 500);
    },
    onError: (error: Error) => {
      toast.error('Failed to create paper trade', {
        description: error.message
      });
    }
  });
  
  return {
    paperTrades: paperTrades || [],
    isLoading,
    error,
    createPaperTrade,
    isCreating,
    refetchPaperTrades: refetch
  };
};
