import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
} from "@/components/ui/table"
import { MoreHorizontal, ArrowDown, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Link } from 'react-router-dom';
import { PhysicalTrade, UserPreferences } from '@/types';
import { formatDate } from '@/utils/dateUtils';
import { pricingTypeDisplay } from '@/utils/tradeUtils';
import FormulaCellDisplay from '@/components/trades/FormulaCellDisplay';

// Import sortable components
import { SortableTable } from '@/components/ui/sortable-table';
import { SortableTableRow } from '@/components/ui/sortable-table-row';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TableCell } from '@/components/ui/table';

const PhysicalTradeTable = ({ trades = [] }: { trades: PhysicalTrade[] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<{
    id: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [searchField, setSearchField] = useState('tradeReference');
  
  // State for user preferences
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [orderedTrades, setOrderedTrades] = useState<PhysicalTrade[]>([]);
  
  // Load user preferences
  useEffect(() => {
    const fetchUserPreferences = async () => {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('id', 'default') // Use a default ID for now, later can be user-specific
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
  
  // Apply order to trades when preferences or trades change
  useEffect(() => {
    if (!trades.length) return setOrderedTrades([]);
    
    if (userPreferences?.physical_trade_order?.length) {
      // Create a map for quick lookup
      const orderMap = new Map();
      userPreferences.physical_trade_order.forEach((id, index) => {
        orderMap.set(id, index);
      });
      
      // Sort trades based on the preferences
      const ordered = [...trades].sort((a, b) => {
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
      setOrderedTrades([...trades].sort((a, b) => 
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
    onError: (error) => {
      console.error('Failed to update trade order:', error);
      toast.error('Failed to save trade order');
    }
  });
  
  // Handle order change
  const handleOrderChange = (newItems: PhysicalTrade[]) => {
    const newOrder = newItems.map(trade => trade.id);
    updatePreferences(newOrder);
  };
  
  const filterStatusOptions = [
    { label: 'All', value: null },
    { label: 'Approved', value: 'approved' },
    { label: 'Pending', value: 'pending' },
    { label: 'Rejected', value: 'rejected' },
  ];

  const searchOptions = [
    { label: 'Trade Reference', value: 'tradeReference' },
    { label: 'Counterparty', value: 'counterparty' },
    { label: 'Product', value: 'product' },
  ];

  const handleSort = (id: string) => {
    if (sortColumn?.id === id) {
      setSortColumn(prev => ({
        id,
        direction: prev.direction === 'asc' ? 'desc' : 'asc',
      }));
    } else {
      setSortColumn({ id, direction: 'asc' });
    }
  };

  const sortTrades = (trades: PhysicalTrade[]) => {
    if (!sortColumn) return trades;

    const { id, direction } = sortColumn;

    return [...trades].sort((a, b) => {
      const aValue = (a[id as keyof PhysicalTrade] || '').toString().toLowerCase();
      const bValue = (b[id as keyof PhysicalTrade] || '').toString().toLowerCase();

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const filterTrades = (trade: PhysicalTrade) => {
    const searchTermLower = searchTerm.toLowerCase();

    const searchFieldValue = (trade[searchField as keyof PhysicalTrade] || '').toString().toLowerCase();

    const matchesSearch = searchFieldValue.includes(searchTermLower);

    const matchesStatus = !selectedStatus || trade.creditStatus === selectedStatus;

    return matchesSearch && matchesStatus;
  };

  const selectedFilterFunc = (trade: PhysicalTrade) => filterTrades(trade);

  const filteredTrades = useMemo(() => {
    if (!orderedTrades || orderedTrades.length === 0) return [];

    let filtered = [...orderedTrades];

    if (searchTerm) {
      filtered = filtered.filter(selectedFilterFunc);
    }

    if (selectedStatus) {
      filtered = filtered.filter(selectedFilterFunc);
    }

    const sorted = sortTrades(filtered);

    return sorted;
  }, [orderedTrades, searchTerm, selectedStatus, selectedFilterFunc, searchField]);

  const isLoading = !orderedTrades && trades.length > 0;
  const isError = !orderedTrades && trades.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search trades..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="flex items-center space-x-2">
          <select
            className="rounded-md border px-2 py-1"
            value={searchField}
            onChange={(e) => setSearchField(e.target.value)}
          >
            {searchOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            className="rounded-md border px-2 py-1"
            value={selectedStatus || ''}
            onChange={(e) => setSelectedStatus(e.target.value === '' ? null : e.target.value)}
          >
            {filterStatusOptions.map((option) => (
              <option key={option.value} value={option.value || ''}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Physical Trades</h2>
        <Button asChild>
          <Link to="/trades/new">Add Trade</Link>
        </Button>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30px]"></TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('tradeReference')}>
                  Trade Ref {sortColumn?.id === 'tradeReference' && (sortColumn.direction === 'asc' ? <ArrowDown className="ml-2 h-4 w-4" /> : <ArrowUp className="ml-2 h-4 w-4" />)}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('counterparty')}>
                  Counterparty {sortColumn?.id === 'counterparty' && (sortColumn.direction === 'asc' ? <ArrowDown className="ml-2 h-4 w-4" /> : <ArrowUp className="ml-2 h-4 w-4" />)}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('product')}>
                  Product {sortColumn?.id === 'product' && (sortColumn.direction === 'asc' ? <ArrowDown className="ml-2 h-4 w-4" /> : <ArrowUp className="ml-2 h-4 w-4" />)}
                </Button>
              </TableHead>
              <TableHead>Pricing</TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('createdAt')}>
                  Created At {sortColumn?.id === 'createdAt' && (sortColumn.direction === 'asc' ? <ArrowDown className="ml-2 h-4 w-4" /> : <ArrowUp className="ml-2 h-4 w-4" />)}
                </Button>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {filteredTrades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No trades found.
                </TableCell>
              </TableRow>
            ) : (
              <SortableTable
                items={filteredTrades}
                getItemId={(trade) => trade.id}
                onOrderChange={handleOrderChange}
              >
                {(sortedItems, { dragHandleProps }) => (
                  <>
                    {sortedItems.map((trade) => (
                      <SortableTableRow key={trade.id} id={trade.id}>
                        <TableCell {...dragHandleProps(trade.id)} />
                        <TableCell>
                          <Link to={`/trades/${trade.id}`} className="font-medium hover:underline">
                            {trade.tradeReference}
                          </Link>
                        </TableCell>
                        <TableCell>{trade.counterparty}</TableCell>
                        <TableCell>{trade.product}</TableCell>
                        <TableCell>
                          <FormulaCellDisplay trade={trade} />
                        </TableCell>
                        <TableCell>{formatDate(trade.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link to={`/trades/${trade.id}`}>
                                  View
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link to={`/trades/${trade.id}/edit`}>
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
    </div>
  );
};

export default PhysicalTradeTable;
