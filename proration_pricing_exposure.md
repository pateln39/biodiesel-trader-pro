# Implementation Plan: Prorated Pricing Exposure for Physical Trades

This document outlines the detailed implementation plan for enhancing the physical trade system to support prorated pricing exposure calculations across multiple months based on business days.

## Overview

The current system assigns all pricing exposure to a single month based on the loading period start date. The enhanced system will distribute pricing exposure across months covered by the pricing period, proportionally based on the number of business days in each month.

## Core Requirements

1. Physical exposure will remain based solely on the loading period start date and will not be prorated.
2. Pricing exposure will be prorated across months based on business days within the pricing period.
3. Monthly distribution data will be pre-calculated and stored within the trade data structure.
4. Rounding will preserve the sign of the exposure values.

## Implementation Steps

### Step 1: Create Business Day Calculation Utilities

Add new utility functions to handle business day calculations in `src/utils/dateUtils.ts`:

```typescript
/**
 * Checks if a date is a business day (Monday-Friday)
 * @param date The date to check
 * @returns True if the date is a business day
 */
export function isBusinessDay(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6; // 0 = Sunday, 6 = Saturday
}

/**
 * Counts business days between two dates, inclusive
 * @param startDate Start date (inclusive)
 * @param endDate End date (inclusive)
 * @returns Number of business days
 */
export function countBusinessDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const currentDate = new Date(startDate);
  
  // Set to beginning of day
  currentDate.setHours(0, 0, 0, 0);
  
  // Create end date copy and set to end of day
  const endDateCopy = new Date(endDate);
  endDateCopy.setHours(23, 59, 59, 999);
  
  while (currentDate <= endDateCopy) {
    if (isBusinessDay(currentDate)) {
      count++;
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return count;
}

/**
 * Groups business days by month for a given date range
 * @param startDate Start date of the range (inclusive)
 * @param endDate End date of the range (inclusive)
 * @returns Object with month codes as keys and business day counts as values
 */
export function getBusinessDaysByMonth(startDate: Date, endDate: Date): Record<string, number> {
  const result: Record<string, number> = {};
  const currentDate = new Date(startDate);
  
  // Set to beginning of day
  currentDate.setHours(0, 0, 0, 0);
  
  // Create end date copy and set to end of day
  const endDateCopy = new Date(endDate);
  endDateCopy.setHours(23, 59, 59, 999);
  
  while (currentDate <= endDateCopy) {
    if (isBusinessDay(currentDate)) {
      const monthCode = formatMonthCode(currentDate);
      
      if (!result[monthCode]) {
        result[monthCode] = 0;
      }
      
      result[monthCode]++;
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return result;
}

/**
 * Rounds a number to the nearest integer while preserving the sign
 * @param value The number to round
 * @returns Rounded integer with preserved sign
 */
export function roundWithSign(value: number): number {
  return value >= 0 ? Math.round(value) : -Math.round(Math.abs(value));
}

/**
 * Splits a value proportionally across months based on business day distribution,
 * ensuring the total remains the same after rounding
 * @param value The value to distribute
 * @param businessDaysByMonth Business days per month
 * @returns Distribution of the value by month
 */
export function distributeValueByBusinessDays(
  value: number,
  businessDaysByMonth: Record<string, number>
): Record<string, number> {
  const totalBusinessDays = Object.values(businessDaysByMonth).reduce((sum, days) => sum + days, 0);
  
  if (totalBusinessDays === 0) {
    return {};
  }
  
  const distribution: Record<string, number> = {};
  let remainingValue = value;
  let processedMonths = 0;
  const totalMonths = Object.keys(businessDaysByMonth).length;
  
  // Sort months chronologically to ensure consistent distribution
  const sortedMonths = Object.keys(businessDaysByMonth).sort((a, b) => {
    const [monthA, yearA] = a.split('-');
    const [monthB, yearB] = b.split('-');
    return (parseInt(yearA) * 100 + getMonthIndex(monthA)) - (parseInt(yearB) * 100 + getMonthIndex(monthB));
  });
  
  for (const month of sortedMonths) {
    processedMonths++;
    const businessDays = businessDaysByMonth[month];
    const proportion = businessDays / totalBusinessDays;
    
    // For the last month, use the remaining value to ensure the total matches exactly
    if (processedMonths === totalMonths) {
      distribution[month] = remainingValue;
    } else {
      const monthValue = value * proportion;
      const roundedValue = roundWithSign(monthValue);
      distribution[month] = roundedValue;
      remainingValue -= roundedValue;
    }
  }
  
  return distribution;
}

/**
 * Helper function to get month index from month code
 * @param monthCode Three-letter month code (e.g., "Jan")
 * @returns Month index (0-11)
 */
function getMonthIndex(monthCode: string): number {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months.indexOf(monthCode);
}
```

### Step 2: Update Type Definitions

Update the PricingFormula type in `src/types/pricing.ts` to include monthly distribution:

```typescript
export interface MonthlyDistribution {
  [instrument: string]: {
    [monthCode: string]: number; // Month code format: "MMM-YY" (e.g., "Mar-24")
  };
}

export interface PricingFormula {
  tokens: FormulaToken[];
  exposures: ExposureResult;
  monthlyDistribution?: MonthlyDistribution; // Added this field
}
```

### Step 3: Create Monthly Distribution Generation Function

Add a function in `src/utils/formulaCalculation.ts` to generate the monthly distribution:

```typescript
/**
 * Calculate the monthly distribution of pricing exposure
 * @param formula The pricing formula
 * @param quantity Trade quantity
 * @param buySell Buy or sell direction
 * @param pricingPeriodStart Start of pricing period
 * @param pricingPeriodEnd End of pricing period
 * @returns Monthly distribution object
 */
export function calculateMonthlyPricingDistribution(
  formula: FormulaToken[],
  quantity: number,
  buySell: BuySell,
  pricingPeriodStart: Date,
  pricingPeriodEnd: Date
): MonthlyDistribution {
  // Get base pricing exposures
  const basePricingExposures = calculatePricingExposure(formula, quantity, buySell);
  
  // Get business days distribution by month
  const businessDaysByMonth = getBusinessDaysByMonth(pricingPeriodStart, pricingPeriodEnd);
  
  // Initialize result
  const monthlyDistribution: MonthlyDistribution = {};
  
  // For each instrument with non-zero exposure, distribute across months
  Object.entries(basePricingExposures).forEach(([instrument, totalExposure]) => {
    if (totalExposure === 0) return;
    
    monthlyDistribution[instrument] = distributeValueByBusinessDays(totalExposure, businessDaysByMonth);
  });
  
  return monthlyDistribution;
}
```

### Step 4: Update Physical Trade Form Component

Modify `src/components/trades/PhysicalTradeForm.tsx` to calculate and store monthly distribution:

1. Import the new function:
   ```typescript
   import { calculateMonthlyPricingDistribution } from '@/utils/formulaCalculation';
   ```

2. Update the formula change handler to calculate monthly distribution:
   ```typescript
   const handleFormulaChange = (formula: PricingFormula, legIndex: number) => {
     const newLegs = [...legs];
     
     // Store the formula
     newLegs[legIndex].formula = formula;
     
     // Calculate monthly distribution if we have valid pricing period dates
     if (newLegs[legIndex].pricingPeriodStart && newLegs[legIndex].pricingPeriodEnd) {
       const monthlyDistribution = calculateMonthlyPricingDistribution(
         formula.tokens,
         newLegs[legIndex].quantity || 0,
         newLegs[legIndex].buySell,
         newLegs[legIndex].pricingPeriodStart,
         newLegs[legIndex].pricingPeriodEnd
       );
       
       // Add monthly distribution to formula
       newLegs[legIndex].formula.monthlyDistribution = monthlyDistribution;
     }
     
     setLegs(newLegs);
   };
   ```

3. Also update the pricing period date change handlers to recalculate distribution:
   ```typescript
   const updateLeg = (index: number, field: keyof LegFormState, value: string | Date | number | PricingFormula | undefined) => {
     const newLegs = [...legs];
     
     // Set the field value
     if (field === 'formula' || field === 'mtmFormula') {
       (newLegs[index] as any)[field] = value as PricingFormula;
     } else if (
       field === 'loadingPeriodStart' || 
       field === 'loadingPeriodEnd' || 
       field === 'pricingPeriodStart' || 
       field === 'pricingPeriodEnd'
     ) {
       (newLegs[index] as any)[field] = value as Date;
       
       // If pricing period dates changed, recalculate monthly distribution
       if (field === 'pricingPeriodStart' || field === 'pricingPeriodEnd') {
         const leg = newLegs[index];
         
         if (leg.formula && leg.pricingPeriodStart && leg.pricingPeriodEnd) {
           const monthlyDistribution = calculateMonthlyPricingDistribution(
             leg.formula.tokens,
             leg.quantity || 0,
             leg.buySell,
             leg.pricingPeriodStart,
             leg.pricingPeriodEnd
           );
           
           // Update monthly distribution
           leg.formula = {
             ...leg.formula,
             monthlyDistribution
           };
         }
       }
     } else if (field === 'buySell') {
       (newLegs[index] as any)[field] = value as BuySell;
       
       // Recalculate monthly distribution when buySell changes
       const leg = newLegs[index];
       if (leg.formula && leg.pricingPeriodStart && leg.pricingPeriodEnd) {
         const monthlyDistribution = calculateMonthlyPricingDistribution(
           leg.formula.tokens,
           leg.quantity || 0,
           value as BuySell,
           leg.pricingPeriodStart,
           leg.pricingPeriodEnd
         );
         
         // Update monthly distribution
         leg.formula = {
           ...leg.formula,
           monthlyDistribution
         };
       }
     } else if (field === 'quantity') {
       (newLegs[index] as any)[field] = Number(value);
       
       // Recalculate monthly distribution when quantity changes
       const leg = newLegs[index];
       if (leg.formula && leg.pricingPeriodStart && leg.pricingPeriodEnd) {
         const monthlyDistribution = calculateMonthlyPricingDistribution(
           leg.formula.tokens,
           Number(value) || 0,
           leg.buySell,
           leg.pricingPeriodStart,
           leg.pricingPeriodEnd
         );
         
         // Update monthly distribution
         leg.formula = {
           ...leg.formula,
           monthlyDistribution
         };
       }
     } else {
       (newLegs[index] as any)[field] = value;
     }
     
     setLegs(newLegs);
   };
   ```

### Step 5: Update Exposure Page to Use Monthly Distribution Data

Modify the exposure calculation in `src/pages/risk/ExposurePage.tsx` to use the pre-calculated monthly distribution:

```typescript
// Helper function to get the month code for a trade leg
const getMonthCodeForTrade = (trade: PhysicalTrade | PhysicalTradeLeg): string => {
  const date = trade.loadingPeriodStart;
  return formatMonthCode(date);
};

// Process physical trades for exposure calculation
const processPhysicalTrades = (trades: PhysicalTrade[], selectedPeriod: string): ExposureData => {
  const exposureData: ExposureData = initializeExposureData();
  
  trades.forEach((trade) => {
    trade.legs.forEach((leg) => {
      // Process physical exposure - based on loading period start date
      const loadingMonthCode = getMonthCodeForTrade(leg);
      
      if (loadingMonthCode === selectedPeriod) {
        const physicalExposure = leg.formula?.exposures?.physical || {};
        
        // Add physical exposure to the selected period
        Object.entries(physicalExposure).forEach(([product, amount]) => {
          if (amount !== 0) {
            exposureData.physical[product] = (exposureData.physical[product] || 0) + amount;
          }
        });
      }
      
      // Process pricing exposure - use monthly distribution if available
      if (leg.formula?.monthlyDistribution) {
        // Use pre-calculated monthly distribution
        Object.entries(leg.formula.monthlyDistribution).forEach(([instrument, monthlyValues]) => {
          if (monthlyValues[selectedPeriod]) {
            exposureData.pricing[instrument] = (exposureData.pricing[instrument] || 0) + monthlyValues[selectedPeriod];
          }
        });
      } else {
        // Fallback to old method if monthly distribution is not available
        const pricingMonthCode = getMonthCodeForTrade(leg);
        
        if (pricingMonthCode === selectedPeriod) {
          const pricingExposure = leg.formula?.exposures?.pricing || {};
          
          Object.entries(pricingExposure).forEach(([product, amount]) => {
            if (amount !== 0) {
              exposureData.pricing[product] = (exposureData.pricing[product] || 0) + amount;
            }
          });
        }
      }
    });
  });
  
  return exposureData;
};
```

### Step 6: Update Formula Builder Component

Add code in `src/components/trades/FormulaBuilder.tsx` to display monthly distribution information:

```typescript
// Add to FormulaBuilder component props
interface FormulaBuilderProps {
  // ... existing props
  showMonthlyDistribution?: boolean;
}

// Inside component
const FormulaBuilder: React.FC<FormulaBuilderProps> = ({
  // ... existing props
  showMonthlyDistribution = false
}) => {
  // ... existing code
  
  const renderMonthlyDistribution = () => {
    if (!showMonthlyDistribution || !value.monthlyDistribution) {
      return null;
    }
    
    return (
      <div className="mt-4 space-y-2">
        <Label className="text-base font-medium">Monthly Pricing Distribution</Label>
        {Object.entries(value.monthlyDistribution).map(([instrument, monthData]) => (
          <div key={instrument} className="space-y-1">
            <div className="text-sm font-medium">{instrument}</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(monthData).map(([month, exposure]) => (
                <Badge 
                  key={`${instrument}-${month}`} 
                  variant="outline" 
                  className={`text-sm py-1 px-3 ${getExposureColorClass(exposure)}`}
                >
                  {month}: {formatExposure(exposure)} MT
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Add to return JSX
  return (
    <div className="space-y-4">
      {/* ... existing code */}
      
      {renderMonthlyDistribution()}
    </div>
  );
};
```

## Testing Plan

1. **Unit Tests**
   - Test the new business day calculation utilities
   - Test the distribution calculation with various date ranges
   - Test the rounding with sign preservation

2. **Integration Tests**
   - Create trades with pricing periods spanning multiple months
   - Verify that physical exposure is assigned to the month of loading start date
   - Verify that pricing exposure is distributed across months based on business days
   - Check rounding behavior and ensure total exposure matches before/after distribution

3. **Edge Cases**
   - Test when pricing period has no business days
   - Test when pricing period spans many months
   - Test with very small quantities where rounding could cause issues
   - Test when pricing period start/end dates are on weekends

## Implementation Verification Checklist

- [ ] Business day calculation functions are accurate
- [ ] Monthly distribution is calculated correctly
- [ ] Types are properly updated and used
- [ ] Physical trade form updates distribution when required fields change
- [ ] Exposure page correctly uses the monthly distribution data
- [ ] Formula builder displays the monthly distribution for debugging
- [ ] All edge cases have been addressed
- [ ] Performance remains acceptable

## Example Trade Scenario

1. **Trade Details**:
   - Buy 1000 MT of UCOME
   - Loading period: March 28, 2024
   - Pricing period: March 20, 2024 - April 15, 2024
   - Pricing formula: Platts Diesel + 500
   - MTM formula: Argus UCOME

2. **Business Days Analysis**:
   - March 2024: 8 business days (March 20-29, excluding weekends)
   - April 2024: 14 business days (April 1-15, excluding weekends)
   - Total: 22 business days

3. **Expected Monthly Distribution**:
   - Physical exposure:
     - Mar-24: +1000 MT UCOME (based on loading date)
   - Pricing exposure:
     - Mar-24: -364 MT Diesel (8/22 * -1000, rounded)
     - Apr-24: -636 MT Diesel (14/22 * -1000, rounded)

4. **Verification**:
   - Total physical exposure remains 1000 MT
   - Total pricing exposure remains -1000 MT
   - Physical exposure is in loading month only
   - Pricing exposure is distributed based on business days
