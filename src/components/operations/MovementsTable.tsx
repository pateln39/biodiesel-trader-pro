
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Movement } from '@/types';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import TableLoadingState from '@/components/trades/TableLoadingState';
import TableErrorState from '@/components/trades/TableErrorState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const fetchMovements = async (): Promise<Movement[]> => {
  try {
    // Directly query the movements table
    const { data: movements, error } = await supabase
      .from('movements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching movements: ${error.message}`);
    }

    return (movements || []).map((m: any) => ({
      id: m.id,
      referenceNumber: m.reference_number,
      tradeLegId: m.trade_leg_id,
      parentTradeId: m.parent_trade_id,
      tradeReference: m.trade_reference || 'Unknown',
      counterpartyName: m.counterparty || 'Unknown',
      product: m.product || 'Unknown',
      buySell: m.buy_sell,
      incoTerm: m.inco_term,
      sustainability: m.sustainability,
      scheduledQuantity: m.scheduled_quantity,
      blQuantity: m.bl_quantity,
      actualQuantity: m.actual_quantity,
      nominationEta: m.nomination_eta ? new Date(m.nomination_eta) : undefined,
      nominationValid: m.nomination_valid ? new Date(m.nomination_valid) : undefined,
      cashFlow: m.cash_flow ? new Date(m.cash_flow) : undefined,
      bargeName: m.barge_name,
      loadport: m.loadport,
      loadportInspector: m.loadport_inspector,
      disport: m.disport,
      disportInspector: m.disport_inspector,
      blDate: m.bl_date ? new Date(m.bl_date) : undefined,
      codDate: m.cod_date ? new Date(m.cod_date) : undefined,
      pricingType: m.pricing_type,
      pricingFormula: m.pricing_formula,
      comments: m.comments,
      customsStatus: m.customs_status,
      creditStatus: m.credit_status,
      contractStatus: m.contract_status,
      status: m.status || 'scheduled',
      date: new Date(m.created_at),
      createdAt: new Date(m.created_at),
      updatedAt: new Date(m.updated_at),
    }));
  } catch (error: any) {
    console.error('[MOVEMENTS] Error fetching movements:', error);
    throw new Error(error.message);
  }
};

const MovementsTable = () => {
  const queryClient = useQueryClient();
  const { data: movements = [], isLoading, error, refetch } = useQuery({
    queryKey: ['movements'],
    queryFn: fetchMovements,
    refetchOnWindowFocus: false,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { data, error } = await supabase
        .from('movements')
        .update({ status })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['openTrades'] });
      toast({
        title: "Status updated",
        description: "Movement status has been updated successfully."
      });
    },
    onError: (error) => {
      console.error('[MOVEMENTS] Error updating status:', error);
      toast({
        title: "Failed to update status",
        description: "There was an error updating the movement status.",
        variant: "destructive"
      });
    }
  });

  const deleteMovementMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('movements')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      // After successful deletion:
      // 1. Invalidate movements query to refresh movements list
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      // 2. Invalidate openTrades query to ensure trade statuses are updated
      queryClient.invalidateQueries({ queryKey: ['openTrades'] });
      
      toast({
        title: "Movement deleted",
        description: "Movement has been deleted successfully."
      });
    },
    onError: (error) => {
      console.error('[MOVEMENTS] Error deleting movement:', error);
      toast({
        title: "Failed to delete movement",
        description: "There was an error deleting the movement.",
        variant: "destructive"
      });
    }
  });

  const handleStatusChange = (id: string, newStatus: string) => {
    updateStatusMutation.mutate({ id, status: newStatus });
  };

  const handleDeleteMovement = (id: string) => {
    deleteMovementMutation.mutate(id);
  };

  if (isLoading) {
    return <TableLoadingState />;
  }

  if (error) {
    return <TableErrorState error={error as Error} onRetry={refetch} />;
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return "default";
      case 'in progress':
        return "secondary";
      case 'cancelled':
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reference Number</TableHead>
            <TableHead>Trade Reference</TableHead>
            <TableHead>Counterparty</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Scheduled Quantity</TableHead>
            <TableHead>BL Quantity</TableHead>
            <TableHead>Actual Quantity</TableHead>
            <TableHead>Nomination ETA</TableHead>
            <TableHead>Cash Flow Date</TableHead>
            <TableHead>Barge Name</TableHead>
            <TableHead>Loadport</TableHead>
            <TableHead>Loadport Inspector</TableHead>
            <TableHead>Disport</TableHead>
            <TableHead>Disport Inspector</TableHead>
            <TableHead>BL Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.length === 0 ? (
            <TableRow>
              <TableCell colSpan={18} className="h-24 text-center">
                No movements found
              </TableCell>
            </TableRow>
          ) : (
            movements.map((movement) => (
              <TableRow key={movement.id}>
                <TableCell>{movement.referenceNumber}</TableCell>
                <TableCell>{movement.tradeReference}</TableCell>
                <TableCell>{movement.counterpartyName}</TableCell>
                <TableCell>
                  <Badge variant={movement.buySell === 'buy' ? "default" : "outline"}>
                    {movement.buySell}
                  </Badge>
                </TableCell>
                <TableCell>{movement.product}</TableCell>
                <TableCell>{movement.scheduledQuantity?.toLocaleString()} MT</TableCell>
                <TableCell>{movement.blQuantity?.toLocaleString()} MT</TableCell>
                <TableCell>{movement.actualQuantity?.toLocaleString()} MT</TableCell>
                <TableCell>{movement.nominationEta ? format(movement.nominationEta, 'dd MMM yyyy') : '-'}</TableCell>
                <TableCell>{movement.cashFlow ? format(movement.cashFlow, 'dd MMM yyyy') : '-'}</TableCell>
                <TableCell>{movement.bargeName || '-'}</TableCell>
                <TableCell>{movement.loadport || '-'}</TableCell>
                <TableCell>{movement.loadportInspector || '-'}</TableCell>
                <TableCell>{movement.disport || '-'}</TableCell>
                <TableCell>{movement.disportInspector || '-'}</TableCell>
                <TableCell>{movement.blDate ? format(movement.blDate, 'dd MMM yyyy') : '-'}</TableCell>
                <TableCell>
                  <Select
                    defaultValue={movement.status}
                    onValueChange={(value) => handleStatusChange(movement.id, value)}
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue>
                        <Badge variant={getStatusBadgeVariant(movement.status)}>
                          {movement.status.charAt(0).toUpperCase() + movement.status.slice(1)}
                        </Badge>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Movement</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this movement? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteMovement(movement.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default MovementsTable;
