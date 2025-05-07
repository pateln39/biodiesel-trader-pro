import { BuySell, Product, IncoTerm, Unit, PaymentTerm, CreditStatus, CustomsStatus, PricingType, ContractStatus } from './physical';
import { PricingFormula } from './pricing';

export interface Trade {
  id: string;
  tradeReference: string;
  tradeType: 'physical' | 'paper';
  createdAt: Date;
  updatedAt: Date;
  counterparty: string;
  buySell: BuySell;
  product: Product;
  quantity: number;
  loadingPeriodStart: Date;
  loadingPeriodEnd: Date;
  pricingPeriodStart: Date;
  pricingPeriodEnd: Date;
}

export type TradeType = 'physical' | 'paper';

export interface PhysicalTrade extends Trade {
  tradeType: 'physical';
  physicalType: 'spot' | 'term';
  sustainability: string;
  incoTerm: IncoTerm;
  unit: Unit;
  paymentTerm: PaymentTerm;
  creditStatus: CreditStatus;
  customsStatus: CustomsStatus;
  formula: PricingFormula;
  mtmFormula: PricingFormula;
  pricingType: PricingType;
  mtmFutureMonth?: string;
  comments?: string;
  contractStatus: ContractStatus;
  tolerance: number;
  legs: PhysicalTradeLeg[];
}

export interface PhysicalTradeLeg {
  id: string;
  parentTradeId: string;
  legReference: string;
  buySell: BuySell;
  product: Product;
  sustainability: string;
  incoTerm: IncoTerm;
  quantity: number;
  tolerance: number;
  loadingPeriodStart: Date;
  loadingPeriodEnd: Date;
  pricingPeriodStart: Date;
  pricingPeriodEnd: Date;
  unit: Unit;
  paymentTerm: PaymentTerm;
  creditStatus: CreditStatus;
  customsStatus: CustomsStatus;
  formula: PricingFormula;
  mtmFormula: PricingFormula;
  pricingType: PricingType;
  efpPremium?: number;
  efpAgreedStatus?: boolean;
  efpFixedValue?: number;
  efpDesignatedMonth?: string;
  mtmFutureMonth?: string;
  comments?: string;
  contractStatus: ContractStatus;
}

// Add sort_order to OpenTrade interface in useOpenTrades.ts
declare module '@/hooks/useOpenTrades' {
  export interface OpenTrade {
    id: string;
    trade_leg_id: string;
    parent_trade_id: string;
    trade_reference: string;
    leg_reference?: string;
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
    comments?: string;
    contract_status?: ContractStatus;
    nominated_value?: number;
    balance?: number;
    efp_premium?: number;
    efp_agreed_status?: boolean;
    efp_fixed_value?: number;
    efp_designated_month?: string;
    sort_order?: number; // Add sort_order field
  }
}

// Export the Movement interface with sort_order
export interface Movement {
  id: string;
  referenceNumber?: string;
  tradeLegId?: string;
  parentTradeId?: string;
  tradeReference: string;
  counterpartyName: string;
  product: string;
  buySell?: string;
  incoTerm?: string;
  sustainability?: string;
  scheduledQuantity?: number;
  blQuantity?: number;
  actualQuantity?: number;
  quantity?: number;
  nominationEta?: Date;
  nominationValid?: Date;
  cashFlow?: Date;
  bargeName?: string;
  loadport?: string;
  loadportInspector?: string;
  disport?: string;
  disportInspector?: string;
  blDate?: Date;
  codDate?: Date;
  pricingType?: PricingType;
  pricingFormula?: any;
  comments?: string;
  customsStatus?: string;
  creditStatus?: string;
  contractStatus?: string;
  status: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  bargeOrdersChecked?: boolean;
  nominationChecked?: boolean;
  loadPlanChecked?: boolean;
  coaReceivedChecked?: boolean;
  coaSentChecked?: boolean;
  eadChecked?: boolean;
  sort_order?: number; // Add sort_order field
  terminal_id?: string; // Add terminal_id field
  inventory_movement_date?: Date; // Add inventory_movement_date field
  group_id?: string; // Add group_id field for grouping movements
}
