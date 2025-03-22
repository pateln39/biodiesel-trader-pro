
import { Exposure, ExposureType } from '../types/exposure';
import { supabase } from '@/integrations/supabase/client';

// Interface to represent grouped exposure data by period
interface ExposureByPeriod {
  [period: string]: Exposure[];
}

export class ExposureService {
  /**
   * Calculate exposure across all trades
   * This combines physical, pricing, and paper exposures
   */
  async calculateExposure(): Promise<ExposureByPeriod> {
    try {
      // Fetch physical trades with their formulas
      const { data: physicalLegs, error: physicalError } = await supabase
        .from('trade_legs')
        .select(`
          id,
          parent_trade_id,
          buy_sell,
          quantity,
          pricing_formula,
          mtm_formula,
          pricing_period_start,
          pricing_period_end
        `)
        .not('pricing_formula', 'is', null);
      
      if (physicalError) throw new Error(`Error fetching physical trades: ${physicalError.message}`);
      
      // Fetch paper trades with their formulas
      const { data: paperLegs, error: paperError } = await supabase
        .from('paper_trade_legs')
        .select(`
          id,
          paper_trade_id,
          buy_sell,
          product,
          quantity,
          period,
          trading_period,
          price,
          exposures
        `)
        .not('exposures', 'is', null);
      
      if (paperError) throw new Error(`Error fetching paper trades: ${paperError.message}`);

      // Group exposures by period
      const exposuresByPeriod: ExposureByPeriod = {};
      
      // Process physical trades
      for (const leg of physicalLegs) {
        // Define the period based on pricing period
        const startDate = new Date(leg.pricing_period_start);
        const period = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
        
        // Get physical and pricing exposures from formula
        const pricingFormula = leg.pricing_formula || {};
        const mtmFormula = leg.mtm_formula || {};
        
        // Initialize period if not exists
        if (!exposuresByPeriod[period]) {
          exposuresByPeriod[period] = [];
        }
        
        // Add physical exposures
        const physicalExposures = mtmFormula.exposures?.physical || pricingFormula.exposures?.physical || {};
        for (const [instrument, quantity] of Object.entries(physicalExposures)) {
          if (quantity === 0) continue;
          
          const exposureSign = leg.buy_sell === 'buy' ? 1 : -1;
          const adjustedQuantity = Number(quantity) * exposureSign;
          
          exposuresByPeriod[period].push({
            period,
            instrument,
            type: ExposureType.Physical,
            quantity: adjustedQuantity
          });
        }
        
        // Add pricing exposures
        const pricingExposures = pricingFormula.exposures?.pricing || {};
        for (const [instrument, quantity] of Object.entries(pricingExposures)) {
          if (quantity === 0) continue;
          
          const exposureSign = leg.buy_sell === 'buy' ? 1 : -1;
          const adjustedQuantity = Number(quantity) * exposureSign;
          
          exposuresByPeriod[period].push({
            period,
            instrument,
            type: ExposureType.Pricing,
            quantity: adjustedQuantity
          });
        }
      }
      
      // Process paper trades
      for (const leg of paperLegs) {
        // Define period from the leg or use trading period
        const period = leg.period || leg.trading_period || 'unknown';
        
        // Initialize period if not exists
        if (!exposuresByPeriod[period]) {
          exposuresByPeriod[period] = [];
        }
        
        // Add paper exposures
        const paperExposures = leg.exposures?.paper || {};
        for (const [instrument, quantity] of Object.entries(paperExposures)) {
          if (quantity === 0) continue;
          
          const exposureSign = leg.buy_sell === 'buy' ? 1 : -1;
          const adjustedQuantity = Number(quantity) * exposureSign;
          
          exposuresByPeriod[period].push({
            period,
            instrument,
            type: ExposureType.Paper,
            quantity: adjustedQuantity
          });
        }
      }
      
      // Calculate net exposures
      for (const period in exposuresByPeriod) {
        const periodExposures = exposuresByPeriod[period];
        const instrumentExposures: Record<string, number> = {};
        
        // Sum exposures by instrument
        for (const exposure of periodExposures) {
          if (exposure.type !== ExposureType.Net) {
            const instrument = exposure.instrument;
            instrumentExposures[instrument] = (instrumentExposures[instrument] || 0) + exposure.quantity;
          }
        }
        
        // Add net exposures
        for (const [instrument, quantity] of Object.entries(instrumentExposures)) {
          exposuresByPeriod[period].push({
            period,
            instrument,
            type: ExposureType.Net,
            quantity
          });
        }
      }
      
      return exposuresByPeriod;
    } catch (error) {
      console.error('Error calculating exposure:', error);
      throw error;
    }
  }
}

export const exposureService = new ExposureService();
