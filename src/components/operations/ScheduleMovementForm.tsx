
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OpenTrade } from '@/hooks/useOpenTrades';
import { format } from 'date-fns';
import { CalendarIcon, Ship, ClipboardCheck } from 'lucide-react';
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
import { Movement } from '@/types';
import { formatDateForStorage } from '@/utils/dateParsingUtils';
import { DatePicker } from '@/components/ui/date-picker';
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsTitle } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';

// Form schema validation
const formSchema = z.object({
  scheduledQuantity: z.coerce.number().positive("Quantity must be positive"),
  actualQuantity: z.coerce.number().positive("Quantity must be positive").optional(),
  nominationEta: z.date().optional(),
  nominationValid: z.date().optional(),
  cashFlow: z.date().optional(),
  blDate: z.date().optional(),
  codDate: z.date().optional(),
  bargeName: z.string().optional(),
  loadport: z.string().optional(),
  loadportInspector: z.string().optional(),
  disport: z.string().optional(),
  disportInspector: z.string().optional(),
  // Add operator checklist fields
  bargeOrdersChecked: z.boolean().optional().default(false),
  nominationChecked: z.boolean().optional().default(false),
  loadPlanChecked: z.boolean().optional().default(false),
  coaReceivedChecked: z.boolean().optional().default(false),
  coaSentChecked: z.boolean().optional().default(false),
  eadChecked: z.boolean().optional().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface ScheduleMovementFormProps {
  trade: OpenTrade;
  onSuccess: () => void;
  onCancel: () => void;
  isEditMode?: boolean;
  initialMovement?: Movement;
}

const ScheduleMovementForm: React.FC<ScheduleMovementFormProps> = ({ 
  trade, 
  onSuccess,
  onCancel,
  isEditMode = false,
  initialMovement
}) => {
  const queryClient = useQueryClient();
  const { data: inspectorsData } = useInspectors();
  const inspectors = inspectorsData || [];
  const [isAddInspectorOpen, setIsAddInspectorOpen] = useState(false);
  const [inspectorToAdd, setInspectorToAdd] = useState<'loadport' | 'disport'>('loadport');
  const [activeTab, setActiveTab] = useState('movement');
  
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
      scheduledQuantity: initialMovement?.scheduledQuantity || trade.balance || trade.quantity,
      actualQuantity: initialMovement?.actualQuantity,
      nominationEta: initialMovement?.nominationEta,
      nominationValid: initialMovement?.nominationValid,
      cashFlow: initialMovement?.cashFlow ? new Date(initialMovement.cashFlow) : undefined,
      blDate: initialMovement?.blDate,
      codDate: initialMovement?.codDate,
      bargeName: initialMovement?.bargeName || '',
      loadport: initialMovement?.loadport || trade.loadport || '',
      loadportInspector: initialMovement?.loadportInspector || '',
      disport: initialMovement?.disport || trade.disport || '',
      disportInspector: initialMovement?.disportInspector || '',
      bargeOrdersChecked: false,
      nominationChecked: false,
      loadPlanChecked: false,
      coaReceivedChecked: false,
      coaSentChecked: false,
      eadChecked: false,
    },
  });

  // Create/update movement mutation
  const movementMutation = useMutation({
    mutationFn: async (data: FormValues & { referenceNumber: string }) => {
      if (isEditMode && initialMovement) {
        // Update existing movement
        const { error } = await supabase
          .from('movements')
          .update({
            scheduled_quantity: data.scheduledQuantity,
            actual_quantity: data.actualQuantity,
            nomination_eta: data.nominationEta ? formatDateForStorage(data.nominationEta) : null,
            nomination_valid: data.nominationValid ? formatDateForStorage(data.nominationValid) : null,
            cash_flow: data.cashFlow ? formatDateForStorage(data.cashFlow) : null,
            bl_date: data.blDate ? formatDateForStorage(data.blDate) : null,
            cod_date: data.codDate ? formatDateForStorage(data.codDate) : null,
            barge_name: data.bargeName,
            loadport: data.loadport,
            loadport_inspector: data.loadportInspector,
            disport: data.disport,
            disport_inspector: data.disportInspector,
            // Store operator checklist data as JSON in a metadata field or as separate columns
            barge_orders_checked: data.bargeOrdersChecked,
            nomination_checked: data.nominationChecked,
            load_plan_checked: data.loadPlanChecked,
            coa_received_checked: data.coaReceivedChecked,
            coa_sent_checked: data.coaSentChecked,
            ead_checked: data.eadChecked,
          })
          .eq('id', initialMovement.id);

        if (error) throw error;
      } else {
        // Create new movement - Fixed the JSON type issue and column names
        const movementData = {
          trade_leg_id: trade.trade_leg_id,
          parent_trade_id: trade.parent_trade_id,
          reference_number: data.referenceNumber,
          trade_reference: trade.trade_reference,
          counterparty: trade.counterparty,
          buy_sell: trade.buy_sell,
          product: trade.product,
          sustainability: trade.sustainability,
          inco_term: trade.inco_term,
          scheduled_quantity: data.scheduledQuantity,
          actual_quantity: data.actualQuantity,
          bl_quantity: data.scheduledQuantity, // Initially set BL quantity equal to scheduled
          nomination_eta: data.nominationEta ? formatDateForStorage(data.nominationEta) : null,
          nomination_valid: data.nominationValid ? formatDateForStorage(data.nominationValid) : null,
          cash_flow: data.cashFlow ? formatDateForStorage(data.cashFlow) : null,
          bl_date: data.blDate ? formatDateForStorage(data.blDate) : null,
          cod_date: data.codDate ? formatDateForStorage(data.codDate) : null,
          barge_name: data.bargeName,
          loadport: data.loadport,
          loadport_inspector: data.loadportInspector,
          disport: data.disport,
          disport_inspector: data.disportInspector,
          status: 'scheduled',
          pricing_type: trade.pricing_type,
          // Convert pricing_formula to JSON string to fix type compatibility issue
          pricing_formula: trade.pricing_formula ? JSON.parse(JSON.stringify(trade.pricing_formula)) : null,
          customs_status: trade.customs_status,
          credit_status: trade.credit_status,
          contract_status: trade.contract_status,
          // Store operator checklist data
          barge_orders_checked: data.bargeOrdersChecked,
          nomination_checked: data.nominationChecked,
          load_plan_checked: data.loadPlanChecked,
          coa_received_checked: data.coaReceivedChecked,
          coa_sent_checked: data.coaSentChecked,
          ead_checked: data.eadChecked,
        };

        const { error } = await supabase
          .from('movements')
          .insert(movementData);

        if (error) throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      // Invalidate all related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['openTrades'] });
      
      toast.success(isEditMode ? 'Movement updated' : 'Movement scheduled', {
        description: isEditMode 
          ? 'The movement has been updated successfully'
          : 'The movement has been scheduled successfully',
      });
      
      onSuccess();
    },
    onError: (error: any) => {
      console.error(isEditMode ? 'Error updating movement:' : 'Error scheduling movement:', error);
      toast.error(isEditMode ? 'Failed to update movement' : 'Failed to schedule movement', {
        description: error.message || 'An error occurred',
      });
    },
  });

  // Handle inspector selection
  const handleInspectorSelect = (value: string, type: 'loadport' | 'disport') => {
    if (value === 'other') {
      setInspectorToAdd(type);
      setIsAddInspectorOpen(true);
    } else {
      form.setValue(type === 'loadport' ? 'loadportInspector' : 'disportInspector', value);
    }
  };

  // Submit handler
  const onSubmit = (values: FormValues) => {
    // For new movements, create reference number with format: TRADEREF-LEG-N where N is sequential
    let referenceNumber = '';
    
    if (!isEditMode) {
      const newMovementCount = existingMovementsCount + 1;
      
      // Generate a movement reference that includes the leg reference
      referenceNumber = formatMovementReference(
        trade.trade_reference, 
        trade.leg_reference || '', 
        newMovementCount
      );
    } else if (initialMovement) {
      referenceNumber = initialMovement.referenceNumber || '';
    }
    
    movementMutation.mutate({
      ...values,
      referenceNumber
    });
  };

  return (
    <DialogContent className="sm:max-w-[625px]">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {activeTab === 'checklist' ? <ClipboardCheck className="h-5 w-5" /> : <Ship className="h-5 w-5" />}
          {activeTab === 'checklist' ? "Operator's Checklist" : isEditMode ? 'Edit Movement' : 'Schedule Movement'} for Trade {trade.trade_reference}
        </DialogTitle>
        <DialogDescription>
          {activeTab === 'checklist' 
            ? "Complete the operator's checklist for this movement."
            : isEditMode 
              ? 'Update the details for this product movement.'
              : 'Enter the details for scheduling a product movement. The scheduled quantity cannot exceed the available balance.'
          }
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs 
            defaultValue="movement" 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="movement">Movement Details</TabsTrigger>
              <TabsTrigger value="checklist">Operator's Checklist</TabsTrigger>
            </TabsList>
            
            <TabsContent value="movement" className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="scheduledQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scheduled Quantity (MT)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          min={0}
                          max={!isEditMode ? (trade.balance || trade.quantity) : undefined}
                        />
                      </FormControl>
                      {!isEditMode && (
                        <FormDescription>
                          Available: {trade.balance || trade.quantity} MT
                        </FormDescription>
                      )}
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
                          {...field} 
                          min={0}
                          value={field.value || ''}
                          onChange={(e) => {
                            const value = e.target.value === '' ? undefined : Number(e.target.value);
                            field.onChange(value);
                          }}
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
                      <DatePicker
                        date={field.value}
                        setDate={field.onChange}
                        placeholder="Select ETA date"
                      />
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
                      <DatePicker
                        date={field.value}
                        setDate={field.onChange}
                        placeholder="Select valid until date"
                      />
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
                      <DatePicker
                        date={field.value}
                        setDate={field.onChange}
                        placeholder="Select cash flow date"
                      />
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
                      <DatePicker
                        date={field.value}
                        setDate={field.onChange}
                        placeholder="Select BL date"
                      />
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
                      <DatePicker
                        date={field.value}
                        setDate={field.onChange}
                        placeholder="Select COD date"
                      />
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
                        onValueChange={(value) => handleInspectorSelect(value, 'loadport')} 
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
                        onValueChange={(value) => handleInspectorSelect(value, 'disport')} 
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
            </TabsContent>

            <TabsContent value="checklist" className="space-y-4 pt-4">
              <TabsTitle>Operator's Checklist</TabsTitle>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="bargeOrdersChecked"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2 hover:bg-muted/50 rounded-md">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-base italic font-normal">
                        Barge Orders
                      </FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="nominationChecked"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2 hover:bg-muted/50 rounded-md">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-base italic font-normal">
                        Nomination
                      </FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="loadPlanChecked"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2 hover:bg-muted/50 rounded-md">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-base italic font-normal">
                        Load plan
                      </FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="coaReceivedChecked"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2 hover:bg-muted/50 rounded-md">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-base italic font-normal">
                        COA received
                      </FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="coaSentChecked"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2 hover:bg-muted/50 rounded-md">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-base italic font-normal">
                        COA sent
                      </FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="eadChecked"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2 hover:bg-muted/50 rounded-md">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-base italic font-normal">
                        EAD checked
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={movementMutation.isPending}>
              {movementMutation.isPending 
                ? (isEditMode ? "Updating..." : "Scheduling...") 
                : (isEditMode ? "Update Movement" : "Schedule Movement")}
            </Button>
          </DialogFooter>
        </form>
      </Form>

      <AddInspectorDialog
        open={isAddInspectorOpen}
        onOpenChange={setIsAddInspectorOpen}
        onInspectorAdded={(name) => {
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
