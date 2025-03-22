
import { useMemo } from 'react';
import { useApi, useApiMutation } from '@/core/hooks/useApi';
import { invoiceService } from '../services/invoiceService';
import { Invoice, CreateInvoiceInput, UpdateInvoiceInput } from '../types/invoice';

// Hook for getting all invoices
export const useInvoices = (options?: {
  movementId?: string;
  status?: string;
  invoiceType?: string;
  limit?: number;
  offset?: number;
  withMovementDetails?: boolean;
  enabled?: boolean;
}) => {
  const {
    movementId,
    status,
    invoiceType,
    limit,
    offset,
    withMovementDetails = false,
    enabled = true,
  } = options || {};

  const queryFn = async () => {
    if (withMovementDetails) {
      return await invoiceService.getInvoicesWithMovementDetails({
        movementId,
        status,
        limit,
        offset,
      });
    } else {
      return await invoiceService.getAllInvoices({
        movementId,
        status,
        invoiceType,
        orderBy: { column: 'invoice_date', ascending: false },
        limit,
        offset,
      });
    }
  };

  const queryKey = useMemo(() => {
    const key = ['invoices'];
    if (movementId) key.push(movementId);
    if (status) key.push(status);
    if (invoiceType) key.push(invoiceType);
    if (limit) key.push(limit.toString());
    if (offset) key.push(offset.toString());
    if (withMovementDetails) key.push('withMovementDetails');
    return key;
  }, [movementId, status, invoiceType, limit, offset, withMovementDetails]);

  return useApi<Invoice[], void>({
    queryKey,
    queryFn,
    enabled,
  });
};

// Hook for getting a single invoice by ID
export const useInvoice = (id: string, options?: { enabled?: boolean }) => {
  const { enabled = true } = options || {};

  return useApi<Invoice, void>({
    queryKey: ['invoice', id],
    queryFn: async () => await invoiceService.getInvoiceById(id),
    enabled: !!id && enabled,
  });
};

// Hook for creating a new invoice
export const useCreateInvoice = (options?: {
  onSuccess?: (data: Invoice) => void;
}) => {
  return useApiMutation<Invoice, CreateInvoiceInput>({
    mutationFn: (data) => invoiceService.createInvoice(data),
    onSuccess: options?.onSuccess,
    invalidateQueries: [['invoices']],
    successMessage: 'Invoice created successfully',
  });
};

// Hook for updating an invoice
export const useUpdateInvoice = (options?: {
  onSuccess?: (data: Invoice) => void;
}) => {
  return useApiMutation<Invoice, { id: string; data: UpdateInvoiceInput }>({
    mutationFn: ({ id, data }) => invoiceService.updateInvoice(id, data),
    onSuccess: options?.onSuccess,
    invalidateQueries: [['invoices'], ['invoice']],
    successMessage: 'Invoice updated successfully',
  });
};

// Hook for deleting an invoice
export const useDeleteInvoice = (options?: {
  onSuccess?: () => void;
}) => {
  return useApiMutation<null, string>({
    mutationFn: (id) => invoiceService.deleteInvoice(id),
    onSuccess: options?.onSuccess,
    invalidateQueries: [['invoices']],
    successMessage: 'Invoice deleted successfully',
  });
};

// Hook for generating a prepayment invoice
export const useGeneratePrepaymentInvoice = (options?: {
  onSuccess?: (data: Invoice) => void;
}) => {
  return useApiMutation<
    Invoice,
    {
      movementId: string;
      data: {
        amount: number;
        dueDate: string;
        vatRate?: number;
        comments?: string;
      };
    }
  >({
    mutationFn: ({ movementId, data }) =>
      invoiceService.generatePrepaymentInvoice(movementId, data),
    onSuccess: options?.onSuccess,
    invalidateQueries: [['invoices']],
    successMessage: 'Prepayment invoice generated successfully',
  });
};

// Hook for generating a final invoice
export const useGenerateFinalInvoice = (options?: {
  onSuccess?: (data: Invoice) => void;
}) => {
  return useApiMutation<
    Invoice,
    {
      movementId: string;
      data: {
        calculatedPrice: number;
        dueDate: string;
        vatRate?: number;
        comments?: string;
      };
    }
  >({
    mutationFn: ({ movementId, data }) =>
      invoiceService.generateFinalInvoice(movementId, data),
    onSuccess: options?.onSuccess,
    invalidateQueries: [['invoices']],
    successMessage: 'Final invoice generated successfully',
  });
};

// Hook for calculating total payments for an invoice
export const useTotalPayments = (invoiceId: string, options?: { enabled?: boolean }) => {
  const { enabled = true } = options || {};

  return useApi<{ totalPaid: number }, void>({
    queryKey: ['totalPayments', invoiceId],
    queryFn: async () => {
      const { totalPaid, error } = await invoiceService.calculateTotalPayments(invoiceId);
      return { data: { totalPaid }, error };
    },
    enabled: !!invoiceId && enabled,
  });
};
