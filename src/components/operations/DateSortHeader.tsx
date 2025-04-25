
import React from 'react';
import { ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DateSortColumn } from '@/hooks/useMovementDateSort';

interface DateSortHeaderProps {
  column: DateSortColumn;
  label: string;
  activeSortColumn: DateSortColumn;
  onSort: (column: DateSortColumn) => void;
}

export const DateSortHeader: React.FC<DateSortHeaderProps> = ({
  column,
  label,
  activeSortColumn,
  onSort,
}) => {
  const isActive = column === activeSortColumn;

  return (
    <div className="flex items-center gap-1">
      <span>{label}</span>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-6 w-6 p-0",
          isActive && "text-primary"
        )}
        onClick={() => onSort(isActive ? null : column)}
      >
        <ArrowDown className={cn(
          "h-4 w-4",
          isActive && "text-primary"
        )} />
      </Button>
    </div>
  );
};
