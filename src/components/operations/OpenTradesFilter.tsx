
import React, { useState, useEffect } from 'react';
import { Check, ChevronDown, ChevronUp, X } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { OpenTradeFilters } from '@/hooks/useFilteredOpenTrades';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { DatePicker } from '@/components/ui/date-picker';
import { format, parseISO } from 'date-fns';
import { formatDateForStorage } from '@/utils/dateParsingUtils';

interface OpenTradeFilterOptions {
  product: string[];
  counterparty: string[];
  incoTerm: string[];
  sustainability: string[];
  creditStatus: string[];
  customsStatus: string[];
  contractStatus: string[];
}

interface OpenTradesFilterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: OpenTradeFilters;
  onFiltersChange: (filters: OpenTradeFilters) => void;
  activeFilterCount: number;
  availableOptions: OpenTradeFilterOptions;
}

interface FilterCategory {
  id: keyof OpenTradeFilters;
  label: string;
  options: string[];
  selectedOptions: string[];
  onChange: (values: string[]) => void;
}

const OpenTradesFilter: React.FC<OpenTradesFilterProps> = ({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  activeFilterCount,
  availableOptions
}) => {
  const [tempFilters, setTempFilters] = useState<OpenTradeFilters>(filters);
  
  // Date states for the pickers
  const [loadingStartFrom, setLoadingStartFrom] = useState<Date | null>(
    tempFilters.loading_period_start_from ? new Date(tempFilters.loading_period_start_from) : null
  );
  const [loadingStartTo, setLoadingStartTo] = useState<Date | null>(
    tempFilters.loading_period_start_to ? new Date(tempFilters.loading_period_start_to) : null
  );
  const [loadingEndFrom, setLoadingEndFrom] = useState<Date | null>(
    tempFilters.loading_period_end_from ? new Date(tempFilters.loading_period_end_from) : null
  );
  const [loadingEndTo, setLoadingEndTo] = useState<Date | null>(
    tempFilters.loading_period_end_to ? new Date(tempFilters.loading_period_end_to) : null
  );

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

      if (filters.contract_status && !Array.isArray(filters.contract_status)) {
        convertedFilters.contract_status = [filters.contract_status];
      }
      
      setTempFilters(convertedFilters);
      
      // Set date states
      setLoadingStartFrom(filters.loading_period_start_from ? new Date(filters.loading_period_start_from) : null);
      setLoadingStartTo(filters.loading_period_start_to ? new Date(filters.loading_period_start_to) : null);
      setLoadingEndFrom(filters.loading_period_end_from ? new Date(filters.loading_period_end_from) : null);
      setLoadingEndTo(filters.loading_period_end_to ? new Date(filters.loading_period_end_to) : null);
    }
  }, [open, filters]);

  // Update date filters whenever date picker values change
  useEffect(() => {
    setTempFilters(prev => ({
      ...prev,
      loading_period_start_from: loadingStartFrom ? formatDateForStorage(loadingStartFrom) : undefined,
      loading_period_start_to: loadingStartTo ? formatDateForStorage(loadingStartTo) : undefined,
      loading_period_end_from: loadingEndFrom ? formatDateForStorage(loadingEndFrom) : undefined,
      loading_period_end_to: loadingEndTo ? formatDateForStorage(loadingEndTo) : undefined
    }));
  }, [loadingStartFrom, loadingStartTo, loadingEndFrom, loadingEndTo]);

  // Handle single value changes
  const handleChange = (field: keyof OpenTradeFilters, value: string) => {
    setTempFilters(prev => ({
      ...prev,
      [field]: value === "all" ? undefined : value
    }));
  };

  const handleToggleOption = (category: keyof OpenTradeFilters, option: string) => {
    setTempFilters(prev => {
      const prevOptions = Array.isArray(prev[category]) ? [...prev[category] as string[]] : [];
      const newOptions = prevOptions.includes(option)
        ? prevOptions.filter(o => o !== option)
        : [...prevOptions, option];
      
      return {
        ...prev,
        [category]: newOptions.length > 0 ? newOptions : undefined
      };
    });
  };

  const handleSelectAll = (category: keyof OpenTradeFilters, selected: boolean) => {
    let options: string[] = [];
    
    switch (category) {
      case 'product':
        options = availableOptions.product;
        break;
      case 'counterparty':
        options = availableOptions.counterparty;
        break;
      case 'inco_term':
        options = availableOptions.incoTerm;
        break;
      case 'sustainability':
        options = availableOptions.sustainability;
        break;
      case 'credit_status':
        options = availableOptions.creditStatus;
        break;
      case 'customs_status':
        options = availableOptions.customsStatus;
        break;
      case 'contract_status':
        options = availableOptions.contractStatus;
        break;
      default:
        options = [];
    }
    
    setTempFilters(prev => ({
      ...prev,
      [category]: selected ? [...options] : undefined
    }));
  };

  const handleApply = () => {
    onFiltersChange(tempFilters);
    onOpenChange(false);
  };

  const handleReset = () => {
    const defaultFilters: OpenTradeFilters = { status: 'all' };
    setTempFilters(defaultFilters);
    setLoadingStartFrom(null);
    setLoadingStartTo(null);
    setLoadingEndFrom(null);
    setLoadingEndTo(null);
    onFiltersChange(defaultFilters);
    onOpenChange(false);
  };

  // Create filter categories using available options
  const filterCategories: FilterCategory[] = [
    {
      id: 'product',
      label: 'Product',
      options: availableOptions.product,
      selectedOptions: Array.isArray(tempFilters.product) ? tempFilters.product : [],
      onChange: (values) => setTempFilters(prev => ({ ...prev, product: values.length ? values : undefined }))
    },
    {
      id: 'counterparty',
      label: 'Counterparty',
      options: availableOptions.counterparty,
      selectedOptions: Array.isArray(tempFilters.counterparty) ? tempFilters.counterparty : [],
      onChange: (values) => setTempFilters(prev => ({ ...prev, counterparty: values.length ? values : undefined }))
    },
    {
      id: 'inco_term',
      label: 'Incoterm',
      options: availableOptions.incoTerm,
      selectedOptions: Array.isArray(tempFilters.inco_term) ? tempFilters.inco_term : [],
      onChange: (values) => setTempFilters(prev => ({ ...prev, inco_term: values.length ? values : undefined }))
    },
    {
      id: 'sustainability',
      label: 'Sustainability',
      options: availableOptions.sustainability,
      selectedOptions: Array.isArray(tempFilters.sustainability) ? tempFilters.sustainability : [],
      onChange: (values) => setTempFilters(prev => ({ ...prev, sustainability: values.length ? values : undefined }))
    },
    {
      id: 'credit_status',
      label: 'Credit Status',
      options: availableOptions.creditStatus,
      selectedOptions: Array.isArray(tempFilters.credit_status) ? tempFilters.credit_status : [],
      onChange: (values) => setTempFilters(prev => ({ ...prev, credit_status: values.length ? values : undefined }))
    },
    {
      id: 'customs_status',
      label: 'Customs Status',
      options: availableOptions.customsStatus,
      selectedOptions: Array.isArray(tempFilters.customs_status) ? tempFilters.customs_status : [],
      onChange: (values) => setTempFilters(prev => ({ ...prev, customs_status: values.length ? values : undefined }))
    },
    {
      id: 'contract_status',
      label: 'Contract Status',
      options: availableOptions.contractStatus,
      selectedOptions: Array.isArray(tempFilters.contract_status) ? tempFilters.contract_status : [],
      onChange: (values) => setTempFilters(prev => ({ ...prev, contract_status: values.length ? values : undefined }))
    }
  ];

  const FilterCategorySection = ({ category }: { category: FilterCategory }) => {
    const allSelected = category.options.length > 0 && 
      category.selectedOptions.length === category.options.length;
    
    const indeterminate = 
      category.selectedOptions.length > 0 && 
      category.selectedOptions.length < category.options.length;

    return (
      <div className="space-y-2">
        {category.options.length > 0 && (
          <div className="flex items-center space-x-2 pb-2">
            <Checkbox 
              id={`select-all-${category.id}`} 
              checked={allSelected}
              className={indeterminate ? "opacity-80" : ""}
              onCheckedChange={(checked) => handleSelectAll(category.id, !!checked)}
            />
            <Label 
              htmlFor={`select-all-${category.id}`}
              className="cursor-pointer font-medium text-sm"
            >
              Select All
            </Label>
          </div>
        )}
        
        <div className="space-y-1 pl-1">
          {category.options.length > 0 ? (
            category.options.map((option) => (
              <div key={`${category.id}-${option}`} className="flex items-center space-x-2 py-1">
                <Checkbox 
                  id={`${category.id}-${option}`} 
                  checked={category.selectedOptions.includes(option)}
                  onCheckedChange={() => handleToggleOption(category.id, option)}
                />
                <Label 
                  htmlFor={`${category.id}-${option}`}
                  className="cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground italic">No options available</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Filter Open Trades</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount} active {activeFilterCount === 1 ? 'filter' : 'filters'}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="pr-4 max-h-[60vh]">
          <div className="py-4">
            {/* Text Filters */}
            <div className="space-y-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="trade_reference">Trade Reference</Label>
                <Input
                  id="trade_reference"
                  value={tempFilters.trade_reference || ''}
                  onChange={(e) => handleChange('trade_reference', e.target.value)}
                  placeholder="Filter by reference..."
                />
              </div>

              <div className="space-y-2">
                <Label>Buy/Sell</Label>
                <RadioGroup 
                  value={tempFilters.buy_sell || 'all'} 
                  onValueChange={(value) => handleChange('buy_sell', value)}
                  className="flex flex-row space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="buy_sell_all" />
                    <Label htmlFor="buy_sell_all" className="cursor-pointer">All</Label>
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

              <div className="space-y-2">
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

            {/* Date Range Filters */}
            <Accordion type="multiple" className="w-full mb-4">
              <AccordionItem value="date-ranges">
                <AccordionTrigger className="py-2 hover:no-underline">
                  <div className="flex items-center">
                    <span>Date Ranges</span>
                    {(loadingStartFrom || loadingStartTo || loadingEndFrom || loadingEndTo) && (
                      <Badge variant="secondary" className="ml-2">
                        {[
                          loadingStartFrom ? 1 : 0, 
                          loadingStartTo ? 1 : 0, 
                          loadingEndFrom ? 1 : 0, 
                          loadingEndTo ? 1 : 0
                        ].reduce((a, b) => a + b, 0)}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    {/* Loading Period Start Range */}
                    <div className="space-y-2">
                      <Label className="font-medium">Loading Period Start</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">From</Label>
                          <DatePicker 
                            date={loadingStartFrom ? loadingStartFrom : new Date()} 
                            setDate={(date) => setLoadingStartFrom(date)} 
                            disabled={false}
                            placeholder="Select start date"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">To</Label>
                          <DatePicker 
                            date={loadingStartTo ? loadingStartTo : new Date()} 
                            setDate={(date) => setLoadingStartTo(date)} 
                            disabled={false}
                            placeholder="Select end date"
                          />
                        </div>
                      </div>
                      {loadingStartFrom && loadingStartTo && (
                        <div className="flex justify-end">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              setLoadingStartFrom(null);
                              setLoadingStartTo(null);
                            }}
                          >
                            Clear
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {/* Loading Period End Range */}
                    <div className="space-y-2">
                      <Label className="font-medium">Loading Period End</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">From</Label>
                          <DatePicker 
                            date={loadingEndFrom ? loadingEndFrom : new Date()} 
                            setDate={(date) => setLoadingEndFrom(date)} 
                            disabled={false}
                            placeholder="Select start date"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">To</Label>
                          <DatePicker 
                            date={loadingEndTo ? loadingEndTo : new Date()} 
                            setDate={(date) => setLoadingEndTo(date)} 
                            disabled={false}
                            placeholder="Select end date"
                          />
                        </div>
                      </div>
                      {loadingEndFrom && loadingEndTo && (
                        <div className="flex justify-end">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              setLoadingEndFrom(null);
                              setLoadingEndTo(null);
                            }}
                          >
                            Clear
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Multi-select Filters */}
            <Accordion type="multiple" className="w-full">
              {filterCategories.map((category) => (
                <AccordionItem key={category.id} value={category.id}>
                  <AccordionTrigger className="py-2 hover:no-underline">
                    <div className="flex items-center">
                      <span>{category.label}</span>
                      {category.selectedOptions.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {category.selectedOptions.length}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <FilterCategorySection category={category} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </ScrollArea>
        
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
