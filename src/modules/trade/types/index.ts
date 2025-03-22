
// Export all trade module types
export * from './common';
export * from './physical';
export * from './paper';
export * from './pricing';

// Import and re-export unified trade type
import { PaperTrade } from './paper';
import { PhysicalTrade } from './physical';
import { TradeType } from './common';

// Unified trade type that can be either physical or paper
export type Trade = PhysicalTrade | PaperTrade;

// Make TradeType easily accessible
export { TradeType };
