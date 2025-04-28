
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { UseFormReturn } from 'react-hook-form';
import { DemurrageFormValues } from './DemurrageFormTypes';

interface BargeSectionFieldsProps {
  form: UseFormReturn<DemurrageFormValues>;
}

export const BargeSectionFields: React.FC<BargeSectionFieldsProps> = ({ form }) => {
  return (
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
  );
};
