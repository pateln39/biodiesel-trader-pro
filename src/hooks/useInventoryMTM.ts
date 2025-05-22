
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useReferenceData } from '@/hooks/useReferenceData';

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

const getAllMonths = (tankMovements: TankMovement[], currentDate: Date) => {
  const months = new Set<string>();
  
  // Add all months from movements
  tankMovements.forEach(movement => {
    const month = format(new Date(movement.movement_date), 'MMM-yy').toUpperCase();
    months.add(month);
  });
  
  // Add default range (previous month, current month, and 4 months ahead)
  const startDate = new Date(currentDate);
  startDate.setMonth(currentDate.getMonth() - 1);
  
  for (let i = 0; i < 6; i++) {
    const monthDate = new Date(startDate);
    monthDate.setMonth(startDate.getMonth() + i);
    const monthCode = format(monthDate, 'MMM-yy').toUpperCase();
    months.add(monthCode);
  }
  
  // Convert to array and sort chronologically
  return Array.from(months).sort((a, b) => {
    // Convert month abbreviation to month index (0-11)
    const monthIndexA = "JANFEBMARAPRMAYJUNJULAUGSEPOCTNOVDEC".indexOf(a.slice(0, 3)) / 3;
    const monthIndexB = "JANFEBMARAPRMAYJUNJULAUGSEPOCTNOVDEC".indexOf(b.slice(0, 3)) / 3;
    
    // Get year from YY format
    const yearA = parseInt('20' + a.slice(-2));
    const yearB = parseInt('20' + b.slice(-2));
    
    // Create Date objects with the extracted month and year
    const dateA = new Date(yearA, monthIndexA, 1);
    const dateB = new Date(yearB, monthIndexB, 1);
    
    return dateA.getTime() - dateB.getTime();
  });
};

const getUniqueProducts = (tankMovements: TankMovement[]) => {
  // Extract all unique product types from tank movements
  const uniqueProducts = new Set<string>();
  
  tankMovements.forEach(movement => {
    if (movement.product_at_time) {
      uniqueProducts.add(movement.product_at_time);
    }
  });
  
  return Array.from(uniqueProducts).sort();
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
  const { productColors } = useReferenceData();
  
  const { data: tankMovements, isLoading } = useQuery({
    queryKey: ['tank_movements'],
    queryFn: fetchTankMovements,
  });

  const currentDate = new Date('2025-04-20');
  const months = tankMovements ? getAllMonths(tankMovements, currentDate) : [];
  const productHeaders = tankMovements ? getUniqueProducts(tankMovements) : [];
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
    months,
    productHeaders,
    calculateCellValue,
    calculateRowTotal,
    calculateColumnTotal,
    calculateGrandTotal
  };
};
