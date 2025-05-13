
import React, { useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { isBusinessDay, countBusinessDays } from '@/utils/dateUtils';
import { parseISODate } from '@/utils/dateUtils';
import { getMonthDates } from '@/utils/paperTrade/dateUtils';
interface MonthSelectProps {
  months: string[];
  selectedMonth: string | null;
  onMonthSelect: (month: string) => void;
}
export const MonthSelect: React.FC<MonthSelectProps> = ({
  months,
  selectedMonth,
  onMonthSelect
}) => {
  // Select the first month by default if none is selected
  useEffect(() => {
    if (!selectedMonth && months.length > 0) {
      onMonthSelect(months[0]);
    }
  }, [selectedMonth, months, onMonthSelect]);

  // Calculate business days for selected month
  const businessDays = React.useMemo(() => {
    if (!selectedMonth) return null;
    const monthDates = getMonthDates(selectedMonth);
    if (!monthDates) return null;
    return countBusinessDays(monthDates.startDate, monthDates.endDate);
  }, [selectedMonth]);
  return <div className="flex items-center gap-2">
      <Select value={selectedMonth || ""} onValueChange={value => onMonthSelect(value)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select month" />
        </SelectTrigger>
        <SelectContent>
          {months.map(month => <SelectItem key={month} value={month}>
              {month}
            </SelectItem>)}
        </SelectContent>
      </Select>
      
      {businessDays !== null && selectedMonth && <Badge variant="outline" className="bg-blue-800 text-white">
          {businessDays} business days
        </Badge>}
    </div>;
};
