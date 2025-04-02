import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { Eye } from 'lucide-react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw } from 'lucide-react';
import { useTrades } from '@/hooks/useTrades';
import { usePaperTrades } from '@/hooks/usePaperTrades';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import PaperMTMTable from '@/components/risk/PaperMTMTable';
import PriceDetails from '@/components/pricing/PriceDetails';
import { PhysicalTrade, PhysicalTradeLeg } from '@/types/physical';
import { calculateTradeLegPrice, calculateMTMPrice, calculateMTMValue, PricingPeriodType } from '@/utils/priceCalculationUtils';
import { isDateRangeInFuture } from '@/utils/mtmUtils';

const MTMPage = () => {
  const { trades, loading: tradesLoading, refetchTrades } = useTrades();
  const { paperTrades, isLoading: paperLoading, refetchPaperTrades } = usePaperTrades();
  const [selectedLeg, setSelectedLeg] = useState<{
    legId: string;
    formula: any;
    mtmFormula: any;
    startDate: Date;
    endDate: Date;
    quantity: number;
    buySell: 'buy' | 'sell';
    efpPremium?: number;
    efpAgreedStatus?: boolean;
    efpFixedValue?: number;
    pricingType?: string;
    mtmFutureMonth?: string;
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('physical');

  const physicalTrades = trades.filter(
    (trade): trade is PhysicalTrade => trade.tradeType === 'physical' && 'physicalType' in trade
  );

  type MTMPosition = {
    legId: string;
    tradeRef: string;
    legReference: string;
    physicalType: string;
    buySell: string;
    product: string;
    quantity: number;
    startDate: Date;
    endDate: Date;
    formula: any;
    mtmFormula: any;
    calculatedPrice: number;
    mtmCalculatedPrice: number;
    mtmValue: number;
    periodType?: PricingPeriodType;
    pricingType?: string;
    efpPremium?: number;
    efpAgreedStatus?: boolean;
    efpFixedValue?: number;
    mtmFutureMonth?: string;
  };

  const tradeLegs = physicalTrades.flatMap(trade => 
    trade.legs?.map(leg => {
      let startDate = leg.pricingPeriodStart;
      let endDate = leg.pricingPeriodEnd;
      
      if (startDate > endDate) {
        const temp = startDate;
        startDate = endDate;
        endDate = temp;
      }
      
      return {
        legId: leg.id,
        tradeRef: trade.tradeReference,
        legReference: leg.legReference,
        physicalType: trade.physicalType,
        buySell: leg.buySell.toLowerCase(),
        product: leg.product,
        quantity: leg.quantity,
        startDate: startDate,
        endDate: endDate,
        formula: leg.formula,
        mtmFormula: leg.mtmFormula,
        calculatedPrice: 0,
        mtmCalculatedPrice: 0,
        mtmValue: 0,
        pricingType: leg.pricingType,
        efpPremium: leg.efpPremium,
        efpAgreedStatus: leg.efpAgreedStatus,
        efpFixedValue: leg.efpFixedValue,
        mtmFutureMonth: leg.mtmFutureMonth
      };
    }) || []
  );

  const { data: mtmPositions, isLoading: calculationLoading } = useQuery({
    queryKey: ['mtmPositions', tradeLegs],
    queryFn: async () => {
      if (tradeLegs.length === 0) return [];
      
      const positions = await Promise.all(
        tradeLegs.map(async (leg) => {
          try {
            console.log(`Processing leg ${leg.legReference} with dates ${leg.startDate} to ${leg.endDate}`);
            console.log(`mtmFutureMonth: ${leg.mtmFutureMonth}, pricingType: ${leg.pricingType}`);
            
            if (isDateRangeInFuture(leg.startDate, leg.endDate)) {
              console.log(`Future period detected for leg ${leg.legReference}`);
              
              if (leg.pricingType === 'efp') {
                const efpLeg: PhysicalTradeLeg = {
                  id: leg.legId,
                  parentTradeId: '',
                  legReference: leg.legReference,
                  buySell: leg.buySell as 'buy' | 'sell',
                  product: leg.product,
                  quantity: leg.quantity,
                  loadingPeriodStart: new Date(),
                  loadingPeriodEnd: new Date(),
                  pricingPeriodStart: leg.startDate,
                  pricingPeriodEnd: leg.endDate,
                  pricingType: 'efp',
                  efpPremium: leg.efpPremium,
                  efpAgreedStatus: leg.efpAgreedStatus,
                  efpFixedValue: leg.efpFixedValue,
                  mtmFutureMonth: leg.mtmFutureMonth
                };
                
                console.log(`Calculating trade price for EFP future leg ${leg.legReference}`);
                const priceResult = await calculateTradeLegPrice(
                  efpLeg,
                  leg.startDate,
                  leg.endDate,
                  leg.mtmFutureMonth
                );
                console.log(`Trade price result for ${leg.legReference}:`, priceResult);
                
                console.log(`Calculating MTM price for EFP future leg ${leg.legReference}`);
                const mtmPriceResult = await calculateMTMPrice(
                  leg.mtmFormula || efpLeg,
                  leg.startDate,
                  leg.endDate,
                  leg.mtmFutureMonth
                );
                console.log(`MTM price result for ${leg.legReference}:`, mtmPriceResult);
                
                const mtmValue = calculateMTMValue(
                  priceResult.price,
                  mtmPriceResult.price,
                  leg.quantity,
                  leg.buySell as 'buy' | 'sell'
                );
                console.log(`MTM value for ${leg.legReference}: ${mtmValue}`);
                
                return {
                  ...leg,
                  calculatedPrice: priceResult.price,
                  mtmCalculatedPrice: mtmPriceResult.price,
                  mtmValue,
                  periodType: priceResult.periodType || 'future'
                };
              } else if (leg.formula) {
                console.log(`Using formula for future leg ${leg.legReference}:`, leg.formula);
                
                console.log(`Calculating trade price for formula future leg ${leg.legReference}`);
                const priceResult = await calculateTradeLegPrice(
                  leg.formula,
                  leg.startDate,
                  leg.endDate,
                  leg.mtmFutureMonth
                );
                console.log(`Trade price result for ${leg.legReference}:`, priceResult);
                
                const mtmFormulaToUse = leg.mtmFormula || leg.formula;
                
                console.log(`Calculating MTM price for formula future leg ${leg.legReference}`);
                const mtmPriceResult = await calculateMTMPrice(
                  mtmFormulaToUse,
                  leg.startDate,
                  leg.endDate,
                  leg.mtmFutureMonth
                );
                console.log(`MTM price result for ${leg.legReference}:`, mtmPriceResult);
                
                const mtmValue = calculateMTMValue(
                  priceResult.price,
                  mtmPriceResult.price,
                  leg.quantity,
                  leg.buySell as 'buy' | 'sell'
                );
                console.log(`MTM value for ${leg.legReference}: ${mtmValue}`);
                
                return {
                  ...leg,
                  calculatedPrice: priceResult.price,
                  mtmCalculatedPrice: mtmPriceResult.price,
                  mtmValue,
                  periodType: priceResult.periodType || 'future'
                };
              }
            }
            
            if (leg.pricingType === 'efp') {
              const efpLeg: PhysicalTradeLeg = {
                id: leg.legId,
                parentTradeId: '',
                legReference: leg.legReference,
                buySell: leg.buySell as 'buy' | 'sell',
                product: leg.product,
                quantity: leg.quantity,
                loadingPeriodStart: new Date(),
                loadingPeriodEnd: new Date(),
                pricingPeriodStart: leg.startDate,
                pricingPeriodEnd: leg.endDate,
                pricingType: 'efp',
                efpPremium: leg.efpPremium,
                efpAgreedStatus: leg.efpAgreedStatus,
                efpFixedValue: leg.efpFixedValue,
                mtmFutureMonth: leg.mtmFutureMonth
              };
              
              const priceResult = await calculateTradeLegPrice(
                efpLeg,
                leg.startDate,
                leg.endDate
              );
              
              const mtmToUse = leg.mtmFormula || efpLeg;
              const mtmPriceResult = await calculateMTMPrice(
                mtmToUse,
                leg.startDate,
                leg.endDate
              );
              
              const mtmValue = calculateMTMValue(
                priceResult.price,
                mtmPriceResult.price,
                leg.quantity,
                leg.buySell as 'buy' | 'sell'
              );
              
              return {
                ...leg,
                calculatedPrice: priceResult.price,
                mtmCalculatedPrice: mtmPriceResult.price,
                mtmValue,
                periodType: priceResult.periodType || 'current'
              };
            } 
            else if (leg.formula) {
              const priceResult = await calculateTradeLegPrice(
                leg.formula,
                leg.startDate,
                leg.endDate
              );
              
              const mtmFormula = leg.mtmFormula || leg.formula;
              const mtmPriceResult = await calculateMTMPrice(
                mtmFormula,
                leg.startDate,
                leg.endDate
              );
              
              const mtmValue = calculateMTMValue(
                priceResult.price,
                mtmPriceResult.price,
                leg.quantity,
                leg.buySell as 'buy' | 'sell'
              );
              
              return {
                ...leg,
                calculatedPrice: priceResult.price,
                mtmCalculatedPrice: mtmPriceResult.price,
                mtmValue,
                periodType: priceResult.periodType || 'current'
              };
            } else {
              return { 
                ...leg, 
                calculatedPrice: 0, 
                mtmCalculatedPrice: 0, 
                mtmValue: 0,
                periodType: 'current' as PricingPeriodType
              };
            }
          } catch (error) {
            console.error(`Error calculating MTM for leg ${leg.legId}:`, error);
            toast.error(`Error calculating MTM for leg ${leg.legReference}`);
            return { 
              ...leg, 
              calculatedPrice: 0, 
              mtmCalculatedPrice: 0, 
              mtmValue: 0,
              periodType: 'current' as PricingPeriodType
            };
          }
        })
      );
      
      return positions.filter(Boolean);
    },
    enabled: !tradesLoading && tradeLegs.length > 0
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'physical') {
      await refetchTrades();
    } else {
      await refetchPaperTrades();
    }
    setRefreshing(false);
    toast.success('MTM data refreshed');
  };

  const handleViewPrices = (leg: MTMPosition) => {
    setSelectedLeg({
      legId: leg.legId,
      formula: leg.formula,
      mtmFormula: leg.mtmFormula,
      startDate: leg.startDate,
      endDate: leg.endDate,
      quantity: leg.quantity,
      buySell: leg.buySell as 'buy' | 'sell',
      pricingType: leg.pricingType,
      efpPremium: leg.efpPremium,
      efpAgreedStatus: leg.efpAgreedStatus,
      efpFixedValue: leg.efpFixedValue,
      mtmFutureMonth: leg.mtmFutureMonth
    });
  };

  const totalPhysicalMtm = mtmPositions?.reduce((sum, pos) => sum + (pos.mtmValue || 0), 0) || 0;

  return (
    <Layout>
      <Helmet>
        <title>Mark-to-Market</title>
      </Helmet>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mark-to-Market</h1>
            <p className="text-muted-foreground">
              View real-time Mark-to-Market positions across all trading activities
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={refreshing || tradesLoading || paperLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Separator />
        
        <Card>
          <CardHeader>
            <CardTitle>MTM Positions</CardTitle>
            <CardDescription>
              Current Mark-to-Market position values by instrument and trade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="physical">Physical Trades</TabsTrigger>
                <TabsTrigger value="paper">Paper Trades</TabsTrigger>
              </TabsList>
              
              <TabsContent value="physical">
                <div className="text-right mb-4">
                  <div className="text-sm font-medium">Total Physical MTM Position</div>
                  <div className={`text-2xl font-bold ${totalPhysicalMtm >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${totalPhysicalMtm.toFixed(2)}
                  </div>
                </div>

                {tradesLoading || calculationLoading ? (
                  <div className="flex items-center justify-center p-12 text-muted-foreground">
                    <p>Loading MTM positions...</p>
                  </div>
                ) : mtmPositions && mtmPositions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Trade Ref</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>B/S</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Trade Price</TableHead>
                        <TableHead className="text-right">MTM Price</TableHead>
                        <TableHead className="text-right">MTM Value</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mtmPositions.map((position) => (
                        <TableRow key={position.legId}>
                          <TableCell>
                            {position.physicalType === 'term' ? (
                              <>
                                {position.tradeRef}-{position.legReference.split('-').pop()}
                              </>
                            ) : (
                              <>
                                {position.tradeRef}
                              </>
                            )}
                          </TableCell>
                          <TableCell>
                            {position.product}
                            {position.pricingType === 'efp' && (
                              <Badge variant="outline" className="ml-2">EFP</Badge>
                            )}
                            {isDateRangeInFuture(position.startDate, position.endDate) && position.mtmFutureMonth && (
                              <Badge variant="secondary" className="ml-2">Future: {position.mtmFutureMonth}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={position.buySell === 'buy' ? 'default' : 'outline'}>
                              {position.buySell.charAt(0).toUpperCase() + position.buySell.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {position.quantity.toLocaleString()} MT
                          </TableCell>
                          <TableCell className="text-right">
                            ${position.calculatedPrice.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            ${position.mtmCalculatedPrice.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={position.mtmValue >= 0 ? 'text-green-600' : 'text-red-600'}>
                              ${position.mtmValue.toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              position.periodType === 'historical' ? 'default' : 
                              position.periodType === 'current' ? 'secondary' : 
                              'outline'
                            }>
                              {position.periodType || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewPrices(position)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex items-center justify-center p-12 text-muted-foreground">
                    <p>No MTM positions available. Add trades with pricing formulas to see data here.</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="paper">
                <PaperMTMTable />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {selectedLeg && (
        <PriceDetails
          isOpen={!!selectedLeg}
          onClose={() => setSelectedLeg(null)}
          tradeLegId={selectedLeg.legId}
          formula={selectedLeg.formula}
          mtmFormula={selectedLeg.mtmFormula}
          startDate={selectedLeg.startDate}
          endDate={selectedLeg.endDate}
          quantity={selectedLeg.quantity}
          buySell={selectedLeg.buySell}
          pricingType={selectedLeg.pricingType}
          efpPremium={selectedLeg.efpPremium}
          efpAgreedStatus={selectedLeg.efpAgreedStatus}
          efpFixedValue={selectedLeg.efpFixedValue}
          mtmFutureMonth={selectedLeg.mtmFutureMonth}
        />
      )}
    </Layout>
  );
};

export default MTMPage;
