
import { supabase } from '@/integrations/supabase/client';
import { ExposureData, ExposureReportItem, ExposureResult } from '../types/exposure';

export class ExposureService {
  /**
   * Calculate exposures across all trade types
   */
  async calculateExposure(): Promise<ExposureData> {
    try {
      const exposureByMonth: Record<string, ExposureReportItem> = {};
      const exposureByGrade: Record<string, ExposureReportItem> = {};
      
      // Get physical trades
      const { data: physicalTrades, error: physicalError } = await supabase
        .from('trade_legs')
        .select(`
          id, 
          quantity,
          product,
          buy_sell,
          pricing_formula,
          mtm_formula,
          loading_period_start,
          loading_period_end,
          parent_trade_id
        `)
        .eq('parent_trade_id.trade_type', 'physical');
      
      if (physicalError) throw new Error(`Error fetching physical trades: ${physicalError.message}`);
      
      // Get paper trades
      const { data: paperTrades, error: paperError } = await supabase
        .from('paper_trade_legs')
        .select(`
          id,
          quantity,
          product,
          buy_sell,
          formula,
          mtm_formula,
          exposures,
          pricing_period_start,
          pricing_period_end,
          paper_trade_id
        `);
      
      if (paperError) throw new Error(`Error fetching paper trades: ${paperError.message}`);
      
      // Process physical trades
      for (const leg of physicalTrades || []) {
        const month = this.getMonthFromDate(leg.loading_period_start);
        const grade = leg.product;
        const direction = leg.buy_sell === 'buy' ? 1 : -1;
        const quantity = leg.quantity * direction;
        
        // Handle physical exposure
        this.addToExposure(exposureByMonth, month, 'physical', quantity, grade);
        this.addToExposure(exposureByGrade, grade, 'physical', quantity);
        
        // Handle pricing exposure if formula exists
        if (leg.pricing_formula) {
          const formula = leg.pricing_formula;
          if (typeof formula === 'object' && formula && 'exposures' in formula) {
            this.processExposures(exposureByMonth, exposureByGrade, formula.exposures, month, grade);
          }
        }
      }
      
      // Process paper trades
      for (const leg of paperTrades || []) {
        const month = this.getMonthFromDate(leg.pricing_period_start);
        const grade = leg.product;
        const direction = leg.buy_sell === 'buy' ? 1 : -1;
        const quantity = leg.quantity * direction;
        
        // Add paper exposure
        this.addToExposure(exposureByMonth, month, 'paper', quantity, grade);
        this.addToExposure(exposureByGrade, grade, 'paper', quantity);
        
        // Add any exposures from the formula if available
        if (leg.exposures) {
          const exposures = leg.exposures;
          if (typeof exposures === 'object' && exposures && 'paper' in exposures) {
            // Process paper exposures
            Object.entries(exposures.paper).forEach(([instrument, value]) => {
              this.addToExposure(exposureByMonth, month, 'paper', Number(value || 0), instrument);
              this.addToExposure(exposureByGrade, instrument, 'paper', Number(value || 0));
            });
          }
        }
      }
      
      // Convert to arrays and calculate net exposures
      const byMonth = Object.values(exposureByMonth).map(item => ({
        ...item,
        netExposure: item.physical + item.pricing + item.paper
      }));
      
      const byGrade = Object.values(exposureByGrade).map(item => ({
        ...item,
        netExposure: item.physical + item.pricing + item.paper
      }));
      
      // Calculate total exposure
      const totalExposure = {
        physical: byGrade.reduce((sum, item) => sum + item.physical, 0),
        pricing: byGrade.reduce((sum, item) => sum + item.pricing, 0),
        paper: byGrade.reduce((sum, item) => sum + item.paper, 0),
        net: byGrade.reduce((sum, item) => sum + item.netExposure, 0)
      };
      
      return {
        byMonth,
        byGrade,
        totalExposure
      };
    } catch (error) {
      console.error('Error calculating exposures:', error);
      throw error;
    }
  }
  
  /**
   * Process exposures from a formula
   */
  private processExposures(
    byMonth: Record<string, ExposureReportItem>,
    byGrade: Record<string, ExposureReportItem>,
    exposures: any,
    month: string,
    grade: string
  ) {
    // Handle physical exposures
    if (exposures.physical) {
      Object.entries(exposures.physical).forEach(([instrument, value]) => {
        this.addToExposure(byMonth, month, 'physical', Number(value || 0), instrument);
        this.addToExposure(byGrade, instrument, 'physical', Number(value || 0));
      });
    }
    
    // Handle pricing exposures
    if (exposures.pricing) {
      Object.entries(exposures.pricing).forEach(([instrument, value]) => {
        this.addToExposure(byMonth, month, 'pricing', Number(value || 0), instrument);
        this.addToExposure(byGrade, instrument, 'pricing', Number(value || 0));
      });
    }
  }
  
  /**
   * Add a value to the exposure record
   */
  private addToExposure(
    exposures: Record<string, ExposureReportItem>,
    key: string,
    type: 'physical' | 'pricing' | 'paper',
    value: number,
    grade?: string
  ) {
    if (!exposures[key]) {
      exposures[key] = {
        month: key,
        grade: grade || key,
        physical: 0,
        pricing: 0,
        paper: 0,
        netExposure: 0
      };
    }
    
    exposures[key][type] += value;
  }
  
  /**
   * Get month string from a date
   */
  private getMonthFromDate(dateStr?: string): string {
    if (!dateStr) return 'Unknown';
    
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  }
}

export const exposureService = new ExposureService();
