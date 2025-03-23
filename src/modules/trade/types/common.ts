
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

// Common physical product enum
export enum Product {
  UCOME = 'UCOME',
  FAME = 'FAME0',
  RME = 'RME',
  SME = 'SME',
  TME = 'TME',
  PME = 'PME',
  CME = 'CME',
  UCO = 'UCO',
  TALLOW = 'TALLOW',
}

// Add PhysicalTradeType for backward compatibility
export type PhysicalTradeType = PhysicalType;

// Also define PhysicalParentTrade for backward compatibility
export interface PhysicalParentTrade {
  id: string;
  tradeReference: string;
  tradeType: TradeType.Physical;
  physicalType: PhysicalType;
  counterparty: string;
  createdAt: Date;
  updatedAt: Date;
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

// Add TokenType enum for FormulaBuilder - importing from core types
export { TokenType } from '@/core/types/common';
