
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface OpenTradeFilterOptions {
  product: string[];
  counterparty: string[];
  incoTerm: string[];
  sustainability: string[];
  creditStatus: string[];
  customsStatus: string[];
  contractStatus: string[];
}

// This hook fetches all distinct values for open trade filter options
export const useOpenTradeFilterOptions = () => {
  return useQuery({
    queryKey: ['openTradeFilterOptions'],
    queryFn: async () => {
      try {
        console.log('[OPEN_TRADES] Fetching all filter options');
        
        // Fetch distinct values for each filterable column from open_trades
        const fetchDistinctValues = async (column: string): Promise<string[]> => {
          const { data, error } = await supabase
            .from('open_trades')
            .select(column)
            .eq('status', 'open')
            .not(column, 'is', null)
            .order(column);
          
          if (error) {
            console.error(`[OPEN_TRADES] Error fetching distinct ${column} values:`, error);
            return [];
          }
          
          // Extract unique values from the results
          const uniqueValues = Array.from(new Set(data.map(item => item[column])));
          return uniqueValues.filter(Boolean);
        };
        
        // Fetch all distinct values in parallel
        const [
          productValues,
          counterpartyValues,
          incoTermValues,
          sustainabilityValues,
          creditStatusValues,
          customsStatusValues,
          contractStatusValues
        ] = await Promise.all([
          fetchDistinctValues('product'),
          fetchDistinctValues('counterparty'),
          fetchDistinctValues('inco_term'),
          fetchDistinctValues('sustainability'),
          fetchDistinctValues('credit_status'),
          fetchDistinctValues('customs_status'),
          fetchDistinctValues('contract_status')
        ]);
        
        // Return all options formatted for the UI
        const options: OpenTradeFilterOptions = {
          product: productValues,
          counterparty: counterpartyValues,
          incoTerm: incoTermValues,
          sustainability: sustainabilityValues,
          creditStatus: creditStatusValues,
          customsStatus: customsStatusValues,
          contractStatus: contractStatusValues,
        };
        
        console.log('[OPEN_TRADES] Successfully fetched filter options:', {
          productCount: options.product.length,
          counterpartyCount: options.counterparty.length,
          creditStatusCount: options.creditStatus.length
        });
        
        return options;
      } catch (error) {
        console.error('[OPEN_TRADES] Error in useOpenTradeFilterOptions:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
};
