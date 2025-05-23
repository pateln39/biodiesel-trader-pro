
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  size: z.string().min(1, 'Size (DWT) is required'),
  imo: z.string().min(1, 'IMO number is required'),
  type: z.string().optional(),
  owners: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddBargeVesselDialogProps {
  onAddBarge: (bargeDetails: FormValues) => void;
  onCancel: () => void;
}

const AddBargeVesselDialog = ({
  onAddBarge,
  onCancel,
}: AddBargeVesselDialogProps) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      size: '',
      imo: '',
      type: '',
      owners: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      // Save to database
      const { error } = await supabase.from('barges_vessels').insert({
        name: data.name,
        deadweight: parseFloat(data.size),
        imo_number: data.imo,
        type: data.type || null,
        owners: data.owners || null
      });

      if (error) {
        console.error('Error saving barge/vessel:', error);
        toast.error('Failed to save barge/vessel data', {
          description: error.message
        });
        return;
      }

      toast.success('Barge/vessel data saved successfully');
      onAddBarge(data);
    } catch (err) {
      console.error('Error in barge/vessel save:', err);
      toast.error('An unexpected error occurred');
    }
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Add New Barge/Vessel</DialogTitle>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="size"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Size (DWT)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="imo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>IMO Number</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type (Optional)</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="owners"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Owners (Optional)</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">Add Barge/Vessel</Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export default AddBargeVesselDialog;
