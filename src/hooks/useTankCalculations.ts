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
    const totalCapacity = tanks.reduce((sum, tank) => sum + tank.capacity_mt, 0);
    
    const sortedMovements = [...tankMovements].sort(
      (a, b) => new Date(a.movement_date).getTime() - new Date(b.movement_date).getTime()
    );
    
    const movementGroups = sortedMovements.reduce((groups, movement) => {
      if (!groups[movement.movement_id]) {
        groups[movement.movement_id] = [];
      }
      groups[movement.movement_id].push(movement);
      return groups;
    }, {} as Record<string, TankMovement[]>);
    
    const uniqueMovementIds = Array.from(new Set(
      sortedMovements.map(m => m.movement_id)
    ));
    
    let runningT1Balance = 0;
    let runningT2Balance = 0;
    
    const movementSummaries: Record<string, any> = {};
    
    uniqueMovementIds.forEach(movementId => {
      const currentMovements = movementGroups[movementId] || [];
      
      if (currentMovements.length === 0) return;
      
      const productType = currentMovements[0]?.product_at_time || '';
      const isT1Product = productType.includes('T1');
      
      const movementTotalMT = currentMovements.reduce((sum, tm) => sum + tm.quantity_mt, 0);
      
      if (isT1Product) {
        runningT1Balance += movementTotalMT;
      } else {
        runningT2Balance += movementTotalMT;
      }

      let totalBalanceMT = 0;
      
      currentMovements.forEach(tm => {
        totalBalanceMT += tm.balance_mt;
      });
      
      const totalBalanceM3 = Number((totalBalanceMT * 1.1).toFixed(2));
      const currentUllage = totalCapacity - totalBalanceMT;
      
      movementSummaries[movementId] = {
        movementId,
        totalMT: totalBalanceMT,
        totalM3: totalBalanceM3,
        t1Balance: runningT1Balance,
        t2Balance: runningT2Balance,
        currentStock: totalBalanceMT,
        totalCapacity,
        currentUllage: currentUllage
      };
    });
    
    const getSummaryForMovement = (movementId: string) => {
      return movementSummaries[movementId] || {
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
