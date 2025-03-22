
# CTRM System Architecture Migration Plan

This document outlines the step-by-step plan to migrate our current CTRM application architecture to the target modular monolith architecture defined in the system-architecture.md document, without breaking existing functionality.

## Phase 1: Project Structure Reorganization

- [x] 1.1 Create core module structure
  - [x] Create `/src/modules` directory with subdirectories for each domain (trade, operations, finance, exposure, admin)
  - [x] Create `/src/core` directory with subdirectories (api, components, hooks, utils, types)
  - [x] Create `/src/lib` directory for third-party library wrappers

- [x] 1.2 Move existing types to domain-specific locations
  - [x] Refactor trade types to `/src/modules/trade/types`
  - [x] Refactor operation types to `/src/modules/operations/types`
  - [x] Keep common types in `/src/core/types`

- [x] 1.3 Migrate existing hooks to appropriate modules
  - [x] Move trade-related hooks to `/src/modules/trade/hooks`
  - [x] Move reference data hooks to `/src/core/hooks`
  - [x] Ensure all imports are updated without breaking functionality

- [x] 1.4 Migrate existing components to domain modules
  - [x] Move trade-related components to `/src/modules/trade/components`
  - [x] Move UI components to `/src/core/components` if shared across domains
  - [x] Update imports without breaking functionality

- [x] 1.5 Restructure pages to align with modules
  - [x] Move trade pages to `/src/modules/trade/pages`
  - [x] Move operations pages to `/src/modules/operations/pages`
  - [x] Update routing configuration to reflect new structure

## Phase 2: Database Schema Enhancement

- [ ] 2.1 Create missing operational tables
  - [ ] Add missing fields to movements table
  - [ ] Set up foreign key relationships and constraints
  - [ ] Configure row-level security and audit triggers

- [ ] 2.2 Create finance module tables
  - [ ] Create invoices table with proper relationships
  - [ ] Create payments table with proper relationships
  - [ ] Configure row-level security and audit triggers

- [ ] 2.3 Enhance reference data tables
  - [ ] Update counterparties table with extended financial details
  - [ ] Ensure all reference tables have proper indexes

## Phase 3: Service Layer Implementation

- [x] 3.1 Create domain-specific service abstractions
  - [x] Implement `TradeService` for trade-related operations
  - [x] Implement `OperationsService` for movement management
  - [x] Implement `FinanceService` for invoice and payment handling
  - [x] Implement `ReferenceDataService` for reference data management

- [x] 3.2 Standardize API patterns
  - [x] Implement consistent error handling across services
  - [x] Standardize data transformation between database and application models
  - [x] Create utility functions for common operations

- [ ] 3.3 Implement React Query hooks that use service layer
  - [ ] Create custom hooks for each domain that leverage the service layer
  - [ ] Implement consistent caching strategies
  - [ ] Add optimistic updates for better UX

## Phase 4: Component Refactoring

- [ ] 4.1 Implement shared UI components
  - [ ] Create consistent layout components
  - [ ] Create form components with standardized validation
  - [ ] Create table components with sorting and filtering capabilities

- [ ] 4.2 Refactor domain-specific components
  - [ ] Refactor trade entry components to use shared components
  - [ ] Refactor operations components to use shared components
  - [ ] Ensure consistent styling with Tailwind CSS

- [ ] 4.3 Implement proper form handling
  - [ ] Use React Hook Form with Zod validation consistently
  - [ ] Create reusable form components for common patterns

## Phase 5: State Management Standardization

- [ ] 5.1 Standardize React Query usage
  - [ ] Implement consistent query key structure
  - [ ] Set up global query client configuration
  - [ ] Add proper error handling and loading states

- [ ] 5.2 Implement proper context usage
  - [ ] Create contexts only for truly global state
  - [ ] Use React Query for server state
  - [ ] Implement proper context providers

## Phase 6: Testing and Documentation

- [ ] 6.1 Implement testing strategy
  - [ ] Add unit tests for critical business logic
  - [ ] Add integration tests for key workflows
  - [ ] Set up test infrastructure and best practices

- [ ] 6.2 Create documentation
  - [ ] Document architecture and module boundaries
  - [ ] Document component usage and patterns
  - [ ] Document service layer and API patterns

## Execution Strategy

This migration plan will be executed incrementally, ensuring that existing functionality is preserved throughout the process. Each step will be completed and tested before moving to the next step. The plan will be revised as needed based on insights gained during the migration process.

Progress will be tracked by checking off completed items in this document.
