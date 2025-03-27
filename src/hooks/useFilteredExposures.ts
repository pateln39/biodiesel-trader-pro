import { useState, useEffect, useMemo } from 'react';
import { useTrades } from './useTrades';
import { Instrument } from '@/types/common';
import { MonthlyDistribution, ExposureResult } from '@/types/pricing';
import { 
  calculateDailyDistribution,
  calculateDailyDistributionByInstrument,
  filterDailyDistributionByDateRange,
  filterDailyDistributionsByDateRange,
  calculateTotalExposureByInstrument,
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
  
  const filteredExposures = useMemo(() => {
    if (tradesLoading || !trades || trades.length === 0) {
      console.log("No trades to calculate exposures from");
      return { physical: {}, pricing: {}, paper: {} } as FilteredExposureResult;
    }
    
    setIsCalculating(true);
    console.log('Calculating filtered exposures with date range:', startDate, endDate);
    
    try {
      const physicalDistributions: Record<Instrument, MonthlyDistribution> = {};
      const pricingDistributions: Record<Instrument, MonthlyDistribution> = {};
      
      const physicalPricingPeriods: Record<Instrument, { start: Date, end: Date }> = {};
      const pricingPricingPeriods: Record<Instrument, { start: Date, end: Date }> = {};
      
      const paperExposuresByPeriod: Record<string, Record<Instrument, number>> = {};
      
      const physicalTrades = trades.filter(trade => trade.tradeType === 'physical') as PhysicalTrade[];
      console.log(`Found ${physicalTrades.length} physical trades`);
      
      const paperTrades = trades.filter(trade => trade.tradeType === 'paper') as PaperTrade[];
      console.log(`Found ${paperTrades.length} paper trades`);
      
      let processedTrades = 0;
      let processedLegs = 0;
      let processedPhysicalExposures = 0;
      let processedPricingExposures = 0;
      let processedPaperExposures = 0;
      
      physicalTrades.forEach(trade => {
        let tradeHasValidLeg = false;
        
        trade.legs.forEach(leg => {
          if (!leg.formula || !leg.mtmFormula) {
            console.log(`Skipping leg with missing formulas: ${leg.legReference}`);
            return;
          }
          
          if (!leg.pricingPeriodStart || !leg.pricingPeriodEnd) {
            console.log(`Skipping leg ${leg.legReference} - missing pricing period dates`);
            return;
          }
          
          processedLegs++;
          tradeHasValidLeg = true;
          
          if (leg.mtmFormula && leg.mtmFormula.exposures && leg.mtmFormula.exposures.physical) {
            console.log(`Processing physical exposures from mtmFormula for leg ${leg.legReference}`);
            
            const physicalMonthlyDist = getMonthlyDistribution(
              leg.mtmFormula.exposures, 
              'physical'
            );
            
            const hasExplicitMonthlyDistribution = 
              physicalMonthlyDist && 
              Object.keys(physicalMonthlyDist).length > 0;
            
            if (hasExplicitMonthlyDistribution) {
              console.log(`Found explicit monthly distribution for physical:`, physicalMonthlyDist);
              
              Object.entries(physicalMonthlyDist).forEach(([instrument, distribution]) => {
                if (!physicalDistributions[instrument]) {
                  physicalDistributions[instrument] = {};
                }
                
                physicalPricingPeriods[instrument] = {
                  start: leg.pricingPeriodStart!,
                  end: leg.pricingPeriodEnd!
                };
                
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
              
              Object.entries(leg.mtmFormula.exposures.physical).forEach(([instrument, value]) => {
                if (!physicalDistributions[instrument]) {
                  physicalDistributions[instrument] = {};
                }
                
                physicalPricingPeriods[instrument] = {
                  start: leg.pricingPeriodStart!,
                  end: leg.pricingPeriodEnd!
                };
                
                const evenDistribution = distributeQuantityByWorkingDays(
                  leg.pricingPeriodStart!,
                  leg.pricingPeriodEnd!,
                  value as number
                );
                
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
          
          if (leg.formula && leg.formula.exposures && leg.formula.exposures.pricing) {
            console.log(`Processing pricing exposures from formula for leg ${leg.legReference}`);
            
            const pricingMonthlyDist = getMonthlyDistribution(
              leg.formula.exposures, 
              'pricing'
            );
            
            const hasExplicitMonthlyDistribution = 
              pricingMonthlyDist && 
              Object.keys(pricingMonthlyDist).length > 0;
            
            if (hasExplicitMonthlyDistribution) {
              console.log(`Found explicit monthly distribution for pricing:`, pricingMonthlyDist);
              
              Object.entries(pricingMonthlyDist).forEach(([instrument, distribution]) => {
                if (!pricingDistributions[instrument]) {
                  pricingDistributions[instrument] = {};
                }
                
                pricingPricingPeriods[instrument] = {
                  start: leg.pricingPeriodStart!,
                  end: leg.pricingPeriodEnd!
                };
                
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
              
              Object.entries(leg.formula.exposures.pricing).forEach(([instrument, value]) => {
                if (!pricingDistributions[instrument]) {
                  pricingDistributions[instrument] = {};
                }
                
                pricingPricingPeriods[instrument] = {
                  start: leg.pricingPeriodStart!,
                  end: leg.pricingPeriodEnd!
                };
                
                const evenDistribution = distributeQuantityByWorkingDays(
                  leg.pricingPeriodStart!,
                  leg.pricingPeriodEnd!,
                  value as number
                );
                
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
      
      paperTrades.forEach(trade => {
        let tradeHasValidLeg = false;
        
        trade.legs.forEach(leg => {
          if (!leg.exposures) {
            console.log(`Skipping paper trade leg without exposures: ${leg.legReference}`);
            return;
          }
          
          processedLegs++;
          tradeHasValidLeg = true;
          
          const period = leg.period;
          if (!period) {
            console.log(`Skipping paper trade leg without period: ${leg.legReference}`);
            return;
          }
          
          if (!paperExposuresByPeriod[period]) {
            paperExposuresByPeriod[period] = {};
          }
          
          if (leg.exposures.paper) {
            Object.entries(leg.exposures.paper).forEach(([instrument, value]) => {
              if (!paperExposuresByPeriod[period][instrument as Instrument]) {
                paperExposuresByPeriod[period][instrument as Instrument] = 0;
              }
              
              const numericValue = typeof value === 'number' ? value : Number(value) || 0;
              paperExposuresByPeriod[period][instrument as Instrument] += numericValue;
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
      
      const physicalDailyDistributions = calculateDailyDistributionByInstrument(
        physicalDistributions,
        physicalPricingPeriods
      );
      
      const pricingDailyDistributions = calculateDailyDistributionByInstrument(
        pricingDistributions,
        pricingPricingPeriods
      );
      
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
      
      let filteredPaperExposures: Record<Instrument, number> = {};
      
      Object.entries(paperExposuresByPeriod).forEach(([period, exposures]) => {
        const paperDailyDistributions = processPaperTradeExposures(
          exposures as Record<Instrument, number>,
          period
        );
        
        const filteredPaperDailyDistributions = filterPaperTradeDistributions(
          paperDailyDistributions,
          startDate,
          endDate,
          period
        );
        
        const periodTotals = calculateTotalExposureFromDailyDistributions(
          filteredPaperDailyDistributions
        );
        
        Object.entries(periodTotals).forEach(([instrument, value]) => {
          if (!filteredPaperExposures[instrument as Instrument]) {
            filteredPaperExposures[instrument as Instrument] = 0;
          }
          filteredPaperExposures[instrument as Instrument] += value;
        });
      });
      
      console.log('Filtered physical daily distributions:', filteredPhysicalDailyDistributions);
      console.log('Filtered pricing daily distributions:', filteredPricingDailyDistributions);
      console.log('Filtered paper exposures:', filteredPaperExposures);
      
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
