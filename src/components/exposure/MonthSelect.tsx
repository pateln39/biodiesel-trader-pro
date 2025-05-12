
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MonthSelectProps {
  months: string[];
  selectedMonth: string | null;
  onMonthSelect: (month: string | null) => void;
}

export const MonthSelect: React.FC<MonthSelectProps> = ({ 
  months, 
  selectedMonth, 
  onMonthSelect 
}) => {
  return (
    <Select 
      value={selectedMonth || "all"} 
      onValueChange={(value) => onMonthSelect(value === "all" ? null : value)}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select month" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All months</SelectItem>
        {months.map((month) => (
          <SelectItem key={month} value={month}>
            {month}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
