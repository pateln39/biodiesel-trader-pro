
import React, { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
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
  const [isDragging, setIsDragging] = useState(false);
  
  // Update sorted items when external items change
  useEffect(() => {
    console.log('[SortableTable] Items updated, setting sorted items', { count: items.length });
    setSortedItems(items);
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement required before drag starts (lower threshold)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    console.log('[SortableTable] Drag started', event);
    setIsDragging(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    console.log('[SortableTable] Drag ended', event);
    setIsDragging(false);
    
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      console.log('[SortableTable] No change in order');
      return;
    }
    
    const oldIndex = sortedItems.findIndex(item => getItemId(item) === active.id);
    const newIndex = sortedItems.findIndex(item => getItemId(item) === over.id);
    
    if (oldIndex === -1 || newIndex === -1) {
      console.log('[SortableTable] Invalid indices', { oldIndex, newIndex });
      return;
    }
    
    console.log('[SortableTable] Reordering items', { oldIndex, newIndex });
    
    // Reorder the items
    const newItems = [...sortedItems];
    const [movedItem] = newItems.splice(oldIndex, 1);
    newItems.splice(newIndex, 0, movedItem);
    
    setSortedItems(newItems);
    
    // Notify parent component of the change
    if (onOrderChange) {
      console.log('[SortableTable] Notifying parent of order change');
      onOrderChange(newItems);
    }
  };

  const dragHandleProps = (id: string) => ({
    role: 'button',
    className: 'cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground transition-colors',
    'data-drag-handle': true,
    children: <GripVertical className="h-4 w-4" />,
  });

  console.log('[SortableTable] Rendering with items:', sortedItems.map(getItemId));

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
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
