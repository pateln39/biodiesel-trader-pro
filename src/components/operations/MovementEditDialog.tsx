
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Movement } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ScheduleMovementForm from './ScheduleMovementForm';
import TableLoadingState from '@/components/trades/TableLoadingState';
import { toast } from '@/hooks/use-toast';
import { BuySell, IncoTerm, CreditStatus, CustomsStatus, ContractStatus, Unit, PaymentTerm, Product, PricingType } from '@/types';
import { validateAndParsePricingFormula } from '@/utils/formulaUtils';

interface MovementEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movement: Movement;
  onSuccess: () => void;
}

const MovementEditDialog: React.FC<MovementEditDialogProps> = ({
  open,
  onOpenChange,
  movement,
  onSuccess
}) => {
  // We need to fetch the corresponding open trade to use with the form
  const { data: openTrade, isLoading, error } = useQuery({
    queryKey: ['openTrade', movement.tradeLegId],
    queryFn: async () => {
      if (!movement.tradeLegId) {
        throw new Error('No trade leg ID associated with this movement');
      }

      const { data, error } = await supabase
        .from('open_trades')
        .select('*')
        .eq('trade_leg_id', movement.tradeLegId)
        .single();
      
      if (error) throw error;
      
      // Properly cast the data to the expected types
      if (data) {
        return {
          ...data,
          buy_sell: data.buy_sell as BuySell,
          product: data.product as Product,
          inco_term: data.inco_term as IncoTerm,
          unit: data.unit as Unit,
          payment_term: data.payment_term as PaymentTerm,
          credit_status: data.credit_status as CreditStatus,
          customs_status: data.customs_status as CustomsStatus,
          contract_status: data.contract_status as ContractStatus,
          pricing_type: data.pricing_type as PricingType,
          // Properly parse and validate the pricing formula
          pricing_formula: validateAndParsePricingFormula(data.pricing_formula),
          loading_period_start: data.loading_period_start ? new Date(data.loading_period_start) : undefined,
          loading_period_end: data.loading_period_end ? new Date(data.loading_period_end) : undefined,
          pricing_period_start: data.pricing_period_start ? new Date(data.pricing_period_start) : undefined,
          pricing_period_end: data.pricing_period_end ? new Date(data.pricing_period_end) : undefined,
          created_at: new Date(data.created_at),
          updated_at: new Date(data.updated_at),
          // Explicitly cast status to the required union type
          status: (data.status || 'open') as 'open' | 'closed'
        };
      }
      
      return null;
    },
    enabled: open && !!movement.tradeLegId,
    refetchOnWindowFocus: false,
  });

  const handleSuccess = () => {
    onSuccess();
    toast({
      title: "Movement updated",
      description: "Movement has been updated successfully."
    });
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {isLoading ? (
        <DialogContent>
          <TableLoadingState />
        </DialogContent>
      ) : error ? (
        <DialogContent>
          <div className="p-4 text-center">
            <p className="text-destructive">Error loading trade data</p>
            <p className="text-sm text-muted-foreground mt-2">
              Could not load the trade details for this movement.
            </p>
          </div>
        </DialogContent>
      ) : openTrade ? (
        <ScheduleMovementForm
          trade={openTrade}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          isEditMode={true}
          initialMovement={movement}
        />
      ) : (
        <DialogContent>
          <div className="p-4 text-center">
            <p className="text-destructive">Trade not found</p>
            <p className="text-sm text-muted-foreground mt-2">
              The parent trade for this movement could not be found.
            </p>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
};

export default MovementEditDialog;
