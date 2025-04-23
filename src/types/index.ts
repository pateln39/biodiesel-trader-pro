
// Re-export all types for convenience
export * from './storage';
export * from './common';

// Explicitly re-export and rename types from physical to avoid naming conflicts
export type {
  PhysicalTradeType,
  PhysicalTrade,
  PhysicalTradeLeg,
} from './physical';

// Re-export pricing-related types
export type {
  FormulaNode,
  FormulaToken,
  PricingFormula,
  MonthlyDistribution,
  PriceDetail,
  MTMPriceDetail,
  FixedComponent,
  PricingComponent,
  OperatorType,
  PartialExposureResult,
  PartialPricingFormula,
} from './pricing';

// Re-export paper trade types
export type {
  PaperTrade,
  PaperTradeLeg,
} from './trade';

export interface Movement {
  id: string;
  assignment_id?: string;
  assignment_quantity?: number;
  assignment_date?: string;
  terminal_comments?: string;
  sort_order?: number;
  // Properties used in components (camelCase)
  tradeLegId?: string;
  parentTradeId?: string;
  tradeReference: string;
  counterpartyName: string;
  buySell?: string;
  incoTerm?: string;
  sustainability?: string;
  scheduledQuantity?: number;
  blQuantity?: number;
  actualQuantity?: number;
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
  referenceNumber?: string;  // Add this property which was missing
  // Database properties (snake_case)
  trade_leg_id?: string;
  parent_trade_id?: string;
  trade_reference?: string;
  counterparty?: string;
  buy_sell?: string;
  inco_term?: string;
  product: string;
  scheduled_quantity?: number;
  bl_quantity?: number;
  actual_quantity?: number;
  nomination_eta?: Date;
  nomination_valid?: Date;
  cash_flow?: string;
  barge_name?: string;
  loadport_inspector?: string;
  bl_date?: Date;
  cod_date?: Date;
  reference_number?: string;
  customs_status?: string;
  credit_status?: string;
  contract_status?: string;
  terminal_id?: string;
  inventory_movement_date?: Date;
  barge_orders_checked?: boolean;
  nomination_checked?: boolean;
  load_plan_checked?: boolean;
  coa_received_checked?: boolean;
  coa_sent_checked?: boolean;
  ead_checked?: boolean;
  quantity?: number;
}

// Add MovementSummary interface to ensure it's exported
export interface MovementSummary {
  movementId: string;
  tankBalances: Record<string, { balanceMT: number, balanceM3: number }>;
  totalMTMoved: number;
  currentStockMT: number;
  currentStockM3: number;
  currentUllage: number;
  t1Balance: number;
  t2Balance: number;
}
