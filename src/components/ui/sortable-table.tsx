
import React, { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { GripVertical } from 'lucide-react';

interface SortableTableProps<T> {
  items: T[];
  getItemId: (item: T) => string;
  onOrderChange?: (newItems: T[]) => void;
  children: (items: T[], providedProps: {
    dragHandleProps: (id: string) => {
      role: string;
      className: string;
      'data-drag-handle': boolean;
      children: React.ReactNode;
    }
  }) => React.ReactNode;
}

export function SortableTable<T>({
  items,
  getItemId,
  onOrderChange,
  children,
}: SortableTableProps<T>) {
  const [sortedItems, setSortedItems] = useState<T[]>(items);
  
  // Update sorted items when external items change
  useEffect(() => {
    setSortedItems(items);
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    const oldIndex = sortedItems.findIndex(item => getItemId(item) === active.id);
    const newIndex = sortedItems.findIndex(item => getItemId(item) === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;
    
    // Reorder the items
    const newItems = [...sortedItems];
    const [movedItem] = newItems.splice(oldIndex, 1);
    newItems.splice(newIndex, 0, movedItem);
    
    setSortedItems(newItems);
    
    // Notify parent component of the change
    if (onOrderChange) {
      onOrderChange(newItems);
    }
  };

  const dragHandleProps = (id: string) => ({
    role: 'button',
    className: 'cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground transition-colors',
    'data-drag-handle': true,
    children: <GripVertical className="h-4 w-4" />,
  });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sortedItems.map(item => getItemId(item))}
        strategy={verticalListSortingStrategy}
      >
        {children(sortedItems, { dragHandleProps })}
      </SortableContext>
    </DndContext>
  );
}
