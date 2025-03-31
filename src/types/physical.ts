
import { 
  TradeType, 
  BuySell, 
  Product, 
  PhysicalTradeType, 
  IncoTerm, 
  Unit, 
  PaymentTerm, 
  CreditStatus, 
  PricingType, 
  TradeLeg 
} from './index';
import { PricingFormula } from './pricing';

export interface PhysicalParentTrade {
  id: string;
  tradeReference: string;
  tradeType: 'physical';
  physicalType: PhysicalTradeType;
  counterparty: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PhysicalTradeLeg extends TradeLeg {
  pricingType: PricingType;
  efpPremium?: number;
  efpAgreedStatus?: boolean;
  efpFixedValue?: number;
  efpDesignatedMonth?: string;
}

export interface PhysicalTrade extends PhysicalParentTrade {
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
  formula?: PricingFormula;
  mtmFormula?: PricingFormula;
  legs: PhysicalTradeLeg[];
  pricingType?: PricingType;
  efpPremium?: number;
  efpAgreedStatus?: boolean;
  efpFixedValue?: number;
  efpDesignatedMonth?: string;
}
