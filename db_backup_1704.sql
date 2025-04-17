
-- DATABASE STRUCTURE BACKUP (April 17th, 2024)
-- This file contains the SQL commands to recreate the database schema
-- It serves as documentation for the database structure and relationships

-- ==========================================
-- REFERENCE DATA TABLES
-- ==========================================

-- Counterparties table - Stores information about trading partners
CREATE TABLE IF NOT EXISTS public.counterparties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for the counterparty
  name TEXT NOT NULL, -- Name of the trading partner
  vat_number TEXT, -- VAT registration number for invoicing purposes
  bank_details JSONB, -- Bank account information stored in JSON format
  contact_details JSONB, -- Contact information (emails, phone numbers) in JSON format
  is_active BOOLEAN DEFAULT true, -- Whether the counterparty is currently active for trading
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()), -- When the record was created
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now() -- When the record was last updated
);
COMMENT ON TABLE public.counterparties IS 'Stores information about trading partners including contact details and banking information';

-- Credit status options - Reference data for credit statuses
CREATE TABLE IF NOT EXISTS public.credit_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for the credit status
  name TEXT NOT NULL, -- Name of the credit status (e.g., "Approved", "On hold")
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()) -- When the record was created
);
COMMENT ON TABLE public.credit_status IS 'Reference data table defining possible credit status values used in trades';

-- Customs status options - Reference data for customs statuses
CREATE TABLE IF NOT EXISTS public.customs_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for the customs status
  name TEXT NOT NULL, -- Name of the customs status (e.g., "Cleared", "In progress")
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()) -- When the record was created
);
COMMENT ON TABLE public.customs_status IS 'Reference data table defining possible customs status values used in trades';

-- Incoterms table - Reference data for international commercial terms
CREATE TABLE IF NOT EXISTS public.inco_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for the incoterm
  name TEXT NOT NULL, -- Name of the incoterm (e.g., "CIF", "FOB")
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()) -- When the record was created
);
COMMENT ON TABLE public.inco_terms IS 'Reference data table for international commercial terms (Incoterms) defining delivery conditions';

-- Payment terms table - Reference data for payment conditions
CREATE TABLE IF NOT EXISTS public.payment_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for the payment term
  name TEXT NOT NULL, -- Name of payment term (e.g., "Net 30", "Cash in advance")
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()) -- When the record was created
);
COMMENT ON TABLE public.payment_terms IS 'Reference data table for payment terms defining when and how payments should be made';

-- Products table - Reference data for physical products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for the product
  name TEXT NOT NULL, -- Name of the product (e.g., "Biodiesel", "FAME")
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()) -- When the record was created
);
COMMENT ON TABLE public.products IS 'Reference data table for physical products that can be traded';

-- Sustainability options table - Reference data for sustainability certificates
CREATE TABLE IF NOT EXISTS public.sustainability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for the sustainability option
  name TEXT NOT NULL, -- Name of sustainability certificate (e.g., "ISCC", "RedCert")
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()) -- When the record was created
);
COMMENT ON TABLE public.sustainability IS 'Reference data table for sustainability certificates that can be applied to products';

-- Brokers table - Reference data for trade brokers
CREATE TABLE IF NOT EXISTS public.brokers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for the broker
  name TEXT NOT NULL, -- Name of the broker firm
  is_active BOOLEAN DEFAULT true, -- Whether the broker is currently active
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() -- When the record was created
);
COMMENT ON TABLE public.brokers IS 'Reference data table for brokers who facilitate trades between counterparties';

-- Inspectors table - Reference data for inspection companies
CREATE TABLE IF NOT EXISTS public.inspectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for the inspector
  name TEXT NOT NULL, -- Name of the inspection company
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), -- When the record was created
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now() -- When the record was last updated
);
COMMENT ON TABLE public.inspectors IS 'Reference data table for inspection companies that verify product quality and quantity';

-- ==========================================
-- PRICING RELATED TABLES
-- ==========================================

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

-- ==========================================
-- PAPER TRADING RELATED TABLES
-- ==========================================

-- Paper trade products table - Products specific to paper trading
CREATE TABLE IF NOT EXISTS public.paper_trade_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for the paper trade product
  product_code TEXT NOT NULL, -- System code for the product
  display_name TEXT NOT NULL, -- Human-readable name
  category TEXT NOT NULL, -- Category grouping
  base_product TEXT, -- Related physical product if applicable
  paired_product TEXT, -- Product that can be paired in spreads
  is_active BOOLEAN DEFAULT true, -- Whether the product is available for trading
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() -- When the record was created
);
COMMENT ON TABLE public.paper_trade_products IS 'Defines products that can be traded in paper trading, possibly linked to physical products';

-- Product relationships table - Defines relationships between products
CREATE TABLE IF NOT EXISTS public.product_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for the relationship
  product TEXT NOT NULL, -- Primary product
  relationship_type TEXT NOT NULL, -- Type of relationship (e.g., "spread", "crack")
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
  is_active BOOLEAN DEFAULT true, -- Whether the period is active for trading
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() -- When the record was created
);
COMMENT ON TABLE public.trading_periods IS 'Defines the time periods used for paper trading contracts';

-- ==========================================
-- MAIN TRADING TABLES
-- ==========================================

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
  sort_order INTEGER, -- Order for display in UI
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), -- When the record was created
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now() -- When the record was last updated
);
COMMENT ON TABLE public.open_trades IS 'Working copy of trade legs for operational use, showing current open positions';

-- Movements table - Tracks physical movements of products
CREATE TABLE IF NOT EXISTS public.movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for the movement
  trade_leg_id UUID, -- Reference to the trade leg
  parent_trade_id UUID, -- Reference to the parent trade
  reference_number TEXT, -- Unique reference for this movement
  trade_reference TEXT, -- Reference to the trade this movement belongs to
  counterparty TEXT, -- Trading partner
  buy_sell TEXT, -- Direction ("buy" or "sell")
  product TEXT, -- Product being moved
  sustainability TEXT, -- Sustainability certificate
  inco_term TEXT, -- Delivery terms
  status TEXT DEFAULT 'scheduled', -- Current status of the movement
  bl_quantity NUMERIC NOT NULL, -- Quantity on bill of lading
  scheduled_quantity NUMERIC, -- Scheduled quantity
  actual_quantity NUMERIC, -- Actual quantity delivered
  loading_period_start DATE, -- Start of loading period
  loading_period_end DATE, -- End of loading period
  nomination_eta TIMESTAMP WITH TIME ZONE, -- Estimated time of arrival
  nomination_valid TIMESTAMP WITH TIME ZONE, -- Nomination validity time
  bl_date DATE, -- Bill of lading date
  cod_date DATE, -- Certificate of discharge date
  cash_flow DATE, -- Date for cash flow
  barge_name TEXT, -- Name of the barge/vessel
  loadport TEXT, -- Loading port
  loadport_inspector TEXT, -- Inspector at loading port
  disport TEXT, -- Discharge port
  disport_inspector TEXT, -- Inspector at discharge port
  pricing_type TEXT, -- Type of pricing
  pricing_formula JSONB, -- Formula for pricing
  comments TEXT, -- Additional notes
  customs_status TEXT, -- Customs status
  credit_status TEXT, -- Credit status
  contract_status TEXT, -- Contract status
  terminal_id UUID, -- Terminal for inventory
  inventory_movement_date DATE, -- Date for inventory movement
  barge_orders_checked BOOLEAN DEFAULT false, -- Checklist item
  nomination_checked BOOLEAN DEFAULT false, -- Checklist item
  load_plan_checked BOOLEAN DEFAULT false, -- Checklist item
  coa_received_checked BOOLEAN DEFAULT false, -- Checklist item
  coa_sent_checked BOOLEAN DEFAULT false, -- Checklist item
  ead_checked BOOLEAN DEFAULT false, -- Checklist item
  sort_order INTEGER, -- Order for display in UI
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), -- When the record was created
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now() -- When the record was last updated
);
COMMENT ON TABLE public.movements IS 'Records physical product movements related to trade legs';

-- ==========================================
-- PAPER TRADES TABLES
-- ==========================================

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

-- ==========================================
-- INVENTORY MANAGEMENT TABLES
-- ==========================================

-- Terminals table - Storage locations for inventory
CREATE TABLE IF NOT EXISTS public.terminals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for the terminal
  name TEXT NOT NULL, -- Name of the terminal
  description TEXT, -- Description of the terminal
  is_active BOOLEAN DEFAULT true, -- Whether the terminal is active
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), -- When the record was created
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now() -- When the record was last updated
);
COMMENT ON TABLE public.terminals IS 'Storage locations where product can be stored, containing multiple tanks';

-- Tanks table - Individual storage tanks at terminals
CREATE TABLE IF NOT EXISTS public.tanks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for the tank
  terminal_id UUID NOT NULL, -- Terminal where the tank is located
  tank_number TEXT NOT NULL, -- Tank identifier/number
  current_product TEXT NOT NULL, -- Product currently in the tank
  spec TEXT, -- Specification of the tank
  capacity_mt NUMERIC NOT NULL, -- Capacity in metric tons
  capacity_m3 NUMERIC NOT NULL, -- Capacity in cubic meters
  is_heating_enabled BOOLEAN DEFAULT false, -- Whether the tank has heating
  display_order INTEGER, -- Order for display in UI
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), -- When the record was created
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now() -- When the record was last updated
);
COMMENT ON TABLE public.tanks IS 'Individual storage tanks within terminals, tracking capacity and current product';

-- Movement terminal assignments - Links movements to terminals
CREATE TABLE IF NOT EXISTS public.movement_terminal_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for the assignment
  movement_id UUID NOT NULL, -- Reference to the movement
  terminal_id UUID NOT NULL, -- Reference to the terminal
  quantity_mt NUMERIC NOT NULL, -- Quantity in metric tons (can be negative for outflows)
  assignment_date DATE NOT NULL, -- Date of the assignment
  comments TEXT, -- Comments about the assignment
  sort_order INTEGER, -- Order for display in UI
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), -- When the record was created
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now() -- When the record was last updated
);
COMMENT ON TABLE public.movement_terminal_assignments IS 'Tracks which movements are assigned to which terminals for inventory tracking';

-- Tank movements - Tracks inventory movements in and out of tanks
CREATE TABLE IF NOT EXISTS public.tank_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for the tank movement
  tank_id UUID NOT NULL, -- Reference to the tank
  movement_id UUID, -- Reference to the movement
  assignment_id UUID, -- Reference to the terminal assignment
  product_at_time TEXT NOT NULL, -- Product at the time of movement
  quantity_mt NUMERIC NOT NULL DEFAULT 0, -- Quantity in metric tons
  quantity_m3 NUMERIC NOT NULL DEFAULT 0, -- Quantity in cubic meters
  customs_status TEXT, -- Customs status of the product
  movement_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), -- Date and time of the movement
  sort_order INTEGER, -- Order for display in UI
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), -- When the record was created
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now() -- When the record was last updated
);
COMMENT ON TABLE public.tank_movements IS 'Individual movements of product in and out of specific tanks';

-- ==========================================
-- FINANCIAL TABLES
-- ==========================================

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

-- ==========================================
-- AUDIT TRACKING
-- ==========================================

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

-- ==========================================
-- DATABASE HELPER FUNCTIONS
-- ==========================================

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

-- Function to generate movement reference
CREATE OR REPLACE FUNCTION public.generate_movement_reference(trade_ref text, leg_id uuid)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  movement_count INTEGER;
  result TEXT;
BEGIN
  -- Count existing movements for this trade leg
  SELECT COUNT(*) INTO movement_count
  FROM movements
  WHERE trade_leg_id = leg_id;
  
  -- Generate reference with sequence number
  result := trade_ref || '-' || (movement_count + 1);
  
  RETURN result;
END;
$function$;
COMMENT ON FUNCTION public.generate_movement_reference IS 'Generates a sequential reference number for movements based on the trade reference';

-- Function to update sort order of items in lists
CREATE OR REPLACE FUNCTION public.update_sort_order(p_table_name text, p_id uuid, p_new_sort_order integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_old_sort_order INTEGER;
  v_max_order INTEGER;
  v_update_query TEXT;
  v_record_exists BOOLEAN;
BEGIN
  -- Check if the record exists
  EXECUTE format('SELECT EXISTS(SELECT 1 FROM %I WHERE id = $1)', p_table_name)
  INTO v_record_exists
  USING p_id;
  
  IF NOT v_record_exists THEN
    RAISE EXCEPTION 'Record with id % not found in table %', p_id, p_table_name;
  END IF;
  
  -- Dynamically build query to get the old sort order
  EXECUTE format('SELECT sort_order FROM %I WHERE id = $1', p_table_name)
  INTO v_old_sort_order
  USING p_id;
  
  -- If this is the first time ordering (sort_order is NULL)
  IF v_old_sort_order IS NULL THEN
    -- Get the maximum sort_order or default to 0
    EXECUTE format('SELECT COALESCE(MAX(sort_order), 0) FROM %I WHERE sort_order IS NOT NULL', p_table_name)
    INTO v_max_order;
    
    -- For first time ordering, assign values to ALL NULL sort_order records
    -- This ensures all records have a sort_order before we start reordering
    EXECUTE format('
      UPDATE %I 
      SET sort_order = (ROW_NUMBER() OVER (ORDER BY created_at DESC)) + $1
      WHERE sort_order IS NULL
    ', p_table_name)
    USING v_max_order;
    
    -- Get the newly assigned sort_order for this record
    EXECUTE format('SELECT sort_order FROM %I WHERE id = $1', p_table_name)
    INTO v_old_sort_order
    USING p_id;
  END IF;
  
  -- Now proceed with normal reordering logic
  -- If moving down in the list (increasing sort_order)
  IF p_new_sort_order > v_old_sort_order THEN
    EXECUTE format('
      UPDATE %I 
      SET sort_order = sort_order - 1 
      WHERE sort_order > $1 AND sort_order <= $2
    ', p_table_name)
    USING v_old_sort_order, p_new_sort_order;
  -- If moving up in the list (decreasing sort_order)
  ELSIF p_new_sort_order < v_old_sort_order THEN
    EXECUTE format('
      UPDATE %I 
      SET sort_order = sort_order + 1 
      WHERE sort_order >= $1 AND sort_order < $2
    ', p_table_name)
    USING p_new_sort_order, v_old_sort_order;
  -- If not changing position, do nothing
  ELSE
    RETURN;
  END IF;
  
  -- Update the sort_order of the target record
  EXECUTE format('
    UPDATE %I 
    SET sort_order = $1 
    WHERE id = $2
  ', p_table_name)
  USING p_new_sort_order, p_id;
END;
$function$;
COMMENT ON FUNCTION public.update_sort_order IS 'Utility function to manage sort order of records in tables with sortable UI lists';

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Setup for the trigger creation
DO $$
BEGIN
  -- Set updated_at timestamps automatically
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

  -- Audit logging triggers
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

-- ==========================================
-- ENABLE REALTIME FUNCTIONALITY
-- ==========================================

-- Enable realtime for key tables
DO $$
DECLARE
  table_count integer;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM pg_publication_tables
  WHERE pubname = 'supabase_realtime'
  AND schemaname = 'public'
  AND tablename IN ('parent_trades', 'trade_legs', 'movements', 'tank_movements');

  IF table_count < 4 THEN
    -- This is safe to run even if some tables are already in the publication
    ALTER PUBLICATION supabase_realtime ADD TABLE parent_trades, trade_legs, movements, tank_movements;
  END IF;
END
$$;

-- Set REPLICA IDENTITY for realtime tables
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
  
  -- Check movements REPLICA IDENTITY setting
  SELECT relreplident INTO replica_identity
  FROM pg_class
  WHERE oid = 'public.movements'::regclass;
  
  IF replica_identity != 'f' THEN
    ALTER TABLE movements REPLICA IDENTITY FULL;
  END IF;
  
  -- Check tank_movements REPLICA IDENTITY setting
  SELECT relreplident INTO replica_identity
  FROM pg_class
  WHERE oid = 'public.tank_movements'::regclass;
  
  IF replica_identity != 'f' THEN
    ALTER TABLE tank_movements REPLICA IDENTITY FULL;
  END IF;
END
$$;

-- End of database backup script
