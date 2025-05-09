
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { 
  applyWorksheetStyles, 
  setColumnWidths, 
  generateExcelFileName 
} from './excelFormatUtils';

/**
 * Export exposure data by trade
 * @returns Promise resolving to the filename of the exported file
 */
export const exportExposureByTrade = async (): Promise<string> => {
  try {
    console.log('[EXPORT] Starting exposure by trade export');
    
    // Fetch physical trades
    const { data: physicalTradeLegs, error: physicalError } = await supabase
      .from('trade_legs')
      .select(`
        id,
        leg_reference,
        buy_sell,
        product,
        quantity,
        pricing_formula,
        mtm_formula,
        trading_period,
        pricing_period_start,
        loading_period_start
      `)
      .order('created_at', { ascending: false });
      
    if (physicalError) throw physicalError;
    
    // Fetch paper trades
    const { data: paperTradeLegs, error: paperError } = await supabase
      .from('paper_trade_legs')
      .select(`
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
      `)
      .order('created_at', { ascending: false });
      
    if (paperError) throw paperError;
    
    // Prepare data for export
    const workbook = XLSX.utils.book_new();
    
    // Format physical trades
    const physicalExportData = (physicalTradeLegs || []).map(leg => {
      const buySellFactor = leg.buy_sell === 'buy' ? 1 : -1;
      const quantity = leg.quantity || 0;
      const physicalExposure = quantity * buySellFactor;
      
      let pricingExposure = physicalExposure;
      let period = '';
      
      if (leg.trading_period) {
        period = leg.trading_period;
      } else if (leg.pricing_period_start) {
        period = format(new Date(leg.pricing_period_start), 'MMM-yy');
      } else if (leg.loading_period_start) {
        period = format(new Date(leg.loading_period_start), 'MMM-yy');
      }
      
      let formulaDescription = 'Fixed';
      
      if (leg.pricing_formula && typeof leg.pricing_formula === 'object') {
        formulaDescription = 'Formula';
        
        if ('monthlyDistribution' in leg.pricing_formula) {
          pricingExposure = 0; // Will be calculated separately for each month
        }
      }
      
      return {
        'Trade Reference': leg.leg_reference || '',
        'Type': 'Physical',
        'Buy/Sell': leg.buy_sell?.toUpperCase() || '',
        'Product': leg.product || '',
        'Period': period,
        'Quantity': quantity,
        'Pricing Type': formulaDescription,
        'Physical Exposure': physicalExposure,
        'Pricing Exposure': pricingExposure
      };
    });
    
    // Format paper trades
    const paperExportData = (paperTradeLegs || []).map(leg => {
      const buySellFactor = leg.buy_sell === 'buy' ? 1 : -1;
      const quantity = leg.quantity || 0;
      const period = leg.period || leg.trading_period || '';
      
      let physicalExposure = 0;
      let pricingExposure = 0;
      
      // Extract exposures from the leg data
      if (leg.exposures && typeof leg.exposures === 'object') {
        const exposuresData = leg.exposures as Record<string, any>;
        
        // Sum up physical exposures
        if (exposuresData.physical && typeof exposuresData.physical === 'object') {
          physicalExposure = Object.values(exposuresData.physical).reduce<number>(
            (sum: number, value: unknown) => sum + (typeof value === 'number' ? value : Number(value) || 0), 
            0
          );
        }
        
        // Sum up pricing exposures
        if (exposuresData.pricing && typeof exposuresData.pricing === 'object') {
          pricingExposure = Object.values(exposuresData.pricing).reduce<number>(
            (sum: number, value: unknown) => sum + (typeof value === 'number' ? value : Number(value) || 0), 
            0
          );
        }
      } else {
        // Default to quantity * buySell factor if no exposures defined
        physicalExposure = quantity * buySellFactor;
        pricingExposure = quantity * buySellFactor;
      }
      
      return {
        'Trade Reference': leg.leg_reference || '',
        'Type': 'Paper',
        'Buy/Sell': leg.buy_sell?.toUpperCase() || '',
        'Product': leg.product || '',
        'Period': period,
        'Quantity': quantity,
        'Pricing Type': leg.instrument || 'FP',
        'Physical Exposure': physicalExposure,
        'Pricing Exposure': pricingExposure
      };
    });
    
    // Combine physical and paper data
    const allTradesData = [...physicalExportData, ...paperExportData];
    
    // Create the worksheet
    const worksheet = XLSX.utils.json_to_sheet(allTradesData);
    
    // Set column widths
    setColumnWidths(worksheet, [15, 10, 10, 20, 10, 10, 15, 15, 15]);
    
    // Apply styles to the worksheet
    applyWorksheetStyles(worksheet, 1, false);
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Exposure By Trade');
    
    // Generate filename with current date
    const fileName = generateExcelFileName('Exposure_By_Trade');
    
    // Write the workbook to a file
    XLSX.writeFile(workbook, fileName);
    console.log(`[EXPORT] Successfully exported exposure by trade to ${fileName}`);
    
    return fileName;
  } catch (error) {
    console.error('[EXPORT] Failed to export exposure by trade:', error);
    throw error;
  }
};
