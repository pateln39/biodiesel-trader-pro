
# Paper and Physical Trade Separation: Implementation Plan

This document outlines the comprehensive plan for separating paper and physical trades into distinct database structures and code paths. This separation will resolve UI freezing issues, improve maintainability, and create a more robust trading system.

## 1. Current State Analysis

### Database Structure
- Single `parent_trades` table with a `trade_type` field distinguishing paper vs physical
- Single `trade_legs` table storing both paper and physical trade legs with different field requirements
- Shared fields causing confusion and potential errors
- Navigation freezing during deletion operations

### Code Structure
- Shared type definitions in `types/trade.ts`
- Separate hooks but with overlap: `useTrades.ts` and `usePaperTrades.ts`
- Common utility functions in `tradeDeleteUtils.ts`
- Complex UI component handling both trade types

## 2. Proposed Database Changes

### A. Create Dedicated Tables
```sql
-- Create paper_trades table
CREATE TABLE public.paper_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_reference TEXT NOT NULL,
  counterparty TEXT NOT NULL,
  comment TEXT,
  broker TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create paper_trade_legs table
CREATE TABLE public.paper_trade_legs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_trade_id UUID NOT NULL REFERENCES paper_trades(id) ON DELETE CASCADE,
  leg_reference TEXT NOT NULL,
  buy_sell TEXT NOT NULL,
  product TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  period TEXT NOT NULL,
  price NUMERIC NOT NULL,
  broker TEXT,
  relationship_type TEXT NOT NULL,
  instrument TEXT,
  formula JSONB,
  mtm_formula JSONB,
  right_side_product TEXT,
  right_side_quantity NUMERIC,
  right_side_period TEXT,
  right_side_price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Rename existing tables for clarity
ALTER TABLE parent_trades RENAME TO physical_trades;
ALTER TABLE trade_legs RENAME TO physical_trade_legs;
```

### B. Data Migration Strategy
1. Copy existing paper trades from `parent_trades` to `paper_trades`
2. Copy existing paper trade legs from `trade_legs` to `paper_trade_legs`
3. Delete paper trades from original tables after successful migration
4. Add appropriate indexes for performance

### C. Schema Validation Plan
- Verify all paper trades migrated correctly
- Verify all relationships maintained
- Ensure no data loss before removing from original tables

## 3. Code Refactoring Plan

### A. Type Definitions
- Create separate type files:
  - `src/types/paperTrade.ts` for paper trade types
  - `src/types/physicalTrade.ts` for physical trade types
  - Keep `src/types/trade.ts` for common types and re-exports

### B. Utility Files Separation
- Split `tradeDeleteUtils.ts` into:
  - `paperTradeDeleteUtils.ts`
  - `physicalTradeDeleteUtils.ts`
- Each utility file will handle deletion operations for a specific trade type

### C. React Query Hooks Refactoring
- Enhance separation between:
  - `usePaperTrades.ts` - complete standalone hook for paper trades
  - `usePhysicalTrades.ts` - rename from useTrades.ts, focus only on physical
- Remove any remaining shared code

### D. UI Components
- Split trade tables into dedicated components:
  - `PaperTradeTable.tsx` - already exists but needs refinement
  - `PhysicalTradeTable.tsx` - new component for physical trades
- Update TradesPage.tsx to use these specific components
- Implement dedicated deletion flows for each trade type

## 4. Implementation Strategy

### Phase 1: Database Preparation (No Structural Changes)
- Create SQL migration scripts
- Test scripts in development environment
- Plan rollback strategy

### Phase 2: Data Migration
- Execute data migration with validation
- Verify data integrity
- Keep original data until verification complete

### Phase 3: Code Refactoring
- Implement type definition changes
- Refactor utility functions
- Update React Query hooks
- Implement UI component changes

### Phase 4: Testing and Validation
- Test all trade operations for both types
- Verify performance improvements
- Ensure no regression in functionality

### Phase 5: Cleanup
- Remove redundant code
- Remove original data after extended verification
- Update documentation

## 5. Validation and Testing Plan

1. **Unit Tests**
   - Test individual components
   - Verify utility functions

2. **Integration Tests**
   - Test complete trade workflows
   - Verify database operations

3. **Performance Testing**
   - Measure UI responsiveness
   - Benchmark database queries

4. **Regression Testing**
   - Verify all existing functionality works
   - Test all edge cases

## 6. Risk Analysis and Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Data loss during migration | Low | High | Take backups, validate data before removing old records |
| Functional regression | Medium | High | Comprehensive testing, feature parity verification |
| Performance issues | Low | Medium | Performance testing before deployment |
| API compatibility issues | Medium | Medium | Maintain backward compatibility where possible |
| UI freezing persists | Low | High | Monitor performance metrics, implement optimistic UI updates |

## 7. Benefits of Separation

1. **Performance Improvements**
   - Reduced table size improves query performance
   - Simpler code paths reduce UI freezing
   - More efficient deletion operations

2. **Code Maintainability**
   - Clear separation of concerns
   - Reduced complexity in components
   - Easier to understand code paths

3. **Future Development**
   - Easier to extend each trade type independently
   - Clearer API boundaries
   - Reduced risk of unintended side effects

## 8. Future Enhancements

1. **Improved Trade Type Specific Features**
   - Custom fields for each trade type
   - Specialized validation rules
   - Type-specific UI enhancements

2. **Performance Optimizations**
   - Dedicated indexes for each table
   - Trade type specific caching strategies
   - Pagination improvements

3. **User Experience**
   - More responsive UI
   - Better error handling
   - Improved deletion flows

## 9. Timeline and Milestones

1. **Database Migration Script Preparation**: 1 day
2. **Data Migration Execution**: 1 day
3. **Code Refactoring**: 2-3 days
4. **Testing and Validation**: 1-2 days
5. **Deployment and Monitoring**: 1 day

**Total Estimated Time**: 6-8 days

## 10. Conclusion

This separation of paper and physical trades into distinct database tables and code paths will significantly improve the application's performance, maintainability, and user experience. The planned approach ensures minimal disruption while delivering substantial benefits.

**Important Note**: Throughout this entire process, we will maintain existing functionality while improving the underlying architecture.
