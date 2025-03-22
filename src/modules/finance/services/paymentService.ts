
import { BaseService } from '@/core/api/baseService';
import { Payment, PaymentDto, CreatePaymentInput, UpdatePaymentInput } from '../types/payment';
import { supabaseClient } from '@/core/api/supabaseClient';
import { invoiceService } from './invoiceService';

// Helper to convert database rows to Payment objects
const mapPaymentDtoToPayment = (dto: PaymentDto): Payment => {
  return {
    id: dto.id,
    invoiceId: dto.invoice_id,
    paymentReference: dto.payment_reference,
    paymentDate: new Date(dto.payment_date),
    amount: dto.amount,
    currency: dto.currency,
    paymentMethod: dto.payment_method || undefined,
    comments: dto.comments || undefined,
    createdAt: new Date(dto.created_at),
    updatedAt: new Date(dto.updated_at),
  };
};

// Payment service for CRUD operations
class PaymentService extends BaseService<PaymentDto> {
  constructor() {
    super('payments');
  }

  // Get all payments with transformed results
  async getAllPayments(options?: {
    invoiceId?: string;
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
    offset?: number;
  }): Promise<{ data: Payment[] | null; error: any }> {
    // Prepare filters
    const filters: Record<string, any> = {};
    if (options?.invoiceId) {
      filters.invoice_id = options.invoiceId;
    }

    const { data, error } = await this.getAll({
      columns: '*',
      filters,
      orderBy: options?.orderBy || { column: 'payment_date', ascending: false },
      limit: options?.limit,
      offset: options?.offset,
    });

    if (error) {
      return { data: null, error };
    }

    const payments = data?.map(mapPaymentDtoToPayment) || null;
    return { data: payments, error: null };
  }

  // Get a payment by ID with transformations
  async getPaymentById(id: string): Promise<{ data: Payment | null; error: any }> {
    const { data, error } = await this.getById(id);

    if (error || !data) {
      return { data: null, error };
    }

    const payment = mapPaymentDtoToPayment(data);
    return { data: payment, error: null };
  }

  // Get payments with invoice details
  async getPaymentsWithInvoiceDetails(options?: {
    invoiceId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: (Payment & { invoice: any })[] | null; error: any }> {
    let query = supabaseClient.from('payments').select(`
      *,
      invoices:invoice_id (*)
    `);

    if (options?.invoiceId) {
      query = query.eq('invoice_id', options.invoiceId);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error };
    }

    const payments = data.map((item: any) => ({
      ...mapPaymentDtoToPayment(item),
      invoice: item.invoices,
    }));

    return { data: payments, error: null };
  }

  // Create a new payment and update invoice status
  async createPayment(
    input: CreatePaymentInput
  ): Promise<{ data: Payment | null; error: any }> {
    // Start a Supabase transaction
    const { data, error } = await supabaseClient.rpc('begin_transaction');

    try {
      // 1. Create the payment
      const { data: paymentData, error: paymentError } = await this.create(input, {
        successMessage: 'Payment recorded successfully',
      });
      
      if (paymentError) {
        throw paymentError;
      }
      
      // 2. Update the invoice status based on payments
      await invoiceService.updateInvoiceStatus(input.invoice_id);
      
      // Return the payment data
      if (!paymentData) {
        throw new Error('Failed to create payment');
      }
      
      const payment = mapPaymentDtoToPayment(paymentData);
      return { data: payment, error: null };
    } catch (error) {
      // If anything fails, return the error
      console.error('Error creating payment:', error);
      return { data: null, error };
    }
  }

  // Update a payment
  async updatePayment(
    id: string,
    updates: UpdatePaymentInput
  ): Promise<{ data: Payment | null; error: any }> {
    // Get the current payment to get the invoice ID
    const { data: currentPayment, error: fetchError } = await this.getPaymentById(id);
    
    if (fetchError || !currentPayment) {
      return { data: null, error: fetchError };
    }
    
    // Update the payment
    const { data, error } = await this.update(id, updates, {
      successMessage: 'Payment updated successfully',
    });
    
    if (error || !data) {
      return { data: null, error };
    }
    
    // Update the invoice status based on payments
    await invoiceService.updateInvoiceStatus(currentPayment.invoiceId);
    
    const payment = mapPaymentDtoToPayment(data);
    return { data: payment, error: null };
  }

  // Delete a payment
  async deletePayment(
    id: string
  ): Promise<{ error: any }> {
    // Get the current payment to get the invoice ID
    const { data: currentPayment, error: fetchError } = await this.getPaymentById(id);
    
    if (fetchError || !currentPayment) {
      return { error: fetchError };
    }
    
    // Delete the payment
    const { error } = await this.delete(id, {
      successMessage: 'Payment deleted successfully',
    });
    
    if (error) {
      return { error };
    }
    
    // Update the invoice status based on payments
    await invoiceService.updateInvoiceStatus(currentPayment.invoiceId);
    
    return { error: null };
  }
  
  // Get total payments for an invoice
  async getTotalPaymentsForInvoice(invoiceId: string): Promise<{ 
    totalPaid: number; 
    payments: Payment[];
    error: any;
  }> {
    const { data, error } = await this.getAllPayments({ invoiceId });
    
    if (error) {
      return { totalPaid: 0, payments: [], error };
    }
    
    const payments = data || [];
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    return { totalPaid, payments, error: null };
  }
  
  // Get payment summary by currency
  async getPaymentSummaryByCurrency(): Promise<{
    data: { currency: string; totalAmount: number }[] | null;
    error: any;
  }> {
    const { data, error } = await supabaseClient
      .from('payments')
      .select('currency, amount');
      
    if (error) {
      return { data: null, error };
    }
    
    // Aggregate by currency
    const summary = data.reduce<Record<string, number>>((acc, payment) => {
      const currency = payment.currency;
      if (!acc[currency]) {
        acc[currency] = 0;
      }
      acc[currency] += payment.amount;
      return acc;
    }, {});
    
    // Convert to array format
    const result = Object.entries(summary).map(([currency, totalAmount]) => ({
      currency,
      totalAmount,
    }));
    
    return { data: result, error: null };
  }
}

export const paymentService = new PaymentService();
