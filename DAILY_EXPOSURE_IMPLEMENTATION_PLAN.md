
# Daily Exposure Distribution Implementation Plan

This document outlines the step-by-step implementation plan for converting monthly exposure distributions to daily distributions and adding date range filtering to the exposure reporting page.

## 1. Database Schema Updates

### 1.1 Modify Existing JSON Structure
- No schema changes needed since exposures are stored in JSONB columns
- We'll update the structure of the JSONB data to include dailyDistribution:
  ```json
  {
    "physical": { ... },
    "pricing": { ... },
    "monthlyDistribution": { ... },
    "dailyDistribution": {
      "instrumentName1": {
        "2023-03-15": 3000,
        "2023-03-16": 3000,
        "2023-03-17": 3000,
        ...
      },
      "instrumentName2": {
        ...
      }
    }
  }
  ```

## 2. Backend Changes

### 2.1 Create Working Days Utility Functions
- Create a new utility function `distributeQuantityByWorkingDaysDaily` in `src/utils/workingDaysUtils.ts`
- This function will distribute quantities per working day (similar to the existing monthly distribution function)
- Format: `{ "2023-03-15": 3000, "2023-03-16": 3000, ... }`

### 2.2 Update Types
- Update `src/types/pricing.ts` to add the `DailyDistribution` type and update `ExposureResult` type

### 2.3 Update Formula Calculation
- Modify `calculateExposures` function in `src/utils/formulaCalculation.ts` to:
  - Calculate daily distribution alongside monthly distribution
  - Apply correct sign to the daily distributions (positive for buys, negative for sells for physical exposure, and opposite for pricing exposure)

### 2.4 Update Database Records
- Create a migration script to update all existing trade legs
- Add empty dailyDistribution object to all existing records
- We'll recalculate exposures when they're accessed rather than bulk updating in migration

## 3. Frontend Changes

### 3.1 Update Exposure UI
- Add date range picker component to the exposure page:
  - Start date picker
  - End date picker
  - Default to current month (1st day to last day)

### 3.2 Implement Exposure Filtering Logic
- Create utility functions to filter daily exposures by date range
- Calculate total exposure for the selected date range by summing daily values
- Create function to aggregate daily exposures into monthly buckets for display

### 3.3 Update Exposure Data Hooks
- Modify exposure data fetching to include date range parameters
- Implement client-side filtering of exposure data based on selected date range

## 4. Testing

### 4.1 Unit Tests
- Test daily distribution calculation with various scenarios:
  - Single day periods
  - Multi-day periods spanning weekends
  - Multi-day periods spanning multiple months
  - Different buy/sell directions

### 4.2 Integration Tests
- Test exposure calculation with:
  - Physical trades
  - Paper trades
  - Various pricing periods
  - Various date range selections

## 5. Implementation Order

1. Update type definitions
2. Create daily distribution utility functions
3. Update formula calculation to include daily distributions
4. Add database migration script
5. Add date range picker UI to exposure page
6. Implement client-side filtering of exposures by date range
7. Update exposure data hooks to use new filtering logic
8. Test and verify

## Example Scenarios

### Physical Trade Example
- Trade: 30,000mt buying UCOME with Platts Diesel + 400 formula
- Physical Exposure: 30,000mt UCOME
- Pricing Exposure: -30,000mt Diesel
- Pricing Period: March 15-30 (10 business days)
- Daily Exposure: 3,000mt per business day

#### Date Range Scenarios:
1. User selects March 1-14:
   - Exposure: 0mt (no overlap with pricing period)
   
2. User selects March 7-19:
   - Exposure: +9,000mt UCOME (physical), -9,000mt Diesel (pricing)
   - (3 business days overlap × 3,000mt per day)

### Paper Trade Example
- Trade: 20,000mt selling Argus FAME0 for April
- Physical Exposure: -20,000mt FAME0
- Pricing Period: April 1-30 (21 business days)
- Daily Exposure: Approx. 952mt per business day

#### Date Range Scenarios:
1. User selects April 1-15:
   - Exposure: -10,472mt FAME0 (11 business days × 952mt)
   
2. User selects March 25-April 10:
   - Exposure: -6,664mt FAME0 (7 business days in April × 952mt)
