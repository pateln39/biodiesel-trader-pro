
import { supabaseClient } from './supabaseClient';
import { toast } from 'sonner';

// Base service class for common database operations
export class BaseService<T> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  // Get all records with optional filters
  async getAll(options?: {
    columns?: string;
    filters?: Record<string, any>;
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
    offset?: number;
  }): Promise<{ data: T[] | null; error: any }> {
    const { columns = '*', filters, orderBy, limit, offset } = options || {};

    let query = supabaseClient.from(this.tableName).select(columns);

    // Apply filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }

    // Apply ordering
    if (orderBy) {
      query = query.order(orderBy.column, {
        ascending: orderBy.ascending !== false,
      });
    }

    // Apply pagination
    if (limit) {
      query = query.limit(limit);
    }

    if (offset) {
      query = query.range(offset, offset + (limit || 20) - 1);
    }

    return await query;
  }

  // Get a record by ID
  async getById(
    id: string,
    options?: { columns?: string }
  ): Promise<{ data: T | null; error: any }> {
    const { columns = '*' } = options || {};

    const { data, error } = await supabaseClient
      .from(this.tableName)
      .select(columns)
      .eq('id', id)
      .single();

    return { data, error };
  }

  // Create a new record
  async create(
    record: Partial<T>,
    options?: { successMessage?: string }
  ): Promise<{ data: T | null; error: any }> {
    const { successMessage = 'Record created successfully' } = options || {};

    const { data, error } = await supabaseClient
      .from(this.tableName)
      .insert(record)
      .select()
      .single();

    if (!error && successMessage) {
      toast.success(successMessage);
    }

    return { data, error };
  }

  // Update a record
  async update(
    id: string,
    updates: Partial<T>,
    options?: { successMessage?: string }
  ): Promise<{ data: T | null; error: any }> {
    const { successMessage = 'Record updated successfully' } = options || {};

    const { data, error } = await supabaseClient
      .from(this.tableName)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (!error && successMessage) {
      toast.success(successMessage);
    }

    return { data, error };
  }

  // Delete a record
  async delete(
    id: string,
    options?: { successMessage?: string }
  ): Promise<{ error: any }> {
    const { successMessage = 'Record deleted successfully' } = options || {};

    const { error } = await supabaseClient
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (!error && successMessage) {
      toast.success(successMessage);
    }

    return { error };
  }

  // Count records with optional filters
  async count(filters?: Record<string, any>): Promise<{ count: number | null; error: any }> {
    let query = supabaseClient.from(this.tableName).select('*', { count: 'exact', head: true });

    // Apply filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }

    const { count, error } = await query;

    return { count, error };
  }
}

export default BaseService;
