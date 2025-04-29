
import React, { useState, useEffect } from 'react';
import { Movement } from '@/types';
import { DemurrageCalculator } from './calculator/DemurrageCalculator';
import { supabase } from '@/integrations/supabase/client';

interface DemurrageCalculatorDialogProps {
  movement: Movement;
  onClose: () => void;
}

const DemurrageCalculatorDialog: React.FC<DemurrageCalculatorDialogProps> = ({ movement, onClose }) => {
  const [calculationId, setCalculationId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkExistingCalculation = async () => {
      try {
        setLoading(true);
        // Check if there's an existing calculation for this movement
        const { data, error } = await supabase
          .from('demurrage_calculations')
          .select('id')
          .eq('movement_id', movement.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          setCalculationId(data[0].id);
        }
      } catch (error) {
        console.error('Error checking for existing demurrage calculations:', error);
      } finally {
        setLoading(false);
      }
    };

    checkExistingCalculation();
  }, [movement.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <DemurrageCalculator 
    movement={movement} 
    onClose={onClose} 
    calculationId={calculationId}
  />;
};

export default DemurrageCalculatorDialog;
