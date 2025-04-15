
import { TankMovement } from './useInventoryState';
import { Tank } from './useTanks';

export const useTankCalculations = (tanks: Tank[], tankMovements: TankMovement[]) => {
  const calculateTankUtilization = (tank: Tank) => {
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
    const summary = tankMovements.reduce((acc, movement) => {
      const tankItem = tanks.find(t => t.id === movement.tank_id);
      if (!tankItem) return acc;

      // Calculate totals with rounded M3
      acc.totalMT += movement.quantity_mt;
      acc.totalM3 += Number((movement.quantity_m3).toFixed(2));

      if (movement.product_at_time.includes('T1')) {
        acc.t1Balance += movement.balance_mt;
      } else {
        acc.t2Balance += movement.balance_mt;
      }

      // Current stock per tank
      const isLatestMovement = tankMovements
        .filter(tm => tm.tank_id === movement.tank_id)
        .sort((a, b) => new Date(b.movement_date).getTime() - new Date(a.movement_date).getTime())[0]?.id === movement.id;

      if (isLatestMovement) {
        acc.currentStock += movement.balance_mt;
      }
      
      // Only add capacity once per tank
      if (!acc.processedTanks.includes(tankItem.id)) {
        acc.totalCapacity += tankItem.capacity_mt;
        acc.processedTanks.push(tankItem.id);
      }

      return acc;
    }, {
      totalMT: 0,
      totalM3: 0,
      t1Balance: 0,
      t2Balance: 0,
      currentStock: 0,
      totalCapacity: 0,
      currentUllage: 0,
      processedTanks: [] as string[]
    });

    // Calculate ullage after all tanks have been processed
    summary.currentUllage = summary.totalCapacity - summary.currentStock;
    delete summary.processedTanks; // Remove helper array before returning

    return summary;
  };

  return {
    calculateTankUtilization,
    calculateSummary
  };
};
