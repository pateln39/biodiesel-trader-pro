import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { formulaToDisplayString } from './formulaUtils';

export const exportMovementsToExcel = async (): Promise<string> => {
  try {
    console.log('[EXPORT] Starting movements export');
    
    const { data: movements, error } = await supabase
      .from('movements')
      .select('*')
      .order('sort_order', { ascending: true });
      
    if (error) {
      console.error('[EXPORT] Error fetching movements:', error);
      throw new Error('Failed to fetch movements data');
    }
    
    if (!movements || movements.length === 0) {
      console.warn('[EXPORT] No movements data to export');
      throw new Error('No movements data to export');
    }
    
    console.log(`[EXPORT] Processing ${movements.length} movements for export`);
    
    const formattedData = movements.map(movement => {
      const scheduledQuantity = movement.scheduled_quantity 
        ? parseFloat(String(movement.scheduled_quantity)).toLocaleString() 
        : '';
        
      const actualQuantity = movement.actual_quantity 
        ? parseFloat(String(movement.actual_quantity)).toLocaleString() 
        : '';
      
      const formatDateStr = (dateStr: string | null) => {
        if (!dateStr) return '';
        try {
          return format(new Date(dateStr), 'dd MMM yyyy');
        } catch (e) {
          return '';
        }
      };
      
      return {
        'MOVEMENT REFERENCE': movement.reference_number || '',
        'BUY/SELL': (movement.buy_sell || '').toUpperCase(),
        'INCOTERM': movement.inco_term || '',
        'SUSTAINABILITY': movement.sustainability || '',
        'PRODUCT': movement.product || '',
        'LOADING START': formatDateStr(movement.loading_period_start as string | null),
        'LOADING END': formatDateStr(movement.loading_period_end as string | null),
        'COUNTERPARTY': movement.counterparty || '',
        'COMMENTS': movement.comments || '',
        'CREDIT STATUS': movement.credit_status || '',
        'SCHEDULED QTY (MT)': scheduledQuantity,
        'NOMINATION ETA': formatDateStr(movement.nomination_eta),
        'NOMINATION VALID': formatDateStr(movement.nomination_valid),
        'CASH FLOW DATE': formatDateStr(movement.cash_flow),
        'BARGE NAME': movement.barge_name || '',
        'LOADPORT': movement.loadport || '',
        'LOADPORT INSPECTOR': movement.loadport_inspector || '',
        'DISPORT': movement.disport || '',
        'DISPORT INSPECTOR': movement.disport_inspector || '',
        'BL DATE': formatDateStr(movement.bl_date),
        'ACTUAL QTY (MT)': actualQuantity,
        'COD DATE': formatDateStr(movement.cod_date),
        'STATUS': (movement.status || '').toUpperCase()
      };
    });
    
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    
    worksheet['!cols'] = Object.keys(formattedData[0]).map(() => ({ wch: 20 }));
    
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    const border = {
      top: { style: 'thick', color: { auto: 1 } },
      bottom: { style: 'thick', color: { auto: 1 } },
      left: { style: 'thick', color: { auto: 1 } },
      right: { style: 'thick', color: { auto: 1 } }
    };
    
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell_ref = XLSX.utils.encode_cell({ r: R, c: C });
        if (!worksheet[cell_ref]) worksheet[cell_ref] = { t: 's', v: '' };
        if (!worksheet[cell_ref].s) worksheet[cell_ref].s = {};
        worksheet[cell_ref].s.border = border;
      }
    }
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Movements');
    
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const fileName = `Movements_${dateStr}.xlsx`;
    
    XLSX.writeFile(workbook, fileName);
    
    console.log(`[EXPORT] Successfully exported to ${fileName}`);
    return fileName;
    
  } catch (error) {
    console.error('[EXPORT] Export error:', error);
    throw error;
  }
};

export const exportOpenTradesToExcel = async (): Promise<string> => {
  try {
    console.log('[EXPORT] Starting open trades export');
    
    const { data: openTrades, error } = await supabase
      .from('open_trades')
      .select('*')
      .order('sort_order', { ascending: true });
      
    if (error) {
      console.error('[EXPORT] Error fetching open trades:', error);
      throw new Error('Failed to fetch open trades data');
    }
    
    if (!openTrades || openTrades.length === 0) {
      console.warn('[EXPORT] No open trades data to export');
      throw new Error('No open trades data to export');
    }
    
    console.log(`[EXPORT] Processing ${openTrades.length} open trades for export`);
    
    const formattedData = openTrades.map(trade => {
      const quantity = trade.quantity 
        ? parseFloat(String(trade.quantity)).toLocaleString() 
        : '';
      
      const nominatedValue = trade.nominated_value 
        ? parseFloat(String(trade.nominated_value)).toLocaleString() 
        : '';
        
      const balance = trade.balance 
        ? parseFloat(String(trade.balance)).toLocaleString() 
        : '';
      
      const formatDateStr = (dateStr: string | null) => {
        if (!dateStr) return '';
        try {
          return format(new Date(dateStr), 'dd MMM yyyy');
        } catch (e) {
          return '';
        }
      };
      
      let formulaDisplay = '';
      if (trade.pricing_formula && trade.pricing_formula.tokens) {
        formulaDisplay = formulaToDisplayString(trade.pricing_formula.tokens);
      }
      
      return {
        'TRADE REF': trade.trade_reference || '',
        'BUY/SELL': (trade.buy_sell || '').toUpperCase(),
        'INCOTERM': trade.inco_term || '',
        'QUANTITY': quantity,
        'SUSTAINABILITY': trade.sustainability || '',
        'PRODUCT': trade.product || '',
        'LOADING START': formatDateStr(trade.loading_period_start as string | null),
        'LOADING END': formatDateStr(trade.loading_period_end as string | null),
        'COUNTERPARTY': trade.counterparty || '',
        'PRICING TYPE': trade.pricing_type || '',
        'FORMULA': formulaDisplay,
        'COMMENTS': trade.comments || '',
        'CUSTOMS STATUS': trade.customs_status || '',
        'CREDIT STATUS': trade.credit_status || '',
        'CONTRACT STATUS': trade.contract_status || '',
        'NOMINATED VALUE': nominatedValue,
        'BALANCE': balance,
        '_isZeroBalance': trade.balance === 0 || trade.balance === null || trade.balance === undefined
      };
    });
    
    const workbook = XLSX.utils.book_new();
    
    const exportData = formattedData.map(row => {
      const { _isZeroBalance, ...dataRow } = row;
      return dataRow;
    });
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    worksheet['!cols'] = Object.keys(exportData[0]).map(() => ({ wch: 20 }));
    
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    const border = {
      top: { style: 'thick', color: { auto: 1 } },
      bottom: { style: 'thick', color: { auto: 1 } },
      left: { style: 'thick', color: { auto: 1 } },
      right: { style: 'thick', color: { auto: 1 } }
    };
    
    for (let R = range.s.r; R <= range.e.r; ++R) {
      const rowData = formattedData[R - 1];
      
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell_ref = XLSX.utils.encode_cell({ r: R, c: C });
        if (!worksheet[cell_ref]) worksheet[cell_ref] = { t: 's', v: '' };
        if (!worksheet[cell_ref].s) worksheet[cell_ref].s = {};
        
        worksheet[cell_ref].s.border = border;
        
        if (R > 0 && rowData && rowData._isZeroBalance) {
          worksheet[cell_ref].s.fill = {
            patternType: 'solid',
            fgColor: { rgb: "DDDDDD" }
          };
        }
      }
    }
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Open Trades');
    
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const fileName = `Open_Trades_${dateStr}.xlsx`;
    
    XLSX.writeFile(workbook, fileName);
    
    console.log(`[EXPORT] Successfully exported to ${fileName}`);
    return fileName;
    
  } catch (error) {
    console.error('[EXPORT] Export error:', error);
    throw error;
  }
};

export const exportExposureToExcel = (
  exposureData: any[],
  visibleCategories: string[],
  filteredProducts: string[],
  grandTotals: any,
  groupGrandTotals: any,
  biodieselProducts: string[],
  pricingInstrumentProducts: string[]
): void => {
  try {
    console.log('[EXPORT] Starting exposure data export');
    
    const workbook = XLSX.utils.book_new();
    
    const categoryRow: any[] = [{ v: "", t: 's' }];
    const productRow: any[] = [{ v: "Month", t: 's' }];
    const categorySpans: number[] = [];
    
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
        spanCount += 3;
      }
      
      categorySpans.push(spanCount);
      
      for (let i = 1; i < spanCount; i++) {
        categoryRow.push({ v: "", t: 's' });
      }
      
      categoryProducts.forEach(product => {
        productRow.push({ v: product, t: 's' });
      });
      
      if (category === 'Exposure') {
        productRow.push({ v: "Biodiesel Total", t: 's' });
        productRow.push({ v: "Pricing Instrument Total", t: 's' });
        productRow.push({ v: "Total Row", t: 's' });
      }
    });
    
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
        
        categoryProducts.forEach(product => {
          const productData = monthData.products[product] || { physical: 0, pricing: 0, paper: 0, netExposure: 0 };
          
          let value = 0;
          if (category === 'Physical') value = productData.physical;
          else if (category === 'Pricing') value = productData.pricing;
          else if (category === 'Paper') value = productData.paper;
          else if (category === 'Exposure') value = productData.netExposure;
          
          dataRow.push({ v: value, t: 'n' });
        });
        
        if (category === 'Exposure') {
          const biodieselTotal = biodieselProducts.reduce((total, product) => {
            if (monthData.products[product]) {
              return total + monthData.products[product].netExposure;
            }
            return total;
          }, 0);
          
          const pricingInstrumentTotal = pricingInstrumentProducts.reduce((total, product) => {
            if (monthData.products[product]) {
              return total + monthData.products[product].netExposure;
            }
            return total;
          }, 0);
          
          dataRow.push({ v: biodieselTotal, t: 'n' });
          dataRow.push({ v: pricingInstrumentTotal, t: 'n' });
          dataRow.push({ v: biodieselTotal + pricingInstrumentTotal, t: 'n' });
        }
      });
      
      dataRows.push(dataRow);
    });
    
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
      
      if (category === 'Exposure') {
        totalsRow.push({ v: groupGrandTotals.biodieselTotal, t: 'n' });
        totalsRow.push({ v: groupGrandTotals.pricingInstrumentTotal, t: 'n' });
        totalsRow.push({ v: groupGrandTotals.totalRow, t: 'n' });
      }
    });
    
    dataRows.push(totalsRow);
    
    const allRows = [categoryRow, productRow, ...dataRows];
    const worksheet = XLSX.utils.aoa_to_sheet(allRows);
    
    let startCol = 1;
    categorySpans.forEach((span, index) => {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: startCol });
      const mergeRef = XLSX.utils.encode_range({
        s: { r: 0, c: startCol },
        e: { r: 0, c: startCol + span - 1 }
      });
      
      if (!worksheet['!merges']) worksheet['!merges'] = [];
      worksheet['!merges'].push(XLSX.utils.decode_range(mergeRef));
      
      startCol += span;
    });
    
    const headerStyle = {
      font: { bold: true },
      alignment: { 
        horizontal: 'center', 
        vertical: 'center' 
      },
      border: {
        top: { style: 'thick', color: { rgb: "000000" } },
        bottom: { style: 'thick', color: { rgb: "000000" } },
        left: { style: 'thick', color: { rgb: "000000" } },
        right: { style: 'thick', color: { rgb: "000000" } }
      }
    };
    
    worksheet['!cols'] = new Array(allRows[1].length).fill({ wch: 15 });
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Exposure');
    
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const fileName = `Exposure_${dateStr}.xlsx`;
    
    XLSX.writeFile(workbook, fileName);
    
    console.log(`[EXPORT] Successfully exported exposure data to ${fileName}`);
    
  } catch (error) {
    console.error('[EXPORT] Export error:', error);
    throw error;
  }
};
