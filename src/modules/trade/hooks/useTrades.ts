
import { useCallback, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Trade,
  TradeType,
  PhysicalTrade,
  BuySell,
  Product,
  IncoTerm,
  Unit,
  PaymentTerm,
  CreditStatus,
  PhysicalType
} from '../types';
import { validateAndParsePricingFormula } from '@/modules/pricing/utils/formulaUtils';
import { setupPhysicalTradeSubscriptions } from '@/modules/operations/utils/physicalTradeSubscriptionUtils';

// Database interfaces - should eventually be moved to a more appropriate location
interface DbParentTrade {
  id: string;
  trade_reference: string;
  trade_type: string;
  physical_type?: string;
  counterparty: string;
  comment?: string;
  created_at: string;
  updated_at: string;
}

interface DbTradeLeg {
  id: string;
  parent_trade_id: string;
  leg_reference: string;
  buy_sell: string;
  product: string;
  sustainability?: string;
  inco_term?: string;
  quantity: number;
  tolerance?: number;
  loading_period_start?: string;
  loading_period_end?: string;
  pricing_period_start?: string;
  pricing_period_end?: string;
  unit?: string;
  payment_term?: string;
  credit_status?: string;
  pricing_formula?: any;
  mtm_formula?: any;
  broker?: string;
  instrument?: string;
  price?: number;
  calculated_price?: number;
  last_calculation_date?: string;
  mtm_calculated_price?: number;
  mtm_last_calculation_date?: string;
  created_at: string;
  updated_at: string;
  trading_period?: string;
}

const debounce = (fn: Function, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function(...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
};

const mapBuySell = (value: string): BuySell => {
  if (value === 'buy') return BuySell.Buy;
  return BuySell.Sell;
};

const mapPhysicalType = (value: string | undefined): PhysicalType => {
  if (value === 'spot') return PhysicalType.Spot;
  return PhysicalType.Term;
};

const mapTradeType = (value: string): TradeType => {
  if (value === 'physical') return TradeType.Physical;
  return TradeType.Paper;
};

const mapProduct = (value: string): Product => {
  switch (value) {
    case 'FAME0': return Product.FAME0;
    case 'RME': return Product.RME;
    case 'UCOME': return Product.UCOME;
    case 'UCOME-5': return Product.UCOME5;
    case 'RME DC': return Product.RMEDC;
    default: return Product.UCOME;
  }
};

const mapIncoTerm = (value: string | undefined): IncoTerm => {
  if (!value) return IncoTerm.FOB;
  switch (value) {
    case 'FOB': return IncoTerm.FOB;
    case 'CIF': return IncoTerm.CIF;
    case 'DES': return IncoTerm.DES;
    case 'DAP': return IncoTerm.DAP;
    case 'FCA': return IncoTerm.FCA;
    default: return IncoTerm.FOB;
  }
};

const mapUnit = (value: string | undefined): Unit => {
  if (!value) return Unit.MT;
  switch (value) {
    case 'MT': return Unit.MT;
    case 'KG': return Unit.KG;
    case 'LT': return Unit.LT;
    default: return Unit.MT;
  }
};

const mapPaymentTerm = (value: string | undefined): PaymentTerm => {
  if (!value) return PaymentTerm.ThirtyDays;
  switch (value) {
    case 'advance': return PaymentTerm.Advance;
    case '30 days': return PaymentTerm.ThirtyDays;
    case '60 days': return PaymentTerm.SixtyDays;
    case '90 days': return PaymentTerm.NinetyDays;
    default: return PaymentTerm.ThirtyDays;
  }
};

const mapCreditStatus = (value: string | undefined): CreditStatus => {
  if (!value) return CreditStatus.Pending;
  switch (value) {
    case 'pending': return CreditStatus.Pending;
    case 'approved': return CreditStatus.Approved;
    case 'rejected': return CreditStatus.Rejected;
    default: return CreditStatus.Pending;
  }
};

const fetchTrades = async (): Promise<Trade[]> => {
  try {
    const { data: parentTrades, error: parentTradesError } = await supabase
      .from('parent_trades')
      .select('*')
      .eq('trade_type', 'physical')
      .order('created_at', { ascending: false });

    if (parentTradesError) {
      throw new Error(`Error fetching parent trades: ${parentTradesError.message}`);
    }

    const { data: tradeLegs, error: tradeLegsError } = await supabase
      .from('trade_legs')
      .select('*')
      .order('created_at', { ascending: false });

    if (tradeLegsError) {
      throw new Error(`Error fetching trade legs: ${tradeLegsError.message}`);
    }

    const mappedTrades = parentTrades.map((parent: DbParentTrade) => {
      const legs = tradeLegs.filter((leg: DbTradeLeg) => leg.parent_trade_id === parent.id);
      
      const firstLeg = legs.length > 0 ? legs[0] : null;
      
      if (parent.trade_type === 'physical' && firstLeg) {
        const physicalTrade: PhysicalTrade = {
          id: parent.id,
          tradeReference: parent.trade_reference,
          tradeType: mapTradeType(parent.trade_type),
          createdAt: new Date(parent.created_at),
          updatedAt: new Date(parent.updated_at),
          physicalType: mapPhysicalType(parent.physical_type),
          counterparty: parent.counterparty,
          buySell: mapBuySell(firstLeg.buy_sell),
          product: mapProduct(firstLeg.product),
          sustainability: firstLeg.sustainability || '',
          incoTerm: mapIncoTerm(firstLeg.inco_term),
          quantity: firstLeg.quantity,
          tolerance: firstLeg.tolerance || 0,
          loadingPeriodStart: firstLeg.loading_period_start ? new Date(firstLeg.loading_period_start) : new Date(),
          loadingPeriodEnd: firstLeg.loading_period_end ? new Date(firstLeg.loading_period_end) : new Date(),
          pricingPeriodStart: firstLeg.pricing_period_start ? new Date(firstLeg.pricing_period_start) : new Date(),
          pricingPeriodEnd: firstLeg.pricing_period_end ? new Date(firstLeg.pricing_period_end) : new Date(),
          unit: mapUnit(firstLeg.unit),
          paymentTerm: mapPaymentTerm(firstLeg.payment_term),
          creditStatus: mapCreditStatus(firstLeg.credit_status),
          formula: validateAndParsePricingFormula(firstLeg.pricing_formula),
          mtmFormula: validateAndParsePricingFormula(firstLeg.mtm_formula),
          legs: legs.map(leg => ({
            id: leg.id,
            parentTradeId: leg.parent_trade_id,
            legReference: leg.leg_reference,
            buySell: mapBuySell(leg.buy_sell),
            product: mapProduct(leg.product),
            sustainability: leg.sustainability || '',
            incoTerm: mapIncoTerm(leg.inco_term),
            quantity: leg.quantity,
            tolerance: leg.tolerance || 0,
            loadingPeriodStart: leg.loading_period_start ? new Date(leg.loading_period_start) : new Date(),
            loadingPeriodEnd: leg.loading_period_end ? new Date(leg.loading_period_end) : new Date(),
            pricingPeriodStart: leg.pricing_period_start ? new Date(leg.pricing_period_start) : new Date(),
            pricingPeriodEnd: leg.pricing_period_end ? new Date(leg.pricing_period_end) : new Date(),
            unit: mapUnit(leg.unit),
            paymentTerm: mapPaymentTerm(leg.payment_term),
            creditStatus: mapCreditStatus(leg.credit_status),
            formula: validateAndParsePricingFormula(leg.pricing_formula),
            mtmFormula: validateAndParsePricingFormula(leg.mtm_formula)
          }))
        };
        return physicalTrade;
      } 
      
      // If we can't properly map this trade, return a default structure
      // This should be handled better in a production environment
      const defaultTrade: PhysicalTrade = {
        id: parent.id,
        tradeReference: parent.trade_reference,
        tradeType: mapTradeType(parent.trade_type),
        createdAt: new Date(parent.created_at),
        updatedAt: new Date(parent.updated_at),
        counterparty: parent.counterparty,
        buySell: BuySell.Buy,
        product: Product.UCOME,
        physicalType: PhysicalType.Spot,
        sustainability: '',
        incoTerm: IncoTerm.FOB,
        quantity: 0,
        tolerance: 0,
        loadingPeriodStart: new Date(),
        loadingPeriodEnd: new Date(),
        pricingPeriodStart: new Date(),
        pricingPeriodEnd: new Date(),
        unit: Unit.MT,
        paymentTerm: PaymentTerm.ThirtyDays,
        creditStatus: CreditStatus.Pending,
        formula: validateAndParsePricingFormula(null),
        mtmFormula: validateAndParsePricingFormula(null),
        legs: []
      };
      
      return defaultTrade;
    });

    return mappedTrades as Trade[];
  } catch (error: any) {
    console.error('[PHYSICAL] Error fetching trades:', error);
    throw new Error(error.message);
  }
};

export const useTrades = () => {
  const queryClient = useQueryClient();
  const realtimeChannelsRef = useRef<{ [key: string]: any }>({});
  const isProcessingRef = useRef<boolean>(false);
  
  const debouncedRefetch = useRef(debounce((fn: Function) => {
    if (isProcessingRef.current) {
      console.log("[PHYSICAL] Skipping refetch as an operation is in progress");
      return;
    }
    console.log("[PHYSICAL] Executing debounced refetch for physical trades");
    fn();
  }, 500)).current;

  const { 
    data: trades = [], 
    isLoading: loading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['trades'],
    queryFn: fetchTrades,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 2000,
  });

  const setupRealtimeSubscriptions = useCallback(() => {
    return setupPhysicalTradeSubscriptions(
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

  return { 
    trades, 
    loading, 
    error, 
    refetchTrades: refetch
  };
};
