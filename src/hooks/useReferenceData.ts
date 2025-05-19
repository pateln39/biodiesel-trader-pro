
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
    // Query the customs_status table which was renamed from product_credit_status
    const { data, error } = await supabase
      .from('customs_status')
      .select('name')
      .order('name');
    
    if (error) throw error;
    return data.map(item => item.name);
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('name')
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return data.map(item => item.name);
  };

  const { data: counterparties = [], refetch: refetchCounterparties } = useQuery({
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

  const { data: productOptions = [], refetch: refetchProducts } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts
  });

  const addCounterparty = async (name: string) => {
    try {
      const { data, error } = await supabase.rpc('insert_counterparty', {
        counterparty_name: name
      });
      
      if (error) throw error;
      
      toast.success('Counterparty added successfully');
      refetchCounterparties();
      return data;
    } catch (error: any) {
      toast.error('Failed to add counterparty', {
        description: error.message
      });
      throw error;
    }
  };

  const addProduct = async (name: string) => {
    try {
      const { data, error } = await supabase.rpc('insert_product', {
        product_name: name
      });
      
      if (error) throw error;
      
      toast.success('Product added successfully');
      refetchProducts();
      return data;
    } catch (error: any) {
      toast.error('Failed to add product', {
        description: error.message
      });
      throw error;
    }
  };

  return {
    counterparties,
    sustainabilityOptions,
    creditStatusOptions,
    customsStatusOptions,
    productOptions,
    addCounterparty,
    addProduct,
    refetchCounterparties,
    refetchProducts
  };
};
