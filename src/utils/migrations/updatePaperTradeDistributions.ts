
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getMonthDates } from '@/utils/paperTrade';
import { countBusinessDays } from '@/utils/dateUtils';
import { mapProductToCanonical } from '@/utils/productMapping';

/**
 * Calculates daily distribution for a paper trade
 */
const calculateDailyDistribution = (
  period: string,
  product: string,
  quantity: number,
  buySell: string
): Record<string, Record<string, number>> => {
  const monthDates = getMonthDates(period);
  if (!monthDates) {
    return {};
  }
  
  const { startDate, endDate } = monthDates;
  const businessDaysInMonth = countBusinessDays(startDate, endDate);
  
  if (businessDaysInMonth === 0) {
    return {};
  }
  
  const dailyDistribution: Record<string, Record<string, number>> = {};
  const buySellMultiplier = buySell === 'buy' ? 1 : -1;
  const exposureValue = quantity * buySellMultiplier;
  const dailyExposure = exposureValue / businessDaysInMonth;
  
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) { // Not weekend
      const dateStr = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      if (!dailyDistribution[product]) {
        dailyDistribution[product] = {};
      }
      
      dailyDistribution[product][dateStr] = dailyExposure;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dailyDistribution;
};

/**
 * Updates existing paper trades with paperDailyDistribution
 */
export const updatePaperTradeDistributions = async (): Promise<void> => {
  try {
    // Fetch all paper trade legs
    const { data: legs, error } = await supabase
      .from('paper_trade_legs')
      .select('*');
      
    if (error) {
      toast.error('Failed to fetch paper trades', {
        description: error.message
      });
      return;
    }
    
    if (!legs || legs.length === 0) {
      toast.info('No paper trades to update');
      return;
    }
    
    console.log(`Found ${legs.length} paper trade legs to update`);
    let successCount = 0;
    let errorCount = 0;
    
    for (const leg of legs) {
      try {
        if (!leg.period) {
          console.warn(`Skipping leg ${leg.leg_reference} without period`);
          continue;
        }
        
        // Get or initialize exposures object
        let exposures = leg.exposures || { 
          physical: {}, 
          paper: {}, 
          pricing: {} 
        };
        
        // Skip if already has paperDailyDistribution
        if (exposures.paperDailyDistribution && 
            Object.keys(exposures.paperDailyDistribution).length > 0) {
          continue;
        }
        
        const paperDailyDistribution = {};
        const pricingDailyDistribution = {};
        
        // Process based on the relationship type and exposures
        if (exposures.paper && Object.keys(exposures.paper).length > 0) {
          for (const [product, quantity] of Object.entries(exposures.paper)) {
            const canonicalProduct = mapProductToCanonical(product);
            const distribution = calculateDailyDistribution(leg.period, canonicalProduct, quantity as number, leg.buy_sell);
            Object.assign(paperDailyDistribution, distribution);
          }
        }
        
        if (exposures.pricing && Object.keys(exposures.pricing).length > 0) {
          for (const [product, quantity] of Object.entries(exposures.pricing)) {
            const canonicalProduct = mapProductToCanonical(product);
            const distribution = calculateDailyDistribution(leg.period, canonicalProduct, quantity as number, leg.buy_sell);
            Object.assign(pricingDailyDistribution, distribution);
          }
        }
        
        // If no existing exposures, try to use the product and quantity directly
        if (Object.keys(paperDailyDistribution).length === 0 && leg.product && leg.quantity) {
          const canonicalProduct = mapProductToCanonical(leg.product);
          const distribution = calculateDailyDistribution(
            leg.period, 
            canonicalProduct, 
            leg.quantity, 
            leg.buy_sell
          );
          Object.assign(paperDailyDistribution, distribution);
          Object.assign(pricingDailyDistribution, distribution);
          
          // Also update the paper and pricing exposures
          if (!exposures.paper) exposures.paper = {};
          if (!exposures.pricing) exposures.pricing = {};
          
          exposures.paper[canonicalProduct] = leg.buy_sell === 'buy' ? leg.quantity : -leg.quantity;
          exposures.pricing[canonicalProduct] = leg.buy_sell === 'buy' ? leg.quantity : -leg.quantity;
        }
        
        // Update the exposures object with daily distributions
        exposures.paperDailyDistribution = paperDailyDistribution;
        exposures.pricingDailyDistribution = pricingDailyDistribution;
        
        // Update the database
        const { error: updateError } = await supabase
          .from('paper_trade_legs')
          .update({ exposures })
          .eq('id', leg.id);
          
        if (updateError) {
          console.error(`Error updating leg ${leg.leg_reference}:`, updateError);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (err) {
        console.error(`Error processing leg ${leg.leg_reference}:`, err);
        errorCount++;
      }
    }
    
    if (errorCount > 0) {
      toast.warning(`Updated ${successCount} paper trades, failed to update ${errorCount}`, {
        description: "Check console for details"
      });
    } else {
      toast.success(`Updated ${successCount} paper trades with daily distribution`);
    }
  } catch (error: any) {
    toast.error('Failed to update paper trades', {
      description: error.message
    });
    console.error('Error updating paper trades:', error);
  }
};
