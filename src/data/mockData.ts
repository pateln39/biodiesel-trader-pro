
// Import types from their correct locations
import { TradeType, BuySell, Unit, PhysicalType, Product } from '@/modules/trade/types/common';
import { PhysicalTrade, IncoTerm, PaymentTerm, CreditStatus } from '@/modules/trade/types';
import { PaperTrade } from '@/modules/trade/types';
import { AuditLog } from '@/core/types/common';
import { MovementStatus } from '@/modules/operations/types/movement';

// Add Movement type 
export interface Movement {
  id: string;
  tradeId: string;
  vesselName: string;
  scheduledQuantity: number;
  nominatedDate: Date;
  loadport: string;
  status: string;
}

// Mock data for audit logs
export const mockAuditLogs: AuditLog[] = [
  {
    id: '1',
    table_name: 'trade',
    record_id: 'TR-1234',
    operation: 'UPDATE',
    old_data: { quantity: '100' },
    new_data: { quantity: '150' },
    timestamp: new Date('2023-03-15T10:30:00'),
    user_id: 'user1@example.com'
  },
  {
    id: '2',
    table_name: 'trade',
    record_id: 'TR-1236',
    operation: 'UPDATE',
    old_data: { counterparty: 'Acme Corp' },
    new_data: { counterparty: 'Beta Industries' },
    timestamp: new Date('2023-03-14T14:22:00'),
    user_id: 'user2@example.com'
  },
  {
    id: '3',
    table_name: 'trade',
    record_id: 'PAY-789',
    operation: 'UPDATE',
    old_data: { status: 'pending' },
    new_data: { status: 'completed' },
    timestamp: new Date('2023-03-12T09:45:00'),
    user_id: 'user1@example.com'
  }
];

// Mock data for physical trades - updated to match PhysicalTrade interface
export const mockPhysicalTrades: PhysicalTrade[] = [
  {
    id: 'PT001',
    tradeType: TradeType.Physical,
    physicalType: PhysicalType.Spot,
    tradeReference: 'PHY-2023-001',
    counterparty: 'EcoFuels GmbH',
    buySell: BuySell.Buy,
    product: Product.FAME,
    sustainability: 'ISCC EU',
    incoTerm: IncoTerm.FOB,
    quantity: 1000,
    unit: Unit.MT,
    tolerance: 2.5,
    loadingPeriodStart: new Date('2023-04-01'),
    loadingPeriodEnd: new Date('2023-04-15'),
    pricingPeriodStart: new Date('2023-04-01'),
    pricingPeriodEnd: new Date('2023-04-15'),
    paymentTerm: PaymentTerm.ThirtyDays,
    creditStatus: CreditStatus.Approved,
    createdAt: new Date('2023-03-10'),
    updatedAt: new Date('2023-03-10'),
    legs: []
  },
  {
    id: 'PT002',
    tradeType: TradeType.Physical,
    physicalType: PhysicalType.Spot,
    tradeReference: 'PHY-2023-002',
    counterparty: 'Renewable Energy Corp',
    buySell: BuySell.Sell,
    product: Product.RME,
    sustainability: 'ISCC EU',
    incoTerm: IncoTerm.CIF,
    quantity: 2000,
    unit: Unit.MT,
    tolerance: 5,
    loadingPeriodStart: new Date('2023-04-10'),
    loadingPeriodEnd: new Date('2023-04-20'),
    pricingPeriodStart: new Date('2023-04-10'),
    pricingPeriodEnd: new Date('2023-04-20'),
    paymentTerm: PaymentTerm.ThirtyDays,
    creditStatus: CreditStatus.Approved,
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
    status: 'in-progress'
  }
];
