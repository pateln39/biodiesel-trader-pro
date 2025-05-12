
import React from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Toggle } from '@/components/ui/toggle';
import { CalendarIcon, CheckIcon, FilterIcon, TableIcon } from 'lucide-react';
import { MonthSelect } from '@/components/exposure/MonthSelect';
import { DateRangePicker } from '../ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { Badge } from '@/components/ui/badge';

interface ExposureControlsProps {
  visibleCategories: string[];
  toggleCategory: (category: string) => void;
  exposureCategories: readonly string[];
  onExportExcel: () => void;
  availableMonths: string[];
  selectedMonth: string | null;
  onMonthSelect: (month: string | null) => void;
  dateRangeEnabled: boolean;
  onToggleDateRange: () => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

const ExposureControls: React.FC<ExposureControlsProps> = ({
  visibleCategories,
  toggleCategory,
  exposureCategories,
  onExportExcel,
  availableMonths,
  selectedMonth,
  onMonthSelect,
  dateRangeEnabled,
  onToggleDateRange,
  dateRange,
  onDateRangeChange
}) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:justify-between md:items-center">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-2">
              <FilterIcon className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Show Categories:</span>
              
              <div className="flex flex-wrap gap-2">
                {exposureCategories.map((category) => (
                  <Toggle
                    key={category}
                    variant="outline"
                    size="sm"
                    pressed={visibleCategories.includes(category)}
                    onPressedChange={() => toggleCategory(category)}
                  >
                    {visibleCategories.includes(category) && <CheckIcon className="mr-1 h-3 w-3" />}
                    {category}
                  </Toggle>
                ))}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <TableIcon className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Business Days:</span>
              <MonthSelect
                months={availableMonths}
                selectedMonth={selectedMonth}
                onMonthSelect={onMonthSelect}
              />
            </div>
          </div>
          
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
              <Toggle
                variant={dateRangeEnabled ? "default" : "outline"}
                size="sm"
                pressed={dateRangeEnabled}
                onPressedChange={onToggleDateRange}
                className={dateRangeEnabled ? "bg-blue-500 text-white hover:bg-blue-600" : ""}
              >
                {dateRangeEnabled ? 
                  <CheckIcon className="mr-1 h-3 w-3" /> : 
                  <span className="mr-1">🗓️</span>
                }
                Date Range Filter
              </Toggle>
              
              <DateRangePicker 
                dateRange={dateRange} 
                onDateRangeChange={onDateRangeChange}
                disabled={!dateRangeEnabled}
              />
              
              {dateRangeEnabled && dateRange?.from && dateRange?.to && (
                <Badge variant="outline" className="bg-blue-500/20 text-blue-600 border-blue-300">
                  {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                </Badge>
              )}
            </div>
            
            <div className="flex justify-end">
              <Button variant="outline" onClick={onExportExcel}>
                Export to Excel
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExposureControls;
