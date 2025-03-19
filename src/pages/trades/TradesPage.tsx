
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Filter, Loader2, AlertCircle, Trash, Link2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/utils/tradeUtils';
import { PhysicalTrade, PhysicalTradeLeg } from '@/types';
import { useTrades } from '@/hooks/useTrades';
import { 
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell 
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { 
  formulaToString, 
  formulaToDisplayString
} from '@/utils/formulaUtils';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const debounce = (func: Function, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

interface DeleteItemDetails {
  reference: string;
  legNumber?: number;
}

const TradesPage = () => {
  const { trades, loading, error, refetchTrades } = useTrades();
  const [comments, setComments] = useState<Record<string, string>>({});
  const [savingComments, setSavingComments] = useState<Record<string, boolean>>({});
  const [deletingTradeId, setDeletingTradeId] = useState<string | null>(null);
  const [deletingLegId, setDeletingLegId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteMode, setDeleteMode] = useState<'trade' | 'leg'>('trade');
  const [deleteItemDetails, setDeleteItemDetails] = useState<DeleteItemDetails>({ 
    reference: '' 
  });
  const [pageError, setPageError] = useState<string | null>(null);

  const physicalTrades = trades.filter(trade => trade.tradeType === 'physical') as PhysicalTrade[];

  useEffect(() => {
    if (error) {
      setPageError(error instanceof Error ? error.message : 'Unknown error occurred');
      toast({
        variant: "destructive",
        title: "Failed to load trades",
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } else {
      setPageError(null);
    }
  }, [error]);

  const debouncedSaveComment = useCallback(
    debounce((tradeId: string, comment: string) => {
      setSavingComments(prev => ({ ...prev, [tradeId]: true }));
      
      setTimeout(() => {
        console.log(`Saving comment for trade ${tradeId}: ${comment}`);
        toast({
          title: "Comment saved",
          description: "Your comment has been saved successfully."
        });
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

  const handleDeleteTradeClick = (tradeId: string, reference: string) => {
    setDeletingTradeId(tradeId);
    setDeletingLegId(null);
    setDeleteMode('trade');
    setDeleteItemDetails({ reference });
    setShowDeleteConfirmation(true);
  };

  const handleDeleteLegClick = (legId: string, tradeId: string, reference: string, legNumber: number) => {
    setDeletingLegId(legId);
    setDeletingTradeId(tradeId);
    setDeleteMode('leg');
    setDeleteItemDetails({
      reference,
      legNumber
    });
    setShowDeleteConfirmation(true);
  };

  const cancelDelete = () => {
    setIsDeleting(false);
    setDeletingTradeId(null);
    setDeletingLegId(null);
    setShowDeleteConfirmation(false);
    setDeleteItemDetails({ reference: '' });
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    
    try {
      if (deleteMode === 'trade' && deletingTradeId) {
        const { data: legs, error: legsError } = await supabase
          .from('trade_legs')
          .delete()
          .eq('parent_trade_id', deletingTradeId);
          
        if (legsError) {
          throw legsError;
        }
        
        const { error: parentError } = await supabase
          .from('parent_trades')
          .delete()
          .eq('id', deletingTradeId);
          
        if (parentError) {
          throw parentError;
        }
        
        toast({
          title: "Trade deleted",
          description: "Trade has been deleted successfully."
        });
      } else if (deleteMode === 'leg' && deletingLegId) {
        const { error } = await supabase
          .from('trade_legs')
          .delete()
          .eq('id', deletingLegId);
        
        if (error) {
          throw error;
        }
        
        toast({
          title: "Trade leg deleted",
          description: "Trade leg has been deleted successfully."
        });
      }
      
      // First close the dialog and reset all state before refetching
      setShowDeleteConfirmation(false);
      setIsDeleting(false);
      setDeletingTradeId(null);
      setDeletingLegId(null);
      setDeleteItemDetails({ reference: '' });
      
      // Then refetch the data
      setTimeout(() => {
        refetchTrades();
      }, 100);

    } catch (error) {
      console.error('Error deleting:', error);
      toast({
        variant: "destructive",
        title: "Deletion failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      // Even on error, close the dialog
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
    }
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

  if (pageError) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight">Trades</h1>
            <Link to="/trades/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New Trade
              </Button>
            </Link>
          </div>
          
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {pageError}
              <div className="mt-2">
                <Button variant="outline" size="sm" onClick={() => refetchTrades()}>
                  Try Again
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Trades</h1>
          <Link to="/trades/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Trade
            </Button>
          </Link>
        </div>

        <div className="bg-card rounded-md border shadow-sm">
          <div className="p-4 flex justify-between items-center border-b">
            <h2 className="font-semibold">Physical Trades</h2>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" /> Filter
            </Button>
          </div>
          
          <div className="pt-2">
            {loading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
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
            ) : (
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
                  {physicalTrades.length > 0 ? (
                    physicalTrades.flatMap((trade) => {
                      const hasMultipleLegs = isMultiLegTrade(trade);
                      // Add safety check to ensure legs is an array
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
                                    onClick={() => handleDeleteTradeClick(trade.id, trade.tradeReference)}
                                  >
                                    <Trash className="mr-2 h-4 w-4" />
                                    Delete Trade
                                  </DropdownMenuItem>
                                )}
                                {trade.physicalType === 'term' && (
                                  <DropdownMenuItem 
                                    className="text-red-600 focus:text-red-600" 
                                    onClick={() => handleDeleteLegClick(
                                      leg.id, 
                                      trade.id, 
                                      `${trade.tradeReference}-${leg.legReference.split('-').pop()}`,
                                      legIndex + 1
                                    )}
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
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteConfirmation} onOpenChange={(isOpen) => {
        if (!isOpen && !isDeleting) {
          // Only handle closing via this callback if not already deleting
          // This prevents duplicate state resets
          cancelDelete();
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteMode === 'trade' ? (
                <>This will permanently delete the trade {deleteItemDetails.reference} from the database.</>
              ) : (
                <>This will permanently delete leg {deleteItemDetails.legNumber} of trade {deleteItemDetails.reference} from the database.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete} disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</>
              ) : (
                <>Delete</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default TradesPage;
