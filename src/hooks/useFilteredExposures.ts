
import { useState, useEffect, useMemo } from 'react';
import { useTrades } from './useTrades';
import { Instrument } from '@/types/common';
import { MonthlyDistribution, ExposureResult } from '@/types/pricing';
import { 
  calculateDailyDistributionByInstrument,
  filterDailyDistributionsByDateRange,
  calculateTotalExposureFromDailyDistributions,
  clearDailyDistributionCache,
  isDateWithinPricingPeriod
} from '@/utils/exposureUtils';
import { getMonthlyDistribution, distributeQuantityByWorkingDays } from '@/utils/workingDaysUtils';
import { startOfMonth, endOfMonth } from 'date-fns';
import { PhysicalTrade } from '@/types/physical';

interface UseFilteredExposuresProps {
  startDate?: Date;
  endDate?: Date;
}

interface FilteredExposureResult {
  physical: Record<Instrument, number>;
  pricing: Record<Instrument, number>;
}

export function useFilteredExposures({ 
  startDate: initialStartDate, 
  endDate: initialEndDate 
}: UseFilteredExposuresProps = {}) {
  const { trades, loading: tradesLoading, error: tradesError, refetchTrades } = useTrades();
  
  const currentDate = new Date();
  const defaultStartDate = initialStartDate || startOfMonth(currentDate);
  const defaultEndDate = initialEndDate || endOfMonth(currentDate);
  
  const [startDate, setStartDate] = useState<Date>(defaultStartDate);
  const [endDate, setEndDate] = useState<Date>(defaultEndDate);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  
  // Create a filtered version of the exposure data
  const filteredExposures = useMemo(() => {
    if (tradesLoading || !trades || trades.length === 0) {
      console.log("No trades to calculate exposures from");
      return { physical: {}, pricing: {} } as FilteredExposureResult;
    }
    
    setIsCalculating(true);
    console.log('Calculating filtered exposures with date range:', startDate, endDate);
    
    try {
      // Collect monthly distributions from all physical trades
      const physicalDistributions: Record<Instrument, MonthlyDistribution> = {};
      const pricingDistributions: Record<Instrument, MonthlyDistribution> = {};
      
      // Store pricing periods for each instrument
      const physicalPricingPeriods: Record<Instrument, { start: Date, end: Date }> = {};
      const pricingPricingPeriods: Record<Instrument, { start: Date, end: Date }> = {};
      
      // Process physical trades only
      const physicalTrades = trades.filter(trade => trade.tradeType === 'physical') as PhysicalTrade[];
      console.log(`Found ${physicalTrades.length} physical trades`);
      
      // Track how many trades and legs are processed
      let processedTrades = 0;
      let processedLegs = 0;
      let processedPhysicalExposures = 0;
      let processedPricingExposures = 0;
      
      // Process trades that have valid pricing periods
      physicalTrades.forEach(trade => {
        let tradeHasValidLeg = false;
        
        // Process legs to collect monthly distributions
        trade.legs.forEach(leg => {
          // Check for required formula properties
          if (!leg.formula || !leg.mtmFormula) {
            console.log(`Skipping leg with missing formulas: ${leg.legReference}`);
            return;
          }
          
          // Check if leg has pricing period dates
          if (!leg.pricingPeriodStart || !leg.pricingPeriodEnd) {
            console.log(`Skipping leg ${leg.legReference} - missing pricing period dates`);
            return;
          }
          
          processedLegs++;
          tradeHasValidLeg = true;

          // PHYSICAL EXPOSURES - Get from mtmFormula
          if (leg.mtmFormula && leg.mtmFormula.exposures && leg.mtmFormula.exposures.physical) {
            console.log(`Processing physical exposures from mtmFormula for leg ${leg.legReference}`);
            
            // Get explicit monthly distribution if available
            const physicalMonthlyDist = getMonthlyDistribution(
              leg.mtmFormula.exposures, 
              'physical'
            );
            
            // Check if we got any monthly distributions from the formula
            const hasExplicitMonthlyDistribution = 
              physicalMonthlyDist && 
              Object.keys(physicalMonthlyDist).length > 0;
            
            if (hasExplicitMonthlyDistribution) {
              console.log(`Found explicit monthly distribution for physical:`, physicalMonthlyDist);
              
              // Process each instrument's monthly distribution
              Object.entries(physicalMonthlyDist).forEach(([instrument, distribution]) => {
                if (!physicalDistributions[instrument]) {
                  physicalDistributions[instrument] = {};
                }
                
                // Store pricing period for this instrument
                physicalPricingPeriods[instrument] = {
                  start: leg.pricingPeriodStart!,
                  end: leg.pricingPeriodEnd!
                };
                
                // Add monthly values to our accumulated distributions
                Object.entries(distribution).forEach(([monthCode, monthValue]) => {
                  if (!physicalDistributions[instrument][monthCode]) {
                    physicalDistributions[instrument][monthCode] = 0;
                  }
                  physicalDistributions[instrument][monthCode] += monthValue;
                  processedPhysicalExposures++;
                });
              });
            } else {
              console.log(`No explicit monthly distribution for physical, re-calculating based on loading period start`);
              
              // Instead of prorating, we need to calculate and use loading period start month
              Object.entries(leg.mtmFormula.exposures.physical).forEach(([instrument, value]) => {
                if (!physicalDistributions[instrument]) {
                  physicalDistributions[instrument] = {};
                }
                
                // Store pricing period for this instrument for use with daily distribution
                physicalPricingPeriods[instrument] = {
                  start: leg.pricingPeriodStart!,
                  end: leg.pricingPeriodEnd!
                };
                
                // For physical exposure, use the loading period start date to determine the month
                if (leg.loadingPeriodStart) {
                  const loadingStartMonth = new Date(leg.loadingPeriodStart);
                  const monthName = loadingStartMonth.toLocaleString('en-US', { month: 'short' });
                  const year = loadingStartMonth.getFullYear().toString().slice(-2);
                  const monthCode = `${monthName}-${year}`;
                  
                  console.log(`Assigning physical exposure for ${instrument} to loading month ${monthCode}: ${value}`);
                  
                  // Put 100% of the exposure in the loading month
                  if (!physicalDistributions[instrument][monthCode]) {
                    physicalDistributions[instrument][monthCode] = 0;
                  }
                  
                  physicalDistributions[instrument][monthCode] += value as number;
                  processedPhysicalExposures++;
                } else {
                  console.log(`No loading period start date for leg ${leg.legReference}, using pricing period for physical exposure`);
                  
                  // Fallback to pricing period as before if no loading period start
                  const evenDistribution = distributeQuantityByWorkingDays(
                    leg.pricingPeriodStart!,
                    leg.pricingPeriodEnd!,
                    value as number
                  );
                  
                  // Add generated monthly values to our accumulated distributions
                  Object.entries(evenDistribution).forEach(([monthCode, monthValue]) => {
                    if (!physicalDistributions[instrument][monthCode]) {
                      physicalDistributions[instrument][monthCode] = 0;
                    }
                    physicalDistributions[instrument][monthCode] += monthValue;
                    processedPhysicalExposures++;
                  });
                }
              });
            }
          }
          
          // PRICING EXPOSURES - Get from regular formula - NO CHANGES NEEDED
          if (leg.formula && leg.formula.exposures && leg.formula.exposures.pricing) {
            console.log(`Processing pricing exposures from formula for leg ${leg.legReference}`);
            
            // Get explicit monthly distribution if available
            const pricingMonthlyDist = getMonthlyDistribution(
              leg.formula.exposures, 
              'pricing'
            );
            
            // Check if we got any monthly distributions from the formula
            const hasExplicitMonthlyDistribution = 
              pricingMonthlyDist && 
              Object.keys(pricingMonthlyDist).length > 0;
            
            if (hasExplicitMonthlyDistribution) {
              console.log(`Found explicit monthly distribution for pricing:`, pricingMonthlyDist);
              
              // Process each instrument's monthly distribution
              Object.entries(pricingMonthlyDist).forEach(([instrument, distribution]) => {
                if (!pricingDistributions[instrument]) {
                  pricingDistributions[instrument] = {};
                }
                
                // Store pricing period for this instrument
                pricingPricingPeriods[instrument] = {
                  start: leg.pricingPeriodStart!,
                  end: leg.pricingPeriodEnd!
                };
                
                // Add monthly values to our accumulated distributions
                Object.entries(distribution).forEach(([monthCode, monthValue]) => {
                  if (!pricingDistributions[instrument][monthCode]) {
                    pricingDistributions[instrument][monthCode] = 0;
                  }
                  pricingDistributions[instrument][monthCode] += monthValue;
                  processedPricingExposures++;
                });
              });
            } else {
              console.log(`No explicit monthly distribution for pricing, creating one based on pricing period`);
              
              // Create even distribution based on the pricing period for each instrument
              Object.entries(leg.formula.exposures.pricing).forEach(([instrument, value]) => {
                if (!pricingDistributions[instrument]) {
                  pricingDistributions[instrument] = {};
                }
                
                // Store pricing period for this instrument
                pricingPricingPeriods[instrument] = {
                  start: leg.pricingPeriodStart!,
                  end: leg.pricingPeriodEnd!
                };
                
                // Generate month distribution based on working days in pricing period
                const evenDistribution = distributeQuantityByWorkingDays(
                  leg.pricingPeriodStart!,
                  leg.pricingPeriodEnd!,
                  value as number
                );
                
                // Add generated monthly values to our accumulated distributions
                Object.entries(evenDistribution).forEach(([monthCode, monthValue]) => {
                  if (!pricingDistributions[instrument][monthCode]) {
                    pricingDistributions[instrument][monthCode] = 0;
                  }
                  pricingDistributions[instrument][monthCode] += monthValue;
                  processedPricingExposures++;
                });
              });
            }
          }
        });
        
        if (tradeHasValidLeg) {
          processedTrades++;
        }
      });
      
      console.log(`Processed ${processedTrades} trades and ${processedLegs} legs`);
      console.log(`Found ${processedPhysicalExposures} physical exposure entries and ${processedPricingExposures} pricing exposure entries`);
      console.log('Physical distributions:', physicalDistributions);
      console.log('Pricing distributions:', pricingDistributions);
      
      // Convert monthly distributions to daily distributions (with pricing periods)
      const physicalDailyDistributions = calculateDailyDistributionByInstrument(
        physicalDistributions,
        physicalPricingPeriods
      );
      
      const pricingDailyDistributions = calculateDailyDistributionByInstrument(
        pricingDistributions,
        pricingPricingPeriods
      );
      
      // Filter daily distributions by date range (with pricing periods)
      const filteredPhysicalDailyDistributions = filterDailyDistributionsByDateRange(
        physicalDailyDistributions,
        startDate,
        endDate,
        physicalPricingPeriods
      );
      
      const filteredPricingDailyDistributions = filterDailyDistributionsByDateRange(
        pricingDailyDistributions,
        startDate,
        endDate,
        pricingPricingPeriods
      );
      
      console.log('Filtered physical daily distributions:', filteredPhysicalDailyDistributions);
      console.log('Filtered pricing daily distributions:', filteredPricingDailyDistributions);
      
      // Calculate total exposures from filtered daily distributions
      const totalPhysicalExposures = calculateTotalExposureFromDailyDistributions(
        filteredPhysicalDailyDistributions
      );
      
      const totalPricingExposures = calculateTotalExposureFromDailyDistributions(
        filteredPricingDailyDistributions
      );
      
      console.log('Total physical exposures:', totalPhysicalExposures);
      console.log('Total pricing exposures:', totalPricingExposures);
      
      return {
        physical: totalPhysicalExposures,
        pricing: totalPricingExposures
      } as FilteredExposureResult;
    } catch (error) {
      console.error("Error calculating filtered exposures:", error);
      return { physical: {}, pricing: {} } as FilteredExposureResult;
    } finally {
      setIsCalculating(false);
    }
  }, [trades, tradesLoading, startDate, endDate]);
  
  const updateDateRange = (newStartDate: Date, newEndDate: Date) => {
    console.log("Updating date range:", newStartDate, newEndDate);
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };
  
  // Clear cache when trades change
  useEffect(() => {
    clearDailyDistributionCache();
  }, [trades]);
  
  return {
    filteredExposures,
    isLoading: tradesLoading || isCalculating,
    error: tradesError,
    updateDateRange,
    startDate,
    endDate,
    refetchTrades
  };
}
