
// Re-export all types
export * from './common';
export * from './trade';
export * from './pricing';
export * from './physical';
export * from './paper';  // Add this line to export paper types

// Add TradeType here to resolve circular dependency
export type TradeType = "physical" | "paper";
