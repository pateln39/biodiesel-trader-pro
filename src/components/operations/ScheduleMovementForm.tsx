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
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { generateMovementReference } from '@/utils/tradeUtils';
import { BuySell, ContractStatus, CreditStatus, CustomsStatus, IncoTerm, Movement, PaymentTerm, PricingType, Product, Unit } from '@/types';
import { toast } from "sonner";

// Define our own trade type for this component to avoid import issues
interface Trade {
  id: string;
  trade_leg_id: string;
  parent_trade_id: string;
  trade_reference: string;
  leg_reference?: string;
  counterparty: string;
  buy_sell: BuySell;
  product: Product;
  sustainability?: string;
  inco_term?: IncoTerm;
  quantity: number;
  tolerance?: number;
  unit?: Unit;
  payment_term?: PaymentTerm;
  credit_status?: CreditStatus;
  customs_status?: CustomsStatus;
  vessel_name?: string;
  loadport?: string;
  disport?: string;
  scheduled_quantity: number;
  open_quantity: number;
  pricing_type?: PricingType;
  pricing_formula?: any;
  comments?: string;
  contract_status?: ContractStatus;
}

interface ScheduleMovementFormProps {
  trade: Trade;
  onSuccess: () => void;
  onCancel: () => void;
  isEditMode?: boolean;
  initialMovement?: Movement;
}

const ScheduleMovementForm: React.FC<ScheduleMovementFormProps> = ({ 
  trade, 
  onSuccess, 
  onCancel, 
  isEditMode = false,
  initialMovement 
}) => {
  const [nominationEta, setNominationEta] = useState<Date | undefined>(
    initialMovement?.nominationEta ? new Date(initialMovement.nominationEta) : undefined
  );
  const [nominationValid, setNominationValid] = useState<Date | undefined>(
    initialMovement?.nominationValid ? new Date(initialMovement.nominationValid) : undefined
  );
  const [cashFlow, setCashFlow] = useState<Date | undefined>(
    initialMovement?.cashFlow ? new Date(initialMovement.cashFlow) : undefined
  );
  const [bargeName, setBargeName] = useState(initialMovement?.bargeName || '');
  const [loadport, setLoadport] = useState(initialMovement?.loadport || '');
  const [loadportInspector, setLoadportInspector] = useState(initialMovement?.loadportInspector || '');
  const [disport, setDisport] = useState(initialMovement?.disport || '');
  const [disportInspector, setDisportInspector] = useState(initialMovement?.disportInspector || '');
  const [blDate, setBlDate] = useState<Date | undefined>(
    initialMovement?.blDate ? new Date(initialMovement.blDate) : undefined
  );
  const [blQuantity, setBlQuantity] = useState<number | undefined>(initialMovement?.blQuantity);
  const [actualQuantity, setActualQuantity] = useState<number | undefined>(initialMovement?.actualQuantity);
  const [codDate, setCodDate] = useState<Date | undefined>(
    initialMovement?.codDate ? new Date(initialMovement.codDate) : undefined
  );
  const [referenceNumber, setReferenceNumber] = useState(initialMovement?.referenceNumber || '');
  const { toast: uiToast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isEditMode && !initialMovement) {
      const movementNumber = Math.floor(1000 + Math.random() * 9000);
      const legReference = trade.leg_reference || '';
      const newReferenceNumber = generateMovementReference(legReference, movementNumber);
      setReferenceNumber(newReferenceNumber);
    }
  }, [trade.leg_reference, isEditMode, initialMovement]);

  const createMovementMutation = useMutation({
    mutationFn: async (movementData: any) => {
      let response;
      
      if (isEditMode && initialMovement) {
        const { data, error } = await supabase
          .from('movements')
          .update(movementData)
          .eq('id', initialMovement.id)
          .select();
          
        if (error) throw error;
        response = data;
      } else {
        const { data, error } = await supabase
          .from('movements')
          .insert(movementData)
          .select();
          
        if (error) throw error;
        response = data;
      }
      
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['openTrades'] });
      toast(isEditMode ? "Movement Updated" : "Movement Scheduled", {
        description: isEditMode 
          ? "Your movement has been updated successfully." 
          : "Your movement has been scheduled successfully."
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast("Failed to " + (isEditMode ? "Update" : "Schedule") + " Movement", {
        description: error.message
      });
    }
  });

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isEditMode && blQuantity === undefined) {
      toast("Required Field Missing", {
        description: "BL Quantity is required to schedule a movement."
      });
      return;
    }

    const movementData = {
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
      comments: initialMovement?.comments || '',
      customsStatus: initialMovement?.customsStatus || '',
      creditStatus: initialMovement?.creditStatus || '',
      contractStatus: trade.contract_status,
      status: initialMovement?.status || 'scheduled',
    };

    const snakeCaseData = {
      reference_number: movementData.referenceNumber,
      trade_leg_id: movementData.tradeLegId,
      parent_trade_id: movementData.parentTradeId,
      trade_reference: movementData.tradeReference,
      counterparty: movementData.counterparty,
      product: movementData.product,
      buy_sell: movementData.buySell,
      inco_term: movementData.incoTerm,
      sustainability: movementData.sustainability,
      scheduled_quantity: movementData.scheduledQuantity,
      nomination_eta: movementData.nominationEta,
      nomination_valid: movementData.nominationValid,
      cash_flow: movementData.cashFlow,
      barge_name: movementData.bargeName,
      loadport: movementData.loadport,
      loadport_inspector: movementData.loadportInspector,
      disport: movementData.disport,
      disport_inspector: movementData.disportInspector,
      bl_date: movementData.blDate,
      bl_quantity: movementData.blQuantity || 0,
      actual_quantity: movementData.actualQuantity,
      cod_date: movementData.codDate,
      pricing_type: movementData.pricingType,
      pricing_formula: movementData.pricingFormula,
      comments: movementData.comments,
      customs_status: movementData.customsStatus,
      credit_status: movementData.creditStatus,
      contract_status: movementData.contractStatus,
      status: movementData.status,
    };

    createMovementMutation.mutate(snakeCaseData);
  };

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const formElement = (e.target as HTMLButtonElement).closest('form');
    if (formElement) {
      formElement.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{isEditMode ? "Edit Movement" : "Schedule Movement"}</DialogTitle>
        <DialogDescription>
          {isEditMode 
            ? `Edit movement details for: ${trade.trade_reference}`
            : `Schedule a new movement for trade: ${trade.trade_reference}`
          }
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
              <Calendar
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
        <Button type="submit" onClick={handleButtonClick}>
          {isEditMode ? "Update" : "Schedule"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default ScheduleMovementForm;
