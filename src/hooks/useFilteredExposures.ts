
import { useState, useEffect, useMemo } from 'react';
import { useTrades } from './useTrades';
import { Instrument } from '@/types/common';
import { clearDailyDistributionCache, isDateWithinPricingPeriod } from '@/utils/exposureUtils';
import { standardizeMonthCode } from '@/utils/workingDaysUtils';
import { startOfMonth, endOfMonth, format } from 'date-fns';
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
      // Initialize exposure results objects
      const physicalExposures: Record<Instrument, number> = {};
      const pricingExposures: Record<Instrument, number> = {};
      
      // Process physical trades only
      const physicalTrades = trades.filter(trade => trade.tradeType === 'physical') as PhysicalTrade[];
      console.log(`Found ${physicalTrades.length} physical trades`);
      
      // Process trades with valid legs
      physicalTrades.forEach(trade => {
        // Process legs to collect exposures
        trade.legs.forEach(leg => {
          // Check for required formula properties
          if (!leg.formula || !leg.mtmFormula) {
            console.log(`Skipping leg with missing formulas: ${leg.legReference}`);
            return;
          }
          
          // PHYSICAL EXPOSURES - Get from mtmFormula
          if (leg.mtmFormula?.exposures?.physical && leg.loadingPeriodStart) {
            console.log(`Processing physical exposures from mtmFormula for leg ${leg.legReference}`);
            
            // Get the loading period start month
            const loadingStartMonth = new Date(leg.loadingPeriodStart);
            const monthStr = format(loadingStartMonth, 'MMM-yy'); // e.g. "Mar-24"
            const filterMonth = standardizeMonthCode(monthStr);
            
            // Determine if the loading month falls within our filter date range
            const filterMonthStart = new Date(loadingStartMonth.getFullYear(), loadingStartMonth.getMonth(), 1);
            const filterMonthEnd = new Date(loadingStartMonth.getFullYear(), loadingStartMonth.getMonth() + 1, 0);
            
            const isMonthInFilterRange = isDateWithinPricingPeriod(
              startDate,
              endDate,
              filterMonthStart,
              filterMonthEnd
            );
            
            console.log(`Loading month ${filterMonth} falls within filter range: ${isMonthInFilterRange}`);
            
            // If the month is in our filter range, include the exposures
            if (isMonthInFilterRange) {
              Object.entries(leg.mtmFormula.exposures.physical).forEach(([instrument, value]) => {
                if (!physicalExposures[instrument]) {
                  physicalExposures[instrument] = 0;
                }
                physicalExposures[instrument] += value as number;
                console.log(`Adding physical exposure for ${instrument} in month ${filterMonth}: ${value}`);
              });
            }
          }
          
          // PRICING EXPOSURES - Process separately with prorating
          if (leg.formula?.exposures?.pricing && leg.pricingPeriodStart && leg.pricingPeriodEnd) {
            console.log(`Processing pricing exposures from formula for leg ${leg.legReference}`);
            
            // Check if the pricing period overlaps with our filter range
            const isPricingPeriodInRange = isDateWithinPricingPeriod(
              startDate,
              endDate,
              leg.pricingPeriodStart,
              leg.pricingPeriodEnd
            );
            
            if (isPricingPeriodInRange) {
              // For pricing exposures, we prorate based on the overlap ratio
              const pricingStartDate = leg.pricingPeriodStart > startDate ? leg.pricingPeriodStart : startDate;
              const pricingEndDate = leg.pricingPeriodEnd < endDate ? leg.pricingPeriodEnd : endDate;
              
              // Simple ratio calculation (can be improved with working days)
              const totalDays = (leg.pricingPeriodEnd.getTime() - leg.pricingPeriodStart.getTime()) / (1000 * 60 * 60 * 24) + 1;
              const overlapDays = (pricingEndDate.getTime() - pricingStartDate.getTime()) / (1000 * 60 * 60 * 24) + 1;
              const ratio = overlapDays / totalDays;
              
              Object.entries(leg.formula.exposures.pricing).forEach(([instrument, value]) => {
                if (!pricingExposures[instrument]) {
                  pricingExposures[instrument] = 0;
                }
                // Apply ratio to get the prorated amount
                const proratedValue = (value as number) * ratio;
                pricingExposures[instrument] += proratedValue;
                console.log(`Adding pricing exposure for ${instrument}: ${value} * ${ratio} = ${proratedValue}`);
              });
            }
          }
        });
      });
      
      return {
        physical: physicalExposures,
        pricing: pricingExposures
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
