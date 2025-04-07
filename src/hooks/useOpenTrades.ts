
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PhysicalTrade } from '@/types';
import { BuySell, Product, IncoTerm, Unit, PaymentTerm, CreditStatus, CustomsStatus, PricingType, ContractStatus } from '@/types/physical';
import { PricingFormula } from '@/types/pricing';

export interface OpenTrade {
  id: string;
  trade_leg_id: string;
  parent_trade_id: string;
  trade_reference: string;
  leg_reference?: string; // Added this field to store the leg reference
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
  // Previously added fields
  pricing_type?: PricingType;
  pricing_formula?: PricingFormula;
  comments?: string; // Independent from trade_legs.comments
  contract_status?: ContractStatus;
  // New fields based on database additions
  nominated_value?: number;
  balance?: number;
  // EFP related properties needed for formula display
  efp_premium?: number;
  efp_agreed_status?: boolean;
  efp_fixed_value?: number;
  efp_designated_month?: string;
}

const fetchOpenTrades = async (): Promise<OpenTrade[]> => {
  try {
    // First check if leg_reference column exists in open_trades table
    const { data: columnInfo, error: columnError } = await supabase
      .from('open_trades')
      .select('*')
      .limit(1);
    
    let includeFieldInQuery = true;
    if (columnError) {
      console.error('[OPEN TRADES] Error checking columns:', columnError);
      includeFieldInQuery = false;
    }
    
    // Build the query based on column existence
    let queryFields = `
      id, trade_leg_id, parent_trade_id, trade_reference, counterparty, 
      buy_sell, product, sustainability, inco_term, quantity, tolerance,
      loading_period_start, loading_period_end, pricing_period_start, 
      pricing_period_end, unit, payment_term, credit_status, customs_status,
      vessel_name, loadport, disport, scheduled_quantity, open_quantity, 
      status, created_at, updated_at, pricing_type, pricing_formula, 
      comments, contract_status, nominated_value, balance,
      efp_premium, efp_agreed_status, efp_fixed_value, efp_designated_month
    `;
    
    // Only include leg_reference if it exists
    if (includeFieldInQuery && columnInfo && columnInfo[0] && 'leg_reference' in columnInfo[0]) {
      queryFields += ', leg_reference';
    } else {
      console.warn('[OPEN TRADES] leg_reference column not found in open_trades table');
    }
    
    const { data, error } = await supabase
      .from('open_trades')
      .select(queryFields)
      .eq('status', 'open')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('[OPEN TRADES] Error in Supabase query:', error);
      throw error;
    }
    
    if (!data) {
      console.warn('[OPEN TRADES] No data returned from Supabase');
      return [];
    }
    
    // If leg_reference isn't in open_trades, we need to fetch it from trade_legs
    let legReferenceMap: Record<string, string> = {};
    
    if (!includeFieldInQuery || !('leg_reference' in (data[0] || {}))) {
      // Collect all trade_leg_ids to fetch their references
      const legIds = data.map(item => item.trade_leg_id).filter(Boolean);
      
      if (legIds.length > 0) {
        const { data: legData, error: legError } = await supabase
          .from('trade_legs')
          .select('id, leg_reference')
          .in('id', legIds);
          
        if (!legError && legData) {
          // Create a map of leg_id to leg_reference
          legReferenceMap = legData.reduce((map, leg) => {
            map[leg.id] = leg.leg_reference;
            return map;
          }, {} as Record<string, string>);
        } else {
          console.error('[OPEN TRADES] Error fetching leg references:', legError);
        }
      }
    }
    
    return data.map(item => ({
      id: item.id,
      trade_leg_id: item.trade_leg_id,
      parent_trade_id: item.parent_trade_id,
      trade_reference: item.trade_reference,
      // Use leg_reference from the item if it exists, otherwise from our map
      leg_reference: item.leg_reference || legReferenceMap[item.trade_leg_id] || '',
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
      // Map previously added fields
      pricing_type: item.pricing_type as PricingType,
      pricing_formula: item.pricing_formula as unknown as PricingFormula, // Properly cast the JSON to PricingFormula
      comments: item.comments,
      contract_status: item.contract_status as ContractStatus,
      // Map newly added fields
      nominated_value: item.nominated_value || 0, // Ensure nominated_value is never null
      balance: item.balance !== null && item.balance !== undefined ? item.balance : item.quantity, // Default to quantity if balance is null
      // Map EFP related fields
      efp_premium: item.efp_premium,
      efp_agreed_status: item.efp_agreed_status,
      efp_fixed_value: item.efp_fixed_value,
      efp_designated_month: item.efp_designated_month
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
