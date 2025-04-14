
import React, { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Option {
  label: string;
  value: string;
}

interface EditableDropdownFieldProps {
  initialValue: string;
  options: Option[];
  onSave: (value: string) => void;
  className?: string;
  truncate?: boolean;
}

const EditableDropdownField: React.FC<EditableDropdownFieldProps> = ({
  initialValue,
  options,
  onSave,
  className = '',
  truncate = true
}) => {
  const [value, setValue] = useState(initialValue);

  const handleValueChange = (newValue: string) => {
    setValue(newValue);
    onSave(newValue);
  };

  return (
    <Select value={value} onValueChange={handleValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select..." />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default EditableDropdownField;
