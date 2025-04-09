
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
        ? parseFloat(movement.scheduled_quantity).toLocaleString() 
        : '';
        
      const blQuantity = movement.bl_quantity 
        ? parseFloat(movement.bl_quantity).toLocaleString() 
        : '';
        
      const actualQuantity = movement.actual_quantity 
        ? parseFloat(movement.actual_quantity).toLocaleString() 
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
