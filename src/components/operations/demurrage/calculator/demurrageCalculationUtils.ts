/**
 * Lookup tables and utility functions for demurrage calculations
 */

// Laytime table (loaded quantity to total laytime hours)
// The key is the minimum quantity. The laytime applies to any quantity >= the key
export const laytimeTable: [number, number][] = [
  [0, 24],      // 0-1100 MT: 24 hours
  [1100, 26],   // 1100-1500 MT: 26 hours
  [1501, 28],   // 1501-2000 MT: 28 hours
  [2001, 34],   // 2001-3000 MT: 34 hours
  [3001, 40],   // 3001-4000 MT: 40 hours
  [4001, 46],   // 4001-5000 MT: 46 hours
  [5001, 50],   // 5001-6000 MT: 50 hours
  [6001, 54],   // 6001-7000 MT: 54 hours
  [7001, 58],   // 7001-8000 MT: 58 hours
  [8001, 62],   // 8001-9000 MT: 62 hours
];

// Rate table (DWT or loaded quantity to rate in euros per hour)
// The key is the minimum value. The rate applies to any value >= the key
export const rateTable: [number, number][] = [
  [0, 60],      // 0-500: €60/hour
  [501, 80],    // 501-1000: €80/hour
  [1001, 100],  // 1001-1500: €100/hour
  [1501, 120],  // 1501-2000: €120/hour
  [2001, 140],  // 2001-2500: €140/hour
  [2501, 160],  // 2501-3000: €160/hour
  [3001, 180],  // 3001-3500: €180/hour
  [3501, 200],  // 3501-4000: €200/hour
  [4001, 220],  // 4001-4500: €220/hour
  [4501, 240],  // 4501-5000: €240/hour
  [5001, 260],  // 5001-5500: €260/hour
  [5501, 280],  // 5501-6000: €280/hour
  [6001, 300],  // 6001-6500: €300/hour
  [6501, 320],  // 6501-7000: €320/hour
  [7001, 340],  // 7001-7500: €340/hour
  [7501, 360],  // 7501-8000: €360/hour
  [8001, 380],  // 8001-8500: €380/hour
  [8501, 400],  // 8501-9000: €400/hour
];

/**
 * Looks up the applicable laytime based on loaded quantity
 * @param loadedQuantity - The quantity loaded in MT
 * @returns Total laytime hours
 */
export const calculateTotalLaytime = (loadedQuantity: number): number => {
  if (isNaN(loadedQuantity) || loadedQuantity < 0) return 0;

  // Find the applicable laytime in the table
  for (let i = laytimeTable.length - 1; i >= 0; i--) {
    const [minQuantity, laytime] = laytimeTable[i];
    if (loadedQuantity >= minQuantity) {
      return laytime;
    }
  }
  return laytimeTable[0][1]; // Default to lowest laytime if no match
};

/**
 * Looks up the applicable rate based on the calculation method and value
 * @param calculationRate - The rate calculation method (TTB or BP)
 * @param deadWeight - The barge deadweight tonnage (for TTB)
 * @param loadedQuantity - The actual loaded quantity (for BP)
 * @returns Rate in euros per hour
 * 
 * Example: For a TTB deal with barge deadweight of 5000, the rate would be €200/hour
 * as per the rateTable (entry [5000, 200])
 */
export const calculateRate = (
  calculationRate: 'TTB' | 'BP', 
  deadWeight: number, 
  loadedQuantity: number
): number => {
  // Determine which value to use for lookup based on calculation method
  const lookupValue = calculationRate === 'TTB' ? deadWeight : loadedQuantity;
  
  if (isNaN(lookupValue) || lookupValue < 0) return 0;
  
  // Find the applicable rate in the table
  for (let i = rateTable.length - 1; i >= 0; i--) {
    const [minValue, rate] = rateTable[i];
    if (lookupValue >= minValue) {
      return rate;
    }
  }
  return rateTable[0][1]; // Default to lowest rate if no match
};

/**
 * Calculates time saved at port
 * @param portHours - Total hours used at port
 * @param allowedLaytime - Allowed laytime for this port (half of total laytime)
 * @returns Time saved in hours (0 if port hours exceed allowed laytime)
 * 
 * Note: This function already correctly returns 0 when there is no time saved 
 * (when port hours exceed allowed laytime). The UI component should display "0.00"
 * in this case.
 */
export const calculateTimeSaved = (portHours: number, allowedLaytime: number): number => {
  if (portHours >= allowedLaytime) {
    return 0; // No time saved if port hours exceed allowed laytime
  }
  return Number((allowedLaytime - portHours).toFixed(2));
};

/**
 * Calculates demurrage hours used at port
 * @param portHours - Total hours used at port
 * @param allowedLaytime - Allowed laytime for this port (half of total laytime)
 * @returns Demurrage hours (0 if port hours are less than allowed laytime)
 */
export const calculateDemurrageHours = (portHours: number, allowedLaytime: number): number => {
  if (portHours <= allowedLaytime) {
    return 0; // No demurrage if within allowed laytime
  }
  return Number((portHours - allowedLaytime).toFixed(2));
};
