
import React, { useState, useEffect } from 'react';
import { Check, X, Filter as FilterIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useReferenceData } from '@/hooks/useReferenceData';
import { OpenTradeFilters } from '@/hooks/useFilteredOpenTrades';

interface OpenTradesFilterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: OpenTradeFilters;
  onFiltersChange: (filters: OpenTradeFilters) => void;
  activeFilterCount: number;
}

const OpenTradesFilter: React.FC<OpenTradesFilterProps> = ({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  activeFilterCount
}) => {
  const [tempFilters, setTempFilters] = useState<OpenTradeFilters>(filters);
  const { 
    counterparties,
    sustainabilityOptions,
    creditStatusOptions,
    customsStatusOptions,
    productOptions,
    incoTermOptions
  } = useReferenceData();

  // Reset temporary filters when dialog opens
  useEffect(() => {
    if (open) {
      setTempFilters(filters);
    }
  }, [open, filters]);

  const handleChange = (field: keyof OpenTradeFilters, value: string) => {
    setTempFilters(prev => ({
      ...prev,
      [field]: value === "all" ? undefined : value
    }));
  };

  const handleApply = () => {
    onFiltersChange(tempFilters);
    onOpenChange(false);
  };

  const handleReset = () => {
    const defaultFilters: OpenTradeFilters = { status: 'all' };
    setTempFilters(defaultFilters);
    onFiltersChange(defaultFilters);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Filter Open Trades</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {/* Trade Reference Filter */}
          <div className="space-y-2">
            <Label htmlFor="trade_reference">Trade Reference</Label>
            <Input
              id="trade_reference"
              value={tempFilters.trade_reference || ''}
              onChange={(e) => handleChange('trade_reference', e.target.value)}
              placeholder="Filter by reference..."
            />
          </div>

          {/* Buy/Sell Filter */}
          <div className="space-y-2">
            <Label htmlFor="buy_sell">Buy/Sell</Label>
            <Select 
              value={tempFilters.buy_sell || "all"} 
              onValueChange={(value) => handleChange('buy_sell', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="sell">Sell</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Product Filter */}
          <div className="space-y-2">
            <Label htmlFor="product">Product</Label>
            <Select 
              value={tempFilters.product || "all"} 
              onValueChange={(value) => handleChange('product', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All products</SelectItem>
                {productOptions.map(product => (
                  <SelectItem key={product} value={product}>{product}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Counterparty Filter */}
          <div className="space-y-2">
            <Label htmlFor="counterparty">Counterparty</Label>
            <Select 
              value={tempFilters.counterparty || "all"} 
              onValueChange={(value) => handleChange('counterparty', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All counterparties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All counterparties</SelectItem>
                {counterparties.map(cp => (
                  <SelectItem key={cp} value={cp}>{cp}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Incoterm Filter */}
          <div className="space-y-2">
            <Label htmlFor="inco_term">Incoterm</Label>
            <Select 
              value={tempFilters.inco_term || "all"} 
              onValueChange={(value) => handleChange('inco_term', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All incoterms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All incoterms</SelectItem>
                {incoTermOptions.map(term => (
                  <SelectItem key={term} value={term}>{term}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sustainability Filter */}
          <div className="space-y-2">
            <Label htmlFor="sustainability">Sustainability</Label>
            <Select 
              value={tempFilters.sustainability || "all"} 
              onValueChange={(value) => handleChange('sustainability', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {sustainabilityOptions.map(option => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Credit Status Filter */}
          <div className="space-y-2">
            <Label htmlFor="credit_status">Credit Status</Label>
            <Select 
              value={tempFilters.credit_status || "all"} 
              onValueChange={(value) => handleChange('credit_status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {creditStatusOptions.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Customs Status Filter */}
          <div className="space-y-2">
            <Label htmlFor="customs_status">Customs Status</Label>
            <Select 
              value={tempFilters.customs_status || "all"} 
              onValueChange={(value) => handleChange('customs_status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {customsStatusOptions.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter (in-process, completed) */}
          <div className="space-y-2 col-span-1 md:col-span-2">
            <Label>Completion Status</Label>
            <RadioGroup 
              value={tempFilters.status || 'all'} 
              onValueChange={(value) => handleChange('status', value as 'all' | 'in-process' | 'completed')}
              className="flex flex-row space-x-4"
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
        </div>
        
        <DialogFooter>
          <div className="flex justify-between w-full">
            <Button 
              variant="outline" 
              onClick={handleReset}
              className="flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              Reset All
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
                Apply Filters
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OpenTradesFilter;
