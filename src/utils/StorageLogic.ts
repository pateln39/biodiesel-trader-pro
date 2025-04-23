
import { Tank } from '@/hooks/useTanks';
import { TankMovement } from '@/hooks/useInventoryState';
import { Movement, MovementSummary } from '@/types';

/**
 * Utility functions for storage calculations and logic
 */
export const StorageLogic = {
  /**
   * Calculates the total sticky width for the fixed columns
   */
  calculateTotalStickyWidth: (columnWidths: Record<string, number>): number => {
    return Object.values(columnWidths).reduce((sum, width) => sum + width, 0);
  },

  /**
   * Check if a tank movement exists for a specific movement and tank
   */
  getTankMovementForTank: (
    tankMovements: TankMovement[], 
    movementId: string, 
    tankId: string
  ): TankMovement | undefined => {
    return tankMovements.find(
      tm => tm.movement_id === movementId && tm.tank_id === tankId
    );
  },

  /**
   * Format a date string to a localized date string
   */
  formatDate: (dateString?: string): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  },

  /**
   * Round a number to a specific precision
   */
  roundNumber: (num: number, precision: number = 0): number => {
    return Math.round(num * (10 ** precision)) / (10 ** precision);
  },

  /**
   * Get the current terminal name
   */
  getCurrentTerminalName: (terminals: any[], selectedTerminalId?: string): string => {
    return terminals.find(t => t.id === selectedTerminalId)?.name || 'selected terminal';
  },
};

export default StorageLogic;
