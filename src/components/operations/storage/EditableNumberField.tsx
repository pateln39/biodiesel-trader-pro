
import React, { useState, useEffect, useRef } from 'react';
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
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const { 
    shortcutMode, 
    selectedRowId, 
    selectedColumnName,
    isEditMode,
    setShortcutMode,
    setIsEditMode
  } = useKeyboardShortcuts();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  // If this is the selected cell and we're in edit mode, open the popover
  useEffect(() => {
    if (rowId && columnName && selectedRowId === rowId && selectedColumnName === columnName && isEditMode) {
      setIsOpen(true);
    }
  }, [rowId, columnName, selectedRowId, selectedColumnName, isEditMode]);

  const handleSave = (e?: React.FormEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      onSave(numValue);
      setIsOpen(false);
      
      if (isEditMode) {
        setShortcutMode('cellNavigation');
        setIsEditMode(false);
      }
      
      // Refocus the trigger element
      if (triggerRef.current) {
        triggerRef.current.focus();
      }
    }
  };

  const handleCancel = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setValue(initialValue.toString());
    setIsOpen(false);
    
    if (isEditMode) {
      setShortcutMode('cellNavigation');
      setIsEditMode(false);
    }
    
    // Refocus the trigger element
    if (triggerRef.current) {
      triggerRef.current.focus();
    }
  };

  return (
    <Popover 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) {
          handleCancel();
        }
        setIsOpen(open);
      }}
    >
      <PopoverTrigger asChild>
        <div 
          ref={triggerRef}
          className={cn(
            "cursor-pointer hover:bg-muted/30 px-1 py-0.5 rounded",
            isOpen ? "bg-muted/50" : "",
            rowId && selectedRowId === rowId && selectedColumnName === columnName && shortcutMode === 'cellNavigation' 
              ? "outline outline-2 outline-offset-2 outline-brand-lime ring-2 ring-brand-lime shadow-[0_0_15px_rgba(180,211,53,0.7)]" 
              : ""
          )}
          data-row-id={rowId}
          data-column-name={columnName}
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
        >
          {product ? (
            <ProductToken 
              product={product} 
              value={initialValue.toString()}
              className={className}
            />
          ) : (
            <span className={className}>{initialValue}</span>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" onOpenAutoFocus={(e) => e.preventDefault()}>
        <form 
          onSubmit={handleSave}
          onClick={(e) => e.stopPropagation()}
          className="space-y-2"
        >
          <div className="flex items-center space-x-2">
            <Input
              ref={inputRef}
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="w-full"
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
            <Button 
              size="sm" 
              variant="outline" 
              type="button"
              onClick={handleCancel}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button size="sm" type="submit">
              <Check className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
};

export default EditableNumberField;
