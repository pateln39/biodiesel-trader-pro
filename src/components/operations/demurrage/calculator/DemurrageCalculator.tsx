
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
import { supabase } from '@/integrations/supabase/client';
import { useBargesVessels } from '@/hooks/useBargesVessels';

interface DemurrageCalculatorProps {
  movement: Movement;
  onClose: () => void;
  calculationId?: string; // Optional ID to load existing calculation
}

export const DemurrageCalculator: React.FC<DemurrageCalculatorProps> = ({
  movement,
  onClose,
  calculationId
}) => {
  const [loadPortOverride, setLoadPortOverride] = useState<ManualOverride | null>(null);
  const [dischargePortOverride, setDischargePortOverride] = useState<ManualOverride | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
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

  const { barges, getBargeByName } = useBargesVessels();

  // Initialize form with existing barge data if available
  const initBargeName = movement.bargeName || '';
  const barge = getBargeByName(initBargeName);
  
  const form = useForm<DemurrageFormValues>({
    resolver: zodResolver(demurrageFormSchema),
    defaultValues: {
      bargeName: initBargeName,
      bargeVesselId: barge?.id,
      blDate: movement.blDate ? new Date(movement.blDate) : undefined,
      deadWeight: barge?.deadweight || 0,
      quantityLoaded: movement.actualQuantity || 0,
      calculationRate: "TTB",
      nominationSent: new Date(),
      nominationValid: movement.nominationValid ? new Date(movement.nominationValid) : new Date(),
      bargeArrived: new Date(),
      timeStartsToRun: new Date(),
      loadPort: {
        start: new Date(),
        finish: new Date(),
        rounding: "N",
        loadDemurrage: 0,
        isManual: false,
        overrideComment: '',
      },
      dischargePort: {
        start: new Date(),
        finish: new Date(),
        rounding: "N",
        dischargeDemurrage: 0,
        isManual: false,
        overrideComment: '',
      },
      freeTime: 0, // Will be calculated automatically
      rate: 0, // Will be calculated automatically
      comments: '',
    },
  });

  // Load existing calculation if calculationId is provided
  useEffect(() => {
    const loadExistingCalculation = async () => {
      if (!calculationId) return;
      
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('demurrage_calculations')
          .select('*')
          .eq('id', calculationId)
          .single();
        
        if (error) {
          throw error;
        }
        
        if (data) {
          console.log('Loaded demurrage calculation:', data);
          
          // Convert DB timestamps to Date objects for the form
          const nominationSent = data.nomination_sent ? new Date(data.nomination_sent) : new Date();
          const nominationValid = data.nomination_valid ? new Date(data.nomination_valid) : new Date();
          const bargeArrived = data.barge_arrived ? new Date(data.barge_arrived) : new Date();
          const timeStartsToRun = data.time_starts_to_run ? new Date(data.time_starts_to_run) : new Date();
          const loadPortStart = data.load_port_start ? new Date(data.load_port_start) : new Date();
          const loadPortFinish = data.load_port_finish ? new Date(data.load_port_finish) : new Date();
          const dischargePortStart = data.discharge_port_start ? new Date(data.discharge_port_start) : new Date();
          const dischargePortFinish = data.discharge_port_finish ? new Date(data.discharge_port_finish) : new Date();
          
          // Set load port override if port is manual
          if (data.load_port_is_manual) {
            setLoadPortOverride({
              value: data.load_port_hours || 0,
              comment: data.load_port_override_comment || '',
              timestamp: new Date()
            });
          }
          
          // Set discharge port override if port is manual
          if (data.discharge_port_is_manual) {
            setDischargePortOverride({
              value: data.discharge_port_hours || 0,
              comment: data.discharge_port_override_comment || '',
              timestamp: new Date()
            });
          }
          
          // Reset form with loaded data
          form.reset({
            bargeName: movement.bargeName || '',
            bargeVesselId: data.barge_vessel_id || barge?.id,
            blDate: data.bl_date ? new Date(data.bl_date) : undefined,
            deadWeight: barge?.deadweight || 0,
            quantityLoaded: data.quantity_loaded || movement.actualQuantity || 0,
            calculationRate: data.calculation_rate || "TTB",
            nominationSent,
            nominationValid,
            bargeArrived,
            timeStartsToRun,
            loadPort: {
              start: loadPortStart,
              finish: loadPortFinish,
              rounding: data.load_port_rounding || "N",
              loadDemurrage: data.load_port_demurrage_hours || 0,
              isManual: data.load_port_is_manual || false,
              overrideComment: data.load_port_override_comment || '',
            },
            dischargePort: {
              start: dischargePortStart,
              finish: dischargePortFinish,
              rounding: data.discharge_port_rounding || "N",
              dischargeDemurrage: data.discharge_port_demurrage_hours || 0,
              isManual: data.discharge_port_is_manual || false,
              overrideComment: data.discharge_port_override_comment || '',
            },
            freeTime: data.total_laytime || 0,
            rate: data.rate || 0,
            comments: data.comments || '',
          });
          
          // Update calculated values
          setCalculatedValues(prev => ({
            ...prev,
            loadPortTotal: data.load_port_hours || 0,
            dischargePortTotal: data.discharge_port_hours || 0,
            totalTimeUsed: data.total_time_used || 0,
            demurrageHours: data.demurrage_hours || 0,
            demurrageDue: data.demurrage_due || 0,
            totalLaytime: data.total_laytime || 0,
            allowedLaytimePerPort: (data.total_laytime || 0) / 2,
            rate: data.rate || 0
          }));
        }
      } catch (error) {
        console.error('[DEMURRAGE] Error loading calculation:', error);
        toast.error("Failed to load calculation", {
          description: error instanceof Error ? error.message : "An error occurred"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingCalculation();
  }, [calculationId, movement, barge, form]);

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

  const onSubmit = async (data: DemurrageFormValues) => {
    try {
      setIsSaving(true);
      console.log('Demurrage calculation form submitted:', data);
      console.log('Calculated values:', calculatedValues);
      
      // Convert Date objects to ISO strings for Supabase
      const loadPortStart = data.loadPort.start ? data.loadPort.start.toISOString() : null;
      const loadPortFinish = data.loadPort.finish ? data.loadPort.finish.toISOString() : null;
      const dischargePortStart = data.dischargePort.start ? data.dischargePort.start.toISOString() : null;
      const dischargePortFinish = data.dischargePort.finish ? data.dischargePort.finish.toISOString() : null;
      const nominationSent = data.nominationSent ? data.nominationSent.toISOString() : null;
      const nominationValid = data.nominationValid ? data.nominationValid.toISOString() : null;
      const bargeArrived = data.bargeArrived ? data.bargeArrived.toISOString() : null;
      const timeStartsToRun = data.timeStartsToRun ? data.timeStartsToRun.toISOString() : null;
      
      const calculationData = {
        movement_id: movement.id,
        barge_vessel_id: data.bargeVesselId,
        bl_date: data.blDate ? data.blDate.toISOString().split('T')[0] : null,
        quantity_loaded: data.quantityLoaded || 0,
        calculation_rate: data.calculationRate,
        nomination_sent: nominationSent,
        nomination_valid: nominationValid,
        barge_arrived: bargeArrived,
        time_starts_to_run: timeStartsToRun,
        
        // Load port data
        load_port_start: loadPortStart,
        load_port_finish: loadPortFinish,
        load_port_rounding: data.loadPort.rounding,
        load_port_hours: calculatedValues.loadPortTotal,
        load_port_demurrage_hours: data.loadPort.loadDemurrage || 0,
        load_port_is_manual: data.loadPort.isManual,
        load_port_override_comment: data.loadPort.isManual ? data.loadPort.overrideComment : null,
        
        // Discharge port data
        discharge_port_start: dischargePortStart,
        discharge_port_finish: dischargePortFinish,
        discharge_port_rounding: data.dischargePort.rounding,
        discharge_port_hours: calculatedValues.dischargePortTotal,
        discharge_port_demurrage_hours: data.dischargePort.dischargeDemurrage || 0,
        discharge_port_is_manual: data.dischargePort.isManual,
        discharge_port_override_comment: data.dischargePort.isManual ? data.dischargePort.overrideComment : null,
        
        // Calculation results
        total_laytime: calculatedValues.totalLaytime,
        rate: calculatedValues.rate,
        total_time_used: calculatedValues.totalTimeUsed,
        demurrage_hours: calculatedValues.demurrageHours,
        demurrage_due: calculatedValues.demurrageDue,
        
        comments: data.comments
      };

      let result;
      
      if (calculationId) {
        // Update existing calculation
        const { data: updatedData, error } = await supabase
          .from('demurrage_calculations')
          .update(calculationData)
          .eq('id', calculationId)
          .select();
          
        if (error) throw new Error(`Failed to update demurrage calculation: ${error.message}`);
        result = updatedData;
        toast.success("Calculation updated", { description: "Demurrage calculation has been updated." });
      } else {
        // Insert new calculation
        const { data: insertedData, error } = await supabase
          .from('demurrage_calculations')
          .insert(calculationData)
          .select();
          
        if (error) throw new Error(`Failed to save demurrage calculation: ${error.message}`);
        result = insertedData;
        toast.success("Calculation complete", { description: "Demurrage calculation has been saved." });
      }
      
      onClose();
    } catch (error) {
      console.error('[DEMURRAGE] Save error:', error);
      toast.error("Save failed", {
        description: error instanceof Error ? error.message : "Failed to save demurrage calculation"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Loading Calculation...</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DialogContent>
    );
  }

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" /> Demurrage Calculator
          {calculationId && <span className="text-sm text-muted-foreground ml-2">(Editing existing calculation)</span>}
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
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : calculationId ? 'Update Calculation' : 'Save Calculation'}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};
