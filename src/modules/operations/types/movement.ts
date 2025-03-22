
import { z } from 'zod';

// Movement status enum
export enum MovementStatus {
  Scheduled = 'scheduled',
  Nominated = 'nominated',
  Loading = 'loading',
  Completed = 'completed',
}

// Movement schema
export const movementSchema = z.object({
  id: z.string().uuid(),
  tradeLegId: z.string().uuid(),
  movementReference: z.string(),
  status: z.nativeEnum(MovementStatus),
  nominatedDate: z.date().optional(),
  nominationValidDate: z.date().optional(),
  cashFlowDate: z.date().optional(),
  vesselName: z.string().optional(),
  loadport: z.string().optional(),
  disport: z.string().optional(),
  inspector: z.string().optional(),
  blDate: z.date().optional(),
  blQuantity: z.number().optional(),
  actualized: z.boolean().default(false),
  actualizedDate: z.date().optional(),
  actualizedQuantity: z.number().optional(),
  comments: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Movement = z.infer<typeof movementSchema>;
