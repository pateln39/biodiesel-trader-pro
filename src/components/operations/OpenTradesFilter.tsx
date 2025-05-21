
import React from 'react';
import { Check, X, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useReferenceData } from '@/hooks/useReferenceData';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

export interface OpenTradesFilters {
  status: 'all' | 'in-process' | 'completed';
  counterparty?: string;
  product?: string;
  sustainability?: string;
  loadingStartDate?: Date;
  loadingEndDate?: Date;
  buySell?: 'all' | 'buy' | 'sell';
}

interface OpenTradesFilterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: OpenTradesFilters;
  onFiltersChange: (filters: OpenTradesFilters) => void;
}

const OpenTradesFilter: React.FC<OpenTradesFilterProps> = ({
  open,
  onOpenChange,
  filters,
  onFiltersChange
}) => {
  const [tempFilters, setTempFilters] = React.useState<OpenTradesFilters>(filters);
  const { counterparties, productOptions, sustainabilityOptions } = useReferenceData();

  React.useEffect(() => {
    setTempFilters(filters);
  }, [filters, open]);

  const handleApply = () => {
    onFiltersChange(tempFilters);
    onOpenChange(false);
  };

  const handleReset = () => {
    const resetFilters: OpenTradesFilters = {
      status: 'all',
      counterparty: undefined,
      product: undefined,
      sustainability: undefined,
      loadingStartDate: undefined,
      loadingEndDate: undefined,
      buySell: 'all'
    };
    setTempFilters(resetFilters);
    onFiltersChange(resetFilters);
    onOpenChange(false);
  };

  const updateFilter = <K extends keyof OpenTradesFilters>(
    key: K, 
    value: OpenTradesFilters[K]
  ) => {
    setTempFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Filter Open Trades</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-6">
          {/* Status Filter */}
          <div className="space-y-2">
            <Label>Status</Label>
            <RadioGroup 
              value={tempFilters.status} 
              onValueChange={(value) => updateFilter('status', value as 'all' | 'in-process' | 'completed')}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="cursor-pointer">All</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="in-process" id="in-process" />
                <Label htmlFor="in-process" className="cursor-pointer">In Process</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="completed" id="completed" />
                <Label htmlFor="completed" className="cursor-pointer">Completed</Label>
              </div>
            </RadioGroup>
          </div>
          
          {/* Buy/Sell Filter */}
          <div className="space-y-2">
            <Label>Buy/Sell</Label>
            <RadioGroup 
              value={tempFilters.buySell || 'all'} 
              onValueChange={(value) => updateFilter('buySell', value as 'all' | 'buy' | 'sell')}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="bs-all" />
                <Label htmlFor="bs-all" className="cursor-pointer">All</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="buy" id="buy" />
                <Label htmlFor="buy" className="cursor-pointer">Buy</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sell" id="sell" />
                <Label htmlFor="sell" className="cursor-pointer">Sell</Label>
              </div>
            </RadioGroup>
          </div>
          
          {/* Counterparty Filter */}
          <div className="space-y-2">
            <Label>Counterparty</Label>
            <Select
              value={tempFilters.counterparty || ''}
              onValueChange={(value) => updateFilter('counterparty', value || undefined)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select counterparty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any counterparty</SelectItem>
                {counterparties.map((cp) => (
                  <SelectItem key={cp} value={cp}>{cp}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Product Filter */}
          <div className="space-y-2">
            <Label>Product</Label>
            <Select 
              value={tempFilters.product || ''}
              onValueChange={(value) => updateFilter('product', value || undefined)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any product</SelectItem>
                {productOptions.map((product) => (
                  <SelectItem key={product} value={product}>{product}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Sustainability Filter */}
          <div className="space-y-2">
            <Label>Sustainability</Label>
            <Select 
              value={tempFilters.sustainability || ''}
              onValueChange={(value) => updateFilter('sustainability', value || undefined)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select sustainability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any sustainability</SelectItem>
                {sustainabilityOptions.map((sustainability) => (
                  <SelectItem key={sustainability} value={sustainability}>{sustainability}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Loading Period Date Range */}
          <div className="grid grid-cols-2 gap-4">
            {/* Loading Start Date */}
            <div className="space-y-2">
              <Label>Loading Period Start</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !tempFilters.loadingStartDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {tempFilters.loadingStartDate ? (
                      format(tempFilters.loadingStartDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={tempFilters.loadingStartDate}
                    onSelect={(date) => updateFilter('loadingStartDate', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {tempFilters.loadingStartDate && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs"
                  onClick={() => updateFilter('loadingStartDate', undefined)}
                >
                  Clear
                </Button>
              )}
            </div>
                
            {/* Loading End Date */}
            <div className="space-y-2">
              <Label>Loading Period End</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !tempFilters.loadingEndDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {tempFilters.loadingEndDate ? (
                      format(tempFilters.loadingEndDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={tempFilters.loadingEndDate}
                    onSelect={(date) => updateFilter('loadingEndDate', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {tempFilters.loadingEndDate && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs"
                  onClick={() => updateFilter('loadingEndDate', undefined)}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <div className="flex justify-between w-full">
            <Button 
              variant="outline" 
              onClick={handleReset}
              className="flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              Reset
            </Button>
            <div className="flex gap-2">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button 
                onClick={handleApply}
                className="flex items-center gap-1"
              >
                <Check className="h-4 w-4" />
                Apply
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OpenTradesFilter;
