
import React, { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Check, X, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useKeyboardShortcuts } from '@/contexts/KeyboardShortcutsContext';

interface EditableAssignmentCommentsProps {
  assignmentId: string;
  initialValue: string | null;
  onSave: (assignmentId: string, comments: string) => void;
  className?: string;
  rowId?: string;
}

const EditableAssignmentComments: React.FC<EditableAssignmentCommentsProps> = ({
  assignmentId,
  initialValue,
  onSave,
  className,
  rowId
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [comments, setComments] = useState(initialValue || '');
  const [displayedComments, setDisplayedComments] = useState(initialValue || '');
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  
  const { 
    shortcutMode, 
    selectedRowId, 
    selectedColumnName,
    isEditMode
  } = useKeyboardShortcuts();

  // If this is the selected cell and we're in edit mode, open the popover
  useEffect(() => {
    if (rowId && selectedRowId === rowId && selectedColumnName === 'comments' && isEditMode) {
      setIsOpen(true);
    }
  }, [rowId, selectedRowId, selectedColumnName, isEditMode]);

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

  // Handle keyboard commands while editing
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, comments]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "cursor-pointer hover:bg-muted/30 px-1 py-0.5 rounded flex items-center gap-1 text-[10px]",
            className,
            displayedComments ? "text-purple-300" : "text-muted-foreground",
            rowId && selectedRowId === rowId && selectedColumnName === 'comments' && shortcutMode === 'cellNavigation' ?
            "outline outline-2 outline-offset-2 outline-brand-lime ring-2 ring-brand-lime shadow-[0_0_15px_rgba(180,211,53,0.7)]" : ""
          )}
          data-row-id={rowId}
          data-column-name="comments"
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
