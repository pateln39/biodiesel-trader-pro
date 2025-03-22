
import { BaseService } from '@/core/api/baseService';
import { Invoice, InvoiceDto, CreateInvoiceInput, UpdateInvoiceInput } from '../types/invoice';
import { supabaseClient } from '@/core/api/supabaseClient';

// Helper to convert database rows to Invoice objects
const mapInvoiceDtoToInvoice = (dto: InvoiceDto): Invoice => {
  return {
    id: dto.id,
    movementId: dto.movement_id,
    invoiceReference: dto.invoice_reference,
    invoiceType: dto.invoice_type as 'prepayment' | 'final' | 'credit' | 'debit',
    invoiceDate: new Date(dto.invoice_date),
    dueDate: new Date(dto.due_date),
    amount: dto.amount,
    currency: dto.currency,
    status: dto.status as 'draft' | 'issued' | 'paid',
    calculatedPrice: dto.calculated_price || undefined,
    quantity: dto.quantity || undefined,
    vatRate: dto.vat_rate || undefined,
    vatAmount: dto.vat_amount || undefined,
    totalAmount: dto.total_amount || undefined,
    comments: dto.comments || undefined,
    createdAt: new Date(dto.created_at),
    updatedAt: new Date(dto.updated_at),
  };
};

// Invoice service for CRUD operations
class InvoiceService extends BaseService<InvoiceDto> {
  constructor() {
    super('invoices');
  }

  // Get all invoices with transformed results
  async getAllInvoices(options?: {
    movementId?: string;
    status?: string;
    invoiceType?: string;
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
    offset?: number;
  }): Promise<{ data: Invoice[] | null; error: any }> {
    // Prepare filters
    const filters: Record<string, any> = {};
    if (options?.movementId) {
      filters.movement_id = options.movementId;
    }
    if (options?.status) {
      filters.status = options.status;
    }
    if (options?.invoiceType) {
      filters.invoice_type = options.invoiceType;
    }

    const { data, error } = await this.getAll({
      columns: '*',
      filters,
      orderBy: options?.orderBy || { column: 'invoice_date', ascending: false },
      limit: options?.limit,
      offset: options?.offset,
    });

    if (error) {
      return { data: null, error };
    }

    const invoices = data?.map(mapInvoiceDtoToInvoice) || null;
    return { data: invoices, error: null };
  }

  // Get an invoice by ID with transformations
  async getInvoiceById(id: string): Promise<{ data: Invoice | null; error: any }> {
    const { data, error } = await this.getById(id);

    if (error || !data) {
      return { data: null, error };
    }

    const invoice = mapInvoiceDtoToInvoice(data);
    return { data: invoice, error: null };
  }

  // Get invoices with movement details
  async getInvoicesWithMovementDetails(options?: {
    movementId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: (Invoice & { movement: any })[] | null; error: any }> {
    let query = supabaseClient.from('invoices').select(`
      *,
      movements:movement_id (*)
    `);

    if (options?.movementId) {
      query = query.eq('movement_id', options.movementId);
    }

    if (options?.status) {
      query = query.eq('status', options.status);
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

    const invoices = data.map((item: any) => ({
      ...mapInvoiceDtoToInvoice(item),
      movement: item.movements,
    }));

    return { data: invoices, error: null };
  }

  // Create a new invoice
  async createInvoice(
    input: CreateInvoiceInput
  ): Promise<{ data: Invoice | null; error: any }> {
    const { data, error } = await this.create(input, {
      successMessage: 'Invoice created successfully',
    });

    if (error || !data) {
      return { data: null, error };
    }

    const invoice = mapInvoiceDtoToInvoice(data);
    return { data: invoice, error: null };
  }

  // Update an invoice
  async updateInvoice(
    id: string,
    updates: UpdateInvoiceInput
  ): Promise<{ data: Invoice | null; error: any }> {
    const { data, error } = await this.update(id, updates, {
      successMessage: 'Invoice updated successfully',
    });

    if (error || !data) {
      return { data: null, error };
    }

    const invoice = mapInvoiceDtoToInvoice(data);
    return { data: invoice, error: null };
  }

  // Delete an invoice
  async deleteInvoice(
    id: string
  ): Promise<{ error: any }> {
    return await this.delete(id, {
      successMessage: 'Invoice deleted successfully',
    });
  }

  // Calculate total payments for an invoice
  async calculateTotalPayments(invoiceId: string): Promise<{ 
    totalPaid: number;
    error: any 
  }> {
    const { data, error } = await supabaseClient
      .from('payments')
      .select('amount')
      .eq('invoice_id', invoiceId);

    if (error) {
      return { totalPaid: 0, error };
    }

    const totalPaid = data.reduce((sum, payment) => {
      return sum + payment.amount;
    }, 0);

    return { totalPaid, error: null };
  }
  
  // Update invoice status based on payments
  async updateInvoiceStatus(invoiceId: string): Promise<{ data: Invoice | null; error: any }> {
    // First get the invoice details
    const { data: invoice, error: invoiceError } = await this.getInvoiceById(invoiceId);
    
    if (invoiceError || !invoice) {
      return { data: null, error: invoiceError };
    }
    
    // Calculate total payments
    const { totalPaid, error: paymentError } = await this.calculateTotalPayments(invoiceId);
    
    if (paymentError) {
      return { data: null, error: paymentError };
    }
    
    // Determine new status
    let newStatus: 'draft' | 'issued' | 'paid' = invoice.status;
    
    if (totalPaid >= invoice.amount) {
      newStatus = 'paid';
    } else if (totalPaid > 0) {
      newStatus = 'issued'; // Partially paid, still outstanding
    }
    
    // Only update if status changed
    if (newStatus !== invoice.status) {
      return await this.updateInvoice(invoiceId, { status: newStatus });
    }
    
    return { data: invoice, error: null };
  }

  // Generate a prepayment invoice for a movement
  async generatePrepaymentInvoice(
    movementId: string,
    data: {
      amount: number;
      dueDate: string;
      vatRate?: number;
      comments?: string;
    }
  ): Promise<{ data: Invoice | null; error: any }> {
    // Get movement details
    const { data: movement, error: movementError } = await supabaseClient
      .from('movements')
      .select(`
        *,
        trade_legs:trade_leg_id (*)
      `)
      .eq('id', movementId)
      .single();
    
    if (movementError) {
      return { data: null, error: movementError };
    }
    
    // Generate unique invoice reference
    const invoiceReference = `PRE-${movement.movement_reference}`;
    
    // Calculate VAT amount if applicable
    const vatAmount = data.vatRate ? (data.amount * (data.vatRate / 100)) : 0;
    const totalAmount = data.amount + vatAmount;
    
    // Create the invoice
    const invoiceData: CreateInvoiceInput = {
      movement_id: movementId,
      invoice_reference: invoiceReference,
      invoice_type: 'prepayment',
      invoice_date: new Date().toISOString().split('T')[0], // Today
      due_date: data.dueDate,
      amount: data.amount,
      currency: 'USD', // Default currency
      status: 'issued',
      quantity: movement.bl_quantity || 0,
      vat_rate: data.vatRate,
      vat_amount: vatAmount,
      total_amount: totalAmount,
      comments: data.comments,
    };
    
    return await this.createInvoice(invoiceData);
  }

  // Generate a final invoice for a completed movement
  async generateFinalInvoice(
    movementId: string,
    data: {
      calculatedPrice: number;
      dueDate: string;
      vatRate?: number;
      comments?: string;
    }
  ): Promise<{ data: Invoice | null; error: any }> {
    // Get movement details
    const { data: movement, error: movementError } = await supabaseClient
      .from('movements')
      .select(`
        *,
        trade_legs:trade_leg_id (*)
      `)
      .eq('id', movementId)
      .single();
    
    if (movementError) {
      return { data: null, error: movementError };
    }
    
    if (!movement.actualized || !movement.actualized_quantity) {
      return { data: null, error: new Error('Movement must be actualized before generating final invoice') };
    }
    
    // Generate unique invoice reference
    const invoiceReference = `FIN-${movement.movement_reference}`;
    
    // Calculate final amount
    const amount = data.calculatedPrice * movement.actualized_quantity;
    
    // Calculate VAT amount if applicable
    const vatAmount = data.vatRate ? (amount * (data.vatRate / 100)) : 0;
    const totalAmount = amount + vatAmount;
    
    // Create the invoice
    const invoiceData: CreateInvoiceInput = {
      movement_id: movementId,
      invoice_reference: invoiceReference,
      invoice_type: 'final',
      invoice_date: new Date().toISOString().split('T')[0], // Today
      due_date: data.dueDate,
      amount: amount,
      currency: 'USD', // Default currency
      status: 'issued',
      calculated_price: data.calculatedPrice,
      quantity: movement.actualized_quantity,
      vat_rate: data.vatRate,
      vat_amount: vatAmount,
      total_amount: totalAmount,
      comments: data.comments,
    };
    
    return await this.createInvoice(invoiceData);
  }
}

export const invoiceService = new InvoiceService();
