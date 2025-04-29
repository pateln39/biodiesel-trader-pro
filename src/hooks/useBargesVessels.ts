
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BargeVessel {
  id: string;
  name: string;
  deadweight: number;
  imo_number: string;
  type: string | null;
  owners: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useBargesVessels() {
  const [barges, setBarges] = useState<BargeVessel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBarges = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('barges_vessels')
        .select('*')
        .order('name');
      
      if (error) {
        throw new Error(error.message);
      }
      
      setBarges(data || []);
    } catch (err) {
      console.error('Error fetching barges/vessels:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      toast.error('Failed to load barges/vessels data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBarges();
  }, []);

  const getBarge = (bargeId: string): BargeVessel | undefined => {
    return barges.find(barge => barge.id === bargeId);
  };

  const getBargeByName = (bargeName: string): BargeVessel | undefined => {
    return barges.find(barge => barge.name === bargeName);
  };

  return {
    barges,
    loading,
    error,
    fetchBarges,
    getBarge,
    getBargeByName,
  };
}
