
export interface Movement {
  id: string;
  tradeLegId: string;
  movementReference: string;
  status: 'scheduled' | 'nominated' | 'loading' | 'completed';
  nominatedDate?: Date;
  nominationValidDate?: Date;
  cashFlowDate?: Date;
  vesselName?: string;
  loadport?: string;
  disport?: string;
  inspector?: string;
  blDate?: Date;
  blQuantity?: number;
  actualized: boolean;
  actualizedDate?: Date;
  actualizedQuantity?: number;
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  tradeLeg?: import('@/types/index').DbTradeLeg;
}

export interface MovementDto {
  id: string;
  trade_leg_id: string;
  movement_reference: string;
  status: string;
  nominated_date: string | null;
  nomination_valid_date: string | null;
  cash_flow_date: string | null;
  vessel_name: string | null;
  loadport: string | null;
  disport: string | null;
  inspector: string | null;
  bl_date: string | null;
  bl_quantity: number | null;
  actualized: boolean;
  actualized_date: string | null;
  actualized_quantity: number | null;
  comments: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateMovementInput {
  trade_leg_id: string;
  movement_reference: string;
  status: 'scheduled' | 'nominated' | 'loading' | 'completed';
  nominated_date?: string;
  nomination_valid_date?: string;
  cash_flow_date?: string;
  vessel_name?: string;
  loadport?: string;
  disport?: string;
  inspector?: string;
  comments?: string;
}

export interface UpdateMovementInput {
  status?: 'scheduled' | 'nominated' | 'loading' | 'completed';
  nominated_date?: string | null;
  nomination_valid_date?: string | null;
  cash_flow_date?: string | null;
  vessel_name?: string | null;
  loadport?: string | null;
  disport?: string | null;
  inspector?: string | null;
  bl_date?: string | null;
  bl_quantity?: number | null;
  actualized?: boolean;
  actualized_date?: string | null;
  actualized_quantity?: number | null;
  comments?: string | null;
}
