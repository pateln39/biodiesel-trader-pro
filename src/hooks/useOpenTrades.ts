
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PhysicalTrade, Movement } from '@/types';
import { BuySell, Product, IncoTerm, Unit, PaymentTerm, CreditStatus, CustomsStatus, PricingType, ContractStatus } from '@/types/physical';
import { PricingFormula } from '@/types/pricing';

export interface OpenTrade {
  id: string;
  trade_leg_id: string;
  parent_trade_id: string;
  trade_reference: string;
  counterparty: string;
  buy_sell: BuySell;
  product: Product;
  sustainability?: string;
  inco_term?: IncoTerm;
  quantity: number;
  tolerance?: number;
  loading_period_start?: Date;
  loading_period_end?: Date;
  pricing_period_start?: Date;
  pricing_period_end?: Date;
  unit?: Unit;
  payment_term?: PaymentTerm;
  credit_status?: CreditStatus;
  customs_status?: CustomsStatus;
  vessel_name?: string;
  loadport?: string;
  disport?: string;
  scheduled_quantity: number;
  open_quantity: number;
  status: 'open' | 'closed';
  created_at: Date;
  updated_at: Date;
  // New fields added to OpenTrade interface
  pricing_type?: PricingType;
  pricing_formula?: PricingFormula;
  comments?: string; // Independent from trade_legs.comments
  contract_status?: ContractStatus;
}

const fetchOpenTrades = async (): Promise<OpenTrade[]> => {
  try {
    const { data, error } = await supabase
      .from('open_trades')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(item => ({
      id: item.id,
      trade_leg_id: item.trade_leg_id,
      parent_trade_id: item.parent_trade_id,
      trade_reference: item.trade_reference,
      counterparty: item.counterparty,
      buy_sell: item.buy_sell as BuySell,
      product: item.product as Product,
      sustainability: item.sustainability,
      inco_term: item.inco_term as IncoTerm,
      quantity: item.quantity,
      tolerance: item.tolerance,
      loading_period_start: item.loading_period_start ? new Date(item.loading_period_start) : undefined,
      loading_period_end: item.loading_period_end ? new Date(item.loading_period_end) : undefined,
      pricing_period_start: item.pricing_period_start ? new Date(item.pricing_period_start) : undefined,
      pricing_period_end: item.pricing_period_end ? new Date(item.pricing_period_end) : undefined,
      unit: item.unit as Unit,
      payment_term: item.payment_term as PaymentTerm,
      credit_status: item.credit_status as CreditStatus,
      customs_status: item.customs_status as CustomsStatus,
      vessel_name: item.vessel_name,
      loadport: item.loadport,
      disport: item.disport,
      scheduled_quantity: item.scheduled_quantity || 0,
      open_quantity: item.open_quantity || 0,
      status: item.status as 'open' | 'closed',
      created_at: new Date(item.created_at),
      updated_at: new Date(item.updated_at),
      // Map the new fields
      pricing_type: item.pricing_type as PricingType,
      pricing_formula: item.pricing_formula as unknown as PricingFormula, // Properly cast the JSON to PricingFormula
      comments: item.comments,
      contract_status: item.contract_status as ContractStatus
    }));
  } catch (error: any) {
    console.error('[OPEN TRADES] Error fetching open trades:', error);
    throw new Error(error.message);
  }
};

export const useOpenTrades = () => {
  const { 
    data: openTrades = [], 
    isLoading: loading, 
    error,
    refetch: refetchOpenTrades
  } = useQuery({
    queryKey: ['openTrades'],
    queryFn: fetchOpenTrades,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 2000,
  });

  return { 
    openTrades, 
    loading, 
    error, 
    refetchOpenTrades
  };
};
