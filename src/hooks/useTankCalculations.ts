
import { TankMovement } from './useInventoryState';
import { Tank } from './useTanks';

interface TankState {
  balanceMT: number;
  balanceM3: number;
}

interface MovementSummary {
  movementId: string;
  tankBalances: Record<string, TankState>;
  totalMTMoved: number;
  currentStockMT: number;
  currentStockM3: number;
  currentUllage: number;
  t1Balance: number;
  t2Balance: number;
}

export const useTankCalculations = (tanks: Tank[], tankMovements: TankMovement[]) => {
  const calculateTankUtilization = (tank: Tank) => {
    // Calculate current balance by summing all movements for this tank
    const currentBalance = tankMovements
      .filter(tm => tm.tank_id === tank.id)
      .reduce((sum, tm) => sum + tm.quantity_mt, 0);

    const utilizationMT = (currentBalance / tank.capacity_mt) * 100;
    const balanceM3 = Number((currentBalance * 1.1).toFixed(2));
    const utilizationM3 = (balanceM3 / tank.capacity_m3) * 100;

    return {
      currentBalance,
      balanceM3,
      utilizationMT,
      utilizationM3
    };
  };

  const calculateSummary = () => {
    const totalCapacity = tanks.reduce((sum, tank) => sum + tank.capacity_mt, 0);
    const movementSummaries: Record<string, MovementSummary> = {};
    const tankRunningBalances: Record<string, TankState> = {};
    let runningT1Balance = 0;
    let runningT2Balance = 0;

    // Initialize tank balances
    tanks.forEach(tank => {
      tankRunningBalances[tank.id] = { balanceMT: 0, balanceM3: 0 };
    });

    // Group tank movements by assignment_id first (this respects the user-defined order)
    // Falling back to movement_id for backwards compatibility
    const movementGroups: Record<string, TankMovement[]> = {};
    
    // First, group all tank movements by assignment_id or movement_id
    tankMovements.forEach(tm => {
      // Prefer assignment_id if available, otherwise use movement_id
      const groupKey = tm.assignment_id || tm.movement_id;
      if (!groupKey) return; // Skip if both are undefined
      
      if (!movementGroups[groupKey]) {
        movementGroups[groupKey] = [];
      }
      movementGroups[groupKey].push(tm);
    });
    
    // Get unique movement/assignment IDs in sorted order by:
    // 1. First by assignment sort_order if available
    // 2. Then by movement date
    const uniqueKeys = Object.keys(movementGroups);
    
    // Get associated sort orders (from assignments) or dates for sorting
    const keysWithOrder = uniqueKeys.map(key => {
      const movements = movementGroups[key];
      const firstMovement = movements[0];
      return {
        key,
        // Get date from first movement in group
        date: new Date(firstMovement.movement_date).getTime(),
        // We'll sort based on the associated movement/assignment
        movementId: firstMovement.movement_id
      };
    });
    
    // Sort by date (we're already using sortable assignments in the UI)
    keysWithOrder.sort((a, b) => a.date - b.date);
    
    // Now we have our keys in the right order
    const sortedKeys = keysWithOrder.map(item => item.key);

    sortedKeys.forEach(key => {
      const currentMovements = movementGroups[key] || [];
      const movementId = currentMovements.length > 0 ? currentMovements[0].movement_id : '';
      let totalMTMovedInStep = 0;
      
      // Process each tank movement in this step
      currentMovements.forEach(tm => {
        const tankId = tm.tank_id;
        const quantityMT = tm.quantity_mt;
        const quantityM3 = tm.quantity_m3;

        // Update running balances
        if (tankRunningBalances[tankId]) {
          tankRunningBalances[tankId].balanceMT += quantityMT;
          tankRunningBalances[tankId].balanceM3 = Number((tankRunningBalances[tankId].balanceMT * 1.1).toFixed(2));
          totalMTMovedInStep += quantityMT;
        }

        // Update T1/T2 balances based on customs status
        if (tm.customs_status === 'T1') {
          runningT1Balance += quantityMT;
        } else {
          runningT2Balance += quantityMT;
        }
      });

      // Calculate current stock and ullage after this step
      const currentStockMT = Object.values(tankRunningBalances).reduce((sum, state) => sum + state.balanceMT, 0);
      const currentStockM3 = Object.values(tankRunningBalances).reduce((sum, state) => sum + state.balanceM3, 0);
      const currentUllage = totalCapacity - currentStockMT;

      // Only store the summary if we have a valid movement ID
      if (movementId) {
        // Store the summary for this movement
        movementSummaries[movementId] = {
          movementId,
          tankBalances: JSON.parse(JSON.stringify(tankRunningBalances)), // Deep copy of current balances
          totalMTMoved: totalMTMovedInStep,
          currentStockMT,
          currentStockM3,
          currentUllage,
          t1Balance: runningT1Balance,
          t2Balance: runningT2Balance
        };
      }
    });

    const getSummaryForMovement = (movementId: string) => {
      return movementSummaries[movementId] || {
        tankBalances: Object.fromEntries(
          tanks.map(tank => [tank.id, { balanceMT: 0, balanceM3: 0 }])
        ),
        totalMTMoved: 0,
        currentStockMT: 0,
        currentStockM3: 0,
        currentUllage: totalCapacity,
        t1Balance: 0,
        t2Balance: 0
      };
    };

    return {
      getSummaryForMovement,
      totalCapacity
    };
  };

  return {
    calculateTankUtilization,
    calculateSummary
  };
};
