
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

  const { data: counterparties = [] } = useQuery({
    queryKey: ['counterparties'],
    queryFn: fetchCounterparties
  });

  const { data: sustainabilityOptions = [] } = useQuery({
    queryKey: ['sustainability'],
    queryFn: fetchSustainability
  });

  const { data: creditStatusOptions = [] } = useQuery({
    queryKey: ['creditStatus'],
    queryFn: fetchCreditStatus
  });

  const { data: customsStatusOptions = [] } = useQuery({
    queryKey: ['customsStatus'],
    queryFn: fetchCustomsStatus
  });

  // Query to fetch product options
  const { data: productOptions = [] } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts
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
  };

  return {
    counterparties,
    sustainabilityOptions,
    creditStatusOptions,
    customsStatusOptions,
    productOptions,
    invalidateCounterparties,
    invalidateSustainability,
    invalidateProducts
  };
};
