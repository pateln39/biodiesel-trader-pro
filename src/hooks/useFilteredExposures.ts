import { useState, useEffect, useMemo } from 'react';
import { useTrades } from './useTrades';
import { Instrument } from '@/types/common';
import { MonthlyDistribution, ExposureResult } from '@/types/pricing';
import { 
  calculateDailyDistributionByInstrument,
  filterDailyDistributionsByDateRange,
  calculateTotalExposureFromDailyDistributions,
  clearDailyDistributionCache,
  isDateWithinPricingPeriod,
  processPaperTradeExposures,
  filterPaperTradeDistributions
} from '@/utils/exposureUtils';
import { getMonthlyDistribution, distributeQuantityByWorkingDays } from '@/utils/workingDaysUtils';
import { startOfMonth, endOfMonth } from 'date-fns';
import { PhysicalTrade } from '@/types/physical';
import { PaperTrade } from '@/types/paper';

interface UseFilteredExposuresProps {
  startDate?: Date;
  endDate?: Date;
}

interface FilteredExposureResult {
  physical: Record<Instrument, number>;
  pricing: Record<Instrument, number>;
  paper?: Record<Instrument, number>;
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
      return { 
        physical: {} as Record<Instrument, number>, 
        pricing: {} as Record<Instrument, number>, 
        paper: {} as Record<Instrument, number> 
      } as FilteredExposureResult;
    }
    
    setIsCalculating(true);
    console.log('Calculating filtered exposures with date range:', startDate, endDate);
    
    try {
      // Collect monthly distributions from all physical trades
      const physicalDistributions: Record<Instrument, MonthlyDistribution> = {} as Record<Instrument, MonthlyDistribution>;
      const pricingDistributions: Record<Instrument, MonthlyDistribution> = {} as Record<Instrument, MonthlyDistribution>;
      
      // Store pricing periods for each instrument
      const physicalPricingPeriods: Record<Instrument, { start: Date, end: Date }> = {} as Record<Instrument, { start: Date, end: Date }>;
      const pricingPricingPeriods: Record<Instrument, { start: Date, end: Date }> = {} as Record<Instrument, { start: Date, end: Date }>;
      
      // Collect paper trade exposures
      const paperExposuresByPeriod: Record<string, Record<Instrument, number>> = {};
      
      // Process physical trades only
      const physicalTrades = trades.filter(trade => trade.tradeType === 'physical') as PhysicalTrade[];
      console.log(`Found ${physicalTrades.length} physical trades`);
      
      // Process paper trades separately
      const paperTrades = trades.filter(trade => trade.tradeType === 'paper') as PaperTrade[];
      console.log(`Found ${paperTrades.length} paper trades`);
      
      // Track how many trades and legs are processed
      let processedTrades = 0;
      let processedLegs = 0;
      let processedPhysicalExposures = 0;
      let processedPricingExposures = 0;
      let processedPaperExposures = 0;
      
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
                if (!physicalDistributions[instrument as Instrument]) {
                  physicalDistributions[instrument as Instrument] = {};
                }
                
                // Store pricing period for this instrument
                physicalPricingPeriods[instrument as Instrument] = {
                  start: leg.pricingPeriodStart!,
                  end: leg.pricingPeriodEnd!
                };
                
                // Add monthly values to our accumulated distributions
                Object.entries(distribution).forEach(([monthCode, monthValue]) => {
                  if (!physicalDistributions[instrument as Instrument][monthCode]) {
                    physicalDistributions[instrument as Instrument][monthCode] = 0;
                  }
                  physicalDistributions[instrument as Instrument][monthCode] += monthValue;
                  processedPhysicalExposures++;
                });
              });
            } else {
              console.log(`No explicit monthly distribution for physical, creating one based on pricing period`);
              
              // Create even distribution based on the pricing period for each instrument
              Object.entries(leg.mtmFormula.exposures.physical).forEach(([instrument, value]) => {
                if (!physicalDistributions[instrument as Instrument]) {
                  physicalDistributions[instrument as Instrument] = {};
                }
                
                // Store pricing period for this instrument
                physicalPricingPeriods[instrument as Instrument] = {
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
                  if (!physicalDistributions[instrument as Instrument][monthCode]) {
                    physicalDistributions[instrument as Instrument][monthCode] = 0;
                  }
                  physicalDistributions[instrument as Instrument][monthCode] += monthValue;
                  processedPhysicalExposures++;
                });
              });
            }
          }
          
          // PRICING EXPOSURES - Get from regular formula
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
                if (!pricingDistributions[instrument as Instrument]) {
                  pricingDistributions[instrument as Instrument] = {};
                }
                
                // Store pricing period for this instrument
                pricingPricingPeriods[instrument as Instrument] = {
                  start: leg.pricingPeriodStart!,
                  end: leg.pricingPeriodEnd!
                };
                
                // Add monthly values to our accumulated distributions
                Object.entries(distribution).forEach(([monthCode, monthValue]) => {
                  if (!pricingDistributions[instrument as Instrument][monthCode]) {
                    pricingDistributions[instrument as Instrument][monthCode] = 0;
                  }
                  pricingDistributions[instrument as Instrument][monthCode] += monthValue;
                  processedPricingExposures++;
                });
              });
            } else {
              console.log(`No explicit monthly distribution for pricing, creating one based on pricing period`);
              
              // Create even distribution based on the pricing period for each instrument
              Object.entries(leg.formula.exposures.pricing).forEach(([instrument, value]) => {
                if (!pricingDistributions[instrument as Instrument]) {
                  pricingDistributions[instrument as Instrument] = {};
                }
                
                // Store pricing period for this instrument
                pricingPricingPeriods[instrument as Instrument] = {
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
                  if (!pricingDistributions[instrument as Instrument][monthCode]) {
                    pricingDistributions[instrument as Instrument][monthCode] = 0;
                  }
                  pricingDistributions[instrument as Instrument][monthCode] += monthValue;
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
      
      console.log(`Processed ${processedTrades} trades with ${processedLegs} legs`);
      console.log(`Found ${processedPhysicalExposures} physical exposures`);
      console.log(`Found ${processedPricingExposures} pricing exposures`);
      
      // Process paper trades
      const paperExposures = processPaperTradeExposures(paperTrades);
      console.log(`Found ${Object.keys(paperExposures).length} paper exposures`);
      
      // Filter paper exposures by date range
      const filteredPaperExposures = filterPaperTradeDistributions(paperExposures, startDate, endDate);
      console.log(`After filtering, have ${Object.keys(filteredPaperExposures).length} paper exposures`);
      
      // Convert to daily distributions
      const physicalDailyDistributions = calculateDailyDistributionByInstrument(
        physicalDistributions,
        physicalPricingPeriods
      );
      
      const pricingDailyDistributions = calculateDailyDistributionByInstrument(
        pricingDistributions,
        pricingPricingPeriods
      );
      
      // Filter the daily distributions by date range
      const filteredPhysicalDistributions = filterDailyDistributionsByDateRange(
        physicalDailyDistributions,
        startDate,
        endDate
      );
      
      const filteredPricingDistributions = filterDailyDistributionsByDateRange(
        pricingDailyDistributions,
        startDate,
        endDate
      );
      
      // Calculate total exposure from daily distributions
      const physicalExposure = calculateTotalExposureFromDailyDistributions(
        filteredPhysicalDistributions
      );
      
      const pricingExposure = calculateTotalExposureFromDailyDistributions(
        filteredPricingDistributions
      );
      
      // Combine all exposures
      const result: FilteredExposureResult = {
        physical: physicalExposure || ({} as Record<Instrument, number>),
        pricing: pricingExposure || ({} as Record<Instrument, number>),
        paper: filteredPaperExposures || ({} as Record<Instrument, number>)
      };
      
      setIsCalculating(false);
      return result;
    } catch (error) {
      console.error('Error calculating filtered exposures:', error);
      setIsCalculating(false);
      return { 
        physical: {} as Record<Instrument, number>, 
        pricing: {} as Record<Instrument, number>, 
        paper: {} as Record<Instrument, number> 
      } as FilteredExposureResult;
    }
  }, [trades, tradesLoading, startDate, endDate]);
  
  // Clear cache when date range changes
  useEffect(() => {
    clearDailyDistributionCache();
  }, [startDate, endDate]);
  
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
