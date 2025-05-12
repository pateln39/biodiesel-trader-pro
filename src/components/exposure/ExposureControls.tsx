
import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Calendar, FilterIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { calculateBusinessDaysForMonth } from '@/utils/exposureTableUtils';
import { Badge } from '@/components/ui/badge';
import { DateRange } from 'react-day-picker';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

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
  // Calculate business days for selected month
  const businessDays = selectedMonth ? calculateBusinessDaysForMonth(selectedMonth) : null;

  return (
    <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-start">
      <Card className="mb-4 w-full md:w-3/5">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Category Filters</label>
              <div className="flex flex-wrap gap-2">
                {exposureCategories.map(category => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`category-${category}`} 
                      checked={visibleCategories.includes(category)} 
                      onCheckedChange={() => toggleCategory(category)} 
                    />
                    <label 
                      htmlFor={`category-${category}`} 
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {category}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 border-t pt-4">
              <div className="flex items-center space-x-2 mb-3">
                <FilterIcon className="h-4 w-4" />
                <label className="text-sm font-medium">Date Range Filter</label>
                <Switch
                  checked={dateRangeEnabled}
                  onCheckedChange={() => onToggleDateRange()}
                  id="date-range-toggle"
                />
              </div>
              
              {dateRangeEnabled && (
                <div className="mt-2">
                  <DateRangePicker
                    dateRange={dateRange}
                    onDateRangeChange={onDateRangeChange}
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:items-center md:space-x-4 mb-4 md:mb-0">
        <div className="flex items-center space-x-2">
          <Select
            value={selectedMonth || ''}
            onValueChange={(value) => onMonthSelect(value || null)}
          >
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Select Month" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map((month) => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {businessDays !== null && selectedMonth && (
            <Badge variant="secondary" className="bg-blue-500 text-white hover:bg-blue-600">
              {selectedMonth}: {businessDays} business days
            </Badge>
          )}
        </div>

        <Button variant="outline" size="sm" onClick={onExportExcel}>
          <Download className="mr-2 h-3 w-3" /> Export
        </Button>
      </div>
    </div>
  );
};

export default ExposureControls;
