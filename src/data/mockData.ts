
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
    quantity: 1000
  },
  {
    id: '2',
    tradeId: '456',
    movementReference: 'MOV-002',
    status: 'Completed',
    nominatedDate: new Date('2024-04-10'),
    quantity: 750
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
    userId: 'user1'
  },
  {
    id: '2',
    recordId: '123',
    tableName: 'trades',
    operation: 'UPDATE',
    timestamp: new Date('2024-04-02T11:45:00'),
    userId: 'user2'
  }
];
