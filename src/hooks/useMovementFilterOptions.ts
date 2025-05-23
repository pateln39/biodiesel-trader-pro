
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FilterOptions } from '@/components/operations/MovementsFilter';

interface MovementFilterOptions {
  status: string[];
  product: string[];
  buySell: string[];
  incoTerm: string[];
  sustainability: string[];
  counterparty: string[];
  creditStatus: string[];
  customsStatus: string[];
  loadport: string[];
  loadportInspector: string[];
  disport: string[];
  disportInspector: string[];
}

// This hook fetches all distinct values for movement filter options
export const useMovementFilterOptions = () => {
  return useQuery({
    queryKey: ['movementFilterOptions'],
    queryFn: async () => {
      try {
        console.log('[MOVEMENTS] Fetching all filter options');
        
        // Fetch distinct values for each filterable column, excluding Transfer and RECONCILIATION products
        const fetchDistinctValues = async (column: string): Promise<string[]> => {
          const { data, error } = await supabase
            .from('movements')
            .select(column, { count: 'exact', head: false })
            .filter('product', 'neq', 'Transfer')
            .filter('product', 'neq', 'RECONCILIATION')
            .not(column, 'is', null)
            .order(column)
            .distinct(column);
          
          if (error) {
            console.error(`[MOVEMENTS] Error fetching distinct ${column} values:`, error);
            return [];
          }
          
          return data?.map(item => item[column]) || [];
        };
        
        // Fetch all distinct values in parallel
        const [
          statusValues,
          productValues,
          buySellValues,
          incoTermValues,
          sustainabilityValues,
          counterpartyValues,
          creditStatusValues,
          customsStatusValues,
          loadportValues,
          loadportInspectorValues,
          disportValues,
          disportInspectorValues
        ] = await Promise.all([
          fetchDistinctValues('status'),
          fetchDistinctValues('product'),
          fetchDistinctValues('buy_sell'),
          fetchDistinctValues('inco_term'),
          fetchDistinctValues('sustainability'),
          fetchDistinctValues('counterparty'),
          fetchDistinctValues('credit_status'),
          fetchDistinctValues('customs_status'),
          fetchDistinctValues('loadport'),
          fetchDistinctValues('loadport_inspector'),
          fetchDistinctValues('disport'),
          fetchDistinctValues('disport_inspector')
        ]);
        
        // Return all options formatted for the UI
        const options: MovementFilterOptions = {
          status: statusValues.filter(Boolean),
          product: productValues.filter(Boolean),
          buySell: buySellValues.filter(Boolean),
          incoTerm: incoTermValues.filter(Boolean),
          sustainability: sustainabilityValues.filter(Boolean),
          counterparty: counterpartyValues.filter(Boolean),
          creditStatus: creditStatusValues.filter(Boolean),
          customsStatus: customsStatusValues.filter(Boolean),
          loadport: loadportValues.filter(Boolean),
          loadportInspector: loadportInspectorValues.filter(Boolean),
          disport: disportValues.filter(Boolean),
          disportInspector: disportInspectorValues.filter(Boolean),
        };
        
        console.log('[MOVEMENTS] Successfully fetched filter options:', {
          productCount: options.product.length,
          counterpartyCount: options.counterparty.length,
          statusCount: options.status.length
        });
        
        return options;
      } catch (error) {
        console.error('[MOVEMENTS] Error in useMovementFilterOptions:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
};
