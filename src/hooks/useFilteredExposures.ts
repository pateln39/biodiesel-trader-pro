
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
      return { physical: {}, pricing: {}, paper: {} } as FilteredExposureResult;
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
              console.log(`No explicit monthly distribution for physical, creating one based on pricing period`);
              
              // Create even distribution based on the pricing period for each instrument
              Object.entries(leg.mtmFormula.exposures.physical).forEach(([instrument, value]) => {
                if (!physicalDistributions[instrument]) {
                  physicalDistributions[instrument] = {};
                }
                
                // Store pricing period for this instrument
                physicalPricingPeriods[instrument] = {
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
                  if (!physicalDistributions[instrument][monthCode]) {
                    physicalDistributions[instrument][monthCode] = 0;
                  }
                  physicalDistributions[instrument][monthCode] += monthValue;
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
      
      // Process paper trades
      paperTrades.forEach(trade => {
        let tradeHasValidLeg = false;
        
        trade.legs.forEach(leg => {
          // Skip legs without exposures
          if (!leg.exposures) {
            console.log(`Skipping paper trade leg without exposures: ${leg.legReference}`);
            return;
          }
          
          processedLegs++;
          tradeHasValidLeg = true;
          
          // Get the trading period (month)
          const period = leg.period;
          if (!period) {
            console.log(`Skipping paper trade leg without period: ${leg.legReference}`);
            return;
          }
          
          // Initialize period entry if not exists
          if (!paperExposuresByPeriod[period]) {
            paperExposuresByPeriod[period] = {};
          }
          
          // Process paper exposures
          if (leg.exposures.paper) {
            Object.entries(leg.exposures.paper).forEach(([instrument, value]) => {
              if (!paperExposuresByPeriod[period][instrument]) {
                paperExposuresByPeriod[period][instrument] = 0;
              }
              
              paperExposuresByPeriod[period][instrument] += Number(value) || 0;
              processedPaperExposures++;
            });
          }
        });
        
        if (tradeHasValidLeg) {
          processedTrades++;
        }
      });
      
      console.log(`Processed ${processedTrades} trades and ${processedLegs} legs`);
      console.log(`Found ${processedPhysicalExposures} physical, ${processedPricingExposures} pricing, and ${processedPaperExposures} paper exposure entries`);
      console.log('Paper exposures by period:', paperExposuresByPeriod);
      
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
      
      // Process paper trade exposures
      let filteredPaperExposures: Record<Instrument, number> = {};
      
      // For each period with paper exposures
      Object.entries(paperExposuresByPeriod).forEach(([period, exposures]) => {
        // Convert to daily distributions
        const paperDailyDistributions = processPaperTradeExposures(exposures, period);
        
        // Filter by date range
        const filteredPaperDailyDistributions = filterPaperTradeDistributions(
          paperDailyDistributions,
          startDate,
          endDate,
          period
        );
        
        // Calculate totals for this period
        const periodTotals = calculateTotalExposureFromDailyDistributions(
          filteredPaperDailyDistributions
        );
        
        // Merge with overall paper exposures
        Object.entries(periodTotals).forEach(([instrument, value]) => {
          if (!filteredPaperExposures[instrument]) {
            filteredPaperExposures[instrument] = 0;
          }
          filteredPaperExposures[instrument] += value;
        });
      });
      
      console.log('Filtered physical daily distributions:', filteredPhysicalDailyDistributions);
      console.log('Filtered pricing daily distributions:', filteredPricingDailyDistributions);
      console.log('Filtered paper exposures:', filteredPaperExposures);
      
      // Calculate total exposures from filtered daily distributions
      const totalPhysicalExposures = calculateTotalExposureFromDailyDistributions(
        filteredPhysicalDailyDistributions
      );
      
      const totalPricingExposures = calculateTotalExposureFromDailyDistributions(
        filteredPricingDailyDistributions
      );
      
      console.log('Total physical exposures:', totalPhysicalExposures);
      console.log('Total pricing exposures:', totalPricingExposures);
      console.log('Total paper exposures:', filteredPaperExposures);
      
      return {
        physical: totalPhysicalExposures,
        pricing: totalPricingExposures,
        paper: filteredPaperExposures
      } as FilteredExposureResult;
    } catch (error) {
      console.error("Error calculating filtered exposures:", error);
      return { physical: {}, pricing: {}, paper: {} } as FilteredExposureResult;
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
