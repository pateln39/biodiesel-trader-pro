
import React, { useState, useRef, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useKeyboardNavigationContext } from '@/contexts/KeyboardNavigationContext';

interface EditableFieldProps {
  initialValue: string;
  onSave: (value: string) => void;
  className?: string;
  placeholder?: string;
  truncate?: boolean;
  maxWidth?: number;
}

const EditableField: React.FC<EditableFieldProps> = ({
  initialValue,
  onSave,
  className,
  placeholder = 'Enter value...',
  truncate = true,
  maxWidth = 100,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const { shortcutMode, exitEditMode } = useKeyboardNavigationContext();

  // Focus the input when the popover opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  // Listen for Enter and Escape keys in the input field
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      handleCancel();
    }
  };

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
        >
          {initialValue || '-'}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3">
        <div className="space-y-2">
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full"
            onKeyDown={handleKeyDown}
          />
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

export default EditableField;
