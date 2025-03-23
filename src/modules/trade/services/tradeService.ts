import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { ParentTrade, TradeLeg, DbParentTrade, DbTradeLeg } from '@/core/types/common';
import { generateTradeReference, generateLegReference } from '@/modules/trade/utils/tradeUtils';

export class TradeService {
  /**
   * Fetches all parent trades from the database.
   * @returns {Promise<ParentTrade[]>} A promise that resolves to an array of parent trades.
   */
  async getParentTrades(): Promise<ParentTrade[]> {
    try {
      const { data: parentTrades, error } = await supabase
        .from('parent_trades')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching parent trades:', error);
        throw new Error(error.message);
      }

      // Transform the data to match the ParentTrade interface
      const transformedParentTrades: ParentTrade[] = parentTrades.map((trade: DbParentTrade) => ({
        id: trade.id,
        tradeReference: trade.trade_reference,
        tradeType: trade.trade_type,
        counterparty: trade.counterparty,
        createdAt: new Date(trade.created_at),
        updatedAt: new Date(trade.updated_at),
      }));

      return transformedParentTrades;
    } catch (error: any) {
      console.error('Error in getParentTrades:', error);
      throw new Error(error.message);
    }
  }

  /**
   * Fetches a single parent trade by its ID.
   * @param {string} id The ID of the parent trade to fetch.
   * @returns {Promise<ParentTrade | null>} A promise that resolves to the parent trade or null if not found.
   */
  async getParentTradeById(id: string): Promise<ParentTrade | null> {
    try {
      const { data: parentTrade, error } = await supabase
        .from('parent_trades')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching parent trade by ID:', error);
        return null;
      }

      if (!parentTrade) {
        console.log(`Parent trade with ID ${id} not found.`);
        return null;
      }

      // Transform the data to match the ParentTrade interface
      const transformedParentTrade: ParentTrade = {
        id: parentTrade.id,
        tradeReference: parentTrade.trade_reference,
        tradeType: parentTrade.trade_type,
        counterparty: parentTrade.counterparty,
        createdAt: new Date(parentTrade.created_at),
        updatedAt: new Date(parentTrade.updated_at),
      };

      return transformedParentTrade;
    } catch (error: any) {
      console.error('Error in getParentTradeById:', error);
      return null;
    }
  }

  /**
   * Creates a new parent trade in the database.
   * @param {Omit<ParentTrade, 'id' | 'createdAt' | 'updatedAt'>} trade The parent trade data to create.
   * @returns {Promise<ParentTrade>} A promise that resolves to the newly created parent trade.
   */
  async createParentTrade(trade: Omit<ParentTrade, 'id' | 'createdAt' | 'updatedAt'>): Promise<ParentTrade> {
    try {
      // Generate a unique trade reference
      const tradeReference = generateTradeReference();

      const newTrade: DbParentTrade = {
        id: uuidv4(),
        trade_reference: tradeReference,
        trade_type: trade.tradeType,
        counterparty: trade.counterparty,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: createdTrade, error } = await supabase
        .from('parent_trades')
        .insert([newTrade])
        .select('*')
        .single();

      if (error) {
        console.error('Error creating parent trade:', error);
        throw new Error(error.message);
      }

      // Transform the data to match the ParentTrade interface
      const transformedCreatedTrade: ParentTrade = {
        id: createdTrade.id,
        tradeReference: createdTrade.trade_reference,
        tradeType: createdTrade.trade_type,
        counterparty: createdTrade.counterparty,
        createdAt: new Date(createdTrade.created_at),
        updatedAt: new Date(createdTrade.updated_at),
      };

      return transformedCreatedTrade;
    } catch (error: any) {
      console.error('Error in createParentTrade:', error);
      throw new Error(error.message);
    }
  }

  /**
   * Updates an existing parent trade in the database.
   * @param {string} id The ID of the parent trade to update.
   * @param {Partial<Omit<ParentTrade, 'createdAt' | 'updatedAt'>>} updates The updates to apply to the parent trade.
   * @returns {Promise<ParentTrade | null>} A promise that resolves to the updated parent trade or null if not found.
   */
  async updateParentTrade(
    id: string,
    updates: Partial<Omit<ParentTrade, 'createdAt' | 'updatedAt'>>
  ): Promise<ParentTrade | null> {
    try {
      const { data: updatedTrade, error } = await supabase
        .from('parent_trades')
        .update({
          trade_type: updates.tradeType,
          counterparty: updates.counterparty,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating parent trade:', error);
        return null;
      }

      if (!updatedTrade) {
        console.log(`Parent trade with ID ${id} not found for update.`);
        return null;
      }

      // Transform the data to match the ParentTrade interface
      const transformedUpdatedTrade: ParentTrade = {
        id: updatedTrade.id,
        tradeReference: updatedTrade.trade_reference,
        tradeType: updatedTrade.trade_type,
        counterparty: updatedTrade.counterparty,
        createdAt: new Date(updatedTrade.created_at),
        updatedAt: new Date(updatedTrade.updated_at),
      };

      return transformedUpdatedTrade;
    } catch (error: any) {
      console.error('Error in updateParentTrade:', error);
      return null;
    }
  }

  /**
   * Deletes a parent trade from the database.
   * @param {string} id The ID of the parent trade to delete.
   * @returns {Promise<boolean>} A promise that resolves to true if the parent trade was successfully deleted, or false otherwise.
   */
  async deleteParentTrade(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('parent_trades')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting parent trade:', error);
        return false;
      }

      return true;
    } catch (error: any) {
      console.error('Error in deleteParentTrade:', error);
      return false;
    }
  }

  /**
   * Fetches all trade legs associated with a parent trade ID.
   * @param {string} parentTradeId The ID of the parent trade to fetch trade legs for.
   * @returns {Promise<TradeLeg[]>} A promise that resolves to an array of trade legs.
   */
  async getTradeLegsByParentTradeId(parentTradeId: string): Promise<TradeLeg[]> {
    try {
      const { data: tradeLegs, error } = await supabase
        .from('trade_legs')
        .select('*')
        .eq('parent_trade_id', parentTradeId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching trade legs:', error);
        throw new Error(error.message);
      }

      // Transform the data to match the TradeLeg interface
      const transformedTradeLegs: TradeLeg[] = tradeLegs.map((leg: any) => ({
        id: leg.id,
        parentTradeId: leg.parent_trade_id,
        legReference: leg.leg_reference,
        buySell: leg.buy_sell,
        product: leg.product,
        quantity: leg.quantity,
        unit: leg.unit || 'MT',
        price: leg.price || 0,
        createdAt: new Date(leg.created_at),
        updatedAt: new Date(leg.updated_at),
      }));

      return transformedTradeLegs;
    } catch (error: any) {
      console.error('Error in getTradeLegsByParentTradeId:', error);
      throw new Error(error.message);
    }
  }

  /**
   * Fetches a single trade leg by its ID.
   * @param {string} id The ID of the trade leg to fetch.
   * @returns {Promise<TradeLeg | null>} A promise that resolves to the trade leg or null if not found.
   */
  async getTradeLegById(id: string): Promise<TradeLeg | null> {
    try {
      const { data: tradeLeg, error } = await supabase
        .from('trade_legs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching trade leg by ID:', error);
        return null;
      }

      if (!tradeLeg) {
        console.log(`Trade leg with ID ${id} not found.`);
        return null;
      }

      // Transform the data to match the TradeLeg interface
      const transformedTradeLeg: TradeLeg = {
        id: tradeLeg.id,
        parentTradeId: tradeLeg.parent_trade_id,
        legReference: tradeLeg.leg_reference,
        buySell: tradeLeg.buy_sell,
        product: tradeLeg.product,
        quantity: tradeLeg.quantity,
        unit: tradeLeg.unit,
        price: tradeLeg.price,
        createdAt: new Date(tradeLeg.created_at),
        updatedAt: new Date(tradeLeg.updated_at),
      };

      return transformedTradeLeg;
    } catch (error: any) {
      console.error('Error in getTradeLegById:', error);
      return null;
    }
  }

  /**
   * Creates a new trade leg in the database.
   * @param {Omit<TradeLeg, 'id' | 'createdAt' | 'updatedAt'>} leg The trade leg data to create.
   * @returns {Promise<TradeLeg>} A promise that resolves to the newly created trade leg.
   */
  async createTradeLeg(leg: Omit<TradeLeg, 'id' | 'createdAt' | 'updatedAt'>): Promise<TradeLeg> {
    try {
      // Get the parent trade to generate the leg reference
      const parentTrade = await this.getParentTradeById(leg.parentTradeId);

      if (!parentTrade) {
        console.error(`Parent trade with ID ${leg.parentTradeId} not found.`);
        throw new Error(`Parent trade with ID ${leg.parentTradeId} not found.`);
      }

      // Get the existing legs to generate the leg reference
      const existingLegs = await this.getTradeLegsByParentTradeId(leg.parentTradeId);

      // Generate a unique leg reference
      const legReference = generateLegReference(parentTrade.tradeReference, existingLegs.length);

      const newLeg: any = {
        id: uuidv4(),
        parent_trade_id: leg.parentTradeId,
        leg_reference: legReference,
        buy_sell: leg.buySell,
        product: leg.product,
        quantity: leg.quantity,
        unit: leg.unit,
        price: leg.price,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: createdLeg, error } = await supabase
        .from('trade_legs')
        .insert([newLeg])
        .select('*')
        .single();

      if (error) {
        console.error('Error creating trade leg:', error);
        throw new Error(error.message);
      }

      // Transform the data to match the TradeLeg interface
      const transformedCreatedLeg: TradeLeg = {
        id: createdLeg.id,
        parentTradeId: createdLeg.parent_trade_id,
        legReference: createdLeg.leg_reference,
        buySell: createdLeg.buy_sell,
        product: createdLeg.product,
        quantity: createdLeg.quantity,
        unit: createdLeg.unit,
        price: createdLeg.price,
        createdAt: new Date(createdLeg.created_at),
        updatedAt: new Date(createdLeg.updated_at),
      };

      return transformedCreatedLeg;
    } catch (error: any) {
      console.error('Error in createTradeLeg:', error);
      throw new Error(error.message);
    }
  }

  /**
   * Updates an existing trade leg in the database.
   * @param {string} id The ID of the trade leg to update.
   * @param {Partial<Omit<TradeLeg, 'createdAt' | 'updatedAt' | 'parentTradeId' | 'legReference'>>} updates The updates to apply to the trade leg.
   * @returns {Promise<TradeLeg | null>} A promise that resolves to the updated trade leg or null if not found.
   */
  async updateTradeLeg(
    id: string,
    updates: Partial<Omit<TradeLeg, 'createdAt' | 'updatedAt' | 'parentTradeId' | 'legReference'>>
  ): Promise<TradeLeg | null> {
    try {
      const { data: updatedLeg, error } = await supabase
        .from('trade_legs')
        .update({
          buy_sell: updates.buySell,
          product: updates.product,
          quantity: updates.quantity,
          unit: updates.unit,
          price: updates.price,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating trade leg:', error);
        return null;
      }

      if (!updatedLeg) {
        console.log(`Trade leg with ID ${id} not found for update.`);
        return null;
      }

      // Transform the data to match the TradeLeg interface
      const transformedUpdatedLeg: TradeLeg = {
        id: updatedLeg.id,
        parentTradeId: updatedLeg.parent_trade_id,
        legReference: updatedLeg.leg_reference,
        buySell: updatedLeg.buy_sell,
        product: updatedLeg.product,
        quantity: updatedLeg.quantity,
        unit: updatedLeg.unit,
        price: updatedLeg.price,
        createdAt: new Date(updatedLeg.created_at),
        updatedAt: new Date(updatedLeg.updated_at),
      };

      return transformedUpdatedLeg;
    } catch (error: any) {
      console.error('Error in updateTradeLeg:', error);
      return null;
    }
  }

  /**
   * Deletes a trade leg from the database.
   * @param {string} id The ID of the trade leg to delete.
   * @returns {Promise<boolean>} A promise that resolves to true if the trade leg was successfully deleted, or false otherwise.
   */
  async deleteTradeLeg(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('trade_legs')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting trade leg:', error);
        return false;
      }

      return true;
    } catch (error: any) {
      console.error('Error in deleteTradeLeg:', error);
      return false;
    }
  }
}
