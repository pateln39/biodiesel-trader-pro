
import { 
  MonthlyDistribution 
} from '@/types/pricing';
import { Instrument } from '@/types/common';

// Add a helper function to create an empty exposures object with all instruments initialized to 0
export function createEmptyExposures(): Record<Instrument, number> {
  return {
    'Argus UCOME': 0,
    'Argus RME': 0,
    'Argus FAME0': 0,
    'Argus HVO': 0,
    'Platts LSGO': 0,
    'Platts Diesel': 0,
    'ICE GASOIL FUTURES': 0
  };
}

// Add a function to safely get monthly distributions
export function safeGetMonthlyDistribution(
  exposures: any, 
  type: 'physical' | 'pricing'
): Record<string, MonthlyDistribution> {
  if (!exposures || !exposures.monthlyDistribution) {
    return {};
  }
  
  // Filter the monthly distribution to only include the requested type
  const result: Record<string, MonthlyDistribution> = {};
  
  // Iterate through instruments
  Object.keys(exposures.monthlyDistribution).forEach(instrument => {
    // Only include instruments that match the type we want
    if (exposures[type] && exposures[type][instrument] !== undefined) {
      result[instrument] = exposures.monthlyDistribution[instrument];
    }
  });
  
  return result;
}
