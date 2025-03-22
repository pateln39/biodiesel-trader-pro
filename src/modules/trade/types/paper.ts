
import { z } from 'zod';
import { BuySell, TradeType, tradeBaseSchema } from './common';

// Paper trade enums
export enum PaperProduct {
  FAME0 = 'FAME0',
  FAME_RED_II = 'FAME_RED_II', 
  UCOME = 'UCOME',
  UCOME_RED_II = 'UCOME_RED_II',
  RME = 'RME',
  RME_RED_II = 'RME_RED_II',
  SME = 'SME',
  SME_RED_II = 'SME_RED_II',
  PME = 'PME',
  PME_RED_II = 'PME_RED_II',
  TME = 'TME',
  TME_RED_II = 'TME_RED_II',
}

// Paper trade leg schema
export const paperTradeLegSchema = z.object({
  id: z.string().uuid(),
  paperTradeId: z.string().uuid(),
  legReference: z.string(),
  buySell: z.nativeEnum(BuySell),
  product: z.string(),
  period: z.string().optional(),
  quantity: z.number(),
  price: z.number().optional(),
  formula: z.any().optional(),
  mtmFormula: z.any().optional(),
  pricingPeriodStart: z.date().optional(),
  pricingPeriodEnd: z.date().optional(),
  broker: z.string().optional(),
  instrument: z.string().optional(),
  tradingPeriod: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  exposures: z.any().optional(),
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
