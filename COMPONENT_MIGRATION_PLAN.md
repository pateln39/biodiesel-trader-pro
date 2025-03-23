
# Component Migration Plan

This plan outlines how to migrate components to follow the system architecture as defined in the system-architecture.md document. The goal is to move components to their proper module locations for better organization and maintainability.

## Migration Strategy

1. Move UI components to correct locations based on domain
2. Update import paths in all affected files
3. Ensure exports are properly set up in index.ts files
4. Test after each major component group migration

## Migration Tasks

### 1. Trade Module Components

- [x] Move `src/components/trades/PaperTradeForm.tsx` to `src/modules/trade/components/PaperTradeForm.tsx`
- [x] Move `src/components/trades/PhysicalTradeForm.tsx` to `src/modules/trade/components/PhysicalTradeForm.tsx`
- [x] Move `src/components/trades/FormulaBuilder.tsx` to `src/modules/trade/components/FormulaBuilder.tsx`
- [x] Move `src/components/trades/PaperTradeTable.tsx` to `src/modules/trade/components/PaperTradeTable.tsx`
- [x] Update `src/modules/trade/components/index.ts` to export all trade components

### 2. Pricing Module Components

- [x] Move `src/components/pricing/PriceDetails.tsx` to `src/modules/pricing/components/PriceDetails.tsx`
- [x] Move `src/components/pricing/PriceUploader.tsx` to `src/modules/pricing/components/PriceUploader.tsx`
- [x] Move `src/components/pricing/PricingInstruments.tsx` to `src/modules/pricing/components/PricingInstruments.tsx`
- [x] Move `src/components/pricing/historical` folder to `src/modules/pricing/components/historical`
- [x] Create/update `src/modules/pricing/components/index.ts` to export all pricing components

### 3. Core Components

- [x] Move `src/components/DashboardCard.tsx` to `src/core/components/DashboardCard.tsx`
- [x] Move `src/components/Layout.tsx` to `src/core/components/Layout.tsx`
- [x] Update `src/core/components/index.ts` to export all core components

### 4. Update Imports

- [x] Update imports in all files that reference the moved components
- [x] Fix any broken imports or references
- [x] Update any module index files to ensure correct exports

### 5. Testing

- [ ] Test application to ensure all components render correctly
- [ ] Fix any errors or issues that arise from the migration
- [ ] Verify that all features work as expected

## Implementation Notes

- Keep all component functionality exactly the same
- Only update import paths and component locations
- Maintain the same props and interfaces
- Ensure backward compatibility where needed
