
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
    // Total capacity of all tanks
    const totalCapacity = tanks.reduce((sum, tank) => sum + tank.capacity_mt, 0);
    
    // Sort movements chronologically
    const sortedMovements = [...tankMovements].sort(
      (a, b) => new Date(a.movement_date).getTime() - new Date(b.movement_date).getTime()
    );
    
    // Group movements by movement_id to know which movements belong to the same row
    const movementGroups = sortedMovements.reduce((groups, movement) => {
      if (!groups[movement.movement_id]) {
        groups[movement.movement_id] = [];
      }
      groups[movement.movement_id].push(movement);
      return groups;
    }, {} as Record<string, TankMovement[]>);
    
    // Get unique movement IDs in chronological order
    const uniqueMovementIds = Array.from(new Set(
      sortedMovements.map(m => m.movement_id)
    ));
    
    // Track running totals per product type
    let runningT1Balance = 0;
    let runningT2Balance = 0;
    
    // Create summary for each movement point
    const movementSummaries: Record<string, any> = {};
    
    // Process each unique movement
    uniqueMovementIds.forEach(movementId => {
      // Find all tank movements for this movement ID
      const currentMovements = movementGroups[movementId] || [];
      
      if (currentMovements.length === 0) return;
      
      // Sum of all tank balances at this point
      let totalBalanceMT = 0;
      let totalBalanceM3 = 0;
      
      // Find the product type of this movement
      const productType = currentMovements[0]?.product_at_time || '';
      const isT1Product = productType.includes('T1');
      
      // Calculate total quantity for this movement
      const movementTotalMT = currentMovements.reduce((sum, tm) => sum + tm.quantity_mt, 0);
      
      // Add to correct product balance
      if (isT1Product) {
        runningT1Balance += movementTotalMT;
      } else {
        runningT2Balance += movementTotalMT;
      }
      
      // Calculate total balance across all tanks at this point
      // This requires checking the latest balance of EACH tank at this point in time
      const tanksLatestBalance = new Map<string, number>();
      
      // First populate the map with the latest balance for each tank up to this movement
      for (const tank of tanks) {
        // Get all movements for this tank up to and including current movement
        const tankMovementsUpToNow = sortedMovements.filter(tm => 
          tm.tank_id === tank.id && 
          (new Date(tm.movement_date) <= new Date(currentMovements[0].movement_date))
        );
        
        // Get the latest balance for this tank
        const latestTankMovement = tankMovementsUpToNow.length > 0 
          ? tankMovementsUpToNow[tankMovementsUpToNow.length - 1] 
          : null;
        
        tanksLatestBalance.set(tank.id, latestTankMovement?.balance_mt || 0);
      }
      
      // Sum up all tank balances to get total inventory at this point
      for (const [, balance] of tanksLatestBalance) {
        totalBalanceMT += balance;
      }
      
      // Calculate M3 equivalent (using 1.1 conversion factor)
      totalBalanceM3 = Number((totalBalanceMT * 1.1).toFixed(2));
      
      // Calculate current ullage
      const currentUllage = totalCapacity - totalBalanceMT;
      
      // Store the summary for this movement
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
    
    // For any movement, find its summary state
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
