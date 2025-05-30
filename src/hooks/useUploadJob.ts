
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UploadJob {
  id: string;
  status: string;
  progress_percentage: number;
  total_items: number;
  processed_items: number;
  failed_items: number;
  error_message?: string;
  metadata?: any;
  completed_at?: string;
}

interface UseUploadJobReturn {
  job: UploadJob | null;
  isLoading: boolean;
  error: string | null;
  startPolling: (jobId: string) => void;
  stopPolling: () => void;
}

export const useUploadJob = (): UseUploadJobReturn => {
  const [job, setJob] = useState<UploadJob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCompletedRef = useRef(false);

  const fetchJobStatus = useCallback(async (jobId: string) => {
    try {
      const { data, error } = await supabase
        .from('upload_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch job status: ${error.message}`);
      }

      setJob(data);
      setError(null);

      // Check if job is completed
      const isCompleted = data.status === 'completed' || 
                         data.status === 'completed_with_errors' || 
                         data.status === 'failed';

      if (isCompleted && !isCompletedRef.current) {
        isCompletedRef.current = true;
        setIsLoading(false);
        
        // Clear polling interval immediately
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }
  }, []);

  const startPolling = useCallback((jobId: string) => {
    // Reset completion tracking
    isCompletedRef.current = false;
    setIsLoading(true);
    setError(null);
    setJob(null);

    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Initial fetch
    fetchJobStatus(jobId);

    // Start polling every 2 seconds
    pollingIntervalRef.current = setInterval(() => {
      if (!isCompletedRef.current) {
        fetchJobStatus(jobId);
      }
    }, 2000);
  }, [fetchJobStatus]);

  const stopPolling = useCallback(() => {
    setIsLoading(false);
    isCompletedRef.current = true;
    
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  return {
    job,
    isLoading,
    error,
    startPolling,
    stopPolling
  };
};
