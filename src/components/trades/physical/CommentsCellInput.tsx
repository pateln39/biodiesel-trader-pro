
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { debounce } from 'lodash';

interface CommentsCellInputProps {
  tradeId: string;
  legId?: string;
  initialValue?: string;
  onSave?: (comments: string) => void;
  isMovement?: boolean;
  showButtons?: boolean;
  onCancel?: () => void;
}

const CommentsCellInput: React.FC<CommentsCellInputProps> = ({ 
  tradeId, 
  legId,
  initialValue = '',
  onSave,
  isMovement = false,
  showButtons = false,
  onCancel
}) => {
  const [comments, setComments] = useState<string>(initialValue);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [localComments, setLocalComments] = useState<string>(initialValue);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Function to save comments to the database
  const saveComments = useCallback(async (newComments: string, showToast: boolean = false) => {
    if (newComments === initialValue) return; // Don't save if nothing changed
    
    setIsLoading(true);
    try {
      // If onSave prop is provided, use it instead of default save behavior
      if (onSave) {
        onSave(newComments);
        if (showToast) {
          toast.success('Comments saved', {
            description: 'Your comment has been saved successfully.',
          });
        }
      } 
      // Otherwise use the default behavior (saving to trade_legs)
      else if (legId) {
        const { error } = await supabase
          .from('trade_legs')
          .update({ comments: newComments })
          .eq('id', legId);

        if (error) {
          console.error('Error saving comments:', error);
          toast.error('Failed to save comments', {
            description: error.message,
          });
        } else if (showToast) {
          toast.success('Comments saved', {
            description: 'Your comment has been saved successfully.',
          });
        }
      }
    } catch (err) {
      console.error('Exception when saving comments:', err);
    } finally {
      setIsLoading(false);
    }
  }, [legId, initialValue, onSave]);

  // Set up auto-save timer if not using explicit buttons
  useEffect(() => {
    if (!showButtons) {
      // Clear existing timer if there is one
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // Only start a new timer if the comments have changed
      if (localComments !== initialValue && localComments !== comments) {
        timerRef.current = setTimeout(() => {
          setComments(localComments);
          saveComments(localComments, false); // Auto-save without toast
        }, 10000); // 10 seconds
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [localComments, comments, initialValue, saveComments, showButtons]);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalComments(e.target.value);
  };

  const handleBlur = () => {
    if (!showButtons) {
      // If there are unsaved changes, save them and show toast
      if (localComments !== comments) {
        setComments(localComments);
        saveComments(localComments, true); // Save with toast notification
      }
      
      // Clear any pending auto-save
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  };
  
  const handleSave = () => {
    setComments(localComments);
    saveComments(localComments, true);
    
    // Clear any pending auto-save
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };
  
  const handleCancel = () => {
    setLocalComments(initialValue);
    if (onCancel) {
      onCancel();
    }
    
    // Clear any pending auto-save
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <div className="relative w-full space-y-2">
      <Textarea
        value={localComments}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="Add comments..."
        className="min-h-[60px] w-full text-xs resize-none"
        disabled={isLoading}
      />
      {isLoading && (
        <div className="absolute top-1 right-1">
          <div className="h-2 w-2 rounded-full bg-blue-500 opacity-70 animate-pulse"></div>
        </div>
      )}
      
      {showButtons && (
        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            size="sm" 
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default CommentsCellInput;
