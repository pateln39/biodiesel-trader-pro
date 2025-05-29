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
import { PaginationParams, PaginationMeta } from '@/types/pagination';

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

// Function to fetch a single paper trade by ID
export const fetchPaperTradeById = async (tradeId: string): Promise<PaperTrade | null> => {
  console.log(`[PAPER] Fetching single paper trade by ID: ${tradeId}`);
  
  // Fetch the parent trade first
  const { data: parentTrade, error: parentError } = await supabase
    .from('paper_trades')
    .select('*')
    .eq('id', tradeId)
    .single();
    
  if (parentError || !parentTrade) {
    console.error('[PAPER] Error fetching parent trade:', parentError?.message);
    return null;
  }
  
  // Fetch all legs for this trade
  const { data: legData, error: legError } = await supabase
    .from('paper_trade_legs')
    .select('*')
    .eq('paper_trade_id', tradeId)
    .order('created_at', { ascending: false });
    
  if (legError) {
    console.error('[PAPER] Error fetching trade legs:', legError.message);
    return null;
  }
  
  if (!legData || legData.length === 0) {
    console.warn('[PAPER] No legs found for trade:', tradeId);
    return {
      id: parentTrade.id,
      tradeReference: parentTrade.trade_reference,
      tradeType: 'paper' as const,
      counterparty: parentTrade.counterparty,
      broker: parentTrade.broker || '',
      createdAt: new Date(parentTrade.created_at),
      updatedAt: new Date(parentTrade.updated_at),
      buySell: 'buy' as BuySell,
      product: 'UCOME' as Product,
      legs: []
    };
  }
  
  // Process legs
  const processedLegs: PaperTradeLeg[] = legData.map(leg => {
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
      exposures: exposuresObj,
      executionTradeDate: leg.execution_trade_date ? new Date(leg.execution_trade_date) : undefined
    } as PaperTradeLeg;
  });
  
  return {
    id: parentTrade.id,
    tradeReference: parentTrade.trade_reference,
    tradeType: 'paper' as const,
    counterparty: parentTrade.counterparty,
    broker: parentTrade.broker || '',
    createdAt: new Date(parentTrade.created_at),
    updatedAt: new Date(parentTrade.updated_at),
    buySell: processedLegs[0]?.buySell || 'buy' as BuySell,
    product: processedLegs[0]?.product || 'UCOME' as Product,
    legs: processedLegs
  };
};

// Hook to fetch a single paper trade
export const usePaperTrade = (tradeId: string) => {
  return useQuery({
    queryKey: ['paper-trade', tradeId],
    queryFn: () => fetchPaperTradeById(tradeId),
    enabled: !!tradeId,
    staleTime: 5000,
    refetchOnWindowFocus: false
  });
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

export const usePaperTrades = (paginationParams?: PaginationParams) => {
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
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['paper-trades', paginationParams],
    queryFn: () => fetchPaperTrades(paginationParams),
    staleTime: 2000,
    refetchOnWindowFocus: false
  });
  
  async function fetchPaperTrades(params?: PaginationParams): Promise<{ paperTrades: PaperTrade[], pagination: PaginationMeta }> {
    console.log("[PAPER] Fetching paper trades with pagination:", params);
    
    // First, get the total count of LEGS (not parent trades)
    const { count: legCount, error: legCountError } = await supabase
      .from('paper_trade_legs')
      .select('*', { count: 'exact', head: true });
      
    if (legCountError) {
      console.error('[PAPER] Error counting paper trade legs:', legCountError.message);
      throw legCountError;
    }
    
    // Calculate pagination metadata based on leg count
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 15;
    const totalItems = legCount || 0;
    const totalPages = Math.ceil(totalItems / pageSize);
    
    // Calculate range for pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // Fetch LEGS with parent trade info (join query)
    const { data: legData, error: legError } = await supabase
      .from('paper_trade_legs')
      .select(`
        id,
        paper_trade_id,
        leg_reference,
        buy_sell,
        product,
        quantity,
        price,
        period,
        broker,
        instrument,
        trading_period,
        formula,
        mtm_formula,
        pricing_period_start,
        pricing_period_end,
        exposures,
        execution_trade_date,
        created_at,
        updated_at,
        paper_trades(
          id,
          trade_reference,
          counterparty,
          broker,
          created_at,
          updated_at
        )
      `)
      .order('created_at', { ascending: false })
      .range(from, to);
      
    if (legError) {
      console.error('[PAPER] Error fetching paper trade legs:', legError.message);
      throw legError;
    }
    
    if (!legData || legData.length === 0) {
      return {
        paperTrades: [],
        pagination: {
          totalItems,
          totalPages: totalPages > 0 ? totalPages : 1,
          currentPage: page,
          pageSize
        }
      };
    }
    
    console.log(`[PAPER] Found ${legData.length} paper trade legs on page ${page}`);
    
    // Group legs by parent trade
    const tradeMap = new Map<string, PaperTrade>();
    
    // Process each leg and build the trade structure
    legData.forEach(leg => {
      const parentData = leg.paper_trades as any;
      const tradeId = leg.paper_trade_id;
      
      // Initialize parent trade if not already in map
      if (!tradeMap.has(tradeId)) {
        tradeMap.set(tradeId, {
          id: parentData.id,
          tradeReference: parentData.trade_reference,
          tradeType: 'paper' as const,
          counterparty: parentData.counterparty,
          broker: parentData.broker || '',
          createdAt: new Date(parentData.created_at),
          updatedAt: new Date(parentData.updated_at),
          buySell: 'buy' as BuySell,
          product: 'UCOME' as Product,
          legs: [] // Will be populated below
        });
      }
      
      // Get trade from map to add the leg
      const trade = tradeMap.get(tradeId)!;
      
      // Process leg data
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
      
      // Add the processed leg to the trade
      trade.legs.push({
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
        exposures: exposuresObj,
        executionTradeDate: leg.execution_trade_date ? new Date(leg.execution_trade_date) : undefined
      } as PaperTradeLeg);
    });
    
    // Convert map values to array
    const paperTrades = Array.from(tradeMap.values());
    
    return {
      paperTrades,
      pagination: {
        totalItems,
        totalPages: totalPages > 0 ? totalPages : 1,
        currentPage: page,
        pageSize
      }
    };
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
    paperTrades: data?.paperTrades || [],
    pagination: data?.pagination,
    isLoading,
    error,
    createPaperTrade,
    isCreating,
    refetchPaperTrades: refetch
  };
};
