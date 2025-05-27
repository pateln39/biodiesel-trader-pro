
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TradeFilterOptions {
  buySell: string[];
  product: string[];
  sustainability: string[];
  incoTerm: string[];
  creditStatus: string[];
  customsStatus: string[];
  contractStatus: string[];
  pricingType: string[];
}

export const useTradeFilterOptions = () => {
  const [options, setOptions] = useState<TradeFilterOptions>({
    buySell: [],
    product: [],
    sustainability: [],
    incoTerm: [],
    creditStatus: [],
    customsStatus: [],
    contractStatus: [],
    pricingType: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const { data, error } = await supabase
          .from('trade_legs')
          .select(`
            buy_sell,
            product,
            sustainability,
            inco_term,
            credit_status,
            customs_status,
            contract_status,
            pricing_type
          `);

        if (error) {
          console.error('Error fetching trade filter options:', error);
          return;
        }

        // Extract unique values for each filter
        const uniqueOptions: TradeFilterOptions = {
          buySell: [...new Set(data.map(item => item.buy_sell).filter(Boolean))],
          product: [...new Set(data.map(item => item.product).filter(Boolean))],
          sustainability: [...new Set(data.map(item => item.sustainability).filter(Boolean))],
          incoTerm: [...new Set(data.map(item => item.inco_term).filter(Boolean))],
          creditStatus: [...new Set(data.map(item => item.credit_status).filter(Boolean))],
          customsStatus: [...new Set(data.map(item => item.customs_status).filter(Boolean))],
          contractStatus: [...new Set(data.map(item => item.contract_status).filter(Boolean))],
          pricingType: [...new Set(data.map(item => item.pricing_type).filter(Boolean))]
        };

        setOptions(uniqueOptions);
      } catch (error) {
        console.error('Error fetching trade filter options:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFilterOptions();
  }, []);

  return { options, loading };
};
