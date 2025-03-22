
# CTRM System Implementation Plan

This document outlines the step-by-step implementation plan for transforming the current CTRM system into a modular monolith architecture. Each step includes specific tasks that can be checked off as they are completed.

## Phase 1: Database Schema Updates

### 1.1 Operations Module Schema
- [x] Create `movements` table
  - [x] Define columns (movement_reference, trade_leg_id, status, etc.)
  - [x] Set up relationships to trade_legs
  - [x] Add constraints and indexes

### 1.2 Finance Module Schema
- [x] Create `invoices` table
  - [x] Define columns (invoice_reference, movement_id, amount, etc.)
  - [x] Set up relationships to movements
  - [x] Add constraints and indexes
- [x] Create `payments` table
  - [x] Define columns (payment_reference, invoice_id, amount, etc.)
  - [x] Set up relationships to invoices
  - [x] Add constraints and indexes

### 1.3 Audit and Tracking Schema
- [x] Create `audit_logs` table
  - [x] Define columns (table_name, record_id, operation, etc.)
  - [x] Add indexes for efficient querying
- [x] Create database triggers for audit logging
  - [x] Insert triggers
  - [x] Update triggers
  - [x] Delete triggers

### 1.4 Enhancement of Existing Tables
- [x] Extend `counterparties` table
  - [x] Add VAT number field
  - [x] Add bank details (JSONB)
  - [x] Add contact details (JSONB)
- [ ] Add any missing fields to `trade_legs`
- [ ] Add any missing fields to `parent_trades`

## Phase 2: Core Infrastructure

### 2.1 Project Structure Reorganization
- [x] Create module folders
  - [x] `/src/modules/trade`
  - [x] `/src/modules/operations`
  - [x] `/src/modules/finance`
  - [x] `/src/modules/reporting`
  - [x] `/src/modules/admin`
- [x] Create core folder structure
  - [x] `/src/core/api`
  - [x] `/src/core/components`
  - [x] `/src/core/hooks`
  - [ ] `/src/core/utils`
  - [ ] `/src/core/types`

### 2.2 API Infrastructure
- [x] Create enhanced Supabase client wrapper
  - [x] Add error handling
  - [x] Add request/response logging
  - [x] Add retry logic
- [x] Set up React Query client configuration
  - [x] Configure default options
  - [x] Set up global error handling
- [x] Create base API service classes/functions

### 2.3 UI Component Infrastructure
- [x] Create layout components
  - [x] AppLayout
  - [x] DashboardLayout
  - [x] FormLayout
  - [ ] ReportLayout
- [x] Develop shared form components
  - [x] Enhanced form controls
  - [x] Validation components
  - [ ] Error display components
- [x] Create shared table/data display components

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
- [x] Create `movementService.ts`
  - [x] Implement CRUD operations for movements
  - [x] Add validation functions

### 4.2 Operations Module Components
- [ ] Create Movement form components
  - [ ] Nomination form
  - [ ] Actualization form
- [ ] Create Movement list components
  - [ ] Scheduled movements view
  - [ ] Movement calendar view
- [ ] Create Movement detail components

### 4.3 Operations Module Hooks
- [x] Create data fetching hooks
  - [x] useMovements hook
  - [x] useMovementDetails hook
  - [x] useScheduling hook

## Phase 5: Finance Module Implementation

### 5.1 Finance Module Services
- [x] Create `invoiceService.ts`
  - [x] Implement invoice generation functions
  - [x] Add invoice calculation functions
- [x] Create `paymentService.ts`
  - [x] Implement payment tracking functions
  - [x] Add balance calculation functions

### 5.2 Finance Module Components
- [ ] Create Invoice components
  - [ ] Invoice generation form
  - [ ] Invoice detail view
- [ ] Create Payment components
  - [ ] Payment entry form
  - [ ] Payment tracking view
- [ ] Create Financial dashboard components

### 5.3 Finance Module Hooks
- [x] Create data fetching hooks
  - [x] useInvoices hook
  - [x] usePayments hook
  - [x] useFinancialStatus hook

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
| 1 | Database Schema Updates | Completed | 2024-05-21 | All tables and triggers created successfully |
| 2 | Core Infrastructure | In Progress | | Module structure and service layers established |
| 3 | Trade Module Implementation | Not Started | | |
| 4 | Operations Module Implementation | In Progress | | Services and hooks implemented |
| 5 | Finance Module Implementation | In Progress | | Services and hooks implemented |
| 6 | Reporting Module Implementation | Not Started | | |
| 7 | Admin Module Implementation | Not Started | | |
| 8 | Integration and Testing | Not Started | | |
| 9 | Deployment and Monitoring | Not Started | | |

## Notes and Decisions

- **Decision 1**: [2024-05-21] - Implemented a modular monolith architecture with clear service boundaries to allow for future microservice decomposition if needed.
- **Decision 2**: [2024-05-21] - Created a shared BaseService class to standardize data access patterns across all modules.
- **Decision 3**: [2024-05-21] - Implemented audit logging at the database level using triggers to ensure comprehensive tracking of all data changes.
- **Decision 4**: [2024-05-21] - Used React Query for state management with standardized hooks pattern to provide consistent API across the application.
