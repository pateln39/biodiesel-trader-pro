
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
    opacity: isDragging ? 0.5 : isPartOfDraggedGroup ? 0.3 : 1,
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
        isPartOfDraggedGroup ? "border-2 border-dashed border-primary bg-accent/20" : "",
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
  
  // Find all items that are part of the same group as the active item
  const activeGroupId = activeItem && getGroupId ? getGroupId(activeItem) : null;
  const activeGroupItems = useMemo(() => {
    if (!activeGroupId || !findGroupMembers || !activeItem) return [];
    return findGroupMembers(items, activeGroupId).filter(item => item.id !== activeItem.id);
  }, [activeGroupId, findGroupMembers, items, activeItem]);
  
  // Track which items are part of the dragged group
  const draggedGroupIds = useMemo(() => {
    const ids = new Set<string>();
    if (activeId) ids.add(activeId);
    activeGroupItems.forEach(item => ids.add(item.id));
    return ids;
  }, [activeId, activeGroupItems]);

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
    
    const activeItem = items[activeIndex];
    
    // Check if the active item is part of a group and if it's the first item
    const isGroupLeader = isItemFirstInGroup && isItemFirstInGroup(activeItem, activeIndex, items);
    const isPartOfGroup = isItemPartOfGroup && isItemPartOfGroup(activeItem, activeIndex, items);
    
    // If this is not the first item in a group, don't allow dragging
    if (isPartOfGroup && !isGroupLeader) return;
    
    // Check if we're trying to drop between items of the same group
    const overItem = items[overIndex];
    const overGroupId = getGroupId ? getGroupId(overItem) : null;
    
    // If over item is part of a group, but not the first in group,
    // we need to adjust the insertion point
    if (overGroupId && isItemPartOfGroup && !isItemFirstInGroup) {
      // Find the first item in the group
      const groupStartIndex = items.findIndex((item, idx) => 
        getGroupId && getGroupId(item) === overGroupId && 
        isItemFirstInGroup && isItemFirstInGroup(item, idx, items)
      );
      
      if (groupStartIndex !== -1) {
        // Find the last item in the group
        const groupEndIndex = items.findIndex((item, idx) => 
          getGroupId && getGroupId(item) === overGroupId && 
          isItemLastInGroup && isItemLastInGroup(item, idx, items)
        );
        
        // Determine if we should insert before or after the group
        const insertAfterGroup = overIndex > activeIndex;
        const newIndex = insertAfterGroup ? groupEndIndex + 1 : groupStartIndex;
        
        // Create a copy of the items array
        const newItems = [...items];
        
        // Handle group movement as a single unit
        if (isPartOfGroup && isGroupLeader) {
          // Find all items in the active group
          const activeGroupId = getGroupId ? getGroupId(activeItem) : null;
          const groupItems = activeGroupId && findGroupMembers ? 
            findGroupMembers(items, activeGroupId) : [activeItem];
          
          // Remove all group items from the array
          const itemsWithoutGroup = newItems.filter(
            item => !groupItems.some(groupItem => groupItem.id === item.id)
          );
          
          // Insert the group at the new position
          itemsWithoutGroup.splice(newIndex, 0, ...groupItems);
          onReorder(itemsWithoutGroup);
        } else {
          // Handle normal item movement
          const [movedItem] = newItems.splice(activeIndex, 1);
          newItems.splice(newIndex, 0, movedItem);
          onReorder(newItems);
        }
        
        return;
      }
    }
    
    // Standard reordering logic (with group support)
    const newItems = [...items];
    
    if (isPartOfGroup && isGroupLeader && getGroupId) {
      // Get all items in the group
      const activeGroupId = getGroupId(activeItem);
      const groupItems = activeGroupId && findGroupMembers ? 
        findGroupMembers(items, activeGroupId) : [activeItem];
      
      // Remove all group items
      const filteredItems = newItems.filter(
        item => !groupItems.some(groupItem => groupItem.id === item.id)
      );
      
      // Insert all group items at the new position
      const newIndex = overIndex > activeIndex ? overIndex - groupItems.length + 1 : overIndex;
      filteredItems.splice(newIndex, 0, ...groupItems);
      
      onReorder(filteredItems);
    } else {
      // Standard single-item movement
      const [movedItem] = newItems.splice(activeIndex, 1);
      newItems.splice(overIndex, 0, movedItem);
      onReorder(newItems);
    }
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
              const isFirstGroup = isItemFirstInGroup ? isItemFirstInGroup(item, index, items) : false;
              
              // Check if this item is part of the currently dragged group
              const isPartOfDraggedGroup = draggedGroupIds.has(item.id) && item.id !== activeId;
              
              return (
                <SortableRow 
                  key={item.id} 
                  id={item.id} 
                  disabled={isDisabled}
                  bgColorClass={bgColorClass}
                  grouped={isGrouped}
                  isPartOfDraggedGroup={isPartOfDraggedGroup}
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
          <div className="space-y-0">
            {/* First render the active item */}
            {activeItem && (
              <TableRow className="border border-primary bg-background shadow-lg opacity-90 h-10">
                <TableCell className="p-0 pl-2 h-10">
                  <DragHandle grouped={isItemPartOfGroup && isItemPartOfGroup(activeItem, items.indexOf(activeItem), items)} />
                </TableCell>
                {renderRow(activeItem, items.indexOf(activeItem))}
              </TableRow>
            )}
            
            {/* Then render all items in the same group */}
            {activeGroupItems.map((item, groupIdx) => (
              <TableRow 
                key={item.id} 
                className="border-l border-r border-primary bg-background shadow-lg opacity-80 h-10"
              >
                <TableCell className="p-0 pl-2 h-10">
                  <DragHandle grouped={true} />
                </TableCell>
                {renderRow(item, groupIdx + 1)} {/* The +1 is to indicate it's not the first item */}
              </TableRow>
            ))}
          </div>
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}

export default SortableTable;
