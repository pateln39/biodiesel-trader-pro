
import React, { useState } from 'react';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, Download } from 'lucide-react';
import { subMonths, startOfDay } from 'date-fns';

interface HistoricalPriceFilterProps {
  onFilterChange: (filters: HistoricalPriceFilters) => void;
  instruments: Array<{ id: string; displayName: string }>;
  isLoading: boolean;
  onExport: () => void;
}

export interface HistoricalPriceFilters {
  instrumentId: string | null;
  startDate: Date | null;
  endDate: Date | null;
}

export const HistoricalPriceFilter: React.FC<HistoricalPriceFilterProps> = ({
  onFilterChange,
  instruments,
  isLoading,
  onExport
}) => {
  const defaultStartDate = subMonths(startOfDay(new Date()), 1);
  const defaultEndDate = startOfDay(new Date());

  const [instrumentId, setInstrumentId] = useState<string | null>(
    instruments.length > 0 ? instruments[0].id : null
  );
  const [startDate, setStartDate] = useState<Date>(defaultStartDate);
  const [endDate, setEndDate] = useState<Date>(defaultEndDate);

  const handleFilterApply = () => {
    onFilterChange({
      instrumentId,
      startDate,
      endDate
    });
  };

  // Apply initial filter on mount
  React.useEffect(() => {
    handleFilterApply();
  }, []);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Instrument</label>
            <Select
              value={instrumentId || ''}
              onValueChange={(value) => setInstrumentId(value)}
              disabled={instruments.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select instrument" />
              </SelectTrigger>
              <SelectContent>
                {instruments.map((instrument) => (
                  <SelectItem key={instrument.id} value={instrument.id}>
                    {instrument.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              disabled={isLoading || !instrumentId}
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
