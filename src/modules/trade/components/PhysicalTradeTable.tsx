import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Edit, Trash2, X, Filter, Eye, FilePlus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useTrades } from '@/modules/trade/hooks';
import { formulaToDisplayString } from '@/modules/trade/utils/formulaUtils';
import { deleteTrade } from '@/modules/trade/utils/tradeDeleteUtils';
import { usePriceSubscription } from '@/modules/trade/utils/physicalTradeSubscriptionUtils';

interface TradeFilter {
  product?: string;
  buySell?: string;
  status?: string;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  showInactive?: boolean;
}

const PhysicalTradeTable = () => {
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tradeToDelete, setTradeToDelete] = useState<string | null>(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [tradeType, setTradeType] = useState<'physical' | 'paper'>('physical');
  const [filters, setFilters] = useState<TradeFilter>({});
  const { trades, isLoading, error, refetch } = useTrades(tradeType, filters);
  const [priceUpdates, setPriceUpdates] = useState<{ [tradeLegId: string]: number }>({});

  // Subscribe to price updates for each trade leg
  usePriceSubscription(trades, setPriceUpdates);

  const handleEdit = (tradeId: string) => {
    navigate(`/risk/trades/${tradeId}`);
  };

  const handleView = (tradeId: string) => {
    navigate(`/risk/trades/view/${tradeId}`);
  };

  const handleDelete = (tradeId: string) => {
    setTradeToDelete(tradeId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (tradeToDelete) {
      const success = await deleteTrade(tradeToDelete, tradeType);
      if (success) {
        toast.success('Trade deleted successfully');
        refetch(); // Refresh the trade list
      } else {
        toast.error('Failed to delete trade');
      }
      setDeleteDialogOpen(false);
      setTradeToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setTradeToDelete(null);
  };

  const handleFilterChange = (filterUpdates: Partial<TradeFilter>) => {
    setFilters(prevFilters => ({ ...prevFilters, ...filterUpdates }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), 'PPP');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const formatFormula = (formula: any) => {
    try {
      return formulaToDisplayString(formula.tokens);
    } catch (error) {
      console.error('Error formatting formula:', error);
      return 'Invalid Formula';
    }
  };

  if (isLoading) {
    return <Card>Loading trades...</Card>;
  }

  if (error) {
    return <Card>Error: {error.message}</Card>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Physical Trades</h1>
        <div className="space-x-2">
          <Button onClick={() => setFilterDialogOpen(true)}>
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button asChild>
            <Link to="/risk/trades/new">
              <FilePlus className="h-4 w-4 mr-2" />
              Add Trade
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Buy/Sell</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Unit Price</TableHead>
              <TableHead>Formula</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Trade Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.map((trade) => (
              <TableRow key={trade.id}>
                <TableCell>{trade.product}</TableCell>
                <TableCell>{trade.buy_sell}</TableCell>
                <TableCell>{trade.quantity}</TableCell>
                <TableCell>${trade.unit_price}</TableCell>
                <TableCell>{formatFormula(trade.pricing_formula)}</TableCell>
                <TableCell>
                  <Badge>{trade.credit_status}</Badge>
                </TableCell>
                <TableCell>{formatDate(trade.trade_date)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleView(trade.id)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(trade.id)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(trade.id)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Trade</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this trade? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={cancelDelete}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Filter Trades</DialogTitle>
            <DialogDescription>
              Apply filters to narrow down the list of trades.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="product" className="text-right">
                Product
              </Label>
              <Input
                type="text"
                id="product"
                className="col-span-3"
                value={filters.product || ''}
                onChange={(e) => handleFilterChange({ product: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="buySell" className="text-right">
                Buy/Sell
              </Label>
              <Select onValueChange={(value) => handleFilterChange({ buySell: value })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Buy/Sell" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Buy">Buy</SelectItem>
                  <SelectItem value="Sell">Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select onValueChange={(value) => handleFilterChange({ status: value })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dateFrom" className="text-right">
                Date From
              </Label>
              <Input
                type="date"
                id="dateFrom"
                className="col-span-3"
                value={filters.dateFrom ? format(filters.dateFrom, 'yyyy-MM-dd') : ''}
                onChange={(e) => handleFilterChange({ dateFrom: new Date(e.target.value) })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dateTo" className="text-right">
                Date To
              </Label>
              <Input
                type="date"
                id="dateTo"
                className="col-span-3"
                value={filters.dateTo ? format(filters.dateTo, 'yyyy-MM-dd') : ''}
                onChange={(e) => handleFilterChange({ dateTo: new Date(e.target.value) })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="showInactive" className="text-right">
                Show Inactive
              </Label>
              <div className="col-span-3">
                <Checkbox
                  id="showInactive"
                  checked={filters.showInactive || false}
                  onCheckedChange={(checked) => handleFilterChange({ showInactive: checked })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={clearFilters}>
              Clear Filters
            </Button>
            <Button type="button" onClick={() => setFilterDialogOpen(false)}>
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PhysicalTradeTable;
