
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OpenTrade } from '@/hooks/useOpenTrades';
import { format } from 'date-fns';
import { CalendarIcon, Ship } from 'lucide-react';
import { 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useInspectors } from '@/hooks/useInspectors';
import AddInspectorDialog from './AddInspectorDialog';
import { formatMovementReference } from '@/utils/tradeUtils';

// Form schema validation
const formSchema = z.object({
  scheduledQuantity: z.coerce.number().positive("Quantity must be positive"),
  nominationEta: z.date().optional(),
  nominationValid: z.date().optional(),
  cashFlow: z.date().optional(),
  bargeName: z.string().optional(),
  loadport: z.string().optional(),
  loadportInspector: z.string().optional(),
  disport: z.string().optional(),
  disportInspector: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ScheduleMovementFormProps {
  trade: OpenTrade;
  onSuccess: () => void;
  onCancel: () => void;
}

const ScheduleMovementForm: React.FC<ScheduleMovementFormProps> = ({ 
  trade, 
  onSuccess,
  onCancel
}) => {
  const queryClient = useQueryClient();
  const { inspectors, isLoading: loadingInspectors } = useInspectors();
  const [isAddInspectorOpen, setIsAddInspectorOpen] = useState(false);
  const [inspectorToAdd, setInspectorToAdd] = useState<'loadport' | 'disport'>('loadport');
  
  // Get existing number of movements for this trade leg to create sequential reference numbers
  const [existingMovementsCount, setExistingMovementsCount] = useState(0);
  
  useEffect(() => {
    // Fetch number of existing movements for this trade leg to create sequential reference
    const fetchExistingMovements = async () => {
      try {
        const { count, error } = await supabase
          .from('movements')
          .select('id', { count: 'exact' })
          .eq('trade_leg_id', trade.trade_leg_id);
          
        if (!error && count !== null) {
          setExistingMovementsCount(count);
        }
      } catch (error) {
        console.error('Error fetching existing movements count:', error);
      }
    };
    
    if (trade.trade_leg_id) {
      fetchExistingMovements();
    }
  }, [trade.trade_leg_id]);
  
  // Form definition
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      scheduledQuantity: trade.balance || trade.quantity,
      nominationEta: undefined,
      nominationValid: undefined,
      cashFlow: undefined,
      bargeName: '',
      loadport: trade.loadport || '',
      loadportInspector: '',
      disport: trade.disport || '',
      disportInspector: '',
    },
  });

  // Create movement mutation
  const createMovementMutation = useMutation({
    mutationFn: async (data: FormValues & { referenceNumber: string }) => {
      const { error } = await supabase.from('movements').insert({
        parent_trade_id: trade.parent_trade_id,
        trade_leg_id: trade.trade_leg_id,
        reference_number: data.referenceNumber,
        trade_reference: trade.trade_reference,
        counterparty: trade.counterparty,
        buy_sell: trade.buy_sell,
        product: trade.product,
        sustainability: trade.sustainability,
        inco_term: trade.inco_term,
        scheduled_quantity: data.scheduledQuantity,
        bl_quantity: data.scheduledQuantity, // Initially set BL quantity equal to scheduled
        nomination_eta: data.nominationEta,
        nomination_valid: data.nominationValid,
        cash_flow: data.cashFlow,
        barge_name: data.bargeName,
        loadport: data.loadport,
        loadport_inspector: data.loadportInspector,
        disport: data.disport,
        disport_inspector: data.disportInspector,
        status: 'scheduled',
        pricing_type: trade.pricing_type,
        pricing_formula: trade.pricing_formula,
        customs_status: trade.customs_status,
        credit_status: trade.credit_status,
        contract_status: trade.contract_status,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate all related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['openTrades'] });
      
      toast.success('Movement scheduled', {
        description: 'The movement has been scheduled successfully',
      });
      
      onSuccess();
    },
    onError: (error: any) => {
      console.error('Error scheduling movement:', error);
      toast.error('Failed to schedule movement', {
        description: error.message || 'An error occurred while scheduling the movement',
      });
    },
  });

  // Submit handler
  const onSubmit = (values: FormValues) => {
    // Create reference number with format: TRADEREF-N where N is sequential
    const newMovementCount = existingMovementsCount + 1;
    
    // Generate a movement reference that includes the leg reference
    const referenceNumber = formatMovementReference(
      trade.trade_reference, 
      trade.leg_reference || '', 
      newMovementCount
    );
    
    createMovementMutation.mutate({
      ...values,
      referenceNumber
    });
  };

  return (
    <DialogContent className="sm:max-w-[625px]">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Ship className="h-5 w-5" />
          Schedule Movement for Trade {trade.trade_reference}
        </DialogTitle>
        <DialogDescription>
          Enter the details for scheduling a product movement. The scheduled quantity 
          cannot exceed the available balance.
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="scheduledQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity (MT)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      min={0}
                      max={trade.balance || trade.quantity}
                    />
                  </FormControl>
                  <FormDescription>
                    Available: {trade.balance || trade.quantity} MT
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bargeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vessel/Barge Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nominationEta"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Nomination ETA</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "pl-3 text-left font-normal",
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

            <FormField
              control={form.control}
              name="nominationValid"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Nomination Valid Until</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "pl-3 text-left font-normal",
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
            
            <FormField
              control={form.control}
              name="cashFlow"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Cash Flow Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "pl-3 text-left font-normal",
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

            <FormField
              control={form.control}
              name="loadport"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loadport</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="loadportInspector"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loadport Inspector</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an inspector" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {inspectors.map((inspector) => (
                        <SelectItem key={inspector.id} value={inspector.name}>
                          {inspector.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="other" className="text-blue-500 font-medium">
                        + Add new inspector...
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="disport"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Disport</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="disportInspector"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Disport Inspector</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an inspector" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {inspectors.map((inspector) => (
                        <SelectItem key={inspector.id} value={inspector.name}>
                          {inspector.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="other" className="text-blue-500 font-medium">
                        + Add new inspector...
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMovementMutation.isPending}>
              {createMovementMutation.isPending ? "Scheduling..." : "Schedule Movement"}
            </Button>
          </DialogFooter>
        </form>
      </Form>

      <AddInspectorDialog
        open={isAddInspectorOpen}
        onOpenChange={setIsAddInspectorOpen}
        onSuccess={(name) => {
          // Set the newly created inspector to the form
          if (inspectorToAdd === 'loadport') {
            form.setValue('loadportInspector', name);
          } else {
            form.setValue('disportInspector', name);
          }
        }}
      />
    </DialogContent>
  );
};

export default ScheduleMovementForm;
