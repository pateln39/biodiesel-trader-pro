import { z } from 'zod';

// Pagination parameters
export const paginationParamsSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export type PaginationParams = z.infer<typeof paginationParamsSchema>;

// Paginated response
export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    meta: z.object({
      total: z.number().int(),
      page: z.number().int(),
      pageSize: z.number().int(),
      pageCount: z.number().int(),
    }),
  });

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    pageCount: number;
  };
};

// API error
export const apiErrorSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
  status: z.number().optional(),
  details: z.any().optional(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;

// Date range
export const dateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
});

export type DateRange = z.infer<typeof dateRangeSchema>;

// Audit log
export const auditLogSchema = z.object({
  id: z.string().uuid(),
  tableName: z.string(),
  recordId: z.string().uuid(),
  operation: z.enum(['INSERT', 'UPDATE', 'DELETE']),
  oldData: z.record(z.any()).optional(),
  newData: z.record(z.any()).optional(),
  userId: z.string().optional(),
  timestamp: z.date(),
});

export type AuditLog = z.infer<typeof auditLogSchema>;

// Common business types
export type Instrument = string;
export type OperatorType = "+" | "-" | "*" | "/" | "%" | "()";
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

// Common database interfaces
export interface DbParentTrade {
  id: string;
  trade_reference: string;
  trade_type: string;
  physical_type?: string;
  counterparty: string;
  comment?: string;
  created_at: string;
  updated_at: string;
}

export interface DbTradeLeg {
  id: string;
  parent_trade_id: string;
  leg_reference: string;
  buy_sell: string;
  product: string;
  sustainability?: string;
  inco_term?: string;
  quantity: number;
  tolerance?: number;
  loading_period_start?: string;
  loading_period_end?: string;
  pricing_period_start?: string;
  pricing_period_end?: string;
  unit?: string;
  payment_term?: string;
  credit_status?: string;
  pricing_formula?: any;
  mtm_formula?: any;
  broker?: string;
  instrument?: string;
  price?: number;
  calculated_price?: number;
  last_calculation_date?: string;
  mtm_calculated_price?: number;
  mtm_last_calculation_date?: string;
  created_at: string;
  updated_at: string;
  trading_period?: string;
}

// Base interfaces for trades
export interface ParentTrade {
  id: string;
  tradeReference: string;
  tradeType: string;
  counterparty: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Trade extends ParentTrade {
  id: string;
  tradeReference: string;
  tradeType: string;
  createdAt: Date;
  updatedAt: Date;
}

// Movement base interface
export interface BaseMovement {
  id: string;
  tradeId: string;
  legId?: string;
  scheduledQuantity: number;
  nominatedDate?: Date;
  vesselName?: string;
  loadport?: string;
  inspector?: string;
  blDate?: Date;
  actualQuantity?: number;
  status: "scheduled" | "in-progress" | "completed";
}

// Price types for pricing data
export interface PricePoint {
  date: Date;
  price: number;
}

export interface PriceRange {
  startDate: Date;
  endDate: Date;
  points: PricePoint[];
  average: number;
}
