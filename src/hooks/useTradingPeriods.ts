
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PeriodType } from '@/types/paper';

export interface TradingPeriod {
  id: string;
  periodCode: string;
  periodType: PeriodType;
  startDate: Date;
  endDate: Date;
}

export const useTradingPeriods = () => {
  const [periods, setPeriods] = useState<TradingPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTradingPeriods = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('trading_periods')
          .select('*')
          .eq('is_active', true)
          .order('start_date', { ascending: true });
          
        if (error) {
          throw new Error(error.message);
        }
        
        const mappedPeriods = data.map(period => ({
          id: period.id,
          periodCode: period.period_code,
          periodType: period.period_type as PeriodType,
          startDate: new Date(period.start_date),
          endDate: new Date(period.end_date)
        }));
        
        setPeriods(mappedPeriods);
      } catch (err: any) {
        setError(err);
        console.error('Error fetching trading periods:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTradingPeriods();
  }, []);

  return { periods, isLoading, error };
};
