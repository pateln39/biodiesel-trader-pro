
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

    // Group tank movements by movement_id for easier processing
    const movementGroups: Record<string, TankMovement[]> = {};
    
    // Sort all movements by date to ensure correct chronological processing
    const sortedMovements = [...tankMovements].sort((a, b) => {
      return new Date(a.movement_date).getTime() - new Date(b.movement_date).getTime();
    });
    
    // Group the sorted movements by movement_id
    sortedMovements.forEach(movement => {
      if (!movementGroups[movement.movement_id]) {
        movementGroups[movement.movement_id] = [];
      }
      movementGroups[movement.movement_id].push(movement);
    });

    // Get unique movement IDs in sorted order by movement date
    const uniqueMovementIds: string[] = [];
    sortedMovements.forEach(m => {
      if (!uniqueMovementIds.includes(m.movement_id)) {
        uniqueMovementIds.push(m.movement_id);
      }
    });

    uniqueMovementIds.forEach(movementId => {
      const currentMovements = movementGroups[movementId] || [];
      let totalMTMovedInStep = 0;

      // Process each tank movement in this step
      currentMovements.forEach(tm => {
        const tankId = tm.tank_id;
        const quantityMT = tm.quantity_mt;
        const quantityM3 = tm.quantity_mt * 1.1;

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
