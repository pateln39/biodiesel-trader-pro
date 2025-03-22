
import { useQuery } from '@tanstack/react-query';
import { exposureService } from '../services/exposureService';

export const useExposureCalculation = () => {
  return useQuery({
    queryKey: ['exposure-calculations'],
    queryFn: () => exposureService.calculateExposure(),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
};
