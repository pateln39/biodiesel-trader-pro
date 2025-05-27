
import { useState, useCallback, useMemo } from 'react';

// Extend DateSortColumn to include all the movement date columns and loading period columns
export type DateSortColumn = 
  | 'loading_period_start' 
  | 'loading_period_end'
  | 'nominationEta'
  | 'nominationValid'
  | 'cashFlow'
  | 'blDate'
  | 'codDate';
  
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  column: DateSortColumn;
  direction: SortDirection;
}

export interface DateSortHookResult {
  sortColumns: SortConfig[];
  sortString: string;
  handleSort: (column: DateSortColumn) => void;
  clearSort: () => void;
  getSortParam: () => string;
  // Add the missing properties
  toggleSortColumn: (column: DateSortColumn) => void;
  sortMovements: <T extends Record<string, any>>(items: T[]) => T[];
  hasSorting: boolean;
}

export const useMovementDateSort = (initialSort?: SortConfig[]): DateSortHookResult => {
  const [sortColumns, setSortColumns] = useState<SortConfig[]>(initialSort || []);
  
  const handleSort = useCallback((column: DateSortColumn) => {
    setSortColumns(prevSortColumns => {
      // Check if this column is already being sorted
      const existingIndex = prevSortColumns.findIndex(sc => sc.column === column);
      
      if (existingIndex === -1) {
        // Column is not in the sort list, add it with 'asc' direction
        return [...prevSortColumns, { column, direction: 'asc' }];
      } else {
        // Column is already in the sort list
        const existingConfig = prevSortColumns[existingIndex];
        
        if (existingConfig.direction === 'asc') {
          // Change to 'desc'
          const newSortColumns = [...prevSortColumns];
          newSortColumns[existingIndex] = { column, direction: 'desc' };
          return newSortColumns;
        } else {
          // Remove from sort if already desc
          return prevSortColumns.filter(sc => sc.column !== column);
        }
      }
    });
  }, []);

  // Alias for handleSort to match the expected interface
  const toggleSortColumn = handleSort;
  
  const clearSort = useCallback(() => {
    setSortColumns([]);
  }, []);
  
  // Convert sort columns to a string for API requests
  const sortString = sortColumns.map(sc => `${sc.column}:${sc.direction}`).join(',');
  
  // Format sort parameter for URL
  const getSortParam = useCallback(() => {
    if (sortColumns.length === 0) {
      return '';
    }
    return sortColumns.map(sc => `${sc.column}:${sc.direction}`).join(',');
  }, [sortColumns]);

  // Check if any sorting is active
  const hasSorting = useMemo(() => sortColumns.length > 0, [sortColumns]);
  
  // Sort function for client-side sorting
  const sortMovements = useCallback(<T extends Record<string, any>>(items: T[]): T[] => {
    if (!sortColumns.length) return items;
    
    // Create a new array to avoid mutating the original
    return [...items].sort((a, b) => {
      // Go through each sort column in order
      for (const { column, direction } of sortColumns) {
        // Get values for comparison, handle null/undefined
        const valueA = a[column] ?? '';
        const valueB = b[column] ?? '';
        
        // Skip if both values are empty
        if (!valueA && !valueB) continue;
        
        // Handle date comparison
        if (valueA instanceof Date && valueB instanceof Date) {
          const comparison = valueA.getTime() - valueB.getTime();
          if (comparison !== 0) {
            return direction === 'asc' ? comparison : -comparison;
          }
        } 
        // Handle string comparison
        else if (typeof valueA === 'string' && typeof valueB === 'string') {
          const comparison = valueA.localeCompare(valueB);
          if (comparison !== 0) {
            return direction === 'asc' ? comparison : -comparison;
          }
        }
        // Handle number comparison
        else {
          const comparison = (valueA < valueB) ? -1 : ((valueA > valueB) ? 1 : 0);
          if (comparison !== 0) {
            return direction === 'asc' ? comparison : -comparison;
          }
        }
      }
      return 0; // Equal based on all sort criteria
    });
  }, [sortColumns]);
  
  return { 
    sortColumns, 
    sortString, 
    handleSort, 
    clearSort, 
    getSortParam,
    toggleSortColumn,
    sortMovements,
    hasSorting
  };
};
