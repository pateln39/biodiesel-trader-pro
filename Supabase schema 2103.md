
# Supabase Database Schema Documentation (21 March)

This document serves as a comprehensive backup of the Supabase database schema as of March 21. It contains detailed information about each table, its columns, relationships, and how they connect to the application code. This can be used to recreate the database from scratch if needed.

## Core Tables

### `parent_trades`

The parent table for all trades in the system. Each trade has a parent record and one or more legs.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| trade_reference | TEXT | No | None | Unique reference code for the trade |
| trade_type | TEXT | No | None | Type of trade ('physical' or 'paper') |
| physical_type | TEXT | Yes | None | For physical trades: 'spot' or 'term' |
| counterparty | TEXT | No | None | The counterparty for this trade |
| comment | TEXT | Yes | None | Optional comments about the trade |
| created_at | TIMESTAMP WITH TIME ZONE | No | now() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | No | now() | Last update timestamp |

**Realtime Configuration:**
- REPLICA IDENTITY: FULL
- Added to supabase_realtime publication

**Code Relations:**
- Mapped to `ParentTrade` and `Trade` interfaces in `src/types/common.ts`
- Used in `fetchTrades()` in `src/hooks/useTrades.ts`
- Physical trades use physical_type field, while paper trades leave it null

### `trade_legs`

Contains the individual legs for each trade. Every parent_trade has at least one trade_leg.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| parent_trade_id | UUID | No | None | Foreign key to parent_trades.id |
| leg_reference | TEXT | No | None | Reference code for this leg |
| buy_sell | TEXT | No | None | 'buy' or 'sell' |
| product | TEXT | No | None | Product being traded |
| sustainability | TEXT | Yes | None | Sustainability certification |
| inco_term | TEXT | Yes | None | Incoterm for physical deliveries |
| quantity | NUMERIC | No | None | Quantity being traded |
| tolerance | NUMERIC | Yes | None | Allowed tolerance percentage |
| loading_period_start | DATE | Yes | None | Start of loading period for physical |
| loading_period_end | DATE | Yes | None | End of loading period for physical |
| pricing_period_start | DATE | Yes | None | Start of pricing period |
| pricing_period_end | DATE | Yes | None | End of pricing period |
| unit | TEXT | Yes | None | Unit of measurement (MT, KG, L) |
| payment_term | TEXT | Yes | None | Payment terms |
| credit_status | TEXT | Yes | None | Credit approval status |
| pricing_formula | JSONB | Yes | None | Formula for pricing calculations |
| broker | TEXT | Yes | None | Broker for paper trades |
| instrument | TEXT | Yes | None | Instrument for paper trades |
| price | NUMERIC | Yes | None | Fixed price (for paper trades) |
| calculated_price | NUMERIC | Yes | None | Calculated price from formula |
| last_calculation_date | TIMESTAMP WITH TIME ZONE | Yes | None | When price was last calculated |
| mtm_formula | JSONB | Yes | None | Mark-to-market formula |
| mtm_calculated_price | NUMERIC | Yes | None | Mark-to-market calculated price |
| mtm_last_calculation_date | TIMESTAMP WITH TIME ZONE | Yes | None | When MTM was last calculated |
| created_at | TIMESTAMP WITH TIME ZONE | No | now() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | No | now() | Last update timestamp |
| trading_period | TEXT | Yes | None | Trading period for paper trades |

**Realtime Configuration:**
- REPLICA IDENTITY: FULL
- Added to supabase_realtime publication

**Code Relations:**
- Physical legs map to `PhysicalTradeLeg` interface in `src/types/physical.ts`
- Paper legs map to `PaperTradeLeg` interface in `src/types/trade.ts`
- Foreign key relationship to parent_trades
- Used in both physical and paper trade forms

**Database Constraints:**
- Foreign key to parent_trades(id) with CASCADE delete

## Reference Data Tables

### `products`

Reference data for products that can be traded.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| created_at | TIMESTAMP WITH TIME ZONE | No | timezone('utc'::text, now()) | Creation timestamp |
| name | TEXT | No | None | Product name |

**Code Relations:**
- Used for product dropdown selections in trade forms
- Maps to `Product` type in `src/types/trade.ts`

### `counterparties`

List of trading counterparties.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| created_at | TIMESTAMP WITH TIME ZONE | No | timezone('utc'::text, now()) | Creation timestamp |
| name | TEXT | No | None | Counterparty name |

**Code Relations:**
- Used for counterparty dropdown selections in trade forms

### `inco_terms`

International Commercial Terms for physical deliveries.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| created_at | TIMESTAMP WITH TIME ZONE | No | timezone('utc'::text, now()) | Creation timestamp |
| name | TEXT | No | None | Incoterm name (FOB, CIF, etc.) |

**Code Relations:**
- Maps to `IncoTerm` type in `src/types/trade.ts`
- Used in physical trade forms

### `payment_terms`

Available payment terms for trades.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| created_at | TIMESTAMP WITH TIME ZONE | No | timezone('utc'::text, now()) | Creation timestamp |
| name | TEXT | No | None | Payment term description |

**Code Relations:**
- Maps to `PaymentTerm` type in `src/types/trade.ts`
- Used in physical trade forms

### `sustainability`

Sustainability certification options for products.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| created_at | TIMESTAMP WITH TIME ZONE | No | timezone('utc'::text, now()) | Creation timestamp |
| name | TEXT | No | None | Sustainability certification name |

**Code Relations:**
- Used for sustainability dropdown selections in physical trade forms

### `credit_status`

Available credit approval status options.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| created_at | TIMESTAMP WITH TIME ZONE | No | timezone('utc'::text, now()) | Creation timestamp |
| name | TEXT | No | None | Credit status name |

**Code Relations:**
- Maps to `CreditStatus` type in `src/types/trade.ts`
- Used in physical trade forms

### `brokers`

List of brokers for paper trades.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| created_at | TIMESTAMP WITH TIME ZONE | Yes | now() | Creation timestamp |
| is_active | BOOLEAN | Yes | true | Whether broker is active |
| name | TEXT | No | None | Broker name |

**Code Relations:**
- Used for broker dropdown selections in paper trade forms

## Paper Trading Tables

### `paper_trade_products`

Products specific to paper trading.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| created_at | TIMESTAMP WITH TIME ZONE | Yes | now() | Creation timestamp |
| is_active | BOOLEAN | Yes | true | Whether product is active |
| product_code | TEXT | No | None | Product code |
| display_name | TEXT | No | None | Display name |
| category | TEXT | No | None | Product category |
| base_product | TEXT | Yes | None | Base product reference |
| paired_product | TEXT | Yes | None | Paired product for spreads |

**Code Relations:**
- Used in paper trade forms for product selection

### `product_relationships`

Defines relationships between products for paper trading.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| created_at | TIMESTAMP WITH TIME ZONE | Yes | now() | Creation timestamp |
| product | TEXT | No | None | Product code |
| relationship_type | TEXT | No | None | Type of relationship (FP, DIFF, SPREAD) |
| paired_product | TEXT | Yes | None | Related product |
| default_opposite | TEXT | Yes | None | Default opposite for diffs |

**Code Relations:**
- Maps to `ProductRelationship` interface in `src/types/trade.ts`
- Used to construct paper trade formulas

### `trading_periods`

Trading periods for paper trades.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| start_date | DATE | No | None | Period start date |
| end_date | DATE | No | None | Period end date |
| created_at | TIMESTAMP WITH TIME ZONE | Yes | now() | Creation timestamp |
| is_active | BOOLEAN | Yes | true | Whether period is active |
| period_code | TEXT | No | None | Period code (e.g., 'JUN23') |
| period_type | TEXT | No | None | Period type |

**Code Relations:**
- Used for period selection in paper trades

## Pricing Tables

### `pricing_instruments`

Instruments used for pricing calculations.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| is_active | BOOLEAN | Yes | true | Whether instrument is active |
| created_at | TIMESTAMP WITH TIME ZONE | No | now() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | No | now() | Last update timestamp |
| instrument_code | TEXT | No | None | Instrument code |
| display_name | TEXT | No | None | Display name |
| description | TEXT | Yes | None | Description |
| category | TEXT | Yes | None | Category |

**Code Relations:**
- Used in pricing formula construction
- Referenced in formula tokens

### `historical_prices`

Historical price data for instruments.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| instrument_id | UUID | No | None | Foreign key to pricing_instruments |
| price_date | DATE | No | None | Date of price |
| price | NUMERIC | No | None | Price value |
| created_at | TIMESTAMP WITH TIME ZONE | No | now() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | No | now() | Last update timestamp |

**Code Relations:**
- Used for historical price displays and calculations
- Referenced by MTM calculations

### `forward_prices`

Forward curve prices for instruments.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| instrument_id | UUID | No | None | Foreign key to pricing_instruments |
| forward_month | DATE | No | None | Forward month |
| price | NUMERIC | No | None | Price value |
| created_at | TIMESTAMP WITH TIME ZONE | No | now() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | No | now() | Last update timestamp |
| id | UUID | No | gen_random_uuid() | Primary key |

**Code Relations:**
- Used for forward curve displays and calculations
- Referenced by pricing formulas

## Database-Code Relationship

### Interface Mapping

The database tables map to TypeScript interfaces in the application code:

1. `parent_trades` + `trade_legs` → `PhysicalTrade` in `src/types/physical.ts` and `PaperTrade` in `src/types/trade.ts`
2. `trade_legs` (physical) → `PhysicalTradeLeg` in `src/types/physical.ts`
3. `trade_legs` (paper) → `PaperTradeLeg` in `src/types/trade.ts`
4. `pricing_formula` + `mtm_formula` fields → `PricingFormula` in `src/types/pricing.ts`

### Data Access Layer

The main hooks that access the database include:

1. `useTrades` in `src/hooks/useTrades.ts` - Handles physical trades
2. `usePaperTrades` in `src/hooks/usePaperTrades.ts` - Handles paper trades
3. `useHistoricalPrices` in `src/hooks/useHistoricalPrices.ts` - Manages price data
4. `useReferenceData` in `src/hooks/useReferenceData.ts` - Fetches reference data

### Realtime Subscription

The database uses Supabase's realtime functionality to keep the UI in sync with database changes:

```typescript
// Example from useTrades.ts
const parentTradesChannel = supabase
  .channel('physical_parent_trades')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'parent_trades',
    filter: 'trade_type=eq.physical'
  }, () => {
    debouncedRefetch(refetch);
  })
  .subscribe();
```

Both `parent_trades` and `trade_legs` tables have REPLICA IDENTITY set to FULL to ensure complete row data is available in change events.

## Database Recreation Instructions

To recreate this database structure from scratch:

1. Create the reference data tables first (products, counterparties, etc.)
2. Create the main trade tables (parent_trades, trade_legs)
3. Create the pricing and paper trading specific tables
4. Add the realtime configuration to tables that need it

The SQL to create the core trade tables:

```sql
-- Step 1: Create the parent_trades table
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

-- Step 2: Create the trade_legs table
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
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  trading_period TEXT
);

-- Step 3: Enable realtime functionality
ALTER PUBLICATION supabase_realtime ADD TABLE parent_trades, trade_legs;
ALTER TABLE parent_trades REPLICA IDENTITY FULL;
ALTER TABLE trade_legs REPLICA IDENTITY FULL;
```
