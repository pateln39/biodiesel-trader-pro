
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PaginationParams, PaginatedResponse } from '@/types/pagination';

export interface PhysicalMTMPosition {
  id: string;
  leg_id: string;
  trade_reference: string;
  leg_reference: string;
  physical_type: string;
  buy_sell: string;
  product: string;
  quantity: number;
  pricing_period_start: string;
  pricing_period_end: string;
  pricing_type: string;
  period_type: string;
  trade_price: number;
  mtm_price: number;
  mtm_value: number;
  efp_premium?: number;
  efp_agreed_status?: boolean;
  efp_fixed_value?: number;
  mtm_future_month?: string;
  calculated_at: string;
  created_at: string;
  updated_at: string;
}

interface UseFilteredPhysicalMTMParams extends PaginationParams {}

export const useFilteredPhysicalMTM = ({
  page = 1,
  pageSize = 15,
}: UseFilteredPhysicalMTMParams) => {
  return useQuery({
    queryKey: ['filteredPhysicalMTM', page, pageSize],
    queryFn: async (): Promise<PaginatedResponse<PhysicalMTMPosition>> => {
      console.log(`[PHYSICAL_MTM] Fetching physical MTM positions for page: ${page}`);
      
      const { data, error } = await supabase.rpc('filter_physical_mtm_positions', {
        p_page: page,
        p_page_size: pageSize,
      });

      if (error) {
        console.error('[PHYSICAL_MTM] Error fetching physical MTM positions:', error);
        throw new Error(`Failed to fetch physical MTM positions: ${error.message}`);
      }

      console.log('[PHYSICAL_MTM] Raw response:', data);

      // Type assertion since we know the structure from our SQL function
      const result = data as unknown as {
        positions: PhysicalMTMPosition[];
        pagination: {
          totalItems: number;
          totalPages: number;
          currentPage: number;
          pageSize: number;
        };
      };

      console.log('[PHYSICAL_MTM] Processed result:', result);

      return {
        data: result?.positions || [],
        meta: result?.pagination || {
          totalItems: 0,
          totalPages: 1,
          currentPage: page,
          pageSize,
        },
      };
    },
  });
};
