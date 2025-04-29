
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { UseFormReturn } from 'react-hook-form';
import { DemurrageFormValues } from './DemurrageFormTypes';

interface NominationSectionFieldsProps {
  form: UseFormReturn<DemurrageFormValues>;
}

export const NominationSectionFields: React.FC<NominationSectionFieldsProps> = ({ form }) => {
  return (
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
  );
};
