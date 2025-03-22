
export interface Invoice {
  id: string;
  movementId: string;
  invoiceReference: string;
  invoiceType: 'prepayment' | 'final' | 'credit' | 'debit';
  invoiceDate: Date;
  dueDate: Date;
  amount: number;
  currency: string;
  status: 'draft' | 'issued' | 'paid';
  calculatedPrice?: number;
  quantity?: number;
  vatRate?: number;
  vatAmount?: number;
  totalAmount?: number;
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  movement?: import('@/modules/operations/types').Movement;
  payments?: Payment[];
}

export interface InvoiceDto {
  id: string;
  movement_id: string;
  invoice_reference: string;
  invoice_type: string;
  invoice_date: string;
  due_date: string;
  amount: number;
  currency: string;
  status: string;
  calculated_price: number | null;
  quantity: number | null;
  vat_rate: number | null;
  vat_amount: number | null;
  total_amount: number | null;
  comments: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateInvoiceInput {
  movement_id: string;
  invoice_reference: string;
  invoice_type: 'prepayment' | 'final' | 'credit' | 'debit';
  invoice_date: string;
  due_date: string;
  amount: number;
  currency?: string;
  status?: 'draft' | 'issued' | 'paid';
  calculated_price?: number;
  quantity?: number;
  vat_rate?: number;
  vat_amount?: number;
  total_amount?: number;
  comments?: string;
}

export interface UpdateInvoiceInput {
  invoice_type?: 'prepayment' | 'final' | 'credit' | 'debit';
  invoice_date?: string;
  due_date?: string;
  amount?: number;
  currency?: string;
  status?: 'draft' | 'issued' | 'paid';
  calculated_price?: number | null;
  quantity?: number | null;
  vat_rate?: number | null;
  vat_amount?: number | null;
  total_amount?: number | null;
  comments?: string | null;
}
