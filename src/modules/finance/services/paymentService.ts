
import { supabase } from '@/integrations/supabase/client';
import { BaseApiService } from '@/core/api';
import { Payment } from '../types';

class PaymentService extends BaseApiService {
  async getPayments(): Promise<Payment[]> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return this.handleError(error);
      }

      // Transform the data from database format to application format
      return data.map(payment => ({
        id: payment.id,
        invoiceId: payment.invoice_id,
        paymentReference: payment.payment_reference,
        paymentDate: new Date(payment.payment_date),
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: payment.payment_method,
        comments: payment.comments,
        createdAt: new Date(payment.created_at),
        updatedAt: new Date(payment.updated_at),
      }));
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getPaymentsByInvoice(invoiceId: string): Promise<Payment[]> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('created_at', { ascending: false });

      if (error) {
        return this.handleError(error);
      }

      // Transform the data from database format to application format
      return data.map(payment => ({
        id: payment.id,
        invoiceId: payment.invoice_id,
        paymentReference: payment.payment_reference,
        paymentDate: new Date(payment.payment_date),
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: payment.payment_method,
        comments: payment.comments,
        createdAt: new Date(payment.created_at),
        updatedAt: new Date(payment.updated_at),
      }));
    } catch (error) {
      return this.handleError(error);
    }
  }

  async createPayment(payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Payment> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert({
          invoice_id: payment.invoiceId,
          payment_reference: payment.paymentReference,
          payment_date: payment.paymentDate.toISOString().split('T')[0],
          amount: payment.amount,
          currency: payment.currency,
          payment_method: payment.paymentMethod,
          comments: payment.comments,
        })
        .select()
        .single();

      if (error) {
        return this.handleError(error);
      }

      // Transform the data from database format to application format
      return {
        id: data.id,
        invoiceId: data.invoice_id,
        paymentReference: data.payment_reference,
        paymentDate: new Date(data.payment_date),
        amount: data.amount,
        currency: data.currency,
        paymentMethod: data.payment_method,
        comments: data.comments,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updatePayment(payment: Payment): Promise<Payment> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update({
          invoice_id: payment.invoiceId,
          payment_reference: payment.paymentReference,
          payment_date: payment.paymentDate.toISOString().split('T')[0],
          amount: payment.amount,
          currency: payment.currency,
          payment_method: payment.paymentMethod,
          comments: payment.comments,
        })
        .eq('id', payment.id)
        .select()
        .single();

      if (error) {
        return this.handleError(error);
      }

      // Transform the data from database format to application format
      return {
        id: data.id,
        invoiceId: data.invoice_id,
        paymentReference: data.payment_reference,
        paymentDate: new Date(data.payment_date),
        amount: data.amount,
        currency: data.currency,
        paymentMethod: data.payment_method,
        comments: data.comments,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deletePayment(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('payments')
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

export const paymentService = new PaymentService();
