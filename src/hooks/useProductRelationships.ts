
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProductRelationship {
  id: string;
  product: string;
  relationship_type: 'DIFF' | 'SPREAD' | 'FP';
  paired_product: string | null;
  default_opposite: string | null;
  created_at?: Date;
}

export const useProductRelationships = () => {
  const [productRelationships, setProductRelationships] = useState<ProductRelationship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchProductRelationships = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_relationships')
        .select('*');
        
      if (error) throw error;
      
      // Convert the response data to the correct type
      const typedData = data?.map(item => ({
        ...item,
        relationship_type: item.relationship_type as 'DIFF' | 'SPREAD' | 'FP',
        created_at: item.created_at ? new Date(item.created_at) : undefined
      })) || [];
      
      setProductRelationships(typedData);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching product relationships:', err);
      setError(err.message);
      toast.error('Failed to load product relationships');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchProductRelationships();
    
    // Set up real-time subscription for relationship changes
    const channel = supabase
      .channel('public:product_relationships')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'product_relationships' 
      }, () => {
        fetchProductRelationships();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  return { productRelationships, isLoading, error, refresh: fetchProductRelationships };
};
