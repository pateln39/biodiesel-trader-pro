
import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Check, X, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface EditableAssignmentCommentsProps {
  assignmentId: string;
  initialValue: string | null;
  onSave: (assignmentId: string, comments: string) => void;
  className?: string;
}

const EditableAssignmentComments: React.FC<EditableAssignmentCommentsProps> = ({
  assignmentId,
  initialValue,
  onSave,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [comments, setComments] = useState(initialValue || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(assignmentId, comments);
      setIsOpen(false);
      toast.success('Comments saved successfully');
    } catch (error) {
      toast.error('Failed to save comments');
      console.error('Error saving comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setComments(initialValue || '');
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "cursor-pointer hover:bg-muted/30 px-1 py-0.5 rounded flex items-center",
            className
          )}
        >
          <span className="truncate max-w-[80px] text-[10px]">{initialValue || '-'}</span>
          <Edit className="h-3 w-3 ml-1 opacity-50" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3">
        <div className="space-y-2">
          <Textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Add comments..."
            className="w-full min-h-[100px] text-xs"
            autoFocus
          />
          <div className="flex justify-end space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isLoading}
            >
              <Check className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EditableAssignmentComments;
