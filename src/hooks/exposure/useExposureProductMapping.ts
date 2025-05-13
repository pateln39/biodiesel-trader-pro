
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mapProductToCanonical } from '@/utils/productMapping';
// Import PricingInstrument from types/index which re-exports it from the correct module
// instead of from types/exposure which no longer has this type
import { PricingInstrument } from '@/types';

export const useExposureProductMapping = () => {
  // Fetch pricing instruments
  const {
    data: pricingInstruments = [],
    isLoading: instrumentsLoading
  } = useQuery({
    queryKey: ['pricing-instruments'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase
        .from('pricing_instruments')
        .select('id, display_name, instrument_code, is_active')
        .eq('is_active', true);
        
      if (error) throw error;
      return data || [];
    }
  });

  // Calculate allowed products based on pricing instruments
  const allowedProducts = useMemo(() => {
    const instrumentProducts = pricingInstruments.map(
      (inst: PricingInstrument) => mapProductToCanonical(inst.display_name)
    );
    const biodieselProducts = ['Argus UCOME', 'Argus FAME0', 'Argus RME', 'Argus HVO'];
    return Array.from(new Set([...instrumentProducts, ...biodieselProducts]));
  }, [pricingInstruments]);

  // Calculate biodiesel and pricing instrument products
  const biodieselProducts = useMemo(() => {
    return allowedProducts.filter(p => p.includes('Argus'));
  }, [allowedProducts]);

  const pricingInstrumentProducts = useMemo(() => {
    return allowedProducts.filter(p => !p.includes('Argus'));
  }, [allowedProducts]);

  // Get all products for selection (sorted)
  const allProducts = useMemo(() => {
    return [...allowedProducts].sort();
  }, [allowedProducts]);

  return {
    pricingInstruments,
    instrumentsLoading,
    allowedProducts,
    biodieselProducts,
    pricingInstrumentProducts,
    allProducts
  };
};
