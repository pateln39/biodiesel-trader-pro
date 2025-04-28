
import * as React from "react"
import { Input } from "@/components/ui/input"
import { Clock } from "lucide-react"

interface TimeInputProps {
  date: Date
  setDate: (date: Date) => void
  disabled?: boolean
}

export function TimeInput({ date, setDate, disabled }: TimeInputProps) {
  // Ensure we're working with valid values
  const safeDate = date instanceof Date && !isNaN(date.getTime()) ? date : new Date();
  const hours = safeDate.getHours();
  const minutes = safeDate.getMinutes();

  const updateTime = (newHours: number, newMinutes: number) => {
    try {
      const newDate = new Date(safeDate);
      newDate.setHours(newHours);
      newDate.setMinutes(newMinutes);
      setDate(newDate);
    } catch (error) {
      console.error("Error updating time:", error);
    }
  }

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(23, Math.max(0, parseInt(e.target.value) || 0));
    updateTime(value, minutes);
  }

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(59, Math.max(0, parseInt(e.target.value) || 0));
    updateTime(hours, value);
  }

  const handleHoursFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.stopPropagation();
    e.target.select();
  }

  const handleMinutesFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.stopPropagation();
    e.target.select();
  }

  const handleInputClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  }

  return (
    <div className="flex gap-2 items-center z-50 pointer-events-auto">
      <Clock className="h-4 w-4 opacity-50" />
      <Input
        type="number"
        min={0}
        max={23}
        value={hours.toString().padStart(2, '0')}
        onChange={handleHoursChange}
        onFocus={handleHoursFocus}
        onClick={handleInputClick}
        className="w-[70px] pointer-events-auto z-50 cursor-text"
        disabled={disabled}
      />
      <span className="opacity-50">:</span>
      <Input
        type="number"
        min={0}
        max={59}
        value={minutes.toString().padStart(2, '0')}
        onChange={handleMinutesChange}
        onFocus={handleMinutesFocus}
        onClick={handleInputClick}
        className="w-[70px] pointer-events-auto z-50 cursor-text"
        disabled={disabled}
      />
    </div>
  )
}
