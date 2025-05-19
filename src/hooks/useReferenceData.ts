
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

  // New function to fetch products
  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('name')
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return data.map(item => item.name);
  };
  
  // Function to add a new product
  const addProduct = async (productName: string) => {
    try {
      const { data, error } = await supabase.rpc('insert_product', { product_name: productName });
      
      if (error) throw error;
      
      // Invalidate products query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['products'] });
      
      toast.success('Product added successfully');
      return data;
    } catch (error: any) {
      toast.error('Failed to add product', {
        description: error.message
      });
      throw error;
    }
  };
  
  // Function to add a new counterparty
  const addCounterparty = async (counterpartyName: string) => {
    try {
      const { data, error } = await supabase.rpc('insert_counterparty', { counterparty_name: counterpartyName });
      
      if (error) throw error;
      
      // Invalidate counterparties query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['counterparties'] });
      
      toast.success('Counterparty added successfully');
      return data;
    } catch (error: any) {
      toast.error('Failed to add counterparty', {
        description: error.message
      });
      throw error;
    }
  };

  // Queries
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
  
  // New query for products
  const { data: productOptions = [] } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts
  });
  
  // Mutations
  const addProductMutation = useMutation({
    mutationFn: addProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });
  
  const addCounterpartyMutation = useMutation({
    mutationFn: addCounterparty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counterparties'] });
    }
  });

  return {
    counterparties,
    sustainabilityOptions,
    creditStatusOptions,
    customsStatusOptions,
    productOptions,
    addProduct: addProductMutation.mutate,
    addCounterparty: addCounterpartyMutation.mutate,
    isAddingProduct: addProductMutation.isPending,
    isAddingCounterparty: addCounterpartyMutation.isPending
  };
};
