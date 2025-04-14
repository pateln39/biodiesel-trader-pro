
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useReferenceData } from '@/hooks/useReferenceData';

const tankFormSchema = z.object({
  tank_number: z.string().min(1, 'Tank number is required'),
  current_product: z.string().min(1, 'Product is required'),
  capacity_mt: z.string().min(1, 'Capacity (MT) is required')
    .transform(val => Number(val))
    .refine(val => !isNaN(val) && val > 0, 'Must be a positive number'),
  spec: z.string().optional(),
  is_heating_enabled: z.boolean().default(false)
});

type TankFormValues = z.infer<typeof tankFormSchema>;

interface AddTankDialogProps {
  onAddTank: (tankData: Omit<TankFormValues, 'terminal_id'>) => Promise<void>;
  children: React.ReactNode;
}

const AddTankDialog: React.FC<AddTankDialogProps> = ({ onAddTank, children }) => {
  const [open, setOpen] = React.useState(false);
  const { productOptions } = useReferenceData();
  
  const form = useForm<TankFormValues>({
    resolver: zodResolver(tankFormSchema),
    defaultValues: {
      tank_number: '',
      current_product: '',
      capacity_mt: '',
      spec: '',
      is_heating_enabled: false
    }
  });

  const onSubmit = async (values: TankFormValues) => {
    try {
      await onAddTank({
        ...values,
        capacity_m3: values.capacity_mt * 1.1, // Approximate conversion
      });
      toast.success('Tank added successfully');
      setOpen(false);
      form.reset();
    } catch (error) {
      toast.error('Failed to add tank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Tank</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tank_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tank Number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="current_product"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {productOptions.map((product) => (
                        <SelectItem key={product.value} value={product.value}>
                          {product.label}
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
              name="capacity_mt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacity (MT)</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" min="0" step="0.01" />
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
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_heating_enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Heating Enabled</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit">Add Tank</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTankDialog;
