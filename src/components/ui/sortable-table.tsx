
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
    
    console.log('[SORTABLE] Drag end:', { 
      activeId: activeItem.id, 
      activeIndex, 
      overId: over.id, 
      overIndex,
      isInGroup: isItemPartOfGroup && isItemPartOfGroup(activeItem, activeIndex, items),
      isGroupLeader: isItemFirstInGroup && isItemFirstInGroup(activeItem, activeIndex, items),
    });
    
    // Check if the active item is part of a group 
    const isActiveItemInGroup = isItemPartOfGroup && isItemPartOfGroup(activeItem, activeIndex, items);
    const isActiveItemGroupLeader = isItemFirstInGroup && isItemFirstInGroup(activeItem, activeIndex, items);
    
    // If this is not the first item in a group, don't allow dragging
    if (isActiveItemInGroup && !isActiveItemGroupLeader) {
      console.log('[SORTABLE] Rejected drag: item is in group but not the group leader');
      return;
    }
    
    // Get the active group ID if any
    const activeGroupId = getGroupId ? getGroupId(activeItem) : null;
    
    // Create a copy for our reordering
    const newItems = [...items];
    
    if (isActiveItemInGroup && isActiveItemGroupLeader && findGroupMembers && activeGroupId) {
      // Find all items in the active group
      const groupItems = findGroupMembers(items, activeGroupId);
      console.log('[SORTABLE] Moving group with', groupItems.length, 'items');
      
      // Remove all group items from the array
      const remainingItems = newItems.filter(item => 
        !groupItems.some(groupItem => groupItem.id === item.id)
      );
      
      // Determine the proper insertion point
      let insertionIndex = overIndex;
      
      // Check if the target item is part of a group
      const overItem = items[overIndex];
      const overItemGroupId = getGroupId ? getGroupId(overItem) : null;
      
      console.log('[SORTABLE] Drop target:', { 
        overId: overItem.id, 
        overIndex, 
        overGroupId: overItemGroupId,
        inGroup: isItemPartOfGroup && isItemPartOfGroup(overItem, overIndex, items)
      });
      
      // If dropping on an item in a different group, handle boundary behavior
      if (overItemGroupId && overItemGroupId !== activeGroupId) {
        if (isItemPartOfGroup && isItemPartOfGroup(overItem, overIndex, items)) {
          // Find where this group starts and ends
          const overGroupItems = findGroupMembers(items, overItemGroupId);
          const firstGroupItemIndex = items.findIndex(item => 
            item.id === overGroupItems[0].id
          );
          const lastGroupItemIndex = items.findIndex(item => 
            item.id === overGroupItems[overGroupItems.length - 1].id
          );
          
          console.log('[SORTABLE] Target is in group:', {
            firstGroupItemIndex,
            lastGroupItemIndex,
            overIndex
          });
          
          // If closer to the start of the group, insert before the group
          // Otherwise, insert after the group
          if (overIndex - firstGroupItemIndex < lastGroupItemIndex - overIndex) {
            insertionIndex = firstGroupItemIndex;
            console.log('[SORTABLE] Inserting before group at', insertionIndex);
          } else {
            insertionIndex = lastGroupItemIndex + 1;
            console.log('[SORTABLE] Inserting after group at', insertionIndex);
          }
        }
      }
      
      // Adjust the insertion index if it would be in the middle of another group
      if (insertionIndex > 0 && insertionIndex < items.length) {
        const prevItem = items[insertionIndex - 1];
        const currentItem = items[insertionIndex];
        
        // Check if insertion would split a group
        if (getGroupId && isItemPartOfGroup) {
          const prevGroupId = getGroupId(prevItem);
          const currentGroupId = getGroupId(currentItem);
          
          if (prevGroupId && prevGroupId === currentGroupId) {
            // Find the start of this group
            const groupStart = items.findIndex(item => 
              getGroupId(item) === prevGroupId && 
              isItemFirstInGroup && isItemFirstInGroup(item, items.indexOf(item), items)
            );
            
            if (groupStart !== -1) {
              // Insert before the group
              insertionIndex = groupStart;
              console.log('[SORTABLE] Adjusted insertion to group start:', insertionIndex);
            }
          }
        }
      }
      
      // Insert all items from the dragged group at the new position
      remainingItems.splice(insertionIndex, 0, ...groupItems);
      console.log('[SORTABLE] Final item count after group reordering:', remainingItems.length);
      
      onReorder(remainingItems);
    } else {
      // Handle movement of a single standalone item
      const [movedItem] = newItems.splice(activeIndex, 1);
      
      // Determine the insertion point, avoiding splitting groups
      let insertionIndex = overIndex;
      const overItem = items[overIndex];
      const overItemGroupId = getGroupId ? getGroupId(overItem) : null;
      
      // If dropping on an item in a group, adjust insertion point
      if (overItemGroupId && isItemPartOfGroup && isItemPartOfGroup(overItem, overIndex, items)) {
        // Find the group boundaries
        const groupItems = findGroupMembers ? findGroupMembers(items, overItemGroupId) : [];
        const firstGroupItemIndex = items.findIndex(item => 
          groupItems.some(groupItem => groupItem.id === item.id) && 
          isItemFirstInGroup && isItemFirstInGroup(item, items.indexOf(item), items)
        );
        const lastGroupItemIndex = items.findIndex(item => 
          groupItems.some(groupItem => groupItem.id === item.id) && 
          isItemLastInGroup && isItemLastInGroup(item, items.indexOf(item), items)
        );
        
        // If closer to the start, insert before the group
        // If closer to the end, insert after the group
        if (Math.abs(overIndex - firstGroupItemIndex) <= Math.abs(overIndex - lastGroupItemIndex)) {
          insertionIndex = firstGroupItemIndex;
          console.log('[SORTABLE] Inserting single item before group at', insertionIndex);
        } else {
          insertionIndex = lastGroupItemIndex + 1;
          console.log('[SORTABLE] Inserting single item after group at', insertionIndex);
        }
      }
      
      // Insert the item at the determined position
      newItems.splice(insertionIndex, 0, movedItem);
      console.log('[SORTABLE] Final item count after single item reordering:', newItems.length);
      
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
          <div className="space-y-0 shadow-xl border-2 border-primary rounded-md">
            {/* First render the active item */}
            {activeItem && (
              <TableRow className="border border-primary bg-background opacity-90 rounded-t-md h-10">
                <TableCell className="p-0 pl-2 h-10">
                  <DragHandle grouped={isItemPartOfGroup && isItemPartOfGroup(activeItem, items.indexOf(activeItem), items)} />
                </TableCell>
                {renderRow(activeItem, items.indexOf(activeItem))}
              </TableRow>
            )}
            
            {/* Then render all items in the same group with the same color as the active item */}
            {activeGroupItems.map((item, groupIdx) => {
              // Get the same background color class used for the group in the main table
              const groupBgClass = getRowBgClass ? getRowBgClass(item, items.indexOf(item), items) : "";
              
              return (
                <TableRow 
                  key={item.id} 
                  className={cn(
                    "border-l border-r border-primary bg-background opacity-80 h-10",
                    groupBgClass,  // Apply the group-specific background color
                    groupIdx === activeGroupItems.length - 1 ? "rounded-b-md border-b" : ""
                  )}
                >
                  <TableCell className="p-0 pl-2 h-10">
                    <DragHandle grouped={true} />
                  </TableCell>
                  {renderRow(item, groupIdx + 1)}
                </TableRow>
              );
            })}
          </div>
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}

export default SortableTable;
