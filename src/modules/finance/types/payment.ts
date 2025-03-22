
export interface Payment {
  id: string;
  invoiceId: string;
  paymentReference: string;
  paymentDate: Date;
  amount: number;
  currency: string;
  paymentMethod?: string;
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  invoice?: import('./invoice').Invoice;
}

export interface PaymentDto {
  id: string;
  invoice_id: string;
  payment_reference: string;
  payment_date: string;
  amount: number;
  currency: string;
  payment_method: string | null;
  comments: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentInput {
  invoice_id: string;
  payment_reference: string;
  payment_date: string;
  amount: number;
  currency?: string;
  payment_method?: string;
  comments?: string;
}

export interface UpdatePaymentInput {
  payment_date?: string;
  amount?: number;
  currency?: string;
  payment_method?: string | null;
  comments?: string | null;
}
