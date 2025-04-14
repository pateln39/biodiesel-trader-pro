
import React from 'react';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Factory } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useTerminals } from '@/hooks/useTerminals';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface AssignToTerminalButtonProps {
  movementId: string;
  currentTerminalId?: string;
}

export function AssignToTerminalButton({ movementId, currentTerminalId }: AssignToTerminalButtonProps) {
  const [date, setDate] = React.useState<Date>();
  const [selectedTerminalId, setSelectedTerminalId] = React.useState<string>(currentTerminalId || '');
  const { terminals } = useTerminals();
  const queryClient = useQueryClient();

  const assignToTerminalMutation = useMutation({
    mutationFn: async ({ terminalId, date }: { terminalId: string; date: Date }) => {
      const { error } = await supabase
        .from('movements')
        .update({ 
          terminal_id: terminalId,
          inventory_movement_date: date
        })
        .eq('id', movementId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      toast.success('Movement assigned to terminal successfully');
    },
    onError: (error) => {
      console.error('Error assigning movement to terminal:', error);
      toast.error('Failed to assign movement to terminal');
    }
  });

  const handleAssign = () => {
    if (!selectedTerminalId || !date) {
      toast.error('Please select both a terminal and a date');
      return;
    }

    assignToTerminalMutation.mutate({ 
      terminalId: selectedTerminalId, 
      date 
    });
  };

  return (
    <div className="flex gap-2 items-center">
      <Select value={selectedTerminalId} onValueChange={setSelectedTerminalId}>
        <SelectTrigger className="w-[180px]">
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

      <Button 
        onClick={handleAssign}
        disabled={!selectedTerminalId || !date}
      >
        <Factory className="mr-2 h-4 w-4" />
        Assign
      </Button>
    </div>
  );
}
