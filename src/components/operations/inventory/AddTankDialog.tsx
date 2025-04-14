
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const formSchema = z.object({
  terminalId: z.string(),
  tankNumber: z.string().min(1, {
    message: 'Tank number is required',
  }),
  currentProduct: z.string().min(1, {
    message: 'Product is required',
  }),
  capacityMt: z.coerce.number().positive({
    message: 'Capacity must be a positive number',
  }),
  capacityM3: z.coerce.number().positive({
    message: 'Volume capacity must be a positive number',
  }),
  spec: z.string().optional(),
  isHeatingEnabled: z.boolean().default(false),
});

interface AddTankDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTank: (data: any) => void;
  terminalId: string;
  productOptions: string[];
}

export function AddTankDialog({
  open,
  onOpenChange,
  onAddTank,
  terminalId,
  productOptions,
}: AddTankDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      terminalId,
      tankNumber: '',
      currentProduct: '',
      capacityMt: undefined,
      capacityM3: undefined, 
      spec: '',
      isHeatingEnabled: false,
    },
  });

  React.useEffect(() => {
    if (open) {
      form.setValue('terminalId', terminalId);
    }
  }, [open, terminalId, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    onAddTank(values);
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Tank</DialogTitle>
          <DialogDescription>
            Enter details to create a new storage tank.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tankNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tank Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. T01" {...field} />
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
                  <FormLabel>Product</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {productOptions.map((product) => (
                        <SelectItem key={product} value={product}>
                          {product}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="capacityMt"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Capacity (MT)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="capacityM3"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Capacity (M³)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="spec"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specification</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. ISO 8217" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isHeatingEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Heating Enabled</FormLabel>
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
            <DialogFooter>
              <Button type="submit">Add Tank</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
