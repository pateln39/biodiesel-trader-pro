import React, { useState } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from 'react-hook-form';
import { DemurrageFormValues, ManualOverride } from './DemurrageFormTypes';
import { EditableTotalHoursField } from "../EditableTotalHoursField";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DateTimePicker } from "@/components/ui/date-time-picker";

interface PortSectionProps {
  form: UseFormReturn<DemurrageFormValues>;
  type: 'load' | 'discharge';
  calculatedHours: number;
  override: ManualOverride | null;
  onOverrideChange: (value: number | null, comment: string) => void;
  allowedLaytime: number;
  timeSaved: number;
}

export const PortSection: React.FC<PortSectionProps> = ({
  form,
  type,
  calculatedHours,
  override,
  onOverrideChange,
  allowedLaytime,
  timeSaved
}) => {
  const [showOverrideComment, setShowOverrideComment] = useState(false);

  const isLoad = type === 'load';
  const baseFieldName = isLoad ? 'loadPort' : 'dischargePort';
  const title = isLoad ? 'Load Port' : 'Discharge Port';
  const roundingValue = form.watch(`${baseFieldName}.rounding`);
  const isManual = form.watch(`${baseFieldName}.isManual`);
  const demurrageFieldName = isLoad ? 'loadPort.loadDemurrage' : 'dischargePort.dischargeDemurrage';

  const handleOverrideChange = (value: number | null, comment: string) => {
    form.setValue(`${baseFieldName}.isManual`, value !== null);
    if (value !== null) {
      form.setValue(`${baseFieldName}.overrideComment`, comment);
    } else {
      form.setValue(`${baseFieldName}.overrideComment`, undefined);
    }
    onOverrideChange(value, comment);
  };

  return (
    <div className="p-4 bg-muted/20 rounded-md border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">{title}</h3>
        {isManual && (
          <Badge variant="outline" className="bg-yellow-100 hover:bg-yellow-200">
            Manual Override
          </Badge>
        )}
      </div>
      
      <FormField
        control={form.control}
        name={`${baseFieldName}.start`}
        render={({ field }) => (
          <FormItem className="mb-4">
            <FormLabel>Start Time</FormLabel>
            <FormControl>
              <DateTimePicker 
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
        name={`${baseFieldName}.finish`}
        render={({ field }) => (
          <FormItem className="mb-4">
            <FormLabel>Finish Time</FormLabel>
            <FormControl>
              <DateTimePicker 
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
        name={`${baseFieldName}.rounding`}
        render={({ field }) => (
          <FormItem className="mb-4">
            <FormLabel>Round Hours</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              defaultValue={field.value}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger className="w-20">
                  <SelectValue placeholder="Y/N" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Y">Y</SelectItem>
                <SelectItem value="N">N</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              Y = round to nearest hour, N = exact hours
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="mb-4">
        <EditableTotalHoursField
          calculatedValue={calculatedHours}
          overrideValue={override?.value}
          onSave={handleOverrideChange}
          comment={override?.comment || ''}
          onCommentToggle={() => setShowOverrideComment(!showOverrideComment)}
          isOverridden={isManual}
          label="Total Hours"
        />
      </div>

      {(isManual || showOverrideComment) && (
        <FormField
          control={form.control}
          name={`${baseFieldName}.overrideComment`}
          render={({ field }) => (
            <FormItem className="mb-4">
              <FormLabel>Override Reason</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="Explain reason for manual override"
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Changed layout: sequential instead of grid */}
      <div className="space-y-4 mb-4">
        <div>
          <Label>Allowed Laytime</Label>
          <div className="flex items-center mt-1">
            <Input type="text" value={allowedLaytime.toFixed(2)} readOnly className="bg-muted" />
            <span className="ml-2">hours</span>
          </div>
        </div>
        
        <div>
          <Label>Time Saved</Label>
          <div className="flex items-center mt-1">
            <Input 
              type="text" 
              value={timeSaved > 0 ? timeSaved.toFixed(2) : "0.00"} 
              readOnly 
              className="bg-muted"
            />
            <span className="ml-2">hours</span>
          </div>
        </div>
      </div>

      <FormField
        control={form.control}
        name={demurrageFieldName}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{title} Demurrage Hours</FormLabel>
            <FormControl>
              <div className="flex items-center">
                <Input 
                  type="number" 
                  value={field.value || 0}
                  onChange={field.onChange}
                  readOnly
                  className="bg-muted"
                />
                <span className="ml-2">hours</span>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
