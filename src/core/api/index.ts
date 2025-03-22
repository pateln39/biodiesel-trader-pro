
// Export all API utilities and clients
import { supabase } from '@/integrations/supabase/client';

export { supabase };

// Base API service with common functionality
export class BaseApiService {
  protected handleError(error: any): never {
    console.error('API Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }
}
