// Import from the correct module locations
import { Movement, AuditLog } from '@/types/common';

// Sample movement data - keeping the structure but emptying the arrays
export const mockMovements: Movement[] = [];

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

// Sample physical trades for operations page - keeping the structure but emptying the array
export const mockPhysicalTrades = [];
