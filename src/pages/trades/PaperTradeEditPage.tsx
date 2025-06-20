
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import PaperTradeForm from '@/components/trades/PaperTradeForm';
import { usePaperTrade } from '@/hooks/usePaperTrades';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getMonthDates, formatDateForDatabase, buildCompleteExposuresObject } from '@/utils/paperTrade';

const PaperTradeEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  
  // Use the new direct fetch hook instead of relying on paginated data
  const { data: trade, isLoading, error: fetchError } = usePaperTrade(id || '');
  
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
        // Create properly structured mtmFormula with rightSide if needed
        let mtmFormula = leg.mtmFormula || {};
        if (leg.rightSide && leg.relationshipType !== 'FP') {
          mtmFormula.rightSide = leg.rightSide;
        }
        
        // Build a complete, correctly normalized exposures object using our fixed function
        let exposures = buildCompleteExposuresObject(leg);
        
        let pricingPeriodStart = null;
        let pricingPeriodEnd = null;
        
        if (leg.period) {
          try {
            // Get the dates using our utility function
            const dates = getMonthDates(leg.period);
            
            if (dates) {
              // Format dates for database storage without timezone issues
              pricingPeriodStart = formatDateForDatabase(dates.startDate);
              pricingPeriodEnd = formatDateForDatabase(dates.endDate);
            }
          } catch (e) {
            console.error('Error parsing period date:', e);
          }
        }
        
        console.log('[PAPER_EDIT] Updated exposures for leg:', exposures);
        
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
          exposures: exposures,
          pricing_period_start: pricingPeriodStart,
          pricing_period_end: pricingPeriodEnd,
          execution_trade_date: leg.executionTradeDate ? new Date(leg.executionTradeDate).toISOString().split('T')[0] : null
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
      // Invalidate both the single trade cache and the list cache
      queryClient.invalidateQueries({ queryKey: ['paper-trade', id] });
      queryClient.invalidateQueries({ queryKey: ['paper-trades'] });
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
    if (fetchError) {
      setError('Failed to load trade data');
    } else if (!isLoading && !trade && id) {
      setError(`Paper trade with ID ${id} not found`);
    }
  }, [trade, isLoading, id, fetchError]);
  
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
