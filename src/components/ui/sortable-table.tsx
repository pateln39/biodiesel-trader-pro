import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface SortableItem {
  id: string;
  [key: string]: any;
}

interface DragHandleProps {
  className?: string;
  disabled?: boolean;
}

export const DragHandle = ({ className, disabled }: DragHandleProps) => {
  return (
    <div className={cn(
      "flex items-center justify-center h-full", 
      disabled ? "cursor-not-allowed opacity-50" : "cursor-grab", 
      className
    )}>
      <GripVertical className="h-4 w-4 text-muted-foreground" />
    </div>
  );
};

interface SortableRowProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  bgColorClass?: string;
}

export const SortableRow = ({ 
  id, 
  children, 
  className, 
  disabled = false,
  bgColorClass = "" 
}: SortableRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id,
    disabled 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : disabled ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
    position: 'relative' as const,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(
        "transition-colors data-[state=selected]:bg-muted h-10",
        isDragging ? "bg-accent" : "",
        disabled ? "bg-muted text-muted-foreground" : "",
        bgColorClass,
        className
      )}
      {...attributes}
    >
      <TableCell className="p-0 pl-2 h-10">
        <div className={cn("h-full flex items-center", disabled ? "cursor-not-allowed" : "cursor-grab")} {...(disabled ? {} : listeners)}>
          <DragHandle disabled={disabled} />
        </div>
      </TableCell>
      {children}
    </TableRow>
  );
};

export interface SortableTableProps<T extends SortableItem> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderHeader: () => React.ReactNode;
  renderRow: (item: T, index: number) => React.ReactNode;
  isItemDisabled?: (item: T) => boolean;
  className?: string;
  getRowBgClass?: (item: T) => string;
  disableDragAndDrop?: boolean;
}

export function SortableTable<T extends SortableItem>({
  items,
  onReorder,
  renderHeader,
  renderRow,
  isItemDisabled,
  className,
  getRowBgClass,
  disableDragAndDrop = false,
}: SortableTableProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    if (disableDragAndDrop) return;
    
    const itemId = event.active.id as string;
    const item = items.find(item => item.id === itemId);
    
    if (item && isItemDisabled && isItemDisabled(item)) {
      return;
    }
    
    setActiveId(itemId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (disableDragAndDrop) return;
    
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over.id);
      
      const newItems = [...items];
      const [movedItem] = newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, movedItem);
      
      onReorder(newItems);
    }
    
    setActiveId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Table className={className}>
        <TableHeader>
          <TableRow className="h-10">
            <TableHead className="w-10 p-0 h-10">
              {disableDragAndDrop && (
                <div className="px-2 text-xs text-muted-foreground italic">
                  Drag disabled during sort
                </div>
              )}
            </TableHead>
            {renderHeader()}
          </TableRow>
        </TableHeader>
        <TableBody>
          <SortableContext
            items={items.map(item => ({ id: item.id }))}
            strategy={verticalListSortingStrategy}
          >
            {items.map((item, index) => {
              const isDisabled = (isItemDisabled ? isItemDisabled(item) : false) || disableDragAndDrop;
              const bgColorClass = getRowBgClass ? getRowBgClass(item) : "";
              
              return (
                <SortableRow 
                  key={item.id} 
                  id={item.id} 
                  disabled={isDisabled}
                  bgColorClass={bgColorClass}
                  className="h-10"
                >
                  {renderRow(item, index)}
                </SortableRow>
              );
            })}
          </SortableContext>
        </TableBody>
      </Table>

      {activeId && createPortal(
        <DragOverlay adjustScale={false}>
          {activeItem && (
            <TableRow className="border border-primary bg-background shadow-lg opacity-80 h-10">
              <TableCell className="p-0 pl-2 h-10">
                <DragHandle />
              </TableCell>
              {renderRow(activeItem, items.indexOf(activeItem))}
            </TableRow>
          )}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}
