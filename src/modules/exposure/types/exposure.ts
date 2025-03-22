
import { z } from 'zod';

// Exposure type enum
export enum ExposureType {
  Physical = 'physical',
  Pricing = 'pricing',
  Paper = 'paper',
  Net = 'net',
}

// Exposure schema
export const exposureSchema = z.object({
  period: z.string(),
  instrument: z.string(),
  type: z.nativeEnum(ExposureType),
  quantity: z.number(),
  price: z.number().optional(),
  value: z.number().optional(),
});

export type Exposure = z.infer<typeof exposureSchema>;
