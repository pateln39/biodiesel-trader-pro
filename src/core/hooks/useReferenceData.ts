
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Generic function to fetch reference data
const fetchReferenceData = async <T extends Record<string, any>>(
  tableName: string,
  sortField: keyof T = 'name' as keyof T
): Promise<T[]> => {
  try {
    let query = supabase
      .from(tableName)
      .select('*');
      
    if (sortField) {
      query = query.order(sortField as string, { ascending: true });
    }
      
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Error fetching ${tableName}: ${error.message}`);
    }
    
    return data || [];
  } catch (error: any) {
    console.error(`Error in fetchReferenceData for ${tableName}:`, error);
    throw new Error(error.message);
  }
};

// Hook to fetch counterparties
export const useCounterparties = () => {
  return useQuery({
    queryKey: ['counterparties'],
    queryFn: () => fetchReferenceData('counterparties'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to fetch products
export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => fetchReferenceData('products'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to fetch sustainability options
export const useSustainability = () => {
  return useQuery({
    queryKey: ['sustainability'],
    queryFn: () => fetchReferenceData('sustainability'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to fetch inco terms
export const useIncoTerms = () => {
  return useQuery({
    queryKey: ['incoTerms'],
    queryFn: () => fetchReferenceData('inco_terms'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to fetch payment terms
export const usePaymentTerms = () => {
  return useQuery({
    queryKey: ['paymentTerms'],
    queryFn: () => fetchReferenceData('payment_terms'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to fetch credit status options
export const useCreditStatus = () => {
  return useQuery({
    queryKey: ['creditStatus'],
    queryFn: () => fetchReferenceData('credit_status'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to fetch pricing instruments
export const usePricingInstruments = () => {
  return useQuery({
    queryKey: ['pricingInstruments'],
    queryFn: () => fetchReferenceData('pricing_instruments'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to fetch brokers
export const useBrokers = () => {
  return useQuery({
    queryKey: ['brokers'],
    queryFn: () => fetchReferenceData('brokers'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to fetch paper trade products
export const usePaperTradeProducts = () => {
  return useQuery({
    queryKey: ['paperTradeProducts'],
    queryFn: () => fetchReferenceData('paper_trade_products'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to fetch trading periods
export const useTradingPeriods = () => {
  return useQuery({
    queryKey: ['tradingPeriods'],
    queryFn: () => fetchReferenceData('trading_periods'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Combined hook for reference data
export const useReferenceData = () => {
  const counterparties = useCounterparties();
  const products = useProducts();
  const sustainability = useSustainability();
  const incoTerms = useIncoTerms();
  const paymentTerms = usePaymentTerms();
  const creditStatus = useCreditStatus();
  const pricingInstruments = usePricingInstruments();
  const brokers = useBrokers();
  const paperTradeProducts = usePaperTradeProducts();
  const tradingPeriods = useTradingPeriods();
  
  const isLoading = 
    counterparties.isLoading || 
    products.isLoading || 
    sustainability.isLoading || 
    incoTerms.isLoading || 
    paymentTerms.isLoading || 
    creditStatus.isLoading || 
    pricingInstruments.isLoading || 
    brokers.isLoading || 
    paperTradeProducts.isLoading || 
    tradingPeriods.isLoading;
    
  return {
    counterparties: counterparties.data || [],
    products: products.data || [],
    sustainability: sustainability.data || [],
    incoTerms: incoTerms.data || [],
    paymentTerms: paymentTerms.data || [],
    creditStatus: creditStatus.data || [],
    pricingInstruments: pricingInstruments.data || [],
    brokers: brokers.data || [],
    paperTradeProducts: paperTradeProducts.data || [],
    tradingPeriods: tradingPeriods.data || [],
    isLoading,
    error: 
      counterparties.error || 
      products.error || 
      sustainability.error || 
      incoTerms.error || 
      paymentTerms.error || 
      creditStatus.error || 
      pricingInstruments.error || 
      brokers.error || 
      paperTradeProducts.error || 
      tradingPeriods.error
  };
};
