
import { BaseService } from '@/core/api/baseService';
import { Movement, MovementDto, CreateMovementInput, UpdateMovementInput } from '../types/movement';
import { supabaseClient } from '@/core/api/supabaseClient';

// Helper to convert database rows to Movement objects
const mapMovementDtoToMovement = (dto: MovementDto): Movement => {
  return {
    id: dto.id,
    tradeLegId: dto.trade_leg_id,
    movementReference: dto.movement_reference,
    status: dto.status as 'scheduled' | 'nominated' | 'loading' | 'completed',
    nominatedDate: dto.nominated_date ? new Date(dto.nominated_date) : undefined,
    nominationValidDate: dto.nomination_valid_date ? new Date(dto.nomination_valid_date) : undefined,
    cashFlowDate: dto.cash_flow_date ? new Date(dto.cash_flow_date) : undefined,
    vesselName: dto.vessel_name || undefined,
    loadport: dto.loadport || undefined,
    disport: dto.disport || undefined,
    inspector: dto.inspector || undefined,
    blDate: dto.bl_date ? new Date(dto.bl_date) : undefined,
    blQuantity: dto.bl_quantity || undefined,
    actualized: dto.actualized,
    actualizedDate: dto.actualized_date ? new Date(dto.actualized_date) : undefined,
    actualizedQuantity: dto.actualized_quantity || undefined,
    comments: dto.comments || undefined,
    createdAt: new Date(dto.created_at),
    updatedAt: new Date(dto.updated_at),
  };
};

// Movement service for CRUD operations
class MovementService extends BaseService<MovementDto> {
  constructor() {
    super('movements');
  }

  // Get all movements with transformed results
  async getAllMovements(options?: {
    tradeLegId?: string;
    status?: string;
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
    offset?: number;
  }): Promise<{ data: Movement[] | null; error: any }> {
    // Prepare filters
    const filters: Record<string, any> = {};
    if (options?.tradeLegId) {
      filters.trade_leg_id = options.tradeLegId;
    }
    if (options?.status) {
      filters.status = options.status;
    }

    const { data, error } = await this.getAll({
      columns: '*',
      filters,
      orderBy: options?.orderBy,
      limit: options?.limit,
      offset: options?.offset,
    });

    if (error) {
      return { data: null, error };
    }

    const movements = data?.map(mapMovementDtoToMovement) || null;
    return { data: movements, error: null };
  }

  // Get a movement by ID with transformations
  async getMovementById(id: string): Promise<{ data: Movement | null; error: any }> {
    const { data, error } = await this.getById(id);

    if (error || !data) {
      return { data: null, error };
    }

    const movement = mapMovementDtoToMovement(data);
    return { data: movement, error: null };
  }

  // Get movements with trade leg details
  async getMovementsWithTradeDetails(options?: {
    tradeLegId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: (Movement & { tradeLeg: any })[] | null; error: any }> {
    let query = supabaseClient.from('movements').select(`
      *,
      trade_legs:trade_leg_id (*)
    `);

    if (options?.tradeLegId) {
      query = query.eq('trade_leg_id', options.tradeLegId);
    }

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error };
    }

    const movements = data.map((item: any) => ({
      ...mapMovementDtoToMovement(item),
      tradeLeg: item.trade_legs,
    }));

    return { data: movements, error: null };
  }

  // Create a new movement
  async createMovement(
    input: CreateMovementInput
  ): Promise<{ data: Movement | null; error: any }> {
    const { data, error } = await this.create(input, {
      successMessage: 'Movement created successfully',
    });

    if (error || !data) {
      return { data: null, error };
    }

    const movement = mapMovementDtoToMovement(data);
    return { data: movement, error: null };
  }

  // Update a movement
  async updateMovement(
    id: string,
    updates: UpdateMovementInput
  ): Promise<{ data: Movement | null; error: any }> {
    const { data, error } = await this.update(id, updates, {
      successMessage: 'Movement updated successfully',
    });

    if (error || !data) {
      return { data: null, error };
    }

    const movement = mapMovementDtoToMovement(data);
    return { data: movement, error: null };
  }

  // Complete a movement and record actualization
  async actualizeMovement(
    id: string,
    actualizationData: {
      bl_date: string;
      bl_quantity: number;
      actualized_date: string;
      actualized_quantity: number;
      comments?: string;
    }
  ): Promise<{ data: Movement | null; error: any }> {
    const updates: UpdateMovementInput = {
      ...actualizationData,
      actualized: true,
      status: 'completed',
    };

    return await this.updateMovement(id, updates);
  }

  // Delete a movement
  async deleteMovement(
    id: string
  ): Promise<{ error: any }> {
    return await this.delete(id, {
      successMessage: 'Movement deleted successfully',
    });
  }

  // Count open movements for a trade leg
  async countOpenMovements(tradeLegId: string): Promise<{ count: number | null; error: any }> {
    return await this.count({
      trade_leg_id: tradeLegId,
      actualized: false,
    });
  }

  // Calculate scheduled quantity for a trade leg
  async getScheduledQuantity(tradeLegId: string): Promise<{ 
    scheduledQuantity: number; 
    actualizedQuantity: number;
    error: any 
  }> {
    const { data, error } = await supabaseClient
      .from('movements')
      .select('bl_quantity, actualized_quantity, actualized')
      .eq('trade_leg_id', tradeLegId);

    if (error) {
      return { scheduledQuantity: 0, actualizedQuantity: 0, error };
    }

    const scheduledQuantity = data.reduce((sum, movement) => {
      return sum + (movement.bl_quantity || 0);
    }, 0);

    const actualizedQuantity = data.reduce((sum, movement) => {
      return movement.actualized ? sum + (movement.actualized_quantity || 0) : sum;
    }, 0);

    return { 
      scheduledQuantity, 
      actualizedQuantity,
      error: null 
    };
  }
}

export const movementService = new MovementService();
