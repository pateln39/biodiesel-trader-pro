
import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { CellPosition } from '@/hooks/useCellNavigation';

interface NavigableCellProps extends React.HTMLAttributes<HTMLTableCellElement> {
  row: number;
  col: number;
  zone: 'left' | 'right';
  isActive?: boolean;
  onCellFocus?: (position: CellPosition) => void;
  registerCellRef?: (row: number, col: number, zone: 'left' | 'right', ref: HTMLElement | null) => void;
}

const NavigableCell: React.FC<NavigableCellProps> = ({
  row,
  col,
  zone,
  isActive = false,
  onCellFocus,
  registerCellRef,
  className,
  children,
  ...props
}) => {
  const cellRef = useRef<HTMLTableCellElement>(null);
  const position = { row, col, zone };

  useEffect(() => {
    if (registerCellRef) {
      registerCellRef(row, col, zone, cellRef.current);
    }
  }, [row, col, zone, registerCellRef]);

  const handleFocus = () => {
    if (onCellFocus) {
      onCellFocus(position);
    }
  };

  return (
    <td
      ref={cellRef}
      data-row={row}
      data-col={col}
      data-zone={zone}
      tabIndex={0}
      className={cn(
        "transition-colors outline-none text-[10px]",
        isActive && "ring-2 ring-secondary ring-inset",
        "hover:ring-1 hover:ring-secondary hover:ring-inset focus:ring-2 focus:ring-secondary focus:ring-inset",
        className
      )}
      onFocus={handleFocus}
      {...props}
    >
      {children}
    </td>
  );
};

export default NavigableCell;
