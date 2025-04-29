
/**
 * Lookup tables and utility functions for demurrage calculations
 */

// Laytime table (loaded quantity to total laytime hours)
// The key is the minimum quantity. The laytime applies to any quantity >= the key
export const laytimeTable: [number, number][] = [
  [0, 24],     // 0-500 MT: 24 hours
  [500, 26],   // 500-1000 MT: 26 hours
  [1000, 28],  // 1000-1500 MT: 28 hours
  [1500, 30],  // 1500-2000 MT: 30 hours
  [2000, 34],  // 2000-2500 MT: 34 hours
  [2500, 40],  // 2500-3000 MT: 40 hours
  [3000, 44],  // 3000-3500 MT: 44 hours
  [3500, 48],  // 3500+ MT: 48 hours
];

// Rate table (DWT or loaded quantity to rate in euros per hour)
// The key is the minimum value. The rate applies to any value >= the key
export const rateTable: [number, number][] = [
  [0, 100],     // 0-1000: €100/hour
  [1000, 120],  // 1000-2000: €120/hour
  [2000, 140],  // 2000-3000: €140/hour
  [3000, 160],  // 3000-4000: €160/hour
  [4000, 180],  // 4000-5000: €180/hour
  [5000, 200],  // 5000+ MT: €200/hour
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
