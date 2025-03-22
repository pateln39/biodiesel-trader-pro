
import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Generic hook for API calls
export function useApi<T, P>(options: {
  queryKey: string[];
  queryFn: (params?: P) => Promise<{ data: T | null; error: any }>;
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
  enabled?: boolean;
}) {
  const { queryKey, queryFn, onSuccess, onError, enabled = true } = options;

  const result = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await queryFn();

      if (error) {
        throw error;
      }

      return data;
    },
    enabled,
    onSuccess: (data) => {
      if (data && onSuccess) {
        onSuccess(data);
      }
    },
    onError: (error) => {
      console.error('API call failed:', error);
      if (onError) {
        onError(error);
      } else {
        toast.error(error?.message || 'An error occurred while fetching data');
      }
    },
  });

  return result;
}

// Generic hook for API mutations
export function useApiMutation<T, V>(options: {
  mutationFn: (variables: V) => Promise<{ data: T | null; error: any }>;
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
  invalidateQueries?: string[][];
  successMessage?: string;
  errorMessage?: string;
}) {
  const {
    mutationFn,
    onSuccess,
    onError,
    invalidateQueries = [],
    successMessage,
    errorMessage = 'Operation failed',
  } = options;

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (variables: V) => {
      const { data, error } = await mutationFn(variables);

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      if (successMessage) {
        toast.success(successMessage);
      }

      // Invalidate relevant queries
      if (invalidateQueries.length > 0) {
        invalidateQueries.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });
      }

      if (data && onSuccess) {
        onSuccess(data);
      }
    },
    onError: (error: any) => {
      console.error('API mutation failed:', error);
      toast.error(errorMessage);

      if (onError) {
        onError(error);
      }
    },
  });

  return mutation;
}
