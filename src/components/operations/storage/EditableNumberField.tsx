
import React, { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import ProductToken from './ProductToken';
import { useKeyboardShortcuts } from '@/contexts/KeyboardShortcutsContext';

interface EditableNumberFieldProps {
  initialValue: number;
  onSave: (value: number) => void;
  className?: string;
  placeholder?: string;
  product?: string;
  rowId?: string;
  columnName?: string;
}

const EditableNumberField: React.FC<EditableNumberFieldProps> = ({
  initialValue,
  onSave,
  className,
  placeholder = 'Enter value...',
  product,
  rowId,
  columnName
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState(initialValue.toString());

  const { 
    shortcutMode, 
    selectedRowId, 
    selectedColumnName,
    isEditMode,
    setShortcutMode,
    setIsEditMode,
    announceShortcutMode
  } = useKeyboardShortcuts();

  // If this is the selected cell and we're in edit mode, open the popover
  useEffect(() => {
    if (rowId && columnName && selectedRowId === rowId && selectedColumnName === columnName && isEditMode) {
      setIsOpen(true);
    } else if (!isEditMode && isOpen) {
      setIsOpen(false);
    }
  }, [rowId, columnName, selectedRowId, selectedColumnName, isEditMode, isOpen]);

  const handleSave = () => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      onSave(numValue);
      setIsOpen(false);
      
      if (isEditMode) {
        setShortcutMode('cellNavigation');
        setIsEditMode(false);
        announceShortcutMode('cellNavigation');
      }
    }
  };

  const handleCancel = () => {
    setValue(initialValue.toString());
    setIsOpen(false);
    
    if (isEditMode) {
      setShortcutMode('cellNavigation');
      setIsEditMode(false);
      announceShortcutMode('cellNavigation');
    }
  };

  // Handle keyboard commands while editing
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, value]);

  // Format display value based on whether it's an M3 value
  const formattedValue = product && initialValue.toString().includes('M³') 
    ? Number(initialValue).toFixed(2)
    : initialValue;

  // Check if this cell is selected in cell navigation mode
  const isSelected = rowId && 
                    columnName && 
                    selectedRowId === rowId && 
                    selectedColumnName === columnName && 
                    shortcutMode === 'cellNavigation';

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

  const handleClick = () => {
    if (shortcutMode === 'cellNavigation' && rowId && columnName && isSelected) {
      setShortcutMode('editing');
      setIsEditMode(true);
      setIsOpen(true);
      announceShortcutMode('editing');
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div 
          className={cn(
            "cursor-pointer hover:bg-muted/30 px-1 py-0.5 rounded",
            isSelected ? "outline outline-2 outline-offset-2 outline-brand-lime ring-2 ring-brand-lime shadow-[0_0_15px_rgba(180,211,53,0.7)]" : ""
          )}
          onClick={handleClick}
          data-row-id={rowId}
          data-column-name={columnName}
          role="button"
          tabIndex={0}
          aria-selected={isSelected}
        >
          {displayValue}
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
