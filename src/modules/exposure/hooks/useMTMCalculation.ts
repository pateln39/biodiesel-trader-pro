
import { useQuery } from '@tanstack/react-query';
import { mtmService } from '../services/mtmService';

export const useMTMCalculation = () => {
  return useQuery({
    queryKey: ['mtm-calculations'],
    queryFn: () => mtmService.calculateMTM(),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
};
