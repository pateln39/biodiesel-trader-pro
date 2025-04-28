
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { UseFormReturn } from 'react-hook-form';
import { DemurrageFormValues, ManualOverride } from './DemurrageFormTypes';
import { EditableTotalHoursField } from '../EditableTotalHoursField';

interface PortSectionProps {
  form: UseFormReturn<DemurrageFormValues>;
  type: 'load' | 'discharge';
  calculatedHours: number;
  override: ManualOverride | null;
  onOverrideChange: (value: number | null, comment: string) => void;
  className?: string;
}

export const PortSection: React.FC<PortSectionProps> = ({ 
  form, 
  type, 
  calculatedHours,
  override,
  onOverrideChange,
  className = ''
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

      <FormField
        control={form.control}
        name={isLoadPort ? `${baseFieldName}.loadDemurrage` : `${baseFieldName}.dischargeDemurrage`}
        render={({ field }) => (
          <FormItem className="mb-4">
            <FormLabel>{isLoadPort ? 'Load' : 'Discharge'} Demurrage</FormLabel>
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
          value={isLoadPort ? calculatedHours : calculatedHours}
          className="font-medium bg-muted text-foreground"
          readOnly
        />
      </div>
    </div>
  );
};
