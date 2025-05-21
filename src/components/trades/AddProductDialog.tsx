
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

type FormValues = z.infer<typeof formSchema>;

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductAdded: (name: string) => void;
}

const colorOptions = [
  { className: 'bg-blue-500 text-white', label: 'Blue' },
  { className: 'bg-green-500 text-white', label: 'Green' },
  { className: 'bg-red-500 text-white', label: 'Red' },
  { className: 'bg-yellow-500 text-black', label: 'Yellow' },
  { className: 'bg-purple-500 text-white', label: 'Purple' },
  { className: 'bg-pink-500 text-white', label: 'Pink' },
  { className: 'bg-indigo-500 text-white', label: 'Indigo' },
  { className: 'bg-gray-500 text-white', label: 'Gray' },
  { className: 'bg-orange-500 text-white', label: 'Orange' },
  { className: 'bg-teal-500 text-white', label: 'Teal' },
  { className: 'bg-cyan-500 text-white', label: 'Cyan' },
  { className: 'bg-emerald-500 text-white', label: 'Emerald' },
  { className: 'bg-lime-500 text-white', label: 'Lime' },
  { className: 'bg-amber-500 text-white', label: 'Amber' },
  { className: 'bg-rose-500 text-white', label: 'Rose' },
];

const AddProductDialog: React.FC<AddProductDialogProps> = ({ 
  open, 
  onOpenChange,
  onProductAdded
}) => {
  const [selectedColor, setSelectedColor] = useState<string>(colorOptions[0].className);
  const queryClient = useQueryClient();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  });

  const addProductMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const { data: newProduct, error } = await supabase.rpc(
        'insert_product',
        { 
          product_name: data.name,
          color_class_value: selectedColor
        }
      );

      if (error) throw error;
      return data.name;
    },
    onSuccess: (name) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product added', {
        description: `Product "${name}" has been added successfully`,
      });
      form.reset();
      onProductAdded(name);
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error('Failed to add product', {
        description: error.message || 'An error occurred',
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    addProductMutation.mutate(values);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Enter the details for the new product.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input 
                      autoFocus
                      placeholder="Enter product name" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <Label>Product Color</Label>
              <div className="grid grid-cols-5 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.className}
                    type="button"
                    className={cn(
                      "h-10 w-10 rounded-md flex items-center justify-center border",
                      color.className,
                      selectedColor === color.className ? "ring-2 ring-offset-2 ring-black" : ""
                    )}
                    onClick={() => setSelectedColor(color.className)}
                    title={color.label}
                  />
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                Selected color: 
                <span className={cn(
                  "ml-2 py-1 px-2 rounded text-xs",
                  selectedColor
                )}>{selectedColor.split(' ')[0].replace('bg-', '')}</span>
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={addProductMutation.isPending}
              >
                {addProductMutation.isPending ? "Adding..." : "Add Product"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductDialog;
