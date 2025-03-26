
import React, { useState, useEffect } from 'react';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CalendarIcon, 
  RefreshCw 
} from 'lucide-react';
import { startOfMonth, endOfMonth, format } from 'date-fns';

interface DateRangeFilterProps {
  onFilterChange: (startDate: Date, endDate: Date) => void;
  isLoading?: boolean;
  initialStartDate?: Date;
  initialEndDate?: Date;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ 
  onFilterChange,
  isLoading = false,
  initialStartDate,
  initialEndDate
}) => {
  const currentDate = new Date();
  const [startDate, setStartDate] = useState<Date>(initialStartDate || startOfMonth(currentDate));
  const [endDate, setEndDate] = useState<Date>(initialEndDate || endOfMonth(currentDate));

  useEffect(() => {
    if (initialStartDate) setStartDate(initialStartDate);
    if (initialEndDate) setEndDate(initialEndDate);
  }, [initialStartDate, initialEndDate]);

  const handleApplyFilter = () => {
    onFilterChange(startDate, endDate);
  };

  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          
          <div className="flex items-end">
            <Button 
              onClick={handleApplyFilter} 
              disabled={isLoading}
              className="flex-1"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Apply Date Range
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DateRangeFilter;
