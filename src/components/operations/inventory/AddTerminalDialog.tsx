
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const terminalFormSchema = z.object({
  name: z.string().min(1, 'Terminal name is required'),
  description: z.string().optional()
});

type TerminalFormValues = z.infer<typeof terminalFormSchema>;

interface AddTerminalDialogProps {
  onAddTerminal: (name: string, description?: string) => Promise<void>;
  children: React.ReactNode;
}

const AddTerminalDialog: React.FC<AddTerminalDialogProps> = ({ onAddTerminal, children }) => {
  const [open, setOpen] = React.useState(false);
  
  const form = useForm<TerminalFormValues>({
    resolver: zodResolver(terminalFormSchema),
    defaultValues: {
      name: '',
      description: ''
    }
  });

  const onSubmit = async (values: TerminalFormValues) => {
    try {
      await onAddTerminal(values.name, values.description);
      toast.success('Terminal added successfully');
      setOpen(false);
      form.reset();
    } catch (error) {
      toast.error('Failed to add terminal');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Terminal</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Terminal Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Add Terminal</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTerminalDialog;
