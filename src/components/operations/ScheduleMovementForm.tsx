import React, { useState, useEffect } from 'react';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { format } from 'date-fns';
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/components/ui/use-toast"
import { DatePicker } from "@/components/ui/date-picker"
import { Movement, OpenTrade } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { generateMovementReference } from '@/utils/tradeUtils';

interface ScheduleMovementFormProps {
  trade: OpenTrade;
  onSuccess: () => void;
  onCancel: () => void;
}

const ScheduleMovementForm: React.FC<ScheduleMovementFormProps> = ({ trade, onSuccess, onCancel }) => {
  const [nominationEta, setNominationEta] = useState<Date | undefined>(undefined);
  const [nominationValid, setNominationValid] = useState<Date | undefined>(undefined);
  const [cashFlow, setCashFlow] = useState<Date | undefined>(undefined);
  const [bargeName, setBargeName] = useState('');
  const [loadport, setLoadport] = useState('');
  const [loadportInspector, setLoadportInspector] = useState('');
  const [disport, setDisport] = useState('');
  const [disportInspector, setDisportInspector] = useState('');
  const [blDate, setBlDate] = useState<Date | undefined>(undefined);
  const [blQuantity, setBlQuantity] = useState<number | undefined>(undefined);
  const [actualQuantity, setActualQuantity] = useState<number | undefined>(undefined);
  const [codDate, setCodDate] = useState<Date | undefined>(undefined);
  const [referenceNumber, setReferenceNumber] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Generate a movement reference number
    const movementNumber = Math.floor(1000 + Math.random() * 9000);
    const legReference = trade.leg_reference || '';
    const newReferenceNumber = generateMovementReference(legReference, movementNumber);
    setReferenceNumber(newReferenceNumber);
  }, [trade.leg_reference]);

  const createMovementMutation = useMutation({
    mutationFn: async (movementData: Omit<Movement, 'id' | 'createdAt' | 'updatedAt'>) => {
      const { data, error } = await supabase
        .from('movements')
        .insert([movementData])
        .select();

      if (error) {
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['openTrades'] });
      toast({
        title: "Movement Scheduled",
        description: "Your movement has been scheduled successfully.",
      })
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to Schedule Movement",
        description: error.message,
      })
    }
  });

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const movementData: Omit<Movement, 'id' | 'createdAt' | 'updatedAt'> = {
      referenceNumber: referenceNumber,
      tradeLegId: trade.trade_leg_id,
      parentTradeId: trade.parent_trade_id,
      tradeReference: trade.trade_reference,
      counterparty: trade.counterparty,
      product: trade.product,
      buySell: trade.buy_sell,
      incoTerm: trade.inco_term,
      sustainability: trade.sustainability,
      scheduledQuantity: trade.quantity,
      nominationEta: nominationEta?.toISOString(),
      nominationValid: nominationValid?.toISOString(),
      cashFlow: cashFlow?.toISOString(),
      bargeName: bargeName,
      loadport: loadport,
      loadportInspector: loadportInspector,
      disport: disport,
      disportInspector: disportInspector,
      blDate: blDate?.toISOString(),
      blQuantity: blQuantity,
      actualQuantity: actualQuantity,
      codDate: codDate?.toISOString(),
      pricingType: trade.pricing_type,
      pricingFormula: trade.pricing_formula,
      comments: '',
      customsStatus: '',
      creditStatus: '',
      contractStatus: trade.contract_status,
      status: 'scheduled',
    };

    createMovementMutation.mutate(movementData);
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Schedule Movement</DialogTitle>
        <DialogDescription>
          Schedule a new movement for trade: {trade.trade_reference}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={onSubmit} className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="referenceNumber" className="text-right">
            Reference Number
          </Label>
          <Input
            type="text"
            id="referenceNumber"
            value={referenceNumber}
            readOnly
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="nominationEta" className="text-right">
            Nomination ETA
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "col-span-3 flex justify-start text-left font-normal",
                  !nominationEta && "text-muted-foreground"
                )}
              >
                {nominationEta ? (
                  format(nominationEta, "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <DatePicker
                mode="single"
                selected={nominationEta}
                onSelect={setNominationEta}
                disabled={false}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="nominationValid" className="text-right">
            Nomination Valid
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "col-span-3 flex justify-start text-left font-normal",
                  !nominationValid && "text-muted-foreground"
                )}
              >
                {nominationValid ? (
                  format(nominationValid, "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={nominationValid}
                onSelect={setNominationValid}
                disabled={false}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="cashFlow" className="text-right">
            Cash Flow Date
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "col-span-3 flex justify-start text-left font-normal",
                  !cashFlow && "text-muted-foreground"
                )}
              >
                {cashFlow ? (
                  format(cashFlow, "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={cashFlow}
                onSelect={setCashFlow}
                disabled={false}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="bargeName" className="text-right">
            Barge Name
          </Label>
          <Input
            type="text"
            id="bargeName"
            value={bargeName}
            onChange={(e) => setBargeName(e.target.value)}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="loadport" className="text-right">
            Loadport
          </Label>
          <Input
            type="text"
            id="loadport"
            value={loadport}
            onChange={(e) => setLoadport(e.target.value)}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="loadportInspector" className="text-right">
            Loadport Inspector
          </Label>
          <Input
            type="text"
            id="loadportInspector"
            value={loadportInspector}
            onChange={(e) => setLoadportInspector(e.target.value)}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="disport" className="text-right">
            Disport
          </Label>
          <Input
            type="text"
            id="disport"
            value={disport}
            onChange={(e) => setDisport(e.target.value)}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="disportInspector" className="text-right">
            Disport Inspector
          </Label>
          <Input
            type="text"
            id="disportInspector"
            value={disportInspector}
            onChange={(e) => setDisportInspector(e.target.value)}
            className="col-span-3"
          />
        </div>
         <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="blDate" className="text-right">
            BL Date
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "col-span-3 flex justify-start text-left font-normal",
                  !blDate && "text-muted-foreground"
                )}
              >
                {blDate ? (
                  format(blDate, "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={blDate}
                onSelect={setBlDate}
                disabled={false}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="blQuantity" className="text-right">
            BL Quantity
          </Label>
          <Input
            type="number"
            id="blQuantity"
            value={blQuantity || ''}
            onChange={(e) => setBlQuantity(e.target.value ? parseFloat(e.target.value) : undefined)}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="actualQuantity" className="text-right">
            Actual Quantity
          </Label>
          <Input
            type="number"
            id="actualQuantity"
            value={actualQuantity || ''}
            onChange={(e) => setActualQuantity(e.target.value ? parseFloat(e.target.value) : undefined)}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="codDate" className="text-right">
            COD Date
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "col-span-3 flex justify-start text-left font-normal",
                  !codDate && "text-muted-foreground"
                )}
              >
                {codDate ? (
                  format(codDate, "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={codDate}
                onSelect={setCodDate}
                disabled={false}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </form>
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Schedule</Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default ScheduleMovementForm;
