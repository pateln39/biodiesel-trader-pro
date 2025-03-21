
import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, AlertCircle, Trash, Link2 } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { PhysicalTrade, PhysicalTradeLeg } from '@/types';
import { formulaToDisplayString } from '@/utils/formulaUtils';

interface PhysicalTradeTableProps {
  trades: PhysicalTrade[];
  loading: boolean;
  error: Error | null;
  refetchTrades: () => void;
  onDeleteTrade: (tradeId: string, reference: string) => void;
  onDeleteLeg: (legId: string, tradeId: string, reference: string, legNumber: number) => void;
  isDeleteTradeLoading: boolean;
  isDeleteLegLoading: boolean;
}

// Helper functions
const debounce = (func: Function, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

const PhysicalTradeTable: React.FC<PhysicalTradeTableProps> = ({
  trades,
  loading,
  error,
  refetchTrades,
  onDeleteTrade,
  onDeleteLeg,
  isDeleteTradeLoading,
  isDeleteLegLoading
}) => {
  const [comments, setComments] = useState<Record<string, string>>({});
  const [savingComments, setSavingComments] = useState<Record<string, boolean>>({});

  const debouncedSaveComment = useCallback(
    debounce((tradeId: string, comment: string) => {
      setSavingComments(prev => ({ ...prev, [tradeId]: true }));
      
      setTimeout(() => {
        console.log(`[PHYSICAL] Saving comment for trade ${tradeId}: ${comment}`);
        // Add toast functionality here if needed
        setSavingComments(prev => ({ ...prev, [tradeId]: false }));
      }, 500);
    }, 1000),
    []
  );

  const handleCommentChange = (tradeId: string, comment: string) => {
    setComments(prev => ({
      ...prev,
      [tradeId]: comment
    }));
  };

  const handleCommentBlur = (tradeId: string) => {
    debouncedSaveComment(tradeId, comments[tradeId] || '');
  };

  const renderFormula = (trade: PhysicalTrade | PhysicalTradeLeg) => {
    if (!trade.formula || !trade.formula.tokens || trade.formula.tokens.length === 0) {
      return <span className="text-muted-foreground italic">No formula</span>;
    }
    
    const displayText = formulaToDisplayString(trade.formula.tokens);
    
    return (
      <div className="max-w-[300px] overflow-hidden">
        <span 
          className="text-sm font-mono hover:bg-muted px-1 py-0.5 rounded" 
          title={displayText}
        >
          {displayText}
        </span>
      </div>
    );
  };

  const isMultiLegTrade = (trade: PhysicalTrade) => {
    return trade.legs && trade.legs.length > 1;
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <div>
          <h3 className="font-medium">Failed to load trades</h3>
          <p className="text-muted-foreground text-sm">
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetchTrades()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Reference</TableHead>
          <TableHead>Buy/Sell</TableHead>
          <TableHead>INCO</TableHead>
          <TableHead className="text-right">Quantity</TableHead>
          <TableHead>Product</TableHead>
          <TableHead>Counterparty</TableHead>
          <TableHead>Price Formula</TableHead>
          <TableHead>Comments</TableHead>
          <TableHead className="text-center">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {trades.length > 0 ? (
          trades.flatMap((trade) => {
            const hasMultipleLegs = isMultiLegTrade(trade);
            const legs = trade.legs || [];
            
            return legs.map((leg, legIndex) => (
              <TableRow 
                key={leg.id}
                className={legIndex > 0 ? "border-t-0" : undefined}
              >
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Link to={`/trades/${trade.id}`} className="text-primary hover:underline">
                      {trade.physicalType === 'term' ? 
                        `${trade.tradeReference}-${leg.legReference.split('-').pop()}` : 
                        trade.tradeReference
                      }
                    </Link>
                    {hasMultipleLegs && trade.physicalType === 'term' && (
                      <Badge variant="outline" className="h-5 text-xs">
                        <Link2 className="mr-1 h-3 w-3" />
                        {legIndex === 0 ? "Primary" : `Leg ${legIndex + 1}`}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="capitalize">{leg.buySell}</TableCell>
                <TableCell>{leg.incoTerm}</TableCell>
                <TableCell className="text-right">{leg.quantity} {leg.unit}</TableCell>
                <TableCell>{leg.product}</TableCell>
                <TableCell>{trade.counterparty}</TableCell>
                <TableCell>{renderFormula(leg)}</TableCell>
                <TableCell>
                  <div className="relative">
                    <Textarea 
                      placeholder="Add comments..."
                      value={comments[leg.id] || ''}
                      onChange={(e) => handleCommentChange(leg.id, e.target.value)}
                      onBlur={() => handleCommentBlur(leg.id)}
                      className="min-h-[40px] text-sm resize-none border-transparent hover:border-input focus:border-input transition-colors"
                      rows={1}
                    />
                    {savingComments[leg.id] && (
                      <div className="absolute top-1 right-1">
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">Actions</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <Link to={`/trades/edit/${trade.id}`}>
                        <DropdownMenuItem>Edit Trade</DropdownMenuItem>
                      </Link>
                      {trade.physicalType === 'spot' && legIndex === 0 && (
                        <DropdownMenuItem 
                          className="text-red-600 focus:text-red-600" 
                          onClick={() => onDeleteTrade(trade.id, trade.tradeReference)}
                          disabled={isDeleteTradeLoading}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete Trade
                        </DropdownMenuItem>
                      )}
                      {trade.physicalType === 'term' && (
                        <DropdownMenuItem 
                          className="text-red-600 focus:text-red-600" 
                          onClick={() => onDeleteLeg(
                            leg.id, 
                            trade.id, 
                            `${trade.tradeReference}-${leg.legReference.split('-').pop()}`,
                            legIndex + 1
                          )}
                          disabled={isDeleteLegLoading}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete Leg
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ));
          })
        ) : (
          <TableRow>
            <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
              No physical trades found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default PhysicalTradeTable;
