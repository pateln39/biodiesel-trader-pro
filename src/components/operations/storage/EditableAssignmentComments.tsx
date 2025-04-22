
import React, { useState, useRef, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Check, X, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useKeyboardShortcuts } from '@/context/KeyboardShortcutsContext';

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
  const queryClient = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts();
  const componentId = useRef(`comments-${assignmentId}`).current;

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(assignmentId, comments);
      setDisplayedComments(comments);
      setIsOpen(false);
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
  };

  // Register keyboard shortcuts when the popover is open
  useEffect(() => {
    if (isOpen) {
      // Ctrl+Enter to save (common in comment fields)
      registerShortcut(`${componentId}-save`, {
        key: 'Enter',
        ctrl: true,
        description: 'Save comments',
        action: handleSave,
        scope: 'form-editing'
      });
      
      // Escape key to cancel
      registerShortcut(`${componentId}-cancel`, {
        key: 'Escape',
        description: 'Cancel comment editing',
        action: handleCancel,
        scope: 'form-editing'
      });
      
      // Focus the textarea
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    } else {
      // Unregister shortcuts when closed
      unregisterShortcut(`${componentId}-save`);
      unregisterShortcut(`${componentId}-cancel`);
    }
    
    return () => {
      unregisterShortcut(`${componentId}-save`);
      unregisterShortcut(`${componentId}-cancel`);
    };
  }, [isOpen, comments, displayedComments, assignmentId, componentId]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "cursor-pointer hover:bg-muted/30 px-1 py-0.5 rounded flex items-center gap-1 text-[10px]",
            className,
            displayedComments ? "text-purple-300" : "text-muted-foreground"
          )}
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
            onKeyDown={(e) => {
              // Save on Ctrl+Enter
              if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                handleSave();
              }
              // Allow normal Enter for new lines
            }}
          />
          <div className="flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              <kbd className="px-1.5 py-0.5 bg-muted border rounded text-xs">Ctrl+Enter</kbd> to save
            </div>
            <div className="flex space-x-2">
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
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EditableAssignmentComments;
