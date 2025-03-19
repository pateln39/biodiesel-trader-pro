
# Paper Trade Implementation Plan

This document outlines the comprehensive plan for implementing the paper trade system, including database structure, UI components, and business logic.

## 1. Database Structure Updates

### A. Brokers Management
```sql
CREATE TABLE public.brokers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT true
);

-- Initial broker
INSERT INTO public.brokers (name) VALUES ('Marex');
```

### B. Product Relationships
```sql
CREATE TABLE public.product_relationships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product TEXT NOT NULL,
    relationship_type TEXT NOT NULL CHECK (relationship_type IN ('DIFF', 'SPREAD', 'FP')),
    paired_product TEXT,
    default_opposite TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Initial relationships
INSERT INTO public.product_relationships 
(product, relationship_type, paired_product, default_opposite) VALUES
('UCOME DIFF', 'DIFF', NULL, 'LSGO'),
('RME', 'SPREAD', 'FAME', NULL);
```

## 2. Core Components

### Page Structure
```typescript
interface PaperTradePage {
  // Trade Details Section
  header: {
    comment: string;
    broker: string;
  }
  
  // Trade Table Section
  tradeTable: {
    rows: TradeLeg[];
    mtmFormula: FormulaConfig[];
  }
  
  // Exposure Table Section
  exposureTable: {
    months: string[];
    products: string[];
    exposures: Record<string, Record<string, number>>;
  }
}
```

### Layout Blueprint
```
NEW TRADE - PAPER                                [Cancel] [Create Trade]
------------------------------------------------
Comment: [Text Input]
Broker:  [Marex ▼] [+ Add Broker]

Trade Table:
-----------
LEFT SIDE                         RIGHT SIDE                        MTM
[+]                             
Product  Qty   Period  Price     Product  Qty   Period  Price    Formula   Period
[Dynamic Rows with + button on left side only]

Exposure Table:
--------------
[Fixed Headers: UCOME, FAME0, RME, HVO, LSGO, ICE GASOIL FUTURES]
[12 Month Rows with real-time position updates]
```

## 3. Business Logic

### A. Trade Table Logic

#### Row Addition Rules
- Each row represents a trade leg that needs to be logged in the database
- Plus (+) button exists only on the LEFT SIDE
- When user selects a product on LEFT SIDE, the RIGHT SIDE product is auto-determined

#### Auto-Population Flow
1. User clicks "+" on LEFT SIDE
2. User selects product (e.g., UCOME diff)
   - System automatically sets:
     * LEFT Product = UCOME
     * RIGHT Product = LSGO (based on product relationship)
3. User inputs on LEFT:
   - Quantity (e.g., +1000)
   - Period (e.g., Apr-25)
   - Price (e.g., 500)
4. System automatically sets on RIGHT:
   - Quantity = opposite of LEFT (-1000)
   - Period = same as LEFT (Apr-25)
   - Price field remains empty for user input
5. MTM formula is automatically set based on the selected product (UCOME diff)

#### Product Rules
```typescript
const productRules = {
  'DIFF': {
    // For diff products like UCOME diff
    leftProduct: 'UCOME',
    rightProduct: 'LSGO',
    quantityBehavior: 'opposite'
  },
  'SPREAD': {
    // For spread products like UCOME-FAME
    leftProduct: 'UCOME',
    rightProduct: 'FAME',
    quantityBehavior: 'opposite'
  },
  'FP': {
    // For fixed price products
    singleSided: true
  }
};
```

### B. Exposure Table Implementation

#### Structure
```typescript
interface ExposureRow {
  month: string;
  UCOME: number;
  FAME0: number;
  RME: number;
  HVO: number;
  LSGO: number;
  ICE_GASOIL_FUTURES: number;
}
```

#### Update Triggers
- New row addition
- Product changes
- Quantity modifications
- Period adjustments
- Row deletions

#### Calculation Rules
- Buy positions: Add positive quantity
- Sell positions: Add negative quantity
- Group by month
- Only populate relevant columns
- Real-time updates

### C. MTM Formula Rules

The MTM formula is now product-dependent:
- For Product FP (Fixed Price): MTM = Product FP
- For Product diff (e.g., UCOME diff): MTM = Product diff
- For Spread products (e.g., UCOME-FAME): MTM = Product spread name

This means the formula is automatically determined by the product selection.

### D. Validation Rules

#### Comment
- Required field
- Non-empty string

#### Broker
- Required selection
- Must be active broker

#### Trade Rows
- Valid product selections
- Non-zero quantities
- Valid period selections
- Price validation when required

#### Exposure
- Balanced positions for spreads
- Valid product relationships
- Period alignment

## 4. UI Components

### A. Trade Table Component
```typescript
interface TradeTableProps {
  rows: TradeLeg[];
  onAddRow: () => void;
  onUpdateLeftSide: (index: number, updates: Partial<TradeLeg>) => void;
  onUpdateRightSide: (index: number, updates: Partial<TradeLeg>) => void;
  onRemoveRow: (index: number) => void;
}
```

### B. Exposure Table Component
```typescript
interface ExposureTableProps {
  data: ExposureRow[];
  highlightedProduct?: string;
  onExposureClick?: (month: string, product: string) => void;
}
```

### C. Broker Management Component
```typescript
interface BrokerManagementProps {
  brokers: Broker[];
  selectedBrokerId: string;
  onSelectBroker: (id: string) => void;
  onAddBroker: (name: string) => void;
}
```

## 5. State Management

```typescript
interface PageState {
  comment: string;
  brokerId: string;
  trades: {
    rows: TradeLeg[];
  };
  exposures: ExposureRow[];
  validation: ValidationState;
  isDirty: boolean;
}
```

## 6. Data Flow

```
User Input → Validation → Database
    ↓
Trade Table Updates
    ↓
Auto-population Rules
    ↓
Exposure Calculation
    ↓
Real-time UI Updates
```

## 7. Error Handling

- Form validation errors
- Auto-population failures
- Calculation errors
- Database errors
- Network issues

## 8. Performance Optimizations

- Memoized calculations
- Batched updates
- Virtual scrolling for large datasets
- Debounced real-time updates

## 9. Integration Points

### A. With Existing Trade System
- Leverage existing types
- Match data structures
- Use established validation patterns

### B. With Pricing Engine
- Ensure formula compatibility
- Connect to price calculation flows
- Support MTM formula integration

## 10. Testing Strategy

### A. Unit Tests
- Component rendering
- Business logic validation
- Calculation accuracy

### B. Integration Tests
- Trade creation flow
- Database interactions
- State management

### C. Test Data
- Create sample dataset with at least 90 days of historical prices
- Include weekends and holidays to test date handling
- Test with multiple instruments (UCOME, RME, FAME0, LSGO, diesel)
- Create sample forward curves for at least 6 months

## 11. Status Tracking

- **Database Setup**: Not Started
- **Core Components**: Not Started
- **Trade Table Logic**: Not Started
- **Exposure Table Implementation**: Not Started
- **UI Component Development**: Not Started
- **State Management**: Not Started
- **Integration**: Not Started
- **Testing**: Not Started

## 12. Considerations

1. **Performance**: For large trade histories, optimize calculations
2. **Fallbacks**: Define logic for incomplete data
3. **Permissions**: Determine who can create vs. who can only view trades
4. **Validation**: No invalid trades - comprehensive validation approach

## 13. Next Steps

1. Review plan with stakeholders
2. Prioritize components for development
3. Create database structure
4. Implement core UI components
5. Develop business logic and integration points
6. Test thoroughly
7. Document usage for end users
