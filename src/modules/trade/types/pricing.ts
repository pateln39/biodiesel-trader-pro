
import { z } from 'zod';
import { TokenType } from '@/core/types/common';

// Define the token types - use the TokenType from core/types
export { TokenType };

// Define the instrument type
export type Instrument = 'Argus UCOME' | 'Argus RME' | 'Argus FAME0' | 'Platts LSGO' | 'Platts diesel';

// Formula token schema
export const formulaTokenSchema = z.object({
  id: z.string(),
  type: z.enum(['instrument', 'fixedValue', 'percentage', 'operator', 'openBracket', 'closeBracket']),
  value: z.string()
});

// Export the token type
export type FormulaToken = z.infer<typeof formulaTokenSchema>;

// Exposure tracking
export interface ExposureResult {
  physical: Record<string, number>;
  pricing: Record<string, number>;
}

// Pricing formula schema
export const pricingFormulaSchema = z.object({
  tokens: z.array(formulaTokenSchema),
  exposures: z.object({
    physical: z.record(z.string(), z.number()),
    pricing: z.record(z.string(), z.number())
  })
});

// Export the pricing formula type
export type PricingFormula = z.infer<typeof pricingFormulaSchema>;

// Price calculation schema
export const priceCalculationSchema = z.object({
  formula: pricingFormulaSchema,
  basePrice: z.number().optional(),
  calculatedPrice: z.number(),
  calculationDate: z.date(),
  marketPrices: z.record(z.string(), z.number())
});

// Export the price calculation type
export type PriceCalculation = z.infer<typeof priceCalculationSchema>;

// Price data schema
export const pricingDataSchema = z.object({
  instrument: z.string(),
  date: z.date(),
  price: z.number(),
  formula: pricingFormulaSchema.optional()
});

// Export the pricing data type
export type PricingData = z.infer<typeof pricingDataSchema>;
