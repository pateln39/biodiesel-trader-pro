
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Terminal {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

export interface Tank {
  id: string;
  terminal_id: string;
  tank_number: string;
  current_product: string;
  capacity_mt: number;
  capacity_m3: number;
  spec: string | null;
  is_heating_enabled: boolean;
  display_order: number | null;
}

export const useTerminals = () => {
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTerminals = async () => {
    try {
      const { data: terminalsData, error: terminalsError } = await supabase
        .from('terminals')
        .select('*')
        .order('name');

      if (terminalsError) throw terminalsError;

      const { data: tanksData, error: tanksError } = await supabase
        .from('tanks')
        .select('*')
        .order('display_order');

      if (tanksError) throw tanksError;

      setTerminals(terminalsData);
      setTanks(tanksData);
      setError(null);
    } catch (err) {
      console.error('[TERMINALS] Error fetching terminals:', err);
      setError('Failed to load terminals and tanks');
    } finally {
      setLoading(false);
    }
  };

  const addTerminal = async (name: string, description?: string) => {
    try {
      const { data, error } = await supabase
        .from('terminals')
        .insert([{ name, description }])
        .select()
        .single();

      if (error) throw error;
      setTerminals(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error('[TERMINALS] Error adding terminal:', err);
      throw err;
    }
  };

  const addTank = async (terminalId: string, tankData: Omit<Tank, 'id' | 'terminal_id'>) => {
    try {
      // Calculate capacity_m3 based on capacity_mt
      const capacity_m3 = tankData.capacity_mt * 1.1; // Approximate conversion
      
      const { data, error } = await supabase
        .from('tanks')
        .insert([{ 
          ...tankData, 
          terminal_id: terminalId,
          capacity_m3
        }])
        .select()
        .single();

      if (error) throw error;
      setTanks(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error('[TERMINALS] Error adding tank:', err);
      throw err;
    }
  };

  const updateTank = async (tankId: string, updates: Partial<Tank>) => {
    try {
      const { data, error } = await supabase
        .from('tanks')
        .update(updates)
        .eq('id', tankId)
        .select()
        .single();

      if (error) throw error;
      setTanks(prev => prev.map(tank => tank.id === tankId ? data : tank));
      return data;
    } catch (err) {
      console.error('[TERMINALS] Error updating tank:', err);
      throw err;
    }
  };

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel('terminals-tanks-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'terminals' 
      }, () => {
        fetchTerminals();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'tanks' 
      }, () => {
        fetchTerminals();
      })
      .subscribe();

    fetchTerminals();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    terminals,
    tanks,
    loading,
    error,
    addTerminal,
    addTank,
    updateTank,
    refetch: fetchTerminals
  };
};
