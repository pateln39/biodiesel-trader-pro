
import { supabase } from '@/integrations/supabase/client';
import { BaseApiService } from '@/core/api';
import { 
  Trade, 
  PhysicalTrade, 
  PhysicalTradeLeg, 
  TradeType, 
  PaperTrade, 
  PaperTradeLeg 
} from '../types';

class TradeService extends BaseApiService {
  // Physical Trade Methods
  async getPhysicalTrades(): Promise<PhysicalTrade[]> {
    try {
      const { data: parentTrades, error: parentTradesError } = await supabase
        .from('parent_trades')
        .select('*')
        .eq('trade_type', 'physical')
        .order('created_at', { ascending: false });

      if (parentTradesError) {
        return this.handleError(parentTradesError);
      }

      const { data: tradeLegs, error: tradeLegsError } = await supabase
        .from('trade_legs')
        .select('*')
        .order('created_at', { ascending: false });

      if (tradeLegsError) {
        return this.handleError(tradeLegsError);
      }

      // Transform the data from database format to application format
      return parentTrades
        .filter(parent => parent.trade_type === 'physical')
        .map(parent => {
          const legs = tradeLegs.filter(leg => leg.parent_trade_id === parent.id);
          const firstLeg = legs[0] || null;
          
          if (!firstLeg) {
            throw new Error(`Physical trade ${parent.id} has no legs`);
          }
          
          // Create a PhysicalTrade object from the database data
          const physicalTrade: PhysicalTrade = {
            id: parent.id,
            tradeReference: parent.trade_reference,
            tradeType: TradeType.Physical,
            physicalType: (parent.physical_type || 'spot') as 'spot' | 'term',
            counterparty: parent.counterparty,
            createdAt: new Date(parent.created_at),
            updatedAt: new Date(parent.updated_at),
            // Add main leg details
            buySell: firstLeg.buy_sell,
            product: firstLeg.product,
            sustainability: firstLeg.sustainability || '',
            incoTerm: firstLeg.inco_term || 'FOB',
            quantity: firstLeg.quantity,
            tolerance: firstLeg.tolerance || 0,
            loadingPeriodStart: firstLeg.loading_period_start ? new Date(firstLeg.loading_period_start) : new Date(),
            loadingPeriodEnd: firstLeg.loading_period_end ? new Date(firstLeg.loading_period_end) : new Date(),
            pricingPeriodStart: firstLeg.pricing_period_start ? new Date(firstLeg.pricing_period_start) : new Date(),
            pricingPeriodEnd: firstLeg.pricing_period_end ? new Date(firstLeg.pricing_period_end) : new Date(),
            unit: firstLeg.unit || 'MT',
            paymentTerm: firstLeg.payment_term || '30 days',
            creditStatus: firstLeg.credit_status || 'pending',
            formula: firstLeg.pricing_formula,
            mtmFormula: firstLeg.mtm_formula,
            // Add all legs including the first one
            legs: legs.map(leg => ({
              id: leg.id,
              parentTradeId: leg.parent_trade_id,
              legReference: leg.leg_reference,
              buySell: leg.buy_sell,
              product: leg.product,
              sustainability: leg.sustainability || '',
              incoTerm: leg.inco_term || 'FOB',
              quantity: leg.quantity,
              tolerance: leg.tolerance || 0,
              loadingPeriodStart: leg.loading_period_start ? new Date(leg.loading_period_start) : new Date(),
              loadingPeriodEnd: leg.loading_period_end ? new Date(leg.loading_period_end) : new Date(),
              pricingPeriodStart: leg.pricing_period_start ? new Date(leg.pricing_period_start) : new Date(),
              pricingPeriodEnd: leg.pricing_period_end ? new Date(leg.pricing_period_end) : new Date(),
              unit: leg.unit || 'MT',
              paymentTerm: leg.payment_term || '30 days',
              creditStatus: leg.credit_status || 'pending',
              formula: leg.pricing_formula,
              mtmFormula: leg.mtm_formula
            })),
          };
          
          return physicalTrade;
        });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async createPhysicalTrade(trade: Omit<PhysicalTrade, 'id' | 'createdAt' | 'updatedAt'>): Promise<PhysicalTrade> {
    try {
      // Start a transaction
      const { data: parent, error: parentError } = await supabase
        .from('parent_trades')
        .insert({
          trade_reference: trade.tradeReference,
          trade_type: TradeType.Physical,
          physical_type: trade.physicalType,
          counterparty: trade.counterparty,
        })
        .select()
        .single();

      if (parentError) {
        return this.handleError(parentError);
      }

      // Create the main leg
      const { data: leg, error: legError } = await supabase
        .from('trade_legs')
        .insert({
          parent_trade_id: parent.id,
          leg_reference: `${trade.tradeReference}-1`,
          buy_sell: trade.buySell,
          product: trade.product,
          sustainability: trade.sustainability,
          inco_term: trade.incoTerm,
          quantity: trade.quantity,
          tolerance: trade.tolerance,
          loading_period_start: trade.loadingPeriodStart,
          loading_period_end: trade.loadingPeriodEnd,
          pricing_period_start: trade.pricingPeriodStart,
          pricing_period_end: trade.pricingPeriodEnd,
          unit: trade.unit,
          payment_term: trade.paymentTerm,
          credit_status: trade.creditStatus,
          pricing_formula: trade.formula,
          mtm_formula: trade.mtmFormula,
        })
        .select()
        .single();

      if (legError) {
        return this.handleError(legError);
      }

      // Create any additional legs
      if (trade.legs && trade.legs.length > 0) {
        // Implementation for additional legs
      }

      // Return the created trade (would normally fetch the complete trade)
      return {
        ...trade,
        id: parent.id,
        createdAt: new Date(parent.created_at),
        updatedAt: new Date(parent.updated_at),
        legs: [{
          ...leg,
          parentTradeId: parent.id,
          buySell: leg.buy_sell,
          product: leg.product,
          incoTerm: leg.inco_term,
          loadingPeriodStart: new Date(leg.loading_period_start),
          loadingPeriodEnd: new Date(leg.loading_period_end),
          pricingPeriodStart: new Date(leg.pricing_period_start),
          pricingPeriodEnd: new Date(leg.pricing_period_end),
          unit: leg.unit,
          paymentTerm: leg.payment_term,
          creditStatus: leg.credit_status,
          formula: leg.pricing_formula,
          mtmFormula: leg.mtm_formula,
        } as PhysicalTradeLeg],
      } as PhysicalTrade;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updatePhysicalTrade(trade: PhysicalTrade): Promise<PhysicalTrade> {
    try {
      // Update the parent trade
      const { error: parentError } = await supabase
        .from('parent_trades')
        .update({
          trade_reference: trade.tradeReference,
          physical_type: trade.physicalType,
          counterparty: trade.counterparty,
        })
        .eq('id', trade.id);

      if (parentError) {
        return this.handleError(parentError);
      }

      // Update the main leg
      // This would update the primary leg and handle additional legs as needed
      
      return trade; // Return the updated trade
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deletePhysicalTrade(id: string): Promise<void> {
    try {
      // Delete the parent trade (cascade will delete legs)
      const { error } = await supabase
        .from('parent_trades')
        .delete()
        .eq('id', id);

      if (error) {
        this.handleError(error);
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  // Paper Trade Methods
  async getPaperTrades(): Promise<PaperTrade[]> {
    try {
      const { data: paperTrades, error: paperTradesError } = await supabase
        .from('paper_trades')
        .select('*')
        .order('created_at', { ascending: false });

      if (paperTradesError) {
        return this.handleError(paperTradesError);
      }

      const { data: paperTradeLegs, error: paperTradeLegsError } = await supabase
        .from('paper_trade_legs')
        .select('*')
        .order('created_at', { ascending: false });

      if (paperTradeLegsError) {
        return this.handleError(paperTradeLegsError);
      }

      // Transform the data from database format to application format
      return paperTrades.map(trade => {
        const legs = paperTradeLegs.filter(leg => leg.paper_trade_id === trade.id);
        
        // Create a PaperTrade object from the database data
        const paperTrade: PaperTrade = {
          id: trade.id,
          tradeReference: trade.trade_reference,
          tradeType: TradeType.Paper,
          counterparty: trade.counterparty,
          broker: trade.broker,
          comment: trade.comment,
          createdAt: new Date(trade.created_at),
          updatedAt: new Date(trade.updated_at),
          legs: legs.map(leg => ({
            id: leg.id,
            paperTradeId: leg.paper_trade_id,
            legReference: leg.leg_reference,
            buySell: leg.buy_sell,
            product: leg.product,
            period: leg.period,
            tradingPeriod: leg.trading_period,
            quantity: leg.quantity,
            price: leg.price,
            broker: leg.broker,
            instrument: leg.instrument,
            pricingPeriodStart: leg.pricing_period_start ? new Date(leg.pricing_period_start) : undefined,
            pricingPeriodEnd: leg.pricing_period_end ? new Date(leg.pricing_period_end) : undefined,
            formula: leg.formula,
            mtmFormula: leg.mtm_formula,
            exposures: leg.exposures
          }))
        };
        
        return paperTrade;
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async createPaperTrade(trade: Omit<PaperTrade, 'id' | 'createdAt' | 'updatedAt'>): Promise<PaperTrade> {
    try {
      // Implementation for creating a paper trade
      return {} as PaperTrade; // Placeholder for now
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updatePaperTrade(trade: PaperTrade): Promise<PaperTrade> {
    try {
      // Implementation for updating a paper trade
      return trade; // Placeholder for now
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deletePaperTrade(id: string): Promise<void> {
    try {
      // Implementation for deleting a paper trade
    } catch (error) {
      this.handleError(error);
    }
  }
}

export const tradeService = new TradeService();
