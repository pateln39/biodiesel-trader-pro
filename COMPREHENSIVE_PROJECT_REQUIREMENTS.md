
# Biodiesel Trading and Risk Management (CTRM) System
## Comprehensive Project Requirements Document

### Table of Contents
1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Core Modules](#core-modules)
4. [Database Schema](#database-schema)
5. [User Interface](#user-interface)
6. [Technical Implementation](#technical-implementation)
7. [Features Implemented](#features-implemented)
8. [Business Logic](#business-logic)
9. [Data Flow](#data-flow)
10. [Security & Compliance](#security--compliance)
11. [Performance Optimization](#performance-optimization)
12. [Future Enhancements](#future-enhancements)

---

## Executive Summary

The Biodiesel Trading and Risk Management (CTRM) System is a comprehensive web-based platform designed specifically for biodiesel commodity trading operations. The system manages the complete trade lifecycle from initial trade entry through execution, financial settlement, and risk reporting.

### Key Objectives Achieved
- **Complete Trade Lifecycle Management**: From entry to settlement
- **Real-time Risk Management**: MTM calculations and exposure reporting
- **Operational Excellence**: Movement scheduling, storage management, and demurrage calculations
- **Financial Integration**: Invoice generation, payment tracking, and P&L reporting
- **Data Integrity**: Comprehensive audit trails and validation systems

---

## System Architecture

### Technology Stack
- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack React Query for server state
- **Database**: PostgreSQL via Supabase
- **Build Tool**: Vite
- **Form Handling**: React Hook Form with Zod validation

### Architecture Pattern
**Modular Monolith** with clear domain boundaries:
- Trade Management Module
- Operations Module  
- Risk Management Module
- Finance Module
- Storage Management Module
- Administration Module

---

## Core Modules

### 1. Trade Management Module

#### Physical Trades
- **Trade Entry**: Complete physical trade creation with pricing formulas
- **Trade Types**: Spot and Term trades with multiple legs
- **Pricing Support**: Standard, EFP, and Fixed pricing types
- **Formula Builder**: Complex pricing formula creation with instruments
- **Trade Operations**: Copy, edit, delete with validation
- **Bulk Operations**: Excel upload and bulk processing

#### Paper Trades
- **Instrument Trading**: FP, DIFF, and SPREAD relationships
- **Period Management**: Trading periods with daily distributions
- **Exposure Calculation**: Automatic exposure computation
- **MTM Integration**: Real-time mark-to-market calculations
- **Right Side Management**: Paired product relationships

#### Key Features
- Advanced filtering and sorting
- Real-time data updates
- Comprehensive validation
- Audit logging
- Export capabilities

### 2. Operations Module

#### Open Trades Management
- **Trade Visibility**: Real-time view of open positions
- **Quantity Tracking**: Open quantity calculations with tolerance
- **Movement Scheduling**: Schedule shipments within open quantities
- **Status Management**: Trade and movement status tracking
- **Sorting & Filtering**: Advanced multi-column operations

#### Movement Management
- **Lifecycle Tracking**: From nomination to actualization
- **Document Management**: B/L dates, COD, and documentation
- **Inspector Management**: Load and discharge port inspectors
- **Vessel Management**: Barge and vessel tracking
- **Reference Generation**: Automatic movement reference numbering
- **Checklist System**: Operational task tracking

#### Storage Management
- **Terminal Operations**: Multi-terminal storage management
- **Tank Management**: Individual tank tracking with capacity
- **Inventory Tracking**: Real-time stock levels and movements
- **Product Assignment**: Tank-to-product assignments
- **Transfer Operations**: Inter-tank transfers and reconciliations
- **Mass Balance**: Inventory reconciliation and stock management

#### Demurrage Management
- **Calculation Engine**: Automated demurrage calculations
- **Time Tracking**: Laytime and port time management
- **Rate Management**: Configurable demurrage rates
- **Manual Overrides**: User adjustments with audit trails
- **Reporting**: Detailed demurrage reports

### 3. Risk Management Module

#### Exposure Reporting
- **Multi-dimensional Views**: By month, product, and instrument
- **Position Aggregation**: Physical, pricing, and paper positions
- **Net Exposure**: Calculated net positions across all trades
- **Product Mapping**: Biodiesel to pricing instrument relationships
- **Export Capabilities**: Excel export with formatting

#### Mark-to-Market (MTM)
- **Physical MTM**: Trade-level MTM calculations
- **Paper MTM**: Paper position MTM with pagination
- **Inventory MTM**: Storage-based MTM calculations
- **Price Integration**: Historical and forward price support
- **Automated Calculations**: Scheduled MTM updates

#### Price Management
- **Historical Prices**: Daily price data management
- **Forward Curves**: Future price management
- **Instrument Support**: Multiple pricing instruments
- **Price Upload**: Excel-based price import
- **Validation**: Price data quality checks

### 4. Finance Module

#### Invoice Management
- **Automated Generation**: Prepayment and final invoices
- **Price Calculation**: Formula-based pricing
- **VAT Support**: Configurable tax calculations
- **Status Tracking**: Invoice lifecycle management
- **Payment Integration**: Payment tracking and reconciliation

#### Payment Processing
- **Payment Recording**: Multi-currency support
- **Reconciliation**: Invoice-to-payment matching
- **Reference Management**: Payment reference tracking
- **Reporting**: Payment status and aging reports

### 5. Administration Module

#### Reference Data Management
- **Counterparties**: Customer and supplier management
- **Products**: Product catalog with color coding
- **Instruments**: Pricing instrument definitions
- **Sustainability**: Certification management
- **Brokers**: Broker information management
- **Inspectors**: Inspector database

#### User Management
- **Audit Logging**: Complete change tracking
- **Data Validation**: Input validation and constraints
- **System Configuration**: Configurable parameters

---

## Database Schema

### Core Tables

#### Trading Tables
- `parent_trades`: Master trade records
- `trade_legs`: Individual trade leg details
- `paper_trades`: Paper trade parent records
- `paper_trade_legs`: Paper trade leg details
- `open_trades`: Denormalized view for operations

#### Movement Tables
- `movements`: Movement lifecycle tracking
- `movement_terminal_assignments`: Terminal assignments
- `tank_movements`: Storage movements

#### Financial Tables
- `invoices`: Invoice management
- `payments`: Payment tracking
- `physical_mtm_positions`: Physical MTM data
- `paper_mtm_positions`: Paper MTM data

#### Reference Tables
- `counterparties`: Customer/supplier data
- `products`: Product definitions
- `pricing_instruments`: Pricing instrument data
- `historical_prices`: Price history
- `forward_prices`: Forward price curves

#### Storage Tables
- `terminals`: Terminal definitions
- `tanks`: Tank specifications
- `barges_vessels`: Vessel management
- `inspectors`: Inspector database

#### System Tables
- `audit_logs`: Complete audit trail
- `demurrage_calculations`: Demurrage data

### Key Relationships
- Parent-child trade structures
- Movement-to-trade linkage
- Terminal-tank hierarchies
- Price-to-instrument relationships
- Audit trail connections

---

## User Interface

### Design System
- **Component Library**: shadcn/ui with custom extensions
- **Responsive Design**: Mobile and desktop support
- **Dark/Light Themes**: User preference support
- **Accessibility**: WCAG compliance considerations

### Navigation Structure
- **Sidebar Navigation**: Module-based organization
- **Breadcrumb Navigation**: Clear navigation paths
- **Quick Actions**: Keyboard shortcuts and hotkeys
- **Search Functionality**: Global and module-specific search

### Key UI Components
- **Data Tables**: Advanced filtering, sorting, pagination
- **Form Builders**: Dynamic form generation
- **Modal Dialogs**: Context-specific actions
- **Export Tools**: Excel and PDF generation
- **Dashboard Cards**: Key metrics display

---

## Technical Implementation

### State Management
- **Server State**: TanStack React Query with caching
- **Form State**: React Hook Form with Zod validation
- **UI State**: Context API for global state
- **Local Storage**: User preferences and settings

### Data Validation
- **Frontend Validation**: Zod schemas with real-time feedback
- **Backend Validation**: Database constraints and triggers
- **Business Logic Validation**: Complex rule enforcement
- **Data Integrity**: Foreign key constraints and checks

### Performance Optimization
- **Query Optimization**: Indexed database queries
- **Caching Strategy**: Intelligent cache management
- **Pagination**: Server-side pagination for large datasets
- **Lazy Loading**: Component and data lazy loading
- **Debouncing**: Search and filter debouncing

### Error Handling
- **Global Error Boundaries**: React error boundaries
- **API Error Handling**: Consistent error responses
- **User Feedback**: Toast notifications and error states
- **Logging**: Comprehensive error logging

---

## Features Implemented

### Trade Management
✅ Physical trade entry with complex pricing formulas
✅ Paper trade management with relationship types
✅ Advanced filtering and sorting across all views
✅ Excel import/export capabilities
✅ Trade copying and bulk operations
✅ Formula builder with instrument support
✅ EFP pricing with designated months
✅ Multi-leg term trade support

### Operations
✅ Open trades management with real-time updates
✅ Movement scheduling within open quantities
✅ Storage management with tank assignments
✅ Demurrage calculations with manual overrides
✅ Vessel and inspector management
✅ Comprehensive movement lifecycle tracking
✅ Checklist system for operational tasks
✅ Reference number generation

### Risk Management
✅ Real-time exposure reporting by month/product
✅ Physical and paper MTM calculations
✅ Inventory MTM with storage integration
✅ Price management with historical data
✅ Excel export with advanced formatting
✅ Automated calculation scheduling

### Finance
✅ Invoice generation with formula pricing
✅ Payment tracking and reconciliation
✅ Multi-currency support
✅ VAT calculations
✅ P&L reporting integration

### System Features
✅ Comprehensive audit logging
✅ Advanced search and filtering
✅ Export capabilities across modules
✅ Responsive design implementation
✅ Real-time data updates
✅ Keyboard shortcut support

---

## Business Logic

### Pricing Calculations
- **Formula Engine**: Supports complex pricing formulas with multiple instruments
- **EFP Calculations**: Exchange for Physical pricing with premiums
- **MTM Calculations**: Mark-to-market using current vs. formula prices
- **Period-based Pricing**: Daily and monthly price averaging

### Quantity Management
- **Tolerance Calculations**: Automatic tolerance-based quantity limits
- **Open Quantity Tracking**: Real-time open position calculations
- **Movement Scheduling**: Validation against available quantities
- **Inventory Balancing**: Tank-level inventory management

### Exposure Calculations
- **Physical Positions**: Long/short positions from physical trades
- **Pricing Exposure**: Pricing formula-based exposures
- **Paper Positions**: Paper trade exposures with daily distributions
- **Net Exposure**: Combined exposure across all position types

### Risk Management
- **Position Limits**: Configurable position limits (future)
- **MTM Calculations**: Daily mark-to-market calculations
- **P&L Tracking**: Realized and unrealized P&L
- **Stress Testing**: Scenario analysis capabilities (future)

---

## Data Flow

### Trade Entry Flow
1. **Trade Creation**: User enters trade details
2. **Validation**: Form and business rule validation
3. **Formula Processing**: Pricing formula parsing and validation
4. **Database Storage**: Trade and leg record creation
5. **Open Trade Generation**: Automatic open trade record creation
6. **Audit Logging**: Complete change tracking

### Movement Flow
1. **Movement Scheduling**: Against open trade quantities
2. **Reference Generation**: Automatic movement numbering
3. **Lifecycle Tracking**: Status updates and documentation
4. **Quantity Updates**: Open quantity recalculation
5. **Storage Integration**: Terminal and tank assignments
6. **Invoice Triggers**: Automatic invoice generation

### Risk Calculation Flow
1. **Data Collection**: Trade and position data gathering
2. **Exposure Calculation**: Multi-dimensional exposure computation
3. **MTM Processing**: Mark-to-market calculations
4. **Report Generation**: Risk report creation
5. **Export Processing**: Excel and PDF generation

---

## Security & Compliance

### Data Security
- **Authentication**: Secure user authentication (ready for implementation)
- **Authorization**: Role-based access control (future)
- **Data Encryption**: Database encryption at rest
- **API Security**: Secure API endpoints
- **Audit Trails**: Complete change tracking

### Compliance Features
- **Audit Logging**: Comprehensive change tracking
- **Data Validation**: Multi-layer validation
- **Document Management**: Trade document storage
- **Regulatory Reporting**: Export capabilities for compliance
- **Data Retention**: Configurable retention policies

---

## Performance Optimization

### Database Optimization
- **Indexing Strategy**: Optimized database indexes
- **Query Optimization**: Efficient query patterns
- **Pagination**: Server-side pagination for large datasets
- **Caching**: Intelligent caching strategies
- **Connection Pooling**: Database connection optimization

### Frontend Optimization
- **Code Splitting**: Dynamic component loading
- **Lazy Loading**: On-demand resource loading
- **Memoization**: React optimization techniques
- **Bundle Optimization**: Optimized build process
- **CDN Integration**: Static asset optimization

### Real-time Updates
- **WebSocket Integration**: Real-time data updates
- **Optimistic Updates**: Immediate UI feedback
- **Background Sync**: Offline capability support
- **Conflict Resolution**: Data conflict handling

---

## Future Enhancements

### Planned Features
- **Multi-user Authentication**: User management system
- **Role-based Permissions**: Granular access control
- **Workflow Approvals**: Trade approval workflows
- **Advanced Analytics**: Business intelligence dashboards
- **Mobile Application**: Mobile-responsive enhancements
- **API Integration**: External system integrations
- **Advanced Reporting**: Custom report builder
- **Machine Learning**: Price prediction and risk analytics

### Technical Improvements
- **Microservices Migration**: Service decomposition (if needed)
- **Enhanced Security**: Advanced security features
- **Performance Monitoring**: Application monitoring
- **Automated Testing**: Comprehensive test suite
- **CI/CD Pipeline**: Automated deployment
- **Documentation**: API and user documentation

### Business Enhancements
- **Multi-commodity Support**: Beyond biodiesel trading
- **Advanced Risk Models**: Sophisticated risk calculations
- **Regulatory Integration**: Automated compliance reporting
- **Third-party Integrations**: ERP and accounting systems
- **Advanced Workflows**: Complex approval processes
- **Business Intelligence**: Advanced analytics and insights

---

## Success Metrics

### Functional Metrics
- **Trade Processing Time**: Sub-5 second trade entry
- **Data Accuracy**: 99.9% calculation accuracy
- **System Availability**: 99.5% uptime target
- **User Adoption**: Training-free operation capability
- **Processing Volume**: Support for high-volume trading

### Technical Metrics
- **Page Load Times**: <2 seconds for all pages
- **Query Performance**: <1 second for filtered queries
- **Export Performance**: <30 seconds for large exports
- **Real-time Updates**: <1 second for data updates
- **Concurrent Users**: Support for multiple simultaneous users

### Business Metrics
- **Operational Efficiency**: Reduced manual processes
- **Risk Management**: Improved exposure visibility
- **Compliance**: Automated audit trail generation
- **Data Integrity**: Zero data loss incidents
- **User Satisfaction**: High user satisfaction scores

---

## Conclusion

The Biodiesel Trading and Risk Management System represents a comprehensive solution for commodity trading operations. Built with modern web technologies and following industry best practices, the system provides complete trade lifecycle management, real-time risk reporting, and operational excellence.

The modular architecture ensures scalability and maintainability, while the comprehensive feature set addresses all aspects of biodiesel trading operations. The system is designed for growth and can be extended to support additional commodities and enhanced functionality as business needs evolve.

**Document Version**: 1.0  
**Last Updated**: December 2024  
**Status**: Production Ready
