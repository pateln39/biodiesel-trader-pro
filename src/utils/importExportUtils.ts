
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { generateTradeReference, generateLegReference } from '@/utils/tradeUtils';
import { validateAndParsePricingFormula } from '@/utils/formulaUtils';
import { calculateExposures } from '@/utils/formulaCalculation';
import { BuySell, PhysicalTradeType } from '@/types';
import { formatDateForStorage } from '@/utils/dateUtils';
import { mapProductToCanonical } from '@/utils/productMapping';
import { generateInstrumentName } from '@/utils/tradeUtils';

// Define column mapping types
interface ColumnMapping {
  excelHeader: string;
  dbField: string;
  required: boolean;
  type: 'string' | 'number' | 'date' | 'boolean' | 'formula';
  transform?: (value: any) => any;
}

// Define template structure
interface SheetTemplate {
  sheetName: string;
  tableName: string;
  parentIdField?: string;
  columns: ColumnMapping[];
  idField?: string;
  required: boolean;
}

// Physical trade template structure
const physicalTradeTemplate: SheetTemplate[] = [
  {
    sheetName: 'ParentTrades',
    tableName: 'parent_trades',
    idField: 'id',
    required: true,
    columns: [
      { excelHeader: 'Trade Reference', dbField: 'trade_reference', required: true, type: 'string' },
      { excelHeader: 'Trade Type', dbField: 'trade_type', required: true, type: 'string', 
        transform: () => 'physical' },
      { excelHeader: 'Physical Type', dbField: 'physical_type', required: true, type: 'string' },
      { excelHeader: 'Counterparty', dbField: 'counterparty', required: true, type: 'string' },
    ]
  },
  {
    sheetName: 'TradeLegs',
    tableName: 'trade_legs',
    parentIdField: 'parent_trade_id',
    required: true,
    columns: [
      { excelHeader: 'Trade Reference', dbField: '_parent_reference', required: true, type: 'string' },
      { excelHeader: 'Leg Reference', dbField: 'leg_reference', required: true, type: 'string' },
      { excelHeader: 'Buy/Sell', dbField: 'buy_sell', required: true, type: 'string' },
      { excelHeader: 'Product', dbField: 'product', required: true, type: 'string' },
      { excelHeader: 'Sustainability', dbField: 'sustainability', required: false, type: 'string' },
      { excelHeader: 'Incoterm', dbField: 'inco_term', required: true, type: 'string' },
      { excelHeader: 'Quantity', dbField: 'quantity', required: true, type: 'number' },
      { excelHeader: 'Tolerance', dbField: 'tolerance', required: false, type: 'number' },
      { excelHeader: 'Loading Period Start', dbField: 'loading_period_start', required: true, type: 'date' },
      { excelHeader: 'Loading Period End', dbField: 'loading_period_end', required: true, type: 'date' },
      { excelHeader: 'Pricing Period Start', dbField: 'pricing_period_start', required: true, type: 'date' },
      { excelHeader: 'Pricing Period End', dbField: 'pricing_period_end', required: true, type: 'date' },
      { excelHeader: 'Unit', dbField: 'unit', required: true, type: 'string' },
      { excelHeader: 'Payment Term', dbField: 'payment_term', required: true, type: 'string' },
      { excelHeader: 'Credit Status', dbField: 'credit_status', required: true, type: 'string' },
      { excelHeader: 'Pricing Formula', dbField: 'pricing_formula', required: false, type: 'formula' },
    ]
  },
];

// Paper trade template structure
const paperTradeTemplate: SheetTemplate[] = [
  {
    sheetName: 'PaperTrades',
    tableName: 'paper_trades',
    idField: 'id',
    required: true,
    columns: [
      { excelHeader: 'Trade Reference', dbField: 'trade_reference', required: true, type: 'string' },
      { excelHeader: 'Broker', dbField: 'broker', required: true, type: 'string' },
      { excelHeader: 'Counterparty', dbField: 'counterparty', required: false, type: 'string',
        transform: (value) => value || 'Paper Trade' },
    ]
  },
  {
    sheetName: 'PaperTradeLegs',
    tableName: 'paper_trade_legs',
    parentIdField: 'paper_trade_id',
    required: true,
    columns: [
      { excelHeader: 'Trade Reference', dbField: '_parent_reference', required: true, type: 'string' },
      { excelHeader: 'Buy/Sell', dbField: 'buy_sell', required: true, type: 'string' },
      { excelHeader: 'Product', dbField: 'product', required: true, type: 'string' },
      { excelHeader: 'Quantity', dbField: 'quantity', required: true, type: 'number' },
      { excelHeader: 'Period', dbField: 'period', required: true, type: 'string' },
      { excelHeader: 'Price', dbField: 'price', required: true, type: 'number' },
      { excelHeader: 'Relationship Type', dbField: '_relationship_type', required: false, type: 'string',
        transform: (value) => value || 'FP' }, 
      { excelHeader: 'Right Side Product', dbField: '_right_side_product', required: false, type: 'string' },
      { excelHeader: 'Right Side Quantity', dbField: '_right_side_quantity', required: false, type: 'number' },
    ]
  },
];

// Function to create a template worksheet with instructions
function createTemplateWorksheet(template: SheetTemplate): XLSX.WorkSheet {
  // Create headers
  const headers = template.columns.map(col => col.excelHeader);
  const requiredMarkers = template.columns.map(col => col.required ? '*' : '');
  const types = template.columns.map(col => col.type);
  
  // Create data for the worksheet
  const data = [
    headers,
    requiredMarkers,
    types,
    // Add an example row
    headers.map(() => '')
  ];
  
  // Create the worksheet
  const ws = XLSX.utils.aoa_to_sheet(data);
  
  // Add some styling info
  const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  headerRange.e.r = 0; // Only style the first row
  
  // Add cell styles (not directly supported but can be added to the sheet)
  for (let i = headerRange.s.c; i <= headerRange.e.c; i++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: i });
    if (!ws[cellAddress]) ws[cellAddress] = {};
    ws[cellAddress].s = { font: { bold: true } };
  }
  
  // Add a comment in cell A1 with instructions
  ws.A1 = {
    v: headers[0],
    c: [{
      a: 'System',
      t: 'Fields marked with * are required. The format of dates should be YYYY-MM-DD.'
    }]
  };
  
  return ws;
}

// Create a physical trade template Excel file
export function downloadPhysicalTradeTemplate() {
  // Create a new workbook
  const wb = XLSX.utils.book_new();
  
  // Add instructions sheet
  const instructionsData = [
    ['Physical Trade Import Instructions'],
    [''],
    ['1. Fill in all required fields (marked with *) in both sheets.'],
    ['2. Each trade must have a unique Trade Reference.'],
    ['3. The Trade Type must be "physical".'],
    ['4. Physical Type must be either "spot" or "term".'],
    ['5. Dates must be in YYYY-MM-DD format.'],
    ['6. For pricing formula, use the format: INSTRUMENT [OPERATOR] VALUE [%]'],
    ['   Example: Argus UCOME + 20 or Argus FAME0 * 0.9'],
    ['7. Do not modify the headers or structure of the template.'],
    ['8. Save the file as Excel (.xlsx) before uploading.'],
  ];
  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
  XLSX.utils.book_append_sheet(wb, instructionsSheet, 'Instructions');
  
  // Add sheets for each template
  physicalTradeTemplate.forEach(template => {
    const ws = createTemplateWorksheet(template);
    XLSX.utils.book_append_sheet(wb, ws, template.sheetName);
  });
  
  // Save the workbook as a file
  XLSX.writeFile(wb, 'physical_trade_template.xlsx');
}

// Create a paper trade template Excel file
export function downloadPaperTradeTemplate() {
  // Create a new workbook
  const wb = XLSX.utils.book_new();
  
  // Add instructions sheet
  const instructionsData = [
    ['Paper Trade Import Instructions'],
    [''],
    ['1. Fill in all required fields (marked with *) in both sheets.'],
    ['2. Each trade must have a unique Trade Reference.'],
    ['3. Buy/Sell must be "buy" or "sell".'],
    ['4. Period must be in the format "MMM-YY" (e.g., "Mar-24")'],
    ['5. Relationship Type must be one of: "FP", "DIFF", or "SPREAD".'],
    ['6. For "DIFF" or "SPREAD" relationships, provide Right Side Product and Quantity.'],
    ['7. Do not modify the headers or structure of the template.'],
    ['8. Save the file as Excel (.xlsx) before uploading.'],
  ];
  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
  XLSX.utils.book_append_sheet(wb, instructionsSheet, 'Instructions');
  
  // Add sheets for each template
  paperTradeTemplate.forEach(template => {
    const ws = createTemplateWorksheet(template);
    XLSX.utils.book_append_sheet(wb, ws, template.sheetName);
  });
  
  // Save the workbook as a file
  XLSX.writeFile(wb, 'paper_trade_template.xlsx');
}

// Parse formula string into tokens
function parseFormulaString(formulaStr: string): any {
  if (!formulaStr || formulaStr.trim() === '') {
    return null;
  }
  
  try {
    // Very simple parsing of formulas - this would need to be expanded
    // for a real implementation to handle complex formulas
    const tokens = [];
    const parts = formulaStr.trim().split(' ');
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      if (['Argus', 'Platts', 'ICE'].some(prefix => part.startsWith(prefix))) {
        // Instrument
        tokens.push({
          id: generateNodeId(),
          type: 'instrument',
          value: part
        });
      } else if (['+', '-', '*', '/'].includes(part)) {
        // Operator
        tokens.push({
          id: generateNodeId(),
          type: 'operator',
          value: part
        });
      } else if (part.endsWith('%')) {
        // Percentage
        const value = parseFloat(part.replace('%', ''));
        tokens.push({
          id: generateNodeId(),
          type: 'percentage',
          value: value.toString()
        });
      } else if (!isNaN(parseFloat(part))) {
        // Fixed value
        tokens.push({
          id: generateNodeId(),
          type: 'fixedValue',
          value: parseFloat(part).toString()
        });
      }
    }
    
    return {
      tokens,
      exposures: {}
    };
  } catch (error) {
    console.error('Error parsing formula:', error);
    return null;
  }
}

// Helper function to generate random IDs for formula tokens
function generateNodeId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Process the Excel file import
export async function processBulkTradeImport(file: File, importType: 'physical' | 'paper'): Promise<{
  success: boolean;
  errors?: { sheet: string; row: number; message: string }[];
  total?: number;
  imported?: number;
}> {
  const errors: { sheet: string; row: number; message: string }[] = [];
  let importedCount = 0;
  let totalCount = 0;
  
  try {
    // Read the Excel file
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    
    // Get the template based on the import type
    const template = importType === 'physical' ? physicalTradeTemplate : paperTradeTemplate;
    
    // Check if all required sheets exist
    const requiredSheets = template.filter(t => t.required).map(t => t.sheetName);
    const missingSheets = requiredSheets.filter(sheet => !workbook.SheetNames.includes(sheet));
    
    if (missingSheets.length > 0) {
      return {
        success: false,
        errors: [{
          sheet: 'File',
          row: 0,
          message: `Missing required sheets: ${missingSheets.join(', ')}`
        }]
      };
    }
    
    // Process each sheet according to the template
    const importData: Record<string, any[]> = {};
    
    for (const sheetTemplate of template) {
      // Parse the sheet to JSON
      const worksheet = workbook.Sheets[sheetTemplate.sheetName];
      if (!worksheet) {
        continue;
      }
      
      const sheetData = XLSX.utils.sheet_to_json(worksheet, { defval: null });
      
      // Skip the first two rows which are header and required marker
      const actualData = sheetData.slice(2);
      totalCount += actualData.length;
      
      // Validate and transform the data
      const validatedData: any[] = [];
      
      for (let i = 0; i < actualData.length; i++) {
        const row = actualData[i];
        const rowNumber = i + 4; // +4 because we start from row 4 (1-based, after headers)
        const validatedRow: Record<string, any> = {};
        
        // Check if all required fields are present
        let isValid = true;
        
        for (const col of sheetTemplate.columns) {
          const excelValue = row[col.excelHeader];
          
          // Check if required field is missing
          if (col.required && (excelValue === null || excelValue === undefined || excelValue === '')) {
            errors.push({
              sheet: sheetTemplate.sheetName,
              row: rowNumber,
              message: `Missing required field: ${col.excelHeader}`
            });
            isValid = false;
            continue;
          }
          
          // Skip if field is empty and not required
          if (excelValue === null || excelValue === undefined || excelValue === '') {
            continue;
          }
          
          // Transform and validate the value based on its type
          try {
            let transformedValue;
            
            switch (col.type) {
              case 'number':
                transformedValue = parseFloat(excelValue);
                if (isNaN(transformedValue)) {
                  throw new Error(`Not a valid number: ${excelValue}`);
                }
                break;
                
              case 'date':
                // Excel dates can come in various formats, we'll try to handle them
                if (typeof excelValue === 'number') {
                  // Excel serial date
                  transformedValue = new Date(Math.round((excelValue - 25569) * 86400 * 1000));
                } else {
                  // String date
                  transformedValue = new Date(excelValue);
                }
                
                if (isNaN(transformedValue.getTime())) {
                  throw new Error(`Not a valid date: ${excelValue}. Use YYYY-MM-DD format.`);
                }
                
                // Convert to YYYY-MM-DD format for storage
                transformedValue = formatDateForStorage(transformedValue);
                break;
                
              case 'boolean':
                transformedValue = Boolean(excelValue);
                break;
                
              case 'formula':
                transformedValue = parseFormulaString(excelValue);
                if (!transformedValue) {
                  transformedValue = null;
                }
                break;
                
              default:
                transformedValue = String(excelValue);
            }
            
            // Apply custom transformation if provided
            if (col.transform) {
              transformedValue = col.transform(transformedValue);
            }
            
            // Store the transformed value
            validatedRow[col.dbField] = transformedValue;
            
          } catch (error: any) {
            errors.push({
              sheet: sheetTemplate.sheetName,
              row: rowNumber,
              message: `Error in field ${col.excelHeader}: ${error.message}`
            });
            isValid = false;
          }
        }
        
        if (isValid) {
          // Add an ID for the row
          validatedRow.id = crypto.randomUUID();
          validatedData.push(validatedRow);
        }
      }
      
      importData[sheetTemplate.sheetName] = validatedData;
    }
    
    // If there are validation errors, return them before attempting to import
    if (errors.length > 0) {
      return {
        success: false,
        errors,
        total: totalCount,
        imported: 0
      };
    }
    
    // Create a map to store parent IDs for linking
    const parentIdMap: Record<string, string> = {};
    
    // Insert data into database
    for (const sheetTemplate of template) {
      const sheetData = importData[sheetTemplate.sheetName] || [];
      
      // Skip if no data
      if (sheetData.length === 0) {
        continue;
      }
      
      // Handle special case for parent tables
      if (!sheetTemplate.parentIdField) {
        // This is a parent table, insert the records
        for (const row of sheetData) {
          const { data, error } = await supabase
            .from(sheetTemplate.tableName)
            .insert(row)
            .select('id');
            
          if (error) {
            errors.push({
              sheet: sheetTemplate.sheetName,
              row: 0, // We don't know which row failed
              message: `Database error: ${error.message}`
            });
          } else {
            // Store the ID for reference by children
            const parentRef = row.trade_reference;
            if (parentRef && data && data[0] && data[0].id) {
              parentIdMap[parentRef] = data[0].id;
              importedCount++;
            }
          }
        }
      } else {
        // This is a child table, link to parent
        for (const row of sheetData) {
          // Get the parent reference and find the corresponding ID
          const parentRef = row._parent_reference;
          const parentId = parentIdMap[parentRef];
          
          if (!parentId) {
            errors.push({
              sheet: sheetTemplate.sheetName,
              row: 0, // We don't know which row failed
              message: `Cannot find parent trade with reference: ${parentRef}`
            });
            continue;
          }
          
          // Remove the temporary parent reference field
          delete row._parent_reference;
          
          // Add the parent ID
          row[sheetTemplate.parentIdField] = parentId;
          
          // Special handling for different trade types
          if (importType === 'physical') {
            // Handle physical trade leg
            // Calculate exposures from formula if present
            if (row.pricing_formula) {
              try {
                const buySell = row.buy_sell as BuySell;
                const quantity = parseFloat(row.quantity);
                const exposures = calculateExposures(
                  row.pricing_formula.tokens || [],
                  quantity,
                  buySell
                );
                row.pricing_formula.exposures = exposures;
              } catch (error) {
                console.error('Error calculating exposures:', error);
              }
            }
          } else {
            // Handle paper trade leg
            const relationshipType = row._relationship_type || 'FP';
            const rightSideProduct = row._right_side_product || null;
            const rightSideQuantity = row._right_side_quantity || 0;
            
            // Remove the temporary fields
            delete row._relationship_type;
            delete row._right_side_product;
            delete row._right_side_quantity;
            
            // Generate instrument name
            row.instrument = generateInstrumentName(
              mapProductToCanonical(row.product),
              relationshipType,
              rightSideProduct ? mapProductToCanonical(rightSideProduct) : undefined
            );
            
            // Create exposures object
            const exposures = {
              physical: {},
              paper: {},
              pricing: {}
            };
            
            const canonicalProduct = mapProductToCanonical(row.product);
            exposures.paper[canonicalProduct] = row.quantity || 0;
            exposures.pricing[canonicalProduct] = row.quantity || 0;
            
            if (relationshipType !== 'FP' && rightSideProduct) {
              const canonicalRightProduct = mapProductToCanonical(rightSideProduct);
              exposures.paper[canonicalRightProduct] = rightSideQuantity;
              exposures.pricing[canonicalRightProduct] = rightSideQuantity;
            }
            
            row.exposures = exposures;
            
            // Create mtm_formula with right side info if needed
            if (relationshipType !== 'FP' && rightSideProduct) {
              row.mtm_formula = {
                rightSide: {
                  product: mapProductToCanonical(rightSideProduct),
                  quantity: rightSideQuantity,
                  period: row.period || ''
                }
              };
            }
            
            // Extract period dates
            if (row.period) {
              try {
                const [month, year] = row.period.split('-');
                const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                  .findIndex(m => m === month);
                
                if (monthIndex !== -1) {
                  const fullYear = 2000 + parseInt(year);
                  
                  row.pricing_period_start = new Date(fullYear, monthIndex, 1).toISOString().split('T')[0];
                  
                  const lastDay = new Date(fullYear, monthIndex + 1, 0).getDate();
                  row.pricing_period_end = new Date(fullYear, monthIndex, lastDay).toISOString().split('T')[0];
                }
              } catch (e) {
                console.error('Error parsing period date:', e);
              }
            }
          }
          
          // Insert the record
          const { error } = await supabase
            .from(sheetTemplate.tableName)
            .insert(row);
            
          if (error) {
            errors.push({
              sheet: sheetTemplate.sheetName,
              row: 0, // We don't know which row failed
              message: `Database error: ${error.message}`
            });
          } else {
            importedCount++;
          }
        }
      }
    }
    
    // Return the result
    if (errors.length > 0) {
      return {
        success: false,
        errors,
        total: totalCount,
        imported: importedCount
      };
    }
    
    return {
      success: true,
      total: totalCount,
      imported: importedCount
    };
    
  } catch (error: any) {
    console.error('Import process error:', error);
    return {
      success: false,
      errors: [{
        sheet: 'General',
        row: 0,
        message: `Import process error: ${error.message}`
      }]
    };
  }
}
