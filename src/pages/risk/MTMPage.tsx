import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Eye } from 'lucide-react';
import { useTrades } from '@/hooks/useTrades';
import { 
  calculateTradeLegPrice, 
  calculateMTMPrice, 
  calculateMTMValue, 
  PricingPeriodType 
} from '@/utils/priceCalculationUtils';
import PriceDetails from '@/components/pricing/PriceDetails';
import { PhysicalTrade, PhysicalTradeLeg } from '@/types/physical';
import { PaperTrade } from '@/types/paper';
import { formatMTMDisplay } from '@/utils/tradeUtils';
import { toast } from 'sonner';
import { isDateRangeInFuture } from '@/utils/mtmUtils';

const MTMPage = () => {
  const { trades, loading: tradesLoading, refetchTrades } = useTrades();
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
            
            // Handle future pricing periods with mtmFutureMonth
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
                  leg.endDate
                );
                console.log(`Trade price result for ${leg.legReference}:`, priceResult);
                
                console.log(`Calculating MTM price for EFP future leg ${leg.legReference}`);
                const mtmPriceResult = await calculateMTMPrice(
                  leg.mtmFormula || efpLeg,
                  leg.startDate,
                  leg.endDate,
                  leg.mtmFutureMonth // Ensure we pass mtmFutureMonth explicitly
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
                
                // Add mtmFutureMonth to the leg object for calculation
                const legWithFutureMonth = {
                  ...leg,
                  mtmFutureMonth: leg.mtmFutureMonth
                };
                
                console.log(`Calculating trade price for formula future leg ${leg.legReference}`);
                const priceResult = await calculateTradeLegPrice(
                  legWithFutureMonth as PhysicalTradeLeg,
                  leg.startDate,
                  leg.endDate
                );
                console.log(`Trade price result for ${leg.legReference}:`, priceResult);
                
                // Add mtmFutureMonth to the mtmFormula as well
                const mtmFormulaWithMonth = leg.mtmFormula || leg.formula;
                
                console.log(`Calculating MTM price for formula future leg ${leg.legReference}`);
                const mtmPriceResult = await calculateMTMPrice(
                  mtmFormulaWithMonth,
                  leg.startDate,
                  leg.endDate,
                  leg.mtmFutureMonth // Ensure we pass mtmFutureMonth explicitly
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
            
            // Handle EFP trades
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
                efpFixedValue: leg.efpFixedValue
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
            // Handle standard trades
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
              // Fallback for legs without formula
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
      
      // Filter out any undefined values that might have slipped through
      return positions.filter(Boolean);
    },
    enabled: !tradesLoading && tradeLegs.length > 0
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchTrades();
    setRefreshing(false);
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

  const totalMtm = mtmPositions?.reduce((sum, pos) => sum + (pos.mtmValue || 0), 0) || 0;

  const renderPaperFormula = (trade: PaperTrade) => {
    if (!trade.legs || trade.legs.length === 0) {
      return <span className="text-muted-foreground italic">No formula</span>;
    }
    
    const firstLeg = trade.legs[0];
    
    return <span>{formatMTMDisplay(
      firstLeg.product,
      firstLeg.relationshipType,
      firstLeg.rightSide?.product
    )}</span>;
  };

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
            disabled={refreshing || tradesLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Separator />
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>MTM Positions</CardTitle>
                <CardDescription>
                  Current Mark-to-Market position values by instrument and trade
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">Total MTM Position</div>
                <div className={`text-2xl font-bold ${totalMtm >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${totalMtm.toFixed(2)}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
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
