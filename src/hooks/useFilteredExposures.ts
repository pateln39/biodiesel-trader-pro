
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
import { getMonthlyDistribution } from '@/utils/workingDaysUtils';
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
      return { physical: {}, pricing: {} } as FilteredExposureResult;
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
      
      // Process trades that have valid pricing periods overlapping with the selected date range
      physicalTrades.forEach(trade => {
        let tradeHasValidLeg = false;
        
        // Process legs to collect monthly distributions
        trade.legs.forEach(leg => {
          if (!leg.formula || !leg.formula.exposures) {
            console.log(`Skipping leg with missing formula or exposures: ${leg.legReference}`);
            return;
          }
          
          // Check if leg pricing period overlaps with the selected date range
          const legOverlapsWithDateRange = isDateWithinPricingPeriod(
            startDate, 
            endDate, 
            leg.pricingPeriodStart, 
            leg.pricingPeriodEnd
          );
          
          if (!legOverlapsWithDateRange) {
            console.log(`Skipping leg ${leg.legReference} - pricing period doesn't overlap with selected date range`);
            return;
          }
          
          processedLegs++;
          tradeHasValidLeg = true;
          
          // IMPROVED: Separate physical and pricing exposures properly
          // First process physical exposures - these are the actual physical products
          if (leg.formula.exposures.physical) {
            Object.entries(leg.formula.exposures.physical).forEach(([instrument, value]) => {
              if (!physicalDistributions[instrument]) {
                physicalDistributions[instrument] = {};
              }
              
              // Here we use the monthlyDistribution if available, otherwise distribute evenly
              const physicalMonthlyDist = getMonthlyDistribution(
                { physical: { [instrument]: value } } as ExposureResult, 
                'physical'
              );
              
              Object.entries(physicalMonthlyDist[instrument] || {}).forEach(([month, monthValue]) => {
                if (!physicalDistributions[instrument][month]) {
                  physicalDistributions[instrument][month] = 0;
                }
                physicalDistributions[instrument][month] += monthValue;
              });
            });
          }
          
          // Then process pricing exposures - these are the pricing instruments
          if (leg.formula.exposures.pricing) {
            Object.entries(leg.formula.exposures.pricing).forEach(([instrument, value]) => {
              if (!pricingDistributions[instrument]) {
                pricingDistributions[instrument] = {};
              }
              
              // Here we use the monthlyDistribution if available, otherwise distribute evenly
              const pricingMonthlyDist = getMonthlyDistribution(
                { pricing: { [instrument]: value } } as ExposureResult, 
                'pricing'
              );
              
              Object.entries(pricingMonthlyDist[instrument] || {}).forEach(([month, monthValue]) => {
                if (!pricingDistributions[instrument][month]) {
                  pricingDistributions[instrument][month] = 0;
                }
                pricingDistributions[instrument][month] += monthValue;
              });
            });
          }
        });
        
        if (tradeHasValidLeg) {
          processedTrades++;
        }
      });
      
      console.log(`Processed ${processedTrades} trades and ${processedLegs} legs`);
      console.log('Physical distributions:', physicalDistributions);
      console.log('Pricing distributions:', pricingDistributions);
      
      // Convert monthly distributions to daily distributions
      const physicalDailyDistributions = calculateDailyDistributionByInstrument(physicalDistributions);
      const pricingDailyDistributions = calculateDailyDistributionByInstrument(pricingDistributions);
      
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
