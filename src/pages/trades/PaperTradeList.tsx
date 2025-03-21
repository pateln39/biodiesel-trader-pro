
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { PaperTrade } from '@/types/paper';
import { formatProductDisplay } from '@/utils/tradeUtils';

interface PaperTradeListProps {
  paperTrades: PaperTrade[];
  isLoading: boolean;
  error: Error | null;
  refetchPaperTrades: () => void;
}

const PaperTradeList: React.FC<PaperTradeListProps> = ({
  paperTrades,
  isLoading,
  error,
  refetchPaperTrades
}) => {
  const [paperComments, setPaperComments] = useState<Record<string, string>>({});
  const [savingPaperComments, setSavingPaperComments] = useState<Record<string, boolean>>({});

  const handlePaperCommentChange = (tradeId: string, comment: string) => {
    setPaperComments(prev => ({
      ...prev,
      [tradeId]: comment
    }));
  };

  const handlePaperCommentBlur = (tradeId: string) => {
    setSavingPaperComments(prev => ({ ...prev, [tradeId]: true }));
    
    setTimeout(() => {
      console.log(`[PAPER] Saving comment for paper trade ${tradeId}: ${paperComments[tradeId]}`);
      toast.success("Comment saved");
      setSavingPaperComments(prev => ({ ...prev, [tradeId]: false }));
    }, 500);
  };

  if (isLoading) {
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
          <h3 className="font-medium">Failed to load paper trades</h3>
          <p className="text-muted-foreground text-sm">
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetchPaperTrades()}>
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
          <TableHead>Broker</TableHead>
          <TableHead>Products</TableHead>
          <TableHead>Period</TableHead>
          <TableHead>Buy/Sell</TableHead>
          <TableHead className="text-right">Quantity</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead>Comments</TableHead>
          <TableHead className="text-center">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {paperTrades && paperTrades.length > 0 ? (
          paperTrades.flatMap((trade) => {
            return trade.legs.map((leg, legIndex) => {
              let productDisplay = formatProductDisplay(
                leg.product,
                leg.relationshipType,
                leg.rightSide?.product
              );
              
              const displayReference = `${trade.tradeReference}${legIndex > 0 ? `-${String.fromCharCode(97 + legIndex)}` : '-a'}`;
              
              return (
                <TableRow key={`${trade.id}-${leg.id}`}>
                  <TableCell>
                    <Link to={`/trades/${trade.id}`} className="text-primary hover:underline">
                      {displayReference}
                    </Link>
                  </TableCell>
                  <TableCell>{leg.broker || trade.broker}</TableCell>
                  <TableCell>{productDisplay}</TableCell>
                  <TableCell>{leg.period}</TableCell>
                  <TableCell className="capitalize">{leg.buySell}</TableCell>
                  <TableCell className="text-right">{leg.quantity}</TableCell>
                  <TableCell className="text-right">{leg.price}</TableCell>
                  <TableCell>
                    <div className="relative">
                      <Textarea 
                        placeholder="Add comments..."
                        value={paperComments[trade.id] || trade.comment || ''}
                        onChange={(e) => handlePaperCommentChange(trade.id, e.target.value)}
                        onBlur={() => handlePaperCommentBlur(trade.id)}
                        className="min-h-[40px] text-sm resize-none border-transparent hover:border-input focus:border-input transition-colors"
                        rows={1}
                      />
                      {savingPaperComments[trade.id] && (
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
                        <Link to={`/trades/${trade.id}`}>
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                        </Link>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            });
          })
        ) : (
          <TableRow>
            <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
              No paper trades found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default PaperTradeList;
