
import { z } from 'zod';

// Payment schema
export const paymentSchema = z.object({
  id: z.string().uuid(),
  invoiceId: z.string().uuid().optional(),
  paymentReference: z.string(),
  paymentDate: z.date(),
  amount: z.number(),
  currency: z.string().default('USD'),
  paymentMethod: z.string().optional(),
  comments: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Payment = z.infer<typeof paymentSchema>;
