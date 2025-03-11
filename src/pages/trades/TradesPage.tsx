
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Filter, Loader2 } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/utils/tradeUtils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trade } from '@/types';

const TradesPage = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        setLoading(true);

        // Get all parent trades
        const { data: parentTrades, error: parentTradesError } = await supabase
          .from('parent_trades')
          .select('*')
          .order('created_at', { ascending: false });

        if (parentTradesError) {
          throw new Error(`Error fetching parent trades: ${parentTradesError.message}`);
        }

        // Get all trade legs
        const { data: tradeLegs, error: tradeLegsError } = await supabase
          .from('trade_legs')
          .select('*')
          .order('created_at', { ascending: false });

        if (tradeLegsError) {
          throw new Error(`Error fetching trade legs: ${tradeLegsError.message}`);
        }

        // Map parent trades and legs to create the trade objects
        const mappedTrades = parentTrades.map(parent => {
          // Find all legs for this parent trade
          const legs = tradeLegs.filter(leg => leg.parent_trade_id === parent.id);
          
          // Use the first leg for the main trade data (for backward compatibility)
          const firstLeg = legs[0] || {};
          
          return {
            id: parent.id,
            tradeReference: parent.trade_reference,
            tradeType: parent.trade_type,
            createdAt: new Date(parent.created_at),
            updatedAt: new Date(parent.updated_at),
            counterparty: parent.counterparty,
            // Add fields from the first leg
            ...(parent.trade_type === 'physical' ? {
              physicalType: parent.physical_type,
              buySell: firstLeg.buy_sell,
              product: firstLeg.product,
              sustainability: firstLeg.sustainability,
              incoTerm: firstLeg.inco_term,
              quantity: firstLeg.quantity,
              tolerance: firstLeg.tolerance,
              loadingPeriodStart: firstLeg.loading_period_start ? new Date(firstLeg.loading_period_start) : null,
              loadingPeriodEnd: firstLeg.loading_period_end ? new Date(firstLeg.loading_period_end) : null,
              pricingPeriodStart: firstLeg.pricing_period_start ? new Date(firstLeg.pricing_period_start) : null,
              pricingPeriodEnd: firstLeg.pricing_period_end ? new Date(firstLeg.pricing_period_end) : null,
              unit: firstLeg.unit,
              paymentTerm: firstLeg.payment_term,
              creditStatus: firstLeg.credit_status,
              pricingFormula: firstLeg.pricing_formula || [],
              legs
            } : {
              broker: firstLeg.broker,
              instrument: firstLeg.instrument,
              price: firstLeg.price,
              quantity: firstLeg.quantity,
              pricingPeriodStart: firstLeg.pricing_period_start ? new Date(firstLeg.pricing_period_start) : null,
              pricingPeriodEnd: firstLeg.pricing_period_end ? new Date(firstLeg.pricing_period_end) : null,
            })
          };
        });

        setTrades(mappedTrades);
      } catch (error: any) {
        console.error('Error fetching trades:', error);
        toast.error('Failed to load trades', {
          description: error.message
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTrades();
  }, []);

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
            <h2 className="font-semibold">All Trades</h2>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" /> Filter
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-3 font-medium">Reference</th>
                    <th className="text-left p-3 font-medium">Type</th>
                    <th className="text-left p-3 font-medium">Counterparty/Broker</th>
                    <th className="text-left p-3 font-medium">Product/Instrument</th>
                    <th className="text-right p-3 font-medium">Quantity</th>
                    <th className="text-left p-3 font-medium">Created</th>
                    <th className="text-center p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.length > 0 ? (
                    trades.map((trade) => (
                      <tr key={trade.id} className="border-t hover:bg-muted/50">
                        <td className="p-3">
                          <Link to={`/trades/${trade.id}`} className="text-primary hover:underline">
                            {trade.tradeReference}
                          </Link>
                        </td>
                        <td className="p-3 capitalize">{trade.tradeType}</td>
                        <td className="p-3">
                          {trade.tradeType === 'physical' 
                            ? (trade as any).counterparty 
                            : (trade as any).broker}
                        </td>
                        <td className="p-3">
                          {trade.tradeType === 'physical' 
                            ? (trade as any).product 
                            : (trade as any).instrument}
                        </td>
                        <td className="p-3 text-right">
                          {trade.tradeType === 'physical' 
                            ? `${(trade as any).quantity} ${(trade as any).unit}` 
                            : `${(trade as any).quantity} MT`}
                        </td>
                        <td className="p-3">{formatDate(trade.createdAt)}</td>
                        <td className="p-3 text-center">
                          <Link to={`/trades/${trade.id}`}>
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-muted-foreground">
                        No trades found. Create your first trade.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TradesPage;
