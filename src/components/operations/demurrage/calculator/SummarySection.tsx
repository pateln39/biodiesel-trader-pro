
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from 'react-hook-form';
import { DemurrageFormValues } from './DemurrageFormTypes';

interface SummarySectionProps {
  form: UseFormReturn<DemurrageFormValues>;
  calculatedValues: {
    totalTimeUsed: number;
    demurrageHours: number;
    demurrageDue: number;
  };
}

export const SummarySection: React.FC<SummarySectionProps> = ({ form, calculatedValues }) => {
  return (
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
    </div>
  );
};
