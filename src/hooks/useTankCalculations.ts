
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

    // Create a mapping from terminal_assignment_id to movement_id for easier lookup
    const assignmentToMovementMap: Record<string, string> = {};
    
    // Group tank movements by terminal_assignment_id for easier processing
    const movementGroups: Record<string, TankMovement[]> = {};
    
    // First, group all tank movements by terminal_assignment_id or movement_id if terminal_assignment_id is null
    tankMovements.forEach(tm => {
      const groupKey = tm.terminal_assignment_id || tm.movement_id;
      if (groupKey) {
        if (!movementGroups[groupKey]) {
          movementGroups[groupKey] = [];
        }
        movementGroups[groupKey].push(tm);
        
        // Store the mapping from assignment to movement
        if (tm.terminal_assignment_id && tm.movement_id) {
          assignmentToMovementMap[tm.terminal_assignment_id] = tm.movement_id;
        }
      }
    });
    
    // Get unique group IDs in sorted order by movement date
    const uniqueGroupIds = Object.keys(movementGroups);
    const sortedGroupIds = [...uniqueGroupIds].sort((a, b) => {
      const aMovements = movementGroups[a];
      const bMovements = movementGroups[b];
      
      if (!aMovements.length || !bMovements.length) return 0;
      
      const aDate = new Date(aMovements[0].movement_date).getTime();
      const bDate = new Date(bMovements[0].movement_date).getTime();
      
      return aDate - bDate;
    });

    sortedGroupIds.forEach(groupId => {
      const currentMovements = movementGroups[groupId] || [];
      let totalMTMovedInStep = 0;
      
      // Determine the movement_id associated with this group
      // If groupId is a terminal_assignment_id, look it up, otherwise use groupId as movement_id
      const movementId = assignmentToMovementMap[groupId] || groupId;
      
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
