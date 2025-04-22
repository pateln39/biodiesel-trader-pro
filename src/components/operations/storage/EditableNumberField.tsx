
import React, { useState, useRef, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import ProductToken from './ProductToken';
import { useKeyboardShortcuts } from '@/context/KeyboardShortcutsContext';

interface EditableNumberFieldProps {
  initialValue: number;
  onSave: (value: number) => void;
  className?: string;
  placeholder?: string;
  product?: string;
}

const EditableNumberField: React.FC<EditableNumberFieldProps> = ({
  initialValue,
  onSave,
  className,
  placeholder = 'Enter value...',
  product
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState(initialValue.toString());
  const inputRef = useRef<HTMLInputElement>(null);
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts();
  const componentId = useRef(`editable-number-${Math.random().toString(36).substr(2, 9)}`).current;

  const handleSave = () => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      onSave(numValue);
      setIsOpen(false);
    }
  };

  const handleCancel = () => {
    setValue(initialValue.toString());
    setIsOpen(false);
  };

  // Register keyboard shortcuts when the popover is open
  useEffect(() => {
    if (isOpen) {
      // Enter key to save
      registerShortcut(`${componentId}-save`, {
        key: 'Enter',
        description: 'Save numeric value',
        action: handleSave,
        scope: 'form-editing'
      });
      
      // Escape key to cancel
      registerShortcut(`${componentId}-cancel`, {
        key: 'Escape',
        description: 'Cancel changes',
        action: handleCancel,
        scope: 'form-editing'
      });
      
      // Focus the input
      if (inputRef.current) {
        inputRef.current.focus();
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

  // Format display value based on whether it's an M3 value
  const formattedValue = product && initialValue.toString().includes('M³') 
    ? Number(initialValue).toFixed(2)
    : initialValue;

  // Display as token if product is provided, otherwise just show the number
  const displayValue = (
    product ? (
      <ProductToken 
        product={product} 
        value={formattedValue.toString()}
        className={className}
      />
    ) : (
      <span className={className}>{formattedValue}</span>
    )
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="cursor-pointer hover:bg-muted/30 px-1 py-0.5 rounded">
          {displayValue}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Input
              ref={inputRef}
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="w-full"
              autoFocus
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
            />
            {product && (
              <ProductToken 
                product={product} 
                value="" 
                className="h-9 w-9 flex items-center justify-center" 
              />
            )}
          </div>
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

export default EditableNumberField;
