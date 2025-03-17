
import React, { useState, useEffect } from 'react';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, Download } from 'lucide-react';
import { subMonths, startOfDay } from 'date-fns';
import { MultiInstrumentSelect } from './MultiInstrumentSelect';

interface HistoricalPriceFilterProps {
  onFilterChange: (filters: HistoricalPriceFilters) => void;
  instruments: Array<{ id: string; displayName: string }>;
  selectedInstrumentIds: string[];
  isLoading: boolean;
  onExport: () => void;
}

export interface HistoricalPriceFilters {
  instrumentIds: string[];
  startDate: Date | null;
  endDate: Date | null;
}

export const HistoricalPriceFilter: React.FC<HistoricalPriceFilterProps> = ({
  onFilterChange,
  instruments,
  selectedInstrumentIds,
  isLoading,
  onExport
}) => {
  const defaultStartDate = subMonths(startOfDay(new Date()), 1);
  const defaultEndDate = startOfDay(new Date());

  const [instrumentIds, setInstrumentIds] = useState<string[]>(selectedInstrumentIds);
  const [startDate, setStartDate] = useState<Date>(defaultStartDate);
  const [endDate, setEndDate] = useState<Date>(defaultEndDate);

  // Update local state when selected instruments from parent change
  useEffect(() => {
    if (selectedInstrumentIds.length > 0 && JSON.stringify(instrumentIds) !== JSON.stringify(selectedInstrumentIds)) {
      setInstrumentIds(selectedInstrumentIds);
    }
  }, [selectedInstrumentIds]);

  const handleFilterApply = () => {
    onFilterChange({
      instrumentIds,
      startDate,
      endDate
    });
  };

  // Apply initial filter on mount
  useEffect(() => {
    handleFilterApply();
  }, []);

  const handleInstrumentChange = (newIds: string[]) => {
    setInstrumentIds(newIds);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Instruments</label>
            <MultiInstrumentSelect
              instruments={instruments.map(i => ({ id: i.id, displayName: i.displayName }))}
              selectedValues={instrumentIds}
              onChange={handleInstrumentChange}
              disabled={instruments.length === 0}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">Start Date</label>
            <DatePicker 
              date={startDate} 
              setDate={setStartDate} 
              placeholder="Select start date"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">End Date</label>
            <DatePicker 
              date={endDate} 
              setDate={setEndDate} 
              placeholder="Select end date"
            />
          </div>
          
          <div className="flex items-end gap-2">
            <Button 
              onClick={handleFilterApply} 
              disabled={isLoading || instrumentIds.length === 0}
              className="flex-1"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Apply
            </Button>
            <Button 
              variant="outline" 
              onClick={onExport}
              disabled={isLoading}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
