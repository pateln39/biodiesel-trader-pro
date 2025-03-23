
import React from 'react';
import { Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface CommentFieldProps {
  id: string;
  value: string;
  onChange: (id: string, value: string) => void;
  onBlur: (id: string) => void;
  isSaving: boolean;
}

const CommentField: React.FC<CommentFieldProps> = ({
  id,
  value,
  onChange,
  onBlur,
  isSaving,
}) => {
  return (
    <div className="relative">
      <Textarea 
        placeholder="Add comments..."
        value={value || ''}
        onChange={(e) => onChange(id, e.target.value)}
        onBlur={() => onBlur(id)}
        className="min-h-[40px] text-sm resize-none border-transparent hover:border-input focus:border-input transition-colors"
        rows={1}
      />
      {isSaving && (
        <div className="absolute top-1 right-1">
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
};

export default CommentField;
