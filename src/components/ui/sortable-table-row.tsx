
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TableRow } from './table';
import { cn } from '@/lib/utils';

interface SortableTableRowProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  dragHandle?: boolean;
}

export function SortableTableRow({
  id,
  children,
  className,
  dragHandle = true,
}: SortableTableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
  };

  // Get all the drag listeners if a child is a drag handle
  const enhancedChildren = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) {
      return child;
    }

    if (dragHandle && child.props['data-drag-handle']) {
      return React.cloneElement(child, {
        ...child.props,
        ...listeners,
        ...attributes,
      });
    }

    return child;
  });

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(
        // Basic hover effect for all rows
        'hover:scale-[1.01] hover:shadow-md transition-all duration-200 hover:z-10 hover:relative',
        // Enhanced effect when dragging
        isDragging && 'scale-[1.02] shadow-lg bg-accent/50 z-50 cursor-grabbing',
        // Highlight drop target
        isOver && 'bg-accent/30',
        className
      )}
    >
      {enhancedChildren}
    </TableRow>
  );
}
