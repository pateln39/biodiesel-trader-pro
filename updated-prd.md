# Project Requirements Document (PRD)

## 1. Project Overview

This project is about building a custom Commodity Trading and Risk Management (CTRM) system specifically for a biodiesel trading team. The goal is to simplify and track both physical and paper deal entries, manage associated trade movements, and provide clear pricing exposure reporting. With this tool, the team can enter detailed trade information, schedule movements against trades, and see real-time exposure data, all in one web-based application.

The MVP is being built to address the need for real-time tracking and reconciliation of biodiesel trades that have complex pricing formulas and multiple legs for term deals. The key objectives are to design intuitive forms for data entry, ensure that every trade change is logged for audit purposes, and produce an exposure report that accurately reflects the physical and pricing positions. Success will be measured by the system's accuracy in trade calculations, ease of use for scheduling movements, and clarity in the exposure report.

## 2. In-Scope vs. Out-of-Scope

### In-Scope

*   A trade entry module that supports data entry for both physical and paper deals.

    *   Physical deals require fields such as counterparty, trade type (spot or term), buy/sell selection, product options, INCO terms, quantity, tolerance, loading and pricing dates, units, and critically, a pricing formula builder.
    *   Paper deals require fields for instrument, pricing period, fixed price, and broker.

*   An operations module that lists all open trades, allows scheduling movements against them, and prevents scheduling beyond the open quantity.

*   A detailed movement management screen where users can add extra details (vessel name, nominated date, inspector information, loadport, actualization details, etc.) for scheduled trade movements.

*   An exposure reporting module that provides a month-by-month and instrument-by-instrument breakdown. This module will display physical deals, pricing positions from the pricing formula, and paper deal adjustments in a clear table format.

*   An audit logging feature that records every change made to trades and movements for compliance and historical review.

*   A flexible pricing formula functionality that allows users to build complex formulas (using existing pricing instruments such as Argus UCOME, Argus FAME0, Argus RME, Platts diesel, and Platts LSGO) and track which quantities correspond to which instrument.

*   A unique trade reference generation for trades and leg numbering (ex. 123456-a, 123456-b, etc.).

### Out-of-Scope

*   Importing or integrating legacy trade data – the MVP will focus solely on new trade entries.
*   Integration with external pricing feeds; for now, pricing instruments remain static with a future plan to allow price history import via Excel upload.
*   Multi-user roles or permissions other than the single full-access user (for now).
*   Mobile app versions or desktop application builds – the solution will be solely web-based.

## 3. User Flow

A typical user journey starts at a clean login page. Once authenticated, the user lands on a unified dashboard that functions as the central control panel. From this dashboard, the user can easily navigate between three main modules: trade entry, operations, and exposure reporting. The dashboard also offers quick access to audit logs and notifications about any trade changes. This single, fully authorized user is expected to have full access to the system, allowing them to enter trades, schedule movements, and review exposures without navigating through complex multi-user permission setups.

Once in the trade entry module, the user selects whether to record a physical or a paper deal. For physical deals, the user fills out a detailed form – including trade type (spot or term) and all related trade details. If the deal is a term deal with multiple legs, the user can add as many legs as needed, with each leg capturing individual details. After entering the trade details and generating a unique reference, the user later navigates to the operations module to view all entered trades. Here, they can schedule performance movements without exceeding an open trade's remaining quantity. Finally, the user moves to the exposure reporting module to review a detailed table that breaks down the physical deals, resulting pricing positions, and paper deal impacts by month and grade, ensuring everything balances out.

## 4. Core Features (Bullet Points)

*   **Trade Entry Module:**

    *   Form-based entry for both physical and paper deals.

    *   For physical deals:

        *   Field capture for counterparty, spot/term selection, buy/sell, product (FAME0, RME, UCOME, UCOME-5, RME DC), sustainability options, INCO terms, quantity, tolerance, loading period, units, pricing formula, pricing period, payment terms, and credit status.
        *   Support for term deals by allowing multiple legs with each leg individually validated and linked to a trade reference (e.g., 123456-a, 123456-b).
        *   A flexible and user-friendly pricing formula builder to allocate and track pricing instruments.

    *   For paper deals:

        *   Field capture for Instrument (Argus UCOME, Argus RME, Argus FAME0, Platts LSGO), pricing period (up to 12 months ahead), price, and broker.

*   **Operations Module:**

    *   Overview screen displaying all trades with a calculated open quantity (trade quantity + tolerance - scheduled quantity).
    *   Functionality to schedule new movements against a trade without exceeding the open quantity.
    *   Detailed movement management where extra details (vessel name, nominated date, inspector info, loadport, discharge details, actualization values, etc.) are captured.

*   **Exposure Reporting Module:**

    *   Tabulated view showing breakdowns by month and grade.
    *   Clear columns for physical trades, pricing positions, paper deals, and overall exposure.
    *   Logic to invert physical and pricing values (e.g., a +5000mt physical trade converts into -5000mt pricing position as per the entered pricing formula).
    *   Reconciliation of exposures especially when paper deals offset pricing discrepancies.

*   **Audit Logging:**

    *   Record every change made to trade entries and movement schedules.
    *   Log details such as timestamp, updated field, nature of changes, and reference trade.

## 5. Tech Stack & Tools

*   **Frontend Frameworks:**

    *   Vite for build tooling and dev environment
    *   TypeScript for type safety
    *   React for UI components
    *   shadcn-ui for UI component library
    *   Tailwind CSS for styling

*   **Backend Services:**

    *   Supabase for backend services, providing:
        *   PostgreSQL database for data storage
        *   Authentication services
        *   Realtime subscriptions for live data updates
        *   RESTful API access

*   **Database Schema:**

    *   Core tables:
        *   `parent_trades` - Parent table for all trades
        *   `trade_legs` - Individual legs for each trade
    *   Reference data tables:
        *   `products`, `counterparties`, `inco_terms`, etc.
    *   Paper trading tables:
        *   `paper_trade_products`, `product_relationships`, etc.
    *   Pricing tables:
        *   `pricing_instruments`, `historical_prices`, `forward_prices`

*   **Data Management:**

    *   Realtime PostgreSQL subscriptions for live data updates
    *   TypeScript interfaces mapped to database tables
    *   Custom React hooks for data fetching and state management

*   **Development Environment:**

    *   Lovable for AI-assisted development
    *   npm for package management
    *   Git for version control

*   **Deployment:**

    *   Web-based deployment via Lovable with optional Netlify support for custom domains

## 6. Non-Functional Requirements

*   **Performance:**

    *   Pages and operations should load quickly with target response times within 2-3 seconds.
    *   The exposure reporting module should be responsive even when aggregating data across several trades.
    *   Supabase's realtime functionality should ensure timely updates to the UI when data changes.

*   **Security:**

    *   Ensure user authentication is secure using Supabase Auth (even for a single-user scenario).
    *   All audit logs must be tamper-proof and stored securely in the PostgreSQL database.

*   **Compliance & Auditability:**

    *   All changes to trades and movements are recorded with timestamps in the database with REPLICA IDENTITY FULL setting to ensure complete change tracking.
    *   Changes must be retrievable for audit purposes through the Supabase API.

*   **Usability:**

    *   The user interface must be intuitive, with clear field names, instructions, and error messages.
    *   Ensure flexibility in the pricing formula entry process while maintaining clarity in tracking and reporting.
    *   The shadcn-ui components should provide a consistent and modern UI experience.

*   **Scalability:**

    *   Although the MVP is for one user, the database design accommodates future growth, including multiple users and permission levels.
    *   Supabase provides scalable infrastructure for database growth.

## 7. Constraints & Assumptions

*   The project is built as a web-based application using Vite, React, and TypeScript, accessible through common web browsers.
*   Currently, there is only one user with full access, meaning multi-user role management is out-of-scope for MVP.
*   The pricing instruments (e.g., Argus UCOME, Argus FAME0) are stored in the `pricing_instruments` table and treated as static options – integration with external pricing feeds is planned for future phases.
*   All trade entries are new; there will be no need to import legacy data in this version.
*   The system must generate unique trade references and handle multiple legs per trade automatically through the Supabase database.
*   Trade data validation will use TypeScript type checking and form validation before database insertion.
*   The database structure requires careful foreign key relationships as defined in the Supabase schema.

## 8. Known Issues & Potential Pitfalls

*   **Complexity of Pricing Formulas:**

    *   Developing a pricing formula builder which can translate user entry into exact pricing exposures may be challenging.
    *   The `pricing_formula` and `mtm_formula` JSONB fields in the `trade_legs` table need careful handling to ensure proper serialization and deserialization.
    *   To mitigate this, ensure well-defined TypeScript interfaces for formula components and comprehensive testing with various scenarios.

*   **Handling Multiple Trade Legs:**

    *   Validating and linking individual trade legs while maintaining a unique trade reference string (e.g., 123456-a, 123456-b) requires careful management of the parent_trade_id foreign key relationship.
    *   Implement thorough validation routines and unique ID generators to maintain consistency across legs.

*   **Real-Time Exposure Reporting:**

    *   Aggregating and reconciling physical and pricing positions in real time might strain performance if the number of trades grows.
    *   Use Supabase's indexing capabilities and efficient querying to maintain performance.
    *   Consider implementing pagination or virtual scrolling for large datasets.

*   **Audit Trail Integrity:**

    *   Ensuring the audit log cannot be tampered with requires proper REPLICA IDENTITY FULL configuration in Supabase.
    *   Implement proper access controls to prevent unauthorized modifications.

*   **Supabase Realtime Subscription Management:**

    *   Managing subscription lifecycle correctly to prevent memory leaks or stale data.
    *   Implement proper cleanup of subscriptions when components unmount.
    *   Use debounced refetching to prevent excessive database queries during rapid changes.

This updated PRD reflects the current technical implementation with Supabase as the backend and the specific frontend technologies in use. It provides a comprehensive guide for ongoing development while maintaining alignment with the original project objectives.
