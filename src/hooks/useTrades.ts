
import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Trade,
  TradeType,
  PhysicalTrade,
  PaperTrade,
  BuySell,
  Product,
  IncoTerm,
  Unit,
  PaymentTerm,
  CreditStatus,
  DbParentTrade,
  DbTradeLeg,
  PricingFormula
} from '@/types';
import { 
  PaperTradeRow, 
  PaperTradePositionSide 
} from '@/types/paper';
import { createEmptyFormula, validateAndParsePricingFormula } from '@/utils/formulaUtils';

const fetchTrades = async (): Promise<Trade[]> => {
  try {
    // Get all parent trades
    const { data: parentTrades, error: parentTradesError } = await supabase
      .from('parent_trades')
      .select('*')
      .order('created_at', { ascending: false });

    if (parentTradesError) {
      throw new Error(`Error fetching parent trades: ${parentTradesError.message}`);
    }

    // Get all trade legs
    const { data: tradeLegs, error: tradeLegsError } = await supabase
      .from('trade_legs')
      .select('*')
      .order('created_at', { ascending: false });

    if (tradeLegsError) {
      throw new Error(`Error fetching trade legs: ${tradeLegsError.message}`);
    }

    // Map parent trades and legs to create the trade objects
    const mappedTrades = parentTrades.map((parent: DbParentTrade) => {
      // Find all legs for this parent trade
      const legs = tradeLegs.filter((leg: DbTradeLeg) => leg.parent_trade_id === parent.id);
      
      // Use the first leg for the main trade data (for backward compatibility)
      const firstLeg = legs.length > 0 ? legs[0] : null;
      
      if (parent.trade_type === 'physical' && firstLeg) {
        // Create physical trade
        const physicalTrade: PhysicalTrade = {
          id: parent.id,
          tradeReference: parent.trade_reference,
          tradeType: 'physical', 
          createdAt: new Date(parent.created_at),
          updatedAt: new Date(parent.updated_at),
          physicalType: (parent.physical_type || 'spot') as 'spot' | 'term',
          counterparty: parent.counterparty,
          buySell: firstLeg.buy_sell as BuySell,
          product: firstLeg.product as Product,
          sustainability: firstLeg.sustainability || '',
          incoTerm: (firstLeg.inco_term || 'FOB') as IncoTerm,
          quantity: firstLeg.quantity,
          tolerance: firstLeg.tolerance || 0,
          loadingPeriodStart: firstLeg.loading_period_start ? new Date(firstLeg.loading_period_start) : new Date(),
          loadingPeriodEnd: firstLeg.loading_period_end ? new Date(firstLeg.loading_period_end) : new Date(),
          pricingPeriodStart: firstLeg.pricing_period_start ? new Date(firstLeg.pricing_period_start) : new Date(),
          pricingPeriodEnd: firstLeg.pricing_period_end ? new Date(firstLeg.pricing_period_end) : new Date(),
          unit: (firstLeg.unit || 'MT') as Unit,
          paymentTerm: (firstLeg.payment_term || '30 days') as PaymentTerm,
          creditStatus: (firstLeg.credit_status || 'pending') as CreditStatus,
          formula: validateAndParsePricingFormula(firstLeg.pricing_formula),
          mtmFormula: validateAndParsePricingFormula(firstLeg.mtm_formula),
          legs: legs.map(leg => ({
            id: leg.id,
            parentTradeId: leg.parent_trade_id,
            legReference: leg.leg_reference,
            buySell: leg.buy_sell as BuySell,
            product: leg.product as Product,
            sustainability: leg.sustainability || '',
            incoTerm: (leg.inco_term || 'FOB') as IncoTerm,
            quantity: leg.quantity,
            tolerance: leg.tolerance || 0,
            loadingPeriodStart: leg.loading_period_start ? new Date(leg.loading_period_start) : new Date(),
            loadingPeriodEnd: leg.loading_period_end ? new Date(leg.loading_period_end) : new Date(),
            pricingPeriodStart: leg.pricing_period_start ? new Date(leg.pricing_period_start) : new Date(),
            pricingPeriodEnd: leg.pricing_period_end ? new Date(leg.pricing_period_end) : new Date(),
            unit: (leg.unit || 'MT') as Unit,
            paymentTerm: (leg.payment_term || '30 days') as PaymentTerm,
            creditStatus: (leg.credit_status || 'pending') as CreditStatus,
            formula: validateAndParsePricingFormula(leg.pricing_formula),
            mtmFormula: validateAndParsePricingFormula(leg.mtm_formula)
          }))
        };
        return physicalTrade;
      } 
      else if (parent.trade_type === 'paper' && firstLeg) {
        // Extract all legs and organize them into rows by sideReference
        const paperSides = legs.map(leg => ({
          id: leg.id,
          sideReference: leg.leg_reference,
          parentTradeId: leg.parent_trade_id,
          buySell: leg.buy_sell as BuySell,
          product: leg.product as Product,
          instrument: leg.instrument || '',
          pricingPeriodStart: leg.pricing_period_start ? new Date(leg.pricing_period_start) : new Date(),
          pricingPeriodEnd: leg.pricing_period_end ? new Date(leg.pricing_period_end) : new Date(),
          price: leg.price || 0,
          quantity: leg.quantity,
          broker: leg.broker || '',
          formula: validateAndParsePricingFormula(leg.pricing_formula),
          mtmFormula: validateAndParsePricingFormula(leg.mtm_formula)
        }));

        // Create rows by matching sides with similar references (e.g., TR-001-1A and TR-001-1B)
        const rowsMap = new Map<string, PaperTradeRow>();
        
        paperSides.forEach(side => {
          // Extract base reference (remove the last character which should be A or B)
          const baseRef = side.sideReference.slice(0, -1);
          const isLeftSide = side.sideReference.endsWith('A');
          
          let row = rowsMap.get(baseRef);
          if (!row) {
            row = {
              id: crypto.randomUUID(),
              leftSide: null,
              rightSide: null,
              mtmFormula: validateAndParsePricingFormula(firstLeg.mtm_formula)
            };
            rowsMap.set(baseRef, row);
          }
          
          if (isLeftSide) {
            row.leftSide = side;
          } else {
            row.rightSide = side;
          }
        });
        
        // If there are no valid rows (unexpected), create a default one
        if (rowsMap.size === 0 && paperSides.length > 0) {
          rowsMap.set('default', {
            id: crypto.randomUUID(),
            leftSide: paperSides[0],
            rightSide: null,
            mtmFormula: validateAndParsePricingFormula(firstLeg.mtm_formula)
          });
        }
        
        // Convert map to array of rows
        const paperRows = Array.from(rowsMap.values());

        // For paper trades, create the full structure
        const paperTrade: PaperTrade = {
          id: parent.id,
          tradeReference: parent.trade_reference,
          tradeType: 'paper',
          createdAt: new Date(parent.created_at),
          updatedAt: new Date(parent.updated_at),
          counterparty: parent.counterparty,
          buySell: firstLeg.buy_sell as BuySell,
          product: firstLeg.product as Product,
          broker: firstLeg.broker || '',
          instrument: firstLeg.instrument || '',
          price: firstLeg.price || 0,
          quantity: firstLeg.quantity,
          pricingPeriodStart: firstLeg.pricing_period_start ? new Date(firstLeg.pricing_period_start) : new Date(),
          pricingPeriodEnd: firstLeg.pricing_period_end ? new Date(firstLeg.pricing_period_end) : new Date(),
          formula: validateAndParsePricingFormula(firstLeg.pricing_formula),
          mtmFormula: validateAndParsePricingFormula(firstLeg.mtm_formula),
          legs: paperSides, // Keep legs for backward compatibility
          rows: paperRows // Use the new row structure
        };
        return paperTrade;
      }
      
      // Fallback with minimal data if there are no legs or unknown type
      return {
        id: parent.id,
        tradeReference: parent.trade_reference,
        tradeType: parent.trade_type as TradeType,
        createdAt: new Date(parent.created_at),
        updatedAt: new Date(parent.updated_at),
        counterparty: parent.counterparty,
        // Add missing required properties for PaperTrade
        buySell: 'buy' as BuySell,
        product: 'UCOME' as Product,
        legs: [],
        rows: []
      } as Trade;
    });

    return mappedTrades;
  } catch (error: any) {
    console.error('Error fetching trades:', error);
    throw new Error(error.message);
  }
};

export const useTrades = () => {
  const { 
    data: trades = [], 
    isLoading: loading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['trades'],
    queryFn: fetchTrades,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Always consider data stale to force refetch when component mounts
  });

  // Set up real-time subscription to trades changes
  useEffect(() => {
    // Subscribe to changes on parent_trades table
    const parentTradesChannel = supabase
      .channel('public:parent_trades')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'parent_trades' 
      }, () => {
        console.log('Parent trades changed, refetching...');
        refetch();
      })
      .subscribe();

    // Subscribe to changes on trade_legs table
    const tradeLegsChannel = supabase
      .channel('public:trade_legs')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'trade_legs' 
      }, () => {
        console.log('Trade legs changed, refetching...');
        refetch();
      })
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(parentTradesChannel);
      supabase.removeChannel(tradeLegsChannel);
    };
  }, [refetch]);

  return { trades, loading, error, refetchTrades: refetch };
};
