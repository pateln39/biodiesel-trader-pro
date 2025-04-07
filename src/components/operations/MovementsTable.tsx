import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Movement, PricingType } from '@/types';
import { format } from 'date-fns';
import { Edit, Trash2, MessageSquare, FileText } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import MovementEditDialog from './MovementEditDialog';
import CommentsCellInput from '@/components/trades/physical/CommentsCellInput';
import FormulaCellDisplay from '@/components/trades/physical/FormulaCellDisplay';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { validateAndParsePricingFormula } from '@/utils/formulaUtils';
import { formatLegReference, formatMovementReference } from '@/utils/tradeUtils';
import TradeDetailsDialog from './TradeDetailsDialog';

interface MovementsTableProps {
  filterStatuses?: string[];
}

const MovementsTable: React.FC<MovementsTableProps> = ({ 
  filterStatuses = [] 
}) => {
  const queryClient = useQueryClient();
  const { data: movements = [], isLoading, error, refetch } = useQuery({
    queryKey: ['movements'],
    queryFn: fetchMovements,
    refetchOnWindowFocus: false,
  });

  const [selectedMovement, setSelectedMovement] = React.useState<Movement | null>(null);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [isCommentsDialogOpen, setIsCommentsDialogOpen] = useState(false);
  const [selectedMovementForComments, setSelectedMovementForComments] = useState<Movement | null>(null);
  const [tradeDetailsOpen, setTradeDetailsOpen] = useState(false);
  const [selectedTradeId, setSelectedTradeId] = useState<string | undefined>(undefined);
  const [selectedLegId, setSelectedLegId] = useState<string | undefined>(undefined);

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
      setIsCommentsDialogOpen(false);
      setSelectedMovementForComments(null);
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

  const handleCommentsClick = (movement: Movement) => {
    setSelectedMovementForComments(movement);
    setIsCommentsDialogOpen(true);
  };

  const handleCommentsUpdate = (comments: string) => {
    if (selectedMovementForComments) {
      updateCommentsMutation.mutate({ 
        id: selectedMovementForComments.id, 
        comments 
      });
    }
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

  const handleViewTradeDetails = (parentId: string, legId?: string) => {
    setSelectedTradeId(parentId);
    setSelectedLegId(legId);
    setTradeDetailsOpen(true);
  };

  const filteredMovements = React.useMemo(() => {
    if (filterStatuses.length === 0) {
      return movements;
    }
    
    return movements.filter(movement => 
      filterStatuses.includes(movement.status)
    );
  }, [movements, filterStatuses]);

  if (isLoading) {
    return <TableLoadingState />;
  }

  if (error) {
    return <TableErrorState error={error as Error} onRetry={refetch} />;
  }

  if (movements.length === 0) {
    return (
      <div className="w-full">
        <div className="text-center py-10">
          <p className="text-muted-foreground mb-4">No movements found</p>
          <Button variant="outline" onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  if (filteredMovements.length === 0) {
    return (
      <div className="w-full">
        <div className="text-center py-10">
          <p className="text-muted-foreground mb-4">No movements match the selected filters</p>
          <Button variant="outline" onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
      </div>
    );
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
          <TableRow className="border-b border-white/10">
            <TableHead>Reference Number</TableHead>
            <TableHead>Trade Reference</TableHead>
            <TableHead>Buy/Sell</TableHead>
            <TableHead>Incoterm</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Sustainability</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Loading Start</TableHead>
            <TableHead>Loading End</TableHead>
            <TableHead>Counterparty</TableHead>
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
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredMovements.map((movement) => (
            <TableRow key={movement.id} className="border-b border-white/5 hover:bg-brand-navy/80">
              <TableCell>{movement.referenceNumber}</TableCell>
              <TableCell className="font-medium">
                {movement.tradeReference}
              </TableCell>
              <TableCell>
                {movement.buySell && (
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    movement.buySell === 'buy' 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-300' 
                      : 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-300'
                  }`}>
                    {movement.buySell === 'buy' ? 'BUY' : 'SELL'}
                  </div>
                )}
              </TableCell>
              <TableCell>{movement.incoTerm}</TableCell>
              <TableCell>{movement.quantity?.toLocaleString()} MT</TableCell>
              <TableCell>{movement.sustainability || '-'}</TableCell>
              <TableCell>{movement.product}</TableCell>
              <TableCell>{movement.nominationEta ? format(movement.nominationEta, 'dd MMM yyyy') : '-'}</TableCell>
              <TableCell>{movement.nominationValid ? format(movement.nominationValid, 'dd MMM yyyy') : '-'}</TableCell>
              <TableCell>{movement.counterpartyName}</TableCell>
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
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleCommentsClick(movement)}
                      >
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        {movement.comments && (
                          <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-blue-500"></span>
                        )}
                      </Button>
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
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex justify-center gap-1">
                  {movement.parentTradeId && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleViewTradeDetails(movement.parentTradeId as string, movement.tradeLegId)}
                          >
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View Trade Details</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
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
      
      <Dialog open={isCommentsDialogOpen} onOpenChange={setIsCommentsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle>
            Comments for Movement {selectedMovementForComments?.referenceNumber}
          </DialogTitle>
          <div className="space-y-2 py-4">
            {selectedMovementForComments && (
              <CommentsCellInput
                tradeId={selectedMovementForComments.id}
                initialValue={selectedMovementForComments.comments || ''}
                onSave={handleCommentsUpdate}
                showButtons={true}
                onCancel={() => setIsCommentsDialogOpen(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <TradeDetailsDialog
        open={tradeDetailsOpen}
        onOpenChange={setTradeDetailsOpen}
        tradeId={selectedTradeId}
        legId={selectedLegId}
      />
    </div>
  );
};

const fetchMovements = async (): Promise<Movement[]> => {
  try {
    const { data: movements, error } = await supabase
      .from('movements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching movements: ${error.message}`);
    }

    const tradeLegsIds = movements
      .map((m: any) => m.trade_leg_id)
      .filter(Boolean);
    
    let tradeQuantities: Record<string, number> = {};
    let tradeFormulas: Record<string, any> = {};
    let tradePricingTypes: Record<string, string> = {};
    let tradeLegReferences: Record<string, { legRef: string, tradeRef: string }> = {};
    
    if (tradeLegsIds.length > 0) {
      const openTradesQuery = supabase
        .from('open_trades')
        .select('trade_leg_id, quantity, pricing_formula, pricing_type, trade_reference')
        .in('trade_leg_id', tradeLegsIds);
      
      const { data: openTrades, error: openTradesError } = await openTradesQuery;
        
      if (openTradesError) {
        console.error('[MOVEMENTS] Error fetching open trades data:', openTradesError);
      } else if (openTrades) {
        openTrades.forEach(trade => {
          tradeQuantities[trade.trade_leg_id] = trade.quantity;
          tradeFormulas[trade.trade_leg_id] = trade.pricing_formula;
          tradePricingTypes[trade.trade_leg_id] = trade.pricing_type;
        });
      }
      
      const { data: legData, error: legError } = await supabase
        .from('trade_legs')
        .select('id, leg_reference, parent_trade_id')
        .in('id', tradeLegsIds);
      
      if (legError) {
        console.error('[MOVEMENTS] Error fetching leg references:', legError);
      } else if (legData) {
        const parentTradeIds = [...new Set(legData.map(leg => leg.parent_trade_id))].filter(Boolean);
        let parentTradeRefs: Record<string, string> = {};
        
        if (parentTradeIds.length > 0) {
          const { data: parentData, error: parentError } = await supabase
            .from('parent_trades')
            .select('id, trade_reference')
            .in('id', parentTradeIds);
          
          if (!parentError && parentData) {
            parentTradeRefs = parentData.reduce((map, parent) => {
              map[parent.id] = parent.trade_reference;
              return map;
            }, {} as Record<string, string>);
          }
        }
        
        legData.forEach(leg => {
          const tradeRef = parentTradeRefs[leg.parent_trade_id] || '';
          tradeLegReferences[leg.id] = {
            legRef: leg.leg_reference,
            tradeRef: tradeRef
          };
        });
      }
    }

    return (movements || []).map((m: any) => {
      let displayReference = m.trade_reference || 'Unknown';
      let legReference = '';
      
      if (m.trade_leg_id && tradeLegReferences[m.trade_leg_id]) {
        const { legRef, tradeRef } = tradeLegReferences[m.trade_leg_id];
        legReference = legRef;
        if (legRef && tradeRef) {
          displayReference = formatLegReference(tradeRef, legRef);
        }
      }
      
      let movementReference = m.reference_number;
      if (displayReference && legReference && m.reference_number) {
        const legSuffix = legReference.split('-').pop();
        if (!m.reference_number.includes(`-${legSuffix}-`)) {
          movementReference = formatMovementReference(displayReference, legReference, m.reference_number.split('-').pop() || '1');
        }
      }

      return {
        id: m.id,
        referenceNumber: movementReference || m.reference_number,
        tradeLegId: m.trade_leg_id,
        parentTradeId: m.parent_trade_id,
        tradeReference: displayReference,
        counterpartyName: m.counterparty || 'Unknown',
        product: m.product || 'Unknown',
        buySell: m.buy_sell,
        incoTerm: m.inco_term,
        sustainability: m.sustainability,
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
        pricingType: (m.trade_leg_id && tradePricingTypes[m.trade_leg_id]) ? 
          tradePricingTypes[m.trade_leg_id] as PricingType | undefined :
          m.pricing_type as PricingType | undefined,
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
      };
    });
  } catch (error: any) {
    console.error('[MOVEMENTS] Error fetching movements:', error);
    throw new Error(error.message);
  }
};

export default MovementsTable;
