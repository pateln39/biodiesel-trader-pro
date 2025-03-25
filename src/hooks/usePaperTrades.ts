import { useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BuySell, Product } from '@/types/trade';
import { PaperTrade, PaperTradeLeg } from '@/types/paper';
import { setupPaperTradeSubscriptions } from '@/utils/paperTradeSubscriptionUtils';
import { generateLegReference, generateInstrumentName } from '@/utils/tradeUtils';
import { mapProductToCanonical } from '@/utils/productMapping';

const debounce = (fn: Function, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function(...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
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
            legs: []
          };
        }
        
        return {
          id: paperTrade.id,
          tradeReference: paperTrade.trade_reference,
          tradeType: 'paper' as const,
          counterparty: paperTrade.counterparty,
          broker: paperTrade.broker || '',
          createdAt: new Date(paperTrade.created_at),
          updatedAt: new Date(paperTrade.updated_at),
          legs: (legs || []).map((leg) => {
            const instrument = leg.instrument || '';
            let relationshipType: 'FP' | 'DIFF' | 'SPREAD' = 'FP';
            
            if (instrument.includes('DIFF')) {
              relationshipType = 'DIFF';
            } else if (instrument.includes('SPREAD')) {
              relationshipType = 'SPREAD';
            }
            
            // Extract rightSide data
            let rightSide = undefined;
            
            // First try to get rightSide from mtm_formula
            if (leg.mtm_formula && 
                typeof leg.mtm_formula === 'object' && 
                'rightSide' in leg.mtm_formula) {
              rightSide = leg.mtm_formula.rightSide;
            }
            
            // Build exposures object
            let exposuresObj: PaperTradeLeg['exposures'] = {
              physical: {},
              pricing: {},
              paper: {}
            };
            
            // Extract exposures data
            if (leg.exposures) {
              if (typeof leg.exposures === 'object') {
                const exposuresData = leg.exposures as Record<string, any>;
                
                if (exposuresData.physical && typeof exposuresData.physical === 'object') {
                  // Map exposures.physical product names to canonical names
                  Object.entries(exposuresData.physical).forEach(([key, value]) => {
                    const canonicalProduct = mapProductToCanonical(key);
                    exposuresObj.physical[canonicalProduct] = value as number;
                  });
                  
                  // If rightSide is not set from mtm_formula but exposures has two products,
                  // build rightSide from exposures data
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
                  // Map exposures.paper product names to canonical names
                  Object.entries(exposuresData.paper).forEach(([key, value]) => {
                    const canonicalProduct = mapProductToCanonical(key);
                    exposuresObj.paper[canonicalProduct] = value as number;
                  });
                }
                
                if (exposuresData.pricing && typeof exposuresData.pricing === 'object') {
                  // Map exposures.pricing product names to canonical names
                  Object.entries(exposuresData.pricing).forEach(([key, value]) => {
                    const canonicalProduct = mapProductToCanonical(key);
                    exposuresObj.pricing[canonicalProduct] = value as number;
                  });
                }
              }
            } 
            // If exposures is not set but mtm_formula has exposures, use those
            else if (leg.mtm_formula && typeof leg.mtm_formula === 'object') {
              const mtmData = leg.mtm_formula as Record<string, any>;
              
              if (mtmData.exposures && typeof mtmData.exposures === 'object') {
                const mtmExposures = mtmData.exposures as Record<string, any>;
                
                if (mtmExposures.physical && typeof mtmExposures.physical === 'object') {
                  // Map mtm_formula.exposures.physical product names to canonical names
                  Object.entries(mtmExposures.physical).forEach(([key, value]) => {
                    const canonicalProduct = mapProductToCanonical(key);
                    exposuresObj.physical[canonicalProduct] = value as number;
                    exposuresObj.paper[canonicalProduct] = value as number;
                  });
                  
                  // Try to build rightSide from mtm_formula exposures
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
                  // Map mtm_formula.exposures.pricing product names to canonical names
                  Object.entries(mtmExposures.pricing).forEach(([key, value]) => {
                    const canonicalProduct = mapProductToCanonical(key);
                    exposuresObj.pricing[canonicalProduct] = value as number;
                  });
                }
              }
            }
            
            // Make sure rightSide has the same period as leftSide 
            if (rightSide && !rightSide.period && leg.period) {
              rightSide.period = leg.period;
            }
            
            // Add price if missing for rightSide
            if (rightSide && rightSide.price === undefined) {
              rightSide.price = 0;
            }
            
            // If rightSide is set, make sure its product is canonicalized
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
    mutationFn: async (trade: Partial<PaperTrade>) => {
      const { data: paperTrade, error: paperTradeError } = await supabase
        .from('paper_trades')
        .insert({
          trade_reference: trade.tradeReference,
          counterparty: trade.broker || 'Paper Trade',
          broker: trade.broker
        })
        .select('id')
        .single();
        
      if (paperTradeError) {
        throw new Error(`Error creating paper trade: ${paperTradeError.message}`);
      }
      
      if (trade.legs && trade.legs.length > 0) {
        for (let i = 0; i < trade.legs.length; i++) {
          const leg = trade.legs[i];
          const legReference = generateLegReference(trade.tradeReference || '', i);
          
          let tradingPeriod = leg.period;
          
          let pricingPeriodStart = null;
          let pricingPeriodEnd = null;
          
          if (tradingPeriod) {
            try {
              const [month, year] = tradingPeriod.split('-');
              const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                .findIndex(m => m === month);
              
              if (monthIndex !== -1) {
                const fullYear = 2000 + parseInt(year);
                
                pricingPeriodStart = new Date(fullYear, monthIndex, 1).toISOString();
                
                const lastDay = new Date(fullYear, monthIndex + 1, 0).getDate();
                pricingPeriodEnd = new Date(fullYear, monthIndex, lastDay).toISOString();
              }
            } catch (e) {
              console.error('Error parsing period date:', e);
            }
          }
          
          const exposures = {
            physical: {},
            paper: {},
            pricing: {}
          };
          
          if (leg.relationshipType === 'FP') {
            // Use canonical product name
            const canonicalProduct = mapProductToCanonical(leg.product);
            exposures.physical[canonicalProduct] = leg.quantity || 0;
            exposures.paper[canonicalProduct] = leg.quantity || 0;
            
            // Add the same exposure to pricing
            exposures.pricing[canonicalProduct] = leg.quantity || 0;
          } else if (leg.rightSide) {
            // Use canonical product names for both sides
            const canonicalLeftProduct = mapProductToCanonical(leg.product);
            const canonicalRightProduct = mapProductToCanonical(leg.rightSide.product);
            
            exposures.physical[canonicalLeftProduct] = leg.quantity || 0;
            exposures.physical[canonicalRightProduct] = leg.rightSide.quantity || 0;
            exposures.paper[canonicalLeftProduct] = leg.quantity || 0;
            exposures.paper[canonicalRightProduct] = leg.rightSide.quantity || 0;
            
            // Add the same exposure to pricing
            exposures.pricing[canonicalLeftProduct] = leg.quantity || 0;
            exposures.pricing[canonicalRightProduct] = leg.rightSide.quantity || 0;
          }
          
          const instrument = generateInstrumentName(
            leg.product, 
            leg.relationshipType,
            leg.rightSide?.product
          );
          
          // Create mtmFormula with right-side price included
          let mtmFormulaForDb = null;
          if (leg.mtmFormula) {
            mtmFormulaForDb = typeof leg.mtmFormula === 'string' ? JSON.parse(leg.mtmFormula) : {...leg.mtmFormula};
          } else {
            mtmFormulaForDb = {};
          }
          
          // Make sure rightSide with price is properly included in the mtmFormula
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
            broker: leg.broker || trade.broker,
            period: tradingPeriod,
            trading_period: tradingPeriod,
            formula: formulaForDb,
            mtm_formula: mtmFormulaForDb,
            pricing_period_start: pricingPeriodStart,
            pricing_period_end: pricingPeriodEnd,
            instrument: instrument,
            exposures: JSON.parse(JSON.stringify(exposures))
          };
          
          const { error: legError } = await supabase
            .from('paper_trade_legs')
            .insert(legData);
            
          if (legError) {
            throw new Error(`Error creating trade leg: ${legError.message}`);
          }
        }
      }
      
      return { ...trade, id: paperTrade.id };
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
