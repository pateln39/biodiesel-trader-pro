
import React, { useState } from 'react';
import { HistoricalPriceFilter, HistoricalPriceFilters } from './HistoricalPriceFilter';
import { useHistoricalPrices } from '@/hooks/useHistoricalPrices';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TableView } from './tabs/TableView';
import { GraphView } from './tabs/GraphView';

const HistoricalPricesView = () => {
  const [activeTab, setActiveTab] = useState('graph');
  
  const {
    instruments,
    pricesByInstrument,
    statistics,
    selectedInstruments,
    isLoading,
    updateFilters,
    exportToExcel,
  } = useHistoricalPrices();
  
  const handleFilterChange = (filters: HistoricalPriceFilters) => {
    updateFilters({
      instrumentIds: filters.instrumentIds,
      startDate: filters.startDate,
      endDate: filters.endDate,
    });
  };
  
  // Create a mapping of instrument IDs to names
  const instrumentNames: Record<string, string> = {};
  instruments.forEach(instrument => {
    instrumentNames[instrument.id] = instrument.display_name;
  });
  
  return (
    <div className="space-y-4">
      <HistoricalPriceFilter
        onFilterChange={handleFilterChange}
        instruments={instruments.map(i => ({ id: i.id, displayName: i.display_name }))}
        isLoading={isLoading}
        onExport={exportToExcel}
      />
      
      <Tabs 
        defaultValue="graph" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid grid-cols-2 w-[400px]">
          <TabsTrigger value="graph">Graph View</TabsTrigger>
          <TabsTrigger value="table">Table View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="graph" className="space-y-4">
          <GraphView 
            data={pricesByInstrument}
            statistics={statistics}
            instrumentNames={instrumentNames}
            isLoading={isLoading}
          />
        </TabsContent>
        
        <TabsContent value="table" className="space-y-4">
          <TableView 
            data={pricesByInstrument}
            instrumentNames={instrumentNames}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HistoricalPricesView;
