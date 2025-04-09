
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

// Function to export movements to Excel
export const exportMovementsToExcel = async (): Promise<string> => {
  try {
    console.log('[EXPORT] Starting movements export');
    
    // Fetch movements data directly from the database
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
    
    // Format the data for Excel
    const formattedData = movements.map(movement => {
      const scheduledQuantity = movement.scheduled_quantity 
        ? parseFloat(String(movement.scheduled_quantity)).toLocaleString() 
        : '';
        
      const blQuantity = movement.bl_quantity 
        ? parseFloat(String(movement.bl_quantity)).toLocaleString() 
        : '';
        
      const actualQuantity = movement.actual_quantity 
        ? parseFloat(String(movement.actual_quantity)).toLocaleString() 
        : '';
      
      // Format dates
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
        'TRADE REFERENCE': movement.trade_reference || '',
        'BUY/SELL': (movement.buy_sell || '').toUpperCase(),
        'COUNTERPARTY': movement.counterparty || '',
        'PRODUCT': movement.product || '',
        'INCOTERM': movement.inco_term || '',
        'SUSTAINABILITY': movement.sustainability || '',
        'SCHEDULED QTY (MT)': scheduledQuantity,
        'BL QTY (MT)': blQuantity,
        'ACTUAL QTY (MT)': actualQuantity,
        'NOMINATION ETA': formatDateStr(movement.nomination_eta),
        'NOMINATION VALID': formatDateStr(movement.nomination_valid),
        'CASH FLOW DATE': formatDateStr(movement.cash_flow),
        'BL DATE': formatDateStr(movement.bl_date),
        'COD DATE': formatDateStr(movement.cod_date),
        'BARGE NAME': movement.barge_name || '',
        'LOADPORT': movement.loadport || '',
        'LOADPORT INSPECTOR': movement.loadport_inspector || '',
        'DISPORT': movement.disport || '',
        'DISPORT INSPECTOR': movement.disport_inspector || '',
        'CREDIT STATUS': movement.credit_status || '',
        'CUSTOMS STATUS': movement.customs_status || '',
        'CONTRACT STATUS': movement.contract_status || '',
        'STATUS': (movement.status || '').toUpperCase(),
        'COMMENTS': movement.comments || ''
      };
    });
    
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Movements');
    
    // Generate filename with current date
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const fileName = `Movements_${dateStr}.xlsx`;
    
    // Write to file and trigger download
    XLSX.writeFile(workbook, fileName);
    
    console.log(`[EXPORT] Successfully exported to ${fileName}`);
    return fileName;
    
  } catch (error) {
    console.error('[EXPORT] Export error:', error);
    throw error;
  }
};

// Function to export exposure data to Excel
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
    
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Format the data for Excel
    const formattedData: any[] = [];
    
    // Add headers
    const headers: any = { 'Month': '' };
    
    // Add category headers
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
        headers[`${category} - ${product}`] = '';
      });
      
      if (category === 'Exposure') {
        headers['Biodiesel Total'] = '';
        headers['Pricing Instrument Total'] = '';
        headers['Total Row'] = '';
      }
    });
    
    // Add data rows for each month
    exposureData.forEach(monthData => {
      const row: any = { 'Month': monthData.month };
      
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
          
          row[`${category} - ${product}`] = value;
        });
        
        if (category === 'Exposure') {
          // Calculate group totals
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
          
          row['Biodiesel Total'] = biodieselTotal;
          row['Pricing Instrument Total'] = pricingInstrumentTotal;
          row['Total Row'] = biodieselTotal + pricingInstrumentTotal;
        }
      });
      
      formattedData.push(row);
    });
    
    // Add totals row
    const totalsRow: any = { 'Month': 'Total' };
    
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
        
        totalsRow[`${category} - ${product}`] = value;
      });
      
      if (category === 'Exposure') {
        totalsRow['Biodiesel Total'] = groupGrandTotals.biodieselTotal;
        totalsRow['Pricing Instrument Total'] = groupGrandTotals.pricingInstrumentTotal;
        totalsRow['Total Row'] = groupGrandTotals.totalRow;
      }
    });
    
    formattedData.push(totalsRow);
    
    // Create worksheet and add to workbook
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Exposure');
    
    // Generate filename with current date
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const fileName = `Exposure_${dateStr}.xlsx`;
    
    // Write to file and trigger download
    XLSX.writeFile(workbook, fileName);
    
    console.log(`[EXPORT] Successfully exported exposure data to ${fileName}`);
    
  } catch (error) {
    console.error('[EXPORT] Export error:', error);
    throw error;
  }
};
