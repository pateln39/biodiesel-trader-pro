
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
  PricingComponent
} from '@/types';
import { convertToNewFormulaFormat } from '@/utils/formulaUtils';

// Helper to safely parse pricingFormula from DB
const parsePricingFormula = (rawFormula: any): PricingComponent[] => {
  if (!rawFormula) return [];
  
  // If it's already an array with the right structure
  if (Array.isArray(rawFormula) && 
      rawFormula.length > 0 && 
      typeof rawFormula[0] === 'object' && 
      'instrument' in rawFormula[0]) {
    return rawFormula as PricingComponent[];
  }
  
  // Default formula if parsing fails
  return [{ 
    instrument: 'Argus UCOME', 
    percentage: 100, 
    adjustment: 0 
  }];
};

export const useTrades = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    try {
      setLoading(true);
      setError(null);

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
            pricingFormula: parsePricingFormula(firstLeg.pricing_formula),
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
              pricingFormula: parsePricingFormula(leg.pricing_formula),
              formula: leg.pricing_formula ? convertToNewFormulaFormat(parsePricingFormula(leg.pricing_formula)) : undefined
            }))
          };
          return physicalTrade;
        } 
        else if (parent.trade_type === 'paper' && firstLeg) {
          // For paper trades, safely extract and type the required properties
          const brokerValue = firstLeg.hasOwnProperty('broker') ? (firstLeg as any).broker as string : '';
          const instrumentValue = firstLeg.hasOwnProperty('instrument') ? (firstLeg as any).instrument as string : '';
          const priceValue = firstLeg.hasOwnProperty('price') ? Number((firstLeg as any).price) : 0;
          
          // Create paper trade
          const paperTrade: PaperTrade = {
            id: parent.id,
            tradeReference: parent.trade_reference,
            tradeType: 'paper',
            createdAt: new Date(parent.created_at),
            updatedAt: new Date(parent.updated_at),
            broker: brokerValue,
            instrument: instrumentValue,
            price: priceValue,
            quantity: firstLeg.quantity,
            pricingPeriodStart: firstLeg.pricing_period_start ? new Date(firstLeg.pricing_period_start) : new Date(),
            pricingPeriodEnd: firstLeg.pricing_period_end ? new Date(firstLeg.pricing_period_end) : new Date(),
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
          counterparty: parent.counterparty
        } as Trade;
      });

      setTrades(mappedTrades);
    } catch (error: any) {
      console.error('Error fetching trades:', error);
      setError(error.message);
      toast.error('Failed to load trades', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return { trades, loading, error, fetchTrades };
};
