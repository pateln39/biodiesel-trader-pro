import React from 'react';
import { Check, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
import { TradeFilterOptions } from '@/hooks/useFilteredTrades';

interface FilterCategory {
  id: keyof TradeFilterOptions;
  label: string;
  options: string[];
  selectedOptions: string[];
  onChange: (value: string[]) => void;
}

interface TradesFilterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filterOptions: Partial<TradeFilterOptions>; // Updated to accept Partial
  availableOptions: {
    buySell: string[];
    product: string[];
    sustainability: string[];
    incoTerm: string[];
    creditStatus: string[];
    customsStatus: string[];
    contractStatus: string[];
    pricingType: string[];
  };
  onFilterChange: (filters: Partial<TradeFilterOptions>) => void; // Updated to return Partial
}

const TradesFilter: React.FC<TradesFilterProps> = ({
  open,
  onOpenChange,
  filterOptions,
  availableOptions,
  onFilterChange
}) => {
  const [tempFilters, setTempFilters] = React.useState<Partial<TradeFilterOptions>>({ ...filterOptions });

  React.useEffect(() => {
    if (open) {
      setTempFilters({ ...filterOptions });
    }
  }, [filterOptions, open]);

  const handleToggleOption = (category: keyof TradeFilterOptions, option: string) => {
    setTempFilters(prev => {
      const currentValue = prev[category];
      if (Array.isArray(currentValue)) {
        const newOptions = currentValue.includes(option)
          ? currentValue.filter(o => o !== option)
          : [...currentValue, option];
        
        return {
          ...prev,
          [category]: newOptions
        };
      }
      return prev;
    });
  };

  const handleSelectAll = (category: keyof TradeFilterOptions, selected: boolean) => {
    if (category in availableOptions) {
      setTempFilters(prev => ({
        ...prev,
        [category]: selected ? [...availableOptions[category as keyof typeof availableOptions]] : []
      }));
    }
  };

  const handleTextChange = (category: keyof TradeFilterOptions, value: string) => {
    setTempFilters(prev => ({
      ...prev,
      [category]: value || undefined
    }));
  };

  const handleDateChange = (category: keyof TradeFilterOptions, date: Date | undefined) => {
    setTempFilters(prev => ({
      ...prev,
      [category]: date
    }));
  };

  const clearDateRange = (fromKey: keyof TradeFilterOptions, toKey: keyof TradeFilterOptions) => {
    setTempFilters(prev => ({
      ...prev,
      [fromKey]: undefined,
      [toKey]: undefined
    }));
  };

  const handleApply = () => {
    onFilterChange(tempFilters);
    onOpenChange(false);
  };

  const handleReset = () => {
    const emptyFilters: Partial<TradeFilterOptions> = {
      tradeReference: undefined,
      buySell: [],
      product: [],
      sustainability: [],
      incoTerm: [],
      creditStatus: [],
      customsStatus: [],
      contractStatus: [],
      pricingType: [],
      loadingPeriodStartFrom: undefined,
      loadingPeriodStartTo: undefined,
      loadingPeriodEndFrom: undefined,
      loadingPeriodEndTo: undefined,
      pricingPeriodStartFrom: undefined,
      pricingPeriodStartTo: undefined,
      pricingPeriodEndFrom: undefined,
      pricingPeriodEndTo: undefined,
    };
    setTempFilters(emptyFilters);
    onFilterChange(emptyFilters);
    onOpenChange(false);
  };

  // Create filter categories for checkbox arrays - Updated to handle potentially undefined arrays
  const filterCategories: FilterCategory[] = [
    {
      id: 'buySell',
      label: 'Buy/Sell',
      options: availableOptions.buySell,
      selectedOptions: tempFilters.buySell || [],
      onChange: (values) => setTempFilters(prev => ({ ...prev, buySell: values }))
    },
    {
      id: 'product',
      label: 'Product',
      options: availableOptions.product,
      selectedOptions: tempFilters.product || [],
      onChange: (values) => setTempFilters(prev => ({ ...prev, product: values }))
    },
    {
      id: 'sustainability',
      label: 'Sustainability',
      options: availableOptions.sustainability,
      selectedOptions: tempFilters.sustainability || [],
      onChange: (values) => setTempFilters(prev => ({ ...prev, sustainability: values }))
    },
    {
      id: 'incoTerm',
      label: 'Incoterm',
      options: availableOptions.incoTerm,
      selectedOptions: tempFilters.incoTerm || [],
      onChange: (values) => setTempFilters(prev => ({ ...prev, incoTerm: values }))
    },
    {
      id: 'creditStatus',
      label: 'Credit Status',
      options: availableOptions.creditStatus,
      selectedOptions: tempFilters.creditStatus || [],
      onChange: (values) => setTempFilters(prev => ({ ...prev, creditStatus: values }))
    },
    {
      id: 'customsStatus',
      label: 'Customs Status',
      options: availableOptions.customsStatus,
      selectedOptions: tempFilters.customsStatus || [],
      onChange: (values) => setTempFilters(prev => ({ ...prev, customsStatus: values }))
    },
    {
      id: 'contractStatus',
      label: 'Contract Status',
      options: availableOptions.contractStatus,
      selectedOptions: tempFilters.contractStatus || [],
      onChange: (values) => setTempFilters(prev => ({ ...prev, contractStatus: values }))
    },
    {
      id: 'pricingType',
      label: 'Pricing Type',
      options: availableOptions.pricingType,
      selectedOptions: tempFilters.pricingType || [],
      onChange: (values) => setTempFilters(prev => ({ ...prev, pricingType: values }))
    }
  ];

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    
    // Text filters
    if (tempFilters.tradeReference) count++;
    
    // Array filters
    Object.values(tempFilters).forEach(filters => {
      if (Array.isArray(filters) && filters.length > 0) {
        count++;
      }
    });
    
    // Date range filters (count each range as one filter)
    const dateRanges = [
      { from: tempFilters.loadingPeriodStartFrom, to: tempFilters.loadingPeriodStartTo },
      { from: tempFilters.loadingPeriodEndFrom, to: tempFilters.loadingPeriodEndTo },
      { from: tempFilters.pricingPeriodStartFrom, to: tempFilters.pricingPeriodStartTo },
      { from: tempFilters.pricingPeriodEndFrom, to: tempFilters.pricingPeriodEndTo },
    ];
    
    dateRanges.forEach(range => {
      if (range.from || range.to) count++;
    });
    
    return count;
  };

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
                  {option.charAt(0).toUpperCase() + option.slice(1)}
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

  const DateRangeSection = ({ 
    title, 
    fromKey, 
    toKey 
  }: { 
    title: string;
    fromKey: keyof TradeFilterOptions;
    toKey: keyof TradeFilterOptions;
  }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">{title}</h4>
        {(tempFilters[fromKey] || tempFilters[toKey]) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => clearDateRange(fromKey, toKey)}
            className="h-6 px-2 text-xs"
          >
            Clear
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-muted-foreground">From</Label>
          <DatePicker
            date={tempFilters[fromKey] as Date || new Date()}
            setDate={(date) => handleDateChange(fromKey, date)}
            placeholder="From date"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">To</Label>
          <DatePicker
            date={tempFilters[toKey] as Date || new Date()}
            setDate={(date) => handleDateChange(toKey, date)}
            placeholder="To date"
          />
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Filter Trades</span>
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFilterCount()} active {getActiveFilterCount() === 1 ? 'filter' : 'filters'}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="pr-4 max-h-[60vh]">
          <div className="py-4">
            <Accordion type="multiple" className="w-full">
              {/* Trade Reference */}
              <AccordionItem value="tradeReference">
                <AccordionTrigger className="py-2 hover:no-underline">
                  <div className="flex items-center">
                    <span>Trade Reference</span>
                    {tempFilters.tradeReference && (
                      <Badge variant="secondary" className="ml-2">1</Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <Input
                      placeholder="Search trade reference..."
                      value={tempFilters.tradeReference || ''}
                      onChange={(e) => handleTextChange('tradeReference', e.target.value)}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Date Ranges */}
              <AccordionItem value="dateRanges">
                <AccordionTrigger className="py-2 hover:no-underline">
                  <div className="flex items-center">
                    <span>Date Ranges</span>
                    {/* Show count of active date ranges */}
                    {(() => {
                      const activeRanges = [
                        { from: tempFilters.loadingPeriodStartFrom, to: tempFilters.loadingPeriodStartTo },
                        { from: tempFilters.loadingPeriodEndFrom, to: tempFilters.loadingPeriodEndTo },
                        { from: tempFilters.pricingPeriodStartFrom, to: tempFilters.pricingPeriodStartTo },
                        { from: tempFilters.pricingPeriodEndFrom, to: tempFilters.pricingPeriodEndTo },
                      ].filter(range => range.from || range.to).length;
                      
                      return activeRanges > 0 && (
                        <Badge variant="secondary" className="ml-2">{activeRanges}</Badge>
                      );
                    })()}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <DateRangeSection 
                      title="Loading Period Start" 
                      fromKey="loadingPeriodStartFrom" 
                      toKey="loadingPeriodStartTo" 
                    />
                    <DateRangeSection 
                      title="Loading Period End" 
                      fromKey="loadingPeriodEndFrom" 
                      toKey="loadingPeriodEndTo" 
                    />
                    <DateRangeSection 
                      title="Pricing Period Start" 
                      fromKey="pricingPeriodStartFrom" 
                      toKey="pricingPeriodStartTo" 
                    />
                    <DateRangeSection 
                      title="Pricing Period End" 
                      fromKey="pricingPeriodEndFrom" 
                      toKey="pricingPeriodEndTo" 
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Filter categories with checkboxes */}
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

export default TradesFilter;
