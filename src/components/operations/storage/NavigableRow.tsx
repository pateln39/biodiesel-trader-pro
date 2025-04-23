
import React from 'react';
import { cn } from '@/lib/utils';
import { CellPosition } from '@/hooks/useCellNavigation';

interface NavigableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  row: number;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  activeCell?: CellPosition | null;
}

const NavigableRow: React.FC<NavigableRowProps> = ({
  row,
  onKeyDown,
  activeCell,
  className,
  children,
  ...props
}) => {
  return (
    <tr
      data-row={row}
      className={cn("border-b border-white/5", className)}
      onKeyDown={onKeyDown}
      {...props}
    >
      {children}
    </tr>
  );
};

export default NavigableRow;
