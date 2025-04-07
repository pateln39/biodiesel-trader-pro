
import React from 'react';
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

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

type FormValues = z.infer<typeof formSchema>;

interface AddInspectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInspectorAdded: (name: string) => void;
}

const AddInspectorDialog: React.FC<AddInspectorDialogProps> = ({ 
  open, 
  onOpenChange,
  onInspectorAdded
}) => {
  const queryClient = useQueryClient();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  });

  const addInspectorMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const { data: newInspector, error } = await supabase
        .from('inspectors')
        .insert({ name: data.name })
        .select()
        .single();

      if (error) throw error;
      return newInspector;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inspectors'] });
      toast.success('Inspector added', {
        description: `Inspector "${data.name}" has been added successfully`,
      });
      form.reset();
      onInspectorAdded(data.name);
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error('Failed to add inspector', {
        description: error.message || 'An error occurred',
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    addInspectorMutation.mutate(values);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Inspector</DialogTitle>
          <DialogDescription>
            Enter the details for the new inspector.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inspector Name</FormLabel>
                  <FormControl>
                    <Input 
                      autoFocus
                      placeholder="Enter inspector name" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                disabled={addInspectorMutation.isPending}
              >
                {addInspectorMutation.isPending ? "Adding..." : "Add Inspector"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddInspectorDialog;
