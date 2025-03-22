
// Export all types from the trade module
export * from './common';
export * from './physical';
export * from './paper';

// Import and re-export unified trade type
import { PaperTrade } from './paper';
import { PhysicalTrade } from './physical';

// Unified trade type that can be either physical or paper
export type Trade = PhysicalTrade | PaperTrade;
