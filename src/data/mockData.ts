
// Import from the correct module locations
import { Movement, AuditLog } from '@/types/common';

// Sample movement data
export const mockMovements: Movement[] = [
  {
    id: '1',
    tradeId: '123',
    movementReference: 'MOV-001',
    status: 'Scheduled',
    nominatedDate: new Date('2024-04-15'),
    quantity: 1000,
    scheduledQuantity: 1000,
    vesselName: 'Vessel Alpha',
    loadport: 'Rotterdam'
  },
  {
    id: '2',
    tradeId: '456',
    movementReference: 'MOV-002',
    status: 'Completed',
    nominatedDate: new Date('2024-04-10'),
    quantity: 750,
    scheduledQuantity: 750,
    vesselName: 'Vessel Beta',
    loadport: 'Amsterdam'
  }
];

// Sample audit log data
export const mockAuditLogs: AuditLog[] = [
  {
    id: '1',
    recordId: '123',
    tableName: 'trades',
    operation: 'INSERT',
    timestamp: new Date('2024-04-01T10:30:00'),
    userId: 'user1',
    entityType: 'Trade',
    entityId: '123',
    field: 'status',
    oldValue: null,
    newValue: 'active'
  },
  {
    id: '2',
    recordId: '123',
    tableName: 'trades',
    operation: 'UPDATE',
    timestamp: new Date('2024-04-02T11:45:00'),
    userId: 'user2',
    entityType: 'Trade',
    entityId: '123',
    field: 'quantity',
    oldValue: '800',
    newValue: '850'
  }
];

// Sample physical trades for operations page
export const mockPhysicalTrades = [
  {
    id: '123',
    tradeReference: 'PT-2024-001',
    counterparty: 'Company A',
    product: 'UCOME',
    quantity: 1000,
    unit: 'MT',
    tolerance: 5,
    loadingPeriodStart: new Date('2024-04-15'),
    loadingPeriodEnd: new Date('2024-04-25')
  },
  {
    id: '456',
    tradeReference: 'PT-2024-002',
    counterparty: 'Company B',
    product: 'RME',
    quantity: 750,
    unit: 'MT',
    tolerance: 3,
    loadingPeriodStart: new Date('2024-04-10'),
    loadingPeriodEnd: new Date('2024-04-20')
  }
];
