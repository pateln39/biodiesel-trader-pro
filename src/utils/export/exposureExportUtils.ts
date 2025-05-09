import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { ExposureExportParams } from './exposureExportTypes';
import { ExposureData, MonthlyExposure } from '@/types/exposure';

/**
 * Export exposure data to Excel
 * @param params - Exposure export parameters
 */
export const exportExposureToExcel = (params: ExposureExportParams): void => {
  try {
    console.log('[EXPORT] Starting exposure data export');
    const {
      exposureData,
      visibleCategories,
      filteredProducts,
      grandTotals,
      groupGrandTotals,
      biodieselProducts,
      pricingInstrumentProducts
    } = params;
    
    const workbook = XLSX.utils.book_new();
    
    // Create header rows
    const categoryRow: any[] = [{ v: "", t: 's' }];
    const productRow: any[] = [{ v: "Month", t: 's' }];
    const categorySpans: number[] = [];
    
    // Generate category headers
    visibleCategories.forEach(category => {
      const categoryProducts = filteredProducts.filter(product => {
        if (category === 'Physical' && (product === 'ICE GASOIL FUTURES (EFP)' || product === 'ICE GASOIL FUTURES' || product === 'EFP')) {
          return false;
        }
        if (category === 'Paper' && (product === 'ICE GASOIL FUTURES (EFP)' || product === 'EFP')) {
          return false;
        }
        return true;
      });
      
      categoryRow.push({ 
        v: category, 
        t: 's',
        s: { 
          alignment: { 
            horizontal: 'center', 
            vertical: 'center' 
          },
          font: { bold: true }
        }
      });
      
      let spanCount = categoryProducts.length;
      
      if (category === 'Exposure') {
        spanCount += 3; // For biodiesel total, pricing instrument total, and grand total
      }
      
      categorySpans.push(spanCount);
      
      // Add empty cells for merging
      for (let i = 1; i < spanCount; i++) {
        categoryRow.push({ v: "", t: 's' });
      }
      
      // Add product headers
      categoryProducts.forEach(product => {
        productRow.push({ v: product, t: 's' });
      });
      
      // Add totals headers for Exposure category
      if (category === 'Exposure') {
        productRow.push({ v: "Biodiesel Total", t: 's' });
        productRow.push({ v: "Pricing Instrument Total", t: 's' });
        productRow.push({ v: "Total Row", t: 's' });
      }
    });
    
    // Create data rows for each month
    const dataRows: any[][] = [];
    
    exposureData.forEach(monthData => {
      const dataRow: any[] = [{ v: monthData.month, t: 's' }];
      
      visibleCategories.forEach(category => {
        const categoryProducts = filteredProducts.filter(product => {
          if (category === 'Physical' && (product === 'ICE GASOIL FUTURES (EFP)' || product === 'ICE GASOIL FUTURES' || product === 'EFP')) {
            return false;
          }
          if (category === 'Paper' && (product === 'ICE GASOIL FUTURES (EFP)' || product === 'EFP')) {
            return false;
          }
          return true;
        });
        
        // Add product values
        categoryProducts.forEach(product => {
          if (!monthData.products || typeof monthData.products !== 'object') {
            dataRow.push({ v: 0, t: 'n' });
            return;
          }
          
          const productData = monthData.products[product] || { physical: 0, pricing: 0, paper: 0, netExposure: 0 };
          
          let value = 0;
          if (category === 'Physical') value = productData.physical;
          else if (category === 'Pricing') value = productData.pricing;
          else if (category === 'Paper') value = productData.paper;
          else if (category === 'Exposure') value = productData.netExposure;
          
          dataRow.push({ v: value, t: 'n' });
        });
        
        // Add totals for Exposure category
        if (category === 'Exposure') {
          let biodieselTotal = 0;
          let pricingInstrumentTotal = 0;
          
          if (monthData.products && typeof monthData.products === 'object') {
            biodieselTotal = biodieselProducts.reduce((total, product) => {
              if (monthData.products[product]) {
                return total + monthData.products[product].netExposure;
              }
              return total;
            }, 0);
            
            pricingInstrumentTotal = pricingInstrumentProducts.reduce((total, product) => {
              if (monthData.products[product]) {
                return total + monthData.products[product].netExposure;
              }
              return total;
            }, 0);
          }
          
          dataRow.push({ v: biodieselTotal, t: 'n' });
          dataRow.push({ v: pricingInstrumentTotal, t: 'n' });
          dataRow.push({ v: biodieselTotal + pricingInstrumentTotal, t: 'n' });
        }
      });
      
      dataRows.push(dataRow);
    });
    
    // Create totals row
    const totalsRow: any[] = [{ v: "Total", t: 's' }];
    
    visibleCategories.forEach(category => {
      const categoryProducts = filteredProducts.filter(product => {
        if (category === 'Physical' && (product === 'ICE GASOIL FUTURES (EFP)' || product === 'ICE GASOIL FUTURES' || product === 'EFP')) {
          return false;
        }
        if (category === 'Paper' && (product === 'ICE GASOIL FUTURES (EFP)' || product === 'EFP')) {
          return false;
        }
        return true;
      });
      
      // Add product totals
      categoryProducts.forEach(product => {
        let value = 0;
        if (grandTotals.productTotals[product]) {
          if (category === 'Physical') value = grandTotals.productTotals[product].physical;
          else if (category === 'Pricing') value = grandTotals.productTotals[product].pricing;
          else if (category === 'Paper') value = grandTotals.productTotals[product].paper;
          else if (category === 'Exposure') value = grandTotals.productTotals[product].netExposure;
        }
        
        totalsRow.push({ v: value, t: 'n' });
      });
      
      // Add group totals for Exposure category
      if (category === 'Exposure') {
        totalsRow.push({ v: groupGrandTotals.biodieselTotal, t: 'n' });
        totalsRow.push({ v: groupGrandTotals.pricingInstrumentTotal, t: 'n' });
        totalsRow.push({ v: groupGrandTotals.totalRow, t: 'n' });
      }
    });
    
    dataRows.push(totalsRow);
    
    // Combine all rows and create sheet
    const allRows = [categoryRow, productRow, ...dataRows];
    const worksheet = XLSX.utils.aoa_to_sheet(allRows);
    
    // Style the worksheet
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    
    // Merge category header cells
    let colIndex = 1;
    categorySpans.forEach((span, index) => {
      const mergeStart = XLSX.utils.encode_cell({ r: 0, c: colIndex });
      const mergeEnd = XLSX.utils.encode_cell({ r: 0, c: colIndex + span - 1 });
      if (!worksheet['!merges']) worksheet['!merges'] = [];
      worksheet['!merges'].push({ s: { r: 0, c: colIndex }, e: { r: 0, c: colIndex + span - 1 } });
      colIndex += span;
    });
    
    // Style all cells
    const defaultStyle = {
      border: {
        top: { style: 'thin', color: { auto: 1 } },
        bottom: { style: 'thin', color: { auto: 1 } },
        left: { style: 'thin', color: { auto: 1 } },
        right: { style: 'thin', color: { auto: 1 } }
      }
    };
    
    // Apply styles to all cells
    for (let r = range.s.r; r <= range.e.r; r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cell_ref = XLSX.utils.encode_cell({ r, c });
        if (!worksheet[cell_ref]) worksheet[cell_ref] = { t: 's', v: '' };
        if (!worksheet[cell_ref].s) worksheet[cell_ref].s = {};
        Object.assign(worksheet[cell_ref].s, defaultStyle);
        
        // Apply header styles
        if (r === 0 || r === 1) {
          worksheet[cell_ref].s.font = { bold: true };
          worksheet[cell_ref].s.fill = {
            patternType: 'solid',
            fgColor: { rgb: "DDDDDD" }
          };
        }
        
        // Apply totals row styles
        if (r === range.e.r) {
          worksheet[cell_ref].s.font = { bold: true };
          worksheet[cell_ref].s.fill = {
            patternType: 'solid',
            fgColor: { rgb: "EEEEEE" }
          };
        }
      }
    }
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Exposure');
    
    // Generate filename with current date
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const fileName = `Exposure_${dateStr}.xlsx`;
    
    // Write the workbook to a file
    XLSX.writeFile(workbook, fileName);
    console.log(`[EXPORT] Successfully exported exposure data to ${fileName}`);
    
  } catch (error) {
    console.error('[EXPORT] Failed to export exposure data:', error);
    throw error;
  }
};

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
          physicalExposure = Object.values(exposuresData.physical).reduce(
            (sum: number, value: unknown) => sum + (Number(value) || 0), 
            0
          );
        }
        
        // Sum up pricing exposures
        if (exposuresData.pricing && typeof exposuresData.pricing === 'object') {
          pricingExposure = Object.values(exposuresData.pricing).reduce(
            (sum: number, value: unknown) => sum + (Number(value) || 0), 
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
    
    // Style the worksheet
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 15 }, // Trade Reference
      { wch: 10 }, // Type
      { wch: 10 }, // Buy/Sell
      { wch: 20 }, // Product
      { wch: 10 }, // Period
      { wch: 10 }, // Quantity
      { wch: 15 }, // Pricing Type
      { wch: 15 }, // Physical Exposure
      { wch: 15 }  // Pricing Exposure
    ];
    
    // Apply styles to all cells
    const defaultStyle = {
      border: {
        top: { style: 'thin', color: { auto: 1 } },
        bottom: { style: 'thin', color: { auto: 1 } },
        left: { style: 'thin', color: { auto: 1 } },
        right: { style: 'thin', color: { auto: 1 } }
      }
    };
    
    for (let r = range.s.r; r <= range.e.r; r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cell_ref = XLSX.utils.encode_cell({ r, c });
        if (!worksheet[cell_ref]) worksheet[cell_ref] = { t: 's', v: '' };
        if (!worksheet[cell_ref].s) worksheet[cell_ref].s = {};
        Object.assign(worksheet[cell_ref].s, defaultStyle);
        
        // Apply header styles
        if (r === 0) {
          worksheet[cell_ref].s.font = { bold: true };
          worksheet[cell_ref].s.fill = {
            patternType: 'solid',
            fgColor: { rgb: "DDDDDD" }
          };
        }
      }
    }
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Exposure By Trade');
    
    // Generate filename with current date
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const fileName = `Exposure_By_Trade_${dateStr}.xlsx`;
    
    // Write the workbook to a file
    XLSX.writeFile(workbook, fileName);
    console.log(`[EXPORT] Successfully exported exposure by trade to ${fileName}`);
    
    return fileName;
  } catch (error) {
    console.error('[EXPORT] Failed to export exposure by trade:', error);
    throw error;
  }
};
