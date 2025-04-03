
import React, { useState, useEffect, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
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

  // Create a debounced save function
  const saveComments = useCallback(
    debounce(async (newComments: string) => {
      setIsLoading(true);
      try {
        const { error } = await supabase
          .from('trade_legs')
          .update({ comments: newComments })
          .eq('id', legId);

        if (error) {
          console.error('Error saving comments:', error);
          toast({
            title: 'Failed to save comments',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Comments saved',
            description: 'Your comment has been saved successfully.',
          });
        }
      } catch (err) {
        console.error('Exception when saving comments:', err);
      } finally {
        setIsLoading(false);
      }
    }, 800),
    [legId]
  );

  useEffect(() => {
    // Clean up the debounced function on unmount
    return () => {
      saveComments.cancel();
    };
  }, [saveComments]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newComments = e.target.value;
    setComments(newComments);
    saveComments(newComments);
  };

  const handleBlur = () => {
    saveComments.flush();
  };

  return (
    <div className="relative w-full">
      <Textarea
        value={comments}
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
