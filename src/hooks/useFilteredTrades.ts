import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PhysicalTrade } from '@/types';
import { PaginationParams, PaginationMeta } from '@/types/pagination';

export interface TradeFilterOptions {
  tradeReference?: string;
  buySell: string[];
  product: string[];
  sustainability: string[];
  incoTerm: string[];
  creditStatus: string[];
  customsStatus: string[];
  contractStatus: string[];
  pricingType: string[];
  loadingPeriodStartFrom?: Date;
  loadingPeriodStartTo?: Date;
  loadingPeriodEndFrom?: Date;
  loadingPeriodEndTo?: Date;
  pricingPeriodStartFrom?: Date;
  pricingPeriodStartTo?: Date;
  pricingPeriodEndFrom?: Date;
  pricingPeriodEndTo?: Date;
}

interface FilteredTradesResponse {
  trades: any[];
  pagination: PaginationMeta;
}

export const useFilteredTrades = (
  filters: Partial<TradeFilterOptions> = {},
  paginationParams: PaginationParams = { page: 1, pageSize: 15 },
  sortColumns: any[] = []
) => {
  const [activeFilterCount, setActiveFilterCount] = useState<number>(0);
  const [noResultsFound, setNoResultsFound] = useState<boolean>(false);
  
  // Count active filters
  useEffect(() => {
    let count = 0;
    
    // Text filters
    if (filters.tradeReference) count++;
    
    // Array filters
    Object.entries(filters).forEach(([key, filterValues]) => {
      if (Array.isArray(filterValues) && filterValues.length > 0) {
        count++;
      }
    });
    
    // Date range filters (count each range as one filter)
    const dateRanges = [
      { from: filters.loadingPeriodStartFrom, to: filters.loadingPeriodStartTo },
      { from: filters.loadingPeriodEndFrom, to: filters.loadingPeriodEndTo },
      { from: filters.pricingPeriodStartFrom, to: filters.pricingPeriodStartTo },
      { from: filters.pricingPeriodEndFrom, to: filters.pricingPeriodEndTo },
    ];
    
    dateRanges.forEach(range => {
      if (range.from || range.to) count++;
    });
    
    setActiveFilterCount(count);
  }, [filters]);

  // Convert filters to API format
  const prepareFiltersForApi = () => {
    const apiFilters: Record<string, any> = {};
    
    // Text filters
    if (filters.tradeReference) {
      apiFilters.tradeReference = filters.tradeReference;
    }
    
    // Array filters
    if (filters.buySell && filters.buySell.length > 0) {
      apiFilters.buySell = filters.buySell;
    }
    
    if (filters.product && filters.product.length > 0) {
      apiFilters.product = filters.product;
    }
    
    if (filters.sustainability && filters.sustainability.length > 0) {
      apiFilters.sustainability = filters.sustainability;
    }
    
    if (filters.incoTerm && filters.incoTerm.length > 0) {
      apiFilters.incoTerm = filters.incoTerm;
    }
    
    if (filters.creditStatus && filters.creditStatus.length > 0) {
      apiFilters.creditStatus = filters.creditStatus;
    }
    
    if (filters.customsStatus && filters.customsStatus.length > 0) {
      apiFilters.customsStatus = filters.customsStatus;
    }
    
    if (filters.contractStatus && filters.contractStatus.length > 0) {
      apiFilters.contractStatus = filters.contractStatus;
    }
    
    if (filters.pricingType && filters.pricingType.length > 0) {
      apiFilters.pricingType = filters.pricingType;
    }

    // Date range filters
    if (filters.loadingPeriodStartFrom) {
      apiFilters.loadingPeriodStartFrom = filters.loadingPeriodStartFrom.toISOString().split('T')[0];
    }
    if (filters.loadingPeriodStartTo) {
      apiFilters.loadingPeriodStartTo = filters.loadingPeriodStartTo.toISOString().split('T')[0];
    }
    if (filters.loadingPeriodEndFrom) {
      apiFilters.loadingPeriodEndFrom = filters.loadingPeriodEndFrom.toISOString().split('T')[0];
    }
    if (filters.loadingPeriodEndTo) {
      apiFilters.loadingPeriodEndTo = filters.loadingPeriodEndTo.toISOString().split('T')[0];
    }
    if (filters.pricingPeriodStartFrom) {
      apiFilters.pricingPeriodStartFrom = filters.pricingPeriodStartFrom.toISOString().split('T')[0];
    }
    if (filters.pricingPeriodStartTo) {
      apiFilters.pricingPeriodStartTo = filters.pricingPeriodStartTo.toISOString().split('T')[0];
    }
    if (filters.pricingPeriodEndFrom) {
      apiFilters.pricingPeriodEndFrom = filters.pricingPeriodEndFrom.toISOString().split('T')[0];
    }
    if (filters.pricingPeriodEndTo) {
      apiFilters.pricingPeriodEndTo = filters.pricingPeriodEndTo.toISOString().split('T')[0];
    }

    return apiFilters;
  };
  
  // Format the sort columns for the API
  const prepareSortConfig = () => {
    return sortColumns.map(sc => ({
      column: sc.column,
      direction: sc.direction
    }));
  };

  // Fetch filtered trades from the database
  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['filteredTrades', filters, paginationParams, sortColumns],
    queryFn: async () => {
      try {
        console.log('[TRADES] Fetching filtered trades with:', {
          filters: prepareFiltersForApi(),
          page: paginationParams.page,
          pageSize: paginationParams.pageSize,
          sortColumns: prepareSortConfig()
        });
        
        // Call the filter_trade_legs RPC function
        const { data: responseData, error } = await supabase.rpc('filter_trade_legs', {
          p_filters: prepareFiltersForApi(),
          p_page: paginationParams.page,
          p_page_size: paginationParams.pageSize,
          p_sort_columns: prepareSortConfig()
        });
        
        if (error) {
          console.error('[TRADES] Error fetching filtered trades:', error);
          throw error;
        }

        // Safely convert the JSON response to our expected type
        const typedResponse = responseData as unknown as FilteredTradesResponse;
        
        // Validate the response structure
        if (!typedResponse || !typedResponse.trades || !typedResponse.pagination) {
          console.error('[FILTERED TRADES] Invalid response format:', responseData);
          return { 
            trades: [], 
            pagination: { 
              totalItems: 0, 
              totalPages: 1, 
              currentPage: paginationParams.page, 
              pageSize: paginationParams.pageSize 
            } 
          };
        }
        
        // Check if no results were found
        setNoResultsFound(typedResponse.trades.length === 0 && activeFilterCount > 0);

        // Transform the data for the frontend (group by parent trade)
        const tradeLegsMap = new Map<string, any[]>();
        
        typedResponse.trades.forEach((leg: any) => {
          if (!tradeLegsMap.has(leg.parent_trade_id)) {
            tradeLegsMap.set(leg.parent_trade_id, []);
          }
          tradeLegsMap.get(leg.parent_trade_id)!.push({
            id: leg.id,
            parentTradeId: leg.parent_trade_id,
            legReference: leg.leg_reference,
            buySell: leg.buy_sell,
            product: leg.product,
            sustainability: leg.sustainability,
            incoTerm: leg.inco_term,
            quantity: leg.quantity,
            tolerance: leg.tolerance,
            loadingPeriodStart: new Date(leg.loading_period_start),
            loadingPeriodEnd: new Date(leg.loading_period_end),
            pricingPeriodStart: new Date(leg.pricing_period_start),
            pricingPeriodEnd: new Date(leg.pricing_period_end),
            unit: leg.unit,
            paymentTerm: leg.payment_term,
            creditStatus: leg.credit_status,
            customsStatus: leg.customs_status,
            formula: leg.pricing_formula,
            mtmFormula: leg.mtm_formula,
            pricingType: leg.pricing_type,
            efpPremium: leg.efp_premium,
            efpAgreedStatus: leg.efp_agreed_status,
            efpFixedValue: leg.efp_fixed_value,
            efpDesignatedMonth: leg.efp_designated_month,
            mtmFutureMonth: leg.mtm_future_month,
            contractStatus: leg.contract_status,
            comments: leg.comments,
            // Store parent trade data for later use
            parentTradeReference: leg.parent_trade_reference,
            counterparty: leg.counterparty
          });
        });

        // Convert to PhysicalTrade objects using the correct data from joined tables
        const transformedTrades = Array.from(tradeLegsMap.entries()).map(([parentTradeId, legs]) => {
          const firstLeg = legs[0];
          return {
            id: parentTradeId,
            tradeReference: firstLeg.parentTradeReference, // Use the full trade reference from parent_trades
            tradeType: 'physical' as const,
            physicalType: 'spot' as const, // Default for now
            counterparty: firstLeg.counterparty, // Use the actual counterparty from parent_trades
            createdAt: new Date(),
            updatedAt: new Date(),
            ...firstLeg,
            legs
          } as PhysicalTrade;
        });
        
        return { 
          trades: transformedTrades, 
          pagination: typedResponse.pagination 
        };
      } catch (error: any) {
        console.error('[TRADES] Error in useFilteredTrades:', error);
        throw new Error(error.message);
      }
    },
  });

  return {
    trades: data?.trades || [],
    pagination: data?.pagination,
    loading: isLoading,
    error,
    refetchTrades: refetch,
    activeFilterCount,
    noResultsFound
  };
};
