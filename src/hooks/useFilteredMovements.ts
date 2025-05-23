
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Movement } from '@/types';
import { FilterOptions } from '@/components/operations/MovementsFilter';
import { PaginationParams, PaginationMeta } from '@/types/pagination';
import { SortConfig } from '@/hooks/useMovementDateSort';

interface FilteredMovementsResponse {
  movements: Movement[];
  pagination: PaginationMeta;
}

// Helper function to convert camelCase to snake_case
const toSnakeCase = (str: string): string => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

// Helper function to convert from camelCase object keys to snake_case
const convertFiltersToSnakeCase = (filters: Partial<FilterOptions>): Record<string, any> => {
  const result: Record<string, any> = {};
  
  Object.entries(filters).forEach(([key, value]) => {
    const snakeKey = toSnakeCase(key);
    result[snakeKey] = value;
  });
  
  return result;
};

export const useFilteredMovements = (
  filters: Partial<FilterOptions> = {},
  paginationParams: PaginationParams = { page: 1, pageSize: 15 },
  sortConfig: SortConfig[] = []
) => {
  const [activeFilterCount, setActiveFilterCount] = useState<number>(0);
  const [noResultsFound, setNoResultsFound] = useState<boolean>(false);
  
  // Count active filters
  useEffect(() => {
    let count = 0;
    Object.entries(filters).forEach(([_, filterValues]) => {
      if (Array.isArray(filterValues) && filterValues.length > 0) {
        count++;
      }
    });
    setActiveFilterCount(count);
  }, [filters]);

  // Convert filters to snake_case for the database
  const prepareFiltersForApi = () => {
    const apiFilters: Record<string, any> = {};
    
    // Convert array filters
    if (filters.status && filters.status.length > 0) {
      apiFilters.status = filters.status;
    }
    
    if (filters.product && filters.product.length > 0) {
      apiFilters.product = filters.product;
    }
    
    if (filters.buySell && filters.buySell.length > 0) {
      apiFilters.buySell = filters.buySell;
    }
    
    if (filters.incoTerm && filters.incoTerm.length > 0) {
      apiFilters.incoTerm = filters.incoTerm;
    }
    
    if (filters.sustainability && filters.sustainability.length > 0) {
      apiFilters.sustainability = filters.sustainability;
    }
    
    if (filters.counterparty && filters.counterparty.length > 0) {
      apiFilters.counterparty = filters.counterparty;
    }
    
    if (filters.creditStatus && filters.creditStatus.length > 0) {
      apiFilters.creditStatus = filters.creditStatus;
    }
    
    if (filters.customsStatus && filters.customsStatus.length > 0) {
      apiFilters.customsStatus = filters.customsStatus;
    }
    
    if (filters.loadport && filters.loadport.length > 0) {
      apiFilters.loadport = filters.loadport;
    }
    
    if (filters.loadportInspector && filters.loadportInspector.length > 0) {
      apiFilters.loadportInspector = filters.loadportInspector;
    }
    
    if (filters.disport && filters.disport.length > 0) {
      apiFilters.disport = filters.disport;
    }
    
    if (filters.disportInspector && filters.disportInspector.length > 0) {
      apiFilters.disportInspector = filters.disportInspector;
    }

    return apiFilters;
  };
  
  // Format the sort columns for the API
  const prepareSortConfig = () => {
    return sortConfig.map(sc => {
      // Map camelCase column names to snake_case for the database
      let columnName = sc.column;
      
      // Only convert specific camelCase column names that differ from database column names
      if (columnName === 'nominationEta') {
        columnName = 'nomination_eta' as any;
      } else if (columnName === 'nominationValid') {
        columnName = 'nomination_valid' as any;
      } else if (columnName === 'cashFlow') {
        columnName = 'cash_flow' as any;
      } else if (columnName === 'blDate') {
        columnName = 'bl_date' as any;
      } else if (columnName === 'codDate') {
        columnName = 'cod_date' as any;
      }
      
      return {
        column: columnName,
        direction: sc.direction
      };
    });
  };

  // Fetch filtered movements from the database
  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['filteredMovements', filters, paginationParams, sortConfig],
    queryFn: async () => {
      try {
        console.log('[MOVEMENTS] Fetching filtered movements with:', {
          filters: prepareFiltersForApi(),
          page: paginationParams.page,
          pageSize: paginationParams.pageSize,
          sortColumns: prepareSortConfig()
        });
        
        // Call the filter_movements RPC function
        const { data: responseData, error } = await supabase.rpc('filter_movements', {
          p_filters: prepareFiltersForApi(),
          p_page: paginationParams.page,
          p_page_size: paginationParams.pageSize,
          p_sort_columns: prepareSortConfig()
        });
        
        if (error) {
          console.error('[MOVEMENTS] Error fetching filtered movements:', error);
          throw error;
        }

        // Safely convert the JSON response to our expected type
        const typedResponse = responseData as unknown as FilteredMovementsResponse;
        
        // Validate the response structure
        if (!typedResponse || !typedResponse.movements || !typedResponse.pagination) {
          console.error('[FILTERED MOVEMENTS] Invalid response format:', responseData);
          return { 
            movements: [], 
            pagination: { 
              totalItems: 0, 
              totalPages: 1, 
              currentPage: paginationParams.page, 
              pageSize: paginationParams.pageSize 
            } 
          };
        }
        
        // Check if no results were found
        setNoResultsFound(typedResponse.movements.length === 0 && activeFilterCount > 0);

        // Transform the data from snake_case to camelCase for the frontend
        const transformedMovements = (typedResponse.movements || []).map((m: any) => ({
          id: m.id,
          referenceNumber: m.reference_number,
          tradeLegId: m.trade_leg_id,
          parentTradeId: m.parent_trade_id,
          tradeReference: m.trade_reference,
          counterpartyName: m.counterparty || 'Unknown',
          product: m.product || 'Unknown',
          buySell: m.buy_sell,
          incoTerm: m.inco_term,
          sustainability: m.sustainability,
          scheduledQuantity: m.scheduled_quantity,
          blQuantity: m.bl_quantity,
          actualQuantity: m.actual_quantity,
          loading_period_start: m.loading_period_start,
          loading_period_end: m.loading_period_end,
          nominationEta: m.nomination_eta ? new Date(m.nomination_eta) : undefined,
          nominationValid: m.nomination_valid ? new Date(m.nomination_valid) : undefined,
          cashFlow: m.cash_flow ? new Date(m.cash_flow) : undefined,
          bargeName: m.barge_name,
          loadport: m.loadport,
          loadportInspector: m.loadport_inspector,
          disport: m.disport,
          disportInspector: m.disport_inspector,
          blDate: m.bl_date ? new Date(m.bl_date) : undefined,
          codDate: m.cod_date ? new Date(m.cod_date) : undefined,
          pricingType: m.pricing_type,
          pricingFormula: m.pricing_formula,
          comments: m.comments,
          customsStatus: m.customs_status,
          creditStatus: m.credit_status,
          contractStatus: m.contract_status,
          status: m.status || 'scheduled',
          date: new Date(m.created_at),
          createdAt: new Date(m.created_at),
          updatedAt: new Date(m.updated_at),
          sort_order: m.sort_order,
          group_id: m.group_id,
        }));
        
        return { 
          movements: transformedMovements, 
          pagination: typedResponse.pagination 
        };
      } catch (error: any) {
        console.error('[MOVEMENTS] Error in useFilteredMovements:', error);
        throw new Error(error.message);
      }
    },
  });

  return {
    movements: data?.movements || [],
    pagination: data?.pagination,
    loading: isLoading,
    error,
    refetchMovements: refetch,
    activeFilterCount,
    noResultsFound
  };
};
