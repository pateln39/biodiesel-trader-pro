
// Export all types from the admin module
export * from './reference-data';

// Add additional types
import { AuditLog, DateRange } from '@/core/types/common';

// Re-export important types that consumers of this module will need
export type { AuditLog, DateRange };
