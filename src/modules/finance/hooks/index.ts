
// Export all hooks from the finance module
import { useQuery } from '@tanstack/react-query';
import { paymentService } from '../services/paymentService';
import { Payment } from '../types';

/**
 * Hook to fetch all payments
 */
export const usePayments = () => {
  return useQuery({
    queryKey: ['payments'],
    queryFn: () => paymentService.getPayments(),
  });
};

/**
 * Hook to fetch payments for a specific invoice
 */
export const useInvoicePayments = (invoiceId: string) => {
  return useQuery({
    queryKey: ['payments', 'invoice', invoiceId],
    queryFn: () => paymentService.getPaymentsByInvoice(invoiceId),
    enabled: !!invoiceId,
  });
};
