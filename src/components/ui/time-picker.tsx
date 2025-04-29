import * as React from "react"
import { Clock } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface TimePickerProps {
  date: Date
  setDate: (date: Date) => void
  disabled?: boolean
}

export function TimePicker({ date, setDate, disabled }: TimePickerProps) {
  // Get current hours and minutes from date
  const hours = date?.getHours() || 0
  const minutes = date?.getMinutes() || 0

  // Create arrays for hours and minutes options
  const hoursArray = Array.from({ length: 24 }, (_, i) => i)
  const minutesArray = Array.from({ length: 60 }, (_, i) => i)

  // Update time while keeping the same date
  const updateTime = (hours: number, minutes: number) => {
    const newDate = new Date(date)
    newDate.setHours(hours)
    newDate.setMinutes(minutes)
    setDate(newDate)
  }

  return (
    <div className="flex gap-2 items-center">
      <Clock className="h-4 w-4 opacity-50" />
      <Select
        disabled={disabled}
        value={hours.toString()}
        onValueChange={(value) => updateTime(parseInt(value), minutes)}
      >
        <SelectTrigger className={cn("w-[70px]")}>
          <SelectValue placeholder="HH" />
        </SelectTrigger>
        <SelectContent>
          {hoursArray.map((hour) => (
            <SelectItem key={hour} value={hour.toString()}>
              {hour.toString().padStart(2, '0')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="opacity-50">:</span>
      <Select
        disabled={disabled}
        value={minutes.toString()}
        onValueChange={(value) => updateTime(hours, parseInt(value))}
      >
        <SelectTrigger className={cn("w-[70px]")}>
          <SelectValue placeholder="MM" />
        </SelectTrigger>
        <SelectContent>
          {minutesArray.map((minute) => (
            <SelectItem key={minute} value={minute.toString()}>
              {minute.toString().padStart(2, '0')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
