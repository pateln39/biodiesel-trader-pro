
import React from 'react';
import { Check, ChevronDown, ChevronUp, X } from 'lucide-react';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

// Define interface for filter options
export interface FilterOptions {
  status: string[];
  product: string[];
  buySell: string[];
  incoTerm: string[];
  sustainability: string[];
  counterparty: string[];
  creditStatus: string[];
  customsStatus: string[];
  loadport: string[];
  loadportInspector: string[];
  disport: string[];
  disportInspector: string[];
}

interface FilterCategory {
  id: keyof FilterOptions;
  label: string;
  options: string[];
  selectedOptions: string[];
  onChange: (value: string[]) => void;
}

interface MovementsFilterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filterOptions: FilterOptions;
  availableOptions: {
    status: string[];
    product: string[];
    buySell: string[];
    incoTerm: string[];
    sustainability: string[];
    counterparty: string[];
    creditStatus: string[];
    customsStatus: string[];
    loadport: string[];
    loadportInspector: string[];
    disport: string[];
    disportInspector: string[];
  };
  onFilterChange: (filters: FilterOptions) => void;
}

const MovementsFilter: React.FC<MovementsFilterProps> = ({
  open,
  onOpenChange,
  filterOptions,
  availableOptions,
  onFilterChange
}) => {
  const [tempFilters, setTempFilters] = React.useState<FilterOptions>({ ...filterOptions });

  React.useEffect(() => {
    if (open) {
      setTempFilters({ ...filterOptions });
    }
  }, [filterOptions, open]);

  const handleToggleOption = (category: keyof FilterOptions, option: string) => {
    setTempFilters(prev => {
      const prevOptions = [...prev[category]];
      const newOptions = prevOptions.includes(option)
        ? prevOptions.filter(o => o !== option)
        : [...prevOptions, option];
      
      return {
        ...prev,
        [category]: newOptions
      };
    });
  };

  const handleSelectAll = (category: keyof FilterOptions, selected: boolean) => {
    setTempFilters(prev => ({
      ...prev,
      [category]: selected ? [...availableOptions[category]] : []
    }));
  };

  const handleApply = () => {
    onFilterChange(tempFilters);
    onOpenChange(false);
  };

  const handleReset = () => {
    const emptyFilters: FilterOptions = {
      status: [],
      product: [],
      buySell: [],
      incoTerm: [],
      sustainability: [],
      counterparty: [],
      creditStatus: [],
      customsStatus: [],
      loadport: [],
      loadportInspector: [],
      disport: [],
      disportInspector: [],
    };
    setTempFilters(emptyFilters);
    onFilterChange(emptyFilters);
    onOpenChange(false);
  };

  // Create filter categories
  const filterCategories: FilterCategory[] = [
    {
      id: 'status',
      label: 'Status',
      options: availableOptions.status,
      selectedOptions: tempFilters.status,
      onChange: (values) => setTempFilters(prev => ({ ...prev, status: values }))
    },
    {
      id: 'product',
      label: 'Product',
      options: availableOptions.product,
      selectedOptions: tempFilters.product,
      onChange: (values) => setTempFilters(prev => ({ ...prev, product: values }))
    },
    {
      id: 'buySell',
      label: 'Buy/Sell',
      options: availableOptions.buySell,
      selectedOptions: tempFilters.buySell,
      onChange: (values) => setTempFilters(prev => ({ ...prev, buySell: values }))
    },
    {
      id: 'incoTerm',
      label: 'Incoterm',
      options: availableOptions.incoTerm,
      selectedOptions: tempFilters.incoTerm,
      onChange: (values) => setTempFilters(prev => ({ ...prev, incoTerm: values }))
    },
    {
      id: 'sustainability',
      label: 'Sustainability',
      options: availableOptions.sustainability,
      selectedOptions: tempFilters.sustainability,
      onChange: (values) => setTempFilters(prev => ({ ...prev, sustainability: values }))
    },
    {
      id: 'counterparty',
      label: 'Counterparty',
      options: availableOptions.counterparty,
      selectedOptions: tempFilters.counterparty,
      onChange: (values) => setTempFilters(prev => ({ ...prev, counterparty: values }))
    },
    {
      id: 'creditStatus',
      label: 'Credit Status',
      options: availableOptions.creditStatus,
      selectedOptions: tempFilters.creditStatus,
      onChange: (values) => setTempFilters(prev => ({ ...prev, creditStatus: values }))
    },
    {
      id: 'customsStatus',
      label: 'Customs Status',
      options: availableOptions.customsStatus,
      selectedOptions: tempFilters.customsStatus,
      onChange: (values) => setTempFilters(prev => ({ ...prev, customsStatus: values }))
    },
    {
      id: 'loadport',
      label: 'Loadport',
      options: availableOptions.loadport,
      selectedOptions: tempFilters.loadport,
      onChange: (values) => setTempFilters(prev => ({ ...prev, loadport: values }))
    },
    {
      id: 'loadportInspector',
      label: 'Loadport Inspector',
      options: availableOptions.loadportInspector,
      selectedOptions: tempFilters.loadportInspector,
      onChange: (values) => setTempFilters(prev => ({ ...prev, loadportInspector: values }))
    },
    {
      id: 'disport',
      label: 'Disport',
      options: availableOptions.disport,
      selectedOptions: tempFilters.disport,
      onChange: (values) => setTempFilters(prev => ({ ...prev, disport: values }))
    },
    {
      id: 'disportInspector',
      label: 'Disport Inspector',
      options: availableOptions.disportInspector,
      selectedOptions: tempFilters.disportInspector,
      onChange: (values) => setTempFilters(prev => ({ ...prev, disportInspector: values }))
    }
  ];

  // Count active filters
  const getActiveFilterCount = () => {
    return Object.values(tempFilters).reduce((count, filters) => count + filters.length, 0);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Filter Movements</span>
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

export default MovementsFilter;
