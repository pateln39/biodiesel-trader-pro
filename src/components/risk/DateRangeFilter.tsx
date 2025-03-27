
import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface DateRangeFilterProps {
  startDate: Date;
  endDate: Date;
  onDateRangeChange: (startDate: Date, endDate: Date) => void;
}

export function DateRangeFilter({ 
  startDate, 
  endDate, 
  onDateRangeChange 
}: DateRangeFilterProps) {
  const [selectedStartDate, setSelectedStartDate] = React.useState<Date>(startDate);
  const [selectedEndDate, setSelectedEndDate] = React.useState<Date>(endDate);
  const [isStartOpen, setIsStartOpen] = React.useState(false);
  const [isEndOpen, setIsEndOpen] = React.useState(false);

  const handleStartDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedStartDate(date);
      setIsStartOpen(false);
      
      // If end date is before new start date, update end date
      if (selectedEndDate < date) {
        setSelectedEndDate(date);
      }
    }
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedEndDate(date);
      setIsEndOpen(false);
      
      // If start date is after new end date, update start date
      if (selectedStartDate > date) {
        setSelectedStartDate(date);
      }
    }
  };

  const handleApplyFilter = () => {
    onDateRangeChange(selectedStartDate, selectedEndDate);
  };

  return (
    <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 mb-4">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">From:</span>
        <Popover open={isStartOpen} onOpenChange={setIsStartOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal w-[180px]",
                !selectedStartDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedStartDate ? (
                format(selectedStartDate, "PPP")
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedStartDate}
              onSelect={handleStartDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">To:</span>
        <Popover open={isEndOpen} onOpenChange={setIsEndOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal w-[180px]",
                !selectedEndDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedEndDate ? (
                format(selectedEndDate, "PPP")
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedEndDate}
              onSelect={handleEndDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <Button onClick={handleApplyFilter}>Apply Filter</Button>
    </div>
  );
}
