
import { QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      onError: (error: any) => {
        console.error('Query error:', error);
        toast.error(error?.message || 'An error occurred while fetching data');
      },
    },
    mutations: {
      onError: (error: any) => {
        console.error('Mutation error:', error);
        toast.error(error?.message || 'An error occurred while updating data');
      },
    },
  },
});
