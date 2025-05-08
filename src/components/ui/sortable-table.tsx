
import React, { useState, useMemo } from 'react';
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
  grouped?: boolean;
}

export const DragHandle = ({ className, disabled, grouped }: DragHandleProps) => {
  return (
    <div className={cn(
      "flex items-center justify-center h-full", 
      disabled ? "cursor-not-allowed opacity-50" : "cursor-grab", 
      grouped ? "bg-purple-500/10 text-purple-400" : "",
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
  grouped?: boolean;
  isBeingDragged?: boolean;
  isPartOfDraggedGroup?: boolean;
}

export const SortableRow = ({ 
  id, 
  children, 
  className, 
  disabled = false,
  bgColorClass = "",
  grouped = false,
  isBeingDragged = false,
  isPartOfDraggedGroup = false
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
    opacity: isDragging ? 0.5 : 1,
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
        isBeingDragged ? "border-2 border-dashed border-primary" : "",
        disabled ? "opacity-50" : "",
        bgColorClass,
        className
      )}
      {...attributes}
    >
      <TableCell className="p-0 pl-2 h-10">
        <div className={cn(
          "h-full flex items-center",
          disabled ? "cursor-not-allowed" : "cursor-grab"
        )} {...(disabled ? {} : listeners)}>
          <DragHandle disabled={disabled} grouped={grouped} />
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
  isItemDisabled?: (item: T, index: number, items: T[]) => boolean;
  isItemPartOfGroup?: (item: T, index: number, items: T[]) => boolean;
  isItemFirstInGroup?: (item: T, index: number, items: T[]) => boolean;
  isItemLastInGroup?: (item: T, index: number, items: T[]) => boolean;
  getGroupId?: (item: T) => string | null | undefined;
  findGroupMembers?: (items: T[], groupId: string | null | undefined) => T[];
  className?: string;
  getRowBgClass?: (item: T, index: number, items: T[]) => string;
  disableDragAndDrop?: boolean;
  disabledRowClassName?: string;
}

export function SortableTable<T extends SortableItem>({
  items,
  onReorder,
  renderHeader,
  renderRow,
  isItemDisabled,
  isItemPartOfGroup,
  isItemFirstInGroup,
  isItemLastInGroup,
  getGroupId,
  findGroupMembers,
  className,
  getRowBgClass,
  disableDragAndDrop = false,
  disabledRowClassName = "opacity-50 text-muted-foreground bg-muted/50"
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

  const activeItem = activeId ? items.find(item => item.id === activeId) : null;
  
  const handleDragStart = (event: DragStartEvent) => {
    if (disableDragAndDrop) return;
    
    const itemId = event.active.id as string;
    const itemIndex = items.findIndex(item => item.id === itemId);
    const item = items[itemIndex];
    
    if (item && isItemDisabled && isItemDisabled(item, itemIndex, items)) {
      return;
    }
    
    setActiveId(itemId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (disableDragAndDrop) return;
    
    const { active, over } = event;
    setActiveId(null);
    
    if (!over) return;
    
    const activeIndex = items.findIndex(item => item.id === active.id);
    const overIndex = items.findIndex(item => item.id === over.id);
    
    // If the item hasn't moved or if activeItem is not found, do nothing
    if (activeIndex === -1 || activeIndex === overIndex) return;

    // Simple individual row reordering without group handling
    const reordered = [...items];
    const [movedItem] = reordered.splice(activeIndex, 1);
    reordered.splice(overIndex, 0, movedItem);
    
    console.log('[SORTABLE] Reordering individual row');
    onReorder(reordered);
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
              const isDisabled = (isItemDisabled ? isItemDisabled(item, index, items) : false) || disableDragAndDrop;
              const bgColorClass = getRowBgClass ? getRowBgClass(item, index, items) : "";
              
              // Check if this item is part of a group
              const isGrouped = isItemPartOfGroup ? isItemPartOfGroup(item, index, items) : false;
              
              return (
                <SortableRow 
                  key={item.id} 
                  id={item.id} 
                  disabled={isDisabled}
                  bgColorClass={bgColorClass}
                  grouped={isGrouped}
                  className={cn(
                    "h-10",
                    isDisabled && disabledRowClassName
                  )}
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
            <TableRow className="border border-primary bg-background opacity-90 rounded-md h-10">
              <TableCell className="p-0 pl-2 h-10">
                <DragHandle grouped={isItemPartOfGroup && isItemPartOfGroup(activeItem, items.indexOf(activeItem), items)} />
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

export default SortableTable;
