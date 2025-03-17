
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
import { PhysicalTrade } from '@/types';

const MTMPage = () => {
  const { trades, loading: tradesLoading, refetchTrades } = useTrades();
  const [selectedLeg, setSelectedLeg] = useState<{
    legId: string;
    formula: any;
    mtmFormula: any;
    startDate: Date;
    endDate: Date;
    quantity: number;
    buySell: 'buy' | 'sell';  // Added buySell property
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filter physical trades
  const physicalTrades = trades.filter(
    (trade): trade is PhysicalTrade => trade.tradeType === 'physical'
  );

  // Define the type for MTM positions
  type MTMPosition = {
    legId: string;
    tradeRef: string;
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
  };

  // Flatten trade legs for MTM view
  const tradeLegs = physicalTrades.flatMap(trade => 
    trade.legs?.map(leg => ({
      legId: leg.id,
      tradeRef: trade.tradeReference,
      buySell: leg.buySell.toLowerCase(), // Ensure we're using lowercase for consistency
      product: leg.product,
      quantity: leg.quantity,
      startDate: leg.pricingPeriodStart,
      endDate: leg.pricingPeriodEnd,
      formula: leg.formula,
      mtmFormula: leg.mtmFormula,
      calculatedPrice: 0, // Will be populated by price calculation
      mtmCalculatedPrice: 0, // Will be populated by MTM price calculation
    })) || []
  );

  // Calculate prices for all legs
  const { data: mtmPositions, isLoading: calculationLoading } = useQuery({
    queryKey: ['mtmPositions', tradeLegs],
    queryFn: async () => {
      // Skip if no trades
      if (tradeLegs.length === 0) return [];
      
      // Calculate MTM for each leg
      const positions = await Promise.all(
        tradeLegs.map(async (leg) => {
          if (!leg.formula) return { ...leg, calculatedPrice: 0, mtmCalculatedPrice: 0, mtmValue: 0 };
          
          try {
            // Calculate trade price (using pricing period)
            const priceResult = await calculateTradeLegPrice(
              leg.formula,
              leg.startDate,
              leg.endDate
            );
            
            // Calculate MTM price using most recent prices (not based on pricing period)
            const mtmFormula = leg.mtmFormula || leg.formula;
            const mtmPriceResult = await calculateMTMPrice(mtmFormula);
            
            // Calculate MTM value using the new formula
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
              periodType: priceResult.periodType
            } as MTMPosition;
          } catch (error) {
            console.error(`Error calculating MTM for leg ${leg.legId}:`, error);
            return { ...leg, calculatedPrice: 0, mtmCalculatedPrice: 0, mtmValue: 0 } as MTMPosition;
          }
        })
      );
      
      return positions;
    },
    enabled: !tradesLoading && tradeLegs.length > 0
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchTrades();
    setRefreshing(false);
  };

  const handleViewPrices = (leg: any) => {
    setSelectedLeg({
      legId: leg.legId,
      formula: leg.formula,
      mtmFormula: leg.mtmFormula,
      startDate: leg.startDate,
      endDate: leg.endDate,
      quantity: leg.quantity,
      buySell: leg.buySell as 'buy' | 'sell'  // Pass the buySell value
    });
  };

  // Calculate total MTM position
  const totalMtm = mtmPositions?.reduce((sum, pos) => sum + (pos.mtmValue || 0), 0) || 0;

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
                      <TableCell>{position.tradeRef}</TableCell>
                      <TableCell>{position.product}</TableCell>
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
          buySell={selectedLeg.buySell}  // Pass the buySell prop to PriceDetails
        />
      )}
    </Layout>
  );
};

export default MTMPage;
