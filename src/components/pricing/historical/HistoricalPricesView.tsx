
import React from 'react';
import { HistoricalPriceFilter, HistoricalPriceFilters } from './HistoricalPriceFilter';
import { HistoricalPriceTable } from './HistoricalPriceTable';
import { HistoricalPriceChart } from './HistoricalPriceChart';
import { useHistoricalPrices } from '@/hooks/useHistoricalPrices';

const HistoricalPricesView = () => {
  const {
    instruments,
    prices,
    selectedInstrument,
    isLoading,
    updateFilters,
    exportToExcel,
  } = useHistoricalPrices();
  
  const handleFilterChange = (filters: HistoricalPriceFilters) => {
    updateFilters({
      instrumentId: filters.instrumentId,
      startDate: filters.startDate,
      endDate: filters.endDate,
    });
  };
  
  return (
    <div className="space-y-4">
      <HistoricalPriceFilter
        onFilterChange={handleFilterChange}
        instruments={instruments.map(i => ({ id: i.id, displayName: i.display_name }))}
        isLoading={isLoading}
        onExport={exportToExcel}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <HistoricalPriceChart
          data={prices}
          isLoading={isLoading}
          instrumentName={selectedInstrument?.display_name || 'Unknown Instrument'}
        />
        
        <div className="col-span-1">
          <HistoricalPriceTable
            data={prices}
            isLoading={isLoading}
            instrumentName={selectedInstrument?.display_name || 'Unknown Instrument'}
          />
        </div>
      </div>
    </div>
  );
};

export default HistoricalPricesView;
