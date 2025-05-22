
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useReferenceData = () => {
  const queryClient = useQueryClient();

  const fetchCounterparties = async () => {
    const { data, error } = await supabase
      .from('counterparties')
      .select('name')
      .order('name');
    
    if (error) throw error;
    return data.map(item => item.name);
  };

  const fetchSustainability = async () => {
    const { data, error } = await supabase
      .from('sustainability')
      .select('name')
      .order('name');
    
    if (error) throw error;
    return data.map(item => item.name);
  };

  const fetchCreditStatus = async () => {
    const { data, error } = await supabase
      .from('credit_status')
      .select('name')
      .order('name');
    
    if (error) throw error;
    return data.map(item => item.name);
  };

  const fetchCustomsStatus = async () => {
    const { data, error } = await supabase
      .from('customs_status')
      .select('name')
      .order('name');
    
    if (error) throw error;
    return data.map(item => item.name);
  };

  // Function to fetch products from the database
  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('name')
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return data.map(item => item.name);
  };
  
  // Function to fetch inco terms from the database
  const fetchIncoTerms = async () => {
    const { data, error } = await supabase
      .from('inco_terms')
      .select('name')
      .order('name');
    
    if (error) throw error;
    return data.map(item => item.name);
  };

  // Function to fetch product colors from the database
  const fetchProductColors = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('name, color_class')
      .eq('is_active', true);
    
    if (error) throw error;
    
    // Convert to a mapping object
    const colorMapping: Record<string, string> = {};
    data.forEach(product => {
      if (product.color_class) {
        colorMapping[product.name] = product.color_class;
      }
    });
    
    return colorMapping;
  };

  const { data: counterparties = [], isLoading: isLoadingCounterparties } = useQuery({
    queryKey: ['counterparties'],
    queryFn: fetchCounterparties
  });

  const { data: sustainabilityOptions = [], isLoading: isLoadingSustainability } = useQuery({
    queryKey: ['sustainability'],
    queryFn: fetchSustainability
  });

  const { data: creditStatusOptions = [], isLoading: isLoadingCreditStatus } = useQuery({
    queryKey: ['creditStatus'],
    queryFn: fetchCreditStatus
  });

  const { data: customsStatusOptions = [], isLoading: isLoadingCustomsStatus } = useQuery({
    queryKey: ['customsStatus'],
    queryFn: fetchCustomsStatus
  });

  // Query to fetch product options
  const { data: productOptions = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts
  });
  
  // Query to fetch inco terms options
  const { data: incoTermOptions = [], isLoading: isLoadingIncoTerms } = useQuery({
    queryKey: ['incoTerms'],
    queryFn: fetchIncoTerms
  });
  
  // Query to fetch product colors
  const { data: productColors = {}, isLoading: isLoadingProductColors } = useQuery({
    queryKey: ['productColors'],
    queryFn: fetchProductColors
  });

  // Invalidation methods
  const invalidateCounterparties = () => {
    queryClient.invalidateQueries({ queryKey: ['counterparties'] });
  };

  const invalidateSustainability = () => {
    queryClient.invalidateQueries({ queryKey: ['sustainability'] });
  };

  const invalidateProducts = () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['productColors'] });
  };

  return {
    counterparties,
    isLoadingCounterparties,
    sustainabilityOptions,
    isLoadingSustainability,
    creditStatusOptions,
    isLoadingCreditStatus,
    customsStatusOptions,
    isLoadingCustomsStatus,
    productOptions,
    isLoadingProducts,
    incoTermOptions,
    isLoadingIncoTerms,
    productColors,
    isLoadingProductColors,
    invalidateCounterparties,
    invalidateSustainability,
    invalidateProducts
  };
};
