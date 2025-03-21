import React, { useMemo, useState } from 'react';
import { Download, Calendar, Filter } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Helmet } from 'react-helmet-async';
import { PricingFormula, PartialPricingFormula, PartialExposureResult } from '@/types/pricing';
import { validateAndParsePricingFormula } from '@/utils/formulaUtils';
import { getNextMonths } from '@/utils/dateUtils';

// Types for exposure data
interface ExposureItem {
  month: string;
  grade: string;
  physical: number;
  pricing: number;
  paper: number;
  netExposure: number;
}

interface GradeExposures {
  [grade: string]: {
    physical: number;
    pricing: number;
    paper: number;
    netExposure: number;
  };
}

interface MonthlyExposures {
  [month: string]: GradeExposures;
}

const ExposurePage = () => {
  const [showAllGrades, setShowAllGrades] = useState(false);
  const [periods, setPeriods] = useState<string[]>(getNextMonths(8));

  // Fetch both trade legs and paper trade legs to calculate exposures
  const { data: tradeData, isLoading } = useQuery({
    queryKey: ['exposure-data'],
    queryFn: async () => {
      // Fetch physical trade legs
      const { data: physicalTradeLegs, error: physicalError } = await supabase
        .from('trade_legs')
        .select(`
          id,
          leg_reference,
          buy_sell,
          product,
          quantity,
          pricing_formula,
          mtm_formula,
          trading_period,
          pricing_period_start
        `)
        .order('trading_period', { ascending: true });
        
      if (physicalError) throw physicalError;
      
      // Fetch paper trade legs
      const { data: paperTradeLegs, error: paperError } = await supabase
        .from('paper_trade_legs')
        .select(`
          id,
          leg_reference,
          buy_sell,
          product,
          quantity,
          formula,
          mtm_formula,
          exposures,
          period,
          trading_period
        `)
        .order('period', { ascending: true });
        
      if (paperError) throw paperError;
      
      return {
        physicalTradeLegs: physicalTradeLegs || [],
        paperTradeLegs: paperTradeLegs || []
      };
    }
  });

  // Calculate exposures from trade legs
  const exposureData = useMemo(() => {
    if (!tradeData) return {};

    const { physicalTradeLegs, paperTradeLegs } = tradeData;
    const exposures: MonthlyExposures = {};
    
    // Initialize with all periods
    periods.forEach(period => {
      exposures[period] = {};
    });
    
    // Process physical trade legs - unchanged
    if (physicalTradeLegs && physicalTradeLegs.length > 0) {
      physicalTradeLegs.forEach(leg => {
        // Determine the trading period - either from trading_period field or from pricing_period_start
        let month = leg.trading_period || '';
        
        // If month is not set but we have pricing_period_start, extract month from there
        if (!month && leg.pricing_period_start) {
          const date = new Date(leg.pricing_period_start);
          const monthName = date.toLocaleDateString('en-US', { month: 'short' });
          const year = date.getFullYear().toString().slice(2);
          month = `${monthName}-${year}`;
        }
        
        // If still no valid month or not in our periods list, skip this leg
        if (!month || !periods.includes(month)) {
          return;
        }
        
        const grade = leg.product || 'Unknown';
        const quantityMultiplier = leg.buy_sell === 'buy' ? 1 : -1;
        const quantity = (leg.quantity || 0) * quantityMultiplier;
        
        // Initialize month and grade if they don't exist
        if (!exposures[month]) {
          exposures[month] = {};
        }
        
        if (!exposures[month][grade]) {
          exposures[month][grade] = {
            physical: 0,
            pricing: 0,
            paper: 0,
            netExposure: 0
          };
        }
        
        // Add physical exposure
        exposures[month][grade].physical += quantity;
        
        // Process pricing formula exposures - with proper validation and parsing
        const pricingFormula = validateAndParsePricingFormula(leg.pricing_formula);
        if (pricingFormula.exposures && pricingFormula.exposures.pricing) {
          Object.entries(pricingFormula.exposures.pricing).forEach(([instrument, value]) => {
            if (!exposures[month][instrument]) {
              exposures[month][instrument] = {
                physical: 0,
                pricing: 0,
                paper: 0,
                netExposure: 0
              };
            }
            
            exposures[month][instrument].pricing += Number(value) || 0;
          });
        }
      });
    }
    
    // Process paper trade legs
    if (paperTradeLegs && paperTradeLegs.length > 0) {
      paperTradeLegs.forEach(leg => {
        const month = leg.period || leg.trading_period || '';
        
        // Skip if month is not valid or not in our periods list
        if (!month || !periods.includes(month)) {
          return;
        }
        
        const product = leg.product || 'Unknown';
        const buySellMultiplier = leg.buy_sell === 'buy' ? 1 : -1;
        
        // Initialize month and product if they don't exist
        if (!exposures[month]) {
          exposures[month] = {};
        }
        
        if (!exposures[month][product]) {
          exposures[month][product] = {
            physical: 0,
            pricing: 0,
            paper: 0,
            netExposure: 0
          };
        }
        
        // Process paper trade exposures - PRIORITIZE the new exposures field if available
        if (leg.exposures) {
          // Handle exposures directly from the dedicated column
          if (leg.exposures.physical) {
            Object.entries(leg.exposures.physical).forEach(([prodName, value]) => {
              if (!exposures[month][prodName]) {
                exposures[month][prodName] = {
                  physical: 0,
                  pricing: 0,
                  paper: 0,
                  netExposure: 0
                };
              }
              
              exposures[month][prodName].paper += Number(value) || 0;
            });
          }
          
          if (leg.exposures.pricing) {
            Object.entries(leg.exposures.pricing).forEach(([instrument, value]) => {
              if (!exposures[month][instrument]) {
                exposures[month][instrument] = {
                  physical: 0,
                  pricing: 0,
                  paper: 0,
                  netExposure: 0
                };
              }
              
              exposures[month][instrument].pricing += Number(value) || 0;
            });
          }
        }
        // Fallback to mtm_formula for legacy compatibility
        else if (leg.mtm_formula && leg.mtm_formula.exposures) {
          if (leg.mtm_formula.exposures.physical) {
            Object.entries(leg.mtm_formula.exposures.physical).forEach(([prodName, value]) => {
              if (!exposures[month][prodName]) {
                exposures[month][prodName] = {
                  physical: 0,
                  pricing: 0,
                  paper: 0,
                  netExposure: 0
                };
              }
              
              exposures[month][prodName].paper += Number(value) || 0;
            });
          }
        }
        // Simplest fallback: just add the main product if no exposures info
        else {
          exposures[month][product].paper += (leg.quantity || 0) * buySellMultiplier;
        }
      });
    }
    
    // Calculate net exposure for each grade in each month
    Object.keys(exposures).forEach(month => {
      Object.keys(exposures[month]).forEach(grade => {
        const { physical, pricing, paper } = exposures[month][grade];
        exposures[month][grade].netExposure = physical + pricing + paper;
      });
    });
    
    return exposures;
  }, [tradeData, periods]);

  // Convert exposures object to array for rendering
  const exposureItems = useMemo(() => {
    const items: ExposureItem[] = [];
    
    Object.entries(exposureData).forEach(([month, grades]) => {
      Object.entries(grades).forEach(([grade, values]) => {
        // Skip rows with all zeros if not showing all grades
        if (!showAllGrades && 
            values.physical === 0 && 
            values.pricing === 0 && 
            values.paper === 0 &&
            values.netExposure === 0) {
          return;
        }
        
        items.push({
          month,
          grade,
          physical: values.physical,
          pricing: values.pricing,
          paper: values.paper,
          netExposure: values.netExposure
        });
      });
    });
    
    // Sort by month and then by grade
    return items.sort((a, b) => {
      // First sort by month (using the order in the periods array)
      const monthIndexA = periods.indexOf(a.month);
      const monthIndexB = periods.indexOf(b.month);
      
      if (monthIndexA !== monthIndexB) return monthIndexA - monthIndexB;
      
      // Then sort by grade
      return a.grade.localeCompare(b.grade);
    });
  }, [exposureData, showAllGrades, periods]);

  // Group exposure data by month
  const groupedByMonth = useMemo(() => {
    const grouped: Record<string, ExposureItem[]> = {};
    
    exposureItems.forEach(item => {
      if (!grouped[item.month]) {
        grouped[item.month] = [];
      }
      grouped[item.month].push(item);
    });
    
    // Make sure months are in the correct order (future first)
    const orderedGrouped: Record<string, ExposureItem[]> = {};
    periods.forEach(period => {
      if (grouped[period]) {
        orderedGrouped[period] = grouped[period];
      }
    });
    
    return orderedGrouped;
  }, [exposureItems, periods]);

  // Function to get color class based on value
  const getValueColorClass = (value: number): string => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-muted-foreground';
  };

  // Function to format values with sign
  const formatValue = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toLocaleString()}`;
  };

  return (
    <Layout>
      <Helmet>
        <title>Exposure Reporting</title>
      </Helmet>
      
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Exposure Reporting</h1>
          <div className="flex space-x-2">
            <Button 
              variant="outline"
              onClick={() => setShowAllGrades(!showAllGrades)}
            >
              <Filter className="mr-2 h-4 w-4" /> 
              {showAllGrades ? 'Hide Empty' : 'Show All'}
            </Button>
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" /> Change Period
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-center items-center h-40">
                <p className="text-muted-foreground">Loading exposure data...</p>
              </div>
            </CardContent>
          </Card>
        ) : Object.keys(groupedByMonth).length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-center items-center h-40">
                <p className="text-muted-foreground">No exposure data found.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByMonth).map(([month, items]) => (
              <Card key={month} className="overflow-hidden">
                <CardHeader className="bg-muted/30 py-3">
                  <CardTitle className="text-lg font-medium">{month}</CardTitle>
                </CardHeader>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left p-3 font-medium">Grade</th>
                        <th className="text-right p-3 font-medium">Physical (MT)</th>
                        <th className="text-right p-3 font-medium">Pricing (MT)</th>
                        <th className="text-right p-3 font-medium">Paper (MT)</th>
                        <th className="text-right p-3 font-medium">Net Exposure (MT)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={`${item.month}-${item.grade}-${index}`} className="border-t hover:bg-muted/50">
                          <td className="p-3 font-medium">{item.grade}</td>
                          <td className={`p-3 text-right ${getValueColorClass(item.physical)}`}>
                            {formatValue(item.physical)}
                          </td>
                          <td className={`p-3 text-right ${getValueColorClass(item.pricing)}`}>
                            {formatValue(item.pricing)}
                          </td>
                          <td className={`p-3 text-right ${getValueColorClass(item.paper)}`}>
                            {formatValue(item.paper)}
                          </td>
                          <td className={`p-3 text-right font-medium ${getValueColorClass(item.netExposure)}`}>
                            {formatValue(item.netExposure)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t bg-muted/30">
                        <td className="p-3 font-medium">Total</td>
                        <td className={`p-3 text-right font-medium ${getValueColorClass(items.reduce((sum, item) => sum + item.physical, 0))}`}>
                          {formatValue(items.reduce((sum, item) => sum + item.physical, 0))}
                        </td>
                        <td className={`p-3 text-right font-medium ${getValueColorClass(items.reduce((sum, item) => sum + item.pricing, 0))}`}>
                          {formatValue(items.reduce((sum, item) => sum + item.pricing, 0))}
                        </td>
                        <td className={`p-3 text-right font-medium ${getValueColorClass(items.reduce((sum, item) => sum + item.paper, 0))}`}>
                          {formatValue(items.reduce((sum, item) => sum + item.paper, 0))}
                        </td>
                        <td className={`p-3 text-right font-medium ${getValueColorClass(items.reduce((sum, item) => sum + item.netExposure, 0))}`}>
                          {formatValue(items.reduce((sum, item) => sum + item.netExposure, 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ExposurePage;
