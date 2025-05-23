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
import { useReferenceData } from '@/hooks/useReferenceData';
import { OpenTradeFilters } from '@/hooks/useFilteredOpenTrades';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';

interface OpenTradesFilterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: OpenTradeFilters;
  onFiltersChange: (filters: OpenTradeFilters) => void;
  activeFilterCount: number;
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
  activeFilterCount
}) => {
  const [tempFilters, setTempFilters] = useState<OpenTradeFilters>(filters);
  const { 
    counterparties,
    sustainabilityOptions,
    creditStatusOptions,
    customsStatusOptions,
    productOptions,
    incoTermOptions,
    contractStatusOptions
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

      if (filters.contract_status && !Array.isArray(filters.contract_status)) {
        convertedFilters.contract_status = [filters.contract_status];
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
        options = productOptions;
        break;
      case 'counterparty':
        options = counterparties;
        break;
      case 'inco_term':
        options = incoTermOptions;
        break;
      case 'sustainability':
        options = sustainabilityOptions;
        break;
      case 'credit_status':
        options = creditStatusOptions;
        break;
      case 'customs_status':
        options = customsStatusOptions;
        break;
      case 'contract_status':
        options = contractStatusOptions;
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
    onFiltersChange(defaultFilters);
    onOpenChange(false);
  };

  // Create filter categories
  const filterCategories: FilterCategory[] = [
    {
      id: 'product',
      label: 'Product',
      options: productOptions,
      selectedOptions: Array.isArray(tempFilters.product) ? tempFilters.product : [],
      onChange: (values) => setTempFilters(prev => ({ ...prev, product: values.length ? values : undefined }))
    },
    {
      id: 'counterparty',
      label: 'Counterparty',
      options: counterparties,
      selectedOptions: Array.isArray(tempFilters.counterparty) ? tempFilters.counterparty : [],
      onChange: (values) => setTempFilters(prev => ({ ...prev, counterparty: values.length ? values : undefined }))
    },
    {
      id: 'inco_term',
      label: 'Incoterm',
      options: incoTermOptions,
      selectedOptions: Array.isArray(tempFilters.inco_term) ? tempFilters.inco_term : [],
      onChange: (values) => setTempFilters(prev => ({ ...prev, inco_term: values.length ? values : undefined }))
    },
    {
      id: 'sustainability',
      label: 'Sustainability',
      options: sustainabilityOptions,
      selectedOptions: Array.isArray(tempFilters.sustainability) ? tempFilters.sustainability : [],
      onChange: (values) => setTempFilters(prev => ({ ...prev, sustainability: values.length ? values : undefined }))
    },
    {
      id: 'credit_status',
      label: 'Credit Status',
      options: creditStatusOptions,
      selectedOptions: Array.isArray(tempFilters.credit_status) ? tempFilters.credit_status : [],
      onChange: (values) => setTempFilters(prev => ({ ...prev, credit_status: values.length ? values : undefined }))
    },
    {
      id: 'customs_status',
      label: 'Customs Status',
      options: customsStatusOptions,
      selectedOptions: Array.isArray(tempFilters.customs_status) ? tempFilters.customs_status : [],
      onChange: (values) => setTempFilters(prev => ({ ...prev, customs_status: values.length ? values : undefined }))
    },
    {
      id: 'contract_status',
      label: 'Contract Status',
      options: contractStatusOptions,
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
