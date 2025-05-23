
import { z } from 'zod';

export const demurrageFormSchema = z.object({
  bargeName: z.string().min(1, "Barge name is required"),
  bargeVesselId: z.string().optional(), // Reference to the database barge id
  blDate: z.date().optional(),
  deadWeight: z.number().min(0).optional(),
  quantityLoaded: z.number().min(0).optional(),
  calculationRate: z.enum(["TTB", "BP"]),
  nominationSent: z.date().optional(),
  nominationValid: z.date().optional(),
  bargeArrived: z.date().optional(),
  timeStartsToRun: z.date().optional(),
  loadPort: z.object({
    start: z.date().optional(),
    finish: z.date().optional(),
    rounding: z.enum(["Y", "N"]),
    loadDemurrage: z.number().min(0).optional(),
    isManual: z.boolean().default(false),
    overrideComment: z.string().optional(),
  }),
  dischargePort: z.object({
    start: z.date().optional(),
    finish: z.date().optional(),
    rounding: z.enum(["Y", "N"]),
    dischargeDemurrage: z.number().min(0).optional(),
    isManual: z.boolean().default(false),
    overrideComment: z.string().optional(),
  }),
  freeTime: z.number().min(0).optional(),  // Will be auto-calculated
  rate: z.number().min(0).optional(),      // Will be auto-calculated
  comments: z.string().optional(),
});

export type DemurrageFormValues = z.infer<typeof demurrageFormSchema>;

export interface ManualOverride {
  value: number;
  comment: string;
  timestamp: Date;
}
