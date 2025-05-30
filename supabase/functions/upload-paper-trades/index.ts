
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Configuration for backend processing
const PROCESSING_CONFIG = {
  CHUNK_SIZE: 2, // Process 2 trades at a time
  CHUNK_DELAY: 2000, // 2 second delay between chunks
  INDIVIDUAL_TIMEOUT: 30000, // 30 second timeout per trade
  MAX_RETRIES: 3,
  PROGRESS_UPDATE_INTERVAL: 1000 // Update progress every second
};

// Utility function to get month start and end dates from a period string (e.g., 'Dec-23')
const getMonthDates = (periodString: string): { startDate: Date; endDate: Date } | null => {
  try {
    const [month, year] = periodString.split('-');
    const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      .findIndex(m => m === month);
    
    if (monthIndex === -1) {
      console.error(`Invalid month format in period string: ${periodString}`);
      return null;
    }
    
    const fullYear = 2000 + parseInt(year);
    const startDate = new Date(fullYear, monthIndex, 1);
    const endDate = new Date(fullYear, monthIndex + 1, 0);
    
    return { startDate, endDate };
  } catch (error) {
    console.error(`Error parsing period string: ${periodString}`, error);
    return null;
  }
};

// Format date for database storage
const formatDateForDatabase = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      'https://btwnoflfuiucxzqfqvgk.supabase.co',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { parsedTrades } = await req.json();
    
    if (!parsedTrades || !Array.isArray(parsedTrades)) {
      throw new Error('Invalid parsed trades data');
    }

    console.log(`[BACKEND_UPLOAD] Starting upload job for ${parsedTrades.length} trades`);

    // Create upload job
    const { data: jobData, error: jobError } = await supabase
      .from('upload_jobs')
      .insert({
        job_type: 'paper_trades',
        status: 'processing',
        total_items: parsedTrades.length,
        processed_items: 0,
        failed_items: 0,
        metadata: { totalTrades: parsedTrades.length }
      })
      .select()
      .single();

    if (jobError) {
      throw new Error(`Failed to create upload job: ${jobError.message}`);
    }

    const jobId = jobData.id;
    console.log(`[BACKEND_UPLOAD] Created job ${jobId}`);

    // Store trade data in chunks
    const tradeDataInserts = parsedTrades.map(trade => ({
      job_id: jobId,
      trade_data: trade,
      processing_status: 'pending'
    }));

    const { error: dataError } = await supabase
      .from('upload_trade_data')
      .insert(tradeDataInserts);

    if (dataError) {
      throw new Error(`Failed to store trade data: ${dataError.message}`);
    }

    console.log(`[BACKEND_UPLOAD] Stored ${parsedTrades.length} trades for processing`);

    // Start background processing (don't await)
    processTradesInBackground(supabase, jobId, parsedTrades);

    return new Response(
      JSON.stringify({ 
        success: true, 
        jobId,
        message: `Upload job created for ${parsedTrades.length} trades`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('[BACKEND_UPLOAD] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

async function processTradesInBackground(supabase: any, jobId: string, parsedTrades: any[]) {
  let processedCount = 0;
  let failedCount = 0;
  const allFailures: any[] = [];

  try {
    console.log(`[BACKEND_PROCESSING] Starting background processing for job ${jobId}`);

    // Step 1: Validate and create brokers
    await updateJobProgress(supabase, jobId, 5, 'Validating brokers...', processedCount);
    
    const brokerErrors = await validateAndCreateBrokers(supabase, parsedTrades);
    if (brokerErrors.length > 0) {
      throw new Error(`Broker validation failed: ${brokerErrors.join(', ')}`);
    }

    // Step 2: Process trades in chunks
    const chunks: any[][] = [];
    for (let i = 0; i < parsedTrades.length; i += PROCESSING_CONFIG.CHUNK_SIZE) {
      chunks.push(parsedTrades.slice(i, i + PROCESSING_CONFIG.CHUNK_SIZE));
    }

    console.log(`[BACKEND_PROCESSING] Processing ${chunks.length} chunks`);

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];
      const progress = 5 + ((chunkIndex / chunks.length) * 90); // 5-95% for processing
      
      await updateJobProgress(
        supabase, 
        jobId, 
        progress, 
        `Processing batch ${chunkIndex + 1} of ${chunks.length}...`,
        processedCount
      );

      try {
        const { successes, failures } = await processTradeChunk(supabase, chunk);
        processedCount += successes;
        failedCount += failures.length;
        allFailures.push(...failures);

        console.log(`[BACKEND_PROCESSING] Chunk ${chunkIndex + 1}: ${successes} successes, ${failures.length} failures`);

        // Update progress after each chunk
        await updateJobProgress(supabase, jobId, progress, 
          `Processed batch ${chunkIndex + 1}/${chunks.length}`, processedCount);

        // Delay between chunks (except last one)
        if (chunkIndex < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, PROCESSING_CONFIG.CHUNK_DELAY));
        }

      } catch (error) {
        console.error(`[BACKEND_PROCESSING] Chunk ${chunkIndex + 1} failed:`, error);
        failedCount += chunk.length;
        chunk.forEach(trade => {
          allFailures.push({
            trade: trade.tradeReference || `Group ${trade.groupIndex + 1}`,
            error: error.message
          });
        });
      }
    }

    // Step 3: Complete the job
    const finalStatus = failedCount === 0 ? 'completed' : 'completed_with_errors';
    await supabase
      .from('upload_jobs')
      .update({
        status: finalStatus,
        progress_percentage: 100,
        processed_items: processedCount,
        failed_items: failedCount,
        completed_at: new Date().toISOString(),
        metadata: {
          totalTrades: parsedTrades.length,
          successfulTrades: processedCount,
          failedTrades: failedCount,
          failures: allFailures.slice(0, 10) // Store first 10 failures
        }
      })
      .eq('id', jobId);

    console.log(`[BACKEND_PROCESSING] Job ${jobId} completed: ${processedCount} successes, ${failedCount} failures`);

  } catch (error) {
    console.error(`[BACKEND_PROCESSING] Job ${jobId} failed:`, error);
    await supabase
      .from('upload_jobs')
      .update({
        status: 'failed',
        error_message: error.message,
        failed_items: parsedTrades.length - processedCount
      })
      .eq('id', jobId);
  }
}

async function updateJobProgress(supabase: any, jobId: string, percentage: number, status: string, processedItems: number) {
  await supabase
    .from('upload_jobs')
    .update({
      progress_percentage: Math.round(percentage),
      processed_items: processedItems,
      metadata: { currentStatus: status }
    })
    .eq('id', jobId);
}

async function validateAndCreateBrokers(supabase: any, trades: any[]): Promise<string[]> {
  const errors: string[] = [];
  const uniqueBrokers = [...new Set(trades.map(trade => trade.broker))];
  
  for (const brokerName of uniqueBrokers) {
    if (!brokerName || brokerName.trim() === '') {
      errors.push('Empty broker name found');
      continue;
    }

    try {
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
        const { error: createError } = await supabase
          .from('brokers')
          .insert({ name: brokerName, is_active: true });
          
        if (createError) {
          throw new Error(`Failed to create broker: ${createError.message}`);
        }
        console.log(`[BROKER_CREATE] Created broker: ${brokerName}`);
      }
    } catch (error: any) {
      errors.push(`Failed to create/validate broker "${brokerName}": ${error.message}`);
    }
  }

  return errors;
}

async function processTradeChunk(supabase: any, chunk: any[]): Promise<{ successes: number; failures: any[] }> {
  let successes = 0;
  const failures: any[] = [];

  for (const trade of chunk) {
    try {
      const transformedTrade = transformParsedTradeForDatabase(trade);
      
      // Create paper trade
      const { data: paperTrade, error: tradeError } = await supabase
        .from('paper_trades')
        .insert({
          trade_reference: transformedTrade.tradeReference,
          broker: transformedTrade.broker,
          counterparty: transformedTrade.counterparty
        })
        .select()
        .single();

      if (tradeError) {
        throw new Error(`Failed to create paper trade: ${tradeError.message}`);
      }

      // Create legs
      const legInserts = transformedTrade.legs.map(leg => ({
        paper_trade_id: paperTrade.id,
        leg_reference: leg.legReference,
        buy_sell: leg.buySell,
        product: leg.product,
        quantity: leg.quantity,
        period: leg.period,
        price: leg.price,
        broker: leg.broker,
        instrument: leg.instrument,
        exposures: leg.exposures,
        execution_trade_date: leg.executionTradeDate,
        relationship_type: leg.relationshipType,
        right_side: leg.rightSide,
        // Add the missing display fields
        trading_period: leg.period,
        pricing_period_start: leg.pricingPeriodStart,
        pricing_period_end: leg.pricingPeriodEnd,
        formula: leg.formula,
        mtm_formula: leg.mtmFormula
      }));

      const { error: legsError } = await supabase
        .from('paper_trade_legs')
        .insert(legInserts);

      if (legsError) {
        throw new Error(`Failed to create trade legs: ${legsError.message}`);
      }

      successes++;
      console.log(`[TRADE_PROCESSING] Successfully created trade: ${transformedTrade.tradeReference}`);

    } catch (error: any) {
      failures.push({
        trade: trade.tradeReference || `Group ${trade.groupIndex + 1}`,
        error: error.message
      });
      console.error(`[TRADE_PROCESSING] Failed to create trade:`, error);
    }

    // Small delay between individual trades
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return { successes, failures };
}

function transformParsedTradeForDatabase(parsedTrade: any): any {
  return {
    tradeReference: parsedTrade.tradeReference,
    broker: parsedTrade.broker,
    counterparty: 'Paper Trade Counterparty',
    legs: parsedTrade.legs.map(leg => {
      // Get period dates for pricing period calculation
      let pricingPeriodStart = null;
      let pricingPeriodEnd = null;
      
      if (leg.period) {
        const monthDates = getMonthDates(leg.period);
        if (monthDates) {
          pricingPeriodStart = formatDateForDatabase(monthDates.startDate);
          pricingPeriodEnd = formatDateForDatabase(monthDates.endDate);
        }
      }

      // Build formula and mtmFormula to match manual trade format
      let formula = null;
      let mtmFormula = null;
      
      if (leg.relationshipType === 'DIFF' || leg.relationshipType === 'SPREAD') {
        // Create formula structure that matches manual trades exactly
        formula = {
          tokens: [],
          exposures: {
            pricing: {
              "Argus HVO": 0,
              "Argus RME": 0,
              "Argus FAME0": 0,
              "Argus UCOME": 0,
              "Platts LSGO": 0,
              "Platts Diesel": 0,
              "ICE GASOIL FUTURES": 0,
              "ICE GASOIL FUTURES (EFP)": 0
            },
            physical: {
              "Argus HVO": 0,
              "Argus RME": 0,
              "Argus FAME0": 0,
              "Argus UCOME": 0,
              "Platts LSGO": 0,
              "Platts Diesel": 0,
              "ICE GASOIL FUTURES": 0,
              "ICE GASOIL FUTURES (EFP)": 0
            }
          }
        };
        
        // Create MTM formula structure with relationship data and name field
        mtmFormula = {
          type: leg.relationshipType.toLowerCase(),
          leftSide: {
            product: leg.product,
            quantity: leg.quantity
          },
          rightSide: leg.rightSide,
          exposures: leg.exposures,
          // Add the critical name field that manual trades use for display
          name: `${leg.product} ${leg.relationshipType}`
        };
      }

      return {
        legReference: leg.legReference,
        buySell: leg.buySell.toLowerCase(),
        product: leg.product,
        quantity: leg.quantity,
        period: leg.period,
        price: leg.price,
        broker: leg.broker,
        instrument: leg.instrument,
        exposures: leg.exposures,
        executionTradeDate: leg.executionTradeDate,
        relationshipType: leg.relationshipType || 'FP',
        rightSide: leg.rightSide || null,
        // Add the missing display fields
        pricingPeriodStart,
        pricingPeriodEnd,
        formula,
        mtmFormula
      };
    })
  };
}
