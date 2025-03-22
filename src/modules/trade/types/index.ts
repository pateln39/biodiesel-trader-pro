
// Export all types from the trade module
export * from './common';
export * from './physical';
export * from './paper';

// Unified trade type
import { PaperTrade } from './paper';
import { PhysicalTrade } from './physical';

export type Trade = PhysicalTrade | PaperTrade;
