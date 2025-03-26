
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
import { getMonthlyDistribution, distributeQuantityByWorkingDays, standardizeMonthCode } from '@/utils/workingDaysUtils';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { PhysicalTrade } from '@/types/physical';

interface UseFilteredExposuresProps {
  startDate?: Date;
  endDate?: Date;
}

interface FilteredExposureResult {
  physical: Record<Instrument, number>;
  pricing: Record<Instrument, number>;
  isFilterActive: boolean;
  filterStartDate?: Date;
  filterEndDate?: Date;
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
  const [isFilterActive, setIsFilterActive] = useState<boolean>(false);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  
  // Create a filtered version of the exposure data
  const filteredExposures = useMemo(() => {
    if (tradesLoading || !trades || trades.length === 0) {
      console.log("No trades to calculate exposures from");
      return { 
        physical: {}, 
        pricing: {}, 
        isFilterActive, 
        filterStartDate: isFilterActive ? startDate : undefined,
        filterEndDate: isFilterActive ? endDate : undefined 
      } as FilteredExposureResult;
    }
    
    setIsCalculating(true);
    console.log('Calculating filtered exposures with date range:', startDate, endDate);
    
    try {
      // Collect monthly distributions from all physical trades
      const physicalDistributions: Record<Instrument, MonthlyDistribution> = {};
      const pricingDistributions: Record<Instrument, MonthlyDistribution> = {};
      
      // Process physical trades only
      const physicalTrades = trades.filter(trade => trade.tradeType === 'physical') as PhysicalTrade[];
      console.log(`Found ${physicalTrades.length} physical trades`);
      
      // Track how many trades and legs are processed
      let processedTrades = 0;
      let processedLegs = 0;
      let processedPhysicalExposures = 0;
      let processedPricingExposures = 0;
      
      // Process trades that have valid pricing periods overlapping with the selected date range
      physicalTrades.forEach(trade => {
        let tradeHasValidLeg = false;
        
        // Process legs to collect monthly distributions
        trade.legs.forEach(leg => {
          // Check for required formula properties
          if (!leg.formula || !leg.mtmFormula) {
            console.log(`Skipping leg with missing formulas: ${leg.legReference}`);
            return;
          }
          
          // Only apply date filter if filter is active
          const legShouldBeProcessed = !isFilterActive || isDateWithinPricingPeriod(
            startDate, 
            endDate, 
            leg.pricingPeriodStart, 
            leg.pricingPeriodEnd
          );
          
          if (!legShouldBeProcessed) {
            console.log(`Skipping leg ${leg.legReference} - pricing period doesn't overlap with selected date range`);
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
                
                // Add monthly values to our accumulated distributions
                Object.entries(distribution).forEach(([monthCode, monthValue]) => {
                  // Ensure month code is standardized
                  const standardizedMonthCode = standardizeMonthCode(monthCode);
                  
                  if (!physicalDistributions[instrument][standardizedMonthCode]) {
                    physicalDistributions[instrument][standardizedMonthCode] = 0;
                  }
                  physicalDistributions[instrument][standardizedMonthCode] += monthValue;
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
                
                // Generate month distribution based on working days in pricing period
                const evenDistribution = distributeQuantityByWorkingDays(
                  leg.pricingPeriodStart,
                  leg.pricingPeriodEnd,
                  value as number
                );
                
                // Add generated monthly values to our accumulated distributions
                Object.entries(evenDistribution).forEach(([monthCode, monthValue]) => {
                  // Ensure month code is standardized
                  const standardizedMonthCode = standardizeMonthCode(monthCode);
                  
                  if (!physicalDistributions[instrument][standardizedMonthCode]) {
                    physicalDistributions[instrument][standardizedMonthCode] = 0;
                  }
                  physicalDistributions[instrument][standardizedMonthCode] += monthValue;
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
                
                // Add monthly values to our accumulated distributions
                Object.entries(distribution).forEach(([monthCode, monthValue]) => {
                  // Ensure month code is standardized
                  const standardizedMonthCode = standardizeMonthCode(monthCode);
                  
                  if (!pricingDistributions[instrument][standardizedMonthCode]) {
                    pricingDistributions[instrument][standardizedMonthCode] = 0;
                  }
                  pricingDistributions[instrument][standardizedMonthCode] += monthValue;
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
                
                // Generate month distribution based on working days in pricing period
                const evenDistribution = distributeQuantityByWorkingDays(
                  leg.pricingPeriodStart,
                  leg.pricingPeriodEnd,
                  value as number
                );
                
                // Add generated monthly values to our accumulated distributions
                Object.entries(evenDistribution).forEach(([monthCode, monthValue]) => {
                  // Ensure month code is standardized
                  const standardizedMonthCode = standardizeMonthCode(monthCode);
                  
                  if (!pricingDistributions[instrument][standardizedMonthCode]) {
                    pricingDistributions[instrument][standardizedMonthCode] = 0;
                  }
                  pricingDistributions[instrument][standardizedMonthCode] += monthValue;
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
      
      // Convert monthly distributions to daily distributions
      const physicalDailyDistributions = calculateDailyDistributionByInstrument(physicalDistributions);
      const pricingDailyDistributions = calculateDailyDistributionByInstrument(pricingDistributions);
      
      // Filter daily distributions by date range (only if filter is active)
      const totalPhysicalExposures: Record<Instrument, number> = {};
      const totalPricingExposures: Record<Instrument, number> = {};
      
      if (isFilterActive) {
        // Filter daily distributions by date range
        const filteredPhysicalDailyDistributions = filterDailyDistributionsByDateRange(
          physicalDailyDistributions,
          startDate,
          endDate
        );
        
        const filteredPricingDailyDistributions = filterDailyDistributionsByDateRange(
          pricingDailyDistributions,
          startDate,
          endDate
        );
        
        console.log('Filtered physical daily distributions:', filteredPhysicalDailyDistributions);
        console.log('Filtered pricing daily distributions:', filteredPricingDailyDistributions);
        
        // Calculate total exposures from filtered daily distributions
        const filteredPhysicalExposures = calculateTotalExposureFromDailyDistributions(
          filteredPhysicalDailyDistributions
        );
        
        const filteredPricingExposures = calculateTotalExposureFromDailyDistributions(
          filteredPricingDailyDistributions
        );
        
        console.log('Filtered physical exposures:', filteredPhysicalExposures);
        console.log('Filtered pricing exposures:', filteredPricingExposures);
        
        // Use the filtered exposures
        Object.assign(totalPhysicalExposures, filteredPhysicalExposures);
        Object.assign(totalPricingExposures, filteredPricingExposures);
      } else {
        // Calculate total exposures from all daily distributions
        const allPhysicalExposures = calculateTotalExposureFromDailyDistributions(
          physicalDailyDistributions
        );
        
        const allPricingExposures = calculateTotalExposureFromDailyDistributions(
          pricingDailyDistributions
        );
        
        console.log('All physical exposures:', allPhysicalExposures);
        console.log('All pricing exposures:', allPricingExposures);
        
        // Use all exposures
        Object.assign(totalPhysicalExposures, allPhysicalExposures);
        Object.assign(totalPricingExposures, allPricingExposures);
      }
      
      return {
        physical: totalPhysicalExposures,
        pricing: totalPricingExposures,
        isFilterActive,
        filterStartDate: isFilterActive ? startDate : undefined,
        filterEndDate: isFilterActive ? endDate : undefined
      } as FilteredExposureResult;
    } catch (error) {
      console.error("Error calculating filtered exposures:", error);
      return { 
        physical: {}, 
        pricing: {}, 
        isFilterActive,
        filterStartDate: isFilterActive ? startDate : undefined,
        filterEndDate: isFilterActive ? endDate : undefined
      } as FilteredExposureResult;
    } finally {
      setIsCalculating(false);
    }
  }, [trades, tradesLoading, startDate, endDate, isFilterActive]);
  
  const updateDateRange = (newStartDate: Date, newEndDate: Date) => {
    console.log("Updating date range:", newStartDate, newEndDate);
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    setIsFilterActive(true);
  };
  
  const resetDateFilter = () => {
    setIsFilterActive(false);
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
    resetDateFilter,
    startDate,
    endDate,
    isFilterActive,
    refetchTrades
  };
}
