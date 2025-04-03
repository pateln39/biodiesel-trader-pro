import React, { useState, useEffect, useCallback } from 'react';
import { CalendarDateRangePicker } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CalendarIcon, ChevronDown, Copy, Filter, Loader2, Search, X } from "lucide-react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import Layout from "@/components/Layout"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTrades } from "@/hooks/useTrades";
import { PhysicalTrade } from '@/types';
import { format } from 'date-fns';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

// Import sortable components
import { SortableTable } from '@/components/ui/sortable-table';
import { SortableTableRow } from '@/components/ui/sortable-table-row';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const OperationsPage = () => {
  const [searchField, setSearchField] = useState("tradeReference")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [date, setDate] = useState<undefined | Date> (undefined)
  const [dateRange, setDateRange] = useState<undefined | {
    from: Date | undefined;
    to: Date | undefined;
  }> (undefined)
  const [open, setOpen] = React.useState(false)
  const { trades, loading, error } = useTrades();
  
  // State for user preferences
  const [userPreferences, setUserPreferences] = useState<any | null>(null);
  const [orderedTrades, setOrderedTrades] = useState<PhysicalTrade[]>([]);
  
  // Load user preferences - similar to the other components
  useEffect(() => {
    const fetchUserPreferences = async () => {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('id', 'default')
        .single();
      
      if (data && !error) {
        setUserPreferences(data);
      } else {
        // Create default preferences if none exist
        const { data: newData, error: createError } = await supabase
          .from('user_preferences')
          .insert({ id: 'default' })
          .select()
          .single();
          
        if (newData && !createError) {
          setUserPreferences(newData);
        }
      }
    };
    
    fetchUserPreferences();
  }, []);
  
  // Apply order to trades
  useEffect(() => {
    if (!trades.length) return setOrderedTrades([]);
    
    if (userPreferences?.physical_trade_order?.length) {
      // Create a map for quick lookup
      const orderMap = new Map();
      userPreferences.physical_trade_order.forEach((id: string, index: number) => {
        orderMap.set(id, index);
      });
      
      // Sort trades based on the preferences
      const ordered = [...trades].sort((a: any, b: any) => {
        const aIndex = orderMap.has(a.id) ? orderMap.get(a.id) : Infinity;
        const bIndex = orderMap.has(b.id) ? orderMap.get(b.id) : Infinity;
        
        if (aIndex === Infinity && bIndex === Infinity) {
          // Sort by date if neither is in preferences
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        
        return aIndex - bIndex;
      });
      
      setOrderedTrades(ordered);
    } else {
      // Default to creation date order
      setOrderedTrades([...trades].sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    }
  }, [trades, userPreferences]);
  
  // Mutation to update preferences
  const { mutate: updatePreferences } = useMutation({
    mutationFn: async (newOrder: string[]) => {
      const { error } = await supabase
        .from('user_preferences')
        .update({ physical_trade_order: newOrder })
        .eq('id', 'default');
        
      if (error) throw error;
      return newOrder;
    },
    onSuccess: () => {
      toast.success('Trade order updated', {
        description: 'Your preferred trade order has been saved'
      });
    },
    onError: (error: any) => {
      console.error('Failed to update trade order:', error);
      toast.error('Failed to save trade order');
    }
  });
  
  // Handle order change
  const handleOrderChange = (newItems: PhysicalTrade[]) => {
    const newOrder = newItems.map(trade => trade.id);
    updatePreferences(newOrder);
  };
  
  const searchFields = [
    {
      value: "tradeReference",
      label: "Trade Reference",
    },
    {
      value: "counterparty",
      label: "Counterparty",
    },
    {
      value: "product",
      label: "Product",
    },
  ]

  const tradeStatuses = [
    {
      value: "all",
      label: "All",
    },
    {
      value: "action needed",
      label: "Action Needed",
    },
    {
      value: "sent",
      label: "Sent",
    },
    {
      value: "in process",
      label: "In Process",
    },
  ]

  const selectedFilterFunc = useCallback((trade: PhysicalTrade) => {
    if (selectedStatus === null || selectedStatus === "all") {
      return true
    }
    return trade.contractStatus === selectedStatus
  }, [selectedStatus])

  const filteredTrades = React.useMemo(() => {
    if (!orderedTrades || orderedTrades.length === 0) return [];

    let filtered = [...orderedTrades]

    if (searchTerm) {
      filtered = filtered.filter((trade) => {
        const searchFieldValue = trade[searchField as keyof PhysicalTrade]
        if (typeof searchFieldValue === "string") {
          return searchFieldValue
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        }
        return false
      })
    }

    if (selectedStatus) {
      filtered = filtered.filter(selectedFilterFunc)
    }

    if (dateRange?.from && dateRange?.to) {
      filtered = filtered.filter((trade) => {
        const tradeDate = new Date(trade.createdAt)
        const fromDate = new Date(dateRange.from as Date)
        const toDate = new Date(dateRange.to as Date)
        return tradeDate >= fromDate && tradeDate <= toDate
      })
    }

    return filtered
  }, [orderedTrades, searchTerm, searchField, selectedStatus, selectedFilterFunc, dateRange])

  return (
    <Layout>
      <div className="container space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Operations</h2>
          <p className="text-muted-foreground">
            Manage and monitor trade operations.
          </p>
        </div>
        <Tabs defaultValue="movements" className="space-y-4">
          <TabsList>
            <TabsTrigger value="movements">Movements</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>
          <TabsContent value="movements" className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-1 items-center space-x-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="ml-auto"
                    >
                      <Filter className="mr-2 h-4 w-4" />
                      {selectedStatus ? (
                        tradeStatuses.find((status) => status.value === selectedStatus)?.label
                      ) : "Status"}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {tradeStatuses.map((status) => (
                      <DropdownMenuItem
                        key={status.value}
                        onClick={() => setSelectedStatus(status.value)}
                      >
                        {status.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "justify-start text-left font-normal",
                        !dateRange?.from || !dateRange?.to
                          ? "text-muted-foreground"
                          : undefined
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from && dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0"
                    align="end"
                  >
                    <CalendarDateRangePicker
                      date={dateRange}
                      onSelect={setDateRange}
                    />
                  </PopoverContent>
                </Popover>
                {dateRange?.from || dateRange?.to ? (
                  <Button
                    variant={"ghost"}
                    onClick={() => setDateRange(undefined)}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                ) : null}
              </div>
              <div className="flex items-center space-x-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="ml-auto">
                      <Search className="mr-2 h-4 w-4" />
                      Search Field
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Search by</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {searchFields.map((field) => (
                      <DropdownMenuItem
                        key={field.value}
                        onClick={() => setSearchField(field.value)}
                      >
                        {field.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Input
                  placeholder="Search trades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Separator />
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30px]"></TableHead>
                    <TableHead>Trade Ref</TableHead>
                    <TableHead>Counterparty</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created At</TableHead>
                  </TableRow>
                </TableHeader>
                
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading trades...
                      </TableCell>
                    </TableRow>
                  ) : orderedTrades.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No trades found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    <SortableTable
                      items={filteredTrades}
                      getItemId={(trade: any) => trade.id}
                      onOrderChange={handleOrderChange}
                    >
                      {(sortedItems: any, { dragHandleProps }) => (
                        <>
                          {sortedItems.map((trade: any) => (
                            <SortableTableRow key={trade.id} id={trade.id}>
                              <TableCell {...dragHandleProps(trade.id)} />
                              <TableCell>{trade.tradeReference}</TableCell>
                              <TableCell>{trade.counterparty}</TableCell>
                              <TableCell>{trade.product}</TableCell>
                              <TableCell>{trade.quantity}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{trade.contractStatus}</Badge>
                              </TableCell>
                              <TableCell>
                                {format(new Date(trade.createdAt), "MMM dd, yyyy")}
                              </TableCell>
                            </SortableTableRow>
                          ))}
                        </>
                      )}
                    </SortableTable>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value="invoices">
            <p>This is the invoices tab.</p>
          </TabsContent>
          <TabsContent value="payments">
            <p>This is the payments tab.</p>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}

export default OperationsPage;
