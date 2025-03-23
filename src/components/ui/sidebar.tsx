// Update imports to use the correct path for useIsMobile
import React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useIsMobile } from "@/core/hooks/use-mobile"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  isCollapsed: boolean
}

export function Sidebar({ className, isCollapsed, ...props }: SidebarProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return null
  }

  return (
    <div
      className={cn(
        "flex flex-col border-r bg-secondary/50 text-secondary-foreground",
        isCollapsed ? "w-16" : "w-[280px]",
        className
      )}
      {...props}
    >
      <div className="flex-1 space-y-2 p-2">
        <ScrollArea className="h-[calc(100vh-theme(spacing.12))] pb-10">
          <div className="space-y-2">
            <h4 className="font-medium text-muted-foreground">Dashboard</h4>
            <Button variant="ghost" className="h-9 w-full justify-start gap-2">
              {isCollapsed ? "Overview" : "Overview"}
            </Button>
            <Button variant="ghost" className="h-9 w-full justify-start gap-2">
              {isCollapsed ? "Analytics" : "Analytics"}
            </Button>
            <h4 className="font-medium text-muted-foreground">Trades</h4>
            <Button variant="ghost" className="h-9 w-full justify-start gap-2">
              {isCollapsed ? "View Trades" : "View Trades"}
            </Button>
            <Button variant="ghost" className="h-9 w-full justify-start gap-2">
              {isCollapsed ? "Enter Trade" : "Enter Trade"}
            </Button>
            <h4 className="font-medium text-muted-foreground">Pricing</h4>
            <Button variant="ghost" className="h-9 w-full justify-start gap-2">
              {isCollapsed ? "Prices" : "Prices"}
            </Button>
            <Button variant="ghost" className="h-9 w-full justify-start gap-2">
              {isCollapsed ? "Instruments" : "Instruments"}
            </Button>
            <h4 className="font-medium text-muted-foreground">Risk</h4>
            <Button variant="ghost" className="h-9 w-full justify-start gap-2">
              {isCollapsed ? "Exposure" : "Exposure"}
            </Button>
            <Button variant="ghost" className="h-9 w-full justify-start gap-2">
              {isCollapsed ? "MTM" : "MTM"}
            </Button>
            <h4 className="font-medium text-muted-foreground">Admin</h4>
            <Button variant="ghost" className="h-9 w-full justify-start gap-2">
              {isCollapsed ? "Reference Data" : "Reference Data"}
            </Button>
            <Button variant="ghost" className="h-9 w-full justify-start gap-2">
              {isCollapsed ? "Users & Roles" : "Users & Roles"}
            </Button>
            <Button variant="ghost" className="h-9 w-full justify-start gap-2">
              {isCollapsed ? "Audit Logs" : "Audit Logs"}
            </Button>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
