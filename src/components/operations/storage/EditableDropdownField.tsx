
import React, { useState, useRef, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useKeyboardNavigationContext } from '@/contexts/KeyboardNavigationContext';

interface EditableDropdownFieldProps {
  initialValue: string;
  options: { label: string; value: string }[];
  onSave: (value: string) => void;
  className?: string;
  placeholder?: string;
  truncate?: boolean;
  maxWidth?: number;
}

const EditableDropdownField: React.FC<EditableDropdownFieldProps> = ({
  initialValue,
  options,
  onSave,
  className,
  placeholder = 'Select option...',
  truncate = true,
  maxWidth = 100,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState(initialValue);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { shortcutMode, exitEditMode } = useKeyboardNavigationContext();

  // Focus the select trigger when the popover opens
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      triggerRef.current.focus();
    }
  }, [isOpen]);

  const handleSave = () => {
    onSave(value);
    setIsOpen(false);
    exitEditMode();
  };

  const handleCancel = () => {
    setValue(initialValue);
    setIsOpen(false);
    exitEditMode();
  };

  const getLabel = (val: string) => {
    const option = options.find(opt => opt.value === val);
    return option ? option.label : val;
  };

  // Handle keyboard shortcuts inside the dropdown
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // If the component is triggered to open via keyboard navigation
  useEffect(() => {
    if (shortcutMode === 'editing' && !isOpen) {
      setIsOpen(true);
    }
  }, [shortcutMode, isOpen]);

  return (
    <Popover open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        exitEditMode();
      }
    }}>
      <PopoverTrigger asChild>
        <div 
          className={cn(
            "cursor-pointer hover:bg-muted/30 px-1 py-0.5 rounded", 
            truncate && "truncate",
            className
          )}
          style={truncate ? { maxWidth: `${maxWidth}px` } : undefined}
          onKeyDown={handleKeyDown}
        >
          {getLabel(initialValue) || placeholder}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3">
        <div className="space-y-2">
          <Select value={value} onValueChange={setValue}>
            <SelectTrigger ref={triggerRef} className="w-full">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent onKeyDown={handleKeyDown}>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex justify-end space-x-2">
            <Button size="sm" variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Check className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EditableDropdownField;
