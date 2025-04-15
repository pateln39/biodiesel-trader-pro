
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

    // Get latest movements per tank to calculate current balances
    const latestTankMovements = tanks.map(tank => {
      const tankLatestMovement = tankMovements
        .filter(tm => tm.tank_id === tank.id)
        .sort((a, b) => new Date(b.movement_date).getTime() - new Date(a.movement_date).getTime())[0];
      
      return {
        tank,
        latestMovement: tankLatestMovement
      };
    });

    // Calculate totals from latest movements
    latestTankMovements.forEach(({ tank, latestMovement }) => {
      // Add to total capacity
      summary.totalCapacity += tank.capacity_mt;

      if (latestMovement) {
        // Add to current stock
        summary.currentStock += latestMovement.balance_mt;

        // Add to T1/T2 balances based on product
        if (latestMovement.product_at_time.includes('T1')) {
          summary.t1Balance += latestMovement.balance_mt;
        } else {
          summary.t2Balance += latestMovement.balance_mt;
        }

        // Add to total MT and M3
        summary.totalMT += latestMovement.quantity_mt;
        summary.totalM3 += Number(latestMovement.quantity_m3.toFixed(2));
      }
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
