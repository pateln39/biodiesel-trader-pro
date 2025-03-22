
import { useQuery } from '@tanstack/react-query';
import { mtmService } from '../services/mtmService';
import { MTMCalculation } from '../types/mtm';

export const useMTMCalculation = () => {
  return useQuery<MTMCalculation[], Error>({
    queryKey: ['mtm-calculations'],
    queryFn: () => mtmService.calculateMTM(),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
};
