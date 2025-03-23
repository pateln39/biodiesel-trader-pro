import { z } from 'zod';

// Counterparty schema
export const counterpartySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  vatNumber: z.string().optional(),
  bankDetails: z.record(z.any()).optional(),
  contactDetails: z.record(z.any()).optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Counterparty = z.infer<typeof counterpartySchema>;

// Product schema
export const productSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  createdAt: z.date(),
});

export type Product = z.infer<typeof productSchema>;

// Pricing instrument schema
export const pricingInstrumentSchema = z.object({
  id: z.string().uuid(),
  instrumentCode: z.string(),
  displayName: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PricingInstrument = z.infer<typeof pricingInstrumentSchema>;

// Historical price schema
export const historicalPriceSchema = z.object({
  id: z.string().uuid(),
  instrumentId: z.string().uuid(),
  priceDate: z.date(),
  price: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type HistoricalPrice = z.infer<typeof historicalPriceSchema>;

// Forward price schema
export const forwardPriceSchema = z.object({
  id: z.string().uuid(),
  instrumentId: z.string().uuid(),
  forwardMonth: z.date(),
  price: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ForwardPrice = z.infer<typeof forwardPriceSchema>;

// Json type for Supabase
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];
