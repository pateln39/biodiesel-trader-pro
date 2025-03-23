
// Import types from their correct locations
import { PaperTrade } from '@/types/paper';
import { PhysicalTrade } from '@/types/physical';
import { Movement, AuditLog } from '@/types/common';

// Mock data for audit logs
export const mockAuditLogs: AuditLog[] = [
  {
    id: '1',
    timestamp: new Date('2023-03-15T10:30:00'),
    entityType: 'trade',
    entityId: 'TR-1234',
    field: 'quantity',
    oldValue: '100',
    newValue: '150',
    userId: 'user1@example.com'
  },
  {
    id: '2',
    timestamp: new Date('2023-03-14T14:22:00'),
    entityType: 'trade',
    entityId: 'TR-1236',
    field: 'counterparty',
    oldValue: 'Acme Corp',
    newValue: 'Beta Industries',
    userId: 'user2@example.com'
  },
  {
    id: '3',
    timestamp: new Date('2023-03-12T09:45:00'),
    entityType: 'trade', // Changed from 'payment' to 'trade'
    entityId: 'PAY-789',
    field: 'status',
    oldValue: 'pending',
    newValue: 'completed',
    userId: 'user1@example.com'
  }
];

// Mock data for physical trades - updated to match PhysicalTrade interface
export const mockPhysicalTrades: PhysicalTrade[] = [
  {
    id: 'PT001',
    tradeType: 'physical',
    physicalType: 'spot',
    tradeReference: 'PHY-2023-001',
    counterparty: 'EcoFuels GmbH',
    buySell: 'buy',
    product: 'FAME0',
    sustainability: 'ISCC EU',
    incoTerm: 'FOB',
    quantity: 1000,
    unit: 'MT',
    tolerance: 2.5,
    loadingPeriodStart: new Date('2023-04-01'),
    loadingPeriodEnd: new Date('2023-04-15'),
    pricingPeriodStart: new Date('2023-04-01'),
    pricingPeriodEnd: new Date('2023-04-15'),
    paymentTerm: '30 days',
    creditStatus: 'approved',
    createdAt: new Date('2023-03-10'),
    updatedAt: new Date('2023-03-10'),
    legs: []
  },
  {
    id: 'PT002',
    tradeType: 'physical',
    physicalType: 'spot',
    tradeReference: 'PHY-2023-002',
    counterparty: 'Renewable Energy Corp',
    buySell: 'sell',
    product: 'RME',
    sustainability: 'ISCC EU',
    incoTerm: 'CIF',
    quantity: 2000,
    unit: 'MT',
    tolerance: 5,
    loadingPeriodStart: new Date('2023-04-10'),
    loadingPeriodEnd: new Date('2023-04-20'),
    pricingPeriodStart: new Date('2023-04-10'),
    pricingPeriodEnd: new Date('2023-04-20'),
    paymentTerm: '30 days',
    creditStatus: 'approved',
    createdAt: new Date('2023-03-12'),
    updatedAt: new Date('2023-03-12'),
    legs: []
  }
];

// Mock data for movements
export const mockMovements: Movement[] = [
  {
    id: 'MOV001',
    tradeId: 'PT001',
    vesselName: 'Green Voyager',
    scheduledQuantity: 500,
    nominatedDate: new Date('2023-04-05'),
    loadport: 'Rotterdam',
    status: 'scheduled'
  },
  {
    id: 'MOV002',
    tradeId: 'PT001',
    vesselName: 'Green Voyager',
    scheduledQuantity: 500,
    nominatedDate: new Date('2023-04-12'),
    loadport: 'Rotterdam',
    status: 'scheduled'
  },
  {
    id: 'MOV003',
    tradeId: 'PT002',
    vesselName: 'Eco Pioneer',
    scheduledQuantity: 1000,
    nominatedDate: new Date('2023-04-15'),
    loadport: 'Hamburg',
    status: 'in-progress' // Changed from 'nominated' to 'in-progress'
  }
];
