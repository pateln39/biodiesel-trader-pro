
import { MTMCalculation } from '../types/mtm';
import { supabase } from '@/integrations/supabase/client';
import { formulaToDisplayString } from '@/modules/pricing/utils/formulaUtils';

export class MTMService {
  /**
   * Calculate mark-to-market values for all trades
   */
  async calculateMTM(): Promise<MTMCalculation[]> {
    try {
      // Fetch physical trades with their formulas
      const { data: physicalTrades, error: physicalError } = await supabase
        .from('parent_trades')
        .select(`
          id,
          trade_reference,
          counterparty,
          trade_legs(
            id, 
            quantity, 
            product,
            mtm_formula,
            pricing_formula
          )
        `)
        .eq('trade_type', 'physical');
      
      if (physicalError) throw new Error(`Error fetching physical trades: ${physicalError.message}`);
      
      // Calculate MTM for physical trades
      const mtmCalculations: MTMCalculation[] = [];
      
      for (const trade of physicalTrades || []) {
        for (const leg of trade.trade_legs || []) {
          // Skip if no formula is defined
          if (!leg.mtm_formula && !leg.pricing_formula) continue;
          
          // Use MTM formula if available, otherwise fall back to pricing formula
          const formula = leg.mtm_formula || leg.pricing_formula;
          
          // Skip if formula is still null
          if (!formula) continue;
          
          const formulaObj = typeof formula === 'string' ? JSON.parse(formula) : formula;
          
          const formulaString = formulaObj && formulaObj.tokens 
            ? formulaToDisplayString(formulaObj.tokens) 
            : '';
            
          const contractPrice = 750; // Mock price for example
          const marketPrice = 780; // Mock current market price
          const mtmValue = this.calculateMTMValue(leg.quantity, formula);
          const pnlValue = (marketPrice - contractPrice) * leg.quantity;
          
          mtmCalculations.push({
            tradeId: trade.id,
            tradeLegId: leg.id,
            tradeReference: trade.trade_reference,
            counterparty: trade.counterparty,
            product: leg.product,
            quantity: leg.quantity,
            contractPrice: contractPrice, 
            marketPrice: marketPrice,
            mtmValue,
            pnlValue,
            tradePrice: contractPrice,
            calculationDate: new Date()
          });
        }
      }
      
      return mtmCalculations;
    } catch (error) {
      console.error('Error calculating MTM:', error);
      throw error;
    }
  }
  
  /**
   * Calculate MTM value for a single trade
   * In a real implementation, this would use actual market prices
   */
  private calculateMTMValue(quantity: number, formula: any): number {
    // Simplified calculation for demo purposes
    // In a real system, this would evaluate the formula with current market prices
    try {
      const formulaObj = typeof formula === 'string' ? JSON.parse(formula) : formula;
      
      if (formulaObj && formulaObj.exposures && formulaObj.exposures.physical) {
        const exposureTotal = Object.values(formulaObj.exposures.physical)
          .reduce((sum: number, val: any) => sum + Number(val || 0), 0);
        
        return quantity * 10 + Math.abs(exposureTotal); // Simplified placeholder calculation
      }
      return quantity * 10; // Fallback calculation if no exposures
    } catch (error) {
      console.error('Error in MTM calculation:', error);
      return 0;
    }
  }
}

export const mtmService = new MTMService();
