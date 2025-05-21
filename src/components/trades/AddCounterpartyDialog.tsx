
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

interface AddCounterpartyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCounterpartyAdded: (name: string) => void;
}

const AddCounterpartyDialog: React.FC<AddCounterpartyDialogProps> = ({ 
  open, 
  onOpenChange,
  onCounterpartyAdded
}) => {
  const queryClient = useQueryClient();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  });

  const addCounterpartyMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const { data: newCounterparty, error } = await supabase.rpc(
        'insert_counterparty',
        { counterparty_name: data.name }
      );

      if (error) throw error;
      return data.name;
    },
    onSuccess: (name) => {
      queryClient.invalidateQueries({ queryKey: ['counterparties'] });
      toast.success('Counterparty added', {
        description: `Counterparty "${name}" has been added successfully`,
      });
      form.reset();
      onCounterpartyAdded(name);
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error('Failed to add counterparty', {
        description: error.message || 'An error occurred',
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    addCounterpartyMutation.mutate(values);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Counterparty</DialogTitle>
          <DialogDescription>
            Enter the details for the new counterparty.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Counterparty Name</FormLabel>
                  <FormControl>
                    <Input 
                      autoFocus
                      placeholder="Enter counterparty name" 
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
                disabled={addCounterpartyMutation.isPending}
              >
                {addCounterpartyMutation.isPending ? "Adding..." : "Add Counterparty"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCounterpartyDialog;
