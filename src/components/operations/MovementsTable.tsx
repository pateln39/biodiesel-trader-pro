import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical } from 'lucide-react';
import ProductToken from '@/components/operations/storage/ProductToken';

interface Movement {
  id: string;
  trade_reference: string;
  leg_reference: string;
  product: string;
  quantity: number;
  loading_date: string;
  delivery_date: string;
  origin: string;
  destination: string;
  status: string;
  sort_order: number;
}

interface MovementsTableProps {
  filterStatuses: string[];
}

const MovementsTable = ({ filterStatuses }: MovementsTableProps) => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['movements', filterStatuses],
    queryFn: async () => {
      let query = supabase
        .from('movements')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (filterStatuses && filterStatuses.length > 0) {
        query = query.in('status', filterStatuses);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Error fetching movements: ${error.message}`);
      }
      
      return data as Movement[];
    }
  });

  useEffect(() => {
    if (data) {
      setMovements(data);
    }
  }, [data]);

  const handleDragEnd = async (result: any) => {
    setIsDragging(false);
    
    if (!result.destination) return;
    
    const items = Array.from(movements);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update local state immediately for responsive UI
    setMovements(items);
    
    // Update sort_order in database
    try {
      const updates = items.map((item, index) => ({
        id: item.id,
        sort_order: index + 1
      }));
      
      const { error } = await supabase
        .from('movements')
        .upsert(updates, { onConflict: 'id' });
        
      if (error) {
        throw new Error(`Error updating sort order: ${error.message}`);
      }
    } catch (error: any) {
      toast.error('Failed to update sort order', {
        description: error.message
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">Error loading movements data</p>
        <Button onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!movements || movements.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No movements found.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <DragDropContext onDragStart={() => setIsDragging(true)} onDragEnd={handleDragEnd}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{ width: '40px' }}></TableHead>
              <TableHead>Trade Ref</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead>Loading Date</TableHead>
              <TableHead>Delivery Date</TableHead>
              <TableHead>Origin</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <Droppable droppableId="movements">
            {(provided) => (
              <TableBody
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {movements.map((movement, index) => (
                  <Draggable key={movement.id} draggableId={movement.id} index={index}>
                    {(provided, snapshot) => (
                      <TableRow
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={snapshot.isDragging ? "bg-muted" : ""}
                      >
                        <TableCell {...provided.dragHandleProps} className="w-[40px]">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                        <TableCell>{movement.trade_reference}</TableCell>
                        <TableCell>
                          <ProductToken product={movement.product} size="md" />
                        </TableCell>
                        <TableCell className="text-right">{movement.quantity.toLocaleString()} MT</TableCell>
                        <TableCell>
                          {movement.loading_date ? format(new Date(movement.loading_date), 'dd MMM yyyy') : '-'}
                        </TableCell>
                        <TableCell>
                          {movement.delivery_date ? format(new Date(movement.delivery_date), 'dd MMM yyyy') : '-'}
                        </TableCell>
                        <TableCell>{movement.origin || '-'}</TableCell>
                        <TableCell>{movement.destination || '-'}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              movement.status === 'completed' ? 'default' :
                              movement.status === 'in-transit' ? 'secondary' :
                              movement.status === 'planned' ? 'outline' :
                              'outline'
                            }
                          >
                            {movement.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </TableBody>
            )}
          </Droppable>
        </Table>
      </DragDropContext>
    </div>
  );
};

export default MovementsTable;
