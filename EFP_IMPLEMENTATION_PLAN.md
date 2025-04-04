# EFP (Exchange for Physical) Implementation Plan

This document outlines the implementation plan for adding ICE GASOIL FUTURES (EFP) pricing functionality to the trading platform. This feature allows for specific pricing and exposure handling for trades using EFP pricing mechanisms.

## IMPORTANT CONSTRAINTS

- **PAPER TRADES ARE UNAFFECTED** - All changes affect only physical trades
- **NO OTHER FUNCTIONALITY TO BE BROKEN**
- **DO NOT MAKE ANY OTHER CHANGES TO THE UI OR LAYOUT** beyond what is specified in this document

## 1. Database Schema Updates

### Table: `pricing_instruments`
- Insert 'ICE GASOIL FUTURES (EFP)' as a new pricing instrument
- Ensure it's marked as `is_active = true`
- Set appropriate category as 'Futures'

```sql
-- Add ICE GASOIL FUTURES (EFP) to pricing instruments
INSERT INTO public.pricing_instruments 
(instrument_code, display_name, category, is_active)
VALUES 
('ICE_GASOIL_EFP', 'ICE GASOIL FUTURES (EFP)', 'Futures', true);
```

### Table: `trade_legs`
- Add the following columns:
  - `efp_premium`: NUMERIC, nullable - Premium over/under the Gasoil future
  - `efp_agreed_status`: BOOLEAN, nullable, default: false - Whether the EFP has been agreed/fixed
  - `efp_fixed_value`: NUMERIC, nullable - Fixed value component once agreed
  - `efp_designated_month`: TEXT, nullable - Single month (e.g., "Mar-24") for the exposure before agreement

```sql
-- Add EFP columns to trade_legs table
ALTER TABLE public.trade_legs
ADD COLUMN efp_premium NUMERIC,
ADD COLUMN efp_agreed_status BOOLEAN DEFAULT false,
ADD COLUMN efp_fixed_value NUMERIC,
ADD COLUMN efp_designated_month TEXT;
```

## 2. Type Definition Updates

### Update `src/types/physical.ts`
- Modify `PhysicalTradeLeg` interface:
  ```typescript
  export interface PhysicalTradeLeg {
    // ... existing fields
    efpPremium?: number;
    efpAgreedStatus?: boolean;
    efpFixedValue?: number;
    efpDesignatedMonth?: string;
  }
  ```

### Update `src/types/pricing.ts`
- No changes needed as EFP will use existing structures
- When EFP is selected, the standard formula tokens will not be used

## 3. Trade Entry Form Updates (PhysicalTradeForm.tsx)

### Pricing Type Selection
- Add a new dropdown "Pricing Type" with options:
  - "Standard Formula" (default)
  - "ICE Gasoil EFP"

### Conditional EFP Form Fields
- When "ICE Gasoil EFP" is selected, show:
  - EFP Premium input field (numeric)
  - EFP Agreed Status checkbox/toggle
  - EFP Fixed Value input (numeric, enabled only when EFP Agreed Status is true)
  - EFP Designated Month dropdown (required when EFP Agreed Status is false)

### Tab Changes
- Keep the existing tabs structure with three tabs:
  - Price Formula (disabled/greyed out when EFP is selected)
  - EFP Pricing (new tab, only active when EFP is selected)
  - MTM Formula (always available)

### Form State Management
- Update `LegFormState` interface to include EFP fields
- Add state management for EFP fields and pricing type
- Modify submission logic to include EFP fields

```typescript
// Add to LegFormState interface
interface LegFormState {
  // ... existing fields
  pricingType: "standard" | "efp";
  efpPremium: number | null;
  efpAgreedStatus: boolean;
  efpFixedValue: number | null;
  efpDesignatedMonth: string;
}

// EFP Form component (simplified)
const EFPPricingForm = ({ 
  values, 
  onChange 
}: { 
  values: LegFormState; 
  onChange: (field: string, value: any) => void;
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="efpPremium">EFP Premium</Label>
          <Input
            id="efpPremium"
            type="number"
            value={values.efpPremium || ""}
            onChange={(e) => onChange("efpPremium", e.target.value ? Number(e.target.value) : null)}
          />
        </div>
        
        <div className="flex items-center space-x-2 pt-6">
          <Switch
            id="efpAgreedStatus"
            checked={values.efpAgreedStatus}
            onCheckedChange={(checked) => onChange("efpAgreedStatus", checked)}
          />
          <Label htmlFor="efpAgreedStatus">EFP Agreed/Fixed</Label>
        </div>
        
        {values.efpAgreedStatus ? (
          <div>
            <Label htmlFor="efpFixedValue">Fixed Value</Label>
            <Input
              id="efpFixedValue"
              type="number"
              value={values.efpFixedValue || ""}
              onChange={(e) => onChange("efpFixedValue", e.target.value ? Number(e.target.value) : null)}
            />
          </div>
        ) : (
          <div>
            <Label htmlFor="efpDesignatedMonth">Designated Month</Label>
            <Select
              value={values.efpDesignatedMonth}
              onValueChange={(value) => onChange("efpDesignatedMonth", value)}
            >
              <SelectTrigger id="efpDesignatedMonth">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map((month) => (
                  <SelectItem key={month} value={month}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
};
```

## 4. Price & MTM Calculation Logic Updates

### New Utility Function
- Create `fetchPreviousDayPrice(instrument: Instrument): Promise<{ price: number, date: Date } | null>`
  - Query `historical_prices` for most recent price before today for the given instrument
  - Handle case when no previous price exists

```typescript
// Add to src/utils/priceCalculationUtils.ts
export async function fetchPreviousDayPrice(
  instrument: string
): Promise<{ price: number; date: Date } | null> {
  // Get instrument ID first
  const { data: instrumentData, error: instrumentError } = await supabase
    .from('pricing_instruments')
    .select('id')
    .eq('instrument_code', instrument)
    .single();

  if (instrumentError || !instrumentData) {
    console.error('Error fetching instrument:', instrumentError);
    return null;
  }

  // Now get the most recent price
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of day
  
  const { data, error } = await supabase
    .from('historical_prices')
    .select('price, price_date')
    .eq('instrument_id', instrumentData.id)
    .lt('price_date', today.toISOString().split('T')[0])
    .order('price_date', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    console.error('Error fetching historical price:', error);
    return null;
  }

  return {
    price: data.price,
    date: new Date(data.price_date)
  };
}
```

### Modify MTM Price Calculation
- Update `calculateMTMPrice`:
  - Add logic for EFP legs:
    - If `efpAgreedStatus` is false: MTM price = previous day's Gasoil price + premium
    - If `efpAgreedStatus` is true: MTM price = efpFixedValue + premium
  - Continue using standard formula evaluation for non-EFP legs
  - Ensure proper display of components in price details

```typescript
// Update calculateMTMPrice in priceCalculationUtils.ts
export const calculateMTMPrice = async (
  leg: PhysicalTradeLeg,
  currentPrices: Record<string, number>
): Promise<{ price: number; details: MTMPriceDetail }> => {
  // Check if this is an EFP leg
  if (leg.efpPremium !== undefined) {
    const details: MTMPriceDetail = {
      instruments: {},
      evaluatedPrice: 0,
      fixedComponents: []
    };
    
    // Handle EFP pricing
    if (leg.efpAgreedStatus) {
      // For agreed EFP, use fixed value + premium
      if (leg.efpFixedValue !== undefined) {
        details.evaluatedPrice = leg.efpFixedValue + leg.efpPremium;
        details.fixedComponents = [
          { value: leg.efpFixedValue, displayValue: `EFP Fixed: ${leg.efpFixedValue}` },
          { value: leg.efpPremium, displayValue: `Premium: ${leg.efpPremium}` }
        ];
      } else {
        // Missing fixed value
        details.evaluatedPrice = leg.efpPremium || 0;
        details.fixedComponents = [
          { value: leg.efpPremium || 0, displayValue: `Premium: ${leg.efpPremium}` }
        ];
      }
    } else {
      // For unagreed EFP, use previous day's price + premium
      const gasoilPrice = await fetchPreviousDayPrice('ICE_GASOIL');
      
      if (gasoilPrice) {
        details.instruments['ICE GASOIL FUTURES'] = {
          price: gasoilPrice.price,
          date: gasoilPrice.date
        };
        
        details.evaluatedPrice = gasoilPrice.price + (leg.efpPremium || 0);
        details.fixedComponents = [
          { value: leg.efpPremium || 0, displayValue: `Premium: ${leg.efpPremium}` }
        ];
      } else {
        // No price available
        details.evaluatedPrice = leg.efpPremium || 0;
        details.fixedComponents = [
          { value: leg.efpPremium || 0, displayValue: `Premium: ${leg.efpPremium}` }
        ];
      }
    }
    
    return { price: details.evaluatedPrice, details };
  }
  
  // Original formula evaluation logic for non-EFP legs
  let formulaResult: { price: number; details: MTMPriceDetail } | null = null;

  if (leg.formula) {
    try {
      formulaResult = await evaluateFormula(leg.formula, currentPrices);
    } catch (error) {
      console.error("Error evaluating formula:", error);
      return { price: 0, details: { instruments: {}, evaluatedPrice: 0, fixedComponents: [] } };
    }
  }

  if (!formulaResult) {
    return { price: 0, details: { instruments: {}, evaluatedPrice: 0, fixedComponents: [] } };
  }

  return formulaResult;
};
```

## 5. Exposure Calculation & Display Updates

### Exposure Aggregation Logic
- Modify exposure calculation to handle EFP legs:
  - For unagreed EFP legs (efpAgreedStatus=false):
    - Place exposure in 'ICE GASOIL FUTURES (EFP)' column
    - Use designated month (not prorated)
  - For agreed EFP legs (efpAgreedStatus=true):
    - Place exposure in standard 'ICE GASOIL FUTURES' column
    - Use designated month (not prorated)

```typescript
// Update exposure calculation in exposure utility function
export const calculateTradeExposures = (trades: PhysicalTrade[]): ExposureResult => {
  // Initialize monthly accumulators
  const monthlyPhysical: MonthlyProductVolume = {};
  const monthlyPricing: MonthlyProductVolume = {};
  
  // Default month for cases where it's missing
  const defaultMonth = 'Dec-24';
  
  for (const trade of trades) {
    for (const leg of trade.legs || []) {
      const volume = leg.quantity * (leg.tolerance ? (1 + leg.tolerance / 100) : 1);
      const direction = leg.buySell === 'buy' ? 1 : -1;
      
      // Handle EFP exposures specifically
      if (leg.efpPremium !== undefined) {
        const month = leg.efpDesignatedMonth || defaultMonth;
        
        // Physical side - always goes to physical column
        if (!monthlyPhysical[month]) monthlyPhysical[month] = {};
        const productKey = mapProductToCanonical(leg.product);
        if (!monthlyPhysical[month][productKey]) monthlyPhysical[month][productKey] = 0;
        monthlyPhysical[month][productKey] += volume * (leg.buySell === 'buy' ? 1 : -1);
        
        // Pricing side - depends on agreed status
        if (!monthlyPricing[month]) monthlyPricing[month] = {};
        
        if (leg.efpAgreedStatus) {
          // Agreed EFP - use standard ICE GASOIL FUTURES column
          const pricingKey = 'ICE GASOIL FUTURES';
          if (!monthlyPricing[month][pricingKey]) monthlyPricing[month][pricingKey] = 0;
          monthlyPricing[month][pricingKey] += volume * (leg.buySell === 'buy' ? -1 : 1);
        } else {
          // Unagreed EFP - use dedicated EFP column
          const efpKey = 'ICE GASOIL FUTURES (EFP)';
          if (!monthlyPricing[month][efpKey]) monthlyPricing[month][efpKey] = 0;
          monthlyPricing[month][efpKey] += volume * (leg.buySell === 'buy' ? -1 : 1);
        }
      } else {
        // Regular legs
        const month = leg.pricingPeriodStart?.toLocaleDateString('default', { month: 'short', year: '2-digit' }) || defaultMonth;
        
        // Physical side
        if (!monthlyPhysical[month]) monthlyPhysical[month] = {};
        const productKey = mapProductToCanonical(leg.product);
        if (!monthlyPhysical[month][productKey]) monthlyPhysical[month][productKey] = 0;
        monthlyPhysical[month][productKey] += volume * (leg.buySell === 'buy' ? 1 : -1);
        
        // Pricing side
        if (!monthlyPricing[month]) monthlyPricing[month] = {};
        
        if (leg.formula) {
          const instruments = extractInstrumentsFromFormula(leg.formula);
          
          instruments.forEach(instrument => {
            if (!monthlyPricing[month][instrument]) {
              monthlyPricing[month][instrument] = 0;
            }
            monthlyPricing[month][instrument] += volume * (leg.buySell === 'buy' ? -1 : 1);
          });
        }
      }
    }
  }
  
  return {
    monthlyPhysical,
    monthlyPricing
  };
};
```

### Exposure Table Updates
[This section intentionally left blank]

## 6. Testing

After implementation, monitor:
- Performance of exposure calculations with EFP trades
- User feedback on the EFP entry process
- Any unexpected behavior in MTM or pricing calculations

## Conclusion

This implementation plan provides a comprehensive approach to adding EFP functionality to the trading platform, specifically for physical trades. By following this plan, we'll ensure that the feature is properly integrated without disrupting existing functionality.

### IMPORTANT CLARIFICATION ON EXPOSURE TABLE COLUMNS

The exposure table will have **TWO** separate columns related to EFP:

1. **ICE GASOIL FUTURES** - Regular GASOIL futures column (already exists)
2. **ICE GASOIL FUTURES (EFP)** - New column specifically for unagreed EFP trades

This distinction is critical to understand - when an EFP trade is agreed/fixed, its exposure moves from the EFP column to the regular GASOIL column.

The exact column ordering in the Exposure Table is:
```
[Month] | [Physical Products...] | [Total Physical] | [LSGO] | [DIESEL] | [GASOIL] | [GASOIL (EFP)] | [Total Pricing] | [Net]
```

The EFP column must be positioned exactly between the regular GASOIL column and the "Total pricing instrument" column.
