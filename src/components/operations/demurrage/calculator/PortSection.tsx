
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { UseFormReturn } from 'react-hook-form';
import { DemurrageFormValues, ManualOverride } from './DemurrageFormTypes';
import { EditableTotalHoursField } from '../EditableTotalHoursField';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoIcon } from 'lucide-react';

interface PortSectionProps {
  form: UseFormReturn<DemurrageFormValues>;
  type: 'load' | 'discharge';
  calculatedHours: number;
  override: ManualOverride | null;
  onOverrideChange: (value: number | null, comment: string) => void;
  className?: string;
  allowedLaytime: number;
  timeSaved: number;
}

export const PortSection: React.FC<PortSectionProps> = ({ 
  form, 
  type, 
  calculatedHours,
  override,
  onOverrideChange,
  className = '',
  allowedLaytime,
  timeSaved
}) => {
  const isLoadPort = type === 'load';
  const baseFieldName = isLoadPort ? 'loadPort' : 'dischargePort';
  const title = isLoadPort ? 'Load Port' : 'Discharge Port';
  const bgColor = isLoadPort ? 'blue-50/10' : 'green-50/10';

  return (
    <div className={`p-4 bg-${bgColor} rounded-md border ${className}`}>
      <div className="font-semibold text-lg mb-4">{title}</div>
      
      <FormField
        control={form.control}
        name={`${baseFieldName}.start`}
        render={({ field }) => (
          <FormItem className="mb-4">
            <FormLabel>Start</FormLabel>
            <FormControl>
              <DateTimePicker 
                date={field.value || new Date()}
                setDate={(date) => {
                  field.onChange(date);
                  form.trigger(baseFieldName);
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
        name={`${baseFieldName}.finish`}
        render={({ field }) => (
          <FormItem className="mb-4">
            <FormLabel>Finish</FormLabel>
            <FormControl>
              <DateTimePicker 
                date={field.value || new Date()}
                setDate={(date) => {
                  field.onChange(date);
                  form.trigger(baseFieldName);
                }}
                placeholder="Select finish date/time"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <EditableTotalHoursField
        calculatedValue={calculatedHours}
        label="Total (hours)"
        onSave={onOverrideChange}
        isOverridden={!!override}
      />

      <FormField
        control={form.control}
        name={`${baseFieldName}.rounding`}
        render={({ field }) => (
          <FormItem className="mb-4">
            <FormLabel>Rounding</FormLabel>
            <Select 
              onValueChange={(value) => {
                field.onChange(value);
                form.trigger(baseFieldName);
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

      <div className="mb-4">
        <div className="flex items-center gap-1.5">
          <FormLabel>Allowed Laytime</FormLabel>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                Half of the total allowed laytime based on loaded quantity
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Input
          type="number"
          value={allowedLaytime}
          className="font-medium bg-muted text-foreground"
          readOnly
        />
      </div>

      <FormField
        control={form.control}
        name={isLoadPort ? "loadPort.loadDemurrage" : "dischargePort.dischargeDemurrage"}
        render={({ field }) => (
          <FormItem className="mb-4">
            <div className="flex items-center gap-1.5">
              <FormLabel>{isLoadPort ? 'Load' : 'Discharge'} Demurrage</FormLabel>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Automatically calculated when total hours exceed allowed laytime
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <FormControl>
              <Input 
                type="number" 
                value={field.value || 0}
                className="font-medium bg-muted text-foreground"
                readOnly
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div>
        <div className="flex items-center gap-1.5">
          <FormLabel>Time Saved</FormLabel>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                Time saved when total hours are less than allowed laytime
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Input
          type="number"
          value={timeSaved}
          className="font-medium bg-muted text-foreground"
          readOnly
        />
      </div>
    </div>
  );
};
