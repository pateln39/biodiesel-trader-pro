
import React, { useState, useEffect } from 'react';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CalendarIcon, 
  RefreshCw,
  InfoIcon
} from 'lucide-react';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { validateDateRange } from '@/utils/validationUtils';
import { toast } from 'sonner';
import { countWorkingDays, getWorkingDaysInMonth } from '@/utils/workingDaysUtils';

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
    // Validate date range
    if (!validateDateRange(startDate, endDate, 'Date range')) {
      return;
    }
    
    // Apply the filter
    onFilterChange(startDate, endDate);
    toast.success('Date range applied', {
      description: `Filtering from ${format(startDate, 'MMM dd, yyyy')} to ${format(endDate, 'MMM dd, yyyy')}`
    });
  };

  const checkWorkingDays = () => {
    // Calculate working days in the selected date range
    const workingDays = countWorkingDays(startDate, endDate);
    
    // Get working days for each month in the range
    const months = [];
    const currentMonth = new Date(startDate);
    currentMonth.setDate(1); // Set to first day of month
    
    while (currentMonth <= endDate) {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const monthName = format(currentMonth, 'MMM yyyy');
      const daysInMonth = getWorkingDaysInMonth(year, month);
      
      months.push(`${monthName}: ${daysInMonth} working days`);
      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }
    
    // Show toast with working days information
    toast.info('Working Days Analysis', {
      description: (
        <div className="space-y-2 mt-2 text-sm">
          <div><strong>Total working days:</strong> {workingDays}</div>
          <div><strong>By month:</strong></div>
          <ul className="list-disc pl-5">
            {months.map((month, index) => (
              <li key={index}>{month}</li>
            ))}
          </ul>
        </div>
      ),
      duration: 10000
    });
  };

  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

          <div className="flex items-end">
            <Button 
              onClick={checkWorkingDays}
              variant="outline" 
              className="flex-1"
            >
              <InfoIcon className="h-4 w-4 mr-2" />
              Check Working Days
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DateRangeFilter;
