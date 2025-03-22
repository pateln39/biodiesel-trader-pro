
import { supabase } from '@/integrations/supabase/client';
import { BaseApiService } from '@/core/api';
import { Movement, MovementStatus } from '../types';

class MovementService extends BaseApiService {
  async getMovements(): Promise<Movement[]> {
    try {
      const { data, error } = await supabase
        .from('movements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return this.handleError(error);
      }

      // Transform the data from database format to application format
      return data.map(movement => ({
        id: movement.id,
        tradeLegId: movement.trade_leg_id,
        movementReference: movement.movement_reference,
        status: movement.status as MovementStatus,
        nominatedDate: movement.nominated_date ? new Date(movement.nominated_date) : undefined,
        nominationValidDate: movement.nomination_valid_date ? new Date(movement.nomination_valid_date) : undefined,
        cashFlowDate: movement.cash_flow_date ? new Date(movement.cash_flow_date) : undefined,
        vesselName: movement.vessel_name,
        loadport: movement.loadport,
        disport: movement.disport,
        inspector: movement.inspector,
        blDate: movement.bl_date ? new Date(movement.bl_date) : undefined,
        blQuantity: movement.bl_quantity,
        actualized: movement.actualized,
        actualizedDate: movement.actualized_date ? new Date(movement.actualized_date) : undefined,
        actualizedQuantity: movement.actualized_quantity,
        comments: movement.comments,
        createdAt: new Date(movement.created_at),
        updatedAt: new Date(movement.updated_at),
      }));
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getMovementsByTradeLeg(tradeLegId: string): Promise<Movement[]> {
    try {
      const { data, error } = await supabase
        .from('movements')
        .select('*')
        .eq('trade_leg_id', tradeLegId)
        .order('created_at', { ascending: false });

      if (error) {
        return this.handleError(error);
      }

      // Transform the data from database format to application format
      return data.map(movement => ({
        id: movement.id,
        tradeLegId: movement.trade_leg_id,
        movementReference: movement.movement_reference,
        status: movement.status as MovementStatus,
        nominatedDate: movement.nominated_date ? new Date(movement.nominated_date) : undefined,
        nominationValidDate: movement.nomination_valid_date ? new Date(movement.nomination_valid_date) : undefined,
        cashFlowDate: movement.cash_flow_date ? new Date(movement.cash_flow_date) : undefined,
        vesselName: movement.vessel_name,
        loadport: movement.loadport,
        disport: movement.disport,
        inspector: movement.inspector,
        blDate: movement.bl_date ? new Date(movement.bl_date) : undefined,
        blQuantity: movement.bl_quantity,
        actualized: movement.actualized,
        actualizedDate: movement.actualized_date ? new Date(movement.actualized_date) : undefined,
        actualizedQuantity: movement.actualized_quantity,
        comments: movement.comments,
        createdAt: new Date(movement.created_at),
        updatedAt: new Date(movement.updated_at),
      }));
    } catch (error) {
      return this.handleError(error);
    }
  }

  async createMovement(movement: Omit<Movement, 'id' | 'createdAt' | 'updatedAt'>): Promise<Movement> {
    try {
      const { data, error } = await supabase
        .from('movements')
        .insert({
          trade_leg_id: movement.tradeLegId,
          movement_reference: movement.movementReference,
          status: movement.status,
          nominated_date: movement.nominatedDate,
          nomination_valid_date: movement.nominationValidDate,
          cash_flow_date: movement.cashFlowDate,
          vessel_name: movement.vesselName,
          loadport: movement.loadport,
          disport: movement.disport,
          inspector: movement.inspector,
          bl_date: movement.blDate,
          bl_quantity: movement.blQuantity,
          actualized: movement.actualized,
          actualized_date: movement.actualizedDate,
          actualized_quantity: movement.actualizedQuantity,
          comments: movement.comments,
        })
        .select()
        .single();

      if (error) {
        return this.handleError(error);
      }

      // Transform the data from database format to application format
      return {
        id: data.id,
        tradeLegId: data.trade_leg_id,
        movementReference: data.movement_reference,
        status: data.status as MovementStatus,
        nominatedDate: data.nominated_date ? new Date(data.nominated_date) : undefined,
        nominationValidDate: data.nomination_valid_date ? new Date(data.nomination_valid_date) : undefined,
        cashFlowDate: data.cash_flow_date ? new Date(data.cash_flow_date) : undefined,
        vesselName: data.vessel_name,
        loadport: data.loadport,
        disport: data.disport,
        inspector: data.inspector,
        blDate: data.bl_date ? new Date(data.bl_date) : undefined,
        blQuantity: data.bl_quantity,
        actualized: data.actualized,
        actualizedDate: data.actualized_date ? new Date(data.actualized_date) : undefined,
        actualizedQuantity: data.actualized_quantity,
        comments: data.comments,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateMovement(movement: Movement): Promise<Movement> {
    try {
      const { data, error } = await supabase
        .from('movements')
        .update({
          trade_leg_id: movement.tradeLegId,
          movement_reference: movement.movementReference,
          status: movement.status,
          nominated_date: movement.nominatedDate,
          nomination_valid_date: movement.nominationValidDate,
          cash_flow_date: movement.cashFlowDate,
          vessel_name: movement.vesselName,
          loadport: movement.loadport,
          disport: movement.disport,
          inspector: movement.inspector,
          bl_date: movement.blDate,
          bl_quantity: movement.blQuantity,
          actualized: movement.actualized,
          actualized_date: movement.actualizedDate,
          actualized_quantity: movement.actualizedQuantity,
          comments: movement.comments,
        })
        .eq('id', movement.id)
        .select()
        .single();

      if (error) {
        return this.handleError(error);
      }

      // Transform the data from database format to application format
      return {
        id: data.id,
        tradeLegId: data.trade_leg_id,
        movementReference: data.movement_reference,
        status: data.status as MovementStatus,
        nominatedDate: data.nominated_date ? new Date(data.nominated_date) : undefined,
        nominationValidDate: data.nomination_valid_date ? new Date(data.nomination_valid_date) : undefined,
        cashFlowDate: data.cash_flow_date ? new Date(data.cash_flow_date) : undefined,
        vesselName: data.vessel_name,
        loadport: data.loadport,
        disport: data.disport,
        inspector: data.inspector,
        blDate: data.bl_date ? new Date(data.bl_date) : undefined,
        blQuantity: data.bl_quantity,
        actualized: data.actualized,
        actualizedDate: data.actualized_date ? new Date(data.actualized_date) : undefined,
        actualizedQuantity: data.actualized_quantity,
        comments: data.comments,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deleteMovement(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('movements')
        .delete()
        .eq('id', id);

      if (error) {
        this.handleError(error);
      }
    } catch (error) {
      this.handleError(error);
    }
  }
}

export const movementService = new MovementService();
