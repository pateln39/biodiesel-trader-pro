
// Empty the mock data file, as we'll be using Supabase for real data
import { 
  Trade, 
  PhysicalTrade, 
  PaperTrade,
  Movement, 
  AuditLog,
  ExposureReportItem
} from "@/types";

// Export empty arrays for backward compatibility until we remove all mock data references
export const mockPhysicalTrades: PhysicalTrade[] = [];
export const mockPaperTrades: PaperTrade[] = [];
export const mockTrades: Trade[] = [];
export const mockMovements: Movement[] = [];
export const mockAuditLogs: AuditLog[] = [];
export const mockExposureReport: ExposureReportItem[] = [];
