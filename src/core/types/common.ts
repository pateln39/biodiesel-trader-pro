
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

// Common business types that are used across multiple modules
export type Instrument = string;
export type OperatorType = "+" | "-" | "*" | "/" | "%" | "()";
