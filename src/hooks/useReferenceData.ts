
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PRODUCT_COLORS } from '@/hooks/useInventoryState';

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

  // New function to fetch products with their colors
  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('name, color_class')
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return data;
  };
  
  // Create a type for the product insert parameters
  type ProductInsertParams = {
    productName: string;
    colorName?: string;
  };

  // Function to add a new product with color saved directly to the database
  const addProductFn = async ({ productName, colorName }: ProductInsertParams) => {
    try {
      let colorClass = null;
      
      // If color is provided, convert it to the appropriate class string
      if (colorName) {
        const { data: colorData, error: colorError } = await supabase
          .rpc('insert_product', { 
            product_name: productName, 
            color_class_value: getColorClassFromName(colorName)
          });
        
        if (colorError) throw colorError;
      } else {
        // No color provided
        const { data, error } = await supabase
          .rpc('insert_product', { product_name: productName });
        
        if (error) throw error;
      }
      
      // Invalidate products query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['products'] });
      
      toast.success('Product added successfully');
      return productName;
    } catch (error: any) {
      toast.error('Failed to add product', {
        description: error.message
      });
      throw error;
    }
  };
  
  // Function to update a product's color
  const updateProductColorFn = async ({ productName, colorName }: ProductInsertParams) => {
    try {
      if (!colorName) {
        throw new Error("Color name is required");
      }
      
      const colorClass = getColorClassFromName(colorName);
      
      const { error } = await supabase
        .rpc('update_product_color', { 
          product_name: productName, 
          color_class_value: colorClass
        });
      
      if (error) throw error;
      
      // Invalidate products query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['products'] });
      
      toast.success(`Color updated for ${productName}`);
      return productName;
    } catch (error: any) {
      toast.error('Failed to update product color', {
        description: error.message
      });
      throw error;
    }
  };
  
  // Helper function to convert color name to class strings
  const getColorClassFromName = (colorName: string): string => {
    const COLOR_OPTIONS = [
      { name: 'Red', class: 'bg-red-500', textClass: 'text-white' },
      { name: 'Blue', class: 'bg-blue-500', textClass: 'text-white' },
      { name: 'Green', class: 'bg-green-500', textClass: 'text-white' },
      { name: 'Yellow', class: 'bg-yellow-500', textClass: 'text-black' },
      { name: 'Purple', class: 'bg-purple-500', textClass: 'text-white' },
      { name: 'Pink', class: 'bg-pink-500', textClass: 'text-white' },
      { name: 'Indigo', class: 'bg-indigo-500', textClass: 'text-white' },
      { name: 'Teal', class: 'bg-teal-500', textClass: 'text-white' },
      { name: 'Orange', class: 'bg-orange-500', textClass: 'text-white' },
      { name: 'Lime', class: 'bg-lime-500', textClass: 'text-black' },
      { name: 'Amber', class: 'bg-amber-500', textClass: 'text-black' },
      { name: 'Emerald', class: 'bg-emerald-500', textClass: 'text-white' },
      { name: 'Cyan', class: 'bg-cyan-500', textClass: 'text-white' },
      { name: 'Sky', class: 'bg-sky-500', textClass: 'text-white' },
      { name: 'Violet', class: 'bg-violet-500', textClass: 'text-white' },
      { name: 'Fuchsia', class: 'bg-fuchsia-500', textClass: 'text-white' },
      { name: 'Rose', class: 'bg-rose-500', textClass: 'text-white' },
      { name: 'Gray', class: 'bg-gray-500', textClass: 'text-white' },
      { name: 'Slate', class: 'bg-slate-500', textClass: 'text-white' },
      { name: 'Zinc', class: 'bg-zinc-500', textClass: 'text-white' }
    ];
    
    const colorOption = COLOR_OPTIONS.find(c => c.name === colorName);
    return colorOption ? `${colorOption.class} ${colorOption.textClass}` : 'bg-gray-500 text-white';
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

  // New function to add a new sustainability
  const addSustainability = async (sustainabilityName: string) => {
    try {
      const { data, error } = await supabase.rpc('insert_sustainability', { sustainability_name: sustainabilityName });
      
      if (error) throw error;
      
      // Invalidate sustainability query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['sustainability'] });
      
      toast.success('Sustainability added successfully');
      return data;
    } catch (error: any) {
      toast.error('Failed to add sustainability', {
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
  
  // New query for products with colors
  const { data: productData = [] } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts
  });
  
  // Extract just the product names for backward compatibility
  const productOptions = productData.map(item => item.name);
  
  // Extract product colors map for using in components
  const productColors = productData.reduce((acc, item) => {
    if (item.color_class) {
      acc[item.name] = item.color_class;
    }
    return acc;
  }, {} as Record<string, string>);
  
  // Mutations
  const addProductMutation = useMutation({
    mutationFn: addProductFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });
  
  const updateProductColorMutation = useMutation({
    mutationFn: updateProductColorFn,
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

  // New mutation for sustainability
  const addSustainabilityMutation = useMutation({
    mutationFn: addSustainability,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sustainability'] });
    }
  });

  return {
    counterparties,
    sustainabilityOptions,
    creditStatusOptions,
    customsStatusOptions,
    productOptions,
    productColors,
    productData,
    addProduct: (productName: string, colorName?: string) => 
      addProductMutation.mutate({ productName, colorName }),
    updateProductColor: (productName: string, colorName: string) =>
      updateProductColorMutation.mutate({ productName, colorName }),
    addCounterparty: addCounterpartyMutation.mutate,
    addSustainability: addSustainabilityMutation.mutate,
    isAddingProduct: addProductMutation.isPending,
    isAddingCounterparty: addCounterpartyMutation.isPending,
    isAddingSustainability: addSustainabilityMutation.isPending,
    isUpdatingProductColor: updateProductColorMutation.isPending
  };
};
