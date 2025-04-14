
import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';

export interface EditableNumberFieldProps {
  initialValue: number;
  onSave: (value: number) => void;
  className?: string;
  placeholder?: string;
  prefix?: string;
}

export function EditableNumberField({
  initialValue,
  onSave,
  className,
  placeholder,
  prefix
}: EditableNumberFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    onSave(value);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue)) {
      setValue(newValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setValue(initialValue);
    }
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        type="number"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={className}
        placeholder={placeholder}
      />
    );
  }

  return (
    <div onDoubleClick={handleDoubleClick} className={className}>
      {prefix && <span className="mr-1">{prefix}</span>}
      {value}
    </div>
  );
}
