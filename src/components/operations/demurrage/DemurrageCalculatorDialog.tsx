import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calculator } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DateTimePicker } from "@/components/ui/date-time-picker"; 
import { Movement } from '@/types';
import { toast } from 'sonner';
import { EditableTotalHoursField } from './EditableTotalHoursField';

interface ManualOverride {
  value: number;
  comment: string;
  timestamp: Date;
}

interface DemurrageCalculatorDialogProps {
  movement: Movement;
  onClose: () => void;
}

const demurrageFormSchema = z.object({
  bargeName: z.string().min(1, "Barge name is required"),
  blDate: z.date().optional(),
  deadWeight: z.number().min(0).optional(),
  quantityLoaded: z.number().min(0).optional(),
  calculationRate: z.enum(["TTB", "BP"]),
  nominationSent: z.date().optional(),
  nominationValid: z.date().optional(),
  bargeArrived: z.date().optional(),
  timeStartsToRun: z.date().optional(),
  loadPort: z.object({
    start: z.date().optional(),
    finish: z.date().optional(),
    rounding: z.enum(["Y", "N"]),
    loadDemurrage: z.number().min(0).optional(),
  }),
  dischargePort: z.object({
    start: z.date().optional(),
    finish: z.date().optional(),
    rounding: z.enum(["Y", "N"]),
    dischargeDemurrage: z.number().min(0).optional(),
  }),
  freeTime: z.number().min(0).optional(),
  rate: z.number().min(0).optional(),
  comments: z.string().optional(),
});

type DemurrageFormValues = z.infer<typeof demurrageFormSchema>;

const DemurrageCalculatorDialog: React.FC<DemurrageCalculatorDialogProps> = ({
  movement,
  onClose
}) => {
  const [loadPortOverride, setLoadPortOverride] = useState<ManualOverride | null>(null);
  const [dischargePortOverride, setDischargePortOverride] = useState<ManualOverride | null>(null);

  const form = useForm<DemurrageFormValues>({
    resolver: zodResolver(demurrageFormSchema),
    defaultValues: {
      bargeName: movement.bargeName || '',
      blDate: movement.blDate ? new Date(movement.blDate) : undefined,
      deadWeight: 0, // Will be auto-filled based on barge name
      quantityLoaded: movement.actualQuantity || 0,
      calculationRate: "TTB",
      nominationSent: undefined,
      nominationValid: movement.nominationValid ? new Date(movement.nominationValid) : undefined,
      bargeArrived: undefined,
      timeStartsToRun: undefined,
      loadPort: {
        start: new Date(),
        finish: new Date(),
        rounding: "N",
        loadDemurrage: 0,
      },
      dischargePort: {
        start: new Date(),
        finish: new Date(),
        rounding: "N",
        dischargeDemurrage: 0,
      },
      freeTime: 0,
      rate: 0,
      comments: '',
    },
  });

  const formValues = form.watch();
  const [calculatedValues, setCalculatedValues] = useState({
    loadPortTotal: 0,
    dischargePortTotal: 0,
    loadTimeSaved: 0,
    dischargeTimeSaved: 0,
    totalTimeUsed: 0,
    demurrageHours: 0,
    demurrageDue: 0,
  });

  const calculateHoursDifference = (startDate?: Date, endDate?: Date, shouldRound?: boolean): number => {
    console.log('Calculating hours difference:', { startDate, endDate, shouldRound });
    
    if (!startDate || !endDate) {
      console.log('Missing start or end date');
      return 0;
    }
    
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.error('Invalid date object detected');
        return 0;
      }
      
      const diffMs = end.getTime() - start.getTime();
      const hours = diffMs / (1000 * 60 * 60);
      
      console.log('Calculated hours:', hours);
      
      if (shouldRound) {
        const rounded = Math.round(hours);
        console.log('Rounded hours:', rounded);
        return rounded;
      }
      
      const fixed = Number(hours.toFixed(2));
      console.log('Fixed decimal hours:', fixed);
      return fixed;
    } catch (error) {
      console.error('Error calculating hours difference:', error);
      return 0;
    }
  };

  useEffect(() => {
    console.log('Form values changed:', formValues);
    
    try {
      const loadPortTotal = loadPortOverride?.value || calculateHoursDifference(
        formValues.loadPort.start, 
        formValues.loadPort.finish,
        formValues.loadPort.rounding === 'Y'
      );
      
      const dischargePortTotal = dischargePortOverride?.value || calculateHoursDifference(
        formValues.dischargePort.start, 
        formValues.dischargePort.finish,
        formValues.dischargePort.rounding === 'Y'
      );
      
      console.log('Calculated totals:', { loadPortTotal, dischargePortTotal });
      
      const loadTimeSaved = formValues.freeTime && loadPortTotal < formValues.freeTime / 2 
        ? (formValues.freeTime / 2) - loadPortTotal 
        : 0;
      
      const dischargeTimeSaved = formValues.freeTime && dischargePortTotal < formValues.freeTime / 2 
        ? (formValues.freeTime / 2) - dischargePortTotal 
        : 0;

      const totalTimeUsed = loadPortTotal + dischargePortTotal;
      const demurrageHours = formValues.freeTime ? Math.max(0, totalTimeUsed - formValues.freeTime) : 0;
      const demurrageDue = demurrageHours * (formValues.rate || 0);

      setCalculatedValues({
        loadPortTotal,
        dischargePortTotal,
        loadTimeSaved: Number(loadTimeSaved.toFixed(2)),
        dischargeTimeSaved: Number(dischargeTimeSaved.toFixed(2)),
        totalTimeUsed: Number(totalTimeUsed.toFixed(2)),
        demurrageHours: Number(demurrageHours.toFixed(2)),
        demurrageDue: Number(demurrageDue.toFixed(2)),
      });
    } catch (error) {
      console.error('Error in calculation effect:', error);
      toast.error("Error calculating values");
    }
  }, [
    formValues.loadPort.start,
    formValues.loadPort.finish,
    formValues.loadPort.rounding,
    formValues.dischargePort.start,
    formValues.dischargePort.finish,
    formValues.dischargePort.rounding,
    formValues.freeTime,
    formValues.rate,
    loadPortOverride,
    dischargePortOverride
  ]);

  const handleLoadPortTotalSave = (value: number, comment: string) => {
    setLoadPortOverride({
      value,
      comment,
      timestamp: new Date(),
    });
  };

  const handleDischargePortTotalSave = (value: number, comment: string) => {
    setDischargePortOverride({
      value,
      comment,
      timestamp: new Date(),
    });
  };

  const onSubmit = (data: DemurrageFormValues) => {
    console.log('Demurrage calculation form submitted:', data);
    console.log('Calculated values:', calculatedValues);
    toast.success("Calculation complete", { description: "Demurrage calculation has been saved." });
    onClose();
  };

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" /> Demurrage Calculator
        </DialogTitle>
      </DialogHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/20 rounded-md border">
            <div className="col-span-2 font-semibold text-lg mb-2">Barge Details</div>
            
            <FormField
              control={form.control}
              name="bargeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Barge Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deadWeight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deadweight (DWT)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantityLoaded"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity Loaded</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                      value={field.value || ''}
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
                <FormItem>
                  <FormLabel>BL Date</FormLabel>
                  <FormControl>
                    <DatePicker 
                      date={field.value} 
                      setDate={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="calculationRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Calculation Rate</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select rate type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="TTB">TTB</SelectItem>
                      <SelectItem value="BP">BP</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/20 rounded-md border">
            <div className="col-span-2 font-semibold text-lg mb-2">Nomination Details</div>
            
            <FormField
              control={form.control}
              name="nominationSent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nomination Sent</FormLabel>
                  <FormControl>
                    <DateTimePicker 
                      date={field.value || new Date()}
                      setDate={field.onChange}
                      placeholder="Select date and time"
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
                <FormItem>
                  <FormLabel>Nomination Valid</FormLabel>
                  <FormControl>
                    <DateTimePicker 
                      date={field.value || new Date()}
                      setDate={field.onChange}
                      placeholder="Select date and time"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bargeArrived"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Barge Arrived</FormLabel>
                  <FormControl>
                    <DateTimePicker 
                      date={field.value || new Date()}
                      setDate={field.onChange}
                      placeholder="Select date and time"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="timeStartsToRun"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time Starts to Run</FormLabel>
                  <FormControl>
                    <DateTimePicker 
                      date={field.value || new Date()}
                      setDate={field.onChange}
                      placeholder="Select date and time"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="p-4 bg-blue-50/10 rounded-md border">
              <div className="font-semibold text-lg mb-4">Load Port</div>
              
              <FormField
                control={form.control}
                name="loadPort.start"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Start</FormLabel>
                    <FormControl>
                      <DateTimePicker 
                        date={field.value || new Date()}
                        setDate={(date) => {
                          field.onChange(date);
                          form.trigger('loadPort');
                        }}
                        placeholder="Select start date/time"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="loadPort.finish"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Finish</FormLabel>
                    <FormControl>
                      <DateTimePicker 
                        date={field.value || new Date()}
                        setDate={(date) => {
                          field.onChange(date);
                          form.trigger('loadPort');
                        }}
                        placeholder="Select finish date/time"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <EditableTotalHoursField
                calculatedValue={calculatedValues.loadPortTotal}
                label="Total (hours)"
                onSave={handleLoadPortTotalSave}
                isOverridden={!!loadPortOverride}
              />

              <FormField
                control={form.control}
                name="loadPort.rounding"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Rounding</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.trigger('loadPort');
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Y">Yes</SelectItem>
                        <SelectItem value="N">No</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="loadPort.loadDemurrage"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Load Demurrage</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>Time Saved</FormLabel>
                <Input
                  type="number"
                  value={calculatedValues.loadTimeSaved}
                  className="font-medium bg-muted text-foreground"
                  readOnly
                />
              </div>
            </div>

            <div className="p-4 bg-green-50/10 rounded-md border">
              <div className="font-semibold text-lg mb-4">Discharge Port</div>
              
              <FormField
                control={form.control}
                name="dischargePort.start"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Start</FormLabel>
                    <FormControl>
                      <DateTimePicker 
                        date={field.value || new Date()}
                        setDate={(date) => {
                          field.onChange(date);
                          form.trigger('dischargePort');
                        }}
                        placeholder="Select start date/time"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dischargePort.finish"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Finish</FormLabel>
                    <FormControl>
                      <DateTimePicker 
                        date={field.value || new Date()}
                        setDate={(date) => {
                          field.onChange(date);
                          form.trigger('dischargePort');
                        }}
                        placeholder="Select finish date/time"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <EditableTotalHoursField
                calculatedValue={calculatedValues.dischargePortTotal}
                label="Total (hours)"
                onSave={handleDischargePortTotalSave}
                isOverridden={!!dischargePortOverride}
              />

              <FormField
                control={form.control}
                name="dischargePort.rounding"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Rounding</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.trigger('dischargePort');
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Y">Yes</SelectItem>
                        <SelectItem value="N">No</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dischargePort.dischargeDemurrage"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Discharge Demurrage</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>Time Saved</FormLabel>
                <Input
                  type="number"
                  value={calculatedValues.dischargeTimeSaved}
                  className="font-medium bg-muted text-foreground"
                  readOnly
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-purple-50/10 rounded-md border">
            <div className="font-semibold text-lg mb-4">Summary</div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="mb-4">
                <FormLabel>Total Time Used (hours)</FormLabel>
                <Input
                  type="number"
                  value={calculatedValues.totalTimeUsed}
                  className="font-medium bg-muted text-foreground"
                  readOnly
                />
              </div>

              <FormField
                control={form.control}
                name="freeTime"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Free Time (allowed laytime)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="mb-4">
                <FormLabel>Demurrage Hours</FormLabel>
                <Input
                  type="number"
                  value={calculatedValues.demurrageHours}
                  className="font-medium bg-muted text-foreground"
                  readOnly
                />
              </div>

              <FormField
                control={form.control}
                name="rate"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Rate</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="col-span-2 mb-4">
                <FormLabel>Demurrage Due</FormLabel>
                <Input
                  type="number"
                  value={calculatedValues.demurrageDue}
                  className="font-bold text-lg bg-muted text-foreground"
                  readOnly
                />
              </div>
            </div>
          </div>

          <FormField
            control={form.control}
            name="comments"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Comments</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    rows={4}
                    placeholder="Add notes or comments about this demurrage calculation"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Calculation</Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export default DemurrageCalculatorDialog;
