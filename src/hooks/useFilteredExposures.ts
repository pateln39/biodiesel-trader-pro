
import { useState, useMemo } from 'react';
import { useTrades } from './useTrades';
import { Instrument } from '@/types/common';
import { MonthlyDistribution } from '@/types/pricing';
import { getMonthlyDistribution } from '@/utils/workingDaysUtils';
import { PhysicalTrade } from '@/types/physical';
import { createEmptyExposures } from '@/utils/exposureUtils';

interface FilteredExposureResult {
  physical: Record<Instrument, number>;
  pricing: Record<Instrument, number>;
}

export function useFilteredExposures() {
  const { trades, loading: tradesLoading, error: tradesError, refetchTrades } = useTrades();
  
  // Create a filtered version of the exposure data
  const filteredExposures = useMemo(() => {
    if (tradesLoading || !trades || trades.length === 0) {
      console.log("No trades to calculate exposures from");
      // Return a properly structured result with empty data
      return { 
        physical: createEmptyExposures(), 
        pricing: createEmptyExposures() 
      } as FilteredExposureResult;
    }
    
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
            
            // Process each instrument's physical exposure
            Object.entries(leg.mtmFormula.exposures.physical).forEach(([instrument, value]) => {
              if (!physicalDistributions[instrument as Instrument]) {
                physicalDistributions[instrument as Instrument] = {};
              }
              
              // For physical exposure, use the loading period start date to determine the month
              if (leg.loadingPeriodStart && value !== 0) {
                const loadingStartMonth = new Date(leg.loadingPeriodStart);
                const monthName = loadingStartMonth.toLocaleString('en-US', { month: 'short' });
                const year = loadingStartMonth.getFullYear().toString().slice(-2);
                const monthCode = `${monthName}-${year}`;
                
                console.log(`Assigning physical exposure for ${instrument} to loading month ${monthCode}: ${value}`);
                
                // Put 100% of the exposure in the loading month
                if (!physicalDistributions[instrument as Instrument][monthCode]) {
                  physicalDistributions[instrument as Instrument][monthCode] = 0;
                }
                
                physicalDistributions[instrument as Instrument][monthCode] += value as number;
                processedPhysicalExposures++;
              } else if (value !== 0) {
                console.log(`No loading period start date for leg ${leg.legReference}, using pricing period for physical exposure`);
                
                // Fallback to pricing period as before if no loading period start
                const firstMonth = new Date(leg.pricingPeriodStart!);
                const monthName = firstMonth.toLocaleString('en-US', { month: 'short' });
                const year = firstMonth.getFullYear().toString().slice(-2);
                const monthCode = `${monthName}-${year}`;
                
                // Put 100% of the exposure in the first pricing month if no loading date
                if (!physicalDistributions[instrument as Instrument][monthCode]) {
                  physicalDistributions[instrument as Instrument][monthCode] = 0;
                }
                
                physicalDistributions[instrument as Instrument][monthCode] += value as number;
                processedPhysicalExposures++;
              }
            });
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
                
                // Add monthly values to our accumulated distributions
                Object.entries(distribution).forEach(([monthCode, monthValue]) => {
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
      
      console.log(`Processed ${processedTrades} trades and ${processedLegs} legs`);
      console.log(`Found ${processedPhysicalExposures} physical exposure entries and ${processedPricingExposures} pricing exposure entries`);
      console.log('Physical distributions:', physicalDistributions);
      console.log('Pricing distributions:', pricingDistributions);
      
      // Start with empty exposures for each instrument
      const result: FilteredExposureResult = {
        physical: createEmptyExposures(),
        pricing: createEmptyExposures()
      };
      
      // Sum up values for each instrument from the monthly distributions
      Object.entries(physicalDistributions).forEach(([instrument, monthlyValues]) => {
        result.physical[instrument as Instrument] = Object.values(monthlyValues).reduce((sum, val) => sum + val, 0);
      });
      
      Object.entries(pricingDistributions).forEach(([instrument, monthlyValues]) => {
        result.pricing[instrument as Instrument] = Object.values(monthlyValues).reduce((sum, val) => sum + val, 0);
      });
      
      console.log('Final exposures:', result);
      return result;
    } catch (error) {
      console.error("Error calculating exposures:", error);
      // Return a properly structured result with empty data on error
      return { 
        physical: createEmptyExposures(), 
        pricing: createEmptyExposures() 
      } as FilteredExposureResult;
    }
  }, [trades, tradesLoading]);
  
  return {
    filteredExposures,
    isLoading: tradesLoading,
    error: tradesError,
    refetchTrades
  };
}
