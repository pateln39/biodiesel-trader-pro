import React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, MoreHorizontal, Copy, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OpenTrade } from '@/types/operations';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useReferenceData } from '@/hooks/useReferenceData';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import ProductToken from '@/components/operations/storage/ProductToken';

interface OpenTradesTableProps {
  filterStatus: 'all' | 'in-process' | 'completed';
  onRefresh: () => void;
}

const OpenTradesTable = ({ filterStatus, onRefresh }: OpenTradesTableProps) => {
  const [sorting, setSorting] = React.useState([]);
  const [openTrades, setOpenTrades] = React.useState<OpenTrade[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isError, setIsError] = React.useState(false);
  
  const { 
    counterparties,
    sustainabilityOptions,
    creditStatusOptions,
    customsStatusOptions
  } = useReferenceData();

  React.useEffect(() => {
    const fetchOpenTrades = async () => {
      setIsLoading(true);
      setIsError(false);
      
      try {
        let query = supabase
          .from('open_trades')
          .select('*')
          .order('sort_order', { ascending: true });
        
        if (filterStatus === 'in-process') {
          query = query.eq('status', 'in-process');
        } else if (filterStatus === 'completed') {
          query = query.eq('status', 'completed');
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error('[OPERATIONS] Error fetching open trades:', error);
          setIsError(true);
          toast.error("Error fetching open trades", {
            description: "There was an error retrieving open trades data"
          });
        } else {
          setOpenTrades(data || []);
        }
      } catch (error) {
        console.error('[OPERATIONS] Unexpected error fetching open trades:', error);
        setIsError(true);
        toast.error("Unexpected error", {
          description: "An unexpected error occurred while fetching open trades"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOpenTrades();
  }, [filterStatus]);

  const handleStatusChange = async (tradeId: string, newStatus: 'in-process' | 'completed') => {
    try {
      const { error } = await supabase
        .from('open_trades')
        .update({ status: newStatus })
        .eq('id', tradeId);
      
      if (error) {
        console.error('[OPERATIONS] Error updating trade status:', error);
        toast.error("Error updating status", {
          description: "There was an error updating the trade status"
        });
      } else {
        setOpenTrades(prevTrades =>
          prevTrades.map(trade =>
            trade.id === tradeId ? { ...trade, status: newStatus } : trade
          )
        );
        toast.success("Status updated", {
          description: `Trade status updated to ${newStatus}`
        });
      }
    } catch (error) {
      console.error('[OPERATIONS] Unexpected error updating trade status:', error);
      toast.error("Unexpected error", {
        description: "An unexpected error occurred while updating the trade status"
      });
    }
  };

  const handleMoveTrade = async (tradeId: string, direction: 'up' | 'down') => {
    try {
      const currentTradeIndex = openTrades.findIndex(trade => trade.id === tradeId);
      if (currentTradeIndex === -1) {
        console.warn('[OPERATIONS] Trade not found in local state');
        return;
      }
      
      const newIndex = direction === 'up' ? currentTradeIndex - 1 : currentTradeIndex + 1;
      if (newIndex < 0 || newIndex >= openTrades.length) {
        console.log('[OPERATIONS] Cannot move trade beyond list boundaries');
        return;
      }
      
      const tradeToMove = openTrades[currentTradeIndex];
      const otherTrade = openTrades[newIndex];
      
      const { error } = await supabase.rpc('swap_sort_orders', {
        table_name: 'open_trades',
        id1: tradeToMove.id,
        id2: otherTrade.id
      });
      
      if (error) {
        console.error('[OPERATIONS] Error swapping sort orders:', error);
        toast.error("Error moving trade", {
          description: "There was an error moving the trade in the list"
        });
      } else {
        const updatedTrades = [...openTrades];
        [updatedTrades[currentTradeIndex], updatedTrades[newIndex]] = [updatedTrades[newIndex], updatedTrades[currentTradeIndex]];
        setOpenTrades(updatedTrades);
        onRefresh();
        toast.success("Trade moved", {
          description: "Trade moved successfully in the list"
        });
      }
    } catch (error) {
      console.error('[OPERATIONS] Unexpected error moving trade:', error);
      toast.error("Unexpected error", {
        description: "An unexpected error occurred while moving the trade"
      });
    }
  };

  const columns: ColumnDef<OpenTrade>[] = [
    {
      accessorKey: 'trade_reference',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Trade Ref
          <ArrowUp className={cn('ml-2 h-4 w-4', column.getIsSorted() === 'desc' ? 'block' : 'none')} />
          <ArrowDown className={cn('ml-2 h-4 w-4', column.getIsSorted() === 'asc' ? 'block' : 'none')} />
        </Button>
      ),
    },
    {
      accessorKey: 'product',
      header: () => <div className="text-left">Product</div>,
      cell: ({ row }) => {
        const product = row.original.product;
        return (
          <ProductToken product={product} size="md" />
        );
      },
    },
    {
      accessorKey: 'counterparty',
      header: () => <div className="text-left">Counterparty</div>,
      cell: ({ row }) => {
        const counterparty = counterparties?.find(cp => cp.id === row.original.counterparty);
        return <div>{counterparty?.name || 'N/A'}</div>;
      },
    },
    {
      accessorKey: 'quantity',
      header: () => <div className="text-right">Quantity</div>,
      cell: ({ row }) => <div className="text-right">{row.original.quantity}</div>,
    },
    {
      accessorKey: 'unit',
      header: () => <div className="text-left">Unit</div>,
      cell: ({ row }) => <div>{row.original.unit}</div>,
    },
    {
      accessorKey: 'loading_date',
      header: () => <div className="text-left">Loading Date</div>,
      cell: ({ row }) => {
        const loadingDate = row.original.loading_date ? new Date(row.original.loading_date) : null;
        return <div>{loadingDate ? format(loadingDate, 'yyyy-MM-dd') : 'N/A'}</div>;
      },
    },
    {
      accessorKey: 'destination',
      header: () => <div className="text-left">Destination</div>,
      cell: ({ row }) => <div>{row.original.destination}</div>,
    },
    {
      accessorKey: 'vessel',
      header: () => <div className="text-left">Vessel</div>,
      cell: ({ row }) => <div>{row.original.vessel}</div>,
    },
    {
      accessorKey: 'status',
      header: () => <div className="text-left">Status</div>,
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'completed' ? 'default' : 'secondary'}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: () => <div className="text-center">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(row.original.trade_reference)}>
                <Copy className="mr-2 h-4 w-4" /> Copy trade ref
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleStatusChange(row.original.id, row.original.status === 'in-process' ? 'completed' : 'in-process')}>
                {row.original.status === 'in-process' ?
                  <>
                    <Edit className="mr-2 h-4 w-4" /> Mark as Completed
                  </>
                  :
                  <>
                    <Edit className="mr-2 h-4 w-4" /> Mark as In-Process
                  </>
                }
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMoveTrade(row.original.id, 'up')} disabled={openTrades.indexOf(row.original) === 0}>
                <ArrowUp className="mr-2 h-4 w-4" /> Move Up
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMoveTrade(row.original.id, 'down')} disabled={openTrades.indexOf(row.original) === openTrades.length - 1}>
                <ArrowDown className="mr-2 h-4 w-4" /> Move Down
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: openTrades,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {openTrades.map((trade) => (
            <TableRow key={trade.id}>
              {table.getRowModel().rows.map((row) => (
                <TableCell key={row.id}>
                  {row.getVisibleCells().map((cell) => {
                    return (
                      <div key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    );
                  })}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default OpenTradesTable;
