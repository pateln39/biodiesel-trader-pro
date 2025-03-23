
import React, { useState, useEffect } from 'react';
import { HistoricalPriceFilter, HistoricalPriceFilters } from './HistoricalPriceFilter';
import { useHistoricalPrices } from '@/hooks/useHistoricalPrices';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TableView } from './tabs/TableView';
import { GraphView } from './tabs/GraphView';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader } from 'lucide-react';

const HistoricalPricesView = () => {
  const [activeTab, setActiveTab] = useState('graph');
  const [initializing, setInitializing] = useState(true);
  
  const {
    instruments,
    pricesByInstrument,
    statistics,
    selectedInstruments,
    selectedInstrumentIds,
    isLoading,
    error,
    updateFilters,
    exportToExcel,
    findFame0Instrument
  } = useHistoricalPrices();
  
  // When instruments load, check if Fame0 is present and select it
  useEffect(() => {
    if (instruments && instruments.length > 0 && !isLoading) {
      const fame0Id = findFame0Instrument()?.id;
      if (fame0Id && (!selectedInstrumentIds || selectedInstrumentIds.length === 0 || 
          !selectedInstrumentIds.includes(fame0Id))) {
        updateFilters({
          instrumentIds: [fame0Id],
          startDate: null,
          endDate: null,
        });
      }
      
      // Set initializing to false after instruments are loaded and Fame0 is selected
      setInitializing(false);
    }
  }, [instruments, isLoading]);
  
  const handleFilterChange = (filters: HistoricalPriceFilters) => {
    updateFilters({
      instrumentIds: filters.instrumentIds,
      startDate: filters.startDate,
      endDate: filters.endDate,
    });
  };
  
  // Create a mapping of instrument IDs to names
  const instrumentNames: Record<string, string> = {};
  if (instruments && Array.isArray(instruments)) {
    instruments.forEach(instrument => {
      if (instrument && instrument.id) {
        instrumentNames[instrument.id] = instrument.display_name;
      }
    });
  }
  
  // Show loading state when initializing or when instruments are loading
  if (initializing || (isLoading && (!instruments || instruments.length === 0))) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader className="h-12 w-12 animate-spin text-primary" />
        <h3 className="text-xl font-medium">Loading Price Data...</h3>
        <p className="text-sm text-muted-foreground">Please wait while we fetch the latest price information</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            There was a problem loading the historical price data. Please try again.
          </AlertDescription>
        </Alert>
      )}
      
      <HistoricalPriceFilter
        onFilterChange={handleFilterChange}
        instruments={(instruments || []).map(i => ({ 
          id: i.id, 
          displayName: i.display_name 
        }))}
        selectedInstrumentIds={selectedInstrumentIds || []}
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
            data={pricesByInstrument || {}}
            statistics={statistics || []}
            instrumentNames={instrumentNames}
            isLoading={isLoading}
          />
        </TabsContent>
        
        <TabsContent value="table" className="space-y-4">
          <TableView 
            data={pricesByInstrument || {}}
            instrumentNames={instrumentNames}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HistoricalPricesView;
