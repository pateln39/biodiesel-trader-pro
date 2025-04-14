
import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import ProductToken from './ProductToken';

interface EditableNumberFieldProps {
  initialValue: number;
  onSave: (value: number) => void;
  className?: string;
  placeholder?: string;
  product?: string;
  isReadOnly?: boolean;
}

const EditableNumberField: React.FC<EditableNumberFieldProps> = ({
  initialValue,
  onSave,
  className,
  placeholder = 'Enter value...',
  product,
  isReadOnly = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState(initialValue.toString());

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

  // Display as token if product is provided, otherwise just show the number
  const displayValue = (
    product ? (
      <ProductToken 
        product={product} 
        value={initialValue}
        className={className}
        isReadOnly={isReadOnly}
      />
    ) : (
      <span className={className}>{initialValue}</span>
    )
  );

  // If read-only, just return the display value without popover
  if (isReadOnly) {
    return displayValue;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="cursor-pointer hover:bg-muted/30 px-1 py-0.5 rounded">
          {initialValue === 0 ? "-" : displayValue}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="w-full"
              autoFocus
            />
            {product && (
              <ProductToken 
                product={product} 
                value="" 
                className="h-9 w-9 flex items-center justify-center" 
              />
            )}
          </div>
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

export default EditableNumberField;
