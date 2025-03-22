
import { z } from 'zod';

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
  calculationDate: z.date(),
});

export type MTMCalculation = z.infer<typeof mtmCalculationSchema>;

// Enhanced MTM price detail interfaces
export interface MTMPriceDetail {
  instruments: Record<string, { price: number; date: Date | null }>;
  evaluatedPrice: number;
  fixedComponents?: Array<{ value: number; displayValue: string }>;
}
