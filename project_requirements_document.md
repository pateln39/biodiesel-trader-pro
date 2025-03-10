# Project Requirements Document (PRD)

## 1. Project Overview

This project is about building a custom Commodity Trading and Risk Management (CTRM) system specifically for a biodiesel trading team. The goal is to simplify and track both physical and paper deal entries, manage associated trade movements, and provide clear pricing exposure reporting. With this tool, the team can enter detailed trade information, schedule movements against trades, and see real-time exposure data, all in one web-based application.

The MVP is being built to address the need for real-time tracking and reconciliation of biodiesel trades that have complex pricing formulas and multiple legs for term deals. The key objectives are to design intuitive forms for data entry, ensure that every trade change is logged for audit purposes, and produce an exposure report that accurately reflects the physical and pricing positions. Success will be measured by the system’s accuracy in trade calculations, ease of use for scheduling movements, and clarity in the exposure report.

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

Once in the trade entry module, the user selects whether to record a physical or a paper deal. For physical deals, the user fills out a detailed form – including trade type (spot or term) and all related trade details. If the deal is a term deal with multiple legs, the user can add as many legs as needed, with each leg capturing individual details. After entering the trade details and generating a unique reference, the user later navigates to the operations module to view all entered trades. Here, they can schedule performance movements without exceeding an open trade’s remaining quantity. Finally, the user moves to the exposure reporting module to review a detailed table that breaks down the physical deals, resulting pricing positions, and paper deal impacts by month and grade, ensuring everything balances out.

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

    *   Lovable (for generating a modern, user-friendly interface).
    *   Likely use of established web technologies like React or Vue.js, integrated via Lovable’s approach to full-stack web app generation.

*   **Backend Languages & Frameworks:**

    *   A robust backend language (e.g., Node.js) handling trade processing, scheduling logic, and audit logging.
    *   RESTful APIs or GraphQL endpoints to serve data to the frontend.

*   **Database:**

    *   A relational database to maintain trade records, movement schedules, and audit logs.
    *   Structured schema to support detailed fields and relationships, such as trade legs and pricing calculations.

*   **Authentication & Logging:**

    *   An authentication framework for secure login (even though there's a single user for MVP).
    *   A logging library to capture audit logs and change tracking.

*   **Additional Tools & Libraries:**

    *   An excel parsing library (for the planned future feature to import pricing instrument price history via Excel).
    *   Basic calendar and date-picker integrations for date ranges.
    *   IDE or plugin integrations such as Cursor or Windsurf if needed to support rapid full-stack development.

*   **AI Models/Libraries:**

    *   While no external AI models are integral to the MVP functionality, the "lovable" tool is used to generate and enhance the UI/UX aspects automatically.

## 6. Non-Functional Requirements

*   **Performance:**

    *   Pages and operations should load quickly with target response times within 2-3 seconds.
    *   The exposure reporting module should be responsive even when aggregating data across several trades.

*   **Security:**

    *   Ensure user authentication is secure (even for a single-user scenario).
    *   All audit logs must be tamper-proof and stored securely.

*   **Compliance & Auditability:**

    *   All changes to trades and movements are recorded with timestamps and must be retrievable for audit purposes.

*   **Usability:**

    *   The user interface must be intuitive, with clear field names, instructions, and error messages.
    *   Ensure flexibility in the pricing formula entry process while maintaining clarity in tracking and reporting.

*   **Scalability:**

    *   Although the MVP is for one user, the design should accommodate future growth, including multiple users and permission levels.

## 7. Constraints & Assumptions

*   The project is built as a web-based application, so it must be accessible through common web browsers.
*   Currently, there is only one user with full access, meaning multi-user role management is out-of-scope for MVP.
*   The pricing instruments (e.g., Argus UCOME, Argus FAME0) are treated as static options – integration with external pricing feeds and uploads (Excel file for price history) is planned for future phases.
*   All trade entries are new; there will be no need to import legacy data in this version.
*   The system must generate unique trade references and handle multiple legs per trade automatically.
*   It’s assumed that trade data validation (like date formats or numerical inputs) does not require complex rule sets beyond basic field entry.

## 8. Known Issues & Potential Pitfalls

*   **Complexity of Pricing Formulas:**

    *   Developing a pricing formula builder which can translate user entry into exact pricing exposures may be challenging.
    *   To mitigate this, ensure a well-thought-out mapping logic that converts a physical trade into multiple pricing positions. Detailed testing with various scenarios is recommended.

*   **Handling Multiple Trade Legs:**

    *   Validating and linking individual trade legs while maintaining a unique trade reference string (e.g., 123456-a, 123456-b) could lead to consistency issues.
    *   Implement thorough validation routines and unique ID generators to maintain consistency across legs.

*   **Real-Time Exposure Reporting:**

    *   Aggregating and reconciling physical and pricing positions in real time might strain performance if the number of trades grows.
    *   Use database indexing and caching strategies to maintain performance.

*   **Audit Trail Integrity:**

    *   Ensuring the audit log cannot be tampered with is crucial for compliance.
    *   Use secure logging libraries and consider append-only storage practices.

*   **User Interface Balance:**

    *   Striking a balance between flexibility in entering complex pricing formulas and simplicity in use might be challenging.
    *   Consider a user-tested, guided form or visual builder that assists but also allows free-format entries, with validations on submission.

This PRD captures every detail necessary for the AI to generate subsequent technical documents and implementation plans. Every aspect from the field-level requirements to system workflows and technical constraints has been defined to ensure clear and unambiguous guidance for building the MVP.
