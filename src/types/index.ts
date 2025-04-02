
// Re-export types from other files for easier importing
export * from './common';
export * from './physical';
export * from './paper';
export * from './pricing';  // Add this export to include pricing types

// Import specific types from pricing to resolve circular dependencies
import type { PricingFormula, MTMPriceDetail, PriceDetail } from './pricing';

// Types that are used across the application
export type ActionType = 'create' | 'update' | 'delete';

// Status types for pipelines
export type Status = 'draft' | 'pending' | 'approved' | 'rejected' | 'canceled' | 'completed';

// Database types (mapped from Supabase)
export interface DbParentTrade {
  id: string;
  created_at: string;
  updated_at: string;
  trade_type: string;
  physical_type?: string;
  trade_reference: string;
  counterparty: string;
}

export interface DbTradeLeg {
  id: string;
  parent_trade_id: string;
  leg_reference: string;
  quantity: number;
  tolerance?: number;
  loading_period_start?: string;
  loading_period_end?: string;
  pricing_period_start?: string;
  pricing_period_end?: string;
  pricing_formula?: any;
  mtm_formula?: any;
  created_at: string;
  updated_at: string;
  buy_sell: string;
  product: string;
  sustainability?: string;
  inco_term?: string;
  unit?: string;
  payment_term?: string;
  credit_status?: string;
  pricing_type?: string;
  efp_premium?: number;
  efp_agreed_status?: boolean;
  efp_fixed_value?: number;
  efp_designated_month?: string;
  mtm_future_month?: string;
}

// Basic Trade interface
export interface Trade {
  id: string;
  tradeReference: string;
  tradeType: string; // Use string instead of TradeType
  counterparty: string;
  createdAt: Date;
  updatedAt: Date;
  buySell: string; // Use string instead of BuySell
  product: string; // Use string instead of Product
  legs: any[];
}

// Re-export type as specified by TypeScript when isolatedModules is enabled
export type { PricingFormula, MTMPriceDetail, PriceDetail };
