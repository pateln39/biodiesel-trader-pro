
import { z } from 'zod';

// Exposure report item schema
export const exposureReportItemSchema = z.object({
  month: z.string(),
  grade: z.string(),
  physical: z.number(),
  pricing: z.number(),
  paper: z.number(),
  netExposure: z.number(),
});

export type ExposureReportItem = z.infer<typeof exposureReportItemSchema>;

// Exposure calculation result
export interface ExposureResult {
  physical: Record<string, number>;
  pricing: Record<string, number>;
  paper?: Record<string, number>;
}

// Unified exposure type for the application
export interface ExposureData {
  byMonth: ExposureReportItem[];
  byGrade: ExposureReportItem[];
  totalExposure: {
    physical: number;
    pricing: number;
    paper: number;
    net: number;
  };
}
