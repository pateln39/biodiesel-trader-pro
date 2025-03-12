

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

## Phase 2: Excel Upload Infrastructure ✅

- [x] Create Excel template for price uploads
- [x] Implement file parsing logic
- [x] Build validation system:
  - [x] Date format and range validation
  - [x] Price format validation
  - [x] Duplicate date detection
  - [x] Instrument existence validation
- [x] Implement validation report generation
- [x] Create database insertion logic
- [x] Build upload interface

## Phase 3: Price Calculation Engine ✅

- [x] Implement historical price calculation logic
- [x] Implement pricing period logic (current, past, future)
- [x] Create forward price selection logic
- [x] Build recalculation trigger system
- [x] Implement trade leg price update mechanism
- [x] Add `last_calculation_date` tracking

## Phase 4: Formula Builder Integration ✅

- [x] Update formula builder to use instruments from database
- [x] Connect formula builder to calculation engine
- [x] Implement exposure calculation based on formula

## Phase 5: Price Details Interface ✅

- [x] Create price details modal component
- [x] Implement daily price breakdown table
- [x] Build period information display
- [x] Create average price calculation display
- [x] Implement forward price logic display
- [x] Connect to trade details view

## Phase 6: Testing and Validation ⏳

- [ ] Create test data for historical prices
  - Create sample dataset with at least 90 days of historical prices
  - Include weekends and holidays to test date handling
  - Test with multiple instruments (UCOME, RME, FAME0, LSGO, diesel)
- [ ] Create test data for forward prices
  - Create sample forward curves for at least 6 months
  - Include all supported instruments
  - Test month-end transitions
- [ ] Test calculation logic with different formulas
  - Simple formulas (single instrument)
  - Complex formulas (multiple instruments with operators)
  - Edge cases (division by zero, missing instrument data)
- [ ] Test edge cases for price calculations
  - Weekends and holidays price handling
  - Missing prices in the middle of a period
  - Pricing periods that span historical and forward prices
- [ ] Validate upload functionality
  - Test validation error handling
  - Test duplicate price handling
  - Test large file uploads
- [ ] Test recalculation triggers
  - Verify price updates propagate to trade valuations
  - Test automatic and manual recalculation

## Status Tracking

Regular updates to this document will be made to track progress. Each item will be marked complete once implemented and tested.

- **Phase 1**: Completed ✅ - Database schema successfully implemented
- **Phase 2**: Completed ✅ - Excel upload functionality working
- **Phase 3**: Completed ✅ - Price calculation engine operational
- **Phase 4**: Completed ✅ - Formula builder integrated with calculation engine
- **Phase 5**: Completed ✅ - Price details display functioning
- **Phase 6**: In Progress ⏳ - Testing and validation underway

## Considerations

1. **Performance**: For large price histories, we need to optimize database queries
2. **Fallbacks**: Define logic for missing prices (previous day, interpolation, etc.)
3. **Permissions**: Determine who can upload prices vs. who can only view them
4. **Audit**: Track who uploaded which prices and when
5. **Validation**: No partial uploads - all or nothing approach

## Next Steps

1. Complete the Phase 6 testing and validation tasks
2. Create comprehensive documentation for users
3. Plan for future enhancements:
   - Price data visualization tools
   - Historical price analytics
   - Automated price imports from external sources
   - Price forecast modeling

