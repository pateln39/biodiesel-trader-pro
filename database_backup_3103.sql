
-- DATABASE STRUCTURE BACKUP (March 31st, 2024)
-- This file contains the SQL commands to recreate the database schema
-- It can be used to restore the database structure if needed

-- Step 1: Create reference data tables

-- Counterparties table - Stores information about trading partners
CREATE TABLE IF NOT EXISTS public.counterparties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- Name of the counterparty
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  vat_number TEXT, -- VAT registration number for invoicing
  is_active BOOLEAN DEFAULT true, -- Whether the counterparty is active for trading
  bank_details JSONB, -- Bank account information for payments
  contact_details JSONB -- Contact information like emails, phone numbers
);

-- Credit status options - Reference data for credit statuses
CREATE TABLE IF NOT EXISTS public.credit_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- Name of the credit status (e.g., "Approved", "On hold")
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Incoterms table - Reference data for international commercial terms
CREATE TABLE IF NOT EXISTS public.inco_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- Name of the incoterm (e.g., "CIF", "FOB")
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Payment terms table - Reference data for payment conditions
CREATE TABLE IF NOT EXISTS public.payment_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- Name of payment term (e.g., "Net 30", "Cash in advance")
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Products table - Reference data for physical products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- Name of the product (e.g., "Biodiesel", "FAME")
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Sustainability options table - Reference data for sustainability certificates
CREATE TABLE IF NOT EXISTS public.sustainability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- Name of sustainability certificate (e.g., "ISCC", "RedCert")
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Brokers table - Reference data for trade brokers
CREATE TABLE IF NOT EXISTS public.brokers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- Name of the broker
  is_active BOOLEAN DEFAULT true, -- Whether the broker is active
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Step 2: Create pricing related tables

-- Pricing instruments table - Stores available pricing instruments for formulas
CREATE TABLE IF NOT EXISTS public.pricing_instruments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_code TEXT NOT NULL, -- Code used in system (e.g., "LSGO")
  display_name TEXT NOT NULL, -- Human-readable name (e.g., "ICE Low Sulphur Gasoil")
  description TEXT, -- Detailed description of the instrument
  category TEXT, -- Category grouping (e.g., "Futures", "Swaps")
  is_active BOOLEAN DEFAULT true, -- Whether the instrument is available for use
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Historical prices table - Stores past closing prices for instruments
CREATE TABLE IF NOT EXISTS public.historical_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_id UUID NOT NULL REFERENCES pricing_instruments(id),
  price_date DATE NOT NULL, -- Date of the price
  price NUMERIC NOT NULL, -- Price value on that date
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Forward prices table - Stores forward curve data for instruments
CREATE TABLE IF NOT EXISTS public.forward_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_id UUID NOT NULL REFERENCES pricing_instruments(id),
  forward_month DATE NOT NULL, -- Contract month for the forward price
  price NUMERIC NOT NULL, -- Forward price for that month
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 3: Create paper trading related tables

-- Paper trade products table - Products specific to paper trading
CREATE TABLE IF NOT EXISTS public.paper_trade_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code TEXT NOT NULL, -- System code for the product
  display_name TEXT NOT NULL, -- Human-readable name
  category TEXT NOT NULL, -- Category grouping
  base_product TEXT, -- Related physical product if applicable
  paired_product TEXT, -- Product that can be paired in spreads
  is_active BOOLEAN DEFAULT true, -- Whether the product is available
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Product relationships table - Defines relationships between products
CREATE TABLE IF NOT EXISTS public.product_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product TEXT NOT NULL, -- Primary product
  relationship_type TEXT NOT NULL, -- Type of relationship
  paired_product TEXT, -- Secondary product in the relationship
  default_opposite TEXT, -- Default product for opposite leg
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Trading periods table - Defines trading periods for paper trades
CREATE TABLE IF NOT EXISTS public.trading_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_code TEXT NOT NULL, -- Period code (e.g., "Mar-24")
  period_type TEXT NOT NULL, -- Type of period (e.g., "Month", "Quarter")
  start_date DATE NOT NULL, -- Start date of the period
  end_date DATE NOT NULL, -- End date of the period
  is_active BOOLEAN DEFAULT true, -- Whether the period is active
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Step 4: Create main trading tables

-- Parent trades table - Stores the main trade information
CREATE TABLE IF NOT EXISTS public.parent_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_reference TEXT NOT NULL, -- Unique reference for the trade
  trade_type TEXT NOT NULL, -- Type of trade (e.g., "Physical", "Paper")
  physical_type TEXT, -- Subtype for physical trades
  counterparty TEXT NOT NULL, -- Trading partner
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trade legs table - Stores individual legs of trades
CREATE TABLE IF NOT EXISTS public.trade_legs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_trade_id UUID NOT NULL REFERENCES parent_trades(id) ON DELETE CASCADE,
  leg_reference TEXT NOT NULL, -- Unique reference for this leg
  buy_sell TEXT NOT NULL, -- Direction ("Buy" or "Sell")
  product TEXT NOT NULL, -- Product being traded
  sustainability TEXT, -- Sustainability certificate if applicable
  inco_term TEXT, -- Delivery terms
  quantity NUMERIC NOT NULL, -- Trade quantity
  tolerance NUMERIC, -- Allowed quantity tolerance
  loading_period_start DATE, -- Start of loading period
  loading_period_end DATE, -- End of loading period
  pricing_period_start DATE, -- Start of pricing period
  pricing_period_end DATE, -- End of pricing period
  unit TEXT, -- Unit of measurement
  payment_term TEXT, -- Payment conditions
  credit_status TEXT, -- Credit status
  pricing_formula JSONB, -- Formula used for pricing
  broker TEXT, -- Broker if applicable
  instrument TEXT, -- Pricing instrument
  price NUMERIC, -- Fixed price if applicable
  calculated_price NUMERIC, -- Price calculated from formula
  last_calculation_date TIMESTAMP WITH TIME ZONE, -- When price was last calculated
  mtm_formula JSONB, -- Formula for mark-to-market
  mtm_calculated_price NUMERIC, -- Calculated MTM price
  mtm_last_calculation_date TIMESTAMP WITH TIME ZONE, -- When MTM was last calculated
  trading_period TEXT, -- Trading period reference
  exposures JSONB, -- Calculated exposures data
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 5: Create operations tables

-- Movements table - Tracks physical movements of products
CREATE TABLE IF NOT EXISTS public.movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_leg_id UUID REFERENCES trade_legs(id),
  movement_reference TEXT NOT NULL, -- Unique reference for this movement
  status TEXT NOT NULL, -- Current status
  nominated_date DATE, -- Date of nomination
  nomination_valid_date DATE, -- Validity date for nomination
  vessel_name TEXT, -- Name of the vessel
  loadport TEXT, -- Loading port
  disport TEXT, -- Discharge port
  inspector TEXT, -- Inspection company
  bl_date DATE, -- Bill of lading date
  bl_quantity NUMERIC, -- Quantity on bill of lading
  cash_flow_date DATE, -- Date for cash flow
  actualized BOOLEAN DEFAULT false, -- Whether movement is complete
  actualized_date DATE, -- Date movement was completed
  actualized_quantity NUMERIC, -- Final quantity
  comments TEXT, -- Additional notes
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Invoices table - Tracks invoices related to trades
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movement_id UUID REFERENCES movements(id),
  invoice_reference TEXT NOT NULL, -- Unique reference for this invoice
  invoice_type TEXT NOT NULL, -- Type of invoice
  invoice_date DATE NOT NULL, -- Issue date
  due_date DATE NOT NULL, -- Payment due date
  amount NUMERIC NOT NULL, -- Invoice amount
  currency TEXT NOT NULL DEFAULT 'USD', -- Currency
  calculated_price NUMERIC, -- Calculated price used
  quantity NUMERIC, -- Quantity invoiced
  vat_rate NUMERIC, -- VAT percentage
  vat_amount NUMERIC, -- VAT amount
  total_amount NUMERIC, -- Total including VAT
  status TEXT NOT NULL DEFAULT 'draft', -- Current status
  comments TEXT, -- Additional notes
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Payments table - Tracks payments against invoices
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id),
  payment_reference TEXT NOT NULL, -- Unique reference for this payment
  payment_date DATE NOT NULL, -- Date of payment
  payment_method TEXT, -- Method used
  amount NUMERIC NOT NULL, -- Amount paid
  currency TEXT NOT NULL DEFAULT 'USD', -- Currency
  comments TEXT, -- Additional notes
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 6: Create paper trades tables

-- Paper trades table - Stores paper trades
CREATE TABLE IF NOT EXISTS public.paper_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_reference TEXT NOT NULL, -- Unique reference for the trade
  counterparty TEXT NOT NULL, -- Trading partner
  broker TEXT, -- Broker if applicable
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Paper trade legs table - Stores individual legs of paper trades
CREATE TABLE IF NOT EXISTS public.paper_trade_legs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_trade_id UUID NOT NULL REFERENCES paper_trades(id) ON DELETE CASCADE,
  leg_reference TEXT NOT NULL, -- Unique reference for this leg
  buy_sell TEXT NOT NULL, -- Direction ("Buy" or "Sell")
  product TEXT NOT NULL, -- Product being traded
  quantity NUMERIC NOT NULL, -- Trade quantity
  price NUMERIC, -- Fixed price if applicable
  formula JSONB, -- Formula used for pricing
  mtm_formula JSONB, -- Formula for mark-to-market
  pricing_period_start DATE, -- Start of pricing period
  pricing_period_end DATE, -- End of pricing period
  period TEXT, -- Period reference
  broker TEXT, -- Broker if applicable
  instrument TEXT, -- Pricing instrument
  trading_period TEXT, -- Trading period reference
  exposures JSONB, -- Calculated exposures data
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 7: Create audit logging table

-- Audit logs table - Tracks changes to important tables
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL, -- Name of the table being modified
  record_id UUID NOT NULL, -- ID of the record being modified
  operation TEXT NOT NULL, -- Operation type (INSERT, UPDATE, DELETE)
  old_data JSONB, -- Previous data before change
  new_data JSONB, -- New data after change
  user_id TEXT, -- User who made the change
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 8: Add audit triggers for important tables

-- Create the audit log function
CREATE OR REPLACE FUNCTION public.audit_log_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_logs (table_name, record_id, operation, new_data)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_logs (table_name, record_id, operation, old_data, new_data)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_logs (table_name, record_id, operation, old_data)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Add audit triggers to important tables
CREATE TRIGGER audit_parent_trades_changes
AFTER INSERT OR UPDATE OR DELETE ON public.parent_trades
FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER audit_trade_legs_changes
AFTER INSERT OR UPDATE OR DELETE ON public.trade_legs
FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER audit_movements_changes
AFTER INSERT OR UPDATE OR DELETE ON public.movements
FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER audit_invoices_changes
AFTER INSERT OR UPDATE OR DELETE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER audit_payments_changes
AFTER INSERT OR UPDATE OR DELETE ON public.payments
FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- Step 9: Add updated_at triggers

-- Create the set_updated_at function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to relevant tables
CREATE TRIGGER set_parent_trades_updated_at
BEFORE UPDATE ON public.parent_trades
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_trade_legs_updated_at
BEFORE UPDATE ON public.trade_legs
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_movements_updated_at
BEFORE UPDATE ON public.movements
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_paper_trades_updated_at
BEFORE UPDATE ON public.paper_trades
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_paper_trade_legs_updated_at
BEFORE UPDATE ON public.paper_trade_legs
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Step 10: Enable realtime functionality
-- Run these commands to enable real-time on the main tables
ALTER PUBLICATION supabase_realtime ADD TABLE parent_trades, trade_legs;
ALTER TABLE parent_trades REPLICA IDENTITY FULL;
ALTER TABLE trade_legs REPLICA IDENTITY FULL;

-- Step 11: Add documentation comments
COMMENT ON TABLE parent_trades IS 'Stores the main trade information';
COMMENT ON TABLE trade_legs IS 'Stores individual legs of trades';
COMMENT ON TABLE pricing_instruments IS 'Stores pricing instruments available for formulas';
COMMENT ON TABLE historical_prices IS 'Historical price data for instruments';
COMMENT ON TABLE forward_prices IS 'Forward price curves for instruments';
COMMENT ON TABLE paper_trade_products IS 'Products specific to paper trading';
COMMENT ON TABLE product_relationships IS 'Defines relationships between products for paper trading';
COMMENT ON TABLE trading_periods IS 'Trading periods for paper trades';
COMMENT ON TABLE movements IS 'Physical movements for trade legs';
COMMENT ON TABLE invoices IS 'Invoices related to movements';
COMMENT ON TABLE payments IS 'Payments against invoices';
COMMENT ON TABLE paper_trades IS 'Paper trades master data';
COMMENT ON TABLE paper_trade_legs IS 'Individual legs of paper trades';
COMMENT ON TABLE audit_logs IS 'Audit trail of changes to important tables';
