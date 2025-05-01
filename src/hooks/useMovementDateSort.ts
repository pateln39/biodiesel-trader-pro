
import { useState, useCallback } from 'react';
import { Movement } from '@/types';

export type DateSortColumn = 
  | 'loading_period_start' 
  | 'loading_period_end' 
  | 'nominationEta' 
  | 'nominationValid' 
  | 'cashFlow' 
  | 'blDate' 
  | 'codDate'
  | null;

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  column: DateSortColumn;
  direction: SortDirection;
}

export const useMovementDateSort = () => {
  const [sortColumns, setSortColumns] = useState<SortConfig[]>([]);

  const toggleSortColumn = useCallback((column: DateSortColumn) => {
    if (!column) return;

    setSortColumns(prevSortColumns => {
      // Find if column is already in the sort config
      const existingColumnIndex = prevSortColumns.findIndex(sc => sc.column === column);

      // Clone the array to avoid mutating state directly
      const updatedSortColumns = [...prevSortColumns];

      if (existingColumnIndex >= 0) {
        // Column exists in sort config - toggle direction or remove
        const currentConfig = updatedSortColumns[existingColumnIndex];
        
        if (currentConfig.direction === 'desc') {
          // If already descending, remove from sort
          updatedSortColumns.splice(existingColumnIndex, 1);
        } else {
          // If ascending, change to descending
          updatedSortColumns[existingColumnIndex] = {
            ...currentConfig,
            direction: 'desc'
          };
        }
      } else {
        // Column is not in sort config - add it with ascending direction
        updatedSortColumns.push({
          column,
          direction: 'asc'
        });
      }

      return updatedSortColumns;
    });
  }, []);

  const sortMovements = useCallback((movements: Movement[]) => {
    if (!sortColumns.length || !movements.length) return movements;

    console.log(`[MOVEMENTS] Sorting by multiple columns: ${sortColumns.map((sc, i) => 
      `${i+1}. ${sc.column} (${sc.direction})`).join(', ')}`);

    return [...movements].sort((a, b) => {
      // Try each sort column in sequence
      for (const { column, direction } of sortColumns) {
        const dateA = a[column];
        const dateB = b[column];

        // Skip if both dates are null/undefined for this column
        if (!dateA && !dateB) continue;
        
        // Handle cases where only one date is null/undefined
        if (!dateA) return direction === 'asc' ? 1 : -1;
        if (!dateB) return direction === 'asc' ? -1 : 1;

        // Compare dates based on sort direction
        const comparison = new Date(dateA).getTime() - new Date(dateB).getTime();
        const result = direction === 'asc' ? comparison : -comparison;

        // If we found a difference, return the result
        if (result !== 0) return result;
      }
      
      // If all columns compared have equal values, maintain original order
      return 0;
    });
  }, [sortColumns]);

  // For compatibility with existing code
  const activeSortColumn = sortColumns.length > 0 ? sortColumns[0].column : null;

  return {
    sortColumns,
    activeSortColumn, // For backward compatibility
    toggleSortColumn,
    sortMovements,
    hasSorting: sortColumns.length > 0
  };
};
