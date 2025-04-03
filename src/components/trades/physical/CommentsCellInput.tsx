
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { debounce } from 'lodash';

interface CommentsCellInputProps {
  tradeId: string;
  legId: string;
  initialValue?: string;
}

const CommentsCellInput: React.FC<CommentsCellInputProps> = ({ 
  tradeId, 
  legId,
  initialValue = '' 
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
    } catch (err) {
      console.error('Exception when saving comments:', err);
    } finally {
      setIsLoading(false);
    }
  }, [legId, initialValue]);

  // Set up auto-save timer
  useEffect(() => {
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

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [localComments, comments, initialValue, saveComments]);

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
  };

  return (
    <div className="relative w-full">
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
    </div>
  );
};

export default CommentsCellInput;
