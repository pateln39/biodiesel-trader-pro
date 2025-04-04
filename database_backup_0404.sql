
-- DATABASE STRUCTURE BACKUP (April 4th, 2024)
-- This file contains the SQL commands to recreate the database schema
-- It can be used to restore the database structure if needed

-- Step 1: Create reference data tables

-- Counterparties table - Stores information about trading partners
CREATE TABLE IF NOT EXISTS public.counterparties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for the counterparty
  name TEXT NOT NULL, -- Name of the counterparty
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()), -- When the record was created
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), -- When the record was last updated
  vat_number TEXT, -- VAT registration number for invoicing
  is_active BOOLEAN DEFAULT true, -- Whether the counterparty is active for trading
  bank_details JSONB, -- Bank account information for payments
  contact_details JSONB -- Contact information like emails, phone numbers
);
COMMENT ON TABLE public.counterparties IS 'Stores trading partner information including contact details and banking information';

-- Credit status options - Reference data for credit statuses
CREATE TABLE IF NOT EXISTS public.credit_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for the credit status
  name TEXT NOT NULL, -- Name of the credit status (e.g., "Approved", "On hold")
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()) -- When the record was created
);
COMMENT ON TABLE public.credit_status IS 'Reference data for possible credit status values used in trades';

-- Customs status options - Reference data for customs statuses
CREATE TABLE IF NOT EXISTS public.customs_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for the customs status
  name TEXT NOT NULL, -- Name of the customs status (e.g., "Cleared", "In progress")
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()) -- When the record was created
);
COMMENT ON TABLE public.customs_status IS 'Reference data for possible customs status values used in trades';

-- Incoterms table - Reference data for international commercial terms
CREATE TABLE IF NOT EXISTS public.inco_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for the incoterm
  name TEXT NOT NULL, -- Name of the incoterm (e.g., "CIF", "FOB")
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()) -- When the record was created
);
COMMENT ON TABLE public.inco_terms IS 'Reference data for international commercial terms (Incoterms) defining delivery conditions';

-- Payment terms table - Reference data for payment conditions
CREATE TABLE IF NOT EXISTS public.payment_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for the payment term
  name TEXT NOT NULL, -- Name of payment term (e.g., "Net 30", "Cash in advance")
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()) -- When the record was created
);
COMMENT ON TABLE public.payment_terms IS 'Reference data for payment terms defining when and how payments should be made';

-- Products table - Reference data for physical products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for the product
  name TEXT NOT NULL, -- Name of the product (e.g., "Biodiesel", "FAME")
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()) -- When the record was created
);
COMMENT ON TABLE public.products IS 'Reference data for physical products that can be traded';

-- Sustainability options table - Reference data for sustainability certificates
CREATE TABLE IF NOT EXISTS public.sustainability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for the sustainability option
  name TEXT NOT NULL, -- Name of sustainability certificate (e.g., "ISCC", "RedCert")
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()) -- When the record was created
);
COMMENT ON TABLE public.sustainability IS 'Reference data for sustainability certificates that can be applied to products';

-- Brokers table - Reference data for trade brokers
CREATE TABLE IF NOT EXISTS public.brokers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for the broker
  name TEXT NOT NULL, -- Name of the broker
  is_active BOOLEAN DEFAULT true, -- Whether the broker is active
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() -- When the record was created
);
COMMENT ON TABLE public.brokers IS 'Reference data for brokers who facilitate trades between counterparties';

-- Step 2: Create pricing related tables

-- Pricing instruments table - Stores available pricing instruments for formulas
CREATE TABLE IF NOT EXISTS public.pricing_instruments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for the instrument
  instrument_code TEXT NOT NULL, -- Code used in system (e.g., "LSGO")
  display_name TEXT NOT NULL, -- Human-readable name (e.g., "ICE Low Sulphur Gasoil")
  description TEXT, -- Detailed description of the instrument
  category TEXT, -- Category grouping (e.g., "Futures", "Swaps")
  is_active BOOLEAN DEFAULT true, -- Whether the instrument is available for use
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), -- When the record was created
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now() -- When the record was last updated
);
COMMENT ON TABLE public.pricing_instruments IS 'Defines pricing instruments (indices, futures contracts) used in price formulas';

-- Historical prices table - Stores past closing prices for instruments
CREATE TABLE IF NOT EXISTS public.historical_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for the price record
  instrument_id UUID NOT NULL REFERENCES pricing_instruments(id), -- Reference to the pricing instrument
  price_date DATE NOT NULL, -- Date of the price
  price NUMERIC NOT NULL, -- Price value on that date
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), -- When the record was created
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now() -- When the record was last updated
);
COMMENT ON TABLE public.historical_prices IS 'Historical price data for each pricing instrument, used for calculations and reporting';

-- Forward prices table - Stores forward curve data for instruments
CREATE TABLE IF NOT EXISTS public.forward_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for the forward price
  instrument_id UUID NOT NULL REFERENCES pricing_instruments(id), -- Reference to the pricing instrument
  forward_month DATE NOT NULL, -- Contract month for the forward price
  price NUMERIC NOT NULL, -- Forward price for that month
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), -- When the record was created
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now() -- When the record was last updated
);
COMMENT ON TABLE public.forward_prices IS 'Forward price curves for each pricing instrument, used for future valuations';

-- Step 3: Create paper trading related tables

-- Paper trade products table - Products specific to paper trading
CREATE TABLE IF NOT EXISTS public.paper_trade_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for the paper trade product
  product_code TEXT NOT NULL, -- System code for the product
  display_name TEXT NOT NULL, -- Human-readable name
  category TEXT NOT NULL, -- Category grouping
  base_product TEXT, -- Related physical product if applicable
  paired_product TEXT, -- Product that can be paired in spreads
  is_active BOOLEAN DEFAULT true, -- Whether the product is available
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() -- When the record was created
);
COMMENT ON TABLE public.paper_trade_products IS 'Defines products that can be traded in paper trading, possibly linked to physical products';

-- Product relationships table - Defines relationships between products
CREATE TABLE IF NOT EXISTS public.product_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for the relationship
  product TEXT NOT NULL, -- Primary product
  relationship_type TEXT NOT NULL, -- Type of relationship
  paired_product TEXT, -- Secondary product in the relationship
  default_opposite TEXT, -- Default product for opposite leg
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() -- When the record was created
);
COMMENT ON TABLE public.product_relationships IS 'Defines how products relate to each other, such as spread relationships';

-- Trading periods table - Defines trading periods for paper trades
CREATE TABLE IF NOT EXISTS public.trading_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for the trading period
  period_code TEXT NOT NULL, -- Period code (e.g., "Mar-24")
  period_type TEXT NOT NULL, -- Type of period (e.g., "Month", "Quarter")
  start_date DATE NOT NULL, -- Start date of the period
  end_date DATE NOT NULL, -- End date of the period
  is_active BOOLEAN DEFAULT true, -- Whether the period is active
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() -- When the record was created
);
COMMENT ON TABLE public.trading_periods IS 'Defines the time periods used for paper trading contracts';

-- Step 4: Create main trading tables

-- Parent trades table - Stores the main trade information
CREATE TABLE IF NOT EXISTS public.parent_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for the trade
  trade_reference TEXT NOT NULL, -- Unique reference for the trade
  trade_type TEXT NOT NULL, -- Type of trade (e.g., "Physical", "Paper")
  physical_type TEXT, -- Subtype for physical trades
  counterparty TEXT NOT NULL, -- Trading partner
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), -- When the record was created
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now() -- When the record was last updated
);
COMMENT ON TABLE public.parent_trades IS 'Master table for all trades, containing common information shared across all legs';

-- Trade legs table - Stores individual legs of trades
CREATE TABLE IF NOT EXISTS public.trade_legs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for the trade leg
  parent_trade_id UUID NOT NULL REFERENCES parent_trades(id) ON DELETE CASCADE, -- Reference to the parent trade
  leg_reference TEXT NOT NULL, -- Unique reference for this leg
  buy_sell TEXT NOT NULL, -- Direction ("buy" or "sell")
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
  customs_status TEXT, -- Customs status
  pricing_type TEXT DEFAULT 'standard', -- Type of pricing (standard, EFP, etc.)
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
  efp_premium NUMERIC, -- EFP premium if applicable
  efp_agreed_status BOOLEAN DEFAULT false, -- Whether EFP terms are agreed
  efp_fixed_value NUMERIC, -- Fixed value for EFP
  efp_designated_month TEXT, -- Designated month for EFP
  mtm_future_month TEXT, -- Future month for MTM calculation
  contract_status TEXT, -- Contract status
  comments TEXT, -- Additional notes
  exposures JSONB, -- Calculated exposures data
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), -- When the record was created
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now() -- When the record was last updated
);
COMMENT ON TABLE public.trade_legs IS 'Detailed information for each leg of a trade, including pricing, delivery terms, and status';

-- Open trades table - Stores currently open trade positions
CREATE TABLE IF NOT EXISTS public.open_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for the open trade
  trade_leg_id UUID, -- Reference to the originating trade leg
  parent_trade_id UUID, -- Reference to the parent trade
  trade_reference TEXT NOT NULL, -- Trade reference from parent trade
  counterparty TEXT NOT NULL, -- Counterparty from parent trade
  buy_sell TEXT NOT NULL, -- Direction from trade leg
  product TEXT NOT NULL, -- Product from trade leg
  sustainability TEXT, -- Sustainability certificate
  inco_term TEXT, -- Delivery terms
  quantity NUMERIC NOT NULL, -- Original quantity
  tolerance NUMERIC, -- Allowed tolerance
  loading_period_start DATE, -- Loading period start
  loading_period_end DATE, -- Loading period end
  pricing_period_start DATE, -- Pricing period start
  pricing_period_end DATE, -- Pricing period end
  unit TEXT, -- Unit of measurement
  payment_term TEXT, -- Payment terms
  credit_status TEXT, -- Credit status
  customs_status TEXT, -- Customs status
  pricing_type TEXT, -- Type of pricing
  contract_status TEXT, -- Contract status
  pricing_formula JSONB, -- Pricing formula
  scheduled_quantity NUMERIC DEFAULT 0, -- Quantity scheduled for delivery
  open_quantity NUMERIC, -- Remaining quantity open
  nominated_value NUMERIC, -- Value of nominations
  balance NUMERIC, -- Balance quantity
  vessel_name TEXT, -- Vessel name if applicable
  loadport TEXT, -- Loading port
  disport TEXT, -- Discharge port
  status TEXT DEFAULT 'open', -- Status of the position
  comments TEXT, -- Additional notes
  efp_premium NUMERIC, -- EFP premium
  efp_agreed_status BOOLEAN DEFAULT false, -- EFP agreed status
  efp_fixed_value NUMERIC, -- EFP fixed value
  efp_designated_month TEXT, -- EFP designated month
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), -- When the record was created
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now() -- When the record was last updated
);
COMMENT ON TABLE public.open_trades IS 'Working copy of trade legs for operational use, showing current open positions';

-- Movements table - Tracks physical movements of products
CREATE TABLE IF NOT EXISTS public.movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for the movement
  trade_leg_id UUID REFERENCES trade_legs(id), -- Reference to the trade leg
  bl_quantity NUMERIC NOT NULL, -- Quantity on bill of lading
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), -- When the record was created
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now() -- When the record was last updated
);
COMMENT ON TABLE public.movements IS 'Records physical product movements related to trade legs';

-- Step 5: Create paper trades tables

-- Paper trades table - Stores paper trades
CREATE TABLE IF NOT EXISTS public.paper_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for the paper trade
  trade_reference TEXT NOT NULL, -- Unique reference for the trade
  counterparty TEXT NOT NULL, -- Trading partner
  broker TEXT, -- Broker if applicable
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), -- When the record was created
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now() -- When the record was last updated
);
COMMENT ON TABLE public.paper_trades IS 'Master table for paper trades, representing financial rather than physical positions';

-- Paper trade legs table - Stores individual legs of paper trades
CREATE TABLE IF NOT EXISTS public.paper_trade_legs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for the paper trade leg
  paper_trade_id UUID NOT NULL REFERENCES paper_trades(id) ON DELETE CASCADE, -- Reference to the paper trade
  leg_reference TEXT NOT NULL, -- Unique reference for this leg
  buy_sell TEXT NOT NULL, -- Direction ("buy" or "sell")
  product TEXT NOT NULL, -- Product being traded
  period TEXT, -- Period reference
  quantity NUMERIC NOT NULL, -- Trade quantity
  price NUMERIC, -- Fixed price if applicable
  formula JSONB, -- Formula used for pricing
  broker TEXT, -- Broker if applicable
  instrument TEXT, -- Pricing instrument
  pricing_period_start DATE, -- Start of pricing period
  pricing_period_end DATE, -- End of pricing period
  mtm_formula JSONB, -- Formula for mark-to-market
  trading_period TEXT, -- Trading period reference
  exposures JSONB, -- Calculated exposures data
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), -- When the record was created
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now() -- When the record was last updated
);
COMMENT ON TABLE public.paper_trade_legs IS 'Detailed information for each leg of a paper trade, including pricing and financial terms';

-- Invoices table - Tracks invoices related to trades
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for the invoice
  movement_id UUID, -- Reference to the movement
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
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), -- When the record was created
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now() -- When the record was last updated
);
COMMENT ON TABLE public.invoices IS 'Records invoices generated for trade movements';

-- Payments table - Tracks payments against invoices
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for the payment
  invoice_id UUID, -- Reference to the invoice
  payment_reference TEXT NOT NULL, -- Unique reference for this payment
  payment_date DATE NOT NULL, -- Date of payment
  payment_method TEXT, -- Method used
  amount NUMERIC NOT NULL, -- Amount paid
  currency TEXT NOT NULL DEFAULT 'USD', -- Currency
  comments TEXT, -- Additional notes
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), -- When the record was created
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now() -- When the record was last updated
);
COMMENT ON TABLE public.payments IS 'Records payments made against invoices';

-- Step 6: Create audit logging table

-- Audit logs table - Tracks changes to important tables
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for the log entry
  table_name TEXT NOT NULL, -- Name of the table being modified
  record_id UUID NOT NULL, -- ID of the record being modified
  operation TEXT NOT NULL, -- Operation type (INSERT, UPDATE, DELETE)
  old_data JSONB, -- Previous data before change
  new_data JSONB, -- New data after change
  user_id TEXT, -- User who made the change
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now() -- When the change was made
);
COMMENT ON TABLE public.audit_logs IS 'Audit trail of all changes to important tables for compliance and debugging';

-- Step 7: Add utility functions for the database

-- Function to calculate open quantity
CREATE OR REPLACE FUNCTION public.calculate_open_quantity(total numeric, tolerance numeric, scheduled numeric)
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN GREATEST(0, (total * (1 + COALESCE(tolerance, 0) / 100)) - COALESCE(scheduled, 0));
END;
$function$;
COMMENT ON FUNCTION public.calculate_open_quantity IS 'Calculates the remaining open quantity for a trade considering tolerance and scheduled quantity';

-- Function to log changes to audit table
CREATE OR REPLACE FUNCTION public.audit_log_changes()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$;
COMMENT ON FUNCTION public.audit_log_changes IS 'Trigger function to automatically log all changes to the audit_logs table';

-- Function to update timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;
COMMENT ON FUNCTION public.set_updated_at IS 'Trigger function to automatically update the updated_at timestamp';

-- Function to remove open trades when a trade leg is deleted
CREATE OR REPLACE FUNCTION public.remove_open_trades_on_delete()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  DELETE FROM open_trades
  WHERE trade_leg_id = OLD.id;
  
  RETURN OLD;
END;
$function$;
COMMENT ON FUNCTION public.remove_open_trades_on_delete IS 'Trigger function to remove open trades when the corresponding trade leg is deleted';

-- Function to populate open trades when a trade leg is inserted
CREATE OR REPLACE FUNCTION public.populate_open_trades_on_insert()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  parent_record RECORD;
BEGIN
  -- Get the parent trade record
  SELECT trade_reference, counterparty 
  INTO parent_record
  FROM parent_trades
  WHERE id = NEW.parent_trade_id;
  
  -- Insert into open_trades
  INSERT INTO open_trades (
    trade_leg_id,
    parent_trade_id,
    trade_reference,
    counterparty,
    buy_sell,
    product,
    sustainability,
    inco_term,
    quantity,
    tolerance,
    loading_period_start,
    loading_period_end,
    pricing_period_start,
    pricing_period_end,
    unit,
    payment_term,
    credit_status,
    customs_status,
    scheduled_quantity,
    open_quantity,
    pricing_type,
    pricing_formula,
    contract_status,
    efp_premium,
    efp_agreed_status,
    efp_fixed_value,
    efp_designated_month
    -- comments is intentionally not included to keep it independent
  ) VALUES (
    NEW.id,
    NEW.parent_trade_id,
    parent_record.trade_reference,
    parent_record.counterparty,
    NEW.buy_sell,
    NEW.product,
    NEW.sustainability,
    NEW.inco_term,
    NEW.quantity,
    NEW.tolerance,
    NEW.loading_period_start,
    NEW.loading_period_end,
    NEW.pricing_period_start,
    NEW.pricing_period_end,
    NEW.unit,
    NEW.payment_term,
    NEW.credit_status,
    NEW.customs_status,
    0,
    calculate_open_quantity(NEW.quantity, NEW.tolerance, 0),
    NEW.pricing_type,
    NEW.pricing_formula,
    NEW.contract_status,
    NEW.efp_premium,
    NEW.efp_agreed_status,
    NEW.efp_fixed_value,
    NEW.efp_designated_month
  );
  
  RETURN NEW;
END;
$function$;
COMMENT ON FUNCTION public.populate_open_trades_on_insert IS 'Trigger function to automatically create an open trade record when a trade leg is inserted';

-- Function to update open trades when a trade leg is updated
CREATE OR REPLACE FUNCTION public.update_open_trades_on_update()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  parent_record RECORD;
  movement_qty NUMERIC;
BEGIN
  -- Get the parent trade record
  SELECT trade_reference, counterparty 
  INTO parent_record
  FROM parent_trades
  WHERE id = NEW.parent_trade_id;
  
  -- Get the sum of movement quantities for this trade leg
  -- Added COALESCE to handle cases where no movements exist
  SELECT COALESCE(SUM(bl_quantity), 0)
  INTO movement_qty
  FROM movements
  WHERE trade_leg_id = NEW.id;
  
  -- Update open_trades
  UPDATE open_trades
  SET
    trade_reference = parent_record.trade_reference,
    counterparty = parent_record.counterparty,
    buy_sell = NEW.buy_sell,
    product = NEW.product,
    sustainability = NEW.sustainability,
    inco_term = NEW.inco_term,
    quantity = NEW.quantity,
    tolerance = NEW.tolerance,
    loading_period_start = NEW.loading_period_start,
    loading_period_end = NEW.loading_period_end,
    pricing_period_start = NEW.pricing_period_start,
    pricing_period_end = NEW.pricing_period_end,
    unit = NEW.unit,
    payment_term = NEW.payment_term,
    credit_status = NEW.credit_status,
    customs_status = NEW.customs_status,
    scheduled_quantity = movement_qty,
    open_quantity = calculate_open_quantity(NEW.quantity, NEW.tolerance, movement_qty),
    pricing_type = NEW.pricing_type,
    pricing_formula = NEW.pricing_formula,
    contract_status = NEW.contract_status,
    efp_premium = NEW.efp_premium,
    efp_agreed_status = NEW.efp_agreed_status,
    efp_fixed_value = NEW.efp_fixed_value,
    efp_designated_month = NEW.efp_designated_month,
    -- Note: comments column is intentionally not updated from trade_legs to keep it independent
    updated_at = now()
  WHERE trade_leg_id = NEW.id;
  
  RETURN NEW;
END;
$function$;
COMMENT ON FUNCTION public.update_open_trades_on_update IS 'Trigger function to automatically update the open trade record when a trade leg is updated';

-- Step 8: Add triggers for automatic processes

-- Note: Since we're using IF NOT EXISTS for tables, we'll use similar logic for triggers
-- This avoids errors when running the backup script on an existing database

-- Add updated_at triggers to relevant tables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_parent_trades_updated_at') THEN
    CREATE TRIGGER set_parent_trades_updated_at
    BEFORE UPDATE ON public.parent_trades
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_trade_legs_updated_at') THEN
    CREATE TRIGGER set_trade_legs_updated_at
    BEFORE UPDATE ON public.trade_legs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_open_trades_updated_at') THEN
    CREATE TRIGGER set_open_trades_updated_at
    BEFORE UPDATE ON public.open_trades
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_movements_updated_at') THEN
    CREATE TRIGGER set_movements_updated_at
    BEFORE UPDATE ON public.movements
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_invoices_updated_at') THEN
    CREATE TRIGGER set_invoices_updated_at
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_payments_updated_at') THEN
    CREATE TRIGGER set_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_paper_trades_updated_at') THEN
    CREATE TRIGGER set_paper_trades_updated_at
    BEFORE UPDATE ON public.paper_trades
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_paper_trade_legs_updated_at') THEN
    CREATE TRIGGER set_paper_trade_legs_updated_at
    BEFORE UPDATE ON public.paper_trade_legs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END
$$;

-- Add audit triggers for important tables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_parent_trades_changes') THEN
    CREATE TRIGGER audit_parent_trades_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.parent_trades
    FOR EACH ROW EXECUTE FUNCTION audit_log_changes();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_trade_legs_changes') THEN
    CREATE TRIGGER audit_trade_legs_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.trade_legs
    FOR EACH ROW EXECUTE FUNCTION audit_log_changes();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_movements_changes') THEN
    CREATE TRIGGER audit_movements_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.movements
    FOR EACH ROW EXECUTE FUNCTION audit_log_changes();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_invoices_changes') THEN
    CREATE TRIGGER audit_invoices_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION audit_log_changes();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_payments_changes') THEN
    CREATE TRIGGER audit_payments_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION audit_log_changes();
  END IF;
END
$$;

-- Add open trades management triggers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'populate_open_trades_after_insert') THEN
    CREATE TRIGGER populate_open_trades_after_insert
    AFTER INSERT ON public.trade_legs
    FOR EACH ROW EXECUTE FUNCTION populate_open_trades_on_insert();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_open_trades_after_update') THEN
    CREATE TRIGGER update_open_trades_after_update
    AFTER UPDATE ON public.trade_legs
    FOR EACH ROW EXECUTE FUNCTION update_open_trades_on_update();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'remove_open_trades_after_delete') THEN
    CREATE TRIGGER remove_open_trades_after_delete
    AFTER DELETE ON public.trade_legs
    FOR EACH ROW EXECUTE FUNCTION remove_open_trades_on_delete();
  END IF;
END
$$;

-- Step 9: Enable realtime functionality
-- These commands enable real-time functionality for key tables

-- Only add tables to the publication if they aren't already included
DO $$
DECLARE
  table_count integer;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM pg_publication_tables
  WHERE pubname = 'supabase_realtime'
  AND schemaname = 'public'
  AND tablename IN ('parent_trades', 'trade_legs');

  IF table_count < 2 THEN
    -- This is safe to run even if some tables are already in the publication
    ALTER PUBLICATION supabase_realtime ADD TABLE parent_trades, trade_legs;
  END IF;
END
$$;

-- Set REPLICA IDENTITY only if not already set
DO $$
DECLARE
  replica_identity text;
BEGIN
  -- Check parent_trades REPLICA IDENTITY setting
  SELECT relreplident INTO replica_identity
  FROM pg_class
  WHERE oid = 'public.parent_trades'::regclass;
  
  IF replica_identity != 'f' THEN
    ALTER TABLE parent_trades REPLICA IDENTITY FULL;
  END IF;
  
  -- Check trade_legs REPLICA IDENTITY setting
  SELECT relreplident INTO replica_identity
  FROM pg_class
  WHERE oid = 'public.trade_legs'::regclass;
  
  IF replica_identity != 'f' THEN
    ALTER TABLE trade_legs REPLICA IDENTITY FULL;
  END IF;
END
$$;

-- End of database backup script
