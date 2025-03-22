
import { z } from 'zod';

// Common trade enums and types shared between physical and paper trades
export enum TradeType {
  Physical = 'physical',
  Paper = 'paper',
}

export enum BuySell {
  Buy = 'buy',
  Sell = 'sell',
}

export enum PhysicalType {
  Spot = 'spot',
  Term = 'term',
}

export enum Unit {
  MT = 'MT',
  KG = 'KG',
  LT = 'LT',
}

// Base schema for trades
export const tradeBaseSchema = z.object({
  id: z.string().uuid(),
  tradeReference: z.string(),
  tradeType: z.nativeEnum(TradeType),
  counterparty: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type TradeBase = z.infer<typeof tradeBaseSchema>;
