
// Add this to the existing types or update if it already exists
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
  pricingType?: string;
  pricingFormula?: any;
  comments?: string;
  customsStatus?: string;
  creditStatus?: string;
  contractStatus?: string;
  status: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}
