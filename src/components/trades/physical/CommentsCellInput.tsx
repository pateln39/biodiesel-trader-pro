import React from 'react';
import { Textarea } from '@/components/ui/textarea';

export interface CommentsCellInputProps {
  initialValue: string;
  onSave: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export default function CommentsCellInput({
  initialValue,
  onSave,
  className,
  placeholder
}: CommentsCellInputProps) {
  const [value, setValue] = React.useState(initialValue);

  const handleSave = () => {
    onSave(value);
  };

  return (
    <Textarea
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleSave}
      className={className}
      placeholder={placeholder}
    />
  );
}
