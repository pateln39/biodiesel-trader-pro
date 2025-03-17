
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  calculateTradeLegPrice, 
  calculateMTMPrice, 
  calculateMTMValue, 
  PricingPeriodType 
} from '@/utils/priceCalculationUtils';
import { format } from 'date-fns';
import { Instrument, PricingFormula } from '@/types';
import { formulaToDisplayString } from '@/utils/formulaUtils';

interface PriceDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  tradeLegId: string;
  formula?: PricingFormula;
  mtmFormula?: PricingFormula;
  startDate: Date;
  endDate: Date;
  quantity: number;
}

const PriceDetails: React.FC<PriceDetailsProps> = ({
  isOpen,
  onClose,
  tradeLegId,
  formula,
  mtmFormula,
  startDate,
  endDate,
  quantity,
}) => {
  const [loading, setLoading] = useState(true);
  const [priceData, setPriceData] = useState<{
    price: number;
    periodType: PricingPeriodType;
    priceDetails: Record<
      Instrument,
      { average: number; prices: { date: Date; price: number }[] }
    >;
  } | null>(null);
  
  const [mtmPriceData, setMtmPriceData] = useState<{
    price: number;
    priceDetails: Record<
      Instrument,
      { price: number; date: Date | null }
    >;
  } | null>(null);
  
  const [mtmValue, setMtmValue] = useState<number>(0);

  useEffect(() => {
    const fetchPriceData = async () => {
      if (!isOpen || !formula) return;
      setLoading(true);

      try {
        // Fetch trade price data (using pricing period)
        const tradePriceResult = await calculateTradeLegPrice(
          formula,
          startDate,
          endDate
        );
        setPriceData(tradePriceResult);
        
        // Fetch MTM price data using most recent prices
        const formulaToUse = mtmFormula || formula;
        const mtmPriceResult = await calculateMTMPrice(formulaToUse);
        setMtmPriceData(mtmPriceResult);
          
        // Calculate MTM value
        const mtmVal = calculateMTMValue(
          tradePriceResult.price,
          mtmPriceResult.price,
          quantity,
          'buy' // Assuming buy for now, should be passed in from props
        );
        setMtmValue(mtmVal);
      } catch (error) {
        console.error('Error fetching price details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPriceData();
  }, [isOpen, formula, mtmFormula, startDate, endDate, quantity]);

  // Get the list of instruments used in the formula
  const getInstrumentsFromPriceData = (data: any) => {
    if (!data || !data.priceDetails) return [];
    return Object.keys(data.priceDetails);
  };

  const tradeInstruments = priceData ? getInstrumentsFromPriceData(priceData) : [];
  const mtmInstruments = mtmPriceData ? getInstrumentsFromPriceData(mtmPriceData) : [];

  // Organize price data by date for the consolidated table
  const getPricesByDate = () => {
    if (!priceData) return [];
    
    // Create a map of dates to all instrument prices for that date
    const dateMap = new Map<string, {date: Date, prices: {[instrument: string]: number}}>(); 
    
    // Populate the date map with all unique dates and their corresponding prices
    tradeInstruments.forEach(instrument => {
      const instrumentPrices = priceData.priceDetails[instrument as Instrument]?.prices || [];
      instrumentPrices.forEach(({ date, price }) => {
        const dateStr = date.toISOString().split('T')[0];
        
        if (!dateMap.has(dateStr)) {
          dateMap.set(dateStr, {
            date,
            prices: {
              [instrument]: price
            }
          });
        } else {
          const existingEntry = dateMap.get(dateStr)!;
          existingEntry.prices[instrument] = price;
        }
      });
    });
    
    // Convert the map to an array and sort by date (newest first)
    return Array.from(dateMap.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
  };
  
  // Get the average prices for each instrument
  const getAveragePrices = () => {
    const averages: {[instrument: string]: number} = {};
    
    if (priceData) {
      tradeInstruments.forEach(instrument => {
        averages[instrument] = priceData.priceDetails[instrument as Instrument]?.average || 0;
      });
    }
    
    return averages;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-7xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Price Details</DialogTitle>
          <DialogDescription>
            Detailed price information for the selected trade leg
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <p>Loading price details...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <Tabs defaultValue="trade">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="trade">Trade Price</TabsTrigger>
                {mtmPriceData && <TabsTrigger value="mtm">MTM Price</TabsTrigger>}
                {mtmPriceData && <TabsTrigger value="summary">MTM Summary</TabsTrigger>}
              </TabsList>
              
              <TabsContent value="trade">
                {priceData && (
                  <>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            Calculated Price
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            ${priceData.price.toFixed(2)}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            Pricing Period
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm">
                            {format(startDate, 'MMM d, yyyy')} -{' '}
                            {format(endDate, 'MMM d, yyyy')}
                          </div>
                          <Badge
                            className="mt-1"
                            variant={
                              priceData.periodType === 'historical'
                                ? 'default'
                                : priceData.periodType === 'current'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {priceData.periodType}
                          </Badge>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            Quantity
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {quantity.toLocaleString()} MT
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">
                        Pricing Table
                      </h3>

                      <Card>
                        <CardHeader className="pb-2 bg-muted/50">
                          <CardTitle className="text-sm font-medium">
                            <span>Consolidated Price Data</span>
                          </CardTitle>
                        </CardHeader>
                        <div className="max-h-[400px] overflow-auto">
                          <Table>
                            <TableHeader className="sticky top-0 bg-background z-10">
                              <TableRow>
                                <TableHead className="w-[120px]">Date</TableHead>
                                {tradeInstruments.map((instrument) => (
                                  <TableHead key={instrument} className="text-right">
                                    {instrument}
                                  </TableHead>
                                ))}
                                <TableHead className="text-right w-[300px]">
                                  <div className="flex items-start">
                                    <span className="font-semibold mr-1">Formula:</span>
                                    <span className="font-medium text-primary">
                                      {formula ? formulaToDisplayString(formula.tokens) : 'N/A'}
                                    </span>
                                  </div>
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {getPricesByDate().map((dateEntry) => (
                                <TableRow key={dateEntry.date.toISOString()}>
                                  <TableCell className="font-medium">
                                    {format(dateEntry.date, 'MMM d, yyyy')}
                                  </TableCell>
                                  {tradeInstruments.map((instrument) => (
                                    <TableCell key={instrument} className="text-right">
                                      ${(dateEntry.prices[instrument] || 0).toFixed(2)}
                                    </TableCell>
                                  ))}
                                  <TableCell className="text-right text-muted-foreground">
                                    -
                                  </TableCell>
                                </TableRow>
                              ))}
                              {/* Average row */}
                              <TableRow className="bg-muted/20 font-bold border-t-2">
                                <TableCell className="font-bold">Average</TableCell>
                                {tradeInstruments.map((instrument) => {
                                  const averages = getAveragePrices();
                                  return (
                                    <TableCell key={`avg-${instrument}`} className="text-right">
                                      ${(averages[instrument] || 0).toFixed(2)}
                                    </TableCell>
                                  );
                                })}
                                <TableCell className="text-right text-primary">
                                  ${priceData.price.toFixed(2)}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </Card>

                      {tradeInstruments.length === 0 && (
                        <div className="text-muted-foreground">
                          No price details available for this trade leg
                        </div>
                      )}
                    </div>
                  </>
                )}
              </TabsContent>
              
              {mtmPriceData && (
                <TabsContent value="mtm">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          MTM Price
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          ${mtmPriceData.price.toFixed(2)}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          Pricing Type
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge className="mt-1">
                          Latest Available Price
                        </Badge>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          Quantity
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {quantity.toLocaleString()} MT
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      MTM Components
                    </h3>

                    {mtmInstruments.length > 0 ? (
                      mtmInstruments.map((instrument) => (
                        <Card key={instrument} className="overflow-hidden">
                          <CardHeader className="bg-muted/50 pb-3">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-md">
                                {instrument}
                              </CardTitle>
                              <div className="font-medium">
                                Latest Price:{' '}
                                <span className="font-bold">
                                  $
                                  {mtmPriceData.priceDetails[
                                    instrument as Instrument
                                  ].price.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-3">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Price Date:</span>
                              <span>
                                {mtmPriceData.priceDetails[instrument as Instrument].date 
                                  ? format(mtmPriceData.priceDetails[instrument as Instrument].date as Date, 'MMM d, yyyy') 
                                  : 'N/A'}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground mt-2">
                              <p>This price represents the most recent available price for {instrument}.</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-muted-foreground">
                        No MTM price details available for this trade leg
                      </div>
                    )}
                  </div>
                </TabsContent>
              )}
              
              {mtmPriceData && (
                <TabsContent value="summary">
                  <div className="grid grid-cols-1 gap-4 mb-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>MTM Calculation Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell className="font-medium">Trade Price</TableCell>
                              <TableCell className="text-right">${priceData?.price.toFixed(2)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">MTM Price (Latest)</TableCell>
                              <TableCell className="text-right">${mtmPriceData.price.toFixed(2)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Quantity</TableCell>
                              <TableCell className="text-right">{quantity.toLocaleString()} MT</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Direction Factor</TableCell>
                              <TableCell className="text-right">-1 (Buy)</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Price Difference</TableCell>
                              <TableCell className="text-right">
                                ${(priceData?.price || 0 - mtmPriceData.price).toFixed(2)}
                              </TableCell>
                            </TableRow>
                            <TableRow className="font-bold text-lg">
                              <TableCell>MTM Value</TableCell>
                              <TableCell className={`text-right ${mtmValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ${mtmValue.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                        
                        <div className="mt-4 p-4 bg-muted rounded-md">
                          <p className="text-sm text-muted-foreground">
                            MTM Value = (Trade Price - MTM Price) × Quantity × Direction Factor
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">
                            MTM Value = (${priceData?.price.toFixed(2)} - ${mtmPriceData.price.toFixed(2)}) × {quantity.toLocaleString()} × -1 = ${mtmValue.toFixed(2)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PriceDetails;
