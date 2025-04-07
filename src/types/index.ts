export type TradeType = 'physical' | 'paper';

export type BuySell = 'buy' | 'sell';

export type IncoTerm = 'FOB' | 'CIF' | 'CFR' | 'EXW' | 'FCA' | 'FAS' | 'DAP' | 'DPU' | 'DDP';

export type Unit = 'MT' | 'KG' | 'LBS';

export type PaymentTerm = 
  '30 days' | 
  '60 days' | 
  '90 days' | 
  'Cash against documents' | 
  'Letter of credit';

export type CreditStatus = 'approved' | 'pending' | 'rejected';

export type CustomsStatus = 'approved' | 'pending' | 'rejected';

export type Product = 
  'UCOME' | 
  'RME' | 
  'FAME0' | 
  'HVO' | 
  'DIESEL' | 
  'LSGO' | 
  'EFP';

export type PricingType = 'standard' | 'efp' | 'fixed';

export interface Movement {
  id: string;
  referenceNumber: string;
  tradeLegId?: string;
  parentTradeId?: string;
  tradeReference: string;
  counterpartyName: string;
  product: string;
  buySell: string;
  incoTerm?: string;
  sustainability?: string;
  quantity?: number;
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
}

export interface PhysicalTrade {
  id: string;
  tradeReference: string;
  tradeType: 'physical';
  createdAt: Date;
  updatedAt: Date;
  physicalType: 'spot' | 'term';
  counterparty: string;
  buySell: BuySell;
  product: Product;
  sustainability?: string;
  incoTerm: IncoTerm;
  quantity: number;
  tolerance?: number;
  loadingPeriodStart: Date;
  loadingPeriodEnd: Date;
  pricingPeriodStart: Date;
  pricingPeriodEnd: Date;
  unit: Unit;
  paymentTerm: PaymentTerm;
  creditStatus: CreditStatus;
  customsStatus?: CustomsStatus;
  formula: any;
  mtmFormula: any;
  pricingType: PricingType;
  mtmFutureMonth?: string;
  efpPremium?: number;
  efpAgreedStatus?: boolean;
  efpFixedValue?: number;
  efpDesignatedMonth?: string;
  legs: any[];
}
