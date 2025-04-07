
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Movement } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ScheduleMovementForm from './ScheduleMovementForm';
import TableLoadingState from '@/components/trades/TableLoadingState';
import { toast } from '@/hooks/use-toast';

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
      return data;
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
