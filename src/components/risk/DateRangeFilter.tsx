
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { CalendarX } from 'lucide-react';
import { formatDate } from '@/utils/dateUtils';

interface DateRangeFilterProps {
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  onReset: () => void;
  isFiltered: boolean;
}

export function DateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onReset,
  isFiltered
}: DateRangeFilterProps) {
  const [hasErrors, setHasErrors] = useState(false);

  const handleStartDateChange = (date: Date) => {
    setHasErrors(endDate ? date > endDate : false);
    onStartDateChange(date);
  };

  const handleEndDateChange = (date: Date) => {
    setHasErrors(startDate ? startDate > date : false);
    onEndDateChange(date);
  };

  return (
    <Card className={`border ${hasErrors ? 'border-destructive' : isFiltered ? 'border-primary' : ''}`}>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <Label htmlFor="start-date" className="mb-2 block">
              Start Date
            </Label>
            <DatePicker
              date={startDate}
              setDate={handleStartDateChange}
              placeholder="Select start date"
            />
          </div>
          
          <div>
            <Label htmlFor="end-date" className="mb-2 block">
              End Date
            </Label>
            <DatePicker
              date={endDate}
              setDate={handleEndDateChange}
              placeholder="Select end date"
            />
          </div>
          
          <Button
            variant="outline"
            type="button"
            onClick={onReset}
            disabled={!isFiltered}
            className="ml-auto"
          >
            <CalendarX className="mr-2 h-4 w-4" />
            Reset Dates
          </Button>
        </div>
        
        {hasErrors && (
          <div className="mt-2 text-destructive text-sm">
            Start date must be before end date
          </div>
        )}
        
        {isFiltered && !hasErrors && (
          <div className="mt-2 text-primary text-sm font-medium">
            Showing pricing exposure from {startDate ? formatDate(startDate) : '(earliest)'} to {endDate ? formatDate(endDate) : '(latest)'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
