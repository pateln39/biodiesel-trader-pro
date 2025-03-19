
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useCreateBroker = () => {
  const [newBroker, setNewBroker] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const createBroker = async () => {
    if (!newBroker.trim()) {
      toast.error('Broker name cannot be empty');
      return null;
    }
    
    setIsCreating(true);
    try {
      // Check if broker with this name already exists
      const { data: existingBrokers } = await supabase
        .from('brokers')
        .select('id, name')
        .eq('name', newBroker.trim())
        .limit(1);
        
      if (existingBrokers && existingBrokers.length > 0) {
        toast.warning(`Broker "${newBroker}" already exists`);
        return existingBrokers[0];
      }
      
      // Insert new broker
      const { data, error } = await supabase
        .from('brokers')
        .insert({ name: newBroker.trim(), is_active: true })
        .select()
        .single();
        
      if (error) throw error;
      
      toast.success(`Broker "${newBroker}" created successfully`);
      setNewBroker('');
      return data;
    } catch (err: any) {
      console.error('Error creating broker:', err);
      toast.error(`Failed to create broker: ${err.message}`);
      return null;
    } finally {
      setIsCreating(false);
    }
  };
  
  return { newBroker, setNewBroker, createBroker, isCreating };
};
