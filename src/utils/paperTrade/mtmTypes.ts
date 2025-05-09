
import { PaperTradeLeg } from '@/types/paper';

/**
 * Type definition for paper MTM positions
 */
export interface PaperMTMPosition {
  legId: string;
  tradeRef: string;
  legReference: string;
  buySell: string;
  product: string;
  quantity: number;
  period: string;
  relationshipType: string;
  calculatedPrice: number;
  mtmCalculatedPrice: number;
  mtmValue: number;
  periodType: 'past' | 'current' | 'future';
  rightSide?: {
    product: string;
    price?: number;
  };
}

/**
 * Result of month date extraction
 */
export interface MonthDates {
  startDate: Date;
  endDate: Date;
}
