import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import Layout from '@/components/Layout';
import PhysicalTradeForm from '@/components/trades/PhysicalTradeForm';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PhysicalTrade, BuySell, IncoTerm, Unit, PaymentTerm, CreditStatus, Product } from '@/types';
import { validateAndParsePhysicalFormula } from '@/utils/physicalFormulaUtils';
import { useQueryClient } from '@tanstack/react-query';

const TradeEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{id: string}>();
  const [isLoading, setIsLoading] = useState(true);
  const [tradeData, setTradeData] = useState<PhysicalTrade | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchTradeData = async () => {
      if (!id) {
        navigate('/trades');
        return;
      }

      try {
        // Fetch parent trade data from physical_trades (renamed from parent_trades)
        const { data: parentTrade, error: parentError } = await supabase
          .from('physical_trades')
          .select('*')
          .eq('id', id)
          .single();

        if (parentError) {
          throw new Error(`Error fetching parent trade: ${parentError.message}`);
        }

        // Only handle physical trades
        if (parentTrade.trade_type !== 'physical') {
          throw new Error("Only physical trades are supported");
        }

        // Fetch trade legs from physical_trade_legs (renamed from trade_legs)
        const { data: tradeLegs, error: legsError } = await supabase
          .from('physical_trade_legs')
          .select('*')
          .eq('parent_trade_id', id)
          .order('created_at', { ascending: true });

        if (legsError) {
          throw new Error(`Error fetching trade legs: ${legsError.message}`);
        }

        // Map the database data to our application trade models
        if (parentTrade.trade_type === 'physical' && tradeLegs.length > 0) {
          const physicalTrade: PhysicalTrade = {
            id: parentTrade.id,
            tradeReference: parentTrade.trade_reference,
            tradeType: 'physical', 
            createdAt: new Date(parentTrade.created_at),
            updatedAt: new Date(parentTrade.updated_at),
            physicalType: (parentTrade.physical_type || 'spot') as 'spot' | 'term',
            counterparty: parentTrade.counterparty,
            buySell: tradeLegs[0].buy_sell as BuySell,
            product: tradeLegs[0].product as Product,
            sustainability: tradeLegs[0].sustainability || '',
            incoTerm: (tradeLegs[0].inco_term || 'FOB') as IncoTerm,
            quantity: tradeLegs[0].quantity,
            tolerance: tradeLegs[0].tolerance || 0,
            loadingPeriodStart: tradeLegs[0].loading_period_start ? new Date(tradeLegs[0].loading_period_start) : new Date(),
            loadingPeriodEnd: tradeLegs[0].loading_period_end ? new Date(tradeLegs[0].loading_period_end) : new Date(),
            pricingPeriodStart: tradeLegs[0].pricing_period_start ? new Date(tradeLegs[0].pricing_period_start) : new Date(),
            pricingPeriodEnd: tradeLegs[0].pricing_period_end ? new Date(tradeLegs[0].pricing_period_end) : new Date(),
            unit: (tradeLegs[0].unit || 'MT') as Unit,
            paymentTerm: (tradeLegs[0].payment_term || '30 days') as PaymentTerm,
            creditStatus: (tradeLegs[0].credit_status || 'pending') as CreditStatus,
            formula: validateAndParsePhysicalFormula(tradeLegs[0].pricing_formula),
            mtmFormula: validateAndParsePhysicalFormula(tradeLegs[0].mtm_formula),
            legs: tradeLegs.map(leg => ({
              id: leg.id,
              parentTradeId: leg.parent_trade_id,
              legReference: leg.leg_reference,
              buySell: leg.buy_sell as BuySell,
              product: leg.product as Product,
              sustainability: leg.sustainability || '',
              incoTerm: (leg.inco_term || 'FOB') as IncoTerm,
              quantity: leg.quantity,
              tolerance: leg.tolerance || 0,
              loadingPeriodStart: leg.loading_period_start ? new Date(leg.loading_period_start) : new Date(),
              loadingPeriodEnd: leg.loading_period_end ? new Date(leg.loading_period_end) : new Date(),
              pricingPeriodStart: leg.pricing_period_start ? new Date(leg.pricing_period_start) : new Date(),
              pricingPeriodEnd: leg.pricing_period_end ? new Date(leg.pricing_period_end) : new Date(),
              unit: (leg.unit || 'MT') as Unit,
              paymentTerm: (leg.payment_term || '30 days') as PaymentTerm,
              creditStatus: (leg.credit_status || 'pending') as CreditStatus,
              formula: validateAndParsePhysicalFormula(leg.pricing_formula),
              mtmFormula: validateAndParsePhysicalFormula(leg.mtm_formula)
            }))
          };
          setTradeData(physicalTrade);
        } else {
          throw new Error("Invalid trade data");
        }

      } catch (error: any) {
        console.error('Error fetching trade:', error);
        toast.error("Failed to load trade", {
          description: error.message || "Could not load trade details"
        });
        navigate('/trades');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTradeData();
  }, [id, navigate]);

  const handleSubmit = async (updatedTradeData: any) => {
    try {
      if (!id) return;

      // Update the parent trade in physical_trades (renamed from parent_trades)
      const parentTradeUpdate = {
        trade_reference: updatedTradeData.tradeReference,
        physical_type: updatedTradeData.physicalType,
        counterparty: updatedTradeData.counterparty,
        updated_at: new Date().toISOString()
      };
      
      const { error: parentUpdateError } = await supabase
        .from('physical_trades')
        .update(parentTradeUpdate)
        .eq('id', id);
        
      if (parentUpdateError) {
        throw new Error(`Error updating parent trade: ${parentUpdateError.message}`);
      }

      // For physical trades, we need to update all legs in physical_trade_legs (renamed from trade_legs)
      for (const leg of updatedTradeData.legs) {
        const legData = {
          parent_trade_id: id,
          buy_sell: leg.buySell,
          product: leg.product,
          sustainability: leg.sustainability,
          inco_term: leg.incoTerm,
          quantity: leg.quantity,
          tolerance: leg.tolerance,
          loading_period_start: leg.loadingPeriodStart?.toISOString().split('T')[0],
          loading_period_end: leg.loadingPeriodEnd?.toISOString().split('T')[0],
          pricing_period_start: leg.pricingPeriodStart?.toISOString().split('T')[0],
          pricing_period_end: leg.pricingPeriodEnd?.toISOString().split('T')[0],
          unit: leg.unit,
          payment_term: leg.paymentTerm,
          credit_status: leg.creditStatus,
          pricing_formula: leg.formula,
          mtm_formula: leg.mtmFormula,
          updated_at: new Date().toISOString()
        };

        // Update the existing leg in physical_trade_legs
        const { error: legUpdateError } = await supabase
          .from('physical_trade_legs')
          .update(legData)
          .eq('id', leg.id);
          
        if (legUpdateError) {
          throw new Error(`Error updating trade leg: ${legUpdateError.message}`);
        }
      }

      // Force invalidate the trades query cache to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['trades'] });

      toast.success("Trade updated", {
        description: `Trade ${updatedTradeData.tradeReference} has been updated successfully`
      });

      // Navigate back to trades page with state to indicate successful update
      navigate('/trades', { state: { updated: true, tradeReference: updatedTradeData.tradeReference } });
    } catch (error: any) {
      console.error('Error updating trade:', error);
      toast.error("Failed to update trade", {
        description: error.message || "An error occurred while updating the trade"
      });
    }
  };

  const handleCancel = () => {
    navigate('/trades');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Trade</h1>
          <p className="text-muted-foreground">
            Edit trade {tradeData?.tradeReference}
          </p>
        </div>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Trade Details</CardTitle>
            <CardDescription>
              Update trade information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Loading trade data...</p>
              </div>
            ) : tradeData ? (
              <PhysicalTradeForm 
                tradeReference={tradeData.tradeReference} 
                onSubmit={handleSubmit} 
                onCancel={handleCancel} 
                isEditMode={true}
                initialData={tradeData}
              />
            ) : (
              <div className="p-8 text-center">
                <h2 className="text-2xl font-bold tracking-tight mb-4">Trade Not Found</h2>
                <p className="text-muted-foreground mb-6">The trade you're looking for could not be found.</p>
                <Button onClick={() => navigate('/trades')}>Back to Trades</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default TradeEditPage;
