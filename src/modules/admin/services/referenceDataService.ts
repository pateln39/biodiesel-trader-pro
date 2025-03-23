import { supabase } from '@/integrations/supabase/client';
import { BaseApiService } from '@/core/api';
import type { 
  Counterparty, 
  Product, 
  PricingInstrument,
  HistoricalPrice, 
  ForwardPrice 
} from '../types/reference-data';

class ReferenceDataService extends BaseApiService {
  // Counterparty methods
  async getCounterparties(): Promise<Counterparty[]> {
    try {
      const { data, error } = await supabase
        .from('counterparties')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        return this.handleError(error);
      }

      return data.map(counterparty => ({
        id: counterparty.id,
        name: counterparty.name,
        vatNumber: counterparty.vat_number,
        bankDetails: counterparty.bank_details as Record<string, any>,
        contactDetails: counterparty.contact_details as Record<string, any>,
        isActive: counterparty.is_active,
        createdAt: new Date(counterparty.created_at),
        updatedAt: new Date(counterparty.updated_at),
      }));
    } catch (error) {
      return this.handleError(error);
    }
  }

  async createCounterparty(counterparty: Omit<Counterparty, 'id' | 'createdAt' | 'updatedAt'>): Promise<Counterparty> {
    try {
      const { data, error } = await supabase
        .from('counterparties')
        .insert({
          name: counterparty.name,
          vat_number: counterparty.vatNumber,
          bank_details: counterparty.bankDetails as Record<string, any>,
          contact_details: counterparty.contactDetails as Record<string, any>,
          is_active: counterparty.isActive,
        })
        .select()
        .single();

      if (error) {
        return this.handleError(error);
      }

      return {
        id: data.id,
        name: data.name,
        vatNumber: data.vat_number,
        bankDetails: data.bank_details as Record<string, any>,
        contactDetails: data.contact_details as Record<string, any>,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateCounterparty(counterparty: Counterparty): Promise<Counterparty> {
    try {
      const { data, error } = await supabase
        .from('counterparties')
        .update({
          name: counterparty.name,
          vat_number: counterparty.vatNumber,
          bank_details: counterparty.bankDetails as Record<string, any>,
          contact_details: counterparty.contactDetails as Record<string, any>,
          is_active: counterparty.isActive,
        })
        .eq('id', counterparty.id)
        .select()
        .single();

      if (error) {
        return this.handleError(error);
      }

      return {
        id: data.id,
        name: data.name,
        vatNumber: data.vat_number,
        bankDetails: data.bank_details as Record<string, any>,
        contactDetails: data.contact_details as Record<string, any>,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deleteCounterparty(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('counterparties')
        .delete()
        .eq('id', id);

      if (error) {
        this.handleError(error);
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  // Product methods
  async getProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        return this.handleError(error);
      }

      return data.map(product => ({
        id: product.id,
        name: product.name,
        createdAt: new Date(product.created_at),
      }));
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Pricing Instrument methods
  async getPricingInstruments(): Promise<PricingInstrument[]> {
    try {
      const { data, error } = await supabase
        .from('pricing_instruments')
        .select('*')
        .order('display_name', { ascending: true });

      if (error) {
        return this.handleError(error);
      }

      return data.map(instrument => ({
        id: instrument.id,
        instrumentCode: instrument.instrument_code,
        displayName: instrument.display_name,
        description: instrument.description,
        category: instrument.category,
        isActive: instrument.is_active,
        createdAt: new Date(instrument.created_at),
        updatedAt: new Date(instrument.updated_at),
      }));
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Historical Price methods
  async getHistoricalPrices(instrumentId: string, startDate: Date, endDate: Date): Promise<HistoricalPrice[]> {
    try {
      const { data, error } = await supabase
        .from('historical_prices')
        .select('*')
        .eq('instrument_id', instrumentId)
        .gte('price_date', startDate.toISOString().split('T')[0])
        .lte('price_date', endDate.toISOString().split('T')[0])
        .order('price_date', { ascending: true });

      if (error) {
        return this.handleError(error);
      }

      return data.map(price => ({
        id: price.id,
        instrumentId: price.instrument_id,
        priceDate: new Date(price.price_date),
        price: price.price,
        createdAt: new Date(price.created_at),
        updatedAt: new Date(price.updated_at),
      }));
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Forward Price methods
  async getForwardPrices(instrumentId: string): Promise<ForwardPrice[]> {
    try {
      const { data, error } = await supabase
        .from('forward_prices')
        .select('*')
        .eq('instrument_id', instrumentId)
        .order('forward_month', { ascending: true });

      if (error) {
        return this.handleError(error);
      }

      return data.map(price => ({
        id: price.id,
        instrumentId: price.instrument_id,
        forwardMonth: new Date(price.forward_month),
        price: price.price,
        createdAt: new Date(price.created_at),
        updatedAt: new Date(price.updated_at),
      }));
    } catch (error) {
      return this.handleError(error);
    }
  }
}

export const referenceDataService = new ReferenceDataService();
