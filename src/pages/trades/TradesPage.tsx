import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Filter, AlertCircle, RefreshCw } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import our custom components
import PhysicalTradeTable from './PhysicalTradeTable';
import PaperTradeList from './PaperTradeList';
import PhysicalTradeDeleteDialog from '@/components/trades/PhysicalTradeDeleteDialog';
import PaperTradeDeleteDialog from '@/components/trades/PaperTradeDeleteDialog';

// Import isolated hooks
import { useTrades } from '@/hooks/useTrades';
import { usePaperTrades } from '@/hooks/usePaperTrades';
import { PhysicalTrade } from '@/types';

const TradesPage = () => {
  const navigate = useNavigate();
  
  // State for physical trade handling
  const [physicalDeleteMode, setPhysicalDeleteMode] = useState<'trade' | 'leg'>('trade');
  const [physicalDeleteItemDetails, setPhysicalDeleteItemDetails] = useState<{ 
    id: string;
    reference: string;
    legNumber?: number;
    parentTradeId?: string;
  }>({ id: '', reference: '' });
  const [showPhysicalDeleteConfirmation, setShowPhysicalDeleteConfirmation] = useState(false);
  const [isPhysicalDeleting, setIsPhysicalDeleting] = useState(false);
  const [physicalDeletionProgress, setPhysicalDeletionProgress] = useState(0);
  
  // State for paper trade handling
  const [paperDeleteMode, setPaperDeleteMode] = useState<'trade' | 'leg'>('trade');
  const [paperDeleteItemDetails, setPaperDeleteItemDetails] = useState<{ 
    id: string;
    reference: string;
    legNumber?: number;
    parentTradeId?: string;
  }>({ id: '', reference: '' });
  const [showPaperDeleteConfirmation, setShowPaperDeleteConfirmation] = useState(false);
  const [isPaperDeleting, setIsPaperDeleting] = useState(false);
  const [paperDeletionProgress, setPaperDeletionProgress] = useState(0);
  
  // New state for UI navigation recovery
  const [showNavigationRecovery, setShowNavigationRecovery] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("physical");
  const [pageError, setPageError] = useState<string | null>(null);
  
  const recoveryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const physicalProgressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paperProgressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Load physical trades
  const { 
    trades, 
    loading: physicalLoading, 
    error: physicalError, 
    refetchTrades,
    deletePhysicalTrade,
    isDeletePhysicalTradeLoading,
    deletePhysicalTradeLeg,
    isDeletePhysicalTradeLegLoading 
  } = useTrades();
  
  // Load paper trades (now completely isolated)
  const { 
    paperTrades, 
    isLoading: paperLoading, 
    error: paperError, 
    refetchPaperTrades,
    deletePaperTrade,
    isDeletePaperTradeLoading,
    deletePaperTradeLeg,
    isDeletePaperTradeLegLoading
  } = usePaperTrades();
  
  const physicalTrades = trades.filter(trade => trade.tradeType === 'physical') as PhysicalTrade[];

  // Error handling across both trade types
  React.useEffect(() => {
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

  // Handle forced navigation when UI is stuck
  const handleForceNavigation = (path: string) => {
    console.log(`Forcing navigation to ${path}`);
    
    // Reset all deletion-related state
    setIsPhysicalDeleting(false);
    setPhysicalDeletionProgress(0);
    setShowPhysicalDeleteConfirmation(false);
    setPhysicalDeleteItemDetails({ id: '', reference: '' });
    
    setIsPaperDeleting(false);
    setPaperDeletionProgress(0);
    setShowPaperDeleteConfirmation(false);
    setPaperDeleteItemDetails({ id: '', reference: '' });
    
    // Hide navigation recovery UI
    setShowNavigationRecovery(false);
    
    // Use setTimeout to allow React to finish current cycle
    setTimeout(() => {
      navigate(path);
    }, 100);
  };

  // ISOLATED PHYSICAL TRADE DELETION
  const handleDeletePhysicalTradeClick = (tradeId: string, reference: string) => {
    // Reset any stale state
    setPhysicalDeletionProgress(0);
    setIsPhysicalDeleting(false);
    
    setPhysicalDeleteMode('trade');
    setPhysicalDeleteItemDetails({ 
      id: tradeId,
      reference
    });
    setShowPhysicalDeleteConfirmation(true);
  };

  const handleDeletePhysicalLegClick = (legId: string, tradeId: string, reference: string, legNumber: number) => {
    // Reset any stale state
    setPhysicalDeletionProgress(0);
    setIsPhysicalDeleting(false);
    
    setPhysicalDeleteMode('leg');
    setPhysicalDeleteItemDetails({
      id: legId,
      reference,
      legNumber,
      parentTradeId: tradeId
    });
    setShowPhysicalDeleteConfirmation(true);
  };

  const cancelPhysicalDelete = () => {
    setIsPhysicalDeleting(false);
    setPhysicalDeletionProgress(0);
    setShowPhysicalDeleteConfirmation(false);
    setPhysicalDeleteItemDetails({ id: '', reference: '' });
    
    // Clear any progress timer
    if (physicalProgressTimerRef.current) {
      clearInterval(physicalProgressTimerRef.current);
      physicalProgressTimerRef.current = null;
    }
  };

  // Improved physical deletion flow with better progress handling
  const confirmPhysicalDelete = async () => {
    if (!physicalDeleteItemDetails.id) return;
    
    // Close the dialog first to reduce DOM operations
    setShowPhysicalDeleteConfirmation(false);
    
    // Then start the deletion process
    setIsPhysicalDeleting(true);
    
    // Start progress animation
    setPhysicalDeletionProgress(10);
    
    // Use a timer for smoother progress indication
    // This is separate from the actual deletion process
    let progressStep = 1;
    physicalProgressTimerRef.current = setInterval(() => {
      setPhysicalDeletionProgress(prev => {
        // Increase slowly at first, then faster
        if (prev < 30) return prev + 1;
        if (prev < 60) return prev + 2;
        if (prev < 90) return prev + 0.5;
        return prev;
      });
      
      progressStep++;
      
      // Stop at 90% and wait for actual completion
      if (progressStep > 50) {
        if (physicalProgressTimerRef.current) {
          clearInterval(physicalProgressTimerRef.current);
          physicalProgressTimerRef.current = null;
        }
      }
    }, 50);
    
    try {
      if (physicalDeleteMode === 'trade') {
        // Delete physical trade
        await deletePhysicalTrade(physicalDeleteItemDetails.id);
      } else if (physicalDeleteMode === 'leg' && physicalDeleteItemDetails.parentTradeId) {
        // Delete physical trade leg
        await deletePhysicalTradeLeg({ 
          legId: physicalDeleteItemDetails.id,
          tradeId: physicalDeleteItemDetails.parentTradeId
        });
      }
      
      // Complete the progress bar
      setPhysicalDeletionProgress(100);
      setTimeout(() => {
        setIsPhysicalDeleting(false);
        setPhysicalDeletionProgress(0);
      }, 500);
    } catch (error) {
      console.error('[PHYSICAL] Error in delete flow:', error);
      toast.error("Physical deletion process encountered an error", {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      
      // Reset deletion state
      setIsPhysicalDeleting(false);
      setPhysicalDeletionProgress(0);
      
      // Clear the progress timer
      if (physicalProgressTimerRef.current) {
        clearInterval(physicalProgressTimerRef.current);
        physicalProgressTimerRef.current = null;
      }
      
      // Show recovery UI in case of errors
      setShowNavigationRecovery(true);
    }
  };

  // ISOLATED PAPER TRADE DELETION
  const handleDeletePaperTradeClick = (tradeId: string, reference: string) => {
    // Reset any stale state
    setPaperDeletionProgress(0);
    setIsPaperDeleting(false);
    
    setPaperDeleteMode('trade');
    setPaperDeleteItemDetails({ 
      id: tradeId,
      reference 
    });
    setShowPaperDeleteConfirmation(true);
  };

  const handleDeletePaperLegClick = (legId: string, tradeId: string, reference: string, legIndex: number) => {
    // Reset any stale state
    setPaperDeletionProgress(0);
    setIsPaperDeleting(false);
    
    setPaperDeleteMode('leg');
    setPaperDeleteItemDetails({
      id: legId,
      reference,
      legNumber: legIndex + 1,
      parentTradeId: tradeId
    });
    setShowPaperDeleteConfirmation(true);
  };

  const cancelPaperDelete = () => {
    setIsPaperDeleting(false);
    setPaperDeletionProgress(0);
    setShowPaperDeleteConfirmation(false);
    setPaperDeleteItemDetails({ id: '', reference: '' });
    
    // Clear any progress timer
    if (paperProgressTimerRef.current) {
      clearInterval(paperProgressTimerRef.current);
      paperProgressTimerRef.current = null;
    }
  };

  // Updated paper deletion flow with leg deletion support
  const confirmPaperDelete = async () => {
    if (!paperDeleteItemDetails.id) return;
    
    // Close the dialog first to reduce DOM operations
    setShowPaperDeleteConfirmation(false);
    
    // Then start the deletion process
    setIsPaperDeleting(true);
    
    // Start progress animation
    setPaperDeletionProgress(10);
    
    // Use a timer for smoother progress indication
    // This is separate from the actual deletion process
    let progressStep = 1;
    paperProgressTimerRef.current = setInterval(() => {
      setPaperDeletionProgress(prev => {
        // Increase slowly at first, then faster
        if (prev < 30) return prev + 1;
        if (prev < 60) return prev + 2;
        if (prev < 90) return prev + 0.5;
        return prev;
      });
      
      progressStep++;
      
      // Stop at 90% and wait for actual completion
      if (progressStep > 50) {
        if (paperProgressTimerRef.current) {
          clearInterval(paperProgressTimerRef.current);
          paperProgressTimerRef.current = null;
        }
      }
    }, 50);
    
    try {
      if (paperDeleteMode === 'trade') {
        // Delete entire paper trade
        await deletePaperTrade(paperDeleteItemDetails.id);
      } else if (paperDeleteMode === 'leg' && paperDeleteItemDetails.parentTradeId) {
        // Delete single paper trade leg
        await deletePaperTradeLeg({ 
          legId: paperDeleteItemDetails.id,
          parentTradeId: paperDeleteItemDetails.parentTradeId
        });
      }
      
      // Complete the progress bar
      setPaperDeletionProgress(100);
      setTimeout(() => {
        setIsPaperDeleting(false);
        setPaperDeletionProgress(0);
      }, 500);
    } catch (error) {
      console.error('[PAPER] Error in delete flow:', error);
      toast.error("Paper deletion process encountered an error", {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      
      // Reset deletion state
      setIsPaperDeleting(false);
      setPaperDeletionProgress(0);
      
      // Clear the progress timer
      if (paperProgressTimerRef.current) {
        clearInterval(paperProgressTimerRef.current);
        paperProgressTimerRef.current = null;
      }
      
      // Show recovery UI in case of errors
      setShowNavigationRecovery(true);
    }
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
            <Button variant="outline" size="sm" onClick={() => {
              if (activeTab === 'physical') {
                refetchTrades();
              } else {
                refetchPaperTrades();
              }
            }}>
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
          <PhysicalTradeTable 
            trades={physicalTrades}
            loading={physicalLoading}
            error={physicalError}
            refetchTrades={refetchTrades}
            onDeleteTrade={handleDeletePhysicalTradeClick}
            onDeleteLeg={handleDeletePhysicalLegClick}
            isDeleteTradeLoading={isDeletePhysicalTradeLoading}
            isDeleteLegLoading={isDeletePhysicalTradeLegLoading}
          />
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
          <PaperTradeList
            paperTrades={paperTrades}
            isLoading={paperLoading}
            error={paperError}
            refetchPaperTrades={refetchPaperTrades}
            onDeleteTrade={handleDeletePaperTradeClick}
            onDeleteLeg={handleDeletePaperLegClick}
            isDeleteTradeLoading={isDeletePaperTradeLoading}
            isDeleteLegLoading={isDeletePaperTradeLegLoading}
          />
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Trades</h1>
          <div className="flex items-center gap-2">
            {showNavigationRecovery && (
              <div className="bg-yellow-50 text-yellow-800 px-4 py-2 rounded-md flex items-center gap-2 shadow-sm border border-yellow-200">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Navigation issue detected</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-2"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="mr-1 h-3 w-3" /> Refresh
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleForceNavigation('/dashboard')}
                >
                  Go to Dashboard
                </Button>
              </div>
            )}
            <Link to="/trades/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New Trade
              </Button>
            </Link>
          </div>
        </div>

        {pageError && showErrorAlert()}

        {/* Tabs for Physical and Paper Trades */}
        <Tabs defaultValue="physical" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="physical">Physical Trades</TabsTrigger>
            <TabsTrigger value="paper">Paper Trades</TabsTrigger>
          </TabsList>
          
          <TabsContent value="physical">
            {/* Show physical progress only in physical tab */}
            <PhysicalTradeDeleteDialog 
              showDeleteConfirmation={showPhysicalDeleteConfirmation}
              deleteMode={physicalDeleteMode}
              deleteItemDetails={physicalDeleteItemDetails}
              isDeleting={isPhysicalDeleting}
              deletionProgress={physicalDeletionProgress}
              onConfirmDelete={confirmPhysicalDelete}
              onCancelDelete={cancelPhysicalDelete}
              onOpenChange={(isOpen) => {
                if (!isOpen && !isPhysicalDeleting) {
                  cancelPhysicalDelete();
                }
              }}
            />
            
            {renderPhysicalTradesTab()}
          </TabsContent>
          
          <TabsContent value="paper">
            {/* Show paper progress only in paper tab */}
            <PaperTradeDeleteDialog 
              showDeleteConfirmation={showPaperDeleteConfirmation}
              deleteMode={paperDeleteMode}
              deleteItemDetails={paperDeleteItemDetails}
              isDeleting={isPaperDeleting}
              deletionProgress={paperDeletionProgress}
              onConfirmDelete={confirmPaperDelete}
              onCancelDelete={cancelPaperDelete}
              onOpenChange={(isOpen) => {
                if (!isOpen && !isPaperDeleting) {
                  cancelPaperDelete();
                }
              }}
            />
            
            {renderPaperTradesTab()}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default TradesPage;
