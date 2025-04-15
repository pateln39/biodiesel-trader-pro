
import { TankMovement } from './useInventoryState';
import { Tank } from './useTanks';

export const useTankCalculations = (tanks: Tank[], tankMovements: TankMovement[]) => {
  const calculateTankUtilization = (tank: Tank) => {
    const latestMovement = tankMovements
      .filter(tm => tm.tank_id === tank.id)
      .sort((a, b) => new Date(b.movement_date).getTime() - new Date(a.movement_date).getTime())[0];

    const currentBalance = latestMovement?.balance_mt || 0;
    const utilizationMT = (currentBalance / tank.capacity_mt) * 100;
    const utilizationM3 = (currentBalance * 1.1 / tank.capacity_m3) * 100;

    return {
      currentBalance,
      balanceM3: currentBalance * 1.1,
      utilizationMT,
      utilizationM3
    };
  };

  const calculateSummary = () => {
    const summary = tankMovements.reduce((acc, movement) => {
      const tankItem = tanks.find(t => t.id === movement.tank_id);
      if (!tankItem) return acc;

      // Calculate totals
      acc.totalMT += movement.quantity_mt;
      acc.totalM3 += movement.quantity_m3;

      // Split by customs status (assuming T1 and T2 are the only statuses)
      // Note: customs_status comes from movement data, not from tank movement
      if (movement.product_at_time.includes('T1')) {
        acc.t1Balance += movement.balance_mt;
      } else {
        acc.t2Balance += movement.balance_mt;
      }

      // Current stock and ullage
      acc.currentStock += movement.balance_mt;
      
      if (tankItem) {
        acc.totalCapacity += tankItem.capacity_mt;
      }

      return acc;
    }, {
      totalMT: 0,
      totalM3: 0,
      t1Balance: 0,
      t2Balance: 0,
      currentStock: 0,
      totalCapacity: 0,
      currentUllage: 0
    });

    summary.currentUllage = summary.totalCapacity - summary.currentStock;
    return summary;
  };

  return {
    calculateTankUtilization,
    calculateSummary
  };
};
