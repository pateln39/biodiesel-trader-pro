
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

export enum PaymentTerm {
  Advance = 'advance',
  ThirtyDays = '30 days',
  SixtyDays = '60 days',
  NinetyDays = '90 days',
}

export enum CreditStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}

export enum IncoTerm {
  FOB = 'FOB',
  CIF = 'CIF',
  DES = 'DES',
  DAP = 'DAP',
  FCA = 'FCA',
}

export enum Product {
  FAME0 = 'FAME0',
  RME = 'RME',
  UCOME = 'UCOME',
  UCOME5 = 'UCOME-5',
  RMEDC = 'RME DC',
  CME = 'CME',
}

export type DisplayProduct = string; // For displaying formatted product names
export type PaperRelationshipType = "FP" | "DIFF" | "SPREAD";

// Product relationship interface for the UI
export interface ProductRelationship {
  id: string;
  product: string;
  relationship_type: PaperRelationshipType;
  paired_product: string | null;
  default_opposite: string | null;
  created_at?: string;
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

// Add TokenType enum for FormulaBuilder
export enum TokenType {
  Instrument = 'instrument',
  Operator = 'operator',
  Value = 'value',
  Percentage = 'percentage',
  OpenBracket = 'open_bracket',
  CloseBracket = 'close_bracket',
  FixedValue = 'fixedValue'
}
