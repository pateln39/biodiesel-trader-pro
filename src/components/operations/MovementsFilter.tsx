
import React from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
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
  filterOptions?: FilterOptions;
  availableOptions?: {
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
  onFilterChange?: (filters: FilterOptions) => void;
  // For backward compatibility
  selectedStatuses?: string[];
  onStatusesChange?: (statuses: string[]) => void;
}

// Default filter options when none are provided
const defaultAvailableOptions = {
  status: ['scheduled', 'in progress', 'completed', 'cancelled'],
  product: [],
  buySell: ['buy', 'sell'],
  incoTerm: [],
  sustainability: [],
  counterparty: [],
  creditStatus: [],
  customsStatus: [],
  loadport: [],
  loadportInspector: [],
  disport: [],
  disportInspector: []
};

const MovementsFilter: React.FC<MovementsFilterProps> = ({
  open,
  onOpenChange,
  filterOptions,
  availableOptions = defaultAvailableOptions,
  onFilterChange,
  // For backward compatibility
  selectedStatuses = [],
  onStatusesChange
}) => {
  const [tempFilters, setTempFilters] = React.useState<FilterOptions>(() => {
    if (filterOptions) {
      return { ...filterOptions };
    } else {
      return {
        status: [...(selectedStatuses || [])],
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
        disportInspector: []
      };
    }
  });

  React.useEffect(() => {
    if (open) {
      if (filterOptions) {
        setTempFilters({ ...filterOptions });
      } else if (selectedStatuses) {
        setTempFilters(prev => ({ ...prev, status: [...selectedStatuses] }));
      }
    }
  }, [filterOptions, selectedStatuses, open]);

  const handleToggleOption = (category: keyof FilterOptions, option: string) => {
    setTempFilters(prev => {
      const updated = { ...prev };
      if (updated[category].includes(option)) {
        updated[category] = updated[category].filter(o => o !== option);
      } else {
        updated[category] = [...updated[category], option];
      }
      return updated;
    });
  };

  const handleSelectAll = (category: keyof FilterOptions, selected: boolean) => {
    setTempFilters(prev => {
      const updated = { ...prev };
      updated[category] = selected ? [...availableOptions[category]] : [];
      return updated;
    });
  };

  const handleApply = () => {
    if (onFilterChange) {
      onFilterChange(tempFilters);
    } else if (onStatusesChange) {
      onStatusesChange(tempFilters.status);
    }
    onOpenChange(false);
  };

  const handleReset = () => {
    const resetFilters: FilterOptions = {
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
      disportInspector: []
    };
    
    setTempFilters(resetFilters);
    
    if (onFilterChange) {
      onFilterChange(resetFilters);
    } else if (onStatusesChange) {
      onStatusesChange([]);
    }
    
    onOpenChange(false);
  };

  const filterCategories = [
    { id: 'status', label: 'Status' },
    { id: 'product', label: 'Product' },
    { id: 'buySell', label: 'Buy/Sell' },
    { id: 'incoTerm', label: 'Incoterm' },
    { id: 'sustainability', label: 'Sustainability' },
    { id: 'counterparty', label: 'Counterparty' },
    { id: 'creditStatus', label: 'Credit Status' },
    { id: 'customsStatus', label: 'Customs Status' },
    { id: 'loadport', label: 'Load Port' },
    { id: 'loadportInspector', label: 'Load Port Inspector' },
    { id: 'disport', label: 'Discharge Port' },
    { id: 'disportInspector', label: 'Discharge Port Inspector' }
  ] as const;

  // Calculate total number of active filters across all categories
  const totalActiveFilters = Object.values(tempFilters).reduce(
    (total, categoryFilters) => total + categoryFilters.length, 
    0
  );

  const FilterGroup: React.FC<{
    category: keyof FilterOptions;
    label: string;
  }> = ({ category, label }) => {
    const options = availableOptions[category];
    const selectedOptions = tempFilters[category];
    const allSelected = options.length > 0 && selectedOptions.length === options.length;
    const hasSelected = selectedOptions.length > 0;
    const indeterminate = hasSelected && !allSelected;

    if (options.length === 0) return null;

    return (
      <AccordionItem value={category}>
        <AccordionTrigger className="px-4 hover:no-underline">
          <div className="flex items-center justify-between flex-1 pr-4">
            <span>{label}</span>
            {hasSelected && (
              <Badge variant="secondary" className="ml-auto mr-4">
                {selectedOptions.length}
              </Badge>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pt-2">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id={`select-all-${category}`}
                checked={allSelected}
                className={indeterminate ? "opacity-80" : ""}
                onCheckedChange={(checked) => handleSelectAll(category, !!checked)}
              />
              <Label 
                htmlFor={`select-all-${category}`}
                className="text-sm font-medium cursor-pointer"
              >
                Select All
              </Label>
            </div>
            <div className="space-y-2 pl-1">
              {options.map((option) => (
                <div key={`${category}-${option}`} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`${category}-${option}`}
                    checked={selectedOptions.includes(option)}
                    onCheckedChange={() => handleToggleOption(category, option)}
                  />
                  <Label 
                    htmlFor={`${category}-${option}`}
                    className="cursor-pointer"
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Filter Movements</span>
            {totalActiveFilters > 0 && (
              <Badge variant="secondary" className="ml-2">
                {totalActiveFilters} active {totalActiveFilters === 1 ? 'filter' : 'filters'}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="pr-4 max-h-[60vh]">
          <Accordion type="multiple" className="w-full">
            {filterCategories.map(({ id, label }) => (
              <FilterGroup 
                key={id} 
                category={id} 
                label={label}
              />
            ))}
          </Accordion>
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

