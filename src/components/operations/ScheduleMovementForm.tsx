import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { OpenTrade } from '@/hooks/useOpenTrades';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { formatDateForStorage } from '@/utils/dateParsingUtils';
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
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';

interface ScheduleMovementFormProps {
  trade: OpenTrade;
  onSuccess: () => void;
  onCancel: () => void;
}

// Inspector options
const INSPECTOR_OPTIONS = ['Saybolt', 'Amspec', 'Camia'];
const CASH_FLOW_OPTIONS = ['Positive', 'Negative', 'Neutral'];

// Form schema
const formSchema = z.object({
  scheduledQuantity: z.number()
    .positive('Quantity must be greater than 0')
    .refine(val => val > 0, {
      message: 'Quantity must be greater than 0',
    }),
  nominationEta: z.date().optional(),
  nominationValid: z.date().optional(),
  cashFlow: z.string().optional(),
  bargeName: z.string().min(1, 'Barge name is required'),
  loadport: z.string().min(1, 'Loadport is required'),
  loadportInspector: z.string().optional(),
  disport: z.string().min(1, 'Disport is required'),
  disportInspector: z.string().optional(),
  blDate: z.date().optional(),
  actualQuantity: z.number().optional(),
  codDate: z.date().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const ScheduleMovementForm: React.FC<ScheduleMovementFormProps> = ({
  trade,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      scheduledQuantity: 0,
      bargeName: '',
      loadport: '',
      disport: '',
    },
  });

  const maxSchedulableQuantity = trade.balance || 0;

  // Handler for form submission
  const onSubmit = async (values: FormValues) => {
    try {
      if (values.scheduledQuantity > maxSchedulableQuantity) {
        form.setError('scheduledQuantity', {
          type: 'manual',
          message: `Cannot schedule more than the available balance (${maxSchedulableQuantity} MT)`,
        });
        return;
      }

      const movementData = {
        trade_leg_id: trade.trade_leg_id,
        parent_trade_id: trade.parent_trade_id,
        trade_reference: trade.trade_reference,
        counterparty: trade.counterparty,
        buy_sell: trade.buy_sell,
        product: trade.product,
        sustainability: trade.sustainability,
        inco_term: trade.inco_term,
        scheduled_quantity: values.scheduledQuantity,
        bl_quantity: 0, // Default, can be updated later
        nomination_eta: values.nominationEta ? values.nominationEta.toISOString() : null,
        nomination_valid: values.nominationValid ? values.nominationValid.toISOString() : null,
        cash_flow: values.cashFlow,
        barge_name: values.bargeName,
        loadport: values.loadport,
        loadport_inspector: values.loadportInspector,
        disport: values.disport,
        disport_inspector: values.disportInspector,
        bl_date: values.blDate ? formatDateForStorage(values.blDate) : null,
        actual_quantity: values.actualQuantity,
        cod_date: values.codDate ? formatDateForStorage(values.codDate) : null,
        pricing_type: trade.pricing_type,
        pricing_formula: trade.pricing_formula,
        comments: trade.comments,
        customs_status: trade.customs_status,
        credit_status: trade.credit_status,
        contract_status: trade.contract_status,
        status: 'scheduled',
      };

      const { error } = await supabase.from('movements').insert(movementData);

      if (error) {
        console.error('Error creating movement:', error);
        toast.error('Failed to schedule movement: ' + error.message);
        return;
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error in movement creation:', error);
      toast.error('An unexpected error occurred: ' + error.message);
    }
  };

  return (
    <DialogContent className="sm:max-w-[700px]">
      <DialogHeader>
        <DialogTitle>Schedule Barge Movement</DialogTitle>
        <DialogDescription>
          Schedule a movement for trade {trade.trade_reference}. Available balance: {maxSchedulableQuantity} MT.
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Read-only trade information */}
            <div className="border p-3 rounded col-span-2 bg-muted/20">
              <h4 className="font-medium mb-2">Trade Information</h4>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="font-medium">Reference:</span> {trade.trade_reference}
                </div>
                <div>
                  <span className="font-medium">Type:</span> {trade.buy_sell.toUpperCase()}
                </div>
                <div>
                  <span className="font-medium">Product:</span> {trade.product}
                </div>
                <div>
                  <span className="font-medium">Counterparty:</span> {trade.counterparty}
                </div>
                <div>
                  <span className="font-medium">Total Quantity:</span> {trade.quantity} MT
                </div>
                <div>
                  <span className="font-medium">Available:</span> {maxSchedulableQuantity} MT
                </div>
              </div>
            </div>

            {/* Form fields */}
            <FormField
              control={form.control}
              name="scheduledQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scheduled Quantity (MT)*</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={maxSchedulableQuantity}
                      step={0.001}
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bargeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Barge Name*</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="loadport"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loadport*</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="disport"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Disport*</FormLabel>
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
                        <SelectValue placeholder="Select inspector" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {INSPECTOR_OPTIONS.map(option => (
                        <SelectItem key={option} value={option}>
                          {option}
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
                        <SelectValue placeholder="Select inspector" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {INSPECTOR_OPTIONS.map(option => (
                        <SelectItem key={option} value={option}>
                          {option}
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
              name="cashFlow"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cash Flow</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select cash flow" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CASH_FLOW_OPTIONS.map(option => (
                        <SelectItem key={option} value={option}>
                          {option}
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
              name="nominationEta"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Nomination ETA</FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value}
                      setDate={field.onChange}
                      placeholder="Select ETA date"
                    />
                  </FormControl>
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
                  <FormControl>
                    <DatePicker
                      date={field.value}
                      setDate={field.onChange}
                      placeholder="Select valid date"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="blDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>BL Date</FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value}
                      setDate={field.onChange}
                      placeholder="Select BL date"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="codDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>COD Date</FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value}
                      setDate={field.onChange}
                      placeholder="Select COD date"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="actualQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Actual Quantity (MT)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={0.001}
                      {...field}
                      onChange={e => {
                        const value = e.target.value ? parseFloat(e.target.value) : undefined;
                        field.onChange(value);
                      }}
                      value={field.value === undefined ? '' : field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">Schedule Movement</Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export default ScheduleMovementForm;
