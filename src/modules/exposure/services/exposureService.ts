
import { supabase } from '@/integrations/supabase/client';
import { Exposure, ExposureType } from '@/modules/exposure/types/exposure';
import { BaseApiService } from '@/core/api';
import { FormulaToken, PricingFormula } from '@/types/pricing';
import { calculateExposures } from '@/utils/formulaCalculation';

export class ExposureService extends BaseApiService {
  /**
   * Calculate exposure for all trades
   */
  async calculateExposure(): Promise<Record<string, Exposure[]>> {
    try {
      // Step 1: Fetch all physical trades with their legs
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
      
      // Step 3: Calculate exposure for each period
      const exposures: Record<string, Exposure[]> = {};
      
      // Group legs by period
      const legsByPeriod = this.groupTradesByPeriod(tradeLegs);
      
      // Calculate exposure for each period
      for (const [period, legs] of Object.entries(legsByPeriod)) {
        if (!exposures[period]) {
          exposures[period] = [];
        }
        
        // Process each leg and calculate exposures
        for (const leg of legs) {
          // Find the parent trade
          const parentTrade = parentTrades.find(pt => pt.id === leg.parent_trade_id);
          if (!parentTrade) continue;
          
          // Skip if missing critical data
          if (!leg.pricing_formula || !leg.quantity) continue;
          
          // Calculate physical exposure
          if (leg.pricing_formula && leg.pricing_formula.tokens) {
            const formula = leg.pricing_formula as PricingFormula;
            const tokens = formula.tokens as FormulaToken[];
            
            // Process physical exposure
            this.processPhysicalExposure(
              exposures[period], 
              tokens, 
              leg.quantity, 
              leg.buy_sell as 'buy' | 'sell'
            );
            
            // Process pricing exposure
            this.processPricingExposure(
              exposures[period], 
              tokens, 
              leg.quantity, 
              leg.buy_sell as 'buy' | 'sell'
            );
          }
        }
        
        // Calculate net exposure for the period
        this.calculateNetExposure(exposures[period]);
      }
      
      return exposures;
    } catch (error: any) {
      return this.handleError(error);
    }
  }
  
  /**
   * Group trade legs by period (month/year)
   */
  private groupTradesByPeriod(tradeLegs: any[]): Record<string, any[]> {
    const legsByPeriod: Record<string, any[]> = {};
    
    for (const leg of tradeLegs) {
      if (!leg.pricing_period_start || !leg.pricing_period_end) continue;
      
      // Use pricing period start date to determine the period (month/year)
      const startDate = new Date(leg.pricing_period_start);
      const period = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!legsByPeriod[period]) {
        legsByPeriod[period] = [];
      }
      
      legsByPeriod[period].push(leg);
    }
    
    return legsByPeriod;
  }
  
  /**
   * Process physical exposure for a trade leg
   */
  private processPhysicalExposure(
    exposures: Exposure[],
    tokens: FormulaToken[],
    quantity: number,
    buySell: 'buy' | 'sell'
  ): void {
    // Calculate physical exposures
    const physicalExposures = calculateExposures(tokens, quantity, buySell).physical;
    
    // Add physical exposures to the array
    for (const [instrument, exposureValue] of Object.entries(physicalExposures)) {
      if (exposureValue === 0) continue;
      
      // Find existing exposure record or create new one
      let exposureRecord = exposures.find(
        e => e.instrument === instrument && e.type === ExposureType.Physical
      );
      
      if (!exposureRecord) {
        exposureRecord = {
          instrument,
          type: ExposureType.Physical,
          quantity: exposureValue,
          period: '', // Will be set by the caller
          price: 0,
          value: 0
        };
        exposures.push(exposureRecord);
      } else {
        // Add to existing exposure
        exposureRecord.quantity += exposureValue;
      }
    }
  }
  
  /**
   * Process pricing exposure for a trade leg
   */
  private processPricingExposure(
    exposures: Exposure[],
    tokens: FormulaToken[],
    quantity: number,
    buySell: 'buy' | 'sell'
  ): void {
    // Calculate pricing exposures
    const pricingExposures = calculateExposures(tokens, quantity, buySell).pricing;
    
    // Add pricing exposures to the array
    for (const [instrument, exposureValue] of Object.entries(pricingExposures)) {
      if (exposureValue === 0) continue;
      
      // Find existing exposure record or create new one
      let exposureRecord = exposures.find(
        e => e.instrument === instrument && e.type === ExposureType.Pricing
      );
      
      if (!exposureRecord) {
        exposureRecord = {
          instrument,
          type: ExposureType.Pricing,
          quantity: exposureValue,
          period: '', // Will be set by the caller
          price: 0,
          value: 0
        };
        exposures.push(exposureRecord);
      } else {
        // Add to existing exposure
        exposureRecord.quantity += exposureValue;
      }
    }
  }
  
  /**
   * Calculate net exposure for each instrument
   */
  private calculateNetExposure(exposures: Exposure[]): void {
    // Group exposures by instrument
    const instrumentMap: Record<string, { physical: number; pricing: number }> = {};
    
    // Collect physical and pricing exposures
    for (const exposure of exposures) {
      if (!instrumentMap[exposure.instrument]) {
        instrumentMap[exposure.instrument] = { physical: 0, pricing: 0 };
      }
      
      if (exposure.type === ExposureType.Physical) {
        instrumentMap[exposure.instrument].physical = exposure.quantity;
      } else if (exposure.type === ExposureType.Pricing) {
        instrumentMap[exposure.instrument].pricing = exposure.quantity;
      }
    }
    
    // Calculate net exposure for each instrument
    for (const [instrument, values] of Object.entries(instrumentMap)) {
      const netExposure = values.physical + values.pricing;
      
      // Skip if net exposure is zero
      if (netExposure === 0) continue;
      
      // Add net exposure to the array
      exposures.push({
        instrument,
        type: ExposureType.Net,
        quantity: netExposure,
        period: '', // Will be set by the caller
        price: 0,
        value: 0
      });
    }
  }
}

export const exposureService = new ExposureService();
