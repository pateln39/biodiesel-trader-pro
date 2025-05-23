
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Movement } from '@/types';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { validateAndParsePricingFormula } from '@/utils/formulaUtils';
import { TruncatedCell } from './storage/TruncatedCell';

// Constants for cell width to maintain consistency
const CELL_WIDTHS = {
  reference: 140,
  quantity: 120,
  status: 100,
  bargeName: 140,
  port: 140,
  date: 120,
  actualQuantity: 130,
};

interface TradeMovementsDialogProps {
  tradeLegId: string;
  tradeReference: string;
}

const TradeMovementsDialog: React.FC<TradeMovementsDialogProps> = ({ 
  tradeLegId,
  tradeReference
}) => {
  // Fetch movements related to this trade
  const { data: movements = [], isLoading, error } = useQuery({
    queryKey: ['tradeMovements', tradeLegId],
    queryFn: async () => {
      try {
        // Query movements for this specific trade leg
        const { data, error } = await supabase
          .from('movements')
          .select('*')
          .eq('trade_leg_id', tradeLegId)
          .order('created_at', { ascending: false });

        if (error) {
          throw new Error(`Error fetching movements: ${error.message}`);
        }

        return (data || []).map((m: any) => ({
          id: m.id,
          referenceNumber: m.reference_number,
          tradeLegId: m.trade_leg_id,
          parentTradeId: m.parent_trade_id,
          tradeReference: m.trade_reference || tradeReference,
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
          pricingFormula: validateAndParsePricingFormula(m.pricing_formula),
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
        console.error('[TRADE MOVEMENTS] Error fetching movements:', error);
        throw new Error(error.message);
      }
    },
    enabled: !!tradeLegId,
  });

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

  if (isLoading) {
    return (
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Movements for Trade {tradeReference}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading movements...</p>
        </div>
      </DialogContent>
    );
  }

  if (error) {
    return (
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Movements for Trade {tradeReference}</DialogTitle>
        </DialogHeader>
        <div className="text-center py-10">
          <p className="text-destructive mb-4">Error loading movements</p>
        </div>
      </DialogContent>
    );
  }

  return (
    <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
      <DialogHeader>
        <DialogTitle className="text-xl">
          Movements for Trade {tradeReference}
        </DialogTitle>
      </DialogHeader>
      
      {movements.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground">No movements found for this trade</p>
        </div>
      ) : (
        <div className="w-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-white/10">
                <TableHead className="h-10 whitespace-nowrap">Reference Number</TableHead>
                <TableHead className="h-10 whitespace-nowrap">Quantity</TableHead>
                <TableHead className="h-10 whitespace-nowrap">Status</TableHead>
                <TableHead className="h-10 whitespace-nowrap bg-gray-700">Barge Name</TableHead>
                <TableHead className="h-10 whitespace-nowrap">Loadport</TableHead>
                <TableHead className="h-10 whitespace-nowrap">Disport</TableHead>
                <TableHead className="h-10 whitespace-nowrap">Nomination ETA</TableHead>
                <TableHead className="h-10 whitespace-nowrap">BL Date</TableHead>
                <TableHead className="h-10 whitespace-nowrap">Actual Quantity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((movement) => (
                <TableRow key={movement.id} className="border-b border-white/5 hover:bg-brand-navy/80 h-10">
                  <TableCell className="h-10">
                    <TruncatedCell 
                      text={movement.referenceNumber} 
                      width={CELL_WIDTHS.reference} 
                      className="text-xs"
                    />
                  </TableCell>
                  <TableCell className="h-10 whitespace-nowrap">
                    {movement.scheduledQuantity?.toLocaleString()} MT
                  </TableCell>
                  <TableCell className="h-10">
                    <Badge variant={getStatusBadgeVariant(movement.status)}>
                      {movement.status.charAt(0).toUpperCase() + movement.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="h-10 bg-gray-700">
                    <TruncatedCell 
                      text={movement.bargeName || '-'} 
                      width={CELL_WIDTHS.bargeName} 
                      className="text-xs"
                    />
                  </TableCell>
                  <TableCell className="h-10">
                    <TruncatedCell 
                      text={movement.loadport || '-'} 
                      width={CELL_WIDTHS.port} 
                      className="text-xs"
                    />
                  </TableCell>
                  <TableCell className="h-10">
                    <TruncatedCell 
                      text={movement.disport || '-'} 
                      width={CELL_WIDTHS.port} 
                      className="text-xs"
                    />
                  </TableCell>
                  <TableCell className="h-10 whitespace-nowrap">
                    {movement.nominationEta ? format(movement.nominationEta, 'dd MMM yyyy') : '-'}
                  </TableCell>
                  <TableCell className="h-10 whitespace-nowrap">
                    {movement.blDate ? format(movement.blDate, 'dd MMM yyyy') : '-'}
                  </TableCell>
                  <TableCell className="h-10 whitespace-nowrap">
                    {movement.actualQuantity?.toLocaleString() || '-'} MT
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </DialogContent>
  );
};

export default TradeMovementsDialog;
