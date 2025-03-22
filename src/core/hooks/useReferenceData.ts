
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Define valid table names to satisfy TypeScript
type ReferenceTableName = 
  'counterparties' | 
  'products' | 
  'sustainability' | 
  'inco_terms' | 
  'payment_terms' | 
  'credit_status' | 
  'pricing_instruments' | 
  'brokers' | 
  'paper_trade_products' | 
  'trading_periods';

// Generic function to fetch reference data
const fetchReferenceData = async <T extends Record<string, any>>(
  tableName: ReferenceTableName,
  sortField: keyof T = 'name' as keyof T
): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order(sortField as string, { ascending: true });
      
    if (error) {
      throw new Error(`Error fetching ${tableName}: ${error.message}`);
    }
    
    // Extract the name property from each item to return a simple string array
    // This is what most components expect for dropdowns
    // For tables with a different naming convention, handle specially
    if (tableName === 'pricing_instruments') {
      return (data || []).map(item => item.display_name || '');
    } else if (tableName === 'paper_trade_products') {
      return (data || []).map(item => item.product_code || '');
    } else if (tableName === 'trading_periods') {
      return (data || []).map(item => item.period_code || '');
    } else {
      return (data || []).map(item => item.name || '');
    }
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
      creditStatus.error || 
      pricingInstruments.error || 
      brokers.error || 
      paperTradeProducts.error || 
      tradingPeriods.error
  };
};
