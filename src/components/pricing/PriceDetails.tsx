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
  PricingPeriodType,
  applyPricingFormula 
} from '@/utils/priceCalculationUtils';
import { format } from 'date-fns';
import { Instrument } from '@/types/common';
import { PricingFormula, PriceDetail as PricingPriceDetail, MTMPriceDetail as PricingMTMPriceDetail } from '@/types/pricing';
import { formulaToDisplayString } from '@/utils/formulaUtils';
import { PhysicalTradeLeg } from '@/types/physical';

interface PriceDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  tradeLegId: string;
  formula?: PricingFormula;
  mtmFormula?: PricingFormula;
  startDate: Date;
  endDate: Date;
  quantity: number;
  buySell: 'buy' | 'sell';
  pricingType?: string;
  efpPremium?: number;
  efpAgreedStatus?: boolean;
  efpFixedValue?: number;
  mtmFutureMonth?: string;
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
  buySell,
  pricingType,
  efpPremium,
  efpAgreedStatus,
  efpFixedValue,
  mtmFutureMonth,
}) => {
  const [loading, setLoading] = useState(true);
  const [priceData, setPriceData] = useState<{
    price: number;
    periodType: PricingPeriodType;
    priceDetails: PricingPriceDetail;
  } | null>(null);
  
  const [mtmPriceData, setMtmPriceData] = useState<{
    price: number;
    priceDetails: PricingMTMPriceDetail;
  } | null>(null);
  
  const [mtmValue, setMtmValue] = useState<number>(0);
  const isEfp = pricingType === 'efp';

  useEffect(() => {
    const fetchPriceData = async () => {
      if (!isOpen) return;
      setLoading(true);

      try {
        // Ensure start date is before end date
        const validStartDate = startDate < endDate ? startDate : endDate;
        const validEndDate = endDate > startDate ? endDate : startDate;

        // Handle EFP trades differently
        if (isEfp && efpPremium !== undefined) {
          // Create an EFP trade leg object
          const efpLeg: PhysicalTradeLeg = {
            id: tradeLegId,
            parentTradeId: '',
            legReference: '',
            buySell,
            product: '',
            quantity,
            loadingPeriodStart: new Date(),
            loadingPeriodEnd: new Date(),
            pricingPeriodStart: validStartDate,
            pricingPeriodEnd: validEndDate,
            pricingType: 'efp',
            efpPremium,
            efpAgreedStatus,
            efpFixedValue,
            mtmFutureMonth
          } as PhysicalTradeLeg;
          
          // Calculate trade price for EFP
          const tradePriceResult = await calculateTradeLegPrice(
            efpLeg,
            validStartDate,
            validEndDate,
            mtmFutureMonth
          );
          setPriceData(tradePriceResult as any);
          
          // Use mtmFormula if available, otherwise use the EFP leg
          const formulaToUse = mtmFormula || efpLeg;
          const mtmPriceResult = await calculateMTMPrice(
            formulaToUse,
            validStartDate,
            validEndDate,
            mtmFutureMonth
          );
          
          setMtmPriceData({
            price: mtmPriceResult.price,
            priceDetails: mtmPriceResult.details as any
          });
          
          const mtmVal = calculateMTMValue(
            tradePriceResult.price,
            mtmPriceResult.price,
            quantity,
            buySell
          );
          setMtmValue(mtmVal);
        }
        // Standard formula trades
        else if (formula) {
          const tradePriceResult = await calculateTradeLegPrice(
            formula,
            validStartDate,
            validEndDate,
            mtmFutureMonth
          );
          setPriceData(tradePriceResult as any);
          
          const formulaToUse = mtmFormula || formula;
          const mtmPriceResult = await calculateMTMPrice(
            formulaToUse,
            validStartDate,
            validEndDate,
            mtmFutureMonth
          );
          setMtmPriceData({
            price: mtmPriceResult.price,
            priceDetails: mtmPriceResult.details as any
          });
            
          const mtmVal = calculateMTMValue(
            tradePriceResult.price,
            mtmPriceResult.price,
            quantity,
            buySell
          );
          setMtmValue(mtmVal);
        }
      } catch (error) {
        console.error('Error fetching price details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPriceData();
  }, [isOpen, formula, mtmFormula, startDate, endDate, quantity, buySell, isEfp, efpPremium, efpAgreedStatus, efpFixedValue, tradeLegId, mtmFutureMonth]);

  const getInstrumentsFromPriceData = (data: any) => {
    if (!data || !data.priceDetails || !data.priceDetails.instruments) return [];
    return Object.keys(data.priceDetails.instruments);
  };

  const tradeInstruments = priceData ? getInstrumentsFromPriceData(priceData) : [];
  const mtmInstruments = mtmPriceData ? getInstrumentsFromPriceData(mtmPriceData) : [];

  const isEfpWithFixedValues = isEfp && efpAgreedStatus && efpFixedValue !== undefined;

  const getPricesByDate = () => {
    if (!priceData) return [];
    
    if (isEfpWithFixedValues) {
      return [];
    }
    
    const dateMap = new Map<string, {date: Date, prices: {[instrument: string]: number}, formulaPrice: number}>();
    
    tradeInstruments.forEach(instrument => {
      if (!priceData.priceDetails.instruments[instrument as Instrument]) return;
      
      const instrumentPrices = priceData.priceDetails.instruments[instrument as Instrument]?.prices || [];
      instrumentPrices.forEach(({ date, price }) => {
        const dateStr = date.toISOString().split('T')[0];
        
        if (!dateMap.has(dateStr)) {
          dateMap.set(dateStr, {
            date,
            prices: {
              [instrument]: price
            },
            formulaPrice: 0
          });
        } else {
          const existingEntry = dateMap.get(dateStr)!;
          existingEntry.prices[instrument] = price;
        }
      });
    });
    
    if (formula && !isEfp) {
      const entries = Array.from(dateMap.values());
      
      entries.forEach(entry => {
        const dailyInstrumentPrices: Record<Instrument, number> = {} as Record<Instrument, number>;
        
        tradeInstruments.forEach(instrument => {
          dailyInstrumentPrices[instrument as Instrument] = entry.prices[instrument] || 0;
        });
        
        entry.formulaPrice = applyPricingFormula(formula, dailyInstrumentPrices);
      });
      
      return entries.sort((a, b) => b.date.getTime() - a.date.getTime());
    } else if (isEfp && !isEfpWithFixedValues) {
      const entries = Array.from(dateMap.values());
      
      entries.forEach(entry => {
        const instrument = tradeInstruments[0];
        if (instrument && entry.prices[instrument]) {
          entry.formulaPrice = entry.prices[instrument] + (efpPremium || 0);
        }
      });
      
      return entries.sort((a, b) => b.date.getTime() - a.date.getTime());
    }
    
    return Array.from(dateMap.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  const getAveragePrices = () => {
    const averages: {[instrument: string]: number} = {};
    
    if (priceData && priceData.priceDetails.instruments) {
      tradeInstruments.forEach(instrument => {
        averages[instrument] = priceData.priceDetails.instruments[instrument as Instrument]?.average || 0;
      });
    }
    
    return averages;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-7xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Price Details
            {isEfp && (
              <Badge variant="outline" className="ml-2">EFP</Badge>
            )}
            {mtmFutureMonth && (
              <Badge variant="secondary" className="ml-2">Future: {mtmFutureMonth}</Badge>
            )}
          </DialogTitle>
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

                    {isEfp && priceData.priceDetails.fixedComponents && (
                      <Card className="mb-4">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-md font-medium">
                            EFP Price Components
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableBody>
                              {priceData.priceDetails.fixedComponents.map((component, idx) => (
                                <TableRow key={idx}>
                                  <TableCell className="font-medium">{component.displayValue}</TableCell>
                                  <TableCell className="text-right">${component.value.toFixed(2)}</TableCell>
                                </TableRow>
                              ))}
                              <TableRow className="font-bold">
                                <TableCell>Final Price</TableCell>
                                <TableCell className="text-right">${priceData.price.toFixed(2)}</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    )}

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">
                        {isEfp ? 'EFP Price Details' : 'Pricing Table'}
                      </h3>

                      {isEfpWithFixedValues ? (
                        <Card className="bg-muted/10 p-4">
                          <p>This is an agreed EFP trade with a fixed price.</p>
                          <p className="font-medium mt-2">
                            Fixed Value: ${efpFixedValue?.toFixed(2)} + Premium: ${efpPremium?.toFixed(2)} = ${(efpFixedValue || 0) + (efpPremium || 0)}
                          </p>
                        </Card>
                      ) : tradeInstruments.length > 0 ? (
                        <Card>
                          <CardHeader className="pb-2 bg-muted/50">
                            <CardTitle className="text-sm font-medium">
                              <span>
                                {isEfp ? 
                                  'ICE GASOIL FUTURES Prices + Premium' : 
                                  'Consolidated Price Data'
                                }
                              </span>
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
                                    {isEfp ? 
                                      `Price + Premium (${efpPremium?.toFixed(2) || 0})` : 
                                      formula ? formulaToDisplayString(formula.tokens) : 'Formula N/A'
                                    }
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
                                    <TableCell className="text-right">
                                      ${dateEntry.formulaPrice.toFixed(2)}
                                    </TableCell>
                                  </TableRow>
                                ))}
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
                      ) : (
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

                    {isEfp && mtmPriceData.priceDetails.fixedComponents && (
                      <Card className="mb-4">
                        <CardHeader className="bg-muted/50 pb-3">
                          <CardTitle className="text-md">
                            EFP Components
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableBody>
                              {mtmPriceData.priceDetails.fixedComponents.map((component, idx) => (
                                <TableRow key={idx}>
                                  <TableCell className="font-medium">{component.displayValue}</TableCell>
                                  <TableCell className="text-right">${component.value.toFixed(2)}</TableCell>
                                </TableRow>
                              ))}
                              <TableRow className="font-bold">
                                <TableCell>MTM Price</TableCell>
                                <TableCell className="text-right">${mtmPriceData.price.toFixed(2)}</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    )}

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
                                  {mtmPriceData.priceDetails.instruments[
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
                                {mtmPriceData.priceDetails.instruments[instrument as Instrument].date 
                                  ? format(mtmPriceData.priceDetails.instruments[instrument as Instrument].date as Date, 'MMM d, yyyy') 
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
                              <TableCell className="text-right">
                                {buySell === 'buy' ? '-1 (Buy)' : '+1 (Sell)'}
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
                            MTM Value = (${priceData?.price.toFixed(2)} - ${mtmPriceData.price.toFixed(2)}) × {quantity.toLocaleString()} × {buySell === 'buy' ? '-1' : '+1'} = ${mtmValue.toFixed(2)}
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
