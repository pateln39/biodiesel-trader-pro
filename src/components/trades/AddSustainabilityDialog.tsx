
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

interface AddSustainabilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSustainabilityAdded: (name: string) => void;
}

const AddSustainabilityDialog: React.FC<AddSustainabilityDialogProps> = ({ 
  open, 
  onOpenChange,
  onSustainabilityAdded
}) => {
  const queryClient = useQueryClient();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  });

  const addSustainabilityMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const { data: newSustainability, error } = await supabase
        .from('sustainability')
        .insert({ name: data.name })
        .select()
        .single();

      if (error) throw error;
      return data.name;
    },
    onSuccess: (name) => {
      queryClient.invalidateQueries({ queryKey: ['sustainability'] });
      toast.success('Sustainability option added', {
        description: `Sustainability "${name}" has been added successfully`,
      });
      form.reset();
      onSustainabilityAdded(name);
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error('Failed to add sustainability option', {
        description: error.message || 'An error occurred',
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    addSustainabilityMutation.mutate(values);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Sustainability</DialogTitle>
          <DialogDescription>
            Enter the details for the new sustainability option.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sustainability Name</FormLabel>
                  <FormControl>
                    <Input 
                      autoFocus
                      placeholder="Enter sustainability name" 
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
                disabled={addSustainabilityMutation.isPending}
              >
                {addSustainabilityMutation.isPending ? "Adding..." : "Add Sustainability"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSustainabilityDialog;
