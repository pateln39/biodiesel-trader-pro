
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TankMovement {
  id: string;
  movement_id: string | null;
  tank_id: string;
  quantity_mt: number;
  quantity_m3: number;
  product_at_time: string;
  balance_mt: number;
  balance_m3: number;
  movement_date: string;
}

interface Movement {
  id: string;
  terminal_id: string | null;
  inventory_movement_date: string | null;
  trade_reference: string;
  counterparty: string;
  product: string;
  sustainability: string | null;
  scheduled_quantity: number;
  actual_quantity: number | null;
  status: string;
}

export const useTankMovements = (terminalId: string) => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [tankMovements, setTankMovements] = useState<TankMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMovements = async () => {
    try {
      // Fetch movements for this terminal
      const { data: movementsData, error: movementsError } = await supabase
        .from('movements')
        .select('*')
        .eq('terminal_id', terminalId)
        .order('inventory_movement_date', { ascending: true });

      if (movementsError) throw movementsError;

      // Fetch tank movements for this terminal's movements
      const { data: tankMovementsData, error: tankMovementsError } = await supabase
        .from('tank_movements')
        .select(`
          *,
          tank:tanks(*)
        `)
        .eq('tank:tanks.terminal_id', terminalId)
        .order('movement_date', { ascending: true });

      if (tankMovementsError) throw tankMovementsError;

      setMovements(movementsData);
      setTankMovements(tankMovementsData);
      setError(null);
    } catch (err) {
      console.error('[TANK_MOVEMENTS] Error fetching movements:', err);
      setError('Failed to load movements data');
    } finally {
      setLoading(false);
    }
  };

  const addTankMovement = async (
    movementId: string, 
    tankId: string, 
    quantityMT: number,
    productAtTime: string,
    balanceMT: number
  ) => {
    try {
      const quantityM3 = quantityMT * 1.1; // Approximate conversion
      const balanceM3 = balanceMT * 1.1; // Approximate conversion

      const { data, error } = await supabase
        .from('tank_movements')
        .insert([{
          movement_id: movementId,
          tank_id: tankId,
          quantity_mt: quantityMT,
          quantity_m3: quantityM3,
          product_at_time: productAtTime,
          balance_mt: balanceMT,
          balance_m3: balanceM3
        }])
        .select()
        .single();

      if (error) throw error;
      
      setTankMovements(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error('[TANK_MOVEMENTS] Error adding tank movement:', err);
      throw err;
    }
  };

  const updateTankMovement = async (
    id: string,
    updates: Partial<TankMovement>
  ) => {
    try {
      const { data, error } = await supabase
        .from('tank_movements')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setTankMovements(prev => prev.map(tm => tm.id === id ? data : tm));
      return data;
    } catch (err) {
      console.error('[TANK_MOVEMENTS] Error updating tank movement:', err);
      throw err;
    }
  };

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel('tank-movements-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'tank_movements' 
      }, () => {
        fetchMovements();
      })
      .subscribe();

    fetchMovements();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [terminalId]);

  return {
    movements,
    tankMovements,
    loading,
    error,
    addTankMovement,
    updateTankMovement,
    refetch: fetchMovements
  };
};
