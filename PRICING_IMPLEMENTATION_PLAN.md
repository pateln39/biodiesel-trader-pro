
# Pricing Database Implementation Plan

This document outlines the phased approach for implementing the pricing database functionality, including Excel upload, price calculation, and price details display.

## Overview

The pricing database will store historical and forward prices for various instruments, enabling price calculation for trades based on their pricing formulas and periods. The system will support Excel upload with robust validation and provide detailed price information for each trade.

## Phase 1: Database Setup ✅

- [x] Create `pricing_instruments` table
- [x] Create `historical_prices` table
- [x] Create `forward_prices` table
- [x] Add required columns to `trade_legs` table
- [x] Seed `pricing_instruments` table with initial data

## Phase 2: Excel Upload Infrastructure

- [ ] Create Excel template for price uploads
- [ ] Implement file parsing logic
- [ ] Build validation system:
  - [ ] Date format and range validation
  - [ ] Price format validation
  - [ ] Duplicate date detection
  - [ ] Instrument existence validation
- [ ] Implement validation report generation
- [ ] Create database insertion logic
- [ ] Build upload interface

## Phase 3: Price Calculation Engine

- [ ] Implement historical price calculation logic
- [ ] Implement pricing period logic (current, past, future)
- [ ] Create forward price selection logic
- [ ] Build recalculation trigger system
- [ ] Implement trade leg price update mechanism
- [ ] Add `last_calculation_date` tracking

## Phase 4: Formula Builder Integration

- [ ] Update formula builder to use instruments from database
- [ ] Connect formula builder to calculation engine
- [ ] Implement exposure calculation based on formula

## Phase 5: Price Details Interface

- [ ] Create price details modal component
- [ ] Implement daily price breakdown table
- [ ] Build period information display
- [ ] Create average price calculation display
- [ ] Implement forward price logic display
- [ ] Connect to trade details view

## Phase 6: Testing and Validation

- [ ] Create test data for historical prices
- [ ] Create test data for forward prices
- [ ] Test calculation logic with different formulas
- [ ] Test edge cases (weekends, holidays, missing prices)
- [ ] Validate upload functionality
- [ ] Test recalculation triggers

## Status Tracking

Regular updates to this document will be made to track progress. Each item will be marked complete once implemented and tested.

## Considerations

1. **Performance**: For large price histories, we need to optimize database queries
2. **Fallbacks**: Define logic for missing prices (previous day, interpolation, etc.)
3. **Permissions**: Determine who can upload prices vs. who can only view them
4. **Audit**: Track who uploaded which prices and when
5. **Validation**: No partial uploads - all or nothing approach
