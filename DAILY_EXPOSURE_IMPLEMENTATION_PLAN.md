
# Daily Exposure Distribution Implementation Plan (Revised)

This document outlines the revised implementation plan for adding date range filtering to the exposure reporting page by calculating daily distributions on-the-fly from existing monthly distributions. This implementation focuses specifically on physical trades first, with paper trades to be addressed in a future phase.

## 1. Types and Utilities Updates

### 1.1 Update Types
- Update `src/types/pricing.ts` to add the `DailyDistribution` type
- This will be used for on-the-fly calculations, not for database storage

```typescript
export interface DailyDistribution {
  [dateString: string]: number; // e.g., "2023-03-15": 3000
}

export interface DailyDistributionByInstrument {
  [instrument: string]: DailyDistribution;
}
```

### 1.2 Create Daily Distribution Utility Functions
- Create a new utility function `calculateDailyDistribution` in `src/utils/workingDaysUtils.ts`
- This function will convert monthly distribution to daily distribution based on working days
- No database changes will be made; all calculations will be done in memory
- Format: `{ "2023-03-15": 3000, "2023-03-16": 3000, ... }`

### 1.3 Create Date Range Filtering Functions
- Create utility functions to filter daily exposures by date range
- Functions to aggregate filtered daily exposures back into a format compatible with the existing UI

## 2. Frontend Changes

### 2.1 Date Range Selection UI
- Add date range picker component to the exposure page:
  - Start date picker
  - End date picker
  - Default to current month (1st day to last day)
- Ensure UI changes don't disrupt existing exposure table layout

### 2.2 Exposure Data Hook Updates
- Create a new hook `useFilteredExposures` that:
  - Wraps the existing exposure data hook
  - Accepts date range parameters
  - Calculates daily distribution on-the-fly from monthly distribution
  - Filters and aggregates exposures based on the selected date range
  - Returns data in the same format expected by the existing UI components

### 2.3 Loading State
- Implement loading state indicators during exposure recalculation
- Ensure smooth user experience when changing date ranges

## 3. Implementation Details

### 3.1 Daily Distribution Calculation
- For each trade with monthly distribution:
  - Calculate number of working days in each month of the pricing period
  - Distribute monthly quantities evenly across working days
  - Store results in memory (not in database)

### 3.2 Exposure Filtering Logic
- Filter daily exposures to include only dates within the selected range
- Sum the filtered daily values to get total exposure for the selected period
- Present results in the same format as the existing exposure table

### 3.3 Performance Optimization
- Implement caching for calculated daily distributions to avoid redundant calculations
- Cache invalidation when trades change

## 4. Testing

### 4.1 Unit Tests
- Test daily distribution calculation with various scenarios:
  - Single day periods
  - Multi-day periods spanning weekends
  - Multi-day periods spanning multiple months
  - Different buy/sell directions

### 4.2 Integration Tests
- Test exposure filtering with:
  - Different date range selections
  - Various pricing periods
  - Ensure filtered exposures match expected values based on examples

## 5. Implementation Order

1. Update type definitions
2. Create daily distribution utility functions
3. Create date range filtering utility functions
4. Add date range picker UI to exposure page
5. Create filtered exposures hook
6. Connect UI to new filtered exposures hook
7. Implement loading state
8. Test and verify

## 6. Important Considerations

### 6.1 Backward Compatibility
- The implementation will maintain the existing exposure table format
- No existing functionality will be broken
- Date range filtering will be an additional feature, not a replacement

### 6.2 Scope Limitation
- This implementation focuses only on physical trades
- Paper trades will be addressed in a future phase
- No database schema changes are required

### 6.3 Clean State
- Existing trades will be deleted, so no migration strategy is needed
- Implementation will apply only to newly created trades

## 7. Example Scenarios

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

3. User selects entire month (March 1-31):
   - Exposure: +30,000mt UCOME (physical), -30,000mt Diesel (pricing)
   - The full exposure is shown since it encompasses the entire pricing period

### Improvements Over Original Plan

1. **On-the-fly Calculation**: Instead of storing daily distributions in the database, we calculate them as needed
2. **Reduced Database Size**: No increase in database size or complexity
3. **Simpler Implementation**: No need for database migrations or updates
4. **Focus on Physical Trades**: Clear scope limitation to ensure quality implementation
5. **Backward Compatibility**: Ensures existing features continue to work without disruption
6. **Clean Start**: No need to handle existing data, as we'll start fresh with new trades
7. **Loading State**: Better user experience during calculations
8. **Caching**: Performance optimization to reduce recalculation overhead
