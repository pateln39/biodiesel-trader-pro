// Export from type modules
export * from './pricing';
export * from './physical';
export * from './paper';
export * from './common';

// Update Movement interface
export interface Movement {
  id: string;
  referenceNumber?: string;
  tradeLegId?: string;
  parentTradeId?: string;
  tradeReference?: string;
  counterpartyName?: string;
  product?: string;
  buySell?: string;
  incoTerm?: string;
  sustainability?: string;
  quantity?: number; // Added this field to match the open trade's quantity
  scheduledQuantity?: number;
  blQuantity?: number;
  actualQuantity?: number;
  nominationEta?: Date;
  nominationValid?: Date;
  cashFlow?: Date; // Changed from string to Date
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
  loading_period_start?: Date;
  loading_period_end?: Date;
  bargeOrdersChecked?: boolean;
  nominationChecked?: boolean;
  loadPlanChecked?: boolean;
  coaReceivedChecked?: boolean;
  coaSentChecked?: boolean;
  eadChecked?: boolean;
  sort_order?: number; // Added sort_order property
  terminal_id?: string; // Added terminal_id property for terminal assignment
  inventory_movement_date?: Date; // Added inventory_movement_date for terminal assignments
  group_id?: string; // Added group_id property for grouping movements
}

// Explicit re-exports to avoid name conflicts when importing
import { PhysicalTrade } from './physical';
import { 
  Trade, 
  BuySell, 
  Product, 
  IncoTerm, 
  Unit, 
  PaymentTerm, 
  CreditStatus, 
  CustomsStatus,
  PricingType,
  ContractStatus,
  DbParentTrade,
  DbTradeLeg,
  TradeType,
  Instrument,
  ExposureResult
} from './common';
import { PricingFormula, PricingComponent } from './pricing';

// Re-export specific types explicitly to avoid ambiguities
export type {
  PhysicalTrade,
  Trade,
  TradeType,
  BuySell,
  Product,
  IncoTerm,
  Unit,
  PaymentTerm,
  CreditStatus,
  CustomsStatus,
  PricingType,
  ContractStatus,
  PricingFormula,
  PricingComponent,
  DbParentTrade,
  DbTradeLeg,
  Instrument,
  ExposureResult
};

export interface MovementTerminalAssignment {
  id: string;
  terminal_id: string;
  movement_id: string | null;
  quantity_mt: number;
  assignment_date: string;
  comments: string | null;
  created_at: string;
  updated_at: string;
  sort_order: number | null;
}

export interface TankMovement {
  id: string;
  tank_id: string;
  movement_id: string | null;
  quantity_mt: number;
  quantity_m3: number;
  movement_date: string;
  assignment_id: string | null;
  created_at: string;
  updated_at: string;
  sort_order: number | null;
  product_at_time: string;
  customs_status: string | null;
}
