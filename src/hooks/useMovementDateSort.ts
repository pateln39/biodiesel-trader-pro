
import { useState, useCallback } from 'react';

export type DateSortColumn = 'loading_period_start' | 'loading_period_end';
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
  
  return { sortColumns, sortString, handleSort, clearSort, getSortParam };
};
