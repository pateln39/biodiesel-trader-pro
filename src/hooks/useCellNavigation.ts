
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface CellPosition {
  row: number;
  col: number;
  zone: 'left' | 'right';
}

export interface CellNavigationOptions {
  leftColCount: number;
  rightColCount: number;
  rowCount: number;
  onCellChange?: (position: CellPosition) => void;
  scrollAreaRef?: React.RefObject<HTMLDivElement>;
}

export const useCellNavigation = ({
  leftColCount,
  rightColCount,
  rowCount,
  onCellChange,
  scrollAreaRef
}: CellNavigationOptions) => {
  const [activeCell, setActiveCell] = useState<CellPosition | null>(null);
  const cellRefs = useRef<Record<string, HTMLElement | null>>({});

  // Register a cell in the refs map
  const registerCellRef = useCallback((row: number, col: number, zone: 'left' | 'right', ref: HTMLElement | null) => {
    const key = `${zone}-${row}-${col}`;
    cellRefs.current[key] = ref;
  }, []);

  // Get the cell ref by position
  const getCellRef = useCallback((position: CellPosition) => {
    const key = `${position.zone}-${position.row}-${position.col}`;
    return cellRefs.current[key];
  }, []);

  // Focus a cell
  const focusCell = useCallback((position: CellPosition) => {
    if (position.row < 0 || position.row >= rowCount) return;
    
    let validCol = position.col;
    const maxCol = position.zone === 'left' ? leftColCount - 1 : rightColCount - 1;
    
    if (position.col < 0) {
      // Move to the right-most cell of the left zone
      if (position.zone === 'right' && leftColCount > 0) {
        position = {
          ...position,
          col: leftColCount - 1,
          zone: 'left'
        };
      } else {
        validCol = 0;
      }
    } else if (position.col > maxCol) {
      // Move to the left-most cell of the right zone
      if (position.zone === 'left' && rightColCount > 0) {
        position = {
          ...position,
          col: 0,
          zone: 'right'
        };
      } else {
        validCol = maxCol;
      }
    }

    position = { ...position, col: validCol };
    setActiveCell(position);
    onCellChange?.(position);

    const cellElement = getCellRef(position);
    if (cellElement) {
      cellElement.focus();
      
      // Ensure the cell is visible by scrolling if needed
      if (position.zone === 'right' && scrollAreaRef?.current) {
        const scrollContainer = scrollAreaRef.current;
        const containerRect = scrollContainer.getBoundingClientRect();
        const cellRect = cellElement.getBoundingClientRect();

        // Horizontal scrolling
        if (cellRect.left < containerRect.left) {
          scrollContainer.scrollLeft -= (containerRect.left - cellRect.left) + 10;
        } else if (cellRect.right > containerRect.right) {
          scrollContainer.scrollLeft += (cellRect.right - containerRect.right) + 10;
        }
        
        // Vertical scrolling
        if (cellRect.top < containerRect.top) {
          scrollContainer.scrollTop -= (containerRect.top - cellRect.top) + 10;
        } else if (cellRect.bottom > containerRect.bottom) {
          scrollContainer.scrollTop += (cellRect.bottom - containerRect.bottom) + 10;
        }
      }
    }
  }, [leftColCount, rightColCount, rowCount, onCellChange, getCellRef, scrollAreaRef]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!activeCell) return;
    
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        focusCell({ ...activeCell, row: activeCell.row - 1 });
        break;
      case 'ArrowDown':
        e.preventDefault();
        focusCell({ ...activeCell, row: activeCell.row + 1 });
        break;
      case 'ArrowLeft':
        e.preventDefault();
        focusCell({ ...activeCell, col: activeCell.col - 1 });
        break;
      case 'ArrowRight':
        e.preventDefault();
        focusCell({ ...activeCell, col: activeCell.col + 1 });
        break;
      default:
        break;
    }
  }, [activeCell, focusCell]);

  return {
    activeCell,
    setActiveCell,
    registerCellRef,
    getCellRef,
    focusCell,
    handleKeyDown
  };
};
