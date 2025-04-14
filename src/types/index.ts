
// Export from type modules
export * from './pricing';
export * from './physical';
export * from './paper';
export * from './common';

// Add or update the Movement interface
export interface Movement {
  id: string;
  referenceNumber?: string;
  tradeLegId?: string;
  parentTradeId?: string;
  trade_reference?: string;
  counterparty?: string;
  counterpartyName?: string; // Added for backward compatibility
  product?: string;
  buy_sell?: string;
  buySell?: string; // Added for backward compatibility
  incoTerm?: string;
  sustainability?: string;
  quantity?: number;
  scheduled_quantity?: number;
  scheduledQuantity?: number; // Added for backward compatibility
  blQuantity?: number;
  actual_quantity?: number;
  actualQuantity?: number; // Added for backward compatibility
  nomination_eta?: Date;
  nominationEta?: Date; // Added for backward compatibility
  nomination_valid?: Date;
  nominationValid?: Date; // Added for backward compatibility
  cashFlow?: Date;
  barge_name?: string;
  bargeName?: string; // Added for backward compatibility
  loadport?: string;
  loadportInspector?: string;
  disport?: string;
  disportInspector?: string;
  bl_date?: Date;
  blDate?: Date; // Added for backward compatibility
  codDate?: Date;
  pricingType?: string;
  pricingFormula?: any;
  comments?: string;
  customs_status?: string;
  customsStatus?: string; // Added for backward compatibility
  credit_status?: string;
  creditStatus?: string; // Added for backward compatibility
  contract_status?: string;
  status: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  // Adding the checklist properties
  bargeOrdersChecked?: boolean;
  nominationChecked?: boolean;
  loadPlanChecked?: boolean;
  coaReceivedChecked?: boolean;
  coaSentChecked?: boolean;
  eadChecked?: boolean;
  sort_order?: number;
  // New structure for tank movements
  tanks?: Record<string, {
    quantity: number; 
    balance: number;
    balanceM3: number;
    productAtTimeOfMovement: string;
  }>;
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
