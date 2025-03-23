
# Component Cleanup Instructions

After successfully migrating all components to their proper module locations according to the system architecture, the following files should be deleted to avoid duplication:

## Trade Components to Delete
- [ ] `src/components/trades/PaperTradeForm.tsx`
- [ ] `src/components/trades/PhysicalTradeForm.tsx`
- [ ] `src/components/trades/FormulaBuilder.tsx`
- [ ] `src/components/trades/PaperTradeTable.tsx`

## Pricing Components to Delete
- [ ] `src/components/pricing/PriceDetails.tsx`
- [ ] `src/components/pricing/PriceUploader.tsx`
- [ ] `src/components/pricing/PricingInstruments.tsx`
- [ ] `src/components/pricing/historical/*` (entire folder)

## Core Components to Delete
- [ ] `src/components/DashboardCard.tsx`
- [ ] `src/components/Layout.tsx`

## Note
Only delete these files after confirming that all components have been successfully migrated and the application works correctly with the new component locations.
