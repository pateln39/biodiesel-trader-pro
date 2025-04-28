
import * as React from "react"
import { Input } from "@/components/ui/input"
import { Clock } from "lucide-react"

interface TimeInputProps {
  date: Date
  setDate: (date: Date) => void
  disabled?: boolean
}

export function TimeInput({ date, setDate, disabled }: TimeInputProps) {
  const hours = date?.getHours() || 0
  const minutes = date?.getMinutes() || 0

  const updateTime = (newHours: number, newMinutes: number) => {
    const newDate = new Date(date)
    newDate.setHours(newHours)
    newDate.setMinutes(newMinutes)
    setDate(newDate)
  }

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(23, Math.max(0, parseInt(e.target.value) || 0))
    updateTime(value, minutes)
  }

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(59, Math.max(0, parseInt(e.target.value) || 0))
    updateTime(hours, value)
  }

  return (
    <div className="flex gap-2 items-center">
      <Clock className="h-4 w-4 opacity-50" />
      <Input
        type="number"
        min={0}
        max={23}
        value={hours.toString().padStart(2, '0')}
        onChange={handleHoursChange}
        className="w-[70px]"
        disabled={disabled}
      />
      <span className="opacity-50">:</span>
      <Input
        type="number"
        min={0}
        max={59}
        value={minutes.toString().padStart(2, '0')}
        onChange={handleMinutesChange}
        className="w-[70px]"
        disabled={disabled}
      />
    </div>
  )
}
