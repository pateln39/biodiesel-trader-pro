
import { PhysicalTrade } from './physical';

export interface OpenTrade {
  id: string;
  parent_trade_id: string;
  trade_leg_id: string;
  trade_reference: string;
  buy_sell: 'buy' | 'sell';
  inco_term: string;
  quantity: number;
  unit: string;
  sustainability?: string | null;
  product: string;
  loading_period_start?: string | null;
  loading_period_end?: string | null;
  counterparty: string;
  pricing_type: string;
  pricing_formula?: any;
  efp_premium?: number | null;
  efp_designated_month?: string | null;
  efp_agreed_status?: string | null;
  efp_fixed_value?: number | null;
  comments?: string | null;
  customs_status?: string | null;
  credit_status?: string | null;
  contract_status?: string | null;
  nominated_value?: number | null;
  balance?: number | null;
  sort_order: number;
  // Add the missing properties
  scheduled_quantity: number;
  open_quantity: number;
  status: 'open' | 'closed';
  created_at: Date;
  updated_at: Date;
}

export interface Counterparty {
  id: string;
  name: string;
}
