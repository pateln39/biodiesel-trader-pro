import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Movement } from '@/types';
import { Terminal } from '@/hooks/useTerminals';

const formSchema = z.object({
  terminalId: z.string({
    required_error: "Please select a terminal",
  }),
  inventoryMovementDate: z.date({
    required_error: "Please select a date",
  }),
});

interface AssignToTerminalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign: (data: z.infer<typeof formSchema>) => void;
  movement: Movement | null;
  terminals: Terminal[];
}

export function AssignToTerminalDialog({
  open,
  onOpenChange,
  onAssign,
  movement,
  terminals,
}: AssignToTerminalDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      terminalId: '',
      inventoryMovementDate: new Date(),
    },
  });

  React.useEffect(() => {
    if (open && movement) {
      // If movement already has a terminalId, use it as default
      if (movement.terminalId) {
        form.setValue('terminalId', movement.terminalId);
      }
      
      // If movement already has an inventory date, use it as default
      if (movement.inventoryMovementDate) {
        form.setValue('inventoryMovementDate', new Date(movement.inventoryMovementDate));
      } else if (movement.nominationEta) {
        // Otherwise, use nomination ETA as default if available
        form.setValue('inventoryMovementDate', new Date(movement.nominationEta));
      }
    }
  }, [open, movement, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    onAssign(values);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Movement to Terminal</DialogTitle>
          <DialogDescription>
            Select a terminal and movement date for this inventory movement.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {movement && (
              <div className="p-3 rounded-md bg-muted">
                <p className="text-sm font-medium">Reference: {movement.referenceNumber}</p>
                <p className="text-sm">Product: {movement.product}</p>
                <p className="text-sm">Quantity: {movement.actualQuantity || movement.scheduledQuantity} MT</p>
              </div>
            )}
            
            <FormField
              control={form.control}
              name="terminalId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Terminal</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select terminal" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {terminals.map((terminal) => (
                        <SelectItem key={terminal.id} value={terminal.id}>
                          {terminal.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="inventoryMovementDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Movement Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="submit">Assign to Terminal</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
