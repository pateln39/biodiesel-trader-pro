
import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTerminals } from '@/hooks/useTerminals';
import { toast } from 'sonner';

interface AssignTerminalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movementId: string;
}

interface FormData {
  terminal_id: string;
  inventory_movement_date: Date;
}

export function AssignTerminalDialog({ open, onOpenChange, movementId }: AssignTerminalDialogProps) {
  const { terminals } = useTerminals();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [selectedTerminal, setSelectedTerminal] = React.useState<string>('');

  const updateMovementMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { error } = await supabase
        .from('movements')
        .update({
          terminal_id: data.terminal_id,
          inventory_movement_date: data.inventory_movement_date.toISOString()
        })
        .eq('id', movementId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      toast.success('Movement assigned to terminal successfully');
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('[MOVEMENTS] Error assigning terminal:', error);
      toast.error('Failed to assign terminal to movement');
    }
  });

  const handleSubmit = () => {
    if (!selectedTerminal) {
      toast.error('Please select a terminal');
      return;
    }

    updateMovementMutation.mutate({
      terminal_id: selectedTerminal,
      inventory_movement_date: selectedDate
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Movement to Terminal</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 p-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Terminal</label>
            <Select value={selectedTerminal} onValueChange={setSelectedTerminal}>
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
          <div className="space-y-2">
            <label className="text-sm font-medium">Movement Date</label>
            <DatePicker date={selectedDate} setDate={setSelectedDate} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              Assign
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
