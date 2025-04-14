
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export interface CommentsCellInputProps {
  initialValue: string;
  onSave: (value: string) => void;
  className?: string;
  placeholder?: string;
  tradeId?: string;
  legId?: string;
  showButtons?: boolean;
  onCancel?: () => void;
}

export default function CommentsCellInput({
  initialValue,
  onSave,
  className,
  placeholder,
  tradeId,
  legId,
  showButtons = false,
  onCancel
}: CommentsCellInputProps) {
  const [value, setValue] = React.useState(initialValue);

  const handleSave = () => {
    onSave(value);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={!showButtons ? handleSave : undefined}
        className={className}
        placeholder={placeholder}
      />
      
      {showButtons && (
        <div className="flex justify-end space-x-2">
          {onCancel && (
            <Button variant="outline" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
          )}
          <Button size="sm" onClick={handleSave}>
            Save
          </Button>
        </div>
      )}
    </div>
  );
}
