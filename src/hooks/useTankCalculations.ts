
import { TankMovement } from './useInventoryState';
import { Tank } from './useTanks';

export const useTankCalculations = (tanks: Tank[], tankMovements: TankMovement[]) => {
  const calculateTankUtilization = (tank: Tank) => {
    // Get the latest movement for this tank
    const latestMovement = tankMovements
      .filter(tm => tm.tank_id === tank.id)
      .sort((a, b) => new Date(b.movement_date).getTime() - new Date(a.movement_date).getTime())[0];

    const currentBalance = latestMovement?.balance_mt || 0;
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
    // Sort all movements by date
    const sortedMovements = [...tankMovements].sort(
      (a, b) => new Date(a.movement_date).getTime() - new Date(b.movement_date).getTime()
    );

    // Initialize running totals
    const totalCapacity = tanks.reduce((sum, tank) => sum + tank.capacity_mt, 0);
    let runningTotalMT = 0;
    let runningTotalM3 = 0;
    let runningT1Balance = 0;
    let runningT2Balance = 0;
    let runningCurrentStock = 0;

    // Calculate summary for each movement point in time
    const movementSummaries = sortedMovements.map(movement => {
      // Update running totals based on current movement
      const quantityMT = movement.quantity_mt;
      runningTotalMT += quantityMT;
      runningTotalM3 += movement.quantity_m3;
      runningCurrentStock += quantityMT;

      // Update T1/T2 balances based on product
      if (movement.product_at_time.includes('T1')) {
        runningT1Balance += quantityMT;
      } else {
        runningT2Balance += quantityMT;
      }

      // Create summary state for this point in time
      return {
        movementId: movement.movement_id,
        totalMT: runningTotalMT,
        totalM3: runningTotalM3,
        t1Balance: runningT1Balance,
        t2Balance: runningT2Balance,
        currentStock: runningCurrentStock,
        totalCapacity,
        currentUllage: totalCapacity - runningCurrentStock
      };
    });

    // For any movement, find its summary state
    const getSummaryForMovement = (movementId: string) => {
      return movementSummaries.find(summary => summary.movementId === movementId) || {
        totalMT: 0,
        totalM3: 0,
        t1Balance: 0,
        t2Balance: 0,
        currentStock: 0,
        totalCapacity,
        currentUllage: totalCapacity
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
