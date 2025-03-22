
import { z } from 'zod';
import { BuySell, TradeType, tradeBaseSchema, PaperRelationshipType } from './common';
import { PricingFormula } from './pricing';

// Paper trade product types
export enum PaperProduct {
  FAME = 'FAME0',
  RME = 'RME',
  UCOME = 'UCOME',
  UCO = 'UCO',
  SPREAD = 'SPREAD',
  PME = 'PME',
}

// Broker enum
export enum Broker {
  Direct = 'direct',
  BrokerA = 'broker_a',
  BrokerB = 'broker_b',
  BrokerC = 'broker_c',
}

// Trading period
export enum TradingPeriod {
  Spot = 'spot',
  M1 = 'm1',
  M2 = 'm2',
  M3 = 'm3',
  Q1 = 'q1',
  Q2 = 'q2',
  Q3 = 'q3',
  Q4 = 'q4',
}

// Paper trade leg schema
export const paperTradeLegSchema = z.object({
  id: z.string().uuid(),
  paperTradeId: z.string().uuid(),
  legReference: z.string(),
  buySell: z.nativeEnum(BuySell),
  product: z.nativeEnum(PaperProduct),
  period: z.string().optional(),
  tradingPeriod: z.string().optional(),
  quantity: z.number(),
  price: z.number().optional(),
  broker: z.string().optional(),
  instrument: z.string().optional(),
  pricingPeriodStart: z.date().optional(),
  pricingPeriodEnd: z.date().optional(),
  formula: z.any().optional(), // Using any for now
  mtmFormula: z.any().optional(),
  exposures: z.any().optional(),
  relationshipType: z.enum(['FP', 'DIFF', 'SPREAD']).optional(),
  rightSide: z.object({
    product: z.nativeEnum(PaperProduct),
    quantity: z.number(),
    period: z.string().optional(),
  }).optional(),
});

export type PaperTradeLeg = z.infer<typeof paperTradeLegSchema>;

// Paper trade schema
export const paperTradeSchema = tradeBaseSchema.extend({
  tradeType: z.literal(TradeType.Paper),
  broker: z.string().optional(),
  comment: z.string().optional(),
  legs: z.array(paperTradeLegSchema),
});

export type PaperTrade = z.infer<typeof paperTradeSchema>;
