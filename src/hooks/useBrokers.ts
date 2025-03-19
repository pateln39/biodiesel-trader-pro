
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Broker {
  id: string;
  name: string;
  is_active: boolean;
}

export const useBrokers = () => {
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchBrokers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('brokers')
        .select('*')
        .eq('is_active', true)
        .order('name');
        
      if (error) throw error;
      
      setBrokers(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching brokers:', err);
      setError(err.message);
      toast.error('Failed to load brokers');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchBrokers();
    
    // Set up real-time subscription for broker changes
    const channel = supabase
      .channel('public:brokers')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'brokers' 
      }, () => {
        fetchBrokers();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  return { brokers, isLoading, error, refresh: fetchBrokers };
};
