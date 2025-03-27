
# Daily Exposure Distribution Implementation Plan (Revised)

This document outlines the revised implementation plan for adding date range filtering to the exposure reporting page by calculating daily distributions on-the-fly from existing monthly distributions. This implementation focuses on both physical trades and paper trades.

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
- This implementation covers both physical trades and paper trades
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

## 8. Implementation Details for Paper Trades

### 8.1 Paper Trade Date Range Filtering

Unlike physical trades, paper trades are always for a single month period. This simplifies the daily distribution calculation but requires some special handling:

1. **Paper Trade Characteristics**:
   - Each paper trade applies to exactly one month
   - Monthly distribution is already stored in the trade exposures
   - The pricing period for paper trades always matches the month of the trade

2. **Daily Distribution Calculation for Paper Trades**:
   ```typescript
   export function calculateDailyDistributionForPaperTrade(
     totalExposure: number,
     tradingPeriod: string // e.g., "Mar-25"
   ): DailyDistribution {
     // Convert trading period to start/end dates (first and last day of month)
     const { start, end } = monthCodeToDates(tradingPeriod);
     
     // Calculate working days in the entire month
     const workingDaysInMonth = countWorkingDays(start, end);
     
     // Calculate daily exposure value
     const dailyExposure = totalExposure / workingDaysInMonth;
     
     // Distribute to all working days in the month
     const dailyDistribution: DailyDistribution = {};
     const currentDate = new Date(start);
     
     while (currentDate <= end) {
       if (!isWeekend(currentDate)) {
         const dateString = format(currentDate, 'yyyy-MM-dd');
         dailyDistribution[dateString] = dailyExposure;
       }
       currentDate.setDate(currentDate.getDate() + 1);
     }
     
     return dailyDistribution;
   }
   ```

3. **Integration with Existing Filtering Logic**:
   - Reuse the same filtering functions as physical trades
   - Ensure the `getOverlappingDays` function properly handles month-based paper trade periods

### 8.2 Paper Trade Exposure Calculation Example

**Example: Paper trade for RME DIFF 1000mt in Mar-25**

1. **Initial Setup**:
   - Trading period: Mar-25
   - Total exposure: +1000mt RME and -1000mt LSGO (both paper and pricing exposures)
   - Month has 21 working days in total

2. **Daily Distribution Calculation**:
   - Daily exposure = 1000mt ÷ 21 = 47.62mt per working day
   - This applies to both RME (+47.62mt/day) and LSGO (-47.62mt/day)

3. **Date Range Filtering Scenarios**:

   **Scenario A: Filter range Mar 1-15, 2025 (10 working days)**
   - Overlap: Mar 1-15 (10 working days)
   - Filtered exposure: 
     - RME: +476.2mt (10 days × 47.62mt/day)
     - LSGO: -476.2mt (10 days × 47.62mt/day)
   - Exposure table shows:
     - March row: +476.2mt RME, -476.2mt LSGO
     - All other month rows: 0mt

   **Scenario B: Filter range Mar 15 - Apr 15, 2025**
   - Overlap with paper trade: Only Mar 15-31 (13 working days)
   - Filtered exposure:
     - RME: +619.06mt (13 days × 47.62mt/day)
     - LSGO: -619.06mt (13 days × 47.62mt/day)
   - Exposure table shows:
     - March row: +619.06mt RME, -619.06mt LSGO
     - April row: 0mt (paper trade is only for March)
     - All other month rows: 0mt

   **Scenario C: Filter range Feb 15 - Mar 5, 2025**
   - Overlap with paper trade: Only Mar 1-5 (5 working days)
   - Filtered exposure:
     - RME: +238.1mt (5 days × 47.62mt/day)
     - LSGO: -238.1mt (5 days × 47.62mt/day)
   - Exposure table shows:
     - February row: 0mt (paper trade is only for March)
     - March row: +238.1mt RME, -238.1mt LSGO
     - All other month rows: 0mt

### 8.3 Combined Physical and Paper Trade Filtering

When both physical and paper trades exist in the system:

1. Calculate daily distributions separately for each trade type:
   - Physical trades: Based on pricing period that may span multiple months
   - Paper trades: Based on the single month trading period

2. Apply the same date range filter to both sets of daily distributions

3. Combine the filtered results to show the total exposure in the exposure table

### 8.4 Implementation Changes for Paper Trades

1. **Extend the `useFilteredExposures` hook**:
   ```typescript
   // Update to process both physical and paper trades
   const { physicalExposures, paperExposures } = useExposures();
   
   // Apply filtering to both types of exposures
   const filteredPhysicalExposures = filterPhysicalExposures(physicalExposures, startDate, endDate);
   const filteredPaperExposures = filterPaperExposures(paperExposures, startDate, endDate);
   
   // Combine results for the UI
   const combinedExposures = combineExposures(filteredPhysicalExposures, filteredPaperExposures);
   ```

2. **Create helper function for paper trade filtering**:
   ```typescript
   export function filterPaperExposures(
     paperExposures: Record<string, any>,
     startDate: Date,
     endDate: Date
   ) {
     // Iterate through paper trades and apply filtering
     // Return filtered exposures in the same format as the UI expects
   }
   ```

3. **Create helper function to combine exposures**:
   ```typescript
   export function combineExposures(
     physicalExposures: Record<string, any>,
     paperExposures: Record<string, any>
   ) {
     // Combine both sets of exposures by summing values for the same products and months
     // Return combined exposures in the format expected by the UI
   }
   ```

### 8.5 Key Differences from Physical Trade Implementation

1. **Pricing Period Determination**:
   - Physical trades: Multi-month pricing periods possible
   - Paper trades: Always exactly one month

2. **Daily Exposure Calculation**:
   - Physical trades: Total exposure ÷ working days in entire pricing period
   - Paper trades: Monthly exposure ÷ working days in that specific month

3. **Distribution Source**:
   - Physical trades: Derived from monthly distribution
   - Paper trades: Derived directly from the trade's exposure data

4. **Data Access Path**:
   - Physical trades: Accessed from `trade_legs` table with exposures JSON
   - Paper trades: Accessed from `paper_trade_legs` table with exposures JSON

Despite these differences, the core filtering logic remains the same: calculate a daily distribution, then filter it based on the overlapping days between the selected date range and the trade's applicable period.
