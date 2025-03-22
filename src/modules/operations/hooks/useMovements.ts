
import { useMemo } from 'react';
import { useApi, useApiMutation } from '@/core/hooks/useApi';
import { movementService } from '../services/movementService';
import { Movement, CreateMovementInput, UpdateMovementInput } from '../types/movement';

// Hook for getting all movements
export const useMovements = (options?: {
  tradeLegId?: string;
  status?: string;
  limit?: number;
  offset?: number;
  withTradeDetails?: boolean;
  enabled?: boolean;
}) => {
  const {
    tradeLegId,
    status,
    limit,
    offset,
    withTradeDetails = false,
    enabled = true,
  } = options || {};

  const queryFn = async () => {
    if (withTradeDetails) {
      return await movementService.getMovementsWithTradeDetails({
        tradeLegId,
        status,
        limit,
        offset,
      });
    } else {
      return await movementService.getAllMovements({
        tradeLegId,
        status,
        orderBy: { column: 'created_at', ascending: false },
        limit,
        offset,
      });
    }
  };

  const queryKey = useMemo(() => {
    const key = ['movements'];
    if (tradeLegId) key.push(tradeLegId);
    if (status) key.push(status);
    if (limit) key.push(limit.toString());
    if (offset) key.push(offset.toString());
    if (withTradeDetails) key.push('withTradeDetails');
    return key;
  }, [tradeLegId, status, limit, offset, withTradeDetails]);

  return useApi<Movement[], void>({
    queryKey,
    queryFn,
    enabled,
  });
};

// Hook for getting a single movement by ID
export const useMovement = (id: string, options?: { enabled?: boolean }) => {
  const { enabled = true } = options || {};

  return useApi<Movement, void>({
    queryKey: ['movement', id],
    queryFn: async () => await movementService.getMovementById(id),
    enabled: !!id && enabled,
  });
};

// Hook for creating a new movement
export const useCreateMovement = (options?: {
  onSuccess?: (data: Movement) => void;
}) => {
  return useApiMutation<Movement, CreateMovementInput>({
    mutationFn: (data) => movementService.createMovement(data),
    onSuccess: options?.onSuccess,
    invalidateQueries: [['movements']],
    successMessage: 'Movement created successfully',
  });
};

// Hook for updating a movement
export const useUpdateMovement = (options?: {
  onSuccess?: (data: Movement) => void;
}) => {
  return useApiMutation<Movement, { id: string; data: UpdateMovementInput }>({
    mutationFn: ({ id, data }) => movementService.updateMovement(id, data),
    onSuccess: options?.onSuccess,
    invalidateQueries: [['movements'], ['movement']],
    successMessage: 'Movement updated successfully',
  });
};

// Hook for actualizing a movement
export const useActualizeMovement = (options?: {
  onSuccess?: (data: Movement) => void;
}) => {
  return useApiMutation<
    Movement,
    {
      id: string;
      data: {
        bl_date: string;
        bl_quantity: number;
        actualized_date: string;
        actualized_quantity: number;
        comments?: string;
      };
    }
  >({
    mutationFn: ({ id, data }) => movementService.actualizeMovement(id, data),
    onSuccess: options?.onSuccess,
    invalidateQueries: [['movements'], ['movement']],
    successMessage: 'Movement actualized successfully',
  });
};

// Hook for deleting a movement
export const useDeleteMovement = (options?: {
  onSuccess?: () => void;
}) => {
  return useApiMutation<null, string>({
    mutationFn: (id) => movementService.deleteMovement(id),
    onSuccess: options?.onSuccess,
    invalidateQueries: [['movements']],
    successMessage: 'Movement deleted successfully',
  });
};

// Hook for getting the scheduled quantity for a trade leg
export const useScheduledQuantity = (tradeLegId: string, options?: { enabled?: boolean }) => {
  const { enabled = true } = options || {};

  return useApi<{ scheduledQuantity: number; actualizedQuantity: number }, void>({
    queryKey: ['scheduledQuantity', tradeLegId],
    queryFn: async () => {
      const { scheduledQuantity, actualizedQuantity, error } =
        await movementService.getScheduledQuantity(tradeLegId);
      return { data: { scheduledQuantity, actualizedQuantity }, error };
    },
    enabled: !!tradeLegId && enabled,
  });
};
