
import { 
  Trade, 
  PhysicalTrade, 
  PaperTrade,
  Movement, 
  AuditLog,
  ExposureReportItem
} from "@/types";

// Mock Physical Trades
export const mockPhysicalTrades: PhysicalTrade[] = [
  {
    id: "1",
    tradeReference: "230501-12345",
    tradeType: "physical",
    physicalType: "spot",
    buySell: "buy",
    counterparty: "BioDiesel Corp",
    product: "UCOME",
    sustainability: "ISCC",
    incoTerm: "FOB",
    quantity: 5000,
    tolerance: 5,
    loadingPeriodStart: new Date("2023-06-01"),
    loadingPeriodEnd: new Date("2023-06-15"),
    pricingPeriodStart: new Date("2023-06-01"),
    pricingPeriodEnd: new Date("2023-06-15"),
    unit: "MT",
    paymentTerm: "30 days",
    creditStatus: "approved",
    pricingFormula: [
      { instrument: "Argus UCOME", percentage: 100, adjustment: 0 }
    ],
    legs: [],
    createdAt: new Date("2023-05-01"),
    updatedAt: new Date("2023-05-01")
  },
  {
    id: "2",
    tradeReference: "230502-54321",
    tradeType: "physical",
    physicalType: "term",
    buySell: "sell",
    counterparty: "GreenFuel Ltd",
    product: "RME",
    sustainability: "ISCC",
    incoTerm: "CIF",
    quantity: 10000,
    tolerance: 2,
    loadingPeriodStart: new Date("2023-07-01"),
    loadingPeriodEnd: new Date("2023-12-31"),
    pricingPeriodStart: new Date("2023-07-01"),
    pricingPeriodEnd: new Date("2023-12-31"),
    unit: "MT",
    paymentTerm: "60 days",
    creditStatus: "approved",
    pricingFormula: [
      { instrument: "Argus RME", percentage: 80, adjustment: 5 },
      { instrument: "Platts LSGO", percentage: 20, adjustment: -10 }
    ],
    legs: [
      {
        id: "2-1",
        legReference: "230502-54321-a",
        parentTradeId: "2",
        quantity: 2000,
        tolerance: 2,
        loadingPeriodStart: new Date("2023-07-01"),
        loadingPeriodEnd: new Date("2023-07-31"),
        pricingPeriodStart: new Date("2023-07-01"),
        pricingPeriodEnd: new Date("2023-07-31"),
        pricingFormula: [
          { instrument: "Argus RME", percentage: 80, adjustment: 5 },
          { instrument: "Platts LSGO", percentage: 20, adjustment: -10 }
        ]
      },
      {
        id: "2-2",
        legReference: "230502-54321-b",
        parentTradeId: "2",
        quantity: 2000,
        tolerance: 2,
        loadingPeriodStart: new Date("2023-08-01"),
        loadingPeriodEnd: new Date("2023-08-31"),
        pricingPeriodStart: new Date("2023-08-01"),
        pricingPeriodEnd: new Date("2023-08-31"),
        pricingFormula: [
          { instrument: "Argus RME", percentage: 80, adjustment: 5 },
          { instrument: "Platts LSGO", percentage: 20, adjustment: -10 }
        ]
      }
    ],
    createdAt: new Date("2023-05-02"),
    updatedAt: new Date("2023-05-15")
  }
];

// Mock Paper Trades
export const mockPaperTrades: PaperTrade[] = [
  {
    id: "3",
    tradeReference: "230503-67890",
    tradeType: "paper",
    instrument: "Argus UCOME",
    pricingPeriodStart: new Date("2023-06-01"),
    pricingPeriodEnd: new Date("2023-06-30"),
    price: 1250,
    quantity: 2000,
    broker: "EcoTrade Brokers",
    createdAt: new Date("2023-05-03"),
    updatedAt: new Date("2023-05-03")
  },
  {
    id: "4",
    tradeReference: "230504-09876",
    tradeType: "paper",
    instrument: "Platts LSGO",
    pricingPeriodStart: new Date("2023-07-01"),
    pricingPeriodEnd: new Date("2023-07-31"),
    price: 650,
    quantity: 5000,
    broker: "Global Energy Brokers",
    createdAt: new Date("2023-05-04"),
    updatedAt: new Date("2023-05-04")
  }
];

// Combine physical and paper trades
export const mockTrades: Trade[] = [...mockPhysicalTrades, ...mockPaperTrades];

// Mock Movements
export const mockMovements: Movement[] = [
  {
    id: "1",
    tradeId: "1",
    scheduledQuantity: 2500,
    nominatedDate: new Date("2023-06-05"),
    vesselName: "Green Voyager",
    loadport: "Rotterdam",
    inspector: "Inspectorate",
    status: "scheduled"
  },
  {
    id: "2",
    tradeId: "1",
    scheduledQuantity: 2600,
    nominatedDate: new Date("2023-06-12"),
    vesselName: "Eco Pioneer",
    loadport: "Amsterdam",
    inspector: "Bureau Veritas",
    blDate: new Date("2023-06-14"),
    actualQuantity: 2585,
    status: "completed"
  },
  {
    id: "3",
    tradeId: "2",
    legId: "2-1",
    scheduledQuantity: 2000,
    nominatedDate: new Date("2023-07-15"),
    vesselName: "Bio Trader",
    loadport: "Hamburg",
    inspector: "SGS",
    status: "in-progress"
  }
];

// Mock Audit Logs
export const mockAuditLogs: AuditLog[] = [
  {
    id: "1",
    timestamp: new Date("2023-05-01T10:30:00"),
    entityType: "trade",
    entityId: "1",
    field: "quantity",
    oldValue: "",
    newValue: "5000",
    userId: "admin"
  },
  {
    id: "2",
    timestamp: new Date("2023-05-02T14:45:00"),
    entityType: "trade",
    entityId: "2",
    field: "buySell",
    oldValue: "buy",
    newValue: "sell",
    userId: "admin"
  },
  {
    id: "3",
    timestamp: new Date("2023-05-15T09:15:00"),
    entityType: "trade",
    entityId: "2",
    field: "creditStatus",
    oldValue: "pending",
    newValue: "approved",
    userId: "admin"
  },
  {
    id: "4",
    timestamp: new Date("2023-06-14T16:20:00"),
    entityType: "movement",
    entityId: "2",
    field: "actualQuantity",
    oldValue: "",
    newValue: "2585",
    userId: "admin"
  }
];

// Mock Exposure Report
export const mockExposureReport: ExposureReportItem[] = [
  {
    month: "Jun 2023",
    grade: "UCOME",
    physical: 5000,
    pricing: -5000,
    paper: 2000,
    netExposure: 2000
  },
  {
    month: "Jul 2023",
    grade: "RME",
    physical: -2000,
    pricing: 1600,
    paper: 0,
    netExposure: -400
  },
  {
    month: "Jul 2023",
    grade: "LSGO",
    physical: 0,
    pricing: 400,
    paper: 5000,
    netExposure: 5400
  },
  {
    month: "Aug 2023",
    grade: "RME",
    physical: -2000,
    pricing: 1600,
    paper: 0,
    netExposure: -400
  },
  {
    month: "Aug 2023",
    grade: "LSGO",
    physical: 0,
    pricing: 400,
    paper: 0,
    netExposure: 400
  }
];
