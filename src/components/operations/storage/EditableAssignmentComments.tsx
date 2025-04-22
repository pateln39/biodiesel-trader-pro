
import React, { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Check, X, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useKeyboardNavigationContext } from '@/contexts/KeyboardNavigationContext';

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
  const [displayedComments, setDisplayedComments] = useState(initialValue || '');
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();
  const { startEditing, endEditing } = useKeyboardNavigationContext();

  useEffect(() => {
    // Update comments if initialValue changes
    setComments(initialValue || '');
    setDisplayedComments(initialValue || '');
  }, [initialValue]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(assignmentId, comments);
      setDisplayedComments(comments);
      setIsOpen(false);
      endEditing();
      queryClient.invalidateQueries({ queryKey: ['sortable-terminal-assignments'] });
      toast.success('Comments saved successfully');
    } catch (error) {
      toast.error('Failed to save comments');
      console.error('Error saving comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setComments(displayedComments);
    setIsOpen(false);
    endEditing();
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      startEditing();
    } else {
      endEditing();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Don't stop propagation for Tab key to allow navigating inside textarea
    if (e.key !== 'Tab') {
      e.stopPropagation();
    }
    
    // Capture Ctrl+Enter for save in textarea
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "cursor-pointer hover:bg-muted/30 px-1 py-0.5 rounded flex items-center gap-1 text-[10px]",
            className,
            displayedComments ? "text-purple-300" : "text-muted-foreground"
          )}
          data-editable-trigger="true"
        >
          <span className="truncate max-w-[120px]">
            {displayedComments || '-'}
          </span>
          <MessageSquare className="h-3 w-3 flex-shrink-0" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3">
        <div className="space-y-2">
          <Textarea
            ref={textareaRef}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Add comments..."
            className="w-full min-h-[100px] text-xs"
            autoFocus
            onKeyDown={handleKeyDown}
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
