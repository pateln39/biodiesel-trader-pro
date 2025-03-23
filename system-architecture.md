# CTRM System Architecture Document

## 1. Architecture Overview

### 1.1 Architecture Pattern: Modular Monolith

The CTRM system follows a modular monolith architecture, which combines the simplicity of monolithic deployment with the organizational benefits of modular design. This approach is ideal for this system because:

- It maintains data consistency across the tightly coupled trade lifecycle
- It simplifies development and deployment
- It allows for clear module boundaries while enabling efficient data access
- It supports future decomposition into microservices if needed

### 1.2 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      CTRM Application                            │
│                                                                 │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐    │
│  │   Trade   │  │ Operations│  │  Finance  │  │ Reporting │    │
│  │  Module   │  │  Module   │  │  Module   │  │  Module   │    │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘    │
│        │              │              │              │           │
│        └──────────────┼──────────────┼──────────────┘           │
│                       │              │                          │
│  ┌───────────────────────────────────────────────────┐         │
│  │               Core Services                        │         │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐      │         │
│  │  │ API Client│  │ Auth      │  │ Events    │      │         │
│  │  └───────────┘  └───────────┘  └───────────┘      │         │
│  └───────────────────────────────────────────────────┘         │
│                       │              │                          │
│  ┌───────────────────────────────────────────────────┐         │
│  │               UI Components                        │         │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐      │         │
│  │  │ Layout    │  │ Forms     │  │ Tables    │      │         │
│  │  └───────────┘  └───────────┘  └───────────┘      │         │
│  └───────────────────────────────────────────────────┘         │
│                       │                                         │
└───────────────────────┼─────────────────────────────────────────┘
                        │
┌───────────────────────┼─────────────────────────────────────────┐
│                    Supabase                                     │
│  ┌───────────────────────────────────────────────────┐         │
│  │              PostgreSQL Database                   │         │
│  └───────────────────────────────────────────────────┘         │
│  ┌───────────────────────────────────────────────────┐         │
│  │                  Auth                              │         │
│  └───────────────────────────────────────────────────┘         │
│  ┌───────────────────────────────────────────────────┐         │
│  │                  Storage                           │         │
│  └───────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Module Structure and Responsibilities

### 2.1 Business Domain Modules

#### 2.1.1 Trade Module

**Responsibility**: Manage the creation, editing, and viewing of trade data.

**Key Components**:
- Physical Trade Form
- Paper Trade Form
- Trade Detail View
- Pricing Formula Builder
- MTM Formula Selection

**Services**:
- TradeService: CRUD operations for trades
- PricingFormulaService: Create and evaluate pricing formulas
- TradeValidationService: Validate trade data

#### 2.1.2 Operations Module

**Responsibility**: Manage the scheduling and execution of trade movements.

**Key Components**:
- Movement Scheduling Form
- Movement Detail Form
- Open Trades List
- Movement Calendar View
- Movement Status Tracking

**Services**:
- MovementService: CRUD operations for movements
- ScheduleValidationService: Validate scheduling against open quantity
- ActualizationService: Process actualized movements

#### 2.1.3 Finance Module

**Responsibility**: Manage invoices, payments, and financial settlements.

**Key Components**:
- Invoice Generation Form
- Payment Tracking View
- Financial Status Dashboard
- Credit/Debit Note Generation

**Services**:
- InvoiceService: Generate and manage invoices
- PaymentService: Track and process payments
- SettlementService: Calculate final settlements

#### 2.1.4 Reporting Module

**Responsibility**: Generate exposure, MTM, and other reports.

**Key Components**:
- Exposure Report View
- MTM Report View
- Position Dashboard
- P&L Report View

**Services**:
- ExposureService: Calculate exposure positions
- MTMService: Calculate mark-to-market valuations
- ReportGenerationService: Generate standardized reports

#### 2.1.5 Admin Module

**Responsibility**: Manage reference data and system settings.

**Key Components**:
- Counterparty Management
- Product Management
- Pricing Instrument Management
- User Management
- Historical Price Management

**Services**:
- ReferenceDataService: Manage reference data entities
- UserManagementService: Manage user accounts
- PriceManagementService: Manage historical and forward prices

### 2.2 Core Services

#### 2.2.1 API Service

**Responsibility**: Handle communication with the Supabase backend.

**Key Components**:
- SupabaseClient: Wrapper around Supabase client
- QueryClient: React Query client configuration
- APIHooks: Custom hooks for data fetching

#### 2.2.2 Authentication Service

**Responsibility**: Manage user authentication and authorization.

**Key Components**:
- AuthProvider: Context provider for authentication state
- AuthGuard: Component to protect routes
- LoginForm: User authentication interface

#### 2.2.3 Event Service

**Responsibility**: Manage internal application events.

**Key Components**:
- EventBus: Publish-subscribe mechanism for cross-module communication
- EventHandlers: Module-specific event handlers
- EventLogger: Log all events for debugging

## 3. Database Schema

### 3.1 Core Trade Tables

#### parent_trades
- id (UUID, PK)
- trade_reference (TEXT)
- trade_type (TEXT) - 'physical' or 'paper'
- physical_type (TEXT) - 'spot' or 'term'
- counterparty (TEXT)
- comment (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

#### trade_legs
- id (UUID, PK)
- parent_trade_id (UUID, FK to parent_trades)
- leg_reference (TEXT)
- buy_sell (TEXT) - 'buy' or 'sell'
- product (TEXT)
- sustainability (TEXT)
- inco_term (TEXT)
- quantity (NUMERIC)
- tolerance (NUMERIC)
- loading_period_start (DATE)
- loading_period_end (DATE)
- pricing_period_start (DATE)
- pricing_period_end (DATE)
- unit (TEXT)
- payment_term (TEXT)
- credit_status (TEXT)
- pricing_formula (JSONB)
- broker (TEXT)
- instrument (TEXT)
- price (NUMERIC)
- calculated_price (NUMERIC)
- last_calculation_date (TIMESTAMP)
- mtm_formula (JSONB)
- mtm_calculated_price (NUMERIC)
- mtm_last_calculation_date (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- trading_period (TEXT)

### 3.2 Operations Tables

#### movements (New)
- id (UUID, PK)
- trade_leg_id (UUID, FK to trade_legs)
- movement_reference (TEXT)
- status (TEXT) - 'scheduled', 'nominated', 'loading', 'completed'
- nominated_date (DATE)
- nomination_valid_date (DATE)
- cash_flow_date (DATE)
- vessel_name (TEXT)
- loadport (TEXT)
- disport (TEXT)
- inspector (TEXT)
- bl_date (DATE)
- bl_quantity (NUMERIC)
- actualized (BOOLEAN)
- actualized_date (DATE)
- actualized_quantity (NUMERIC)
- comments (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### 3.3 Finance Tables

#### invoices (New)
- id (UUID, PK)
- movement_id (UUID, FK to movements)
- invoice_reference (TEXT)
- invoice_type (TEXT) - 'prepayment', 'final', 'credit', 'debit'
- invoice_date (DATE)
- due_date (DATE)
- amount (NUMERIC)
- currency (TEXT)
- status (TEXT) - 'draft', 'issued', 'paid'
- calculated_price (NUMERIC)
- quantity (NUMERIC)
- vat_rate (NUMERIC)
- vat_amount (NUMERIC)
- total_amount (NUMERIC)
- comments (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

#### payments (New)
- id (UUID, PK)
- invoice_id (UUID, FK to invoices)
- payment_reference (TEXT)
- payment_date (DATE)
- amount (NUMERIC)
- currency (TEXT)
- payment_method (TEXT)
- comments (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### 3.4 Reference Data Tables

#### products
- id (UUID, PK)
- name (TEXT)
- created_at (TIMESTAMP)

#### counterparties (Enhanced)
- id (UUID, PK)
- name (TEXT)
- vat_number (TEXT) (New)
- bank_details (JSONB) (New)
- contact_details (JSONB) (New)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

#### inco_terms
- id (UUID, PK)
- name (TEXT)
- created_at (TIMESTAMP)

#### payment_terms
- id (UUID, PK)
- name (TEXT)
- created_at (TIMESTAMP)

#### sustainability
- id (UUID, PK)
- name (TEXT)
- created_at (TIMESTAMP)

#### credit_status
- id (UUID, PK)
- name (TEXT)
- created_at (TIMESTAMP)

#### pricing_instruments
- id (UUID, PK)
- instrument_code (TEXT)
- display_name (TEXT)
- description (TEXT)
- category (TEXT)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

#### historical_prices
- id (UUID, PK)
- instrument_id (UUID, FK to pricing_instruments)
- price_date (DATE)
- price (NUMERIC)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

#### forward_prices
- id (UUID, PK)
- instrument_id (UUID, FK to pricing_instruments)
- forward_month (DATE)
- price (NUMERIC)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### 3.5 Audit Tables

#### audit_logs (New)
- id (UUID, PK)
- table_name (TEXT)
- record_id (UUID)
- operation (TEXT) - 'INSERT', 'UPDATE', 'DELETE'
- old_data (JSONB)
- new_data (JSONB)
- user_id (UUID)
- timestamp (TIMESTAMP)

## 4. State Management

### 4.1 Server State Management

The application uses React Query for all server state management:

1. **QueryClient Configuration**:
   - Default stale time: 5 minutes
   - Cache time: 30 minutes
   - Retry logic for failed queries
   - Global error handling

2. **Query Structure**:
   - Queries organized by domain (trades, operations, finance)
   - Common patterns for pagination, filtering, and sorting
   - Consistent error handling

3. **Mutation Patterns**:
   - Optimistic updates for improved UX
   - Automatic refetching of affected queries
   - Error handling with rollback capability

### 4.2 Client State Management

For client-only state that doesn't need to be persisted to the server:

1. **React Context**:
   - AuthContext: Authentication state
   - UIContext: Global UI state (theme, sidebar state)
   - NotificationContext: Application notifications

2. **Form State**:
   - React Hook Form for all forms
   - Zod schemas for validation
   - Form state isolated to form components

3. **URL State**:
   - Use URL parameters for filterable/searchable views
   - Maintain state in URL for shareable links
   - React Router for navigation state

## 5. UI Component Organization

### 5.1 Component Hierarchy

1. **Layout Components**:
   - AppLayout: Main application layout with navigation
   - DashboardLayout: Layout for dashboard pages
   - FormLayout: Layout for form pages
   - ReportLayout: Layout for report pages

2. **Page Components**:
   - One component per route/page
   - Compose from smaller components
   - Handle data fetching via hooks
   - Minimal business logic

3. **Feature Components**:
   - Domain-specific components
   - Composed of UI components
   - May contain business logic
   - Typically correspond to a specific feature

4. **UI Components**:
   - Small, reusable components
   - No business logic
   - Styling via Tailwind CSS
   - Based on shadcn/ui library

### 5.2 UI Component Guidelines

1. **Composition**:
   - Prefer composition over inheritance
   - Use children props for flexible components
   - Create higher-order components for common patterns

2. **Props**:
   - Use detailed TypeScript interfaces for props
   - Provide sensible defaults
   - Validate required props

3. **Styling**:
   - Use Tailwind CSS for all styling
   - Create consistent spacing and sizing
   - Follow design system guidelines

4. **Accessibility**:
   - Ensure proper ARIA attributes
   - Support keyboard navigation
   - Maintain sufficient color contrast

## 6. API Design

### 6.1 Supabase Integration

The application uses Supabase for data storage and authentication:

1. **Client Setup**:
   ```typescript
   import { createClient } from '@supabase/supabase-js';

   export const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL,
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
   );
   ```

2. **Data Access Patterns**:
   - Use RLS (Row Level Security) for authorization
   - Use Supabase realtime for live updates
   - Wrap Supabase calls in service functions

3. **Authentication**:
   - Use Supabase Auth for user management
   - Implement session persistence
   - Create protected routes

### 6.2 Service Layer

Each module has its own service layer that abstracts Supabase calls:

1. **Service Structure**:
   ```typescript
   // Example Trade Service
   export const TradeService = {
     async getTrades(filters?: TradeFilters): Promise<Trade[]> {
       let query = supabase
         .from('parent_trades')
         .select(`
           *,
           trade_legs(*)
         `)
         .eq('trade_type', 'physical');
         
       // Apply filters
       if (filters?.counterparty) {
         query = query.eq('counterparty', filters.counterparty);
       }
       
       const { data, error } = await query;
       if (error) throw error;
       return transformTrades(data);
     },
     
     async createTrade(trade: TradeCreateInput): Promise<Trade> {
       // Implementation
     },
     
     // Other methods
   };
   ```

2. **Error Handling**:
   - Consistent error objects
   - Error categorization (network, validation, server)
   - Detailed error messages

3. **Data Transformation**:
   - Transform database records to frontend models
   - Handle nested relationships
   - Apply business rules

## 7. File and Folder Structure

```
src/
├── modules/              # Business domain modules
│   ├── trade/            # Trade module
│   │   ├── components/   # Trade-specific components
│   │   │   ├── PhysicalTradeForm.tsx
│   │   │   ├── PaperTradeForm.tsx
│   │   │   ├── TradeList.tsx
│   │   │   ├── PricingFormulaBuilder.tsx
│   │   │   └── ...
│   │   ├── hooks/        # Trade-specific hooks
│   │   │   ├── useTrades.ts
│   │   │   ├── usePricingFormula.ts
│   │   │   └── ...
│   │   ├── services/     # Trade-specific services
│   │   │   ├── tradeService.ts
│   │   │   ├── formulaService.ts
│   │   │   └── ...
│   │   ├── utils/        # Trade-specific utilities
│   │   │   ├── tradeValidation.ts
│   │   │   ├── referenceGenerator.ts
│   │   │   └── ...
│   │   ├── types/        # Trade-specific types
│   │   │   ├── trade.ts
│   │   │   ├── formula.ts
│   │   │   └── ...
│   │   └── pages/        # Trade pages
│   │       ├── TradesPage.tsx
│   │       ├── CreateTradePage.tsx
│   │       ├── EditTradePage.tsx
│   │       └── ...
│   ├── operations/       # Operations module (similar structure)
│   ├── finance/          # Finance module (similar structure)
│   ├── reporting/        # Reporting module (similar structure)
│   └── admin/            # Admin module (similar structure)
├── core/                 # Shared core functionality
│   ├── api/              # API client and base services
│   │   ├── supabase.ts
│   │   ├── queryClient.ts
│   │   └── ...
│   ├── components/       # Shared UI components
│   │   ├── layout/
│   │   ├── forms/
│   │   ├── tables/
│   │   ├── feedback/
│   │   └── ...
│   ├── hooks/            # Shared custom hooks
│   │   ├── useAuth.ts
│   │   ├── useNotification.ts
│   │   └── ...
│   ├── utils/            # Shared utilities
│   │   ├── date.ts
│   │   ├── number.ts
│   │   ├── validation.ts
│   │   └── ...
│   └── types/            # Shared type definitions
│       ├── common.ts
│       ├── supabase.ts
│       └── ...
├── lib/                  # Third-party library wrappers
│   ├── shadcn/
│   └── ...
├── providers/            # Context providers
│   ├── AuthProvider.tsx
│   ├── NotificationProvider.tsx
│   └── ...
├── routes/               # Application routing
│   ├── routes.ts
│   ├── ProtectedRoute.tsx
│   └── ...
├── styles/               # Global styles
│   ├── globals.css
│   └── ...
├── App.tsx               # Application entry point
├── index.tsx             # Root render
└── vite-env.d.ts         # Vite type definitions
```

## 8. Cross-Cutting Concerns

### 8.1 Error Handling

1. **Error Boundaries**:
   - React error boundaries at module levels
   - Fallback UI for errors
   - Error reporting to logging service

2. **API Error Handling**:
   - Consistent error response format
   - Error categorization
   - Retry logic for transient errors

3. **Form Validation Errors**:
   - Client-side validation with Zod
   - Field-level error messages
   - Form-level error summaries

### 8.2 Logging

1. **Client-Side Logging**:
   - Log levels (debug, info, warn, error)
   - Contextual information
   - Error stack traces

2. **API Logging**:
   - Request/response logging
   - Performance metrics
   - Error details

3. **Audit Logging**:
   - Record all data modifications
   - Include user information
   - Maintain before/after state

### 8.3 Authentication and Authorization

1. **Authentication**:
   - Supabase Auth for identity management
   - Session persistence
   - Remember me functionality

2. **Authorization**:
   - Row Level Security in Supabase
   - Role-based access control (future)
   - Frontend route protection

### 8.4 Internationalization (Future)

1. **Translation Framework**:
   - i18next for string management
   - Locale selection
   - Right-to-left support

2. **Localized Formats**:
   - Date formatting
   - Number formatting
   - Currency formatting

## 9. Performance Considerations

### 9.1 Data Loading

1. **Query Optimization**:
   - Select only required fields
   - Use efficient joins
   - Implement pagination

2. **Caching Strategy**:
   - React Query caching
   - Stale-while-revalidate pattern
   - Prefetching for common navigation paths

3. **Loading States**:
   - Skeleton loaders
   - Progressive loading
   - Background data refreshing

### 9.2 Rendering Optimization

1. **Component Optimization**:
   - Memoization for expensive components
   - Virtual scrolling for large lists
   - Code splitting for large components

2. **Bundle Optimization**:
   - Dynamic imports
   - Tree shaking
   - Dependency optimization

## 10. Testing Strategy

### 10.1 Test Types

1. **Unit Tests**:
   - Test individual functions and components
   - Focus on business logic
   - Use Jest for test runner

2. **Integration Tests**:
   - Test module interactions
   - Test API integration
   - Use Testing Library for component testing

3. **End-to-End Tests**:
   - Test complete user flows
   - Simulate real user interactions
   - Use Cypress for E2E testing

### 10.2 Test Coverage

1. **Critical Paths**:
   - Trade creation and editing
   - Movement scheduling
   - Exposure calculations
   - Invoice generation

2. **Edge Cases**:
   - Error handling
   - Boundary conditions
   - Concurrent operations

## 11. Development Workflow

### 11.1 Feature Development Process

1. **Feature Definition**:
   - Clear requirements
   - Acceptance criteria
   - Technical design

2. **Implementation**:
   - Begin with data model
   - Implement services
   - Create UI components
   - Connect to services

3. **Testing**:
   - Write tests for business logic
   - Test UI components
   - End-to-end testing

4. **Review**:
   - Code review
   - Design review
   - Performance review

### 11.2 Code Quality

1. **Linting and Formatting**:
   - ESLint for code quality
   - Prettier for formatting
   - TypeScript strict mode

2. **Code Reviews**:
   - Focus on maintainability
   - Check for edge cases
   - Ensure test coverage

3. **Documentation**:
   - Code comments for complex logic
   - API documentation
   - Component documentation

## 12. Deployment and DevOps

### 12.1 Environments

1. **Development**:
   - Local development
   - Development database
   - Feature branches

2. **Staging**:
   - Production-like environment
   - Test data
   - Pre-release testing

3. **Production**:
   - Live environment
   - Real data
   - Monitoring and alerts

### 12.2 CI/CD

1. **Continuous Integration**:
   - Automated tests
   - Linting and type checking
   - Build verification

2. **Continuous Deployment**:
   - Automated deployment
   - Deployment verification
   - Rollback capability

## 13. Security Considerations

### 13.1 Data Security

1. **Authentication**:
   - Secure password policies
   - Multi-factor authentication (future)
   - Session management

2. **Authorization**:
   - Row Level Security
   - Principle of least privilege
   - Regular access reviews

3. **Data Protection**:
   - Data encryption at rest
   - Secure API communication
   - Sensitive data handling

### 13.2 Application Security

1. **Input Validation**:
   - Validate all inputs
   - Sanitize user input
   - Prevent injection attacks

2. **OWASP Top 10**:
   - Protection against common vulnerabilities
   - Regular security reviews
   - Security testing

## 14. Extensibility

### 14.1 Module Extension

1. **Adding New Features**:
   - Create in appropriate module
   - Follow existing patterns
   - Maintain separation of concerns

2. **Extending Existing Features**:
   - Identify extension points
   - Maintain backward compatibility
   - Update documentation

### 14.2 Third-Party Integration

1. **Integration Patterns**:
   - Adapter pattern for external services
   - Consistent error handling
   - Retry and fallback strategies

2. **API Gateways**:
   - Centralized integration point
   - Authentication and authorization
   - Rate limiting and caching

## 15. Conclusion

This architecture document provides a comprehensive blueprint for implementing the CTRM system as a modular monolith. It defines clear boundaries between modules while maintaining the ability to efficiently share data across the application.

By following this architecture, the development team can create a maintainable, extensible system that meets the complex requirements of the biodiesel trading workflow while setting the foundation for future growth and potential decomposition into microservices if needed.
