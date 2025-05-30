
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { generateTradeReference, generateLegReference } from './tradeUtils';
import { supabase } from '@/integrations/supabase/client';
import { buildCompleteExposuresObject } from './paperTrade';

// Column indices for the Excel template
const COLUMNS = {
  BROKER: 0,
  BUY_SELL: 1,
  PRODUCT: 2,
  QUANTITY: 3,
  PERIOD_START: 4,
  PERIOD_END: 5,
  PRICE: 6,
  RELATIONSHIP_TYPE: 7,
  RIGHT_SIDE_PRODUCT: 8,
  RIGHT_SIDE_QUANTITY: 9,
  RIGHT_SIDE_PRICE: 10,
  EXECUTION_TRADE_DATE: 11
};

interface ParsedTrade {
  groupIndex: number;
  broker: string;
  legs: any[];
  errors: string[];
}

interface ValidationError {
  row: number;
  errors: string[];
}

interface ParseResult {
  trades: ParsedTrade[];
  errors: ValidationError[];
}

// Convert date range to period format (MMM-YY)
const convertDateRangeToPeriod = (startDate: string, endDate: string): string => {
  try {
    const start = parseExcelDate(startDate);
    const end = parseExcelDate(endDate);
    
    // Use the start date's month and year for the period
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[start.getMonth()];
    const year = start.getFullYear().toString().slice(-2);
    
    return `${month}-${year}`;
  } catch (error) {
    throw new Error('Invalid date format. Use dd-mm-yyyy');
  }
};

// Parse Excel date (handles both serial numbers and text dates)
const parseExcelDate = (dateValue: any): Date => {
  if (typeof dateValue === 'number') {
    // Excel serial number
    return XLSX.SSF.parse_date_code(dateValue);
  } else if (typeof dateValue === 'string') {
    // Text date in dd-mm-yyyy format
    const parts = dateValue.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-based
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
  }
  throw new Error('Invalid date format');
};

// Format date for database storage
const formatDateForDatabase = (dateStr: string): string | null => {
  if (!dateStr?.trim()) return null;
  
  try {
    const date = parseExcelDate(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return null;
  }
};

// Detect thick borders in Excel (simplified - checks for border weight)
const hasBorderSeparation = (workbook: XLSX.WorkBook, sheetName: string, rowIndex: number): boolean => {
  // For now, we'll use a simpler approach - look for empty rows or specific markers
  const worksheet = workbook.Sheets[sheetName];
  const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: 0 });
  const cell = worksheet[cellRef];
  
  // Check if this row is empty (indicates group separation)
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  let isEmpty = true;
  
  for (let c = 0; c <= range.e.c; c++) {
    const checkRef = XLSX.utils.encode_cell({ r: rowIndex, c });
    if (worksheet[checkRef] && worksheet[checkRef].v) {
      isEmpty = false;
      break;
    }
  }
  
  return isEmpty;
};

// Validate a single leg
const validateLeg = (leg: any, rowIndex: number): string[] => {
  const errors: string[] = [];
  
  if (!leg.broker?.trim()) errors.push('Broker is required');
  if (!leg.buySell || !['BUY', 'SELL'].includes(leg.buySell.toUpperCase())) {
    errors.push('Buy/Sell must be BUY or SELL');
  }
  if (!leg.product?.trim()) errors.push('Product is required');
  if (!leg.quantity || leg.quantity <= 0) errors.push('Quantity must be positive');
  if (!leg.periodStart?.trim()) errors.push('Period Start is required');
  if (!leg.periodEnd?.trim()) errors.push('Period End is required');
  if (!leg.price || leg.price < 0) errors.push('Price must be non-negative');
  if (!leg.relationshipType || !['FP', 'DIFF', 'SPREAD'].includes(leg.relationshipType)) {
    errors.push('Relationship Type must be FP, DIFF, or SPREAD');
  }
  
  // Validate DIFF/SPREAD requirements
  if (['DIFF', 'SPREAD'].includes(leg.relationshipType)) {
    if (!leg.rightSideProduct?.trim()) {
      errors.push('Right Side Product is required for DIFF/SPREAD');
    }
  }
  
  return errors;
};

// Check and create broker if it doesn't exist
const ensureBrokerExists = async (brokerName: string): Promise<void> => {
  const { data: existingBroker } = await supabase
    .from('brokers')
    .select('id')
    .eq('name', brokerName)
    .eq('is_active', true)
    .single();
    
  if (!existingBroker) {
    const { error } = await supabase
      .from('brokers')
      .insert({ name: brokerName, is_active: true });
      
    if (error) {
      throw new Error(`Failed to create broker: ${error.message}`);
    }
  }
};

// Main parsing function
export const parseExcelPaperTrades = async (
  file: File, 
  onProgress?: (progress: number) => void
): Promise<ParseResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        if (!workbook.SheetNames.length) {
          throw new Error('No sheets found in Excel file');
        }
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const trades: ParsedTrade[] = [];
        const errors: ValidationError[] = [];
        let currentGroup: any[] = [];
        let groupIndex = 0;
        
        // Skip header row (assume first row is headers)
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          
          if (onProgress) {
            onProgress((i / jsonData.length) * 50); // First 50% for parsing
          }
          
          // Check if this row starts a new group (empty row or border detection)
          const isGroupSeparator = hasBorderSeparation(workbook, sheetName, i) || 
                                   (row.length === 0 || row.every(cell => !cell));
          
          if (isGroupSeparator && currentGroup.length > 0) {
            // Process current group
            await processTradeGroup(currentGroup, groupIndex, trades, errors);
            currentGroup = [];
            groupIndex++;
            continue;
          }
          
          // Skip empty rows
          if (row.length === 0 || row.every(cell => !cell)) {
            continue;
          }
          
          // Parse row data
          const legData = {
            broker: row[COLUMNS.BROKER]?.toString().trim() || '',
            buySell: row[COLUMNS.BUY_SELL]?.toString().toUpperCase() || '',
            product: row[COLUMNS.PRODUCT]?.toString().trim() || '',
            quantity: parseFloat(row[COLUMNS.QUANTITY]) || 0,
            periodStart: row[COLUMNS.PERIOD_START]?.toString() || '',
            periodEnd: row[COLUMNS.PERIOD_END]?.toString() || '',
            price: parseFloat(row[COLUMNS.PRICE]) || 0,
            relationshipType: row[COLUMNS.RELATIONSHIP_TYPE]?.toString() || 'FP',
            rightSideProduct: row[COLUMNS.RIGHT_SIDE_PRODUCT]?.toString().trim() || '',
            rightSideQuantity: parseFloat(row[COLUMNS.RIGHT_SIDE_QUANTITY]) || 0,
            rightSidePrice: parseFloat(row[COLUMNS.RIGHT_SIDE_PRICE]) || 0,
            executionTradeDate: row[COLUMNS.EXECUTION_TRADE_DATE]?.toString() || '',
            rowIndex: i + 1
          };
          
          currentGroup.push(legData);
        }
        
        // Process the last group
        if (currentGroup.length > 0) {
          await processTradeGroup(currentGroup, groupIndex, trades, errors);
        }
        
        if (onProgress) {
          onProgress(100);
        }
        
        resolve({ trades, errors });
      } catch (error: any) {
        reject(new Error(`Failed to parse Excel file: ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

// Process a group of legs into a trade
const processTradeGroup = async (
  group: any[], 
  groupIndex: number, 
  trades: ParsedTrade[], 
  errors: ValidationError[]
) => {
  if (group.length === 0) return;
  
  const broker = group[0].broker;
  const tradeReference = generateTradeReference();
  const legs: any[] = [];
  const tradeErrors: string[] = [];
  
  // Ensure all legs in group have same broker
  const brokerMismatch = group.some(leg => leg.broker !== broker);
  if (brokerMismatch) {
    tradeErrors.push('All legs in a trade group must have the same broker');
  }
  
  // Validate and process each leg
  for (let i = 0; i < group.length; i++) {
    const legData = group[i];
    const legErrors = validateLeg(legData, legData.rowIndex);
    
    if (legErrors.length > 0) {
      errors.push({
        row: legData.rowIndex,
        errors: legErrors
      });
      continue;
    }
    
    try {
      // Convert period
      const period = convertDateRangeToPeriod(legData.periodStart, legData.periodEnd);
      
      // Build leg object
      const leg = {
        id: crypto.randomUUID(),
        legReference: generateLegReference(tradeReference, i),
        buySell: legData.buySell.toLowerCase(),
        product: legData.product,
        quantity: legData.quantity,
        period: period,
        price: legData.price,
        broker: broker,
        instrument: legData.product, // Use product as instrument for now
        relationshipType: legData.relationshipType,
        executionTradeDate: legData.executionTradeDate ? 
          formatDateForDatabase(legData.executionTradeDate) : null
      };
      
      // Add right side for DIFF/SPREAD
      if (['DIFF', 'SPREAD'].includes(legData.relationshipType) && legData.rightSideProduct) {
        leg.rightSide = {
          product: legData.rightSideProduct,
          quantity: -legData.quantity, // Right side is opposite sign
          period: period,
          price: legData.rightSidePrice || 0
        };
      }
      
      // Calculate exposures
      leg.exposures = buildCompleteExposuresObject(leg);
      
      legs.push(leg);
    } catch (error: any) {
      errors.push({
        row: legData.rowIndex,
        errors: [error.message]
      });
    }
  }
  
  // Only add trade if no critical errors
  if (legs.length > 0) {
    trades.push({
      groupIndex,
      broker,
      tradeReference,
      tradeType: 'paper',
      legs,
      errors: tradeErrors
    });
  }
};

// Generate Excel template
export const generateExcelTemplate = () => {
  const headers = [
    'Broker',
    'Buy/Sell',
    'Product',
    'Quantity',
    'Period Start (dd-mm-yyyy)',
    'Period End (dd-mm-yyyy)',
    'Price',
    'Relationship Type',
    'Right Side Product',
    'Right Side Quantity',
    'Right Side Price',
    'Execution Trade Date (dd-mm-yyyy)'
  ];
  
  const sampleData = [
    // Trade Group 1 (FP trades)
    ['Interactive Brokers', 'BUY', 'Argus UCOME', 100, '01-12-2024', '31-12-2024', 850.50, 'FP', '', '', '', ''],
    ['Interactive Brokers', 'SELL', 'Argus RME', 75, '01-01-2025', '31-01-2025', 920.75, 'FP', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', ''], // Empty row to separate groups
    
    // Trade Group 2 (DIFF trade)
    ['XTB', 'BUY', 'Argus FAME0', 200, '01-02-2025', '28-02-2025', 15.25, 'DIFF', 'Platts LSGO', -200, 875.00, '15-11-2024'],
    ['', '', '', '', '', '', '', '', '', '', '', ''], // Empty row to separate groups
    
    // Trade Group 3 (SPREAD trade)
    ['FXCM', 'SELL', 'Argus HVO', 150, '01-03-2025', '31-03-2025', 45.50, 'SPREAD', 'ICE GASOIL FUTURES', -150, 890.25, '']
  ];
  
  const worksheetData = [headers, ...sampleData];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // Set column widths
  const columnWidths = [
    { wch: 20 }, // Broker
    { wch: 10 }, // Buy/Sell
    { wch: 15 }, // Product
    { wch: 10 }, // Quantity
    { wch: 20 }, // Period Start
    { wch: 20 }, // Period End
    { wch: 10 }, // Price
    { wch: 15 }, // Relationship Type
    { wch: 20 }, // Right Side Product
    { wch: 15 }, // Right Side Quantity
    { wch: 15 }, // Right Side Price
    { wch: 25 }  // Execution Trade Date
  ];
  worksheet['!cols'] = columnWidths;
  
  // Create workbook with instructions sheet
  const workbook = XLSX.utils.book_new();
  
  // Add instructions sheet
  const instructions = [
    ['Paper Trade Upload Instructions'],
    [''],
    ['1. Each row represents one trade leg'],
    ['2. Use empty rows to separate trade groups (all legs with same broker)'],
    ['3. All legs in the same group must have the same broker'],
    ['4. Dates should be in dd-mm-yyyy format (e.g., 15-12-2024)'],
    ['5. Buy/Sell must be exactly "BUY" or "SELL"'],
    ['6. Relationship Type must be "FP", "DIFF", or "SPREAD"'],
    ['7. For DIFF/SPREAD trades, provide Right Side Product'],
    ['8. Right Side Quantity will be auto-calculated as negative of main quantity'],
    ['9. Execution Trade Date is optional'],
    [''],
    ['Sample data is provided in the "Data" sheet'],
    [''],
    ['Available Products:'],
    ['- Argus UCOME'],
    ['- Argus FAME0'],
    ['- Argus RME'],
    ['- Platts LSGO'],
    ['- Argus HVO'],
    ['- ICE GASOIL FUTURES']
  ];
  
  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructions);
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
  // Generate and download file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  const fileName = `paper_trade_template_${new Date().toISOString().split('T')[0]}.xlsx`;
  saveAs(data, fileName);
};
