
-- DATABASE STRUCTURE BACKUP (March 21st, 2024)
-- This file contains the SQL commands to recreate the database schema
-- It can be used to restore the database structure if needed

-- Step 1: Create reference data tables

-- Counterparties table
CREATE TABLE IF NOT EXISTS public.counterparties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Credit status options
CREATE TABLE IF NOT EXISTS public.credit_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Incoterms table
CREATE TABLE IF NOT EXISTS public.inco_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Payment terms table
CREATE TABLE IF NOT EXISTS public.payment_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Sustainability options table
CREATE TABLE IF NOT EXISTS public.sustainability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Brokers table
CREATE TABLE IF NOT EXISTS public.brokers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Step 2: Create pricing related tables

-- Pricing instruments table
CREATE TABLE IF NOT EXISTS public.pricing_instruments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_code TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Historical prices table
CREATE TABLE IF NOT EXISTS public.historical_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_id UUID NOT NULL REFERENCES pricing_instruments(id),
  price_date DATE NOT NULL,
  price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Forward prices table
CREATE TABLE IF NOT EXISTS public.forward_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_id UUID NOT NULL REFERENCES pricing_instruments(id),
  forward_month DATE NOT NULL,
  price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 3: Create paper trading related tables

-- Paper trade products table
CREATE TABLE IF NOT EXISTS public.paper_trade_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code TEXT NOT NULL,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL,
  base_product TEXT,
  paired_product TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Product relationships table
CREATE TABLE IF NOT EXISTS public.product_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  paired_product TEXT,
  default_opposite TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Trading periods table
CREATE TABLE IF NOT EXISTS public.trading_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_code TEXT NOT NULL,
  period_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Step 4: Create main trading tables

-- Parent trades table
CREATE TABLE IF NOT EXISTS public.parent_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_reference TEXT NOT NULL,
  trade_type TEXT NOT NULL,
  physical_type TEXT,
  counterparty TEXT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trade legs table
CREATE TABLE IF NOT EXISTS public.trade_legs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_trade_id UUID NOT NULL REFERENCES parent_trades(id) ON DELETE CASCADE,
  leg_reference TEXT NOT NULL,
  buy_sell TEXT NOT NULL,
  product TEXT NOT NULL,
  sustainability TEXT,
  inco_term TEXT,
  quantity NUMERIC NOT NULL,
  tolerance NUMERIC,
  loading_period_start DATE,
  loading_period_end DATE,
  pricing_period_start DATE,
  pricing_period_end DATE,
  unit TEXT,
  payment_term TEXT,
  credit_status TEXT,
  pricing_formula JSONB,
  broker TEXT,
  instrument TEXT,
  price NUMERIC,
  calculated_price NUMERIC,
  last_calculation_date TIMESTAMP WITH TIME ZONE,
  mtm_formula JSONB,
  mtm_calculated_price NUMERIC,
  mtm_last_calculation_date TIMESTAMP WITH TIME ZONE,
  trading_period TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 5: Enable realtime functionality
-- Run these commands to enable real-time on the main tables
ALTER PUBLICATION supabase_realtime ADD TABLE parent_trades, trade_legs;
ALTER TABLE parent_trades REPLICA IDENTITY FULL;
ALTER TABLE trade_legs REPLICA IDENTITY FULL;

-- Step 6: Add documentation comments
COMMENT ON TABLE parent_trades IS 'Stores the main trade information';
COMMENT ON TABLE trade_legs IS 'Stores individual legs of trades';
COMMENT ON TABLE pricing_instruments IS 'Stores pricing instruments available for formulas';
COMMENT ON TABLE historical_prices IS 'Historical price data for instruments';
COMMENT ON TABLE forward_prices IS 'Forward price curves for instruments';
COMMENT ON TABLE paper_trade_products IS 'Products specific to paper trading';
COMMENT ON TABLE product_relationships IS 'Defines relationships between products for paper trading';
COMMENT ON TABLE trading_periods IS 'Trading periods for paper trades';
