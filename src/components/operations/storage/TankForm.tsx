
import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
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
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Terminal } from '@/hooks/useTerminals';
import { Tank } from '@/hooks/useTanks';

const tankFormSchema = z.object({
  tankNumber: z.string().min(1, "Tank number is required"),
  currentProduct: z.string().min(1, "Product is required"),
  capacityMT: z.number().min(1, "Capacity must be greater than 0"),
  spec: z.string().optional(),
  isHeatingEnabled: z.boolean().default(false),
  terminalName: z.string().optional(), // Only required for new terminals
});

interface TankFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  terminal?: Terminal;
  tank?: Tank;
  isNewTerminal?: boolean;
}

const TankForm: React.FC<TankFormProps> = ({
  open,
  onOpenChange,
  onSuccess,
  terminal,
  tank,
  isNewTerminal = false,
}) => {
  const form = useForm<z.infer<typeof tankFormSchema>>({
    resolver: zodResolver(tankFormSchema),
    defaultValues: {
      tankNumber: tank?.tank_number || '',
      currentProduct: tank?.current_product || '',
      capacityMT: tank?.capacity_mt || 0,
      spec: tank?.spec || '',
      isHeatingEnabled: tank?.is_heating_enabled || false,
      terminalName: terminal?.name || '',
    },
  });

  const onSubmit = async (values: z.infer<typeof tankFormSchema>) => {
    try {
      let terminalId = terminal?.id;

      // If this is a new terminal, create it first
      if (isNewTerminal && values.terminalName) {
        const { data: newTerminal, error: terminalError } = await supabase
          .from('terminals')
          .insert({
            name: values.terminalName,
            description: `${values.terminalName} Terminal`,
          })
          .select()
          .single();

        if (terminalError) throw terminalError;
        terminalId = newTerminal.id;
      }

      if (!terminalId) {
        toast.error('Terminal ID is required');
        return;
      }

      // Create or update tank
      const tankData = {
        terminal_id: terminalId,
        tank_number: values.tankNumber,
        current_product: values.currentProduct,
        capacity_mt: values.capacityMT,
        capacity_m3: values.capacityMT * 1.1, // Using 1.1 as conversion factor
        spec: values.spec,
        is_heating_enabled: values.isHeatingEnabled,
      };

      if (tank?.id) {
        // Update existing tank
        const { error } = await supabase
          .from('tanks')
          .update(tankData)
          .eq('id', tank.id);

        if (error) throw error;
        toast.success('Tank updated');
      } else {
        // Create new tank
        const { error } = await supabase
          .from('tanks')
          .insert(tankData);

        if (error) {
          console.error('Error creating tank:', error);
          throw error;
        }
        toast.success('Tank created');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving tank:', error);
      toast.error(`Failed to save tank: ${error.message || 'Unknown error'}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tank ? 'Edit Tank' : 'Add Tank'}</DialogTitle>
          <DialogDescription>
            {tank ? 'Update tank details' : 'Create a new tank in this terminal'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {isNewTerminal && (
              <FormField
                control={form.control}
                name="terminalName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Terminal Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter terminal name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="tankNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tank Number</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter tank number" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currentProduct"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Product</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter product name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="capacityMT"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacity (MT)</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number" 
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="spec"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Spec</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter spec details" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isHeatingEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <FormLabel>Heating Enabled</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit">
                {tank ? 'Update Tank' : 'Create Tank'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default TankForm;
