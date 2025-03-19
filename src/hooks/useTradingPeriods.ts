
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TradingPeriod, PeriodType } from '@/types/paper';

export const useTradingPeriods = () => {
  const [periods, setPeriods] = useState<TradingPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPeriods = async () => {
      try {
        const { data, error } = await supabase
          .from('trading_periods')
          .select('*')
          .eq('is_active', true)
          .order('start_date', { ascending: true });

        if (error) {
          throw new Error(error.message);
        }

        const mappedPeriods = data.map(item => ({
          id: item.id,
          periodCode: item.period_code,
          periodType: item.period_type as PeriodType,
          startDate: new Date(item.start_date),
          endDate: new Date(item.end_date)
        }));

        setPeriods(mappedPeriods);
      } catch (err: any) {
        setError(err);
        console.error('Error fetching trading periods:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPeriods();
  }, []);

  const getMonthlyPeriods = () => {
    return periods.filter(p => p.periodType === 'MONTH');
  };

  const getQuarterlyPeriods = () => {
    return periods.filter(p => p.periodType === 'QUARTER');
  };

  const getPeriodByCode = (code: string) => {
    return periods.find(p => p.periodCode === code);
  };

  const getPeriodDates = (periodCode: string): { startDate: Date; endDate: Date } | null => {
    const period = getPeriodByCode(periodCode);
    if (!period) return null;
    
    return {
      startDate: period.startDate,
      endDate: period.endDate
    };
  };

  return {
    periods,
    isLoading,
    error,
    getMonthlyPeriods,
    getQuarterlyPeriods,
    getPeriodByCode,
    getPeriodDates
  };
};
