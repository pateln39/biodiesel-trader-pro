
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from 'react-hook-form';
import { DemurrageFormValues } from './DemurrageFormTypes';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoIcon } from 'lucide-react';

interface SummarySectionProps {
  form: UseFormReturn<DemurrageFormValues>;
  calculatedValues: {
    totalTimeUsed: number;
    demurrageHours: number;
    demurrageDue: number;
    totalLaytime: number;
    rate: number;
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

        <div className="mb-4">
          <div className="flex items-center gap-1.5">
            <FormLabel>Free Time (allowed laytime)</FormLabel>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  Automatically calculated based on loaded quantity
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            type="number"
            value={calculatedValues.totalLaytime}
            className="font-medium bg-muted text-foreground"
            readOnly
          />
        </div>

        <div className="mb-4">
          <FormLabel>Demurrage Hours</FormLabel>
          <Input
            type="number"
            value={calculatedValues.demurrageHours}
            className="font-medium bg-muted text-foreground"
            readOnly
          />
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-1.5">
            <FormLabel>Rate (€/hour)</FormLabel>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  Automatically calculated based on {form.watch('calculationRate') === 'TTB' ? 'deadweight tonnage' : 'loaded quantity'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            type="number"
            value={calculatedValues.rate}
            className="font-medium bg-muted text-foreground"
            readOnly
          />
        </div>

        <div className="col-span-2 mb-4">
          <FormLabel>Demurrage Due (€)</FormLabel>
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
