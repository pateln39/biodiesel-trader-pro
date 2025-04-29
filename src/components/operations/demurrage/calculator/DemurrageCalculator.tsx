
import React, { useState, useEffect } from 'react';
import { Calculator } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";

import { Movement } from '@/types';
import { DemurrageFormValues, demurrageFormSchema, ManualOverride } from './DemurrageFormTypes';
import { BargeSectionFields } from './BargeSectionFields';
import { NominationSectionFields } from './NominationSectionFields';
import { PortSection } from './PortSection';
import { SummarySection } from './SummarySection';
import { 
  calculateTotalLaytime, 
  calculateRate, 
  calculateTimeSaved,
  calculateDemurrageHours
} from './demurrageCalculationUtils';

interface DemurrageCalculatorProps {
  movement: Movement;
  onClose: () => void;
}

export const DemurrageCalculator: React.FC<DemurrageCalculatorProps> = ({
  movement,
  onClose
}) => {
  const [loadPortOverride, setLoadPortOverride] = useState<ManualOverride | null>(null);
  const [dischargePortOverride, setDischargePortOverride] = useState<ManualOverride | null>(null);
  const [calculatedValues, setCalculatedValues] = useState({
    loadPortTotal: 0,
    dischargePortTotal: 0,
    loadTimeSaved: 0,
    dischargeTimeSaved: 0,
    totalTimeUsed: 0,
    demurrageHours: 0,
    demurrageDue: 0,
    totalLaytime: 0,
    allowedLaytimePerPort: 0,
    rate: 0,
  });

  const form = useForm<DemurrageFormValues>({
    resolver: zodResolver(demurrageFormSchema),
    defaultValues: {
      bargeName: movement.bargeName || '',
      blDate: movement.blDate ? new Date(movement.blDate) : undefined,
      deadWeight: 0,
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
      freeTime: 0, // Will be calculated automatically
      rate: 0, // Will be calculated automatically
      comments: '',
    },
  });

  const calculateHoursDifference = (startDate?: Date, endDate?: Date, shouldRound?: boolean): number => {
    if (!startDate || !endDate) return 0;
    
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return 0;
      }
      
      const diffMs = end.getTime() - start.getTime();
      const hours = diffMs / (1000 * 60 * 60);
      
      if (shouldRound) {
        return Math.round(hours);
      }
      
      return Number(hours.toFixed(2));
    } catch (error) {
      console.error('Error calculating hours difference:', error);
      return 0;
    }
  };

  const formValues = form.watch();

  // Calculate laytime and rate based on loaded quantity and calculation rate
  useEffect(() => {
    try {
      const quantityLoaded = formValues.quantityLoaded || 0;
      const deadWeight = formValues.deadWeight || 0;
      const calculationRate = formValues.calculationRate;
      
      // Calculate total allowed laytime based on loaded quantity
      const totalLaytime = calculateTotalLaytime(quantityLoaded);
      
      // Calculate rate based on calculation method
      const rate = calculateRate(calculationRate, deadWeight, quantityLoaded);
      
      // Update form values
      form.setValue('freeTime', totalLaytime);
      form.setValue('rate', rate);
      
      // Update calculated values
      setCalculatedValues(prev => ({
        ...prev,
        totalLaytime,
        allowedLaytimePerPort: totalLaytime / 2,
        rate
      }));
    } catch (error) {
      console.error('Error calculating laytime and rate:', error);
    }
  }, [formValues.quantityLoaded, formValues.deadWeight, formValues.calculationRate, form]);

  // Calculate port hours and demurrage
  useEffect(() => {
    try {
      const loadPortTotal = loadPortOverride?.value ?? calculateHoursDifference(
        formValues.loadPort.start, 
        formValues.loadPort.finish,
        formValues.loadPort.rounding === 'Y'
      );
      
      const dischargePortTotal = dischargePortOverride?.value ?? calculateHoursDifference(
        formValues.dischargePort.start, 
        formValues.dischargePort.finish,
        formValues.dischargePort.rounding === 'Y'
      );
      
      const allowedLaytimePerPort = calculatedValues.totalLaytime / 2;
      
      // Calculate time saved at each port
      const loadTimeSaved = calculateTimeSaved(loadPortTotal, allowedLaytimePerPort);
      const dischargeTimeSaved = calculateTimeSaved(dischargePortTotal, allowedLaytimePerPort);
      
      // Calculate demurrage hours at each port
      const loadDemurrageHours = calculateDemurrageHours(loadPortTotal, allowedLaytimePerPort);
      const dischargeDemurrageHours = calculateDemurrageHours(dischargePortTotal, allowedLaytimePerPort);
      
      // Update form values for demurrage hours
      form.setValue('loadPort.loadDemurrage', loadDemurrageHours);
      form.setValue('dischargePort.dischargeDemurrage', dischargeDemurrageHours);

      const totalTimeUsed = loadPortTotal + dischargePortTotal;
      const demurrageHours = Math.max(0, totalTimeUsed - calculatedValues.totalLaytime);
      const demurrageDue = demurrageHours * calculatedValues.rate;

      setCalculatedValues(prev => ({
        ...prev,
        loadPortTotal,
        dischargePortTotal,
        loadTimeSaved,
        dischargeTimeSaved,
        totalTimeUsed: Number(totalTimeUsed.toFixed(2)),
        demurrageHours: Number(demurrageHours.toFixed(2)),
        demurrageDue: Number(demurrageDue.toFixed(2)),
      }));
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
    calculatedValues.totalLaytime,
    calculatedValues.rate,
    loadPortOverride,
    dischargePortOverride,
    form
  ]);

  const handleLoadPortTotalSave = (value: number | null, comment: string) => {
    if (value === null) {
      setLoadPortOverride(null);
    } else {
      setLoadPortOverride({
        value,
        comment,
        timestamp: new Date(),
      });
    }
  };

  const handleDischargePortTotalSave = (value: number | null, comment: string) => {
    if (value === null) {
      setDischargePortOverride(null);
    } else {
      setDischargePortOverride({
        value,
        comment,
        timestamp: new Date(),
      });
    }
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
          <BargeSectionFields form={form} />
          <NominationSectionFields form={form} />
          
          <div className="grid grid-cols-2 gap-6">
            <PortSection
              form={form}
              type="load"
              calculatedHours={calculatedValues.loadPortTotal}
              override={loadPortOverride}
              onOverrideChange={handleLoadPortTotalSave}
              allowedLaytime={calculatedValues.allowedLaytimePerPort}
              timeSaved={calculatedValues.loadTimeSaved}
            />
            <PortSection
              form={form}
              type="discharge"
              calculatedHours={calculatedValues.dischargePortTotal}
              override={dischargePortOverride}
              onOverrideChange={handleDischargePortTotalSave}
              allowedLaytime={calculatedValues.allowedLaytimePerPort}
              timeSaved={calculatedValues.dischargeTimeSaved}
            />
          </div>

          <SummarySection 
            form={form} 
            calculatedValues={{
              totalTimeUsed: calculatedValues.totalTimeUsed,
              demurrageHours: calculatedValues.demurrageHours,
              demurrageDue: calculatedValues.demurrageDue,
              totalLaytime: calculatedValues.totalLaytime,
              rate: calculatedValues.rate,
            }} 
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
