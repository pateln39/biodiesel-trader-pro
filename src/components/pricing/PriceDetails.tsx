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
import { Instrument, PricingFormula, PriceDetail, MTMPriceDetail, PhysicalTradeLeg } from '@/types';
import { formulaToDisplayString } from '@/utils/formulaUtils';
import { supabase } from '@/integrations/supabase/client';

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
}) => {
  const [loading, setLoading] = useState(true);
  const [priceData, setPriceData] = useState<{
    price: number;
    periodType: PricingPeriodType;
    priceDetails: PriceDetail;
  } | null>(null);
  
  const [mtmPriceData, setMtmPriceData] = useState<{
    price: number;
    priceDetails: MTMPriceDetail;
  } | null>(null);
  
  const [mtmValue, setMtmValue] = useState<number>(0);
  const [isEfpTrade, setIsEfpTrade] = useState<boolean>(false);
  const [efpData, setEfpData] = useState<any>(null);

  useEffect(() => {
    const fetchTradeData = async () => {
      if (!isOpen || !tradeLegId) return;

      try {
        // Fetch the trade leg to determine if it's an EFP trade
        const { data, error } = await supabase
          .from('trade_legs')
          .select('pricing_type, efp_premium, efp_agreed_status, efp_fixed_value, efp_designated_month')
          .eq('id', tradeLegId)
          .maybeSingle();

        if (error) {
          console.error('Error fetching trade leg:', error);
        } else if (data && data.pricing_type === 'efp') {
          setIsEfpTrade(true);
          setEfpData(data);
        }
      } catch (error) {
        console.error('Error in fetchTradeData:', error);
      }
    };

    fetchTradeData();
  }, [isOpen, tradeLegId]);

  useEffect(() => {
    const fetchPriceData = async () => {
      if (!isOpen) return;
      setLoading(true);

      try {
        // Ensure start date is before end date
        const validStartDate = startDate < endDate ? startDate : endDate;
        const validEndDate = endDate > startDate ? endDate : startDate;

        let tradePriceResult;

        if (isEfpTrade && efpData) {
          // Create a leg object with EFP properties
          const efpLeg: PhysicalTradeLeg = {
            id: tradeLegId,
            legReference: '',
            parentTradeId: '',
            buySell: buySell,
            product: 'GASOIL', // Placeholder
            quantity: quantity,
            pricingPeriodStart: validStartDate,
            pricingPeriodEnd: validEndDate,
            pricingType: 'efp',
            efpPremium: efpData.efp_premium,
            efpAgreedStatus: efpData.efp_agreed_status,
            efpFixedValue: efpData.efp_fixed_value,
            efpDesignatedMonth: efpData.efp_designated_month,
            formula: formula
          };

          tradePriceResult = await calculateTradeLegPrice(
            efpLeg,
            validStartDate,
            validEndDate
          );
        } else if (formula) {
          tradePriceResult = await calculateTradeLegPrice(
            formula,
            validStartDate,
            validEndDate
          );
        } else {
          throw new Error('No formula available for price calculation');
        }

        setPriceData(tradePriceResult);
        
        let mtmPriceResult;
        
        if (isEfpTrade && efpData) {
          // Create a leg object with EFP properties for MTM
          const efpLeg: PhysicalTradeLeg = {
            id: tradeLegId,
            legReference: '',
            parentTradeId: '',
            buySell: buySell,
            product: 'GASOIL', // Placeholder
            quantity: quantity,
            pricingType: 'efp',
            efpPremium: efpData.efp_premium,
            efpAgreedStatus: efpData.efp_agreed_status,
            efpFixedValue: efpData.efp_fixed_value,
            efpDesignatedMonth: efpData.efp_designated_month,
            formula: formula
          };
          
          mtmPriceResult = await calculateMTMPrice(efpLeg);
        } else {
          const formulaToUse = mtmFormula || formula;
          mtmPriceResult = await calculateMTMPrice(formulaToUse);
        }
        
        setMtmPriceData({
          price: mtmPriceResult.price,
          priceDetails: mtmPriceResult.details
        });
          
        const mtmVal = calculateMTMValue(
          tradePriceResult.price,
          mtmPriceResult.price,
          quantity,
          buySell
        );
        setMtmValue(mtmVal);
      } catch (error) {
        console.error('Error fetching price details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPriceData();
  }, [isOpen, formula, mtmFormula, startDate, endDate, quantity, buySell, isEfpTrade, efpData, tradeLegId]);

  const getInstrumentsFromPriceData = (data: any) => {
    if (!data || !data.priceDetails || !data.priceDetails.instruments) return [];
    return Object.keys(data.priceDetails.instruments);
  };

  const tradeInstruments = priceData ? getInstrumentsFromPriceData(priceData) : [];
  const mtmInstruments = mtmPriceData ? getInstrumentsFromPriceData(mtmPriceData) : [];

  const getPricesByDate = () => {
    if (!priceData) return [];
    
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
            formulaPrice: 0 // Initialize formula price
          });
        } else {
          const existingEntry = dateMap.get(dateStr)!;
          existingEntry.prices[instrument] = price;
        }
      });
    });
    
    // Calculate formula price for each date
    if (formula) {
      const entries = Array.from(dateMap.values());
      
      entries.forEach(entry => {
        const dailyInstrumentPrices: Record<Instrument, number> = {} as Record<Instrument, number>;
        
        // Fill in the instrument prices for this day
        tradeInstruments.forEach(instrument => {
          dailyInstrumentPrices[instrument as Instrument] = entry.prices[instrument] || 0;
        });
        
        // Apply the formula to get the daily price
        entry.formulaPrice = applyPricingFormula(formula, dailyInstrumentPrices);
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
                          {isEfpTrade && (
                            <Badge variant="outline" className="mt-1">
                              EFP {efpData?.efp_agreed_status ? 'Agreed' : 'Unagreed'}
                            </Badge>
                          )}
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

                      {isEfpTrade ? (
                        // Special display for EFP trades
                        <Card>
                          <CardHeader className="pb-2 bg-muted/50">
                            <CardTitle className="text-sm font-medium">
                              <span>EFP Price Components</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Component</TableHead>
                                  <TableHead className="text-right">Value</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {efpData?.efp_agreed_status ? (
                                  <>
                                    <TableRow>
                                      <TableCell className="font-medium">Fixed Value</TableCell>
                                      <TableCell className="text-right">${efpData?.efp_fixed_value?.toFixed(2) || '0.00'}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-medium">Premium</TableCell>
                                      <TableCell className="text-right">${efpData?.efp_premium?.toFixed(2) || '0.00'}</TableCell>
                                    </TableRow>
                                  </>
                                ) : (
                                  <>
                                    <TableRow>
                                      <TableCell className="font-medium">ICE GASOIL FUTURES</TableCell>
                                      <TableCell className="text-right">
                                        ${(priceData.price - (efpData?.efp_premium || 0)).toFixed(2)}
                                      </TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-medium">Premium</TableCell>
                                      <TableCell className="text-right">${efpData?.efp_premium?.toFixed(2) || '0.00'}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-medium">Designated Month</TableCell>
                                      <TableCell className="text-right">{efpData?.efp_designated_month || 'N/A'}</TableCell>
                                    </TableRow>
                                  </>
                                )}
                                <TableRow className="bg-muted/20 font-bold border-t-2">
                                  <TableCell className="font-bold">Total Price</TableCell>
                                  <TableCell className="text-right text-primary">${priceData.price.toFixed(2)}</TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      ) : (
                        // Standard formula pricing display
                        tradeInstruments.length > 0 ? (
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
                                      {formula ? formulaToDisplayString(formula.tokens) : 'Formula N/A'}
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
                        )
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
