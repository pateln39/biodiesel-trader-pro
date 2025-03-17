
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
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<string | null>(null);
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
  if (instruments.length > 0 && !selectedInstrumentId) {
    setSelectedInstrumentId(instruments[0].id);
  }

  // Query for historical prices
  const {
    data: prices = [],
    isLoading: pricesLoading,
    refetch: refetchPrices,
  } = useQuery({
    queryKey: ['historicalPrices', selectedInstrumentId, selectedDateRange],
    queryFn: async () => {
      if (!selectedInstrumentId) {
        return [];
      }

      let query = supabase
        .from('historical_prices')
        .select('*')
        .eq('instrument_id', selectedInstrumentId);

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
        throw new Error('Failed to fetch historical prices');
      }

      return data as HistoricalPrice[];
    },
    enabled: !!selectedInstrumentId,
  });

  // Selected instrument name
  const selectedInstrument = instruments.find(i => i.id === selectedInstrumentId);

  // Filter update handler
  const updateFilters = ({
    instrumentId,
    startDate,
    endDate,
  }: {
    instrumentId: string | null;
    startDate: Date | null;
    endDate: Date | null;
  }) => {
    if (instrumentId) {
      setSelectedInstrumentId(instrumentId);
    }
    
    setSelectedDateRange({
      startDate,
      endDate,
    });
  };

  // Export to Excel
  const exportToExcel = () => {
    if (prices.length === 0 || !selectedInstrument) return;

    const exportData = prices.map(price => ({
      Date: format(new Date(price.price_date), 'yyyy-MM-dd'),
      Instrument: selectedInstrument.display_name,
      'Instrument Code': selectedInstrument.instrument_code,
      Price: price.price,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Historical Prices');
    
    const fileName = `${selectedInstrument.instrument_code}_historical_prices_${format(new Date(), 'yyyyMMdd')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return {
    instruments,
    prices,
    selectedInstrument: selectedInstrument || null,
    isLoading: instrumentsLoading || pricesLoading,
    updateFilters,
    exportToExcel,
  };
};
