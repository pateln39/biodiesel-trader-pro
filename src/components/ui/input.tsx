
import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    // Add default handler to select all content on focus for number inputs
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      if (type === 'number') {
        e.target.select();
      }
      // Call the original onFocus handler if it exists
      if (props.onFocus) {
        props.onFocus(e);
      }
    };

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        onFocus={handleFocus}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
