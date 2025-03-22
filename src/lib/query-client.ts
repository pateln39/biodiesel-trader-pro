
import { QueryClient } from '@tanstack/react-query';

// Configure the QueryClient with default options
export const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 30 * 60 * 1000, // 30 minutes
        retry: 1,
        onError: (error) => {
          console.error('Query error:', error);
        },
      },
      mutations: {
        onError: (error) => {
          console.error('Mutation error:', error);
        },
      },
    },
  });
};
