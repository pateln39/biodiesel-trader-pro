
import { QueryClient } from '@tanstack/react-query';

// Configure the QueryClient with default options
export const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes (renamed from cacheTime in v5)
        retry: 1,
        meta: {
          onError: (error: any) => {
            console.error('Query error:', error);
          },
        },
      },
      mutations: {
        meta: {
          onError: (error: any) => {
            console.error('Mutation error:', error);
          },
        },
      },
    },
  });
};
