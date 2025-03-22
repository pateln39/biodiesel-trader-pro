
// Export shared types from core module
export * from './common';

// Import specific types from original locations to avoid duplicates
// Prefer importing from modules instead of directly from src/types for better architecture
import { AuditLog, DateRange } from '@/modules/admin/types';
import { PricePoint, PriceRange } from '@/types/pricing';

// Re-export specific types
export type { AuditLog, DateRange };
export type { PricePoint, PriceRange };
