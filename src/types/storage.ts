
import { Movement } from '@/hooks/useInventoryState';

export interface TankUtilization {
  currentBalance: number;
  balanceM3: number;
  utilizationMT: number;
  utilizationM3: number;
}

export interface TankState {
  balanceMT: number;
  balanceM3: number;
}

export interface MovementSummary {
  movementId: string;
  tankBalances: Record<string, TankState>;
  totalMTMoved: number;
  currentStockMT: number;
  currentStockM3: number;
  currentUllage: number;
  t1Balance: number;
  t2Balance: number;
}

export interface TableColumnWidth {
  counterparty: number;
  tradeRef: number;
  bargeName: number;
  movementDate: number;
  nominationDate: number;
  customs: number;
  sustainability: number;
  comments: number;
  quantity: number;
}

export interface SummaryColumnWidth {
  totalMT: number;
  totalM3: number;
  t1Balance: number;
  t2Balance: number;
  currentStock: number;
  currentUllage: number;
  difference: number;
}

export interface TableHeaderLabels {
  counterparty: string;
  tradeRef: string;
  bargeName: string;
  movementDate: string;
  nominationDate: string;
  customs: string;
  sustainability: string;
  comments: string;
  quantity: string;
  totalMT: string;
  totalM3: string;
  t1Balance: string;
  t2Balance: string;
  currentStock: string;
  currentUllage: string;
  difference: string;
}
