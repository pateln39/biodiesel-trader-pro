
import React, { useState, useEffect, useRef } from 'react';
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
import { useKeyboardShortcuts } from '@/context/KeyboardShortcutsContext';

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
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts();
  const selectRef = useRef<HTMLButtonElement>(null);
  const componentId = useRef(`editable-dropdown-${Math.random().toString(36).substr(2, 9)}`).current;

  const handleSave = () => {
    onSave(value);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setValue(initialValue);
    setIsOpen(false);
  };

  // Register keyboard shortcuts when the popover is open
  useEffect(() => {
    if (isOpen) {
      // Enter key to save
      registerShortcut(`${componentId}-save`, {
        key: 'Enter',
        description: 'Save selected option',
        action: handleSave,
        scope: 'form-editing'
      });
      
      // Escape key to cancel
      registerShortcut(`${componentId}-cancel`, {
        key: 'Escape',
        description: 'Cancel selection',
        action: handleCancel,
        scope: 'form-editing'
      });
      
      // Focus the select
      if (selectRef.current) {
        selectRef.current.focus();
      }
    } else {
      // Unregister shortcuts when closed
      unregisterShortcut(`${componentId}-save`);
      unregisterShortcut(`${componentId}-cancel`);
    }
    
    return () => {
      unregisterShortcut(`${componentId}-save`);
      unregisterShortcut(`${componentId}-cancel`);
    };
  }, [isOpen, value, initialValue, componentId]);

  const getLabel = (val: string) => {
    const option = options.find(opt => opt.value === val);
    return option ? option.label : val;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div 
          className={cn(
            "cursor-pointer hover:bg-muted/30 px-1 py-0.5 rounded", 
            truncate && "truncate",
            className
          )}
          style={truncate ? { maxWidth: `${maxWidth}px` } : undefined}
        >
          {getLabel(initialValue) || placeholder}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3">
        <div className="space-y-2">
          <Select 
            value={value} 
            onValueChange={setValue}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSave();
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                handleCancel();
              }
            }}
          >
            <SelectTrigger ref={selectRef} className="w-full focus:ring-2">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              <span className="inline-block mr-2">
                <kbd className="px-1.5 py-0.5 bg-muted border rounded text-xs">Enter</kbd> to save
              </span>
              <span className="inline-block">
                <kbd className="px-1.5 py-0.5 bg-muted border rounded text-xs">Esc</kbd> to cancel
              </span>
            </div>
            <div className="flex space-x-2">
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
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EditableDropdownField;
