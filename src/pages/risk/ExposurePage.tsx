
import React, { useMemo, useState } from 'react';
import { Download, Calendar, Filter } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent 
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Helmet } from 'react-helmet-async';
import { PricingFormula, PartialPricingFormula } from '@/types/pricing';
import { validateAndParsePricingFormula } from '@/utils/formulaUtils';
import { getNextMonths } from '@/utils/dateUtils';

// Types for exposure data
interface ExposureData {
  physical: number;
  pricing: number;
  paper: number;
  netExposure: number;
}

interface MonthlyExposure {
  month: string;
  products: Record<string, ExposureData>;
  totals: ExposureData;
}

const ExposurePage = () => {
  const [showAllGrades, setShowAllGrades] = useState(false);
  const [periods] = useState<string[]>(getNextMonths(8));

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

  // Process trade data into monthly exposures by product
  const exposureData = useMemo(() => {
    if (!tradeData) return [];

    const { physicalTradeLegs, paperTradeLegs } = tradeData;
    
    // Initialize exposure data structure for each month
    const exposuresByMonth: Record<string, Record<string, ExposureData>> = {};
    const allProducts = new Set<string>();
    
    // Initialize data structure for all months
    periods.forEach(month => {
      exposuresByMonth[month] = {};
    });
    
    // Process physical trade legs
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
        
        const product = leg.product || 'Unknown';
        allProducts.add(product);
        
        const quantityMultiplier = leg.buy_sell === 'buy' ? 1 : -1;
        const quantity = (leg.quantity || 0) * quantityMultiplier;
        
        if (!exposuresByMonth[month][product]) {
          exposuresByMonth[month][product] = {
            physical: 0,
            pricing: 0,
            paper: 0,
            netExposure: 0
          };
        }
        
        exposuresByMonth[month][product].physical += quantity;
        
        // Process pricing formula for exposure
        const pricingFormula = validateAndParsePricingFormula(leg.pricing_formula);
        if (pricingFormula.exposures && pricingFormula.exposures.pricing) {
          Object.entries(pricingFormula.exposures.pricing).forEach(([instrument, value]) => {
            allProducts.add(instrument);
            
            if (!exposuresByMonth[month][instrument]) {
              exposuresByMonth[month][instrument] = {
                physical: 0,
                pricing: 0,
                paper: 0,
                netExposure: 0
              };
            }
            
            exposuresByMonth[month][instrument].pricing += Number(value) || 0;
          });
        }
      });
    }
    
    // Process paper trade legs
    if (paperTradeLegs && paperTradeLegs.length > 0) {
      paperTradeLegs.forEach(leg => {
        const month = leg.period || leg.trading_period || '';
        
        if (!month || !periods.includes(month)) {
          return;
        }
        
        const product = leg.product || 'Unknown';
        allProducts.add(product);
        
        if (!exposuresByMonth[month][product]) {
          exposuresByMonth[month][product] = {
            physical: 0,
            pricing: 0,
            paper: 0,
            netExposure: 0
          };
        }
        
        // Check for explicit exposures field first
        if (leg.exposures && typeof leg.exposures === 'object') {
          const exposuresData = leg.exposures as Record<string, any>;
          
          // Handle physical exposures
          if (exposuresData.physical && typeof exposuresData.physical === 'object') {
            Object.entries(exposuresData.physical).forEach(([prodName, value]) => {
              allProducts.add(prodName);
              
              if (!exposuresByMonth[month][prodName]) {
                exposuresByMonth[month][prodName] = {
                  physical: 0,
                  pricing: 0,
                  paper: 0,
                  netExposure: 0
                };
              }
              
              exposuresByMonth[month][prodName].paper += Number(value) || 0;
            });
          }
          
          // Handle pricing exposures
          if (exposuresData.pricing && typeof exposuresData.pricing === 'object') {
            Object.entries(exposuresData.pricing).forEach(([instrument, value]) => {
              allProducts.add(instrument);
              
              if (!exposuresByMonth[month][instrument]) {
                exposuresByMonth[month][instrument] = {
                  physical: 0,
                  pricing: 0,
                  paper: 0,
                  netExposure: 0
                };
              }
              
              exposuresByMonth[month][instrument].pricing += Number(value) || 0;
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
                allProducts.add(prodName);
                
                if (!exposuresByMonth[month][prodName]) {
                  exposuresByMonth[month][prodName] = {
                    physical: 0,
                    pricing: 0,
                    paper: 0,
                    netExposure: 0
                  };
                }
                
                exposuresByMonth[month][prodName].paper += Number(value) || 0;
              });
            }
          }
        }
        // Default fallback for paper trades
        else {
          const buySellMultiplier = leg.buy_sell === 'buy' ? 1 : -1;
          exposuresByMonth[month][product].paper += (leg.quantity || 0) * buySellMultiplier;
        }
      });
    }
    
    // Calculate net exposures and create the final data structure
    const monthlyExposures: MonthlyExposure[] = periods.map(month => {
      const monthData = exposuresByMonth[month];
      const productsData: Record<string, ExposureData> = {};
      const totals: ExposureData = { physical: 0, pricing: 0, paper: 0, netExposure: 0 };
      
      // Filter out products with no exposure if showAllGrades is false
      Array.from(allProducts).forEach(product => {
        const productExposure = monthData[product] || { physical: 0, pricing: 0, paper: 0, netExposure: 0 };
        
        // Calculate net exposure
        productExposure.netExposure = productExposure.physical + productExposure.pricing + productExposure.paper;
        
        // Only include products with non-zero exposures if showAllGrades is false
        if (showAllGrades || 
            productExposure.physical !== 0 || 
            productExposure.pricing !== 0 || 
            productExposure.paper !== 0) {
          productsData[product] = productExposure;
          
          // Add to totals
          totals.physical += productExposure.physical;
          totals.pricing += productExposure.pricing;
          totals.paper += productExposure.paper;
          totals.netExposure += productExposure.netExposure;
        }
      });
      
      return {
        month,
        products: productsData,
        totals
      };
    });
    
    return monthlyExposures;
  }, [tradeData, periods, showAllGrades]);

  // Get sorted list of all products/grades from the exposure data
  const allProducts = useMemo(() => {
    const productSet = new Set<string>();
    
    exposureData.forEach(monthData => {
      Object.keys(monthData.products).forEach(product => {
        productSet.add(product);
      });
    });
    
    return Array.from(productSet).sort();
  }, [exposureData]);

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
        ) : exposureData.length === 0 || allProducts.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-center items-center h-40">
                <p className="text-muted-foreground">No exposure data found.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead rowSpan={2} className="border-r border-b text-left p-3 font-medium">Month</TableHead>
                    {allProducts.map(product => (
                      <TableHead key={product} colSpan={4} className="text-center p-2 font-medium border-r border-b">
                        {product}
                      </TableHead>
                    ))}
                    <TableHead colSpan={4} className="text-center p-2 font-medium border-b">
                      Total
                    </TableHead>
                  </TableRow>
                  <TableRow className="bg-muted/30">
                    {allProducts.flatMap(product => [
                      <TableHead key={`${product}-physical`} className="text-right p-2 font-medium text-sm whitespace-nowrap">Physical</TableHead>,
                      <TableHead key={`${product}-pricing`} className="text-right p-2 font-medium text-sm whitespace-nowrap">Pricing</TableHead>,
                      <TableHead key={`${product}-paper`} className="text-right p-2 font-medium text-sm whitespace-nowrap">Paper</TableHead>,
                      <TableHead key={`${product}-net`} className="text-right p-2 font-medium text-sm whitespace-nowrap border-r">Net</TableHead>
                    ])}
                    <TableHead className="text-right p-2 font-medium text-sm whitespace-nowrap">Physical</TableHead>
                    <TableHead className="text-right p-2 font-medium text-sm whitespace-nowrap">Pricing</TableHead>
                    <TableHead className="text-right p-2 font-medium text-sm whitespace-nowrap">Paper</TableHead>
                    <TableHead className="text-right p-2 font-medium text-sm whitespace-nowrap">Net</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exposureData.map((monthData) => (
                    <TableRow key={monthData.month} className="hover:bg-muted/50">
                      <TableCell className="font-medium border-r">{monthData.month}</TableCell>
                      
                      {allProducts.flatMap(product => {
                        const productData = monthData.products[product] || { physical: 0, pricing: 0, paper: 0, netExposure: 0 };
                        return [
                          <TableCell key={`${monthData.month}-${product}-physical`} className={`text-right ${getValueColorClass(productData.physical)}`}>
                            {formatValue(productData.physical)}
                          </TableCell>,
                          <TableCell key={`${monthData.month}-${product}-pricing`} className={`text-right ${getValueColorClass(productData.pricing)}`}>
                            {formatValue(productData.pricing)}
                          </TableCell>,
                          <TableCell key={`${monthData.month}-${product}-paper`} className={`text-right ${getValueColorClass(productData.paper)}`}>
                            {formatValue(productData.paper)}
                          </TableCell>,
                          <TableCell key={`${monthData.month}-${product}-net`} className={`text-right font-medium border-r ${getValueColorClass(productData.netExposure)}`}>
                            {formatValue(productData.netExposure)}
                          </TableCell>
                        ];
                      })}
                      
                      {/* Month totals */}
                      <TableCell className={`text-right font-medium ${getValueColorClass(monthData.totals.physical)}`}>
                        {formatValue(monthData.totals.physical)}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${getValueColorClass(monthData.totals.pricing)}`}>
                        {formatValue(monthData.totals.pricing)}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${getValueColorClass(monthData.totals.paper)}`}>
                        {formatValue(monthData.totals.paper)}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${getValueColorClass(monthData.totals.netExposure)}`}>
                        {formatValue(monthData.totals.netExposure)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default ExposurePage;
