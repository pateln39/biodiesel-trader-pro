
import { z } from 'zod';
import { MTMPriceDetail } from '@/core/types/common';

// MTM calculation schema
export const mtmCalculationSchema = z.object({
  tradeId: z.string().uuid(),
  tradeLegId: z.string().uuid(),
  tradeReference: z.string(),
  counterparty: z.string(),
  product: z.string(),
  quantity: z.number(),
  contractPrice: z.number(),
  marketPrice: z.number(),
  mtmValue: z.number(),
  pnlValue: z.number().optional(),
  tradePrice: z.number().optional(),
  calculationDate: z.date(),
});

export type MTMCalculation = z.infer<typeof mtmCalculationSchema>;

// Re-export MTMPriceDetail from core types
export type { MTMPriceDetail };

