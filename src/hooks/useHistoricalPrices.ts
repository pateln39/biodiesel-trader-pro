
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export interface HistoricalPrice {
  id: string;
  instrument_id: string;
  price_date: string;
  price: number;
  created_at: string;
  updated_at: string;
}

export interface PricingInstrument {
  id: string;
  instrument_code: string;
  display_name: string;
  is_active: boolean;
}

export const useHistoricalPrices = () => {
  const [selectedInstrumentIds, setSelectedInstrumentIds] = useState<string[]>([]);
  const [selectedDateRange, setSelectedDateRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: null,
    endDate: null,
  });

  // Query for instruments
  const {
    data: instruments = [],
    isLoading: instrumentsLoading,
  } = useQuery({
    queryKey: ['pricingInstruments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing_instruments')
        .select('*')
        .eq('is_active', true)
        .order('display_name', { ascending: true });

      if (error) {
        console.error('Error fetching instruments:', error);
        throw new Error('Failed to fetch pricing instruments');
      }

      return data as PricingInstrument[];
    },
  });

  // Set the first instrument as selected if not already set
  if (instruments.length > 0 && selectedInstrumentIds.length === 0) {
    setSelectedInstrumentIds([instruments[0].id]);
  }

  // Query for historical prices
  const {
    data: pricesData = [],
    isLoading: pricesLoading,
    refetch: refetchPrices,
  } = useQuery({
    queryKey: ['historicalPrices', selectedInstrumentIds, selectedDateRange],
    queryFn: async () => {
      if (selectedInstrumentIds.length === 0) {
        return [];
      }

      // Fetch prices for all selected instruments
      const allPrices = await Promise.all(
        selectedInstrumentIds.map(async (instrumentId) => {
          let query = supabase
            .from('historical_prices')
            .select('*, pricing_instruments!inner(display_name, instrument_code)')
            .eq('instrument_id', instrumentId);

          if (selectedDateRange.startDate) {
            query = query.gte('price_date', format(selectedDateRange.startDate, 'yyyy-MM-dd'));
          }

          if (selectedDateRange.endDate) {
            query = query.lte('price_date', format(selectedDateRange.endDate, 'yyyy-MM-dd'));
          }

          query = query.order('price_date', { ascending: false });

          const { data, error } = await query;

          if (error) {
            console.error('Error fetching historical prices:', error);
            return [];
          }

          return data.map(item => ({
            ...item,
            instrumentName: item.pricing_instruments.display_name,
            instrumentCode: item.pricing_instruments.instrument_code
          }));
        })
      );

      // Flatten the array of arrays
      return allPrices.flat();
    },
    enabled: selectedInstrumentIds.length > 0,
  });

  // Group prices by instrument for easier access
  const pricesByInstrument = pricesData.reduce((acc, item) => {
    const key = item.instrument_id;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as Record<string, typeof pricesData>);

  // Calculate statistics for each instrument
  const statistics = Object.entries(pricesByInstrument).map(([instrumentId, prices]) => {
    if (prices.length === 0) return null;
    
    const priceValues = prices.map(p => p.price);
    const min = Math.min(...priceValues);
    const max = Math.max(...priceValues);
    const avg = priceValues.reduce((a, b) => a + b, 0) / priceValues.length;
    
    // Calculate volatility
    const mean = avg;
    const squaredDiffs = priceValues.map(price => Math.pow(price - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / priceValues.length;
    const stdDev = Math.sqrt(variance);
    const volatility = (stdDev / mean) * 100;
    
    return {
      instrumentId,
      instrumentName: prices[0].instrumentName,
      min,
      max,
      avg,
      volatility
    };
  }).filter(Boolean);

  // Selected instruments
  const selectedInstruments = instruments.filter(i => selectedInstrumentIds.includes(i.id));

  // Filter update handler
  const updateFilters = ({
    instrumentIds,
    startDate,
    endDate,
  }: {
    instrumentIds: string[];
    startDate: Date | null;
    endDate: Date | null;
  }) => {
    if (instrumentIds && instrumentIds.length > 0) {
      setSelectedInstrumentIds(instrumentIds);
    }
    
    setSelectedDateRange({
      startDate,
      endDate,
    });
  };

  // Export to Excel
  const exportToExcel = () => {
    if (pricesData.length === 0 || selectedInstruments.length === 0) return;

    // Organize data by date for export
    const dateMap = new Map();
    
    pricesData.forEach(price => {
      const date = price.price_date;
      if (!dateMap.has(date)) {
        dateMap.set(date, { Date: format(new Date(date), 'yyyy-MM-dd') });
      }
      
      const entry = dateMap.get(date);
      entry[`${price.instrumentName} Price`] = price.price;
    });
    
    const exportData = Array.from(dateMap.values());
    exportData.sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Historical Prices');
    
    const fileName = `historical_prices_${format(new Date(), 'yyyyMMdd')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return {
    instruments,
    pricesData,
    pricesByInstrument,
    statistics,
    selectedInstruments,
    isLoading: instrumentsLoading || pricesLoading,
    updateFilters,
    exportToExcel,
  };
};
