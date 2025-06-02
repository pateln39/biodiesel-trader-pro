
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as XLSX from 'https://deno.land/x/sheetjs@v0.18.3/xlsx.mjs'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
}

// Generate trade reference
const generateTradeReference = (): string => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PT-${timestamp.slice(-6)}-${random}`;
};

// Generate leg reference
const generateLegReference = (tradeReference: string, legIndex: number): string => {
  return `${tradeReference}-${String(legIndex + 1).padStart(2, '0')}`;
};

// Parse Excel date
const parseExcelDate = (dateValue: any): Date => {
  if (typeof dateValue === 'number') {
    const excelEpoch = new Date(1900, 0, 1);
    const msPerDay = 24 * 60 * 60 * 1000;
    let adjustedSerial = dateValue;
    
    if (dateValue > 59) {
      adjustedSerial = dateValue - 1;
    }
    
    const date = new Date(excelEpoch.getTime() + (adjustedSerial - 1) * msPerDay);
    
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid Excel date serial number: ${dateValue}`);
    }
    
    return date;
  } else if (dateValue instanceof Date) {
    if (isNaN(dateValue.getTime())) {
      throw new Error(`Invalid Date object: ${dateValue}`);
    }
    return dateValue;
  } else if (typeof dateValue === 'string') {
    const cleanedValue = dateValue.trim().replace(/[\/\.]/g, '-');
    const parts = cleanedValue.split('-');
    
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      let year = parseInt(parts[2], 10);
      
      if (isNaN(day) || isNaN(month) || isNaN(year)) {
        throw new Error(`Invalid date components`);
      }
      
      if (year < 100) {
        year = 2000 + year;
      }
      
      if (month < 1 || month > 12 || day < 1 || day > 31) {
        throw new Error(`Invalid date range`);
      }
      
      const date = new Date(year, month - 1, day);
      
      if (date.getFullYear() !== year || date.getMonth() !== (month - 1) || date.getDate() !== day) {
        throw new Error(`Invalid date: ${day}/${month}/${year}`);
      }
      
      return date;
    } else {
      throw new Error(`Invalid date format: "${dateValue}"`);
    }
  }
  throw new Error(`Invalid date type: ${typeof dateValue}`);
};

// Convert date range to period format
const convertDateRangeToPeriod = (startDateValue: any, endDateValue: any): string => {
  const start = parseExcelDate(startDateValue);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[start.getMonth()];
  const year = start.getFullYear().toString().slice(-2);
  return `${month}-${year}`;
};

// Format date for database
const formatDateForDatabase = (dateValue: any): string | null => {
  if (!dateValue) return null;
  
  if (typeof dateValue === 'string' && !dateValue.trim()) return null;
  
  try {
    const date = parseExcelDate(dateValue);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error(`Failed to format date for database:`, { dateValue, error });
    return null;
  }
};

// Build exposures object
const buildExposuresObject = (leg: any): any => {
  const buySellMultiplier = leg.buySell === 'buy' ? 1 : -1;
  const leftQuantity = leg.quantity * buySellMultiplier;
  
  const exposures = {
    physical: {},
    paper: { [leg.product]: leftQuantity },
    pricing: { [leg.product]: leftQuantity }
  };
  
  if ((leg.relationshipType === 'DIFF' || leg.relationshipType === 'SPREAD') && leg.rightSide) {
    const rightQuantity = leg.rightSide.quantity * buySellMultiplier;
    exposures.paper[leg.rightSide.product] = rightQuantity;
    exposures.pricing[leg.rightSide.product] = rightQuantity;
  }
  
  return exposures;
};

// Validate leg data
const validateLeg = (leg: any, rowIndex: number): string[] => {
  const errors: string[] = [];
  
  if (!leg.broker?.trim()) errors.push('Broker is required');
  
  const buySellValue = leg.buySell?.toString().trim().toUpperCase();
  if (!buySellValue || !['BUY', 'SELL'].includes(buySellValue)) {
    errors.push(`Buy/Sell must be BUY or SELL (found: "${leg.buySell}")`);
  }
  
  if (!leg.product?.trim()) errors.push('Product is required');
  
  if (leg.quantity === undefined || leg.quantity === null || isNaN(Number(leg.quantity))) {
    errors.push(`Quantity must be a valid number (found: "${leg.quantity}")`);
  }
  
  if (!leg.periodStart) errors.push('Period Start is required');
  if (!leg.periodEnd) errors.push('Period End is required');
  
  if (leg.price === undefined || leg.price === null || isNaN(Number(leg.price))) {
    errors.push(`Price must be a valid number (found: "${leg.price}")`);
  }
  
  if (!leg.relationshipType || !['FP', 'DIFF', 'SPREAD'].includes(leg.relationshipType)) {
    errors.push(`Relationship Type must be FP, DIFF, or SPREAD (found: "${leg.relationshipType}")`);
  }
  
  if (['DIFF', 'SPREAD'].includes(leg.relationshipType)) {
    if (!leg.rightSideProduct?.trim()) {
      errors.push('Right Side Product is required for DIFF/SPREAD');
    }
  }
  
  return errors;
};

// Ensure broker exists
const ensureBrokerExists = async (supabase: any, brokerName: string): Promise<void> => {
  console.log('[BROKER_CHECK] Checking broker:', brokerName);
  
  const { data: existingBroker, error: checkError } = await supabase
    .from('brokers')
    .select('id')
    .eq('name', brokerName)
    .eq('is_active', true)
    .single();
    
  if (checkError && checkError.code !== 'PGRST116') {
    throw new Error(`Failed to check broker: ${checkError.message}`);
  }
    
  if (!existingBroker) {
    console.log('[BROKER_CREATE] Creating new broker:', brokerName);
    const { error: createError } = await supabase
      .from('brokers')
      .insert({ name: brokerName, is_active: true });
      
    if (createError) {
      throw new Error(`Failed to create broker: ${createError.message}`);
    }
    console.log('[BROKER_CREATE] Successfully created broker:', brokerName);
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[UPLOAD] Starting paper trade upload process');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { fileData } = await req.json();
    
    if (!fileData) {
      throw new Error('No file data provided');
    }

    // Decode base64 file data
    const binaryData = Uint8Array.from(atob(fileData), c => c.charCodeAt(0));
    const workbook = XLSX.read(binaryData, { type: 'array' });
    
    if (!workbook.SheetNames.length) {
      throw new Error('No sheets found in Excel file');
    }
    
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    const trades: any[] = [];
    const errors: any[] = [];
    let currentGroup: any[] = [];
    let groupIndex = 0;
    
    console.log('[UPLOAD] Parsing Excel data, found', jsonData.length, 'rows');
    
    // Parse Excel data into trade groups
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i] as any[];
      
      // Check for group separator (empty row)
      const isGroupSeparator = row.length === 0 || row.every(cell => !cell);
      
      if (isGroupSeparator && currentGroup.length > 0) {
        await processTradeGroup(currentGroup, groupIndex, trades, errors);
        currentGroup = [];
        groupIndex++;
        continue;
      }
      
      if (row.length === 0 || row.every(cell => !cell)) {
        continue;
      }
      
      const legData = {
        broker: row[COLUMNS.BROKER] ? row[COLUMNS.BROKER].toString().trim() : '',
        buySell: row[COLUMNS.BUY_SELL] ? row[COLUMNS.BUY_SELL].toString().trim().toUpperCase() : '',
        product: row[COLUMNS.PRODUCT] ? row[COLUMNS.PRODUCT].toString().trim() : '',
        quantity: row[COLUMNS.QUANTITY] ?? 0,
        periodStart: row[COLUMNS.PERIOD_START],
        periodEnd: row[COLUMNS.PERIOD_END],
        price: row[COLUMNS.PRICE] ?? 0,
        relationshipType: row[COLUMNS.RELATIONSHIP_TYPE] ? row[COLUMNS.RELATIONSHIP_TYPE].toString().trim() : 'FP',
        rightSideProduct: row[COLUMNS.RIGHT_SIDE_PRODUCT] ? row[COLUMNS.RIGHT_SIDE_PRODUCT].toString().trim() : '',
        rightSideQuantity: row[COLUMNS.RIGHT_SIDE_QUANTITY] ?? 0,
        rightSidePrice: row[COLUMNS.RIGHT_SIDE_PRICE] ?? 0,
        executionTradeDate: row[COLUMNS.EXECUTION_TRADE_DATE],
        rowIndex: i + 1
      };
      
      currentGroup.push(legData);
    }
    
    // Process the last group
    if (currentGroup.length > 0) {
      await processTradeGroup(currentGroup, groupIndex, trades, errors);
    }
    
    console.log('[UPLOAD] Parsed', trades.length, 'trade groups with', errors.length, 'validation errors');
    
    if (errors.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        errors,
        message: 'Validation errors found'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }
    
    // Process trades in background
    const processingPromise = processTrades(supabase, trades);
    
    // Use EdgeRuntime.waitUntil for background processing
    if ('EdgeRuntime' in globalThis) {
      (globalThis as any).EdgeRuntime.waitUntil(processingPromise);
    }
    
    // Return immediate response
    return new Response(JSON.stringify({
      success: true,
      message: 'Upload started',
      tradeCount: trades.length,
      totalLegs: trades.reduce((acc, trade) => acc + trade.legs.length, 0)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

    async function processTradeGroup(
      group: any[], 
      groupIndex: number, 
      trades: any[], 
      errors: any[]
    ) {
      if (group.length === 0) return;
      
      const broker = group[0].broker;
      const tradeReference = generateTradeReference();
      const legs: any[] = [];
      
      // Validate all legs in group
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
          const period = convertDateRangeToPeriod(legData.periodStart, legData.periodEnd);
          
          const leg = {
            id: crypto.randomUUID(),
            legReference: generateLegReference(tradeReference, i),
            buySell: legData.buySell.toLowerCase(),
            product: legData.product,
            quantity: Number(legData.quantity),
            period: period,
            price: Number(legData.price),
            broker: broker,
            instrument: legData.product,
            relationshipType: legData.relationshipType,
            executionTradeDate: legData.executionTradeDate ? 
              formatDateForDatabase(legData.executionTradeDate) : null
          };
          
          // Add right side for DIFF/SPREAD
          if (['DIFF', 'SPREAD'].includes(legData.relationshipType) && legData.rightSideProduct) {
            leg.rightSide = {
              product: legData.rightSideProduct,
              quantity: -Number(legData.quantity),
              period: period,
              price: Number(legData.rightSidePrice) || 0
            };
          }
          
          // Calculate exposures
          leg.exposures = buildExposuresObject(leg);
          
          legs.push(leg);
        } catch (error) {
          console.error('[TRADE_PROCESSING] Error processing leg:', error);
          errors.push({
            row: legData.rowIndex,
            errors: [error.message]
          });
        }
      }
      
      if (legs.length > 0) {
        trades.push({
          groupIndex,
          broker,
          tradeReference,
          tradeType: 'paper',
          legs
        });
      }
    }

    async function processTrades(supabase: any, trades: any[]) {
      console.log('[UPLOAD] Starting background processing of', trades.length, 'trades');
      
      let successCount = 0;
      let failureCount = 0;
      const failedTrades: string[] = [];
      
      try {
        // Validate and create brokers first
        const uniqueBrokers = [...new Set(trades.map(trade => trade.broker))];
        for (const broker of uniqueBrokers) {
          await ensureBrokerExists(supabase, broker);
        }
        
        // Process trades in batches of 5
        const batchSize = 5;
        for (let i = 0; i < trades.length; i += batchSize) {
          const batch = trades.slice(i, i + batchSize);
          
          for (const trade of batch) {
            try {
              // Create parent trade
              const { data: paperTrade, error: paperTradeError } = await supabase
                .from('paper_trades')
                .insert({
                  trade_reference: trade.tradeReference,
                  counterparty: 'Paper Trade Counterparty',
                  broker: trade.broker
                })
                .select('id')
                .single();
                
              if (paperTradeError) {
                throw new Error(`Error creating paper trade: ${paperTradeError.message}`);
              }
              
              // Create trade legs
              for (const leg of trade.legs) {
                const legData = {
                  leg_reference: leg.legReference,
                  paper_trade_id: paperTrade.id,
                  buy_sell: leg.buySell,
                  product: leg.product,
                  quantity: leg.quantity,
                  price: leg.price,
                  broker: leg.broker,
                  period: leg.period,
                  trading_period: leg.period,
                  instrument: leg.instrument,
                  exposures: leg.exposures,
                  execution_trade_date: leg.executionTradeDate
                };
                
                if (leg.rightSide) {
                  legData.mtm_formula = {
                    rightSide: leg.rightSide
                  };
                }
                
                const { error: legError } = await supabase
                  .from('paper_trade_legs')
                  .insert(legData);
                  
                if (legError) {
                  throw new Error(`Error creating trade leg: ${legError.message}`);
                }
              }
              
              successCount++;
              console.log('[UPLOAD] Successfully processed trade:', trade.tradeReference);
            } catch (error) {
              failureCount++;
              console.error('[UPLOAD] Failed to process trade:', trade.tradeReference, error);
              failedTrades.push(`${trade.tradeReference}: ${error.message}`);
            }
          }
          
          // Small delay between batches to prevent overwhelming the database
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log('[UPLOAD] Background processing complete. Success:', successCount, 'Failed:', failureCount);
      } catch (error) {
        console.error('[UPLOAD] Background processing failed:', error);
      }
    }
    
  } catch (error) {
    console.error('[UPLOAD] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

async function processTradeGroup(
  group: any[], 
  groupIndex: number, 
  trades: any[], 
  errors: any[]
) {
  // This function is defined inside the serve function above
}

async function processTrades(supabase: any, trades: any[]) {
  // This function is defined inside the serve function above
}
