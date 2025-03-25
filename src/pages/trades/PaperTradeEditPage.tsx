
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import PaperTradeForm from '@/components/trades/PaperTradeForm';
import { usePaperTrades } from '@/hooks/usePaperTrades';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const PaperTradeEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { paperTrades, isLoading, refetchPaperTrades } = usePaperTrades();
  const [error, setError] = useState<string | null>(null);
  
  // Find the trade from fetched trades
  const trade = paperTrades.find(t => t.id === id);
  
  console.log('[PAPER_EDIT] Current trade data:', trade);
  
  // Make sure all trade legs have properly configured rightSide data
  const processedTrade = React.useMemo(() => {
    if (!trade) return null;
    
    return {
      ...trade,
      legs: trade.legs.map(leg => {
        // Ensure that DIFF and SPREAD have proper rightSide quantities
        if (leg.relationshipType !== 'FP' && leg.rightSide) {
          return {
            ...leg,
            rightSide: {
              ...leg.rightSide,
              quantity: -leg.quantity // Ensure rightSide quantity is negative of left side
            }
          };
        }
        return leg;
      })
    };
  }, [trade]);
  
  // Update mutation
  const { mutate: updatePaperTrade, isPending: isUpdating } = useMutation({
    mutationFn: async (updatedTrade: any) => {
      if (!id) throw new Error('Trade ID is missing');
      
      console.log('[PAPER_EDIT] Updating paper trade:', id, updatedTrade);
      
      // 1. Update the parent trade record
      const { error: tradeUpdateError } = await supabase
        .from('paper_trades')
        .update({
          broker: updatedTrade.broker
        })
        .eq('id', id);
        
      if (tradeUpdateError) {
        throw new Error(`Error updating paper trade: ${tradeUpdateError.message}`);
      }
      
      // 2. Get current legs for comparison
      const { data: currentLegs, error: legsFetchError } = await supabase
        .from('paper_trade_legs')
        .select('*')
        .eq('paper_trade_id', id);
        
      if (legsFetchError) {
        throw new Error(`Error fetching current paper trade legs: ${legsFetchError.message}`);
      }
      
      // 3. Process legs: update existing, add new ones
      // For simplicity, we'll delete and re-create all legs
      const { error: deleteLegsError } = await supabase
        .from('paper_trade_legs')
        .delete()
        .eq('paper_trade_id', id);
        
      if (deleteLegsError) {
        throw new Error(`Error deleting existing paper trade legs: ${deleteLegsError.message}`);
      }
      
      // 4. Insert all legs from the form
      for (const leg of updatedTrade.legs) {
        // Make sure rightSide data is properly formatted for the database
        let mtmFormula = leg.mtmFormula || {};
        if (leg.rightSide && leg.relationshipType !== 'FP') {
          mtmFormula.rightSide = leg.rightSide;
        }
        
        // Make sure exposures are properly updated
        let exposures = leg.exposures || { pricing: {}, paper: {} };
        
        if (leg.relationshipType === 'FP' && leg.product) {
          // No longer include physical exposures for paper trades
          exposures.paper = { [leg.product]: leg.quantity };
          exposures.pricing = { [leg.product]: leg.quantity };
        } else if (leg.rightSide && leg.product) {
          // No longer include physical exposures for paper trades
          exposures.paper = { 
            [leg.product]: leg.quantity,
            [leg.rightSide.product]: leg.rightSide.quantity 
          };
          exposures.pricing = { 
            [leg.product]: leg.quantity,
            [leg.rightSide.product]: leg.rightSide.quantity 
          };
        }
        
        // Create each leg
        const legData = {
          paper_trade_id: id,
          leg_reference: leg.legReference,
          buy_sell: leg.buySell,
          product: leg.product,
          quantity: leg.quantity,
          period: leg.period,
          price: leg.price,
          broker: leg.broker || updatedTrade.broker,
          instrument: leg.instrument,
          trading_period: leg.period,
          formula: leg.formula,
          mtm_formula: mtmFormula,
          exposures: exposures
        };
        
        const { error: createLegError } = await supabase
          .from('paper_trade_legs')
          .insert(legData);
          
        if (createLegError) {
          throw new Error(`Error creating paper trade leg: ${createLegError.message}`);
        }
      }
      
      return { ...updatedTrade, id };
    },
    onSuccess: () => {
      toast.success('Paper trade updated successfully');
      refetchPaperTrades();
      navigate('/trades');
    },
    onError: (error: Error) => {
      setError(error.message);
      toast.error('Failed to update paper trade', {
        description: error.message
      });
    }
  });
  
  // Handler for form submission
  const handleSubmit = (formData: any) => {
    updatePaperTrade(formData);
  };
  
  // Handle when trade is not found
  useEffect(() => {
    if (!isLoading && !trade && id) {
      setError(`Paper trade with ID ${id} not found`);
    }
  }, [trade, isLoading, id]);
  
  if (isLoading) {
    return (
      <Layout>
        <Card>
          <CardContent className="py-8">
            <div className="flex justify-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          </CardContent>
        </Card>
      </Layout>
    );
  }
  
  if (error && !trade) {
    return (
      <Layout>
        <div className="space-y-4">
          <div className="flex items-center">
            <Button variant="outline" size="sm" className="mr-4" asChild>
              <Link to="/trades">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Trades
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Edit Paper Trade</h1>
          </div>
          
          <Alert variant="destructive">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center">
          <Button variant="outline" size="sm" className="mr-4" asChild>
            <Link to="/trades">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Trades
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Edit Paper Trade</h1>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {processedTrade && (
          <Card>
            <CardContent className="pt-6">
              <PaperTradeForm
                tradeReference={processedTrade.tradeReference}
                onSubmit={handleSubmit}
                onCancel={() => navigate('/trades')}
                isEditMode={true}
                initialData={processedTrade}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default PaperTradeEditPage;
