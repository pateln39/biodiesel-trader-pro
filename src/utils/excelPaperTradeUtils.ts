
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

interface PaperTradeRightSide {
  product: string;
  quantity: number;
  period: string;
  price: number;
}

interface ParsedLeg {
  id: string;
  legReference: string;
  buySell: string;
  product: string;
  quantity: number;
  period: string;
  price: number;
  broker: string;
  instrument: string;
  relationshipType: string;
  rightSide?: PaperTradeRightSide;
  exposures?: any;
  executionTradeDate?: string | null;
}

interface ParsedTrade {
  groupIndex: number;
  broker: string;
  tradeReference: string;
  tradeType: string;
  legs: ParsedLeg[];
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

// Parse Excel date (handles both serial numbers and text dates)
const parseExcelDate = (dateValue: any): Date => {
  if (typeof dateValue === 'number') {
    // Excel serial number - convert to JavaScript Date
    try {
      // Excel epoch starts at 1900-01-01, but JavaScript Date uses 1970-01-01
      // Excel has a leap year bug where it thinks 1900 was a leap year
      // For dates after Feb 28, 1900, we need to subtract 1 day
      const excelEpoch = new Date(1900, 0, 1); // January 1, 1900
      const msPerDay = 24 * 60 * 60 * 1000;
      
      // Convert Excel serial number to JavaScript Date
      let adjustedSerial = dateValue;
      
      // Account for Excel's leap year bug (Excel thinks 1900 was a leap year)
      if (dateValue > 59) { // After Feb 28, 1900
        adjustedSerial = dateValue - 1;
      }
      
      // Calculate the date
      const date = new Date(excelEpoch.getTime() + (adjustedSerial - 1) * msPerDay);
      
      // Validate the resulting date
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid Excel date serial number: ${dateValue}`);
      }
      
      // Check if the resulting date is reasonable (between 1900 and 2100)
      const year = date.getFullYear();
      if (year < 1900 || year > 2100) {
        throw new Error(`Excel date serial number ${dateValue} resulted in unreasonable year: ${year}`);
      }
      
      return date;
    } catch (error) {
      throw new Error(`Failed to convert Excel serial number ${dateValue}: ${error.message}`);
    }
  } else if (typeof dateValue === 'string') {
    // Trim whitespace and normalize separators
    const cleanedValue = dateValue.trim().replace(/[\/\.]/g, '-');
    
    // Text date in dd-mm-yyyy or dd-mm-yy format
    const parts = cleanedValue.split('-');
    if (parts.length === 3) {
      const dayStr = parts[0].trim();
      const monthStr = parts[1].trim();
      const yearStr = parts[2].trim();
      
      const day = parseInt(dayStr, 10);
      const month = parseInt(monthStr, 10);
      let year = parseInt(yearStr, 10);
      
      // Validate parsed numbers
      if (isNaN(day) || isNaN(month) || isNaN(year)) {
        throw new Error(`Invalid date components - Day: "${dayStr}", Month: "${monthStr}", Year: "${yearStr}"`);
      }
      
      // Handle 2-digit years (assume 2000+)
      if (year < 100) {
        year = 2000 + year;
      }
      
      // Validate ranges
      if (month < 1 || month > 12) {
        throw new Error(`Invalid month: ${month}. Must be between 1 and 12`);
      }
      
      if (day < 1 || day > 31) {
        throw new Error(`Invalid day: ${day}. Must be between 1 and 31`);
      }
      
      if (year < 1900 || year > 2100) {
        throw new Error(`Invalid year: ${year}. Must be between 1900 and 2100`);
      }
      
      // Create date (month is 0-based in JavaScript)
      const date = new Date(year, month - 1, day);
      
      // Verify the date is valid (handles cases like Feb 30)
      if (date.getFullYear() !== year || date.getMonth() !== (month - 1) || date.getDate() !== day) {
        throw new Error(`Invalid date: ${day}/${month}/${year} does not exist`);
      }
      
      return date;
    } else {
      throw new Error(`Invalid date format: "${dateValue}". Expected dd-mm-yyyy or dd-mm-yy format`);
    }
  }
  throw new Error(`Invalid date type: ${typeof dateValue}. Expected number or string`);
};

// Convert date range to period format (MMM-YY) - now accepts raw Excel values
const convertDateRangeToPeriod = (startDateValue: any, endDateValue: any): string => {
  try {
    console.log('[DATE_PARSING] Converting date range to period:', { 
      startDateValue, 
      endDateValue,
      startType: typeof startDateValue,
      endType: typeof endDateValue 
    });
    
    const start = parseExcelDate(startDateValue);
    const end = parseExcelDate(endDateValue);
    
    // Use the start date's month and year for the period
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[start.getMonth()];
    const year = start.getFullYear().toString().slice(-2);
    
    const period = `${month}-${year}`;
    console.log('[DATE_PARSING] Successfully converted to period:', period);
    return period;
  } catch (error: any) {
    console.error('[DATE_PARSING] Failed to convert date range:', error.message);
    throw new Error(`Date parsing failed: ${error.message}. Please use dd-mm-yyyy format (e.g., 15-12-2024)`);
  }
};

// Format date for database storage
const formatDateForDatabase = (dateValue: any): string | null => {
  if (!dateValue) return null;
  
  // Handle empty string case
  if (typeof dateValue === 'string' && !dateValue.trim()) return null;
  
  try {
    console.log('[DATE_FORMATTING] Formatting date for database:', { dateValue, type: typeof dateValue });
    const date = parseExcelDate(dateValue);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formatted = `${year}-${month}-${day}`;
    console.log('[DATE_FORMATTING] Successfully formatted:', formatted);
    return formatted;
  } catch (error: any) {
    console.error(`[DATE_FORMATTING] Failed to format date for database:`, { dateValue, error: error.message });
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
  
  // Fix Buy/Sell validation - trim whitespace and provide better error messages
  const buySellValue = leg.buySell?.toString().trim().toUpperCase();
  if (!buySellValue || !['BUY', 'SELL'].includes(buySellValue)) {
    errors.push(`Buy/Sell must be BUY or SELL (found: "${leg.buySell}")`);
  }
  
  if (!leg.product?.trim()) errors.push('Product is required');
  
  // Fix quantity validation - allow 0, negative, and positive numbers
  if (leg.quantity === undefined || leg.quantity === null || isNaN(Number(leg.quantity))) {
    errors.push(`Quantity must be a valid number (found: "${leg.quantity}")`);
  }
  
  if (!leg.periodStart) errors.push('Period Start is required');
  if (!leg.periodEnd) errors.push('Period End is required');
  
  // Price can be 0 or negative, just check it's a valid number
  if (leg.price === undefined || leg.price === null || isNaN(Number(leg.price))) {
    errors.push(`Price must be a valid number (found: "${leg.price}")`);
  }
  
  if (!leg.relationshipType || !['FP', 'DIFF', 'SPREAD'].includes(leg.relationshipType)) {
    errors.push(`Relationship Type must be FP, DIFF, or SPREAD (found: "${leg.relationshipType}")`);
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
          
          // Parse row data preserving raw Excel values for dates
          const legData = {
            broker: row[COLUMNS.BROKER] ? row[COLUMNS.BROKER].toString().trim() : '',
            buySell: row[COLUMNS.BUY_SELL] ? row[COLUMNS.BUY_SELL].toString().trim().toUpperCase() : '',
            product: row[COLUMNS.PRODUCT] ? row[COLUMNS.PRODUCT].toString().trim() : '',
            quantity: row[COLUMNS.QUANTITY] ?? 0,
            // Keep raw Excel values for dates (don't convert to string yet)
            periodStart: row[COLUMNS.PERIOD_START],
            periodEnd: row[COLUMNS.PERIOD_END],
            price: row[COLUMNS.PRICE] ?? 0,
            relationshipType: row[COLUMNS.RELATIONSHIP_TYPE] ? row[COLUMNS.RELATIONSHIP_TYPE].toString().trim() : 'FP',
            rightSideProduct: row[COLUMNS.RIGHT_SIDE_PRODUCT] ? row[COLUMNS.RIGHT_SIDE_PRODUCT].toString().trim() : '',
            rightSideQuantity: row[COLUMNS.RIGHT_SIDE_QUANTITY] ?? 0,
            rightSidePrice: row[COLUMNS.RIGHT_SIDE_PRICE] ?? 0,
            // Keep raw Excel value for execution date
            executionTradeDate: row[COLUMNS.EXECUTION_TRADE_DATE],
            rowIndex: i + 1
          };
          
          console.log('[EXCEL_PARSING] Parsed row data:', {
            rowIndex: i + 1,
            periodStart: legData.periodStart,
            periodStartType: typeof legData.periodStart,
            periodEnd: legData.periodEnd,
            periodEndType: typeof legData.periodEnd,
            executionTradeDate: legData.executionTradeDate,
            executionTradeDateType: typeof legData.executionTradeDate
          });
          
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
  const legs: ParsedLeg[] = [];
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
      // Convert period using raw Excel values
      const period = convertDateRangeToPeriod(legData.periodStart, legData.periodEnd);
      
      // Build leg object with proper typing
      const leg: ParsedLeg = {
        id: crypto.randomUUID(),
        legReference: generateLegReference(tradeReference, i),
        buySell: legData.buySell.toString().trim().toLowerCase(), // Ensure proper trimming
        product: legData.product,
        quantity: Number(legData.quantity), // Convert to number explicitly
        period: period,
        price: Number(legData.price), // Convert to number explicitly
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
          quantity: -Number(legData.quantity), // Right side is opposite sign
          period: period,
          price: Number(legData.rightSidePrice) || 0
        };
      }
      
      // Calculate exposures
      leg.exposures = buildCompleteExposuresObject(leg);
      
      legs.push(leg);
    } catch (error: any) {
      console.error('[TRADE_PROCESSING] Error processing leg:', error);
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
  
  // Add instructions sheet with clearer date format guidance
  const instructions = [
    ['Paper Trade Upload Instructions'],
    [''],
    ['1. Each row represents one trade leg'],
    ['2. Use empty rows to separate trade groups (all legs with same broker)'],
    ['3. All legs in the same group must have the same broker'],
    ['4. IMPORTANT: Dates must be in dd-mm-yyyy format (e.g., 15-12-2024)'],
    ['   - Day first, then month, then year'],
    ['   - Use 2-digit day and month (01, 02, etc.)'],
    ['   - Use 4-digit year (2024, 2025, etc.)'],
    ['   - Separators can be - / or .'],
    ['5. Buy/Sell must be exactly "BUY" or "SELL"'],
    ['6. Quantity can be positive, negative, or zero'],
    ['7. Price can be positive, negative, or zero'],
    ['8. Relationship Type must be "FP", "DIFF", or "SPREAD"'],
    ['9. For DIFF/SPREAD trades, provide Right Side Product'],
    ['10. Right Side Quantity will be auto-calculated as negative of main quantity'],
    ['11. Execution Trade Date is optional'],
    [''],
    ['Sample data is provided in the "Data" sheet'],
    [''],
    ['Date Format Examples:'],
    ['- 15-12-2024 (15th December 2024)'],
    ['- 01-01-2025 (1st January 2025)'],
    ['- 28-02-2025 (28th February 2025)'],
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
