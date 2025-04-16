
import React from 'react';
import { Movement } from '@/types';
import { useTerminals } from '@/hooks/useTerminals';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { CalendarIcon, Factory, Warehouse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface StorageFormDialogProps {
  movement: Movement;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StorageFormDialog({ movement, open, onOpenChange }: StorageFormDialogProps) {
  const { terminals } = useTerminals();
  const queryClient = useQueryClient();
  const [selectedTerminalId, setSelectedTerminalId] = React.useState<string>('');
  const [date, setDate] = React.useState<Date>();
  const [quantity, setQuantity] = React.useState<string>('');

  const assignToTerminalMutation = useMutation({
    mutationFn: async ({ 
      movementId, 
      terminalId, 
      date, 
      quantity 
    }: { 
      movementId: string; 
      terminalId: string; 
      date: Date;
      quantity: number;
    }) => {
      const formattedDate = date.toISOString();
      
      const { error } = await supabase
        .from('movements')
        .update({ 
          terminal_id: terminalId,
          inventory_movement_date: formattedDate,
          actual_quantity: quantity
        })
        .eq('id', movementId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      toast.success('Movement assigned to terminal successfully');
      handleClose();
    },
    onError: (error) => {
      console.error('Error assigning movement to terminal:', error);
      toast.error('Failed to assign movement to terminal');
    }
  });

  const handleAssign = () => {
    if (!selectedTerminalId || !date || !quantity) {
      toast.error('Please fill in all fields');
      return;
    }

    const parsedQuantity = parseFloat(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    assignToTerminalMutation.mutate({
      movementId: movement.id,
      terminalId: selectedTerminalId,
      date,
      quantity: parsedQuantity,
    });
  };

  const handleClose = () => {
    setSelectedTerminalId('');
    setDate(undefined);
    setQuantity('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5" />
            Storage Form
          </DialogTitle>
          <DialogDescription>
            Assign movement {movement.referenceNumber} to a terminal
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label>Terminal</label>
            <Select value={selectedTerminalId} onValueChange={setSelectedTerminalId}>
              <SelectTrigger>
                <SelectValue placeholder="Select terminal" />
              </SelectTrigger>
              <SelectContent>
                {terminals.map((terminal) => (
                  <SelectItem key={terminal.id} value={terminal.id}>
                    {terminal.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <label>Quantity (MT)</label>
            <Input
              type="number"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity in MT"
            />
          </div>

          <div className="grid gap-2">
            <label>Movement Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={!date ? "text-muted-foreground" : ""}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button
            onClick={handleAssign}
            disabled={!selectedTerminalId || !date || !quantity}
          >
            <Factory className="mr-2 h-4 w-4" />
            Assign to Terminal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
