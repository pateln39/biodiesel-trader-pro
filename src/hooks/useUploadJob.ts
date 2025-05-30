
import { useState, useEffect, useCallback } from 'react';
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
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

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

      // Stop polling if job is completed or failed
      if (data.status === 'completed' || data.status === 'completed_with_errors' || data.status === 'failed') {
        setIsLoading(false);
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
      }
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    }
  }, [pollingInterval]);

  const startPolling = useCallback((jobId: string) => {
    setIsLoading(true);
    setError(null);
    setJob(null);

    // Initial fetch
    fetchJobStatus(jobId);

    // Start polling every 2 seconds
    const interval = setInterval(() => {
      fetchJobStatus(jobId);
    }, 2000);

    setPollingInterval(interval);
  }, [fetchJobStatus]);

  const stopPolling = useCallback(() => {
    setIsLoading(false);
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [pollingInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  return {
    job,
    isLoading,
    error,
    startPolling,
    stopPolling
  };
};
