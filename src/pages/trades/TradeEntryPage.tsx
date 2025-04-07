
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/Layout';
import PhysicalTradeForm from '@/components/trades/PhysicalTradeForm';
import PaperTradeForm from '@/components/trades/PaperTradeForm';
import { generateTradeReference } from '@/utils/tradeUtils';
import { useQueryClient } from '@tanstack/react-query';
import { TradeType } from '@/types';
import { usePaperTrades } from '@/hooks/usePaperTrades';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { formatDateForStorage } from '@/utils/dateUtils';

const TradeEntryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const tradeReference = generateTradeReference();
  const queryClient = useQueryClient();
  const [tradeType, setTradeType] = useState<TradeType>('physical');
  const { createPaperTrade } = usePaperTrades();
  
  // Parse URL parameters to check for readOnly mode and reference
  const queryParams = new URLSearchParams(location.search);
  const isReadOnly = queryParams.get('readOnly') === 'true';
  const referenceFromUrl = queryParams.get('reference');
  
  // State for initial data when coming from a link
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(referenceFromUrl ? true : false);
  
  // Fetch the trade data if reference is provided in URL
  useEffect(() => {
    if (referenceFromUrl) {
      const fetchTradeData = async () => {
        try {
          setLoading(true);
          
          // First, get the parent trade
          const { data: parentTradeData, error: parentTradeError } = await supabase
            .from('parent_trades')
            .select('*')
            .eq('trade_reference', referenceFromUrl)
            .single();
            
          if (parentTradeError) {
            throw new Error(`Error fetching parent trade: ${parentTradeError.message}`);
          }
          
          // Set the trade type based on the parent trade
          if (parentTradeData.trade_type) {
            setTradeType(parentTradeData.trade_type as TradeType);
          }
          
          // Get the trade legs
          const { data: legData, error: legError } = await supabase
            .from('trade_legs')
            .select('*')
            .eq('parent_trade_id', parentTradeData.id);
            
          if (legError) {
            throw new Error(`Error fetching trade legs: ${legError.message}`);
          }
          
          // Prepare the initial data object
          const tradeData = {
            ...parentTradeData,
            legs: legData || []
          };
          
          setInitialData(tradeData);
        } catch (error: any) {
          console.error('Error loading trade:', error);
          toast.error('Error loading trade data', {
            description: error.message
          });
        } finally {
          setLoading(false);
        }
      };
      
      fetchTradeData();
    }
  }, [referenceFromUrl]);
  
  const handlePhysicalSubmit = async (tradeData: any) => {
    // Skip the submission if in read-only mode
    if (isReadOnly) return;
    
    try {
      // Extract parent trade data
      const parentTrade = {
        trade_reference: tradeData.tradeReference,
        trade_type: tradeData.tradeType,
        physical_type: tradeData.physicalType,
        counterparty: tradeData.counterparty,
      };
      
      // Insert parent trade
      const { data: parentTradeData, error: parentTradeError } = await supabase
        .from('parent_trades')
        .insert(parentTrade)
        .select('id')
        .single();
        
      if (parentTradeError) {
        throw new Error(`Error inserting parent trade: ${parentTradeError.message}`);
      }
      
      // Get the parent trade ID
      const parentTradeId = parentTradeData.id;
      
      // For physical trades, insert all legs
      const legs = tradeData.legs.map((leg: any) => {
        // Base leg data
        const legData = {
          leg_reference: leg.legReference,
          parent_trade_id: parentTradeId,
          buy_sell: leg.buySell,
          product: leg.product,
          sustainability: leg.sustainability,
          inco_term: leg.incoTerm,
          quantity: leg.quantity,
          tolerance: leg.tolerance,
          loading_period_start: formatDateForStorage(leg.loadingPeriodStart),
          loading_period_end: formatDateForStorage(leg.loadingPeriodEnd),
          pricing_period_start: formatDateForStorage(leg.pricingPeriodStart),
          pricing_period_end: formatDateForStorage(leg.pricingPeriodEnd),
          unit: leg.unit,
          payment_term: leg.paymentTerm,
          credit_status: leg.creditStatus,
          customs_status: leg.customsStatus, // Updated: correctly map to customs_status column
          pricing_formula: leg.formula,
          mtm_formula: leg.mtmFormula,
          pricing_type: leg.pricingType,
          mtm_future_month: leg.mtmFutureMonth
        };

        // Add EFP fields if they exist
        if (leg.efpPremium !== undefined) {
          Object.assign(legData, {
            efp_premium: leg.efpPremium,
            efp_agreed_status: leg.efpAgreedStatus,
            efp_fixed_value: leg.efpFixedValue,
            efp_designated_month: leg.efpDesignatedMonth,
          });
        }
        
        return legData;
      });
      
      const { error: legsError } = await supabase
        .from('trade_legs')
        .insert(legs);
        
      if (legsError) {
        throw new Error(`Error inserting trade legs: ${legsError.message}`);
      }
      
      // Force invalidate the trades query cache
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      
      // Also invalidate the openTrades query cache to refresh the open trades table
      queryClient.invalidateQueries({ queryKey: ['openTrades'] });

      toast.success('Trade created successfully', {
        description: `Trade reference: ${tradeData.tradeReference}`
      });
      
      navigate('/trades', { state: { created: true, tradeReference: tradeData.tradeReference } });
    } catch (error: any) {
      toast.error('Failed to create trade', {
        description: error.message
      });
      console.error('Error creating trade:', error);
    }
  };
  
  const handlePaperSubmit = async (tradeData: any) => {
    // Skip the submission if in read-only mode
    if (isReadOnly) return;
    
    try {
      // Use the createPaperTrade from usePaperTrades hook
      createPaperTrade(tradeData, {
        onSuccess: () => {
          navigate('/trades', { state: { created: true, tradeReference: tradeData.tradeReference } });
        }
      });
    } catch (error: any) {
      toast.error('Failed to create paper trade', {
        description: error.message
      });
      console.error('Error creating paper trade:', error);
    }
  };

  const handleCancel = () => {
    navigate('/trades');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-lime"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isReadOnly ? 'View Trade' : 'New Trade'}
          </h1>
          <p className="text-muted-foreground">
            {isReadOnly 
              ? 'View trade details below (read-only)' 
              : 'Create a new trade by filling out the form below'}
          </p>
        </div>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Trade Details</CardTitle>
            <CardDescription>
              {isReadOnly ? 'View trade details' : 'Select trade type and enter details'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue={tradeType}
              value={tradeType}
              onValueChange={(value) => setTradeType(value as TradeType)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="physical" disabled={isReadOnly}>Physical Trade</TabsTrigger>
                <TabsTrigger value="paper" disabled={isReadOnly}>Paper Trade</TabsTrigger>
              </TabsList>
              
              <TabsContent value="physical">
                <PhysicalTradeForm 
                  tradeReference={initialData?.trade_reference || tradeReference} 
                  onSubmit={handlePhysicalSubmit} 
                  onCancel={handleCancel}
                  isEditMode={!!initialData}
                  initialData={initialData}
                  readOnly={isReadOnly}
                />
              </TabsContent>
              
              <TabsContent value="paper">
                <PaperTradeForm 
                  tradeReference={initialData?.trade_reference || tradeReference} 
                  onSubmit={handlePaperSubmit} 
                  onCancel={handleCancel}
                  isEditMode={!!initialData}
                  initialData={initialData}
                  readOnly={isReadOnly}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default TradeEntryPage;
