
# CTRM System Implementation Plan

This document outlines the step-by-step implementation plan for transforming the current CTRM system into a modular monolith architecture. Each step includes specific tasks that can be checked off as they are completed.

## Phase 1: Database Schema Updates

### 1.1 Operations Module Schema
- [ ] Create `movements` table
  - [ ] Define columns (movement_reference, trade_leg_id, status, etc.)
  - [ ] Set up relationships to trade_legs
  - [ ] Add constraints and indexes

### 1.2 Finance Module Schema
- [ ] Create `invoices` table
  - [ ] Define columns (invoice_reference, movement_id, amount, etc.)
  - [ ] Set up relationships to movements
  - [ ] Add constraints and indexes
- [ ] Create `payments` table
  - [ ] Define columns (payment_reference, invoice_id, amount, etc.)
  - [ ] Set up relationships to invoices
  - [ ] Add constraints and indexes

### 1.3 Audit and Tracking Schema
- [ ] Create `audit_logs` table
  - [ ] Define columns (table_name, record_id, operation, etc.)
  - [ ] Add indexes for efficient querying
- [ ] Create database triggers for audit logging
  - [ ] Insert triggers
  - [ ] Update triggers
  - [ ] Delete triggers

### 1.4 Enhancement of Existing Tables
- [ ] Extend `counterparties` table
  - [ ] Add VAT number field
  - [ ] Add bank details (JSONB)
  - [ ] Add contact details (JSONB)
- [ ] Add any missing fields to `trade_legs`
- [ ] Add any missing fields to `parent_trades`

## Phase 2: Core Infrastructure

### 2.1 Project Structure Reorganization
- [ ] Create module folders
  - [ ] `/src/modules/trade`
  - [ ] `/src/modules/operations`
  - [ ] `/src/modules/finance`
  - [ ] `/src/modules/reporting`
  - [ ] `/src/modules/admin`
- [ ] Create core folder structure
  - [ ] `/src/core/api`
  - [ ] `/src/core/components`
  - [ ] `/src/core/hooks`
  - [ ] `/src/core/utils`
  - [ ] `/src/core/types`

### 2.2 API Infrastructure
- [ ] Create enhanced Supabase client wrapper
  - [ ] Add error handling
  - [ ] Add request/response logging
  - [ ] Add retry logic
- [ ] Set up React Query client configuration
  - [ ] Configure default options
  - [ ] Set up global error handling
- [ ] Create base API service classes/functions

### 2.3 UI Component Infrastructure
- [ ] Create layout components
  - [ ] AppLayout
  - [ ] DashboardLayout
  - [ ] FormLayout
  - [ ] ReportLayout
- [ ] Develop shared form components
  - [ ] Enhanced form controls
  - [ ] Validation components
  - [ ] Error display components
- [ ] Create shared table/data display components

### 2.4 Route Structure
- [ ] Reorganize routes by module
- [ ] Implement route protection (if needed)
- [ ] Set up layout-based routing

## Phase 3: Trade Module Implementation

### 3.1 Trade Module Services
- [ ] Create `tradeService.ts`
  - [ ] Implement CRUD operations for trades
  - [ ] Add filtering and sorting capabilities
- [ ] Create `formulaService.ts`
  - [ ] Implement formula creation functionality
  - [ ] Add formula evaluation functionality

### 3.2 Trade Module Components
- [ ] Create/refactor Physical Trade form components
  - [ ] Split into smaller, focused components
  - [ ] Improve validation
- [ ] Create/refactor Paper Trade form components
  - [ ] Split into smaller, focused components
  - [ ] Improve validation
- [ ] Create/refactor Trade list components
  - [ ] Add improved filtering
  - [ ] Add improved sorting

### 3.3 Trade Module Hooks
- [ ] Refactor data fetching hooks
  - [ ] Optimize React Query usage
  - [ ] Add proper error handling
  - [ ] Implement optimistic updates

## Phase 4: Operations Module Implementation

### 4.1 Operations Module Services
- [ ] Create `movementService.ts`
  - [ ] Implement CRUD operations for movements
  - [ ] Add validation functions
- [ ] Create `schedulingService.ts`
  - [ ] Implement scheduling logic
  - [ ] Add validation against open quantity

### 4.2 Operations Module Components
- [ ] Create Movement form components
  - [ ] Nomination form
  - [ ] Actualization form
- [ ] Create Movement list components
  - [ ] Scheduled movements view
  - [ ] Movement calendar view
- [ ] Create Movement detail components

### 4.3 Operations Module Hooks
- [ ] Create data fetching hooks
  - [ ] useMovements hook
  - [ ] useMovementDetails hook
  - [ ] useScheduling hook

## Phase 5: Finance Module Implementation

### 5.1 Finance Module Services
- [ ] Create `invoiceService.ts`
  - [ ] Implement invoice generation functions
  - [ ] Add invoice calculation functions
- [ ] Create `paymentService.ts`
  - [ ] Implement payment tracking functions
  - [ ] Add balance calculation functions

### 5.2 Finance Module Components
- [ ] Create Invoice components
  - [ ] Invoice generation form
  - [ ] Invoice detail view
- [ ] Create Payment components
  - [ ] Payment entry form
  - [ ] Payment tracking view
- [ ] Create Financial dashboard components

### 5.3 Finance Module Hooks
- [ ] Create data fetching hooks
  - [ ] useInvoices hook
  - [ ] usePayments hook
  - [ ] useFinancialStatus hook

## Phase 6: Reporting Module Implementation

### 6.1 Reporting Module Services
- [ ] Create `exposureService.ts`
  - [ ] Implement exposure calculation functions
  - [ ] Add aggregation functions
- [ ] Create `mtmService.ts`
  - [ ] Implement MTM calculation functions
  - [ ] Add historical tracking functions

### 6.2 Reporting Module Components
- [ ] Create Exposure reporting components
  - [ ] Exposure table view
  - [ ] Exposure chart view
- [ ] Create MTM reporting components
  - [ ] MTM table view
  - [ ] MTM chart view
- [ ] Create P&L reporting components

### 6.3 Reporting Module Hooks
- [ ] Create data fetching hooks
  - [ ] useExposure hook
  - [ ] useMTM hook
  - [ ] usePnL hook

## Phase 7: Admin Module Implementation

### 7.1 Admin Module Services
- [ ] Create `referenceDataService.ts`
  - [ ] Implement CRUD for reference data
  - [ ] Add validation functions
- [ ] Create `userManagementService.ts` (if needed)
  - [ ] Implement user CRUD operations
  - [ ] Add role management

### 7.2 Admin Module Components
- [ ] Create reference data management components
  - [ ] Counterparty management
  - [ ] Product management
  - [ ] Pricing instrument management
- [ ] Create price management components
  - [ ] Historical price management
  - [ ] Forward price management

### 7.3 Admin Module Hooks
- [ ] Create data fetching hooks
  - [ ] useReferenceData hook
  - [ ] usePrices hook
  - [ ] useUsers hook (if needed)

## Phase 8: Integration and Testing

### 8.1 Cross-Module Integration
- [ ] Ensure proper data flow between modules
- [ ] Test module interactions
- [ ] Verify references and dependencies

### 8.2 Comprehensive Testing
- [ ] Unit testing of core functionality
  - [ ] Test calculation functions
  - [ ] Test service functions
  - [ ] Test utility functions
- [ ] Integration testing
  - [ ] Test end-to-end flows
  - [ ] Test cross-module functionality
- [ ] Performance testing
  - [ ] Test with large data sets
  - [ ] Identify and fix bottlenecks

### 8.3 Documentation
- [ ] Create component documentation
- [ ] Document API services
- [ ] Create user guide/manual

## Phase 9: Deployment and Monitoring

### 9.1 Deployment Preparation
- [ ] Verify all functionality
- [ ] Optimize bundle size
- [ ] Implement performance improvements

### 9.2 Monitoring Setup
- [ ] Set up error tracking
- [ ] Implement performance monitoring
- [ ] Create admin dashboards

## Implementation Progress Tracking

| Phase | Description | Status | Completion Date | Notes |
|-------|-------------|--------|----------------|-------|
| 1 | Database Schema Updates | Not Started | | |
| 2 | Core Infrastructure | Not Started | | |
| 3 | Trade Module Implementation | Not Started | | |
| 4 | Operations Module Implementation | Not Started | | |
| 5 | Finance Module Implementation | Not Started | | |
| 6 | Reporting Module Implementation | Not Started | | |
| 7 | Admin Module Implementation | Not Started | | |
| 8 | Integration and Testing | Not Started | | |
| 9 | Deployment and Monitoring | Not Started | | |

## Notes and Decisions

This section will be used to record important decisions, challenges, and solutions encountered during the implementation process.

- Decision 1: [Date] - [Description]
- Challenge 1: [Date] - [Description] - [Solution]

