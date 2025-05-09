
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ExposureTradeData {
  physicalTradeLegs: any[];
  paperTradeLegs: any[];
}

export const useExposureFetching = () => {
  const {
    data: tradeData,
    isLoading,
    error,
    refetch
  } = useQuery<ExposureTradeData>({
    queryKey: ['exposure-data'],
    queryFn: async () => {
      // Fetch physical trades
      const {
        data: physicalTradeLegs,
        error: physicalError
      } = await supabase.from('trade_legs').select(`
          id,
          leg_reference,
          buy_sell,
          product,
          quantity,
          pricing_formula,
          mtm_formula,
          trading_period,
          pricing_period_start,
          loading_period_start,
          pricing_type,
          efp_designated_month
        `).order('trading_period', {
        ascending: true
      });
      
      if (physicalError) throw physicalError;

      // Fetch paper trades
      const {
        data: paperTradeLegs,
        error: paperError
      } = await supabase.from('paper_trade_legs').select(`
          id,
          leg_reference,
          buy_sell,
          product,
          quantity,
          formula,
          mtm_formula,
          exposures,
          period,
          trading_period,
          instrument
        `).order('period', {
        ascending: true
      });
      
      if (paperError) throw paperError;

      return {
        physicalTradeLegs: physicalTradeLegs || [],
        paperTradeLegs: paperTradeLegs || []
      };
    }
  });

  return {
    tradeData,
    isLoading,
    error,
    refetch
  };
};
