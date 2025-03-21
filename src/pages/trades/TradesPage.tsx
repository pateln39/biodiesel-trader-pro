import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Filter, AlertCircle, RefreshCw } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PhysicalTradeTable from './PhysicalTradeTable';
import PaperTradeList from './PaperTradeList';
import PhysicalTradeDeleteDialog from '@/components/trades/PhysicalTradeDeleteDialog';
import PaperTradeDeleteDialog from '@/components/trades/PaperTradeDeleteDialog';
import { useTrades } from '@/hooks/useTrades';
import { usePaperTrades } from '@/hooks/usePaperTrades';
import { PhysicalTrade } from '@/types';
import { safelyCloseDialog } from '@/utils/dialogUtils';

const TradesPage = () => {
  const navigate = useNavigate();
  
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
  
  const [showNavigationRecovery, setShowNavigationRecovery] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("physical");
  const [pageError, setPageError] = useState<string | null>(null);
  
  const recoveryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const physicalProgressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paperProgressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
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

  useEffect(() => {
    return () => {
      if (recoveryTimeoutRef.current) clearTimeout(recoveryTimeoutRef.current);
      if (physicalProgressTimerRef.current) clearInterval(physicalProgressTimerRef.current);
      if (paperProgressTimerRef.current) clearInterval(paperProgressTimerRef.current);
    };
  }, []);

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

  const handleForceNavigation = (path: string) => {
    console.log(`Forcing navigation to ${path}`);
    
    setIsPhysicalDeleting(false);
    setPhysicalDeletionProgress(0);
    setShowPhysicalDeleteConfirmation(false);
    setPhysicalDeleteItemDetails({ id: '', reference: '' });
    
    setIsPaperDeleting(false);
    setPaperDeletionProgress(0);
    setShowPaperDeleteConfirmation(false);
    setPaperDeleteItemDetails({ id: '', reference: '' });
    
    setShowNavigationRecovery(false);
    
    if (recoveryTimeoutRef.current) clearTimeout(recoveryTimeoutRef.current);
    if (physicalProgressTimerRef.current) clearInterval(physicalProgressTimerRef.current);
    if (paperProgressTimerRef.current) clearInterval(paperProgressTimerRef.current);
    
    setTimeout(() => {
      navigate(path);
    }, 100);
  };

  const handleDeletePhysicalTradeClick = (tradeId: string, reference: string) => {
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
    console.log("[PHYSICAL DELETE] Cancel physical delete requested");
    
    safelyCloseDialog(
      setIsPhysicalDeleting,
      setPhysicalDeletionProgress,
      setShowPhysicalDeleteConfirmation,
      setPhysicalDeleteItemDetails,
      physicalProgressTimerRef,
      { id: '', reference: '' }
    );
  };

  const confirmPhysicalDelete = async () => {
    if (!physicalDeleteItemDetails.id) return;
    
    console.log("[PHYSICAL DELETE] Confirm physical delete requested");
    
    setIsPhysicalDeleting(true);
    setPhysicalDeletionProgress(5);
    
    setTimeout(() => {
      setShowPhysicalDeleteConfirmation(false);
      
      let progressStep = 1;
      if (physicalProgressTimerRef.current) {
        clearInterval(physicalProgressTimerRef.current);
      }
      
      physicalProgressTimerRef.current = setInterval(() => {
        setPhysicalDeletionProgress(prev => {
          if (prev < 30) return prev + 1;
          if (prev < 60) return prev + 2;
          if (prev < 90) return prev + 0.5;
          return prev;
        });
        
        progressStep++;
        
        if (progressStep > 50) {
          if (physicalProgressTimerRef.current) {
            clearInterval(physicalProgressTimerRef.current);
            physicalProgressTimerRef.current = null;
          }
        }
      }, 50);
      
      try {
        const deleteAction = async () => {
          if (physicalDeleteMode === 'trade') {
            await deletePhysicalTrade(physicalDeleteItemDetails.id);
          } else if (physicalDeleteMode === 'leg' && physicalDeleteItemDetails.parentTradeId) {
            await deletePhysicalTradeLeg({ 
              legId: physicalDeleteItemDetails.id,
              tradeId: physicalDeleteItemDetails.parentTradeId
            });
          }
          
          setPhysicalDeletionProgress(100);
          
          setTimeout(() => {
            if (physicalProgressTimerRef.current) {
              clearInterval(physicalProgressTimerRef.current);
              physicalProgressTimerRef.current = null;
            }
            
            setIsPhysicalDeleting(false);
            setPhysicalDeletionProgress(0);
            setPhysicalDeleteItemDetails({ id: '', reference: '' });
          }, 500);
        };
        
        setTimeout(deleteAction, 100);
      } catch (error) {
        console.error('[PHYSICAL] Error in delete flow:', error);
        toast.error("Physical deletion process encountered an error", {
          description: error instanceof Error ? error.message : 'Unknown error occurred'
        });
        
        setTimeout(() => {
          setIsPhysicalDeleting(false);
          setPhysicalDeletionProgress(0);
          setPhysicalDeleteItemDetails({ id: '', reference: '' });
          
          if (physicalProgressTimerRef.current) {
            clearInterval(physicalProgressTimerRef.current);
            physicalProgressTimerRef.current = null;
          }
          
          setShowNavigationRecovery(true);
        }, 200);
      }
    }, 100);
  };

  const handleDeletePaperTradeClick = (tradeId: string, reference: string) => {
    console.log("[PAPER DELETE] Triggering delete paper trade dialog", { tradeId, reference });
    
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
    console.log("[PAPER DELETE] Triggering delete paper leg dialog", { legId, tradeId, reference, legIndex });
    
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
    console.log("[PAPER DELETE] Cancel paper delete requested");
    
    safelyCloseDialog(
      setIsPaperDeleting,
      setPaperDeletionProgress,
      setShowPaperDeleteConfirmation,
      setPaperDeleteItemDetails,
      paperProgressTimerRef,
      { id: '', reference: '' }
    );
  };

  const confirmPaperDelete = async () => {
    if (!paperDeleteItemDetails.id) return;
    
    console.log("[PAPER DELETE] Confirm paper delete requested", paperDeleteItemDetails);
    
    setIsPaperDeleting(true);
    setPaperDeletionProgress(5);
    
    setTimeout(() => {
      setShowPaperDeleteConfirmation(false);
      
      let progressStep = 1;
      if (paperProgressTimerRef.current) {
        clearInterval(paperProgressTimerRef.current);
      }
      
      paperProgressTimerRef.current = setInterval(() => {
        setPaperDeletionProgress(prev => {
          if (prev < 30) return prev + 1;
          if (prev < 60) return prev + 2;
          if (prev < 90) return prev + 0.5;
          return prev;
        });
        
        progressStep++;
        
        if (progressStep > 50) {
          if (paperProgressTimerRef.current) {
            clearInterval(paperProgressTimerRef.current);
            paperProgressTimerRef.current = null;
          }
        }
      }, 50);
      
      try {
        const deleteAction = async () => {
          if (paperDeleteMode === 'trade') {
            await deletePaperTrade(paperDeleteItemDetails.id);
          } else if (paperDeleteMode === 'leg' && paperDeleteItemDetails.parentTradeId) {
            await deletePaperTradeLeg({ 
              legId: paperDeleteItemDetails.id,
              parentTradeId: paperDeleteItemDetails.parentTradeId
            });
          }
          
          setPaperDeletionProgress(100);
          
          setTimeout(() => {
            if (paperProgressTimerRef.current) {
              clearInterval(paperProgressTimerRef.current);
              paperProgressTimerRef.current = null;
            }
            
            setIsPaperDeleting(false);
            setPaperDeletionProgress(0);
            setPaperDeleteItemDetails({ id: '', reference: '' });
          }, 500);
        };
        
        setTimeout(deleteAction, 100);
      } catch (error) {
        console.error('[PAPER] Error in delete flow:', error);
        toast.error("Paper deletion process encountered an error", {
          description: error instanceof Error ? error.message : 'Unknown error occurred'
        });
        
        setTimeout(() => {
          setIsPaperDeleting(false);
          setPaperDeletionProgress(0);
          setPaperDeleteItemDetails({ id: '', reference: '' });
          
          if (paperProgressTimerRef.current) {
            clearInterval(paperProgressTimerRef.current);
            paperProgressTimerRef.current = null;
          }
          
          setShowNavigationRecovery(true);
        }, 200);
      }
    }, 100);
  };

  const handlePaperDialogOpenChange = (isOpen: boolean) => {
    if (!isOpen && !isPaperDeleting) {
      cancelPaperDelete();
    }
  };

  const handlePhysicalDialogOpenChange = (isOpen: boolean) => {
    if (!isOpen && !isPhysicalDeleting) {
      cancelPhysicalDelete();
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

        <Tabs defaultValue="physical" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="physical">Physical Trades</TabsTrigger>
            <TabsTrigger value="paper">Paper Trades</TabsTrigger>
          </TabsList>
          
          <TabsContent value="physical">
            <PhysicalTradeDeleteDialog 
              showDeleteConfirmation={showPhysicalDeleteConfirmation}
              deleteMode={physicalDeleteMode}
              deleteItemDetails={physicalDeleteItemDetails}
              isDeleting={isPhysicalDeleting}
              deletionProgress={physicalDeletionProgress}
              onConfirmDelete={confirmPhysicalDelete}
              onCancelDelete={cancelPhysicalDelete}
              onOpenChange={handlePhysicalDialogOpenChange}
            />
            
            {renderPhysicalTradesTab()}
          </TabsContent>
          
          <TabsContent value="paper">
            <PaperTradeDeleteDialog 
              showDeleteConfirmation={showPaperDeleteConfirmation}
              deleteMode={paperDeleteMode}
              deleteItemDetails={paperDeleteItemDetails}
              isDeleting={isPaperDeleting}
              deletionProgress={paperDeletionProgress}
              onConfirmDelete={confirmPaperDelete}
              onCancelDelete={cancelPaperDelete}
              onOpenChange={handlePaperDialogOpenChange}
            />
            
            {renderPaperTradesTab()}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default TradesPage;
