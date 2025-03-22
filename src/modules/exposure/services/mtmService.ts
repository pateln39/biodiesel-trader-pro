
import { supabase } from '@/integrations/supabase/client';
import { MTMCalculation } from '@/modules/exposure/types/mtm';
import { calculateMTMPrice, calculateMTMValue } from '@/utils/priceCalculationUtils';
import { validateAndParsePricingFormula } from '@/utils/formulaUtils';
import { BaseApiService } from '@/core/api';

class MTMService extends BaseApiService {
  /**
   * Fetches trade data and calculates MTM values
   */
  async fetchTradeDataForMTM(): Promise<MTMCalculation[]> {
    try {
      // Step 1: Fetch parent trades
      const { data: parentTrades, error: parentTradesError } = await supabase
        .from('parent_trades')
        .select('*')
        .eq('trade_type', 'physical')
        .order('created_at', { ascending: false });

      if (parentTradesError) {
        return this.handleError(parentTradesError);
      }

      // Step 2: Fetch all trade legs
      const { data: tradeLegs, error: tradeLegsError } = await supabase
        .from('trade_legs')
        .select('*')
        .order('created_at', { ascending: false });

      if (tradeLegsError) {
        return this.handleError(tradeLegsError);
      }

      // Step 3: Process each trade leg and calculate MTM
      const mtmCalculations: MTMCalculation[] = [];
      
      for (const leg of tradeLegs) {
        // Find the parent trade
        const parentTrade = parentTrades.find(pt => pt.id === leg.parent_trade_id);
        if (!parentTrade) continue;

        // Skip if missing critical data
        if (!leg.pricing_formula || !leg.mtm_formula || !leg.quantity) continue;

        // Parse formulas
        const contractFormula = validateAndParsePricingFormula(leg.pricing_formula);
        const mtmFormula = validateAndParsePricingFormula(leg.mtm_formula);
        
        if (!contractFormula || !mtmFormula) continue;

        // Use pre-calculated prices if available, otherwise calculate them
        let contractPrice = leg.calculated_price;
        let marketPrice = leg.mtm_calculated_price;
        
        // Calculate prices if needed
        if (!contractPrice || !marketPrice) {
          try {
            // Calculate contract price if not available
            if (!contractPrice) {
              const contractPriceResult = await calculateMTMPrice(contractFormula);
              contractPrice = contractPriceResult.price;
            }
            
            // Calculate MTM price if not available
            if (!marketPrice) {
              const marketPriceResult = await calculateMTMPrice(mtmFormula);
              marketPrice = marketPriceResult.price;
            }
          } catch (error) {
            console.error('Error calculating prices:', error);
            continue;
          }
        }
        
        // Calculate MTM value
        const mtmValue = calculateMTMValue(
          contractPrice || 0,
          marketPrice || 0,
          leg.quantity,
          leg.buy_sell as 'buy' | 'sell'
        );

        // Add to calculations array
        mtmCalculations.push({
          tradeId: parentTrade.id,
          tradeLegId: leg.id,
          tradeReference: parentTrade.trade_reference,
          counterparty: parentTrade.counterparty,
          product: leg.product,
          quantity: leg.quantity,
          contractPrice: contractPrice || 0,
          marketPrice: marketPrice || 0,
          mtmValue,
          calculationDate: new Date()
        });
      }

      return mtmCalculations;
    } catch (error: any) {
      return this.handleError(error);
    }
  }
}

export const mtmService = new MTMService();
