
import { useState, useMemo } from 'react';
import { getNextMonths } from '@/utils/dateUtils';

export const useExposurePeriods = (numMonths: number = 13) => {
  // Use a stable set of periods for the exposure table
  const [periods] = useState<string[]>(getNextMonths(numMonths));
  
  return {
    periods
  };
};
