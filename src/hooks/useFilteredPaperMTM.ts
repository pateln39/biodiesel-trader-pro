
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PaginationParams, PaginatedResponse } from '@/types/pagination';

export interface PaperMTMFilters {
  tradeReference?: string;
  product?: string[];
  buySell?: string[];
  relationshipType?: string[];
  period?: string;
}

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

interface UseFilteredPaperMTMParams extends PaginationParams {
  filters?: PaperMTMFilters;
  sortColumns?: Array<{
    column: string;
    direction: 'asc' | 'desc';
  }>;
}

export const useFilteredPaperMTM = ({
  page = 1,
  pageSize = 15,
  filters = {},
  sortColumns = [{ column: 'calculated_at', direction: 'desc' }],
}: UseFilteredPaperMTMParams) => {
  return useQuery({
    queryKey: ['filteredPaperMTM', page, pageSize, filters, sortColumns],
    queryFn: async (): Promise<PaginatedResponse<PaperMTMPosition>> => {
      const { data, error } = await supabase.rpc('filter_paper_mtm_positions', {
        p_filters: filters,
        p_page: page,
        p_page_size: pageSize,
        p_sort_columns: sortColumns,
      });

      if (error) {
        console.error('Error fetching paper MTM positions:', error);
        throw new Error(`Failed to fetch paper MTM positions: ${error.message}`);
      }

      return {
        data: data?.positions || [],
        meta: data?.pagination || {
          totalItems: 0,
          totalPages: 1,
          currentPage: page,
          pageSize,
        },
      };
    },
  });
};
