
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
import { Checkbox } from '@/components/ui/checkbox';
import { useReferenceData } from '@/hooks/useReferenceData';
import { OpenTradeFilters } from '@/hooks/useFilteredOpenTrades';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface OpenTradesFilterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: OpenTradeFilters;
  onFiltersChange: (filters: OpenTradeFilters) => void;
  activeFilterCount: number;
}

// Create a reusable multi-select component
const MultiSelectFilter = ({ 
  label, 
  options, 
  selectedValues, 
  onChange 
}: { 
  label: string;
  options: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
}) => {
  const toggleOption = (option: string) => {
    const newValues = selectedValues.includes(option)
      ? selectedValues.filter(val => val !== option)
      : [...selectedValues, option];
    
    onChange(newValues.length ? newValues : []); // If empty, pass empty array
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label>{label}</Label>
        {selectedValues.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onChange([])} 
            className="h-6 px-2 text-xs"
          >
            Clear
          </Button>
        )}
      </div>
      <ScrollArea className="h-40 border rounded-md p-2 bg-white">
        <div className="space-y-2">
          {options.map(option => (
            <div key={option} className="flex items-center space-x-2 py-1">
              <Checkbox 
                id={`${label}-${option}`} 
                checked={selectedValues.includes(option)}
                onCheckedChange={() => toggleOption(option)}
              />
              <Label 
                htmlFor={`${label}-${option}`} 
                className="cursor-pointer text-sm flex-1"
              >
                {option}
              </Label>
            </div>
          ))}
        </div>
      </ScrollArea>
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {selectedValues.map(val => (
            <Badge key={val} variant="secondary" className="text-xs">
              {val}
              <X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => toggleOption(val)} />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

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
      // Convert single value filters to arrays for multi-select
      const convertedFilters: OpenTradeFilters = { ...filters };
      
      // Convert string values to arrays where needed
      if (filters.product && !Array.isArray(filters.product)) {
        convertedFilters.product = [filters.product];
      }
      
      if (filters.counterparty && !Array.isArray(filters.counterparty)) {
        convertedFilters.counterparty = [filters.counterparty];
      }
      
      if (filters.inco_term && !Array.isArray(filters.inco_term)) {
        convertedFilters.inco_term = [filters.inco_term];
      }
      
      if (filters.sustainability && !Array.isArray(filters.sustainability)) {
        convertedFilters.sustainability = [filters.sustainability];
      }
      
      if (filters.credit_status && !Array.isArray(filters.credit_status)) {
        convertedFilters.credit_status = [filters.credit_status];
      }
      
      if (filters.customs_status && !Array.isArray(filters.customs_status)) {
        convertedFilters.customs_status = [filters.customs_status];
      }
      
      setTempFilters(convertedFilters);
    }
  }, [open, filters]);

  // Handle single value changes
  const handleChange = (field: keyof OpenTradeFilters, value: string) => {
    setTempFilters(prev => ({
      ...prev,
      [field]: value === "all" ? undefined : value
    }));
  };

  // Handle multi-select changes
  const handleMultiSelectChange = (field: keyof OpenTradeFilters, values: string[]) => {
    setTempFilters(prev => ({
      ...prev,
      [field]: values.length > 0 ? values : undefined
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
      <DialogContent className="max-w-[700px] max-h-[80vh] overflow-y-auto">
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

          {/* Multi-select Product Filter */}
          <MultiSelectFilter
            label="Products"
            options={productOptions}
            selectedValues={Array.isArray(tempFilters.product) ? tempFilters.product : []}
            onChange={(values) => handleMultiSelectChange('product', values)}
          />

          {/* Multi-select Counterparty Filter */}
          <MultiSelectFilter
            label="Counterparties"
            options={counterparties}
            selectedValues={Array.isArray(tempFilters.counterparty) ? tempFilters.counterparty : []}
            onChange={(values) => handleMultiSelectChange('counterparty', values)}
          />

          {/* Multi-select Incoterm Filter */}
          <MultiSelectFilter
            label="Incoterms"
            options={incoTermOptions}
            selectedValues={Array.isArray(tempFilters.inco_term) ? tempFilters.inco_term : []}
            onChange={(values) => handleMultiSelectChange('inco_term', values)}
          />

          {/* Multi-select Sustainability Filter */}
          <MultiSelectFilter
            label="Sustainability"
            options={sustainabilityOptions}
            selectedValues={Array.isArray(tempFilters.sustainability) ? tempFilters.sustainability : []}
            onChange={(values) => handleMultiSelectChange('sustainability', values)}
          />

          {/* Multi-select Credit Status Filter */}
          <MultiSelectFilter
            label="Credit Status"
            options={creditStatusOptions}
            selectedValues={Array.isArray(tempFilters.credit_status) ? tempFilters.credit_status : []}
            onChange={(values) => handleMultiSelectChange('credit_status', values)}
          />

          {/* Multi-select Customs Status Filter */}
          <MultiSelectFilter
            label="Customs Status"
            options={customsStatusOptions}
            selectedValues={Array.isArray(tempFilters.customs_status) ? tempFilters.customs_status : []}
            onChange={(values) => handleMultiSelectChange('customs_status', values)}
          />

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
