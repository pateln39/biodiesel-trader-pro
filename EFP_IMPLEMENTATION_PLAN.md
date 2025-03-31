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

### Table: `trade_legs`
- Add the following columns:
  - `efp_premium`: NUMERIC, nullable - Premium over/under the Gasoil future
  - `efp_agreed_status`: BOOLEAN, nullable, default: false - Whether the EFP has been agreed/fixed
  - `efp_fixed_value`: NUMERIC, nullable - Fixed value component once agreed
  - `efp_designated_month`: TEXT, nullable - Single month (e.g., "Mar-24") for the exposure before agreement

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

## 4. Price & MTM Calculation Logic Updates

### New Utility Function
- Create `fetchPreviousDayPrice(instrument: Instrument): Promise<{ price: number, date: Date } | null>`
  - Query `historical_prices` for most recent price before today for the given instrument
  - Handle case when no previous price exists

### Modify MTM Price Calculation
- Update `calculateMTMPrice`:
  - Add logic for EFP legs:
    - If `efpAgreedStatus` is false: MTM price = previous day's Gasoil price + premium
    - If `efpAgreedStatus` is true: MTM price = efpFixedValue + premium
  - Continue using standard formula evaluation for non-EFP legs
  - Ensure proper display of components in price details

## 5. Exposure Calculation & Display Updates

### Exposure Aggregation Logic
- Modify exposure calculation to handle EFP legs:
  - For unagreed EFP legs (efpAgreedStatus=false):
    - Place exposure in 'ICE GASOIL FUTURES (EFP)' column
    - Use designated month (not prorated)
  - For agreed EFP legs (efpAgreedStatus=true):
    - Place exposure in standard 'ICE GASOIL FUTURES' column
    - Use designated month (not prorated)

### Exposure Table Updates
- Add 'ICE GASOIL FUTURES (EFP)' as a new column under "Pricing" category
- Place this column next to LSGO (on right) and to left of 'Total pricing instrument'
- Update totals calculation to include EFP column in both "Total pricing instrument" and overall "Total row"

## 6. Testing

### Unit Testing
- Test `fetchPreviousDayPrice` function
- Test MTM calculation for both agreed/unagreed EFP states
- Test exposure aggregation with EFP legs

### Integration Testing
- Test PhysicalTradeForm submission with EFP details
- Test ExposurePage rendering with EFP trades in both states
- Verify totals calculation includes EFP values correctly

### Manual Testing
- Create physical trades using EFP pricing
- Verify MTM calculations before and after agreement
- Check Exposure table display for EFP legs (both states)
- Ensure standard formula trades continue to work correctly
- Verify that no existing functionality is broken

## Implementation Sequence

1. Database schema updates
2. Type definition updates
3. Price calculation utility function development
4. PhysicalTradeForm updates
5. MTM calculation logic updates
6. Exposure calculation and display updates
7. Testing
8. Documentation and deployment

## Monitoring & Follow-up

After implementation, monitor:
- Performance of exposure calculations with EFP trades
- User feedback on the EFP entry process
- Any unexpected behavior in MTM or pricing calculations

## Conclusion

This implementation plan provides a comprehensive approach to adding EFP functionality to the trading platform, specifically for physical trades. By following this plan, we'll ensure that the feature is properly integrated without disrupting existing functionality.
