import React, { useEffect } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/core/hooks/use-toast";

interface Instrument {
  id: string;
  displayName: string;
}

interface MultiInstrumentSelectProps {
  instruments: Instrument[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export const MultiInstrumentSelect: React.FC<MultiInstrumentSelectProps> = ({
  instruments = [],
  selectedValues = [],
  onChange,
  disabled = false,
  isLoading = false
}) => {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  
  // Ensure we always have valid instruments
  const validInstruments = instruments || [];
  
  // Make sure selectedValues only contains valid instrument IDs
  useEffect(() => {
    const validIds = validInstruments.map(i => i.id);
    const validSelectedValues = selectedValues.filter(id => validIds.includes(id));
    
    // If the filtered list differs from the current selectedValues, update it
    // But ensure at least one instrument remains selected
    if (JSON.stringify(validSelectedValues) !== JSON.stringify(selectedValues)) {
      if (validSelectedValues.length > 0) {
        onChange(validSelectedValues);
      } else if (validIds.length > 0) {
        // Default to the first instrument if none are selected
        onChange([validIds[0]]);
      }
    }
  }, [instruments, selectedValues]);

  const handleSelect = (id: string) => {
    if (!id) return;
    
    if (selectedValues.includes(id)) {
      // Prevent deselection if it's the only selected instrument
      if (selectedValues.length === 1) {
        toast({
          title: "At least one instrument required",
          description: "You must have at least one instrument selected at all times.",
          variant: "default"
        });
        return;
      }
      
      const newValues = selectedValues.filter(value => value !== id);
      onChange(newValues);
    } else {
      onChange([...selectedValues, id]);
    }
  };

  // Get the display names of selected instruments
  const selectedNames = validInstruments
    .filter(instrument => selectedValues.includes(instrument.id))
    .map(instrument => instrument.displayName);

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto min-h-10"
          disabled={disabled || isLoading}
        >
          <div className="flex flex-wrap gap-1">
            {selectedNames.length > 0 ? (
              selectedNames.map(name => (
                <Badge key={name} variant="secondary" className="mr-1">
                  {name}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">Select instruments...</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search instruments..." />
          <CommandEmpty>No instruments found.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {validInstruments.map((instrument) => (
              <CommandItem
                key={instrument.id}
                value={instrument.id}
                onSelect={() => handleSelect(instrument.id)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedValues.includes(instrument.id) ? "opacity-100" : "opacity-0"
                  )}
                />
                {instrument.displayName}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
