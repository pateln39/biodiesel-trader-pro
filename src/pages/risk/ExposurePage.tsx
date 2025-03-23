
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

  const { data: tradeData, isLoading } = useQuery({
    queryKey: ['exposure-data'],
    queryFn: async () => {
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

  const exposureData = useMemo(() => {
    if (!tradeData) return {};

    const { physicalTradeLegs, paperTradeLegs } = tradeData;
    const exposures: MonthlyExposures = {};
    
    periods.forEach(period => {
      exposures[period] = {};
    });
    
    if (physicalTradeLegs && physicalTradeLegs.length > 0) {
      physicalTradeLegs.forEach(leg => {
        let month = leg.trading_period || '';
        
        if (!month && leg.pricing_period_start) {
          const date = new Date(leg.pricing_period_start);
          const monthName = date.toLocaleDateString('en-US', { month: 'short' });
          const year = date.getFullYear().toString().slice(2);
          month = `${monthName}-${year}`;
        }
        
        if (!month || !periods.includes(month)) {
          return;
        }
        
        const grade = leg.product || 'Unknown';
        const quantityMultiplier = leg.buy_sell === 'buy' ? 1 : -1;
        const quantity = (leg.quantity || 0) * quantityMultiplier;
        
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
        
        exposures[month][grade].physical += quantity;
        
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
    
    if (paperTradeLegs && paperTradeLegs.length > 0) {
      paperTradeLegs.forEach(leg => {
        const month = leg.period || leg.trading_period || '';
        
        if (!month || !periods.includes(month)) {
          return;
        }
        
        const product = leg.product || 'Unknown';
        const buySellMultiplier = leg.buy_sell === 'buy' ? 1 : -1;
        
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
        
        // Check for new explicit exposures field first
        if (leg.exposures && typeof leg.exposures === 'object') {
          const exposuresData = leg.exposures as Record<string, any>;
          
          // Handle physical exposures
          if (exposuresData.physical && typeof exposuresData.physical === 'object') {
            Object.entries(exposuresData.physical).forEach(([prodName, value]) => {
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
          
          // Handle pricing exposures
          if (exposuresData.pricing && typeof exposuresData.pricing === 'object') {
            Object.entries(exposuresData.pricing).forEach(([instrument, value]) => {
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
        // Fall back to mtm_formula if no explicit exposures
        else if (leg.mtm_formula && typeof leg.mtm_formula === 'object') {
          const mtmFormula = leg.mtm_formula as Record<string, any>;
          
          if (mtmFormula.exposures && typeof mtmFormula.exposures === 'object') {
            const mtmExposures = mtmFormula.exposures as Record<string, any>;
            
            if (mtmExposures.physical && typeof mtmExposures.physical === 'object') {
              Object.entries(mtmExposures.physical).forEach(([prodName, value]) => {
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
        }
        // Default fallback if no structured exposure data is available
        else {
          exposures[month][product].paper += (leg.quantity || 0) * buySellMultiplier;
        }
      });
    }
    
    // Calculate net exposures
    Object.keys(exposures).forEach(month => {
      Object.keys(exposures[month]).forEach(grade => {
        const { physical, pricing, paper } = exposures[month][grade];
        exposures[month][grade].netExposure = physical + pricing + paper;
      });
    });
    
    return exposures;
  }, [tradeData, periods]);

  const exposureItems = useMemo(() => {
    const items: ExposureItem[] = [];
    
    Object.entries(exposureData).forEach(([month, grades]) => {
      Object.entries(grades).forEach(([grade, values]) => {
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
    
    return items.sort((a, b) => {
      const monthIndexA = periods.indexOf(a.month);
      const monthIndexB = periods.indexOf(b.month);
      
      if (monthIndexA !== monthIndexB) return monthIndexA - monthIndexB;
      
      return a.grade.localeCompare(b.grade);
    });
  }, [exposureData, showAllGrades, periods]);

  const groupedByMonth = useMemo(() => {
    const grouped: Record<string, ExposureItem[]> = {};
    
    exposureItems.forEach(item => {
      if (!grouped[item.month]) {
        grouped[item.month] = [];
      }
      grouped[item.month].push(item);
    });
    
    const orderedGrouped: Record<string, ExposureItem[]> = {};
    periods.forEach(period => {
      if (grouped[period]) {
        orderedGrouped[period] = grouped[period];
      }
    });
    
    return orderedGrouped;
  }, [exposureItems, periods]);

  const getValueColorClass = (value: number): string => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-muted-foreground';
  };

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
