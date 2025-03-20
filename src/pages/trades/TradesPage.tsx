import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Filter, Loader2, AlertCircle, Trash, Link2, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { formatDate, formatProductDisplay } from '@/utils/tradeUtils';
import { PhysicalTrade, PhysicalTradeLeg, PaperTrade, DisplayProduct } from '@/types';
import { useTrades } from '@/hooks/useTrades';
import { usePaperTrades } from '@/hooks/usePaperTrades';
import { executeWithRefresh } from '@/utils/asyncUtils';
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
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { 
  formulaToString, 
  formulaToDisplayString
} from '@/utils/formulaUtils';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useQueryClient } from '@tanstack/react-query';
import { Progress } from '@/components/ui/progress';

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
  tradeType?: 'physical' | 'paper';
}

const TradesPage = () => {
  const { trades, loading: physicalLoading, error: physicalError, refetchTrades } = useTrades();
  const { 
    paperTrades, 
    isLoading: paperLoading, 
    error: paperError, 
    refetchPaperTrades 
  } = usePaperTrades();
  
  const [comments, setComments] = useState<Record<string, string>>({});
  const [savingComments, setSavingComments] = useState<Record<string, boolean>>({});
  
  const [paperComments, setPaperComments] = useState<Record<string, string>>({});
  const [savingPaperComments, setSavingPaperComments] = useState<Record<string, boolean>>({});
  
  const [deletingTradeId, setDeletingTradeId] = useState<string | null>(null);
  const [deletingLegId, setDeletingLegId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteMode, setDeleteMode] = useState<'trade' | 'leg'>('trade');
  const [deleteItemDetails, setDeleteItemDetails] = useState<DeleteItemDetails>({ 
    reference: '' 
  });
  const [pageError, setPageError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("physical");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const refreshInProgress = useRef(false);

  const physicalTrades = trades.filter(trade => trade.tradeType === 'physical') as PhysicalTrade[];

  useEffect(() => {
    const combinedError = physicalError || paperError;
    if (combinedError) {
      setPageError(combinedError instanceof Error ? combinedError.message : 'Unknown error occurred');
      toast.error("Failed to load trades", {
        description: combinedError instanceof Error ? combinedError.message : 'Unknown error occurred'
      });
    } else {
      setPageError(null);
    }
  }, [physicalError, paperError]);

  const debouncedSaveComment = useCallback(
    debounce((tradeId: string, comment: string) => {
      setSavingComments(prev => ({ ...prev, [tradeId]: true }));
      
      setTimeout(() => {
        console.log(`Saving comment for trade ${tradeId}: ${comment}`);
        toast.success("Comment saved", {
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

  const handlePaperCommentChange = (tradeId: string, comment: string) => {
    setPaperComments(prev => ({
      ...prev,
      [tradeId]: comment
    }));
  };

  const handlePaperCommentBlur = (tradeId: string) => {
    setSavingPaperComments(prev => ({ ...prev, [tradeId]: true }));
    
    setTimeout(() => {
      console.log(`Saving comment for paper trade ${tradeId}: ${paperComments[tradeId]}`);
      toast.success("Comment saved", {
        description: "Your comment has been saved successfully."
      });
      setSavingPaperComments(prev => ({ ...prev, [tradeId]: false }));
    }, 500);
  };

  const handleDeleteTradeClick = (tradeId: string, reference: string, tradeType: 'physical' | 'paper') => {
    setDeletingTradeId(tradeId);
    setDeletingLegId(null);
    setDeleteMode('trade');
    setDeleteItemDetails({ 
      reference,
      tradeType 
    });
    setShowDeleteConfirmation(true);
  };

  const handleDeleteLegClick = (legId: string, tradeId: string, reference: string, legNumber: number) => {
    setDeletingLegId(legId);
    setDeletingTradeId(tradeId);
    setDeleteMode('leg');
    setDeleteItemDetails({
      reference,
      legNumber,
      tradeType: 'physical'
    });
    setShowDeleteConfirmation(true);
  };

  const cancelDelete = () => {
    if (isDeleting) return;
    
    setDeletingTradeId(null);
    setDeletingLegId(null);
    setShowDeleteConfirmation(false);
    setDeleteItemDetails({ reference: '' });
    setDeleteProgress(0);
  };

  const safeRefreshData = useCallback(() => {
    if (refreshInProgress.current) return;
    
    refreshInProgress.current = true;
    setIsRefreshing(true);
    
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['trades'] }),
      queryClient.invalidateQueries({ queryKey: ['paper-trades'] }),
      queryClient.invalidateQueries({ queryKey: ['exposure-data'] })
    ])
    .finally(() => {
      setTimeout(() => {
        refreshInProgress.current = false;
        setIsRefreshing(false);
      }, 500);
    });
  }, [queryClient]);

  const confirmDelete = async () => {
    if (isDeleting || !showDeleteConfirmation) return;
    
    setIsDeleting(true);
    setShowDeleteConfirmation(false);
    setDeleteProgress(10);

    try {
      const deleteOperation = async () => {
        setDeleteProgress(30);
        
        if (deleteMode === 'trade' && deletingTradeId) {
          setDeleteProgress(50);
          const { error: legsError } = await supabase
            .from('trade_legs')
            .delete()
            .eq('parent_trade_id', deletingTradeId);
            
          if (legsError) {
            throw legsError;
          }
          
          setDeleteProgress(70);
          const { error: parentError } = await supabase
            .from('parent_trades')
            .delete()
            .eq('id', deletingTradeId);
            
          if (parentError) {
            throw parentError;
          }
          
          return `${deleteItemDetails.tradeType === 'paper' ? 'Paper' : 'Physical'} trade deleted`;
        } else if (deleteMode === 'leg' && deletingLegId) {
          setDeleteProgress(60);
          const { error } = await supabase
            .from('trade_legs')
            .delete()
            .eq('id', deletingLegId);
          
          if (error) {
            throw error;
          }
          
          return "Trade leg deleted";
        }
        
        throw new Error("Invalid delete configuration");
      };
      
      const successMessage = await executeWithRefresh(
        deleteOperation,
        safeRefreshData,
        500
      );
      
      setDeleteProgress(100);
      toast.success(successMessage);
      
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error("Deletion failed", {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsDeleting(false);
      setDeletingTradeId(null);
      setDeletingLegId(null);
      setDeleteItemDetails({ reference: '' });
      setDeleteProgress(0);
    }
  };

  const handleManualRefresh = () => {
    if (isRefreshing) return;
    
    toast.info("Refreshing data...");
    safeRefreshData();
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

  const renderPaperFormula = (trade: PaperTrade) => {
    if (!trade.legs || trade.legs.length === 0) {
      return <span className="text-muted-foreground italic">No formula</span>;
    }
    
    const firstLeg = trade.legs[0];
    let displayText: DisplayProduct = firstLeg.product;
    
    if (firstLeg.instrument) {
      displayText = firstLeg.instrument;
    } else if (firstLeg.relationshipType && firstLeg.rightSide) {
      displayText = formatProductDisplay(
        firstLeg.product,
        firstLeg.relationshipType,
        firstLeg.rightSide.product
      );
    }
    
    return <span>{displayText}</span>;
  };

  const isMultiLegTrade = (trade: PhysicalTrade) => {
    return trade.legs && trade.legs.length > 1;
  };

  const showErrorAlert = () => {
    if (!pageError) return null;
    
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {pageError}
          <div className="mt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                refetchTrades();
              }}
            >
              Try Again
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  const renderPhysicalTradesTab = () => {
    return (
      <div className="bg-card rounded-md border shadow-sm">
        <div className="p-4 flex justify-between items-center border-b">
          <h2 className="font-semibold">Physical Trades</h2>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" /> Filter
          </Button>
        </div>
        
        <div className="pt-2">
          {physicalLoading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : physicalError ? (
            <div className="p-8 flex flex-col items-center text-center space-y-4">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <div>
                <h3 className="font-medium">Failed to load trades</h3>
                <p className="text-muted-foreground text-sm">
                  {physicalError instanceof Error ? physicalError.message : 'Unknown error occurred'}
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
                                  onClick={() => handleDeleteTradeClick(trade.id, trade.tradeReference, 'physical')}
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
    );
  };

  const renderPaperTradesTab = () => {
    return (
      <div className="bg-card rounded-md border shadow-sm">
        <div className="p-4 flex justify-between items-center border-b">
          <h2 className="font-semibold">Paper Trades</h2>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" /> Filter
          </Button>
        </div>
        
        <div className="pt-2">
          {paperLoading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : paperError ? (
            <div className="p-8 flex flex-col items-center text-center space-y-4">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <div>
                <h3 className="font-medium">Failed to load paper trades</h3>
                <p className="text-muted-foreground text-sm">
                  {paperError instanceof Error ? paperError.message : 'Unknown error occurred'}
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
                                <Link to={`/trades/edit/${trade.id}`}>
                                  <DropdownMenuItem>Edit Trade</DropdownMenuItem>
                                </Link>
                                <DropdownMenuItem 
                                  className="text-red-600 focus:text-red-600" 
                                  onClick={() => handleDeleteTradeClick(trade.id, trade.tradeReference, 'paper')}
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  Delete Trade
                                </DropdownMenuItem>
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
          )}
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Trades</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleManualRefresh} 
              disabled={isRefreshing}
            >
              <RefreshCcw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} /> 
              Refresh
            </Button>
            <Link to="/trades/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New Trade
              </Button>
            </Link>
          </div>
        </div>

        {pageError && showErrorAlert()}

        <Tabs defaultValue="physical" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="physical">Physical Trades</TabsTrigger>
            <TabsTrigger value="paper">Paper Trades</TabsTrigger>
          </TabsList>
          
          <TabsContent value="physical">
            {renderPhysicalTradesTab()}
          </TabsContent>
          
          <TabsContent value="paper">
            {renderPaperTradesTab()}
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog 
        open={showDeleteConfirmation} 
        onOpenChange={(isOpen) => {
          if (!isOpen && !isDeleting) {
            cancelDelete();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteMode === 'trade' ? (
                <>This will permanently delete the {deleteItemDetails.tradeType || 'physical'} trade {deleteItemDetails.reference} from the database.</>
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

      {isDeleting && (
        <div className="fixed inset-0 bg-black/5 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full space-y-4">
            <h3 className="text-lg font-medium text-center">Deleting {deleteItemDetails.reference}</h3>
            <Progress value={deleteProgress} className="h-2" />
            <p className="text-sm text-center text-muted-foreground">
              Please wait while the operation completes...
            </p>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default TradesPage;
