
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
  selectedStatuses = [],
  onStatusesChange
}) => {
  const [tempFilters, setTempFilters] = React.useState<FilterOptions>(() => {
    if (filterOptions) {
      return { ...filterOptions };
    } else {
      // For backward compatibility, initialize with just status filter
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
        // For backward compatibility
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
      // For backward compatibility
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
      // For backward compatibility
      onStatusesChange([]);
    }
    
    onOpenChange(false);
  };

  // Calculate total number of active filters across all categories
  const totalActiveFilters = Object.values(tempFilters).reduce(
    (total, categoryFilters) => total + categoryFilters.length, 
    0
  );

  // For backward compatibility: focus only on status
  const statusCategory = {
    id: 'status' as keyof FilterOptions,
    label: 'Status',
    options: availableOptions.status,
    selectedOptions: tempFilters.status,
    onChange: (values: string[]) => {
      setTempFilters(prev => ({ ...prev, status: values }));
    }
  };

  // Check if all status options are selected
  const allSelected = availableOptions.status.length > 0 && 
    tempFilters.status.length === availableOptions.status.length;

  // Check if some options are selected (not all and not none)
  const indeterminate = tempFilters.status.length > 0 && 
    tempFilters.status.length < availableOptions.status.length;

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
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 pb-2">
                  <Checkbox 
                    id="select-all-status" 
                    checked={allSelected}
                    className={indeterminate ? "opacity-80" : ""}
                    onCheckedChange={(checked) => handleSelectAll('status', !!checked)}
                  />
                  <Label 
                    htmlFor="select-all-status"
                    className="cursor-pointer font-medium text-sm"
                  >
                    Select All
                  </Label>
                </div>
                
                <div className="space-y-1 pl-1">
                  {availableOptions.status.length > 0 ? (
                    availableOptions.status.map((option) => (
                      <div key={`status-${option}`} className="flex items-center space-x-2 py-1">
                        <Checkbox 
                          id={`status-${option}`} 
                          checked={tempFilters.status.includes(option)}
                          onCheckedChange={() => handleToggleOption('status', option)}
                        />
                        <Label 
                          htmlFor={`status-${option}`}
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
            </div>
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
