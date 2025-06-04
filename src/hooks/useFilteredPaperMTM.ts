
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PaginationParams, PaginatedResponse } from '@/types/pagination';

export interface PaperMTMPosition {
  id: string;
  leg_id: string;
  trade_reference: string;
  leg_reference: string;
  buy_sell: string;
  product: string;
  quantity: number;
  period: string;
  relationship_type: string;
  period_type: string;
  trade_price: number;
  mtm_price: number;
  mtm_value: number;
  right_side?: any;
  calculated_at: string;
  created_at: string;
  updated_at: string;
}

interface UseFilteredPaperMTMParams extends PaginationParams {}

export const useFilteredPaperMTM = ({
  page = 1,
  pageSize = 15,
}: UseFilteredPaperMTMParams) => {
  return useQuery({
    queryKey: ['filteredPaperMTM', page, pageSize],
    queryFn: async (): Promise<PaginatedResponse<PaperMTMPosition>> => {
      console.log(`[PAPER_MTM] Fetching paper MTM positions for page: ${page}`);
      
      const { data, error } = await supabase.rpc('filter_paper_mtm_positions', {
        p_page: page,
        p_page_size: pageSize,
      });

      if (error) {
        console.error('[PAPER_MTM] Error fetching paper MTM positions:', error);
        throw new Error(`Failed to fetch paper MTM positions: ${error.message}`);
      }

      console.log('[PAPER_MTM] Raw response:', data);

      // Type assertion since we know the structure from our SQL function
      const result = data as unknown as {
        positions: PaperMTMPosition[];
        pagination: {
          totalItems: number;
          totalPages: number;
          currentPage: number;
          pageSize: number;
        };
      };

      console.log('[PAPER_MTM] Processed result:', result);

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
