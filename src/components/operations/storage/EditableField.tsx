
import React, { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useKeyboardShortcuts } from '@/contexts/KeyboardShortcutsContext';

interface EditableFieldProps {
  initialValue: string;
  onSave: (value: string) => void;
  className?: string;
  placeholder?: string;
  truncate?: boolean;
  maxWidth?: number;
  rowId?: string;
  columnName?: string;
}

const EditableField: React.FC<EditableFieldProps> = ({
  initialValue,
  onSave,
  className,
  placeholder = 'Enter value...',
  truncate = true,
  maxWidth = 100,
  rowId,
  columnName
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState(initialValue);
  
  const { 
    shortcutMode, 
    selectedRowId, 
    selectedColumnName,
    isEditMode
  } = useKeyboardShortcuts();

  // If this is the selected cell and we're in edit mode, open the popover
  useEffect(() => {
    if (rowId && columnName && selectedRowId === rowId && selectedColumnName === columnName && isEditMode) {
      setIsOpen(true);
    }
  }, [rowId, columnName, selectedRowId, selectedColumnName, isEditMode]);

  const handleSave = () => {
    onSave(value);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setValue(initialValue);
    setIsOpen(false);
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

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div 
          className={cn(
            "cursor-pointer hover:bg-muted/30 px-1 py-0.5 rounded", 
            truncate && "truncate",
            className,
            rowId && columnName && selectedRowId === rowId && selectedColumnName === columnName && shortcutMode === 'cellNavigation' ?
            "outline outline-2 outline-offset-2 outline-brand-lime ring-2 ring-brand-lime shadow-[0_0_15px_rgba(180,211,53,0.7)]" : ""
          )}
          style={truncate ? { maxWidth: `${maxWidth}px` } : undefined}
          data-row-id={rowId}
          data-column-name={columnName}
        >
          {initialValue || '-'}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3">
        <div className="space-y-2">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full"
            autoFocus
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
