
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Enhanced error handling for Supabase client
export const executeQuery = async <T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: {
    errorMessage?: string;
    successMessage?: string;
    retry?: boolean;
    retryCount?: number;
  } = {}
) => {
  const {
    errorMessage = 'An error occurred while fetching data',
    successMessage,
    retry = true,
    retryCount = 3,
  } = options;

  let currentRetry = 0;

  const executeWithRetry = async (): Promise<{ data: T | null; error: any }> => {
    try {
      const { data, error } = await queryFn();

      if (error) {
        console.error('Supabase query error:', error);

        if (retry && currentRetry < retryCount) {
          currentRetry++;
          console.log(`Retrying... Attempt ${currentRetry} of ${retryCount}`);
          return executeWithRetry();
        }

        toast.error(errorMessage);
        return { data: null, error };
      }

      if (successMessage) {
        toast.success(successMessage);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error in Supabase query:', error);
      toast.error(errorMessage);
      return { data: null, error };
    }
  };

  return executeWithRetry();
};

// API logging middleware
const logRequest = (method: string, path: string, params?: any) => {
  console.log(`[Supabase Request] ${method} ${path}`, params);
};

const logResponse = (method: string, path: string, data: any, error: any) => {
  if (error) {
    console.error(`[Supabase Response Error] ${method} ${path}`, error);
  } else {
    console.log(`[Supabase Response] ${method} ${path}`, data);
  }
};

// Enhanced Supabase client with logging
export const enhancedSupabase = {
  // Select with logging
  from: (table: string) => {
    const originalFrom = supabase.from(table);
    
    return {
      ...originalFrom,
      select: (columns?: string) => {
        logRequest('SELECT', table, { columns });
        const query = originalFrom.select(columns);
        
        // Override then() to log response
        const originalThen = query.then.bind(query);
        query.then = (onfulfilled, onrejected) => {
          return originalThen((result) => {
            logResponse('SELECT', table, result.data, result.error);
            return onfulfilled ? onfulfilled(result) : result;
          }, onrejected);
        };
        
        return query;
      },
      insert: (values: any, options?: any) => {
        logRequest('INSERT', table, { values, options });
        const query = originalFrom.insert(values, options);
        
        const originalThen = query.then.bind(query);
        query.then = (onfulfilled, onrejected) => {
          return originalThen((result) => {
            logResponse('INSERT', table, result.data, result.error);
            return onfulfilled ? onfulfilled(result) : result;
          }, onrejected);
        };
        
        return query;
      },
      update: (values: any, options?: any) => {
        logRequest('UPDATE', table, { values, options });
        const query = originalFrom.update(values, options);
        
        const originalThen = query.then.bind(query);
        query.then = (onfulfilled, onrejected) => {
          return originalThen((result) => {
            logResponse('UPDATE', table, result.data, result.error);
            return onfulfilled ? onfulfilled(result) : result;
          }, onrejected);
        };
        
        return query;
      },
      delete: (options?: any) => {
        logRequest('DELETE', table, { options });
        const query = originalFrom.delete(options);
        
        const originalThen = query.then.bind(query);
        query.then = (onfulfilled, onrejected) => {
          return originalThen((result) => {
            logResponse('DELETE', table, result.data, result.error);
            return onfulfilled ? onfulfilled(result) : result;
          }, onrejected);
        };
        
        return query;
      },
    };
  },
  // Direct client access
  client: supabase,
};

export const supabaseClient = enhancedSupabase;
