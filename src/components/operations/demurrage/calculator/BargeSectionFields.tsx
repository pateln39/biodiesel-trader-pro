import React, { useEffect } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { UseFormReturn } from 'react-hook-form';
import { DemurrageFormValues } from './DemurrageFormTypes';
import { useBargesVessels } from '@/hooks/useBargesVessels';

interface BargeSectionFieldsProps {
  form: UseFormReturn<DemurrageFormValues>;
}

export const BargeSectionFields: React.FC<BargeSectionFieldsProps> = ({ form }) => {
  const { barges, loading } = useBargesVessels();

  // When barge is selected, update the deadweight
  useEffect(() => {
    const bargeId = form.getValues('bargeVesselId');
    const bargeName = form.getValues('bargeName');

    if (!bargeId && bargeName && barges.length > 0) {
      // Try to find the barge by name
      const selectedBarge = barges.find(barge => barge.name === bargeName);
      if (selectedBarge) {
        form.setValue('bargeVesselId', selectedBarge.id);
        form.setValue('deadWeight', selectedBarge.deadweight);
      }
    }
  }, [barges, form]);

  const handleBargeChange = (bargeName: string) => {
    form.setValue('bargeName', bargeName);
    
    // Find the selected barge and update the deadweight
    const selectedBarge = barges.find(barge => barge.name === bargeName);
    if (selectedBarge) {
      form.setValue('bargeVesselId', selectedBarge.id);
      form.setValue('deadWeight', selectedBarge.deadweight);
    } else {
      // If barge not found in database, reset the ID and keep deadweight as is
      form.setValue('bargeVesselId', undefined);
    }
  };

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
              {barges.length > 0 ? (
                <Select
                  onValueChange={handleBargeChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a barge" />
                  </SelectTrigger>
                  <SelectContent>
                    {barges.map(barge => (
                      <SelectItem key={barge.id} value={barge.name}>
                        {barge.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input {...field} />
              )}
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
                readOnly={!!form.getValues('bargeVesselId')}
                className={form.getValues('bargeVesselId') ? "bg-muted" : ""}
              />
            </FormControl>
            <FormMessage />
            {form.getValues('bargeVesselId') && (
              <p className="text-xs text-muted-foreground">Value from database</p>
            )}
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
              value={field.value}
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
