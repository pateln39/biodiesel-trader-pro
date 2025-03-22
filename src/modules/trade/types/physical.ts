
import { z } from 'zod';
import { BuySell, PhysicalType, TradeType, Unit, tradeBaseSchema } from './common';

// Product types
export enum Product {
  UCOME = 'UCOME',
  FAME = 'FAME',
  RME = 'RME',
  SME = 'SME',
  TME = 'TME',
  PME = 'PME',
  CME = 'CME',
  UCO = 'UCO',
  TALLOW = 'TALLOW',
}

// INCO terms
export enum IncoTerm {
  FOB = 'FOB',
  CIF = 'CIF',
  CFR = 'CFR',
  DDP = 'DDP',
  DAP = 'DAP',
  FCA = 'FCA',
}

// Payment terms
export enum PaymentTerm {
  ThirtyDays = '30 days',
  SixtyDays = '60 days',
  NinetyDays = '90 days',
  OneHundredTwentyDays = '120 days',
  Cash = 'cash',
  CashAgainstDocuments = 'CAD',
}

// Credit status
export enum CreditStatus {
  Approved = 'approved',
  Pending = 'pending',
  Rejected = 'rejected',
  InReview = 'in_review',
  Prepay = 'prepay',
}

// Formula component for pricing
export interface FormulaComponent {
  instrument: string;
  percentage: number;
  operation: 'add' | 'subtract' | 'multiply' | 'divide';
  value: number;
}

// Formula definition
export interface Formula {
  components: FormulaComponent[];
  premiumValue: number;
}

// Physical trade leg schema
export const physicalTradeLegSchema = z.object({
  id: z.string().uuid(),
  parentTradeId: z.string().uuid(),
  legReference: z.string(),
  buySell: z.nativeEnum(BuySell),
  product: z.nativeEnum(Product),
  sustainability: z.string().optional(),
  incoTerm: z.nativeEnum(IncoTerm),
  quantity: z.number(),
  tolerance: z.number(),
  loadingPeriodStart: z.date(),
  loadingPeriodEnd: z.date(),
  pricingPeriodStart: z.date(),
  pricingPeriodEnd: z.date(),
  unit: z.nativeEnum(Unit),
  paymentTerm: z.nativeEnum(PaymentTerm),
  creditStatus: z.nativeEnum(CreditStatus),
  formula: z.any(), // Using any for now, ideally this would be a more specific type
  mtmFormula: z.any().optional(),
});

export type PhysicalTradeLeg = z.infer<typeof physicalTradeLegSchema>;

// Physical trade schema
export const physicalTradeSchema = tradeBaseSchema.extend({
  tradeType: z.literal(TradeType.Physical),
  physicalType: z.nativeEnum(PhysicalType),
  buySell: z.nativeEnum(BuySell),
  product: z.nativeEnum(Product),
  sustainability: z.string().optional(),
  incoTerm: z.nativeEnum(IncoTerm),
  quantity: z.number(),
  tolerance: z.number(),
  loadingPeriodStart: z.date(),
  loadingPeriodEnd: z.date(),
  pricingPeriodStart: z.date(),
  pricingPeriodEnd: z.date(),
  unit: z.nativeEnum(Unit),
  paymentTerm: z.nativeEnum(PaymentTerm),
  creditStatus: z.nativeEnum(CreditStatus),
  formula: z.any(), // Using any for now, ideally this would be a more specific type
  mtmFormula: z.any().optional(),
  legs: z.array(physicalTradeLegSchema),
});

export type PhysicalTrade = z.infer<typeof physicalTradeSchema>;
