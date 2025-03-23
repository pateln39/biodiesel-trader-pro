
import { supabase } from '@/integrations/supabase/client';
import { BaseApiService } from '@/core/api';
import { Invoice, InvoiceStatus, InvoiceType } from '../types';

class InvoiceService extends BaseApiService {
  async getInvoices(): Promise<Invoice[]> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return this.handleError(error);
      }

      // Transform the data from database format to application format
      return data.map(invoice => ({
        id: invoice.id,
        movementId: invoice.movement_id,
        invoiceReference: invoice.invoice_reference,
        invoiceType: invoice.invoice_type as InvoiceType,
        invoiceDate: new Date(invoice.invoice_date),
        dueDate: new Date(invoice.due_date),
        amount: invoice.amount,
        currency: invoice.currency,
        status: invoice.status as InvoiceStatus,
        calculatedPrice: invoice.calculated_price,
        quantity: invoice.quantity,
        vatRate: invoice.vat_rate,
        vatAmount: invoice.vat_amount,
        totalAmount: invoice.total_amount,
        comments: invoice.comments,
        createdAt: new Date(invoice.created_at),
        updatedAt: new Date(invoice.updated_at),
      }));
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getInvoicesByMovement(movementId: string): Promise<Invoice[]> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('movement_id', movementId)
        .order('created_at', { ascending: false });

      if (error) {
        return this.handleError(error);
      }

      // Transform the data from database format to application format
      return data.map(invoice => ({
        id: invoice.id,
        movementId: invoice.movement_id,
        invoiceReference: invoice.invoice_reference,
        invoiceType: invoice.invoice_type as InvoiceType,
        invoiceDate: new Date(invoice.invoice_date),
        dueDate: new Date(invoice.due_date),
        amount: invoice.amount,
        currency: invoice.currency,
        status: invoice.status as InvoiceStatus,
        calculatedPrice: invoice.calculated_price,
        quantity: invoice.quantity,
        vatRate: invoice.vat_rate,
        vatAmount: invoice.vat_amount,
        totalAmount: invoice.total_amount,
        comments: invoice.comments,
        createdAt: new Date(invoice.created_at),
        updatedAt: new Date(invoice.updated_at),
      }));
    } catch (error) {
      return this.handleError(error);
    }
  }

  async createInvoice(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .insert({
          movement_id: invoice.movementId,
          invoice_reference: invoice.invoiceReference,
          invoice_type: invoice.invoiceType,
          invoice_date: invoice.invoiceDate.toISOString().split('T')[0],
          due_date: invoice.dueDate.toISOString().split('T')[0],
          amount: invoice.amount,
          currency: invoice.currency,
          status: invoice.status,
          calculated_price: invoice.calculatedPrice,
          quantity: invoice.quantity,
          vat_rate: invoice.vatRate,
          vat_amount: invoice.vatAmount,
          total_amount: invoice.totalAmount,
          comments: invoice.comments,
        })
        .select()
        .single();

      if (error) {
        return this.handleError(error);
      }

      // Transform the data from database format to application format
      return {
        id: data.id,
        movementId: data.movement_id,
        invoiceReference: data.invoice_reference,
        invoiceType: data.invoice_type as InvoiceType,
        invoiceDate: new Date(data.invoice_date),
        dueDate: new Date(data.due_date),
        amount: data.amount,
        currency: data.currency,
        status: data.status as InvoiceStatus,
        calculatedPrice: data.calculated_price,
        quantity: data.quantity,
        vatRate: data.vat_rate,
        vatAmount: data.vat_amount,
        totalAmount: data.total_amount,
        comments: data.comments,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateInvoice(invoice: Invoice): Promise<Invoice> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .update({
          movement_id: invoice.movementId,
          invoice_reference: invoice.invoiceReference,
          invoice_type: invoice.invoiceType,
          invoice_date: invoice.invoiceDate.toISOString().split('T')[0],
          due_date: invoice.dueDate.toISOString().split('T')[0],
          amount: invoice.amount,
          currency: invoice.currency,
          status: invoice.status,
          calculated_price: invoice.calculatedPrice,
          quantity: invoice.quantity,
          vat_rate: invoice.vatRate,
          vat_amount: invoice.vatAmount,
          total_amount: invoice.totalAmount,
          comments: invoice.comments,
        })
        .eq('id', invoice.id)
        .select()
        .single();

      if (error) {
        return this.handleError(error);
      }

      // Transform the data from database format to application format
      return {
        id: data.id,
        movementId: data.movement_id,
        invoiceReference: data.invoice_reference,
        invoiceType: data.invoice_type as InvoiceType,
        invoiceDate: new Date(data.invoice_date),
        dueDate: new Date(data.due_date),
        amount: data.amount,
        currency: data.currency,
        status: data.status as InvoiceStatus,
        calculatedPrice: data.calculated_price,
        quantity: data.quantity,
        vatRate: data.vat_rate,
        vatAmount: data.vat_amount,
        totalAmount: data.total_amount,
        comments: data.comments,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deleteInvoice(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) {
        this.handleError(error);
      }
    } catch (error) {
      this.handleError(error);
    }
  }
}

export const invoiceService = new InvoiceService();
