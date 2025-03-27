
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
- Create a new utility function `calculateDailyDistribution` in `src/utils/exposureUtils.ts`
- This function will convert monthly distribution to daily distribution based on working days
- No database changes will be made; all calculations will be done in memory
- Format: `{ "2023-03-15": 3000, "2023-03-16": 3000, ... }`

### 1.3 Create Date Range Filtering Functions
- Create utility functions to filter daily exposures by date range
- Functions to aggregate filtered daily exposures back into a format compatible with the existing UI
- Ensure filtering only counts days that overlap between the filter range and the trade's pricing period

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

### 3.1 Daily Distribution Calculation (**CORRECTED**)
- For each trade with monthly distribution:
  - **Calculate total working days in the entire pricing period** (across all months)
  - **Calculate daily exposure amount by dividing total quantity by total working days**
  - **Apply daily exposure to each working day in the pricing period**
  - Store results in memory (not in database)

### 3.2 Exposure Filtering Logic (**CORRECTED**)
- **Filter daily exposures to include only dates that overlap between:**
  - **The selected date range filter**
  - **The trade's pricing period**
- Sum the filtered daily values to get total exposure for the selected period
- Present results in the same monthly format as the existing exposure table
- **Ensure date range filtering only affects months within the filter range**
- **Other months should show zero exposure when filtering is applied**

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

## 7. Example Scenarios (**CORRECTED**)

### Physical Trade Example
- Trade: 1,000mt buying UCOME with LSGO pricing formula
- Physical Exposure: 1,000mt UCOME
- Pricing Exposure: -1,000mt LSGO
- Pricing Period: March 20 - April 18 (22 business days)
- **Daily Exposure: 45.45mt per business day (1,000 ÷ 22)**

#### Date Range Scenarios:
1. User selects March 1-20:
   - **Overlap: Only March 20 (1 business day) overlaps with pricing period**
   - **Exposure: +45.45mt UCOME (physical), -45.45mt LSGO (pricing)**
   - **Only applying the daily rate to the 1 overlapping day**
   
2. User selects March 20-30:
   - **Overlap: March 20-30 (9 business days) overlaps with pricing period**
   - **Exposure: +409.05mt UCOME (physical), -409.05mt LSGO (pricing)**
   - **(9 business days of overlap × 45.45mt per day)**

3. User selects April 1-18:
   - **Overlap: April 1-18 (13 business days) overlaps with pricing period**
   - **Exposure: +590.85mt UCOME (physical), -590.85mt LSGO (pricing)**
   - **(13 business days of overlap × 45.45mt per day)**

4. User selects March 1 - April 30:
   - **Overlap: March 20 - April 18 (full pricing period, 22 business days)**
   - **Exposure: +1,000mt UCOME (physical), -1,000mt LSGO (pricing)**
   - **The full exposure is shown since it encompasses the entire pricing period**

### Monthly Prorating Example (for exposure table display)
- For the trade above (March 20 - April 18, 22 business days total):
  - March has 21 business days total, with 8 days in the pricing period (Mar 20-31)
  - April has 21 business days total, with 14 days in the pricing period (Apr 1-18)
  - **Monthly Distribution:**
    - March: +363.64mt UCOME (8/22 × 1,000mt)
    - April: +636.36mt UCOME (14/22 × 1,000mt)

### Example: Date Range Filter from March 1-21
- Overlapping days with pricing period: March 20-21 (2 business days)
- **Exposure to display:** 
  - March: +90.90mt UCOME (2 days × 45.45mt/day)
  - April: +0mt UCOME (no overlap in April due to date range filter)
  - All other months: 0mt
- **Final exposure table shows:**
  - Current month row: +90.90mt UCOME
  - All other month rows: 0mt

### Example: Date Range Filter from March 15 - April 10
- Overlapping days with pricing period:
  - March: March 20-31 (8 business days)
  - April: April 1-10 (8 business days)
- **Exposure to display:**
  - March: +363.60mt UCOME (8 days × 45.45mt/day)
  - April: +363.60mt UCOME (8 days × 45.45mt/day)
  - All other months: 0mt
- **Final exposure table shows:**
  - Current month row: +363.60mt UCOME
  - Next month row: +363.60mt UCOME
  - All other month rows: 0mt

## 8. Implementation Details (**NEW SECTION**)

### 8.1 Improved Daily Distribution Calculation

The current implementation has the following issues:
1. **Incorrect daily exposure calculation**: Daily exposure is calculated by dividing monthly exposure by working days in a month. Instead, it should divide total exposure by total working days in the pricing period.
2. **Incorrect filtering**: When applying date filters, all days in the filter are counted rather than only days that overlap with the pricing period.

To fix these issues, we need to:

1. **Update the `calculateDailyDistribution` function**:
   ```typescript
   export function calculateDailyDistribution(
     monthlyDistribution: MonthlyDistribution,
     pricingStart: Date,
     pricingEnd: Date
   ): DailyDistribution {
     const dailyDistribution: DailyDistribution = {};
     
     // Calculate total working days in the pricing period
     const totalWorkingDaysInPricingPeriod = countWorkingDays(pricingStart, pricingEnd);
     
     // Calculate total exposure across all months
     const totalExposure = Object.values(monthlyDistribution).reduce((sum, value) => sum + value, 0);
     
     // Calculate value per working day across the entire pricing period
     const valuePerDay = totalExposure / totalWorkingDaysInPricingPeriod;
     
     // Distribute values to each working day in the pricing period
     const currentDate = new Date(pricingStart);
     while (currentDate <= pricingEnd) {
       if (!isWeekend(currentDate)) {
         const dateString = format(currentDate, 'yyyy-MM-dd');
         dailyDistribution[dateString] = valuePerDay;
       }
       currentDate.setDate(currentDate.getDate() + 1);
     }
     
     return dailyDistribution;
   }
   ```

2. **Create a helper function to get overlapping days**:
   ```typescript
   export function getOverlappingDays(
     filterStart: Date,
     filterEnd: Date,
     pricingStart: Date,
     pricingEnd: Date
   ): { start: Date, end: Date } | null {
     // If date ranges don't overlap, return null
     if (filterEnd < pricingStart || filterStart > pricingEnd) {
       return null;
     }
     
     // Get the later of the two start dates
     const overlapStart = filterStart > pricingStart ? filterStart : pricingStart;
     
     // Get the earlier of the two end dates
     const overlapEnd = filterEnd < pricingEnd ? filterEnd : pricingEnd;
     
     return { start: overlapStart, end: overlapEnd };
   }
   ```

3. **Update the `filterDailyDistributionByDateRange` function**:
   ```typescript
   export function filterDailyDistributionByDateRange(
     dailyDistribution: DailyDistribution,
     filterStart: Date,
     filterEnd: Date,
     pricingStart: Date,
     pricingEnd: Date
   ): DailyDistribution {
     const filteredDistribution: DailyDistribution = {};
     
     // Get overlapping date range
     const overlap = getOverlappingDays(filterStart, filterEnd, pricingStart, pricingEnd);
     
     // If there's no overlap, return empty distribution
     if (!overlap) {
       return filteredDistribution;
     }
     
     // Filter daily distribution to only include dates in the overlapping range
     Object.entries(dailyDistribution).forEach(([dateString, value]) => {
       const date = parse(dateString, 'yyyy-MM-dd', new Date());
       
       if (isWithinInterval(date, { start: overlap.start, end: overlap.end })) {
         filteredDistribution[dateString] = value;
       }
     });
     
     return filteredDistribution;
   }
   ```

4. **Update the `useFilteredExposures` hook** to use the new calculation logic and properly display the exposure table with monthly view.

### 8.2 Calculation Examples

**Example: Physical trade with 1,000mt UCOME, March 20 - April 18 pricing period**

1. **Calculate Daily Exposure:**
   - Total working days: 22 business days
   - Daily exposure: 1,000mt ÷ 22 = 45.45mt per day

2. **Date Range Filter: March 1-21**
   - Overlapping days: March 20-21 (2 days)
   - Filtered exposure: 2 × 45.45mt = 90.90mt in March

3. **Date Range Filter: April 1-10**
   - Overlapping days: April 1-10 (8 days)
   - Filtered exposure: 8 × 45.45mt = 363.60mt in April

4. **Date Range Filter: March 25 - April 5**
   - Overlapping days in March: March 25-31 (5 days)
   - Overlapping days in April: April 1-5 (3 days)
   - Filtered exposure in March: 5 × 45.45mt = 227.25mt
   - Filtered exposure in April: 3 × 45.45mt = 136.35mt
   - Total filtered exposure: 363.60mt

## 9. UI Enhancement - Show All Month Rows (**NEW SECTION**)

### 9.1 Current Behavior
Currently, when a date range filter is applied, the exposures are aggregated and the table shows only one row with the filtered exposures. This makes it difficult to see how the exposures are distributed across different months.

### 9.2 Desired Behavior
After applying a date range filter, the exposure table should:
1. Continue to display all month rows, including future and past months
2. Set exposure values to 0 for months that don't overlap with the filtered date range
3. Only show actual exposure values for months that fall within the filtered date range
4. Maintain all existing functionality, including the calculated totals

### 9.3 Implementation Changes
To achieve this, the following changes will be made:

1. **Modify the `ExposurePage.tsx` component**:
   - Update the `exposureData` useMemo to transform the filtered exposures into a complete monthly grid
   - Instead of showing a single row for filtered exposures, expand it to show all months
   - Set exposure values to 0 for months outside the filtered date range
   - Preserve the original monthly view structure while applying the date range filter

2. **No changes to the underlying filtering logic**:
   - The `useFilteredExposures` hook calculations remain unchanged
   - The daily distribution calculation remains unchanged
   - Only the presentation of the data in the exposure table will be modified

### 9.4 Example UI Result

When a user applies a date range filter of March 1-21:
- The March row will show the filtered exposure value (e.g., 90.90mt UCOME)
- All other month rows (January, February, April, etc.) will show 0 exposure
- The total row will still show the correct sum (90.90mt UCOME)

This approach ensures that:
1. Users always see the familiar monthly table structure
2. The context of when exposures occur is clear
3. The filtering functionality works correctly
4. The totals are accurately calculated

No database or calculation logic changes are required, only UI presentation adjustments.
