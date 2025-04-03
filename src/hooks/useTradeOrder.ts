
import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserPreferences } from '@/types';

export function useTradeOrder<T extends { id: string, createdAt: Date }>(
  trades: T[],
  orderType: 'physical_trade_order' | 'paper_trade_order'
) {
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [orderedTrades, setOrderedTrades] = useState<T[]>([]);
  
  // Load user preferences
  useEffect(() => {
    const fetchUserPreferences = async () => {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('id', 'default')
        .single();
      
      if (data && !error) {
        setUserPreferences(data);
      } else {
        // Create default preferences if none exist
        const { data: newData, error: createError } = await supabase
          .from('user_preferences')
          .insert({ id: 'default' })
          .select()
          .single();
          
        if (newData && !createError) {
          setUserPreferences(newData);
        }
      }
    };
    
    fetchUserPreferences();
  }, []);
  
  // Apply order to trades when preferences or trades change
  useEffect(() => {
    if (!trades.length) return setOrderedTrades([]);
    
    if (userPreferences && userPreferences[orderType]?.length) {
      // Create a map for quick lookup
      const orderMap = new Map();
      userPreferences[orderType].forEach((id: string, index: number) => {
        orderMap.set(id, index);
      });
      
      // Sort trades based on the preferences
      const ordered = [...trades].sort((a, b) => {
        const aIndex = orderMap.has(a.id) ? orderMap.get(a.id) : Infinity;
        const bIndex = orderMap.has(b.id) ? orderMap.get(b.id) : Infinity;
        
        if (aIndex === Infinity && bIndex === Infinity) {
          // Sort by date if neither is in preferences
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        
        return aIndex - bIndex;
      });
      
      setOrderedTrades(ordered);
    } else {
      // Default to creation date order
      setOrderedTrades([...trades].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    }
  }, [trades, userPreferences, orderType]);
  
  // Mutation to update preferences
  const { mutate: updatePreferences } = useMutation({
    mutationFn: async (newOrder: string[]) => {
      const updateData = {
        [orderType]: newOrder
      };
      
      const { error } = await supabase
        .from('user_preferences')
        .update(updateData)
        .eq('id', 'default');
        
      if (error) throw error;
      return newOrder;
    },
    onSuccess: () => {
      toast.success('Trade order updated', {
        description: 'Your preferred trade order has been saved'
      });
    },
    onError: (error: any) => {
      console.error('Failed to update trade order:', error);
      toast.error('Failed to save trade order');
    }
  });
  
  // Handle order change
  const handleOrderChange = (newItems: T[]) => {
    const newOrder = newItems.map(item => item.id);
    updatePreferences(newOrder);
  };
  
  return {
    orderedTrades,
    handleOrderChange
  };
}
