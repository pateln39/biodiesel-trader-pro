
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

interface Instrument {
  id: string;
  displayName: string;
}

interface MultiInstrumentSelectProps {
  instruments: Instrument[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
}

export const MultiInstrumentSelect: React.FC<MultiInstrumentSelectProps> = ({
  instruments,
  selectedValues,
  onChange,
  disabled = false,
}) => {
  const [open, setOpen] = React.useState(false);
  
  // Ensure we always have valid instruments
  const validInstruments = instruments || [];
  
  // Make sure selectedValues only contains valid instrument IDs
  useEffect(() => {
    const validIds = validInstruments.map(i => i.id);
    const validSelectedValues = selectedValues.filter(id => validIds.includes(id));
    
    // If the filtered list differs from the current selectedValues, update it
    if (JSON.stringify(validSelectedValues) !== JSON.stringify(selectedValues) && validSelectedValues.length > 0) {
      onChange(validSelectedValues);
    }
  }, [instruments]);

  const handleSelect = (id: string) => {
    if (!id) return;
    
    if (selectedValues.includes(id)) {
      const newValues = selectedValues.filter(value => value !== id);
      // Ensure at least one instrument remains selected
      onChange(newValues.length > 0 ? newValues : [id]);
    } else {
      onChange([...selectedValues, id]);
    }
  };

  // Get the display names of selected instruments
  const selectedNames = validInstruments
    .filter(instrument => selectedValues.includes(instrument.id))
    .map(instrument => instrument.displayName);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto min-h-10"
          disabled={disabled}
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
