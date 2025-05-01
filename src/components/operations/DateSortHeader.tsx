
import React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DateSortColumn, SortConfig } from '@/hooks/useMovementDateSort';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DateSortHeaderProps {
  column: DateSortColumn;
  label: string;
  sortColumns: SortConfig[];
  onSort: (column: DateSortColumn) => void;
}

export const DateSortHeader: React.FC<DateSortHeaderProps> = ({
  column,
  label,
  sortColumns,
  onSort,
}) => {
  // Find if this column is currently being sorted
  const sortIndex = sortColumns.findIndex(sc => sc.column === column);
  const isActive = sortIndex > -1;
  
  // Get the sort direction if active
  const sortDirection = isActive ? sortColumns[sortIndex].direction : null;
  
  // Get the sort priority (1-based index) if active
  const sortPriority = isActive ? sortIndex + 1 : null;

  return (
    <div className="flex items-center gap-1">
      <span>{label}</span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6 p-0 relative",
                isActive && "text-primary"
              )}
              onClick={() => onSort(column)}
            >
              {sortDirection === 'asc' ? (
                <ArrowUp className="h-4 w-4" />
              ) : (
                <ArrowDown className={cn(
                  "h-4 w-4",
                  isActive && sortDirection === 'desc' ? "" : "opacity-50"
                )} />
              )}
              
              {/* Show sort priority if active */}
              {isActive && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-4 h-4 text-xs flex items-center justify-center">
                  {sortPriority}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            {isActive 
              ? `Sorted ${sortPriority === 1 ? 'primarily' : `(${sortPriority})`} by ${label} (${sortDirection === 'asc' ? 'oldest first' : 'newest first'})`
              : `Sort by ${label}`}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
