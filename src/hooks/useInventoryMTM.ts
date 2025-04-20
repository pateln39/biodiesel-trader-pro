
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface MTMData {
  month: string;
  product: string;
  total_quantity: number;
}

interface TankMovement {
  movement_date: string;
  product_at_time: string;
  quantity_mt: number;
}

const fetchTankMovements = async (): Promise<TankMovement[]> => {
  const { data, error } = await supabase
    .from('tank_movements')
    .select('movement_date, product_at_time, quantity_mt')
    .order('movement_date', { ascending: true });

  if (error) throw error;
  return data;
};

const aggregateByMonthAndProduct = (data: TankMovement[]) => {
  const aggregated = new Map<string, Map<string, number>>();

  data.forEach(movement => {
    const month = format(new Date(movement.movement_date), 'MMM-yy').toUpperCase();
    const product = movement.product_at_time;
    const quantity = movement.quantity_mt;

    if (!aggregated.has(month)) {
      aggregated.set(month, new Map<string, number>());
    }
    const monthData = aggregated.get(month)!;
    monthData.set(product, (monthData.get(product) || 0) + quantity);
  });

  return aggregated;
};

const formatNumber = (value: number): string => {
  if (value === 0) return '-';
  const roundedValue = Math.round(value);
  const formattedValue = new Intl.NumberFormat('en-US').format(roundedValue);
  return value > 0 ? `+${formattedValue}` : formattedValue;
};

export const useInventoryMTM = () => {
  const { data: tankMovements, isLoading } = useQuery({
    queryKey: ['tank_movements'],
    queryFn: fetchTankMovements,
  });

  const aggregatedData = tankMovements ? aggregateByMonthAndProduct(tankMovements) : new Map<string, Map<string, number>>();

  const calculateCellValue = (month: string, product: string): { value: string; color: string } => {
    const monthData = aggregatedData.get(month);
    if (!monthData) return { value: '-', color: 'text-lime-500' };
    const value = monthData.get(product) || 0;
    return {
      value: formatNumber(value),
      color: value > 0 ? 'text-green-500' : value < 0 ? 'text-red-500' : 'text-lime-500'
    };
  };

  const calculateRowTotal = (month: string): { value: string; color: string } => {
    const monthData = aggregatedData.get(month);
    if (!monthData) return { value: '-', color: 'text-lime-500' };
    const total = Array.from(monthData.values()).reduce((sum, val) => sum + val, 0);
    return {
      value: formatNumber(total),
      color: total > 0 ? 'text-green-500' : total < 0 ? 'text-red-500' : 'text-lime-500'
    };
  };

  const calculateColumnTotal = (product: string): { value: string; color: string } => {
    let total = 0;
    aggregatedData.forEach(monthData => {
      total += monthData.get(product) || 0;
    });
    return {
      value: formatNumber(total),
      color: total > 0 ? 'text-green-500' : total < 0 ? 'text-red-500' : 'text-lime-500'
    };
  };

  const calculateGrandTotal = (): { value: string; color: string } => {
    let total = 0;
    aggregatedData.forEach(monthData => {
      monthData.forEach(value => {
        total += value;
      });
    });
    return {
      value: formatNumber(total),
      color: total > 0 ? 'text-green-500' : total < 0 ? 'text-red-500' : 'text-lime-500'
    };
  };

  return {
    isLoading,
    calculateCellValue,
    calculateRowTotal,
    calculateColumnTotal,
    calculateGrandTotal
  };
};
