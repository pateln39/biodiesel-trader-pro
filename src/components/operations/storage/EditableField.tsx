
import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const handleSave = () => {
    onSave(value);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setValue(initialValue);
    setIsOpen(false);
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
