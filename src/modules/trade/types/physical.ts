
import { z } from 'zod';
import { BuySell, PhysicalType, TradeType, Unit, tradeBaseSchema, Product, IncoTerm, PaymentTerm, CreditStatus } from './common';
import { PricingFormula } from './pricing';

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
  formula: z.any(), // Using any for now for formula
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
  formula: z.any(), // Using any for now for formula
  mtmFormula: z.any().optional(),
  legs: z.array(physicalTradeLegSchema),
});

export type PhysicalTrade = z.infer<typeof physicalTradeSchema>;
