
-- DATABASE STRUCTURE BACKUP (May 19th, 2024)
-- This file contains the SQL commands to recreate the database schema
-- It can be used to restore the database structure if needed
-- Comprehensive backup including all tables, functions, triggers, and comments

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
  is_active BOOLEAN DEFAULT true, -- Whether the product is currently active for trading
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

-- Barges and vessels table - Reference data for transport vessels
CREATE TABLE IF NOT EXISTS public.barges_vessels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for the vessel
  name TEXT NOT NULL, -- Name of the vessel
  imo_number TEXT NOT NULL, -- International Maritime Organization number (unique vessel identifier)
  type TEXT, -- Type of vessel (e.g., "Barge", "Tanker")
  owners TEXT, -- Company/owner of the vessel
  deadweight NUMERIC NOT NULL, -- Deadweight tonnage (cargo capacity)
  is_active BOOLEAN DEFAULT true, -- Whether the vessel is currently active
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), -- When the record was created
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now() -- When the record was last updated
);
COMMENT ON TABLE public.barges_vessels IS 'Reference data for vessels used in cargo transport including capacity information';

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
  group_id UUID, -- ID for grouping related movements
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
  movement_id UUID, -- Reference to the movement
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

-- Terminal pagination state - Tracks UI pagination state for terminals
CREATE TABLE IF NOT EXISTS public.terminal_pagination_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for the pagination state
  terminal_id UUID NOT NULL, -- Reference to the terminal
  page_number INTEGER NOT NULL, -- Page number
  page_size INTEGER NOT NULL, -- Number of items per page
  previous_page_state JSONB, -- State of the previous page (for calculations)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), -- When the record was created
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), -- When the record was last updated
  UNIQUE (terminal_id, page_number, page_size) -- Ensure only one state per terminal/page/size combination
);
COMMENT ON TABLE public.terminal_pagination_state IS 'Stores pagination state for terminal displays to support complex inventory calculations across pages';

-- ==========================================
-- DEMURRAGE CALCULATION TABLES
-- ==========================================

-- Demurrage calculations - Stores demurrage calculations for vessel movements
CREATE TABLE IF NOT EXISTS public.demurrage_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for the demurrage calculation
  movement_id UUID, -- Reference to the movement
  barge_vessel_id UUID, -- Reference to the vessel
  bl_date DATE, -- Bill of lading date
  quantity_loaded NUMERIC NOT NULL, -- Quantity loaded on vessel
  nomination_sent TIMESTAMP WITH TIME ZONE, -- When nomination was sent
  nomination_valid TIMESTAMP WITH TIME ZONE, -- When nomination became valid
  barge_arrived TIMESTAMP WITH TIME ZONE, -- When vessel arrived
  time_starts_to_run TIMESTAMP WITH TIME ZONE, -- When laytime started counting
  load_port_start TIMESTAMP WITH TIME ZONE, -- Start of loading at port
  load_port_finish TIMESTAMP WITH TIME ZONE, -- End of loading at port
  load_port_hours NUMERIC, -- Hours spent at loading port
  load_port_demurrage_hours NUMERIC, -- Demurrage hours at loading port
  load_port_is_manual BOOLEAN DEFAULT false, -- Whether load port calculation is manual
  load_port_rounding TEXT, -- Rounding method for load port calculation
  load_port_override_comment TEXT, -- Comment justifying manual override at load port
  discharge_port_start TIMESTAMP WITH TIME ZONE, -- Start of discharge at port
  discharge_port_finish TIMESTAMP WITH TIME ZONE, -- End of discharge at port
  discharge_port_hours NUMERIC, -- Hours spent at discharge port
  discharge_port_demurrage_hours NUMERIC, -- Demurrage hours at discharge port
  discharge_port_is_manual BOOLEAN DEFAULT false, -- Whether discharge port calculation is manual
  discharge_port_rounding TEXT, -- Rounding method for discharge port calculation
  discharge_port_override_comment TEXT, -- Comment justifying manual override at discharge port
  total_laytime NUMERIC, -- Total allowed laytime
  rate NUMERIC, -- Demurrage rate
  calculation_rate TEXT NOT NULL, -- Rate calculation method
  total_time_used NUMERIC, -- Total time used across loading and discharge
  demurrage_hours NUMERIC, -- Total demurrage hours
  demurrage_due NUMERIC, -- Demurrage amount due
  comments TEXT, -- Additional notes
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), -- When the record was created
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now() -- When the record was last updated
);
COMMENT ON TABLE public.demurrage_calculations IS 'Tracks demurrage calculations for vessel movements, including laytime and cost calculations';

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

-- Function to calculate open quantity for trades
CREATE OR REPLACE FUNCTION public.calculate_open_quantity(total numeric, tolerance numeric, scheduled numeric)
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Calculate the remaining quantity considering tolerance
  -- Total is base quantity
  -- Tolerance is percentage to add (e.g., 5 for 5%)
  -- Scheduled is the already allocated quantity
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
    -- Record changes to the audit log depending on operation type
    IF TG_OP = 'INSERT' THEN
        -- For inserts, record the new data
        INSERT INTO public.audit_logs (table_name, record_id, operation, new_data)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- For updates, record both old and new data
        INSERT INTO public.audit_logs (table_name, record_id, operation, old_data, new_data)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- For deletes, record the deleted data
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
    -- Set the updated_at timestamp to current time
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;
COMMENT ON FUNCTION public.set_updated_at IS 'Trigger function to automatically update the updated_at timestamp';

-- Function to update tank's updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_tank_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Set the updated_at timestamp for tanks to current time
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;
COMMENT ON FUNCTION public.set_tank_updated_at IS 'Trigger function to automatically update the updated_at timestamp for tanks';

-- Function to update terminal's updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_terminal_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Set the updated_at timestamp for terminals to current time
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;
COMMENT ON FUNCTION public.set_terminal_updated_at IS 'Trigger function to automatically update the updated_at timestamp for terminals';

-- Function to set timestamp for general use
CREATE OR REPLACE FUNCTION public.set_updated_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Set the updated_at timestamp to current time (generic version)
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;
COMMENT ON FUNCTION public.set_updated_timestamp IS 'Generic trigger function to update timestamps on record changes';

-- Function to generate reference number for movements
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
  -- The trade_ref should already include the leg suffix
  result := trade_ref || '-' || (movement_count + 1);
  
  RETURN result;
END;
$function$;
COMMENT ON FUNCTION public.generate_movement_reference IS 'Generates a sequential reference number for movements based on the trade reference';

-- Function to remove open trades when a trade leg is deleted
CREATE OR REPLACE FUNCTION public.remove_open_trades_on_delete()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Clean up related open trades when a trade leg is deleted
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
  
  -- Insert into open_trades with combined trade_reference including leg suffix
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
    efp_designated_month,
    nominated_value,
    balance
  ) VALUES (
    NEW.id,
    NEW.parent_trade_id,
    CASE 
      WHEN NEW.leg_reference IS NULL OR NEW.leg_reference = '' THEN parent_record.trade_reference
      WHEN NEW.leg_reference LIKE parent_record.trade_reference || '-%' THEN NEW.leg_reference
      ELSE parent_record.trade_reference || '-' || substring(NEW.leg_reference from position('-' in NEW.leg_reference) + 1)
    END,
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
    NEW.efp_designated_month,
    0, -- Initialize nominated_value to 0
    NEW.quantity -- Initialize balance to full quantity
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
  
  -- Update open_trades with combined trade_reference including leg suffix
  UPDATE open_trades
  SET
    trade_reference = CASE 
      WHEN NEW.leg_reference IS NULL OR NEW.leg_reference = '' THEN parent_record.trade_reference
      WHEN NEW.leg_reference LIKE parent_record.trade_reference || '-%' THEN NEW.leg_reference
      ELSE parent_record.trade_reference || '-' || substring(NEW.leg_reference from position('-' in NEW.leg_reference) + 1)
    END,
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
    updated_at = now()
  WHERE trade_leg_id = NEW.id;
  
  RETURN NEW;
END;
$function$;
COMMENT ON FUNCTION public.update_open_trades_on_update IS 'Trigger function to automatically update the open trade record when a trade leg is updated';

-- Function to set movement reference
CREATE OR REPLACE FUNCTION public.set_movement_reference()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  trade_ref TEXT;
BEGIN
  -- Get the trade reference
  SELECT trade_reference INTO trade_ref
  FROM open_trades
  WHERE trade_leg_id = NEW.trade_leg_id;
  
  -- Set the movement reference
  NEW.reference_number := generate_movement_reference(trade_ref, NEW.trade_leg_id);
  
  RETURN NEW;
END;
$function$;
COMMENT ON FUNCTION public.set_movement_reference IS 'Trigger function to automatically set reference numbers for new movements';

-- Function to update open trades when movements change
CREATE OR REPLACE FUNCTION public.update_open_trades_on_movement_change()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  total_nominated NUMERIC;
  trade_quantity NUMERIC;
  leg_id UUID;
  trade_ref TEXT;
  loading_start DATE;
  loading_end DATE;
BEGIN
  -- Determine which record to use (OLD for DELETE, NEW for INSERT/UPDATE)
  IF TG_OP = 'DELETE' THEN
    leg_id := OLD.trade_leg_id;
  ELSE
    leg_id := NEW.trade_leg_id;
    
    -- For INSERT or UPDATE, also populate the loading period dates if they are null
    IF (NEW.loading_period_start IS NULL OR NEW.loading_period_end IS NULL) AND NEW.trade_reference IS NOT NULL THEN
      -- Get loading period dates from open_trades
      SELECT 
        loading_period_start, 
        loading_period_end 
      INTO 
        loading_start, 
        loading_end
      FROM 
        open_trades
      WHERE 
        trade_reference = NEW.trade_reference
      LIMIT 1;
      
      -- Set the loading period dates
      IF loading_start IS NOT NULL THEN
        NEW.loading_period_start := loading_start;
      END IF;
      
      IF loading_end IS NOT NULL THEN
        NEW.loading_period_end := loading_end;
      END IF;
    END IF;
  END IF;
  
  -- If we don't have a valid trade_leg_id, just return
  IF leg_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Get total scheduled quantity for this trade leg
  SELECT COALESCE(SUM(scheduled_quantity), 0) INTO total_nominated
  FROM movements
  WHERE trade_leg_id = leg_id;
  
  -- Get the trade's original quantity
  SELECT quantity INTO trade_quantity
  FROM trade_legs
  WHERE id = leg_id;
  
  -- Update the open_trades record
  UPDATE open_trades
  SET 
    nominated_value = total_nominated,
    balance = GREATEST(0, trade_quantity - total_nominated)
  WHERE trade_leg_id = leg_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;
COMMENT ON FUNCTION public.update_open_trades_on_movement_change IS 'Trigger function to update open trade quantities when movements are added, changed or deleted';

-- Function to set movement loading periods
CREATE OR REPLACE FUNCTION public.set_movement_loading_periods()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  loading_start DATE;
  loading_end DATE;
BEGIN
  -- Skip if loading periods are already set or if we don't have a trade reference
  IF (NEW.loading_period_start IS NOT NULL AND NEW.loading_period_end IS NOT NULL) OR NEW.trade_reference IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get loading period dates from open_trades
  SELECT 
    loading_period_start, 
    loading_period_end 
  INTO 
    loading_start, 
    loading_end
  FROM 
    open_trades
  WHERE 
    trade_reference = NEW.trade_reference
  LIMIT 1;
  
  -- Set the loading period dates
  IF loading_start IS NOT NULL THEN
    NEW.loading_period_start := loading_start;
  END IF;
  
  IF loading_end IS NOT NULL THEN
    NEW.loading_period_end := loading_end;
  END IF;
  
  RETURN NEW;
END;
$function$;
COMMENT ON FUNCTION public.set_movement_loading_periods IS 'Trigger function to set loading periods for movements based on the trade';

-- Function to populate movement loading periods
CREATE OR REPLACE FUNCTION public.populate_movement_loading_periods()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Update existing movements with loading periods from open_trades
  UPDATE public.movements m
  SET 
    loading_period_start = ot.loading_period_start,
    loading_period_end = ot.loading_period_end
  FROM public.open_trades ot
  WHERE 
    m.trade_reference = ot.trade_reference
    AND (m.loading_period_start IS NULL OR m.loading_period_end IS NULL);
END;
$function$;
COMMENT ON FUNCTION public.populate_movement_loading_periods IS 'Utility function to populate loading periods for existing movements';

-- Function to get next tank display order
CREATE OR REPLACE FUNCTION public.get_next_tank_display_order(terminal_id_param uuid)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
  next_order INTEGER;
  tank_count INTEGER;
BEGIN
  -- Get count of existing tanks in terminal using explicit table reference
  SELECT COUNT(*) INTO tank_count
  FROM tanks
  WHERE tanks.terminal_id = terminal_id_param;
  
  -- If this is the first tank, return 1
  IF tank_count = 0 THEN
    RETURN 1;
  END IF;
  
  -- Otherwise get max display_order and add 1 with explicit table reference
  SELECT COALESCE(MAX(tanks.display_order), 0) + 1 INTO next_order
  FROM tanks
  WHERE tanks.terminal_id = terminal_id_param;
  
  RETURN next_order;
END;
$function$;
COMMENT ON FUNCTION public.get_next_tank_display_order IS 'Gets the next available display order value for a tank in a terminal';

-- Function to set tank display order
CREATE OR REPLACE FUNCTION public.set_tank_display_order()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Only set display_order if it's NULL
  IF NEW.display_order IS NULL THEN
    NEW.display_order := get_next_tank_display_order(NEW.terminal_id);
  END IF;
  RETURN NEW;
END;
$function$;
COMMENT ON FUNCTION public.set_tank_display_order IS 'Trigger function to set display order for new tanks';

-- Function to initialize tank sort orders
CREATE OR REPLACE FUNCTION public.initialize_tank_sort_orders()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Update tanks table, setting display_order based on current order of tank_number
  UPDATE tanks t
  SET display_order = sub.row_num
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY terminal_id 
        ORDER BY tank_number
      ) as row_num
    FROM tanks
    WHERE display_order IS NULL
  ) sub
  WHERE t.id = sub.id;
END;
$function$;
COMMENT ON FUNCTION public.initialize_tank_sort_orders IS 'Utility function to initialize display order for all tanks';

-- Function to update sort order in lists
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

-- Function to update terminal sort order
CREATE OR REPLACE FUNCTION public.update_terminal_sort_order(p_id uuid, p_new_sort_order integer, p_terminal_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_old_sort_order INTEGER;
  v_max_order INTEGER;
  v_record_exists BOOLEAN;
BEGIN
  -- Check if the record exists and belongs to the terminal
  EXECUTE format('
    SELECT EXISTS(
      SELECT 1 
      FROM movement_terminal_assignments 
      WHERE id = $1 AND terminal_id = $2
    )'
  )
  INTO v_record_exists
  USING p_id, p_terminal_id;
  
  IF NOT v_record_exists THEN
    RAISE EXCEPTION 'Record with id % not found in terminal %', p_id, p_terminal_id;
  END IF;
  
  -- Get the old sort order
  SELECT sort_order 
  INTO v_old_sort_order
  FROM movement_terminal_assignments
  WHERE id = p_id;
  
  -- If this is the first time ordering (sort_order is NULL)
  IF v_old_sort_order IS NULL THEN
    -- Get the maximum sort_order for this terminal or default to 0
    SELECT COALESCE(MAX(sort_order), 0) 
    INTO v_max_order
    FROM movement_terminal_assignments
    WHERE terminal_id = p_terminal_id AND sort_order IS NOT NULL;
    
    -- For first time ordering, assign values to ALL NULL sort_order records for this terminal
    UPDATE movement_terminal_assignments
    SET sort_order = (
      ROW_NUMBER() OVER (
        PARTITION BY terminal_id 
        ORDER BY created_at DESC
      )
    ) + v_max_order
    WHERE terminal_id = p_terminal_id AND sort_order IS NULL;
    
    -- Get the newly assigned sort_order for this record
    SELECT sort_order 
    INTO v_old_sort_order
    FROM movement_terminal_assignments
    WHERE id = p_id;
  END IF;
  
  -- Now proceed with normal reordering logic within the terminal
  -- If moving down in the list (increasing sort_order)
  IF p_new_sort_order > v_old_sort_order THEN
    UPDATE movement_terminal_assignments
    SET sort_order = sort_order - 1
    WHERE 
      terminal_id = p_terminal_id AND
      sort_order > v_old_sort_order AND 
      sort_order <= p_new_sort_order;
  -- If moving up in the list (decreasing sort_order)
  ELSIF p_new_sort_order < v_old_sort_order THEN
    UPDATE movement_terminal_assignments
    SET sort_order = sort_order + 1
    WHERE 
      terminal_id = p_terminal_id AND
      sort_order >= p_new_sort_order AND 
      sort_order < v_old_sort_order;
  -- If not changing position, do nothing
  ELSE
    RETURN;
  END IF;
  
  -- Update the sort_order of the target record
  UPDATE movement_terminal_assignments
  SET sort_order = p_new_sort_order
  WHERE id = p_id;
END;
$function$;
COMMENT ON FUNCTION public.update_terminal_sort_order IS 'Update sort order of terminal assignments with terminal-specific logic';

-- Function to initialize terminal sort order
CREATE OR REPLACE FUNCTION public.initialize_terminal_sort_order(p_terminal_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Set initial sort_order values based on created_at date (newest first)
  -- Only for records with NULL sort_order in the specified terminal
  UPDATE movement_terminal_assignments
  SET sort_order = sub.row_num
  FROM (
    SELECT 
      id, 
      ROW_NUMBER() OVER (
        PARTITION BY terminal_id 
        ORDER BY created_at DESC
      ) as row_num
    FROM movement_terminal_assignments
    WHERE sort_order IS NULL AND terminal_id = p_terminal_id
  ) sub
  WHERE movement_terminal_assignments.id = sub.id;
END;
$function$;
COMMENT ON FUNCTION public.initialize_terminal_sort_order IS 'Initialize sort order for a specific terminal';

-- Function to initialize all terminal sort orders
CREATE OR REPLACE FUNCTION public.initialize_all_terminal_sort_orders()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Set initial sort_order values based on created_at date (newest first)
  -- Only for records with NULL sort_order, partitioned by terminal_id
  UPDATE movement_terminal_assignments
  SET sort_order = sub.row_num
  FROM (
    SELECT 
      id, 
      ROW_NUMBER() OVER (
        PARTITION BY terminal_id 
        ORDER BY created_at DESC
      ) as row_num
    FROM movement_terminal_assignments
    WHERE sort_order IS NULL
  ) sub
  WHERE movement_terminal_assignments.id = sub.id;
END;
$function$;
COMMENT ON FUNCTION public.initialize_all_terminal_sort_orders IS 'Initialize sort order for all terminals at once';

-- Function to fix duplicate sort orders
CREATE OR REPLACE FUNCTION public.fix_duplicate_sort_orders(p_terminal_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Find records with duplicate sort_order values within the same terminal
  -- and reassign them sequentially
  WITH duplicates AS (
    SELECT 
      id,
      terminal_id,
      sort_order,
      ROW_NUMBER() OVER (
        PARTITION BY terminal_id, sort_order 
        ORDER BY created_at
      ) AS duplicate_rank
    FROM movement_terminal_assignments
    WHERE terminal_id = p_terminal_id AND sort_order IS NOT NULL
  ),
  -- Identify records needing to be fixed (duplicate_rank > 1)
  to_fix AS (
    SELECT id
    FROM duplicates
    WHERE duplicate_rank > 1
  ),
  -- Get the highest sort_order per terminal to know where to start assigning new values
  max_orders AS (
    SELECT 
      terminal_id,
      MAX(sort_order) AS max_order
    FROM movement_terminal_assignments
    WHERE terminal_id = p_terminal_id
    GROUP BY terminal_id
  )
  -- Update the duplicates with new sort_order values
  UPDATE movement_terminal_assignments m
  SET sort_order = m.sort_order + (
    SELECT max_order FROM max_orders WHERE terminal_id = p_terminal_id
  )
  WHERE m.id IN (SELECT id FROM to_fix);
  
  -- Now reassign all sort orders sequentially for the terminal
  WITH ordered AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY terminal_id 
        ORDER BY sort_order, created_at
      ) AS new_order
    FROM movement_terminal_assignments
    WHERE terminal_id = p_terminal_id
  )
  UPDATE movement_terminal_assignments m
  SET sort_order = o.new_order
  FROM ordered o
  WHERE m.id = o.id;
END;
$function$;
COMMENT ON FUNCTION public.fix_duplicate_sort_orders IS 'Fix any duplicate sort order values in terminal assignments';

-- Function to fix all duplicate sort orders
CREATE OR REPLACE FUNCTION public.fix_all_duplicate_sort_orders()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
  terminal_record RECORD;
BEGIN
  -- Process each terminal one by one
  FOR terminal_record IN 
    SELECT DISTINCT terminal_id 
    FROM movement_terminal_assignments
    WHERE terminal_id IS NOT NULL
  LOOP
    PERFORM fix_duplicate_sort_orders(terminal_record.terminal_id);
  END LOOP;
END;
$function$;
COMMENT ON FUNCTION public.fix_all_duplicate_sort_orders IS 'Fix duplicate sort orders across all terminals';

-- Function to sync tank movement sort order
CREATE OR REPLACE FUNCTION public.sync_tank_movement_sort_order()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Update the sort_order in tank_movements when assignment sort_order changes
  UPDATE tank_movements
  SET sort_order = NEW.sort_order
  WHERE assignment_id = NEW.id;
  
  RETURN NEW;
END;
$function$;
COMMENT ON FUNCTION public.sync_tank_movement_sort_order IS 'Sync sort order between terminal assignments and tank movements';

-- Function to get paginated terminal assignments
CREATE OR REPLACE FUNCTION public.get_paginated_terminal_assignments(p_terminal_id uuid, p_page_number integer, p_page_size integer)
 RETURNS TABLE(assignments jsonb, pagination_meta jsonb, page_state jsonb)
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_total_count INTEGER;
  v_total_pages INTEGER;
  v_page_state JSONB;
  v_previous_page_state JSONB;
BEGIN
  -- Get total count of assignments for this terminal
  SELECT COUNT(*) INTO v_total_count
  FROM movement_terminal_assignments
  WHERE terminal_id = p_terminal_id;
  
  -- Calculate total pages
  v_total_pages := CEILING(v_total_count::FLOAT / p_page_size);
  
  -- Check if we have a state for the previous page
  IF p_page_number > 1 THEN
    SELECT previous_page_state INTO v_previous_page_state
    FROM terminal_pagination_state
    WHERE terminal_id = p_terminal_id
      AND page_number = p_page_number - 1
      AND page_size = p_page_size;
  ELSE
    -- For first page, initialize with empty state
    v_previous_page_state := '{
      "tankBalances": {},
      "totalMTMoved": 0,
      "currentStockMT": 0,
      "currentStockM3": 0,
      "currentUllage": 0,
      "t1Balance": 0,
      "t2Balance": 0
    }'::JSONB;
  END IF;
  
  -- Get the assignments for this page
  RETURN QUERY
  WITH paginated_assignments AS (
    SELECT 
      jsonb_agg(
        jsonb_build_object(
          'id', mta.id,
          'movement_id', mta.movement_id,
          'terminal_id', mta.terminal_id,
          'quantity_mt', mta.quantity_mt,
          'assignment_date', mta.assignment_date,
          'comments', mta.comments,
          'sort_order', mta.sort_order,
          'created_at', mta.created_at,
          'updated_at', mta.updated_at,
          'movements', (
            SELECT jsonb_build_object(
              'id', m.id,
              'reference_number', m.reference_number,
              'bl_quantity', m.bl_quantity,
              'product', m.product,
              'barge_name', m.barge_name,
              'buy_sell', m.buy_sell,
              'customs_status', m.customs_status,
              'status', m.status,
              'comments', m.comments,
              'created_at', m.created_at,
              'updated_at', m.updated_at
            )
            FROM movements m
            WHERE m.id = mta.movement_id
          )
        )
      ) AS assignments,
      jsonb_build_object(
        'currentPage', p_page_number,
        'pageSize', p_page_size,
        'totalPages', v_total_pages,
        'totalCount', v_total_count
      ) AS pagination_meta
    FROM movement_terminal_assignments mta
    WHERE mta.terminal_id = p_terminal_id
    ORDER BY mta.sort_order, mta.assignment_date
    LIMIT p_page_size
    OFFSET (p_page_number - 1) * p_page_size
  )
  SELECT 
    pa.assignments,
    pa.pagination_meta,
    v_previous_page_state AS page_state
  FROM paginated_assignments pa;
END;
$function$;
COMMENT ON FUNCTION public.get_paginated_terminal_assignments IS 'Get paginated terminal assignments with movement details';

-- Function to update terminal pagination state
CREATE OR REPLACE FUNCTION public.update_terminal_pagination_state(p_terminal_id uuid, p_page_number integer, p_page_size integer, p_new_state jsonb)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Insert or update the state for this page
  INSERT INTO terminal_pagination_state (
    terminal_id, 
    page_number, 
    page_size, 
    previous_page_state
  )
  VALUES (
    p_terminal_id, 
    p_page_number, 
    p_page_size, 
    p_new_state
  )
  ON CONFLICT (terminal_id, page_number, page_size) 
  DO UPDATE SET 
    previous_page_state = p_new_state,
    updated_at = now();
    
  -- If we changed a page, invalidate all subsequent pages
  DELETE FROM terminal_pagination_state
  WHERE terminal_id = p_terminal_id
    AND page_number > p_page_number
    AND page_size = p_page_size;
END;
$function$;
COMMENT ON FUNCTION public.update_terminal_pagination_state IS 'Update pagination state for a terminal';

-- Function to initialize sort order
CREATE OR REPLACE FUNCTION public.initialize_sort_order(p_table_name text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_max_sort_order INTEGER;
BEGIN
  -- Get the maximum existing sort_order value
  EXECUTE format('
    SELECT COALESCE(MAX(sort_order), 0)
    FROM %I
    WHERE sort_order IS NOT NULL
  ', p_table_name) INTO v_max_sort_order;
  
  -- If the table is 'movements', exclude records where product is 'Transfer' or 'RECONCILIATION'
  IF p_table_name = 'movements' THEN
    -- Set initial sort_order values based on created_at date (newest first)
    -- Only for records with NULL sort_order that are NOT pump overs or reconciliation records
    -- Start from the next available sort_order
    EXECUTE format('
      UPDATE %I 
      SET sort_order = sub.new_order
      FROM (
        SELECT 
          id, 
          (ROW_NUMBER() OVER (ORDER BY created_at DESC) + $1) as new_order
        FROM %I
        WHERE sort_order IS NULL AND product NOT IN (''Transfer'', ''RECONCILIATION'')
      ) sub
      WHERE %I.id = sub.id
    ', p_table_name, p_table_name, p_table_name)
    USING v_max_sort_order;
  ELSE
    -- For other tables, keep the original logic but start from max + 1
    EXECUTE format('
      UPDATE %I 
      SET sort_order = sub.new_order
      FROM (
        SELECT 
          id, 
          (ROW_NUMBER() OVER (ORDER BY created_at DESC) + $1) as new_order
        FROM %I
        WHERE sort_order IS NULL
      ) sub
      WHERE %I.id = sub.id
    ', p_table_name, p_table_name, p_table_name)
    USING v_max_sort_order;
  END IF;
END;
$function$;
COMMENT ON FUNCTION public.initialize_sort_order IS 'Initialize sort order for any table with a sort_order column';

-- Function to insert product with duplicate checking
CREATE OR REPLACE FUNCTION public.insert_product(product_name text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  new_product_id uuid;
BEGIN
  -- Check if product already exists to prevent duplicates
  IF EXISTS (SELECT 1 FROM products WHERE LOWER(name) = LOWER(product_name)) THEN
    RAISE EXCEPTION 'A product with the name "%" already exists', product_name;
  END IF;
  
  -- Insert the new product
  INSERT INTO products (name)
  VALUES (product_name)
  RETURNING id INTO new_product_id;
  
  RETURN new_product_id;
END;
$function$;
COMMENT ON FUNCTION public.insert_product IS 'Add a new product with duplicate checking';

-- Function to insert counterparty with duplicate checking
CREATE OR REPLACE FUNCTION public.insert_counterparty(counterparty_name text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  new_counterparty_id uuid;
BEGIN
  -- Check if counterparty already exists to prevent duplicates
  IF EXISTS (SELECT 1 FROM counterparties WHERE LOWER(name) = LOWER(counterparty_name)) THEN
    RAISE EXCEPTION 'A counterparty with the name "%" already exists', counterparty_name;
  END IF;
  
  -- Insert the new counterparty
  INSERT INTO counterparties (name)
  VALUES (counterparty_name)
  RETURNING id INTO new_counterparty_id;
  
  RETURN new_counterparty_id;
END;
$function$;
COMMENT ON FUNCTION public.insert_counterparty IS 'Add a new counterparty with duplicate checking';

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

  -- Audit triggers for important tables
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

  -- Open trades management triggers
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

  -- Movement management triggers
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_movement_reference_on_insert') THEN
    CREATE TRIGGER set_movement_reference_on_insert
    BEFORE INSERT ON public.movements
    FOR EACH ROW
    WHEN (NEW.trade_leg_id IS NOT NULL AND NEW.reference_number IS NULL)
    EXECUTE FUNCTION set_movement_reference();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_movement_loading_periods_on_insert') THEN
    CREATE TRIGGER set_movement_loading_periods_on_insert
    BEFORE INSERT ON public.movements
    FOR EACH ROW EXECUTE FUNCTION set_movement_loading_periods();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_open_trades_after_movement_insert') THEN
    CREATE TRIGGER update_open_trades_after_movement_insert
    AFTER INSERT ON public.movements
    FOR EACH ROW EXECUTE FUNCTION update_open_trades_on_movement_change();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_open_trades_after_movement_update') THEN
    CREATE TRIGGER update_open_trades_after_movement_update
    AFTER UPDATE ON public.movements
    FOR EACH ROW EXECUTE FUNCTION update_open_trades_on_movement_change();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_open_trades_after_movement_delete') THEN
    CREATE TRIGGER update_open_trades_after_movement_delete
    AFTER DELETE ON public.movements
    FOR EACH ROW EXECUTE FUNCTION update_open_trades_on_movement_change();
  END IF;

  -- Tank management triggers
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_tank_display_order_on_insert') THEN
    CREATE TRIGGER set_tank_display_order_on_insert
    BEFORE INSERT ON public.tanks
    FOR EACH ROW EXECUTE FUNCTION set_tank_display_order();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sync_tank_movement_sort_order_after_update') THEN
    CREATE TRIGGER sync_tank_movement_sort_order_after_update
    AFTER UPDATE OF sort_order ON public.movement_terminal_assignments
    FOR EACH ROW EXECUTE FUNCTION sync_tank_movement_sort_order();
  END IF;
END
$$;

-- ==========================================
-- ENABLE REALTIME FUNCTIONALITY
-- ==========================================

-- Only add tables to the publication if they aren't already included
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

-- End of database backup script - May 19, 2024
