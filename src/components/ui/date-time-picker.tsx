import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { TimeInput } from "./time-input"

interface DateTimePickerProps {
  date: Date
  setDate: (date: Date) => void
  disabled?: boolean
  placeholder?: string
}

export function DateTimePicker({ 
  date, 
  setDate, 
  disabled, 
  placeholder = "Pick date and time" 
}: DateTimePickerProps) {
  // Ensure we always have a valid Date object to work with
  const safeDate = date instanceof Date && !isNaN(date.getTime()) ? date : new Date();
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date instanceof Date && !isNaN(date.getTime()) 
            ? format(date, "dd MMM yyyy HH:mm") 
            : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0" 
        align="start" 
        sideOffset={4}
        style={{ zIndex: 50 }}
      >
        <div className="p-4 space-y-4">
          <Calendar
            mode="single"
            selected={safeDate}
            onSelect={(newDate) => {
              if (newDate) {
                const updatedDate = new Date(newDate)
                updatedDate.setHours(safeDate.getHours())
                updatedDate.setMinutes(safeDate.getMinutes())
                setDate(updatedDate)
              }
            }}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
          <TimeInput
            date={safeDate}
            setDate={setDate}
            disabled={disabled}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
