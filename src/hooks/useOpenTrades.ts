
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PhysicalTrade } from '@/types';
import { BuySell, Product, IncoTerm, Unit, PaymentTerm, CreditStatus, CustomsStatus, PricingType, ContractStatus } from '@/types/physical';
import { PricingFormula } from '@/types/pricing';
import { PaginationParams, PaginationMeta } from '@/types/pagination';

export interface OpenTrade {
  id: string;
  trade_leg_id: string;
  parent_trade_id: string;
  trade_reference: string;
  leg_reference?: string; // We still keep this field for reference
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
  pricing_type?: PricingType;
  pricing_formula?: PricingFormula;
  comments?: string; // Independent from trade_legs.comments
  contract_status?: ContractStatus;
  nominated_value?: number;
  balance?: number;
  efp_premium?: number;
  efp_agreed_status?: boolean; // Type remains boolean for the interface
  efp_fixed_value?: number;
  efp_designated_month?: string;
  sort_order?: number;
}

const fetchOpenTrades = async (params?: PaginationParams): Promise<{ openTrades: OpenTrade[], pagination: PaginationMeta }> => {
  try {
    // First, get the total count of records
    const { count: totalCount, error: countError } = await supabase
      .from('open_trades')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open');
    
    if (countError) {
      console.error('[OPEN TRADES] Error counting open trades:', countError.message);
      throw countError;
    }
    
    // Calculate pagination metadata
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 15;
    const totalItems = totalCount || 0;
    const totalPages = Math.ceil(totalItems / pageSize);
    
    // Calculate range for pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    const { data, error } = await supabase
      .from('open_trades')
      .select(`
        id, trade_leg_id, parent_trade_id, trade_reference, counterparty, 
        buy_sell, product, sustainability, inco_term, quantity, tolerance,
        loading_period_start, loading_period_end, pricing_period_start, 
        pricing_period_end, unit, payment_term, credit_status, customs_status,
        vessel_name, loadport, disport, scheduled_quantity, open_quantity, 
        status, created_at, updated_at, pricing_type, pricing_formula, 
        comments, contract_status, nominated_value, balance,
        efp_premium, efp_agreed_status, efp_fixed_value, efp_designated_month,
        sort_order
      `)
      .eq('status', 'open')
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) {
      console.error('[OPEN TRADES] Error in Supabase query:', error);
      throw error;
    }
    
    if (!data) {
      console.warn('[OPEN TRADES] No data returned from Supabase');
      return {
        openTrades: [],
        pagination: {
          totalItems,
          totalPages: totalPages > 0 ? totalPages : 1,
          currentPage: page,
          pageSize
        }
      };
    }
    
    const legIds = data
      .map(item => item.trade_leg_id)
      .filter(Boolean);
    
    let legReferenceMap: Record<string, string> = {};
    
    if (legIds.length > 0) {
      const { data: legData, error: legError } = await supabase
        .from('trade_legs')
        .select('id, leg_reference')
        .in('id', legIds);
        
      if (!legError && legData) {
        legReferenceMap = legData.reduce((map, leg) => {
          map[leg.id] = leg.leg_reference;
          return map;
        }, {} as Record<string, string>);
      } else {
        console.error('[OPEN TRADES] Error fetching leg references:', legError);
      }
    }
    
    const openTrades = data.map(item => ({
      id: item.id,
      trade_leg_id: item.trade_leg_id,
      parent_trade_id: item.parent_trade_id,
      trade_reference: item.trade_reference,
      leg_reference: legReferenceMap[item.trade_leg_id] || '',
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
      pricing_type: item.pricing_type as PricingType,
      pricing_formula: item.pricing_formula as unknown as PricingFormula,
      comments: item.comments,
      contract_status: item.contract_status as ContractStatus,
      nominated_value: item.nominated_value || 0,
      balance: item.balance !== null && item.balance !== undefined ? item.balance : item.quantity,
      efp_premium: item.efp_premium,
      efp_agreed_status: typeof item.efp_agreed_status === 'string' 
        ? item.efp_agreed_status === 'true' 
        : !!item.efp_agreed_status,
      efp_fixed_value: item.efp_fixed_value,
      efp_designated_month: item.efp_designated_month,
      sort_order: item.sort_order
    }));

    return { 
      openTrades, 
      pagination: {
        totalItems,
        totalPages: totalPages > 0 ? totalPages : 1,
        currentPage: page,
        pageSize
      } 
    };
  } catch (error: any) {
    console.error('[OPEN TRADES] Error fetching open trades:', error);
    throw new Error(error.message);
  }
};

export const useOpenTrades = (paginationParams?: PaginationParams) => {
  const { 
    data, 
    isLoading: loading, 
    error,
    refetch: refetchOpenTrades
  } = useQuery({
    queryKey: ['openTrades', paginationParams],
    queryFn: () => fetchOpenTrades(paginationParams),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 2000,
  });

  return { 
    openTrades: data?.openTrades || [], 
    pagination: data?.pagination,
    loading, 
    error, 
    refetchOpenTrades
  };
};
