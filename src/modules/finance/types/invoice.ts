
import { z } from 'zod';

// Invoice type enum
export enum InvoiceType {
  Prepayment = 'prepayment',
  Final = 'final',
  Credit = 'credit',
  Debit = 'debit',
}

// Invoice status enum
export enum InvoiceStatus {
  Draft = 'draft',
  Issued = 'issued',
  Paid = 'paid',
  Cancelled = 'cancelled',
  Overdue = 'overdue',
}

// Invoice schema
export const invoiceSchema = z.object({
  id: z.string().uuid(),
  movementId: z.string().uuid().optional(),
  invoiceReference: z.string(),
  invoiceType: z.nativeEnum(InvoiceType),
  invoiceDate: z.date(),
  dueDate: z.date(),
  amount: z.number(),
  currency: z.string().default('USD'),
  status: z.nativeEnum(InvoiceStatus).default(InvoiceStatus.Draft),
  calculatedPrice: z.number().optional(),
  quantity: z.number().optional(),
  vatRate: z.number().optional(),
  vatAmount: z.number().optional(),
  totalAmount: z.number().optional(),
  comments: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Invoice = z.infer<typeof invoiceSchema>;
