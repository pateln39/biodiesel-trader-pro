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
    // Initialize summary object
    const summary = {
      totalMT: 0,
      totalM3: 0,
      t1Balance: 0,
      t2Balance: 0,
      currentStock: 0,
      totalCapacity: 0,
      currentUllage: 0
    };

    // Add up total capacity from all tanks
    tanks.forEach(tank => {
      summary.totalCapacity += tank.capacity_mt;
    });

    // Sort all movements by date to process them chronologically
    const sortedMovements = [...tankMovements].sort(
      (a, b) => new Date(a.movement_date).getTime() - new Date(b.movement_date).getTime()
    );

    // Process each movement in chronological order to maintain running totals
    sortedMovements.forEach((movement) => {
      // Update running totals based on movement quantity
      const quantityMT = movement.quantity_mt;
      
      // Add to current stock
      summary.currentStock += quantityMT;

      // Update T1/T2 balances based on product
      if (movement.product_at_time.includes('T1')) {
        summary.t1Balance += quantityMT;
      } else {
        summary.t2Balance += quantityMT;
      }

      // Update total MT and M3
      summary.totalMT += quantityMT;
      summary.totalM3 += movement.quantity_m3;
    });

    // Calculate ullage (available space)
    summary.currentUllage = summary.totalCapacity - summary.currentStock;

    return summary;
  };

  return {
    calculateTankUtilization,
    calculateSummary
  };
};
