
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { formulaToDisplayString } from './formulaUtils';
import { PricingFormula, FormulaToken } from '@/types/pricing';
import { formatProductDisplay, calculateDisplayPrice } from './productMapping';

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
      
      if (trade.pricing_type === 'efp') {
        if (trade.efp_agreed_status) {
          const fixedValue = trade.efp_fixed_value || 0;
          const premium = trade.efp_premium || 0;
          formulaDisplay = `${fixedValue + premium}`;
        } else {
          formulaDisplay = `ICE GASOIL FUTURES (EFP) + ${trade.efp_premium || 0}`;
        }
      } else if (trade.pricing_formula && 
          typeof trade.pricing_formula === 'object' && 
          'tokens' in trade.pricing_formula && 
          Array.isArray(trade.pricing_formula.tokens)) {
        const tokensAny = trade.pricing_formula.tokens as any[];
        const tokens: FormulaToken[] = tokensAny.map(token => ({
          id: token.id?.toString() || '',
          type: token.type as "instrument" | "fixedValue" | "operator" | "percentage" | "openBracket" | "closeBracket" | "parenthesis" | "number" | "variable",
          value: token.value
        }));
        formulaDisplay = formulaToDisplayString(tokens);
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
        'FORMULA': formulaDisplay || 'No formula',
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

export const exportPhysicalTradesToExcel = async (): Promise<string> => {
  try {
    console.log('[EXPORT] Starting physical trades export');
    
    const { data: tradeLegs, error } = await supabase
      .from('trade_legs')
      .select(`
        id,
        parent_trade_id,
        leg_reference,
        buy_sell,
        product,
        sustainability,
        inco_term,
        quantity,
        loading_period_start,
        loading_period_end,
        pricing_type,
        pricing_formula,
        efp_premium,
        efp_agreed_status,
        efp_fixed_value,
        efp_designated_month,
        comments,
        customs_status,
        credit_status,
        contract_status,
        parent_trades(
          trade_reference,
          counterparty
        )
      `)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('[EXPORT] Error fetching trade legs:', error);
      throw new Error('Failed to fetch physical trade data');
    }
    
    if (!tradeLegs || tradeLegs.length === 0) {
      console.warn('[EXPORT] No physical trade data to export');
      throw new Error('No physical trade data to export');
    }
    
    console.log(`[EXPORT] Processing ${tradeLegs.length} physical trades for export`);
    
    const formattedData = tradeLegs.map(leg => {
      const parentTrade = leg.parent_trades as any;
      const quantity = leg.quantity 
        ? parseFloat(String(leg.quantity)).toLocaleString() 
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
      
      if (leg.pricing_type === 'efp') {
        if (leg.efp_agreed_status) {
          const fixedValue = leg.efp_fixed_value || 0;
          const premium = leg.efp_premium || 0;
          formulaDisplay = `${fixedValue + premium}`;
        } else {
          formulaDisplay = `ICE GASOIL FUTURES (EFP) + ${leg.efp_premium || 0}`;
        }
      } else if (leg.pricing_formula && 
          typeof leg.pricing_formula === 'object') {
        const pricingFormula = leg.pricing_formula as any;
        if (pricingFormula.tokens && Array.isArray(pricingFormula.tokens)) {
          const tokensAny = pricingFormula.tokens;
          const tokens: FormulaToken[] = tokensAny.map(token => ({
            id: token.id?.toString() || '',
            type: token.type as any,
            value: token.value
          }));
          formulaDisplay = formulaToDisplayString(tokens);
        } else {
          formulaDisplay = 'No formula';
        }
      }
      
      const displayReference = leg.leg_reference || parentTrade?.trade_reference || '';
      
      return {
        'TRADE REF': displayReference,
        'BUY/SELL': (leg.buy_sell || '').toUpperCase(),
        'INCOTERM': leg.inco_term || '',
        'QUANTITY': quantity,
        'SUSTAINABILITY': leg.sustainability || '',
        'PRODUCT': leg.product || '',
        'LOADING START': formatDateStr(leg.loading_period_start as string | null),
        'LOADING END': formatDateStr(leg.loading_period_end as string | null),
        'COUNTERPARTY': parentTrade?.counterparty || '',
        'PRICING TYPE': leg.pricing_type === 'efp' ? 'EFP' : (leg.pricing_type || ''),
        'FORMULA': formulaDisplay || 'No formula',
        'COMMENTS': leg.comments || '',
        'CUSTOMS STATUS': leg.customs_status || '',
        'CREDIT STATUS': leg.credit_status || '',
        'CONTRACT STATUS': leg.contract_status || ''
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
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Physical Trades');
    
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const fileName = `Physical_Trades_${dateStr}.xlsx`;
    
    XLSX.writeFile(workbook, fileName);
    
    console.log(`[EXPORT] Successfully exported to ${fileName}`);
    return fileName;
    
  } catch (error) {
    console.error('[EXPORT] Export error:', error);
    throw error;
  }
};

export const exportPaperTradesToExcel = async (): Promise<string> => {
  try {
    console.log('[EXPORT] Starting paper trades export');
    
    const { data: paperTradeLegs, error } = await supabase
      .from('paper_trade_legs')
      .select(`
        id,
        paper_trade_id,
        leg_reference,
        buy_sell,
        product,
        period,
        quantity,
        price,
        broker,
        instrument,
        mtm_formula,
        paper_trades(
          trade_reference
        )
      `)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('[EXPORT] Error fetching paper trade legs:', error);
      throw new Error('Failed to fetch paper trade data');
    }
    
    if (!paperTradeLegs || paperTradeLegs.length === 0) {
      console.warn('[EXPORT] No paper trade data to export');
      throw new Error('No paper trade data to export');
    }
    
    console.log(`[EXPORT] Processing ${paperTradeLegs.length} paper trades for export`);
    
    const formattedData = paperTradeLegs.map(leg => {
      const quantity = leg.quantity 
        ? parseFloat(String(leg.quantity)).toLocaleString() 
        : '';
      
      let relationshipType: 'FP' | 'DIFF' | 'SPREAD' = 'FP';
      if (leg.instrument) {
        if (leg.instrument.includes('DIFF')) {
          relationshipType = 'DIFF';
        } else if (leg.instrument.includes('SPREAD')) {
          relationshipType = 'SPREAD';
        }
      }
      
      let rightSide = undefined;
      if (leg.mtm_formula && typeof leg.mtm_formula === 'object' && 'rightSide' in leg.mtm_formula) {
        rightSide = leg.mtm_formula.rightSide;
      }
      
      const productDisplay = formatProductDisplay(
        leg.product,
        relationshipType,
        rightSide?.product
      );
      
      const displayPrice = calculateDisplayPrice(
        relationshipType,
        leg.price || 0,
        rightSide?.price
      );
      
      return {
        'TRADE REF': leg.leg_reference || '',
        'BROKER': leg.broker || '',
        'PRODUCTS': productDisplay,
        'PERIOD': leg.period || '',
        'QUANTITY': quantity,
        'PRICE': displayPrice.toLocaleString()
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
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Paper Trades');
    
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const fileName = `Paper_Trades_${dateStr}.xlsx`;
    
    XLSX.writeFile(workbook, fileName);
    
    console.log(`[EXPORT] Successfully exported to ${fileName}`);
    return fileName;
    
  } catch (error) {
    console.error('[EXPORT] Export error:', error);
    throw error;
  }
};

/**
 * Export exposure data by trade to Excel
 * Creates a file with two sheets: Physical Trades and Paper Trades
 */
export const exportExposureByTrade = async (): Promise<string> => {
  try {
    console.log('[EXPORT] Starting exposure by trade export');
    
    // Fetch physical trade legs
    const { data: tradeLegs, error: physicalError } = await supabase
      .from('trade_legs')
      .select(`
        id,
        leg_reference,
        buy_sell,
        product,
        inco_term,
        quantity,
        loading_period_start,
        loading_period_end,
        pricing_type,
        pricing_formula,
        efp_premium,
        efp_agreed_status,
        efp_fixed_value,
        efp_designated_month,
        comments,
        customs_status,
        contract_status,
        sustainability,
        parent_trades(
          trade_reference,
          counterparty
        )
      `)
      .order('created_at', { ascending: false });
      
    if (physicalError) {
      console.error('[EXPORT] Error fetching physical trade legs:', physicalError);
      throw new Error('Failed to fetch physical trade data');
    }
    
    // Fetch paper trade legs
    const { data: paperTradeLegs, error: paperError } = await supabase
      .from('paper_trade_legs')
      .select(`
        id,
        leg_reference,
        buy_sell,
        product,
        period,
        quantity,
        price,
        broker,
        instrument,
        mtm_formula,
        exposures
      `)
      .order('created_at', { ascending: false });
      
    if (paperError) {
      console.error('[EXPORT] Error fetching paper trade legs:', paperError);
      throw new Error('Failed to fetch paper trade data');
    }
    
    if ((!tradeLegs || tradeLegs.length === 0) && (!paperTradeLegs || paperTradeLegs.length === 0)) {
      console.warn('[EXPORT] No trade data to export');
      throw new Error('No trade data to export');
    }
    
    console.log(`[EXPORT] Processing ${tradeLegs?.length || 0} physical trades and ${paperTradeLegs?.length || 0} paper trades for export`);
    
    const workbook = XLSX.utils.book_new();
    
    // Format physical trade data
    if (tradeLegs && tradeLegs.length > 0) {
      const formattedPhysicalData = tradeLegs.map(leg => {
        const parentTrade = leg.parent_trades as any;
        const quantity = leg.quantity 
          ? parseFloat(String(leg.quantity)).toLocaleString() 
          : '';
        
        const formatDateStr = (dateStr: string | null) => {
          if (!dateStr) return '';
          try {
            return format(new Date(dateStr), 'dd MMM yyyy');
          } catch (e) {
            return '';
          }
        };
        
        // Format formula for display - similar to UI display
        let formulaDisplay = '';
        
        if (leg.pricing_type === 'efp') {
          if (leg.efp_agreed_status) {
            const fixedValue = leg.efp_fixed_value || 0;
            const premium = leg.efp_premium || 0;
            formulaDisplay = `${fixedValue + premium}`;
          } else {
            formulaDisplay = `ICE GASOIL FUTURES (EFP) + ${leg.efp_premium || 0}`;
          }
        } else if (leg.pricing_formula && 
            typeof leg.pricing_formula === 'object') {
          const pricingFormula = leg.pricing_formula as any;
          if (pricingFormula && pricingFormula.tokens && Array.isArray(pricingFormula.tokens)) {
            const tokensAny = pricingFormula.tokens;
            const tokens: FormulaToken[] = tokensAny.map(token => ({
              id: token.id?.toString() || '',
              type: token.type as any,
              value: token.value
            }));
            formulaDisplay = formulaToDisplayString(tokens);
          } else {
            formulaDisplay = 'No formula';
          }
        }
        
        // Format exposure data in a more readable way
        let physicalExposures = '';
        let pricingExposures = '';
        let monthlyDistribution = '';
        
        if (leg.pricing_formula && typeof leg.pricing_formula === 'object') {
          const pricingFormula = leg.pricing_formula as any;
          
          // Extract physical exposures
          if (pricingFormula && pricingFormula.exposures && pricingFormula.exposures.physical) {
            const physicalExp = pricingFormula.exposures.physical;
            physicalExposures = Object.entries(physicalExp)
              .map(([product, value]) => `${product}: ${value}`)
              .join(', ');
          }
          
          // Extract pricing exposures
          if (pricingFormula && pricingFormula.exposures && pricingFormula.exposures.pricing) {
            const pricingExp = pricingFormula.exposures.pricing;
            pricingExposures = Object.entries(pricingExp)
              .map(([product, value]) => `${product}: ${value}`)
              .join(', ');
          }
          
          // Extract monthly distribution
          if (pricingFormula && pricingFormula.monthlyDistribution) {
            const monthlyDist = pricingFormula.monthlyDistribution;
            const formattedMonthly: string[] = [];
            
            Object.entries(monthlyDist).forEach(([instrument, monthValues]) => {
              if (typeof monthValues === 'object') {
                const monthEntries = Object.entries(monthValues)
                  .map(([month, value]) => `${month}: ${value}`)
                  .join(', ');
                
                formattedMonthly.push(`${instrument}: { ${monthEntries} }`);
              }
            });
            
            monthlyDistribution = formattedMonthly.join(' | ');
          }
        }
        
        return {
          'REFERENCE': leg.leg_reference || parentTrade?.trade_reference || '',
          'BUY/SELL': (leg.buy_sell || '').toUpperCase(),
          'INCOTERM': leg.inco_term || '',
          'QUANTITY': quantity,
          'SUSTAINABILITY': leg.sustainability || '',
          'PRODUCT': leg.product || '',
          'LOADING START': formatDateStr(leg.loading_period_start as string | null),
          'LOADING END': formatDateStr(leg.loading_period_end as string | null),
          'COUNTERPARTY': parentTrade?.counterparty || '',
          'PRICING TYPE': leg.pricing_type === 'efp' ? 'EFP' : (leg.pricing_type || ''),
          'FORMULA': formulaDisplay || 'No formula',
          'COMMENTS': leg.comments || '',
          'CUSTOMS STATUS': leg.customs_status || '',
          'CONTRACT STATUS': leg.contract_status || '',
          'PHYSICAL EXPOSURES': physicalExposures || 'None',
          'PRICING EXPOSURES': pricingExposures || 'None',
          'MONTHLY DISTRIBUTION': monthlyDistribution || 'None'
        };
      });
      
      const physicalWorksheet = XLSX.utils.json_to_sheet(formattedPhysicalData);
      
      // Set column widths
      physicalWorksheet['!cols'] = [
        { wch: 15 }, // REFERENCE
        { wch: 10 }, // BUY/SELL
        { wch: 10 }, // INCOTERM
        { wch: 10 }, // QUANTITY
        { wch: 15 }, // SUSTAINABILITY
        { wch: 15 }, // PRODUCT
        { wch: 15 }, // LOADING START
        { wch: 15 }, // LOADING END
        { wch: 20 }, // COUNTERPARTY
        { wch: 15 }, // PRICING TYPE
        { wch: 25 }, // FORMULA
        { wch: 20 }, // COMMENTS
        { wch: 15 }, // CUSTOMS STATUS
        { wch: 15 }, // CONTRACT STATUS
        { wch: 30 }, // PHYSICAL EXPOSURES
        { wch: 30 }, // PRICING EXPOSURES
        { wch: 40 }  // MONTHLY DISTRIBUTION
      ];
      
      // Add border styles and conditional formatting
      const physicalRange = XLSX.utils.decode_range(physicalWorksheet['!ref'] || 'A1');
      const border = {
        top: { style: 'thick', color: { auto: 1 } },
        bottom: { style: 'thick', color: { auto: 1 } },
        left: { style: 'thick', color: { auto: 1 } },
        right: { style: 'thick', color: { auto: 1 } }
      };
      
      // Apply styles to header row
      for (let C = physicalRange.s.c; C <= physicalRange.e.c; ++C) {
        const headerCell = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!physicalWorksheet[headerCell]) physicalWorksheet[headerCell] = { t: 's', v: '' };
        if (!physicalWorksheet[headerCell].s) physicalWorksheet[headerCell].s = {};
        
        physicalWorksheet[headerCell].s = {
          fill: { patternType: 'solid', fgColor: { rgb: "4F81BD" } },
          font: { bold: true, color: { rgb: "FFFFFF" } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border
        };
      }
      
      // Apply styles to data cells
      for (let R = physicalRange.s.r + 1; R <= physicalRange.e.r; ++R) {
        for (let C = physicalRange.s.c; C <= physicalRange.e.c; ++C) {
          const cell_ref = XLSX.utils.encode_cell({ r: R, c: C });
          if (!physicalWorksheet[cell_ref]) physicalWorksheet[cell_ref] = { t: 's', v: '' };
          if (!physicalWorksheet[cell_ref].s) physicalWorksheet[cell_ref].s = {};
          
          // Add borders to all cells
          physicalWorksheet[cell_ref].s.border = border;
          
          // Apply row banding
          if (R % 2 === 0) {
            physicalWorksheet[cell_ref].s.fill = {
              patternType: 'solid',
              fgColor: { rgb: "E9EFF7" }
            };
          }
          
          // Special formatting for exposure columns
          if (C >= 14 && C <= 16) { // PHYSICAL_EXPOSURES, PRICING_EXPOSURES, MONTHLY_DISTRIBUTION
            physicalWorksheet[cell_ref].s.font = { color: { rgb: "000080" } };
          }
        }
      }
      
      XLSX.utils.book_append_sheet(workbook, physicalWorksheet, 'Physical Trades');
    }
    
    // Format paper trade data
    if (paperTradeLegs && paperTradeLegs.length > 0) {
      const formattedPaperData = paperTradeLegs.map(leg => {
        const quantity = leg.quantity 
          ? parseFloat(String(leg.quantity)).toLocaleString() 
          : '';
        
        // Determine the relationship type from instrument
        let relationshipType: 'FP' | 'DIFF' | 'SPREAD' = 'FP';
        if (leg.instrument) {
          if (leg.instrument.includes('DIFF')) {
            relationshipType = 'DIFF';
          } else if (leg.instrument.includes('SPREAD')) {
            relationshipType = 'SPREAD';
          }
        }
        
        // Extract right side product and price from mtm_formula if available
        let rightSide = undefined;
        if (leg.mtm_formula && typeof leg.mtm_formula === 'object' && 'rightSide' in leg.mtm_formula) {
          rightSide = leg.mtm_formula.rightSide;
        }
        
        // Format product display using the same function as UI
        const productDisplay = formatProductDisplay(
          leg.product,
          relationshipType,
          rightSide?.product
        );
        
        // Calculate display price using the same function as UI
        const displayPrice = calculateDisplayPrice(
          relationshipType,
          leg.price || 0,
          rightSide?.price
        );
        
        // Format exposure data in a more readable way
        let physicalExposures = '';
        let paperExposures = '';
        let pricingExposures = '';
        
        if (leg.exposures && typeof leg.exposures === 'object') {
          const exposuresData = leg.exposures as Record<string, any>;
          
          // Extract physical exposures
          if (exposuresData.physical && typeof exposuresData.physical === 'object') {
            physicalExposures = Object.entries(exposuresData.physical)
              .map(([product, value]) => `${product}: ${value}`)
              .join(', ');
          }
          
          // Extract paper exposures - this is a new field that wasn't in the original
          if (exposuresData.paper && typeof exposuresData.paper === 'object') {
            paperExposures = Object.entries(exposuresData.paper)
              .map(([product, value]) => `${product}: ${value}`)
              .join(', ');
          } else {
            // If paper exposures aren't explicitly defined, use physical as a fallback
            paperExposures = physicalExposures;
          }
          
          // Extract pricing exposures
          if (exposuresData.pricing && typeof exposuresData.pricing === 'object') {
            pricingExposures = Object.entries(exposuresData.pricing)
              .map(([product, value]) => `${product}: ${value}`)
              .join(', ');
          }
        } else if (leg.mtm_formula && typeof leg.mtm_formula === 'object') {
          const mtmFormula = leg.mtm_formula as any;
          
          if (mtmFormula.exposures) {
            // Extract physical exposures
            if (mtmFormula.exposures.physical && typeof mtmFormula.exposures.physical === 'object') {
              physicalExposures = Object.entries(mtmFormula.exposures.physical)
                .map(([product, value]) => `${product}: ${value}`)
                .join(', ');
            }
            
            // Use physical exposures for paper exposures too
            paperExposures = physicalExposures;
            
            // Extract pricing exposures
            if (mtmFormula.exposures.pricing && typeof mtmFormula.exposures.pricing === 'object') {
              pricingExposures = Object.entries(mtmFormula.exposures.pricing)
                .map(([product, value]) => `${product}: ${value}`)
                .join(', ');
            }
          }
        }
        
        return {
          'TRADE REF': leg.leg_reference || '',
          'BROKER': leg.broker || '',
          'PRODUCTS': productDisplay,
          'PERIOD': leg.period || '',
          'QUANTITY': quantity,
          'PRICE': displayPrice.toLocaleString(),
          'PHYSICAL EXPOSURES': physicalExposures || 'None',
          'PAPER EXPOSURES': paperExposures || 'None',
          'PRICING EXPOSURES': pricingExposures || 'None'
        };
      });
      
      const paperWorksheet = XLSX.utils.json_to_sheet(formattedPaperData);
      
      // Set column widths
      paperWorksheet['!cols'] = [
        { wch: 15 }, // TRADE REF
        { wch: 15 }, // BROKER
        { wch: 25 }, // PRODUCTS
        { wch: 10 }, // PERIOD
        { wch: 10 }, // QUANTITY
        { wch: 15 }, // PRICE
        { wch: 30 }, // PHYSICAL EXPOSURES
        { wch: 30 }, // PAPER EXPOSURES
        { wch: 30 }  // PRICING EXPOSURES
      ];
      
      // Add border styles and conditional formatting
      const paperRange = XLSX.utils.decode_range(paperWorksheet['!ref'] || 'A1');
      const border = {
        top: { style: 'thick', color: { auto: 1 } },
        bottom: { style: 'thick', color: { auto: 1 } },
        left: { style: 'thick', color: { auto: 1 } },
        right: { style: 'thick', color: { auto: 1 } }
      };
      
      // Apply styles to header row
      for (let C = paperRange.s.c; C <= paperRange.e.c; ++C) {
        const headerCell = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!paperWorksheet[headerCell]) paperWorksheet[headerCell] = { t: 's', v: '' };
        if (!paperWorksheet[headerCell].s) paperWorksheet[headerCell].s = {};
        
        paperWorksheet[headerCell].s = {
          fill: { patternType: 'solid', fgColor: { rgb: "4F81BD" } },
          font: { bold: true, color: { rgb: "FFFFFF" } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border
        };
      }
      
      // Apply styles to data cells
      for (let R = paperRange.s.r + 1; R <= paperRange.e.r; ++R) {
        for (let C = paperRange.s.c; C <= paperRange.e.c; ++C) {
          const cell_ref = XLSX.utils.encode_cell({ r: R, c: C });
          if (!paperWorksheet[cell_ref]) paperWorksheet[cell_ref] = { t: 's', v: '' };
          if (!paperWorksheet[cell_ref].s) paperWorksheet[cell_ref].s = {};
          
          // Add borders to all cells
          paperWorksheet[cell_ref].s.border = border;
          
          // Apply row banding
          if (R % 2 === 0) {
            paperWorksheet[cell_ref].s.fill = {
              patternType: 'solid',
              fgColor: { rgb: "E9EFF7" }
            };
          }
          
          // Special formatting for exposure columns
          if (C >= 6 && C <= 8) { // PHYSICAL_EXPOSURES, PAPER_EXPOSURES, PRICING_EXPOSURES
            paperWorksheet[cell_ref].s.font = { color: { rgb: "000080" } };
          }
        }
      }
      
      XLSX.utils.book_append_sheet(workbook, paperWorksheet, 'Paper Trades');
    }
    
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const fileName = `Exposure_by_trade_${dateStr}.xlsx`;
    
    XLSX.writeFile(workbook, fileName);
    
    console.log(`[EXPORT] Successfully exported to ${fileName}`);
    return fileName;
    
  } catch (error) {
    console.error('[EXPORT] Export error:', error);
    throw error;
  }
};

