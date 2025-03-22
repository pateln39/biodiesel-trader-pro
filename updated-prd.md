# Commodity Trading and Risk Management (CTRM) System
# Project Requirements Document (PRD)

## 1. Executive Summary

The CTRM system is a highly integrated solution that tracks biodiesel trades from creation through execution, financial settlement, and exposure reporting. Based on analysis of real-world trade examples, a modular monolith architecture is the most appropriate approach for this system at this stage, as it provides:

1. **Data consistency** across tightly integrated workflows
2. **Simplified development** with faster iterations
3. **Cohesive domain model** that maintains relationships between trades, operations, and finance
4. **Efficient transaction processing** without the overhead of cross-service communication
5. **Easier maintenance** for a likely smaller team

The system requires real-time tracking of trade entries, operational movements, financial settlements, and exposure calculations - all domains that have significant interdependencies.

## 2. Project Overview

This project involves building a custom Commodity Trading and Risk Management (CTRM) system for a biodiesel trading team that handles the entire trade lifecycle. The system will track both physical and paper deals from entry through execution and financial settlement, with real-time exposure and MTM calculations.

### Key Objectives

- Create an intuitive interface for entering detailed trade information
- Track the complete lifecycle of trades from entry to settlement
- Provide real-time exposure and MTM reporting
- Support complex pricing formulas and calculations
- Manage movement scheduling and actualization
- Generate financial documents and track settlements
- Maintain a complete audit trail of all changes

## 3. Core Modules

### 3.1 Trade Entry Module

**Physical Trade Entry:**
- Counterparty, trade type (spot/term), buy/sell
- Product, sustainability certification, INCO terms
- Quantity, tolerance, units
- Loading period, pricing period
- Payment terms, credit status
- Pricing formula builder with support for complex formulas
- MTM formula selection

**Paper Trade Entry:**
- Instrument selection, pricing period
- Fixed price, broker
- Trading period

### 3.2 Operations Module

**Trade Movement Management:**
- List of all open trades with calculated open quantity
- Movement scheduling within open quantity constraints
- Movement detail capture:
  - Nomination details (date, valid date)
  - Vessel/barge information
  - Loadport and disport
  - Inspector details
  - BL date and quantity
  - Actualization status
  - Comments

### 3.3 Finance Module

**Invoice Management:**
- Prepayment invoice generation for applicable trades
- Final invoice calculation after actualization
- Payment status tracking
- Credit/debit notes for quantity/price adjustments
- VAT and tax calculations
- Link to counterparty details (VAT numbers, bank details)

### 3.4 Exposure & MTM Reporting

**Exposure Reporting:**
- Month-by-month, instrument-by-instrument breakdown
- Physical position (buy/sell)
- Pricing position based on formulas
- Paper position adjustments
- Net exposure calculation

**MTM Valuation:**
- Calculate MTM based on current market prices vs. formula
- Support for both actualized and non-actualized trades
- Historical MTM tracking

### 3.5 Administration Module

**Reference Data Management:**
- Counterparty management with banking and tax details
- Product and pricing instrument management
- Historical and forward price management
- User management (future)

## 4. Data Model (Key Entities)

Based on the Supabase schema and trade examples, the core entity relationships are:

1. **Trade Hierarchy**
   - Parent Trades (master record)
   - Trade Legs (specific details)
   - Movements (operational executions)
   - Financial Transactions (invoices, payments)

2. **Reference Data**
   - Counterparties (with extended financial details)
   - Products
   - Pricing Instruments
   - Price History (historical & forward prices)

3. **Calculation Models**
   - Pricing Formulas
   - MTM Formulas
   - Exposure Calculations

## 5. Architecture Approach

### 5.1 Modular Monolith Architecture

The recommended architecture is a modular monolith with the following characteristics:

- **Single Deployable Unit:** The entire application deployed as one unit
- **Well-Defined Module Boundaries:** Clear interfaces between modules
- **Domain-Driven Design:** Organize code around business domains
- **Shared Database:** Single database with schema separation by module
- **Event-Based Communication:** Use internal events for cross-module updates

### 5.2 Technology Stack

- **Frontend:** React with TypeScript and shadcn-ui (as per README)
- **Backend:** Node.js RESTful API
- **Database:** PostgreSQL via Supabase (as per existing schema)
- **State Management:** React Query for server state, Context API for UI state
- **Form Handling:** React Hook Form with Zod validation
- **Styling:** Tailwind CSS

## 6. Project Structure

```
src/
├── modules/              # Organized by business domain
│   ├── trade/            # Trade entry and management
│   │   ├── components/   # UI components specific to trades
│   │   ├── hooks/        # Trade-related data hooks
│   │   ├── services/     # Trade API services
│   │   ├── utils/        # Trade-specific utilities
│   │   └── types/        # Trade type definitions
│   ├── operations/       # Operations and movement management
│   ├── finance/          # Finance and invoice management
│   ├── exposure/         # Exposure and MTM reporting
│   └── admin/            # Reference data management
├── core/                 # Shared core functionality
│   ├── api/              # API client and base services
│   ├── components/       # Shared UI components
│   ├── hooks/            # Shared custom hooks
│   ├── utils/            # Shared utilities
│   └── types/            # Shared type definitions
├── lib/                  # Third-party library wrappers
├── providers/            # Context providers
├── routes/               # Application routing
└── App.tsx               # Application entry point
```

## 7. Development Roadmap

### Phase 1 (MVP): Core Trade Management (2-3 Months)
- Trade entry (physical and paper)
- Basic operations module
- Simple exposure reporting
- Reference data management

### Phase 2: Financial Integration (2 Months)
- Finance module implementation
- Invoice generation
- Payment tracking
- Integration with operations module

### Phase 3: Advanced Reporting (1-2 Months)
- Enhanced MTM calculations
- Improved exposure reporting
- Historical performance tracking
- Dashboard visualizations

### Phase 4: Operational Enhancements (2 Months)
- Demurrage calculations
- Storage tracking
- Mass balance functionality
- Secondary costs

### Phase 5: Extended Features (Ongoing)
- Multi-user role management
- Workflow approvals
- Advanced analytics
- External system integrations

## 8. Rules for Implementation

### 8.1 Code Organization Rules

1. **Module-First Structure**
   - Always create new files within the appropriate module directory
   - Never place domain-specific code in the core directory
   - Ensure each module has clean boundaries with clearly defined interfaces

2. **Type Safety**
   - Use TypeScript with strict mode enabled for all new code
   - Define comprehensive interfaces for all data models before implementation
   - Use discriminated unions for different variants of related types (e.g., PhysicalTrade vs PaperTrade)

3. **Component Design**
   - Create small, focused components with single responsibilities
   - Implement reusable components in the core/components directory
   - Use composition over inheritance for component flexibility

4. **State Management**
   - Use React Query for all server state and API calls
   - Implement optimistic updates for better user experience
   - Use Context API only for truly global state
   - Keep form state local using React Hook Form

### 8.2 Dependency Management Rules

1. **Library Selection**
   - Do not add new dependencies without explicit approval
   - Always check if functionality can be built with existing libraries
   - Use the shadcn/ui component library for UI elements
   - Maximize use of the built-in browser and React APIs

2. **External Services**
   - Always wrap Supabase API calls in service abstractions
   - Implement retry logic for network operations
   - Use environment variables for all external service configurations

3. **Dependency Injection**
   - Create service abstractions that can be easily mocked for testing
   - Inject dependencies via props or context rather than importing directly

### 8.3 Quality Assurance Rules

1. **Validation**
   - Implement Zod schemas for all form inputs
   - Validate API inputs at the entry point of each endpoint
   - Add database constraints to enforce data integrity

2. **Error Handling**
   - Implement comprehensive error handling for all async operations
   - Create user-friendly error messages for all possible error states
   - Log detailed error information for debugging

3. **Code Style**
   - Follow consistent naming conventions across the codebase
   - Use prettier for code formatting
   - Follow eslint rules to maintain code quality

### 8.4 Feature Implementation Process

1. **Data Model First**
   - Start by defining or updating the database schema
   - Create corresponding TypeScript interfaces
   - Validate the data model with sample data

2. **Service Layer**
   - Implement API services and data access functions
   - Create utility functions for business logic
   - Test service functions with sample data

3. **UI Components**
   - Build from the bottom up (small components first)
   - Implement form validation
   - Create consistent UI patterns across features

4. **Integration**
   - Connect UI to services
   - Implement error handling and loading states
   - Test the full feature flow

## 9. In-Scope vs. Out-of-Scope

### In-Scope

- Complete trade entry with physical and paper deals
- Operations module with movement management
- Finance module with invoice generation
- Exposure and MTM reporting
- Reference data management
- Audit logging

### Out-of-Scope

- External system integrations (accounting, ERP)
- Multiple user roles (initially)
- Mobile application
- Real-time pricing feeds
- Custom reporting tools
- Automated compliance checks

## 10. Success Criteria

1. **Functional Completeness**: System covers the entire trade lifecycle
2. **Data Accuracy**: MTM and exposure calculations match manual calculations
3. **Performance**: Pages load within 2 seconds, calculations complete within 5 seconds
4. **Usability**: Users can complete common tasks without training
5. **Reliability**: System maintains data integrity and availability

## 11. Implementation Considerations

### Database Strategy

- Use Supabase's row-level security for future multi-user support
- Implement optimistic concurrency control for collaborative editing
- Set up database triggers for audit logging
- Use foreign key constraints to maintain data integrity

### State Management

- Use React Query for server state with appropriate caching strategies
- Implement optimistic updates for better UX
- Use Context API for global UI state (current user, theme, etc.)

### API Design

- RESTful API design with consistent patterns
- Pagination for list endpoints
- Filtering and sorting capabilities
- Proper error handling and status codes

## 12. Real-World Trade Lifecycle Example

To illustrate the complete trade lifecycle that the system needs to support:

### Trade Creation
- User enters a physical deal to sell 5kt UCOME to Clover Energy Ltd
- Details include: Sustainability: UCOME (Argus), Price: FAME+250, Loading: 1-31 Jan, Pricing: 1-15 Jan, MTM formula: Argus UCOME, Credit Status: Prepay

### Exposure Reporting
- System shows -5kt JAN UCOME (physical) and +5kt JAN FAME (pricing) in the exposure report
- This reflects that we're selling 5kt of UCOME (hence negative physical position) but pricing it against FAME (hence positive pricing position)

### MTM Calculation
- If FAME averages $1200/mt during pricing period, trade price is $1450/mt
- If current UCOME price is $1600/mt, MTM would be ($1600-$1450) * 5000 = $750,000

### Movement Management
- When Clover nominates on January 10th, ops creates a movement
- Movement details include: nominated date, vessel name, loadport, inspector, etc.

### Financial Processing
- As this is a prepay trade, finance generates a prepay invoice based on formula
- After loading completes, ops enters BL date and quantity
- After pricing period, finance generates final invoice based on actual quantity and final price

This lifecycle demonstrates the integrated nature of the system, where trade entry, operations, finance, and reporting all work together to track the complete lifecycle of a trade.
