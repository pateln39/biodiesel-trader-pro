import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Movement, PricingType } from '@/types';
import { format } from 'date-fns';
import { Edit, Trash2, MessageSquare } from 'lucide-react';
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
import { toast } from 'sonner';
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
import MovementEditDialog from './MovementEditDialog';
import CommentsCellInput from '@/components/trades/physical/CommentsCellInput';
import FormulaCellDisplay from '@/components/trades/physical/FormulaCellDisplay';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { validateAndParsePricingFormula } from '@/utils/formulaUtils';

const fetchMovements = async (): Promise<Movement[]> => {
  try {
    // First fetch movements
    const { data: movements, error } = await supabase
      .from('movements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching movements: ${error.message}`);
    }

    // Get the complete array of trade_leg_ids to fetch trade quantities
    const tradeLegsIds = movements.map(m => m.trade_leg_id).filter(Boolean);
    
    // Fetch trade quantities for all associated legs in one query
    let tradeQuantities = {};
    let tradeFormulas = {};
    let tradePricingTypes = {};
    
    if (tradeLegsIds.length > 0) {
      // Get the latest information from open_trades instead of trade_legs
      // This ensures we get the most up-to-date info including formula changes
      const { data: openTrades, error: openTradesError } = await supabase
        .from('open_trades')
        .select('trade_leg_id, quantity, pricing_formula, pricing_type')
        .in('trade_leg_id', tradeLegsIds);
        
      if (openTradesError) {
        console.error('Error fetching open trades data:', openTradesError);
      } else if (openTrades) {
        // Create maps for quantity, pricing formula, and pricing type
        openTrades.forEach(trade => {
          tradeQuantities[trade.trade_leg_id] = trade.quantity;
          tradeFormulas[trade.trade_leg_id] = trade.pricing_formula;
          tradePricingTypes[trade.trade_leg_id] = trade.pricing_type;
        });
      }
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
      // Use the total trade quantity from the associated open trade
      quantity: m.trade_leg_id && tradeQuantities[m.trade_leg_id] ? tradeQuantities[m.trade_leg_id] : null,
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
      // Use pricing type from open_trades for consistency
      pricingType: (m.trade_leg_id && tradePricingTypes[m.trade_leg_id]) ? 
        tradePricingTypes[m.trade_leg_id] as PricingType :
        m.pricing_type as PricingType | undefined,
      // Use the pricing formula from open_trades instead of the movement's own formula
      pricingFormula: (m.trade_leg_id && tradeFormulas[m.trade_leg_id]) ? 
        validateAndParsePricingFormula(tradeFormulas[m.trade_leg_id]) : 
        validateAndParsePricingFormula(m.pricing_formula),
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

  const [selectedMovement, setSelectedMovement] = React.useState<Movement | null>(null);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);

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
      toast.success("Status updated", {
        description: "Movement status has been updated successfully."
      });
    },
    onError: (error) => {
      console.error('[MOVEMENTS] Error updating status:', error);
      toast.error("Failed to update status", {
        description: "There was an error updating the movement status."
      });
    }
  });

  const updateCommentsMutation = useMutation({
    mutationFn: async ({ id, comments }: { id: string, comments: string }) => {
      const { data, error } = await supabase
        .from('movements')
        .update({ comments })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      toast.success("Comments updated", {
        description: "Movement comments have been updated successfully."
      });
    },
    onError: (error) => {
      console.error('[MOVEMENTS] Error updating comments:', error);
      toast.error("Failed to update comments", {
        description: "There was an error updating the movement comments."
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
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['openTrades'] });
      
      toast.success("Movement deleted", {
        description: "Movement has been deleted successfully."
      });
    },
    onError: (error) => {
      console.error('[MOVEMENTS] Error deleting movement:', error);
      toast.error("Failed to delete movement", {
        description: "There was an error deleting the movement."
      });
    }
  });

  const handleStatusChange = (id: string, newStatus: string) => {
    updateStatusMutation.mutate({ id, status: newStatus });
  };

  const handleCommentsChange = (id: string, comments: string) => {
    updateCommentsMutation.mutate({ id, comments });
  };

  const handleDeleteMovement = (id: string) => {
    deleteMovementMutation.mutate(id);
  };

  const handleEditMovement = (movement: Movement) => {
    setSelectedMovement(movement);
    setEditDialogOpen(true);
  };

  const handleEditComplete = () => {
    setEditDialogOpen(false);
    setSelectedMovement(null);
    queryClient.invalidateQueries({ queryKey: ['movements'] });
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
            <TableHead>Incoterm</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Sustainability</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Loading Start</TableHead>
            <TableHead>Loading End</TableHead>
            <TableHead>Counterparty</TableHead>
            <TableHead>Pricing Type</TableHead>
            <TableHead>Formula</TableHead>
            <TableHead>Comments</TableHead>
            <TableHead>Customs Status</TableHead>
            <TableHead>Credit Status</TableHead>
            <TableHead>Scheduled Quantity</TableHead>
            <TableHead>Nomination ETA</TableHead>
            <TableHead>Nomination Valid</TableHead>
            <TableHead>Cash Flow Date</TableHead>
            <TableHead>Barge Name</TableHead>
            <TableHead>Loadport</TableHead>
            <TableHead>Loadport Inspector</TableHead>
            <TableHead>Disport</TableHead>
            <TableHead>Disport Inspector</TableHead>
            <TableHead>BL Date</TableHead>
            <TableHead>Actual Quantity</TableHead>
            <TableHead>COD Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.length === 0 ? (
            <TableRow>
              <TableCell colSpan={28} className="h-24 text-center">
                No movements found
              </TableCell>
            </TableRow>
          ) : (
            movements.map((movement) => (
              <TableRow key={movement.id}>
                <TableCell>{movement.referenceNumber}</TableCell>
                <TableCell>{movement.tradeReference}</TableCell>
                <TableCell>{movement.incoTerm}</TableCell>
                <TableCell>{movement.quantity?.toLocaleString()} MT</TableCell>
                <TableCell>{movement.sustainability || '-'}</TableCell>
                <TableCell>{movement.product}</TableCell>
                <TableCell>{movement.nominationEta ? format(movement.nominationEta, 'dd MMM yyyy') : '-'}</TableCell>
                <TableCell>{movement.nominationValid ? format(movement.nominationValid, 'dd MMM yyyy') : '-'}</TableCell>
                <TableCell>{movement.counterpartyName}</TableCell>
                <TableCell>
                  <Badge variant={movement.pricingType === 'efp' ? "default" : "outline"}>
                    {movement.pricingType || 'Standard'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {movement.tradeLegId && movement.pricingFormula ? (
                    <FormulaCellDisplay
                      tradeId={movement.parentTradeId ?? ''}
                      legId={movement.tradeLegId}
                      formula={movement.pricingFormula}
                      pricingType={movement.pricingType}
                    />
                  ) : (
                    <span className="text-muted-foreground italic">No formula</span>
                  )}
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MessageSquare className="h-4 w-4 text-muted-foreground" />
                              {movement.comments && (
                                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-blue-500"></span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-0">
                            <div className="p-4 pt-2">
                              <p className="text-sm font-medium mb-2">Comments</p>
                              <CommentsCellInput
                                tradeId={movement.id}
                                initialValue={movement.comments || ''}
                                onSave={(comments) => handleCommentsChange(movement.id, comments)}
                                isMovement={true}
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Add or view comments</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>
                  {movement.customsStatus && (
                    <Badge variant={
                      movement.customsStatus === 'approved' ? "default" :
                      movement.customsStatus === 'rejected' ? "destructive" :
                      "outline"
                    }>
                      {movement.customsStatus}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {movement.creditStatus && (
                    <Badge variant={
                      movement.creditStatus === 'approved' ? "default" :
                      movement.creditStatus === 'rejected' ? "destructive" :
                      "outline"
                    }>
                      {movement.creditStatus}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{movement.scheduledQuantity?.toLocaleString()} MT</TableCell>
                <TableCell>{movement.nominationEta ? format(movement.nominationEta, 'dd MMM yyyy') : '-'}</TableCell>
                <TableCell>{movement.nominationValid ? format(movement.nominationValid, 'dd MMM yyyy') : '-'}</TableCell>
                <TableCell>{movement.cashFlow ? format(movement.cashFlow, 'dd MMM yyyy') : '-'}</TableCell>
                <TableCell>{movement.bargeName || '-'}</TableCell>
                <TableCell>{movement.loadport || '-'}</TableCell>
                <TableCell>{movement.loadportInspector || '-'}</TableCell>
                <TableCell>{movement.disport || '-'}</TableCell>
                <TableCell>{movement.disportInspector || '-'}</TableCell>
                <TableCell>{movement.blDate ? format(movement.blDate, 'dd MMM yyyy') : '-'}</TableCell>
                <TableCell>{movement.actualQuantity?.toLocaleString()} MT</TableCell>
                <TableCell>{movement.codDate ? format(movement.codDate, 'dd MMM yyyy') : '-'}</TableCell>
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
                <TableCell className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8" 
                    onClick={() => handleEditMovement(movement)}
                  >
                    <Edit className="h-4 w-4 text-muted-foreground" />
                  </Button>
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
      
      {selectedMovement && (
        <MovementEditDialog 
          open={editDialogOpen} 
          onOpenChange={setEditDialogOpen}
          movement={selectedMovement}
          onSuccess={handleEditComplete}
        />
      )}
    </div>
  );
};

export default MovementsTable;
