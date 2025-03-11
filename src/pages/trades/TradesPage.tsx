
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Filter, Loader2 } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/utils/tradeUtils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Trade, 
  TradeType, 
  PhysicalTrade, 
  PaperTrade,
  PhysicalTradeLeg,
  PaperTradeLeg,
  BuySell,
  Product,
  IncoTerm,
  Unit,
  PaymentTerm,
  CreditStatus,
  Instrument,
  DbParentTrade,
  DbTradeLeg,
  PricingComponent
} from '@/types';
import { convertToNewFormulaFormat } from '@/utils/formulaUtils';

// Helper to safely parse pricingFormula from DB
const parsePricingFormula = (rawFormula: any): PricingComponent[] => {
  if (!rawFormula) return [];
  
  // If it's already an array with the right structure
  if (Array.isArray(rawFormula) && 
      rawFormula.length > 0 && 
      typeof rawFormula[0] === 'object' && 
      'instrument' in rawFormula[0]) {
    return rawFormula as PricingComponent[];
  }
  
  // Default formula if parsing fails
  return [{ 
    instrument: 'Argus UCOME', 
    percentage: 100, 
    adjustment: 0 
  }];
};

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
        const mappedTrades = parentTrades.map((parent: DbParentTrade) => {
          // Find all legs for this parent trade
          const legs = tradeLegs.filter((leg: DbTradeLeg) => leg.parent_trade_id === parent.id);
          
          // Use the first leg for the main trade data (for backward compatibility)
          const firstLeg = legs.length > 0 ? legs[0] : null;
          
          if (parent.trade_type === 'physical' && firstLeg) {
            // Create physical trade
            const physicalTrade: PhysicalTrade = {
              id: parent.id,
              tradeReference: parent.trade_reference,
              tradeType: 'physical', // Use the literal type instead of variable
              createdAt: new Date(parent.created_at),
              updatedAt: new Date(parent.updated_at),
              physicalType: (parent.physical_type || 'spot') as 'spot' | 'term',
              counterparty: parent.counterparty,
              buySell: firstLeg.buy_sell as BuySell,
              product: firstLeg.product as Product,
              sustainability: firstLeg.sustainability || '',
              incoTerm: (firstLeg.inco_term || 'FOB') as IncoTerm,
              quantity: firstLeg.quantity,
              tolerance: firstLeg.tolerance || 0,
              loadingPeriodStart: firstLeg.loading_period_start ? new Date(firstLeg.loading_period_start) : new Date(),
              loadingPeriodEnd: firstLeg.loading_period_end ? new Date(firstLeg.loading_period_end) : new Date(),
              pricingPeriodStart: firstLeg.pricing_period_start ? new Date(firstLeg.pricing_period_start) : new Date(),
              pricingPeriodEnd: firstLeg.pricing_period_end ? new Date(firstLeg.pricing_period_end) : new Date(),
              unit: (firstLeg.unit || 'MT') as Unit,
              paymentTerm: (firstLeg.payment_term || '30 days') as PaymentTerm,
              creditStatus: (firstLeg.credit_status || 'pending') as CreditStatus,
              pricingFormula: parsePricingFormula(firstLeg.pricing_formula),
              legs: legs.map(leg => ({
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
                pricingFormula: parsePricingFormula(leg.pricing_formula),
                formula: leg.pricing_formula ? convertToNewFormulaFormat(parsePricingFormula(leg.pricing_formula)) : undefined
              })) as PhysicalTradeLeg[]
            };
            return physicalTrade;
          } 
          else if (parent.trade_type === 'paper' && firstLeg) {
            // For paper trades, check if broker/instrument/price fields exist
            const broker = 'broker' in firstLeg ? firstLeg.broker : '';
            const instrument = 'instrument' in firstLeg ? firstLeg.instrument : '';
            const price = 'price' in firstLeg ? firstLeg.price : 0;
            
            // Create paper trade
            const paperTrade: PaperTrade = {
              id: parent.id,
              tradeReference: parent.trade_reference,
              tradeType: 'paper', // Use the literal type instead of variable
              createdAt: new Date(parent.created_at),
              updatedAt: new Date(parent.updated_at),
              broker: broker || '',
              instrument: instrument || '',
              price: price || 0,
              quantity: firstLeg.quantity,
              pricingPeriodStart: firstLeg.pricing_period_start ? new Date(firstLeg.pricing_period_start) : new Date(),
              pricingPeriodEnd: firstLeg.pricing_period_end ? new Date(firstLeg.pricing_period_end) : new Date(),
            };
            return paperTrade;
          }
          
          // Fallback with minimal data if there are no legs or unknown type
          return {
            id: parent.id,
            tradeReference: parent.trade_reference,
            tradeType: parent.trade_type as TradeType,
            createdAt: new Date(parent.created_at),
            updatedAt: new Date(parent.updated_at),
            counterparty: parent.counterparty
          } as Trade;
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
                    trades.map((trade) => {
                      const isPhysical = trade.tradeType === 'physical';
                      const physicalTrade = isPhysical ? trade as PhysicalTrade : null;
                      const paperTrade = !isPhysical ? trade as PaperTrade : null;
                      
                      return (
                        <tr key={trade.id} className="border-t hover:bg-muted/50">
                          <td className="p-3">
                            <Link to={`/trades/${trade.id}`} className="text-primary hover:underline">
                              {trade.tradeReference}
                            </Link>
                          </td>
                          <td className="p-3 capitalize">{trade.tradeType}</td>
                          <td className="p-3">
                            {isPhysical ? physicalTrade?.counterparty : paperTrade?.broker}
                          </td>
                          <td className="p-3">
                            {isPhysical ? physicalTrade?.product : paperTrade?.instrument}
                          </td>
                          <td className="p-3 text-right">
                            {isPhysical 
                              ? `${physicalTrade?.quantity} ${physicalTrade?.unit}` 
                              : `${paperTrade?.quantity} MT`}
                          </td>
                          <td className="p-3">{formatDate(trade.createdAt)}</td>
                          <td className="p-3 text-center">
                            <Link to={`/trades/${trade.id}`}>
                              <Button variant="ghost" size="sm">View</Button>
                            </Link>
                          </td>
                        </tr>
                      );
                    })
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
