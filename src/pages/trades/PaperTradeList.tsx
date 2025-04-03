
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { usePaperTrades } from '@/hooks/usePaperTrades';
import { PaperTrade } from '@/types/paper';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { confirm } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

// Import sortable components
import { SortableTable } from '@/components/ui/sortable-table';
import { SortableTableRow } from '@/components/ui/sortable-table-row';
import { TableCell } from '@/components/ui/table';
import { Table, TableHeader, TableBody, TableRow, TableHead } from '@/components/ui/table';
import { useTradeOrder } from '@/hooks/useTradeOrder';
import { supabase } from '@/integrations/supabase/client';

const PaperTradeList: React.FC = () => {
  const navigate = useNavigate();
  const { paperTrades, loading, refetchPaperTrades } = usePaperTrades();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState('tradeReference');
  
  // Use the refactored hook for ordering trades
  const { orderedTrades, handleOrderChange } = useTradeOrder<PaperTrade>(
    paperTrades,
    'paper_trade_order'
  );
  
  console.log('[PaperTradeList] Rendering with trades:', { 
    paperTrades: paperTrades.length,
    orderedTrades: orderedTrades.length
  });
  
  const filteredTrades = React.useMemo(() => {
    if (!orderedTrades.length) return [];
    
    const term = searchTerm.toLowerCase();
    
    return orderedTrades.filter((trade) => {
      if (searchField === 'tradeReference') {
        return trade.tradeReference.toLowerCase().includes(term);
      } else if (searchField === 'counterparty') {
        return trade.counterparty.toLowerCase().includes(term);
      }
      return true;
    });
  }, [orderedTrades, searchTerm, searchField]);

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Are you sure?',
      description: 'This will permanently delete the trade. Are you sure?',
    });

    if (!confirmed) {
      return;
    }

    try {
      const { error } = await supabase
        .from('paper_trades')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Error deleting trade: ${error.message}`);
      }

      toast.success('Trade deleted successfully');
      refetchPaperTrades();
    } catch (error: any) {
      toast.error('Failed to delete trade', {
        description: error.message,
      });
    }
  };

  // Debug logging for drag and drop
  console.log('[PaperTradeList] Filtered trades ready for rendering:', filteredTrades.length);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <CardHeader className="pl-0">
          <CardTitle>Paper Trades</CardTitle>
        </CardHeader>
        <Button size="sm" asChild>
          <Link to="/trades/paper/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Trade
          </Link>
        </Button>
      </div>

      <Separator />

      <div className="flex items-center justify-between py-2">
        <div className="flex items-center">
          <Label htmlFor="search" className="mr-2">
            Search:
          </Label>
          <Input
            id="search"
            type="search"
            placeholder="Search trades..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
          <Label htmlFor="searchField" className="ml-4 mr-2">
            Search Field:
          </Label>
          <select
            id="searchField"
            value={searchField}
            onChange={(e) => setSearchField(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1.5 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="tradeReference">Trade Reference</option>
            <option value="counterparty">Counterparty</option>
          </select>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30px]"></TableHead>
              <TableHead>Trade Ref</TableHead>
              <TableHead>Counterparty</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {!paperTrades.length ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  {loading ? "Loading..." : "No paper trades found."}
                </TableCell>
              </TableRow>
            ) : filteredTrades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No matching paper trades found.
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
                        <TableCell>{trade.tradeReference}</TableCell>
                        <TableCell>{trade.counterparty}</TableCell>
                        <TableCell>
                          {new Date(trade.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/trades/paper/edit/${trade.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(trade.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

export default PaperTradeList;
