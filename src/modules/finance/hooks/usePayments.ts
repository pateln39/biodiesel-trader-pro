
import { useMemo } from 'react';
import { useApi, useApiMutation } from '@/core/hooks/useApi';
import { paymentService } from '../services/paymentService';
import { Payment, CreatePaymentInput, UpdatePaymentInput } from '../types/payment';

// Hook for getting all payments
export const usePayments = (options?: {
  invoiceId?: string;
  limit?: number;
  offset?: number;
  withInvoiceDetails?: boolean;
  enabled?: boolean;
}) => {
  const {
    invoiceId,
    limit,
    offset,
    withInvoiceDetails = false,
    enabled = true,
  } = options || {};

  const queryFn = async () => {
    if (withInvoiceDetails) {
      return await paymentService.getPaymentsWithInvoiceDetails({
        invoiceId,
        limit,
        offset,
      });
    } else {
      return await paymentService.getAllPayments({
        invoiceId,
        orderBy: { column: 'payment_date', ascending: false },
        limit,
        offset,
      });
    }
  };

  const queryKey = useMemo(() => {
    const key = ['payments'];
    if (invoiceId) key.push(invoiceId);
    if (limit) key.push(limit.toString());
    if (offset) key.push(offset.toString());
    if (withInvoiceDetails) key.push('withInvoiceDetails');
    return key;
  }, [invoiceId, limit, offset, withInvoiceDetails]);

  return useApi<Payment[], void>({
    queryKey,
    queryFn,
    enabled,
  });
};

// Hook for getting a single payment by ID
export const usePayment = (id: string, options?: { enabled?: boolean }) => {
  const { enabled = true } = options || {};

  return useApi<Payment, void>({
    queryKey: ['payment', id],
    queryFn: async () => await paymentService.getPaymentById(id),
    enabled: !!id && enabled,
  });
};

// Hook for creating a new payment
export const useCreatePayment = (options?: {
  onSuccess?: (data: Payment) => void;
}) => {
  return useApiMutation<Payment, CreatePaymentInput>({
    mutationFn: (data) => paymentService.createPayment(data),
    onSuccess: options?.onSuccess,
    invalidateQueries: [['payments'], ['invoices'], ['totalPayments']],
    successMessage: 'Payment recorded successfully',
  });
};

// Hook for updating a payment
export const useUpdatePayment = (options?: {
  onSuccess?: (data: Payment) => void;
}) => {
  return useApiMutation<Payment, { id: string; data: UpdatePaymentInput }>({
    mutationFn: ({ id, data }) => paymentService.updatePayment(id, data),
    onSuccess: options?.onSuccess,
    invalidateQueries: [['payments'], ['payment'], ['invoices'], ['totalPayments']],
    successMessage: 'Payment updated successfully',
  });
};

// Hook for deleting a payment
export const useDeletePayment = (options?: {
  onSuccess?: () => void;
}) => {
  return useApiMutation<null, string>({
    mutationFn: (id) => paymentService.deletePayment(id),
    onSuccess: options?.onSuccess,
    invalidateQueries: [['payments'], ['invoices'], ['totalPayments']],
    successMessage: 'Payment deleted successfully',
  });
};

// Hook for getting total payments for an invoice with payment details
export const useInvoicePaymentDetails = (invoiceId: string, options?: { enabled?: boolean }) => {
  const { enabled = true } = options || {};

  return useApi<{ totalPaid: number; payments: Payment[] }, void>({
    queryKey: ['invoicePaymentDetails', invoiceId],
    queryFn: async () => {
      const { totalPaid, payments, error } = await paymentService.getTotalPaymentsForInvoice(invoiceId);
      return { data: { totalPaid, payments }, error };
    },
    enabled: !!invoiceId && enabled,
  });
};

// Hook for getting payment summary by currency
export const usePaymentSummaryByCurrency = (options?: { enabled?: boolean }) => {
  const { enabled = true } = options || {};

  return useApi<{ currency: string; totalAmount: number }[], void>({
    queryKey: ['paymentSummaryByCurrency'],
    queryFn: async () => await paymentService.getPaymentSummaryByCurrency(),
    enabled,
  });
};
