
import { useState, useCallback } from 'react';
import { Movement } from '@/types';

export type DateSortColumn = 
  | 'loadingPeriodStart' 
  | 'loadingPeriodEnd' 
  | 'nominationEta' 
  | 'nominationValid' 
  | 'cashFlow' 
  | 'blDate' 
  | 'codDate'
  | null;

export const useMovementDateSort = () => {
  const [activeSortColumn, setActiveSortColumn] = useState<DateSortColumn>(null);

  const sortMovements = useCallback((movements: Movement[]) => {
    if (!activeSortColumn || !movements.length) return movements;

    console.log(`[MOVEMENTS] Sorting by ${activeSortColumn}`);

    return [...movements].sort((a, b) => {
      const dateA = a[activeSortColumn];
      const dateB = b[activeSortColumn];

      // Handle cases where dates might be undefined/null
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1; // Push null dates to the end
      if (!dateB) return -1;

      // Sort in descending order (most recent first)
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [activeSortColumn]);

  return {
    activeSortColumn,
    setActiveSortColumn,
    sortMovements,
  };
};
