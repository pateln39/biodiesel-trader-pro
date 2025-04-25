
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, AlertTriangle } from 'lucide-react';
import { PaperTrade } from '@/types/paper';
import { usePaperTrades } from '@/hooks/usePaperTrades';
import { toast } from 'sonner';
import { PaperMTMPosition, calculatePaperTradePrice, calculatePaperMTMPrice, calculatePaperMTMValue, getMonthDates, getPeriodType } from '@/utils/paperTradeMTMUtils';
import PaperPriceDetails from './PaperPriceDetails';
import ProductToken from '@/components/operations/storage/ProductToken';

const PaperMTMTable: React.FC = () => {
  const { paperTrades, isLoading: tradesLoading, refetchPaperTrades } = usePaperTrades();
  const [selectedLeg, setSelectedLeg] = useState<{
    legId: string;
    product: string;
    rightSide?: {
      product: string;
      price?: number;
    };
    period: string;
    quantity: number;
    buySell: 'buy' | 'sell';
    relationshipType: string;
    price: number;
  } | null>(null);
  const [errorLegs, setErrorLegs] = useState<string[]>([]);

  const { data: mtmPositions, isLoading: calculationLoading } = useQuery({
    queryKey: ['paperMtmPositions', paperTrades],
    queryFn: async () => {
      if (!paperTrades || paperTrades.length === 0) return [];
      
      const positions: PaperMTMPosition[] = [];
      const today = new Date();
      const errors: string[] = [];
      
      console.log(`Processing ${paperTrades.length} paper trades with ${paperTrades.reduce((acc, t) => acc + t.legs.length, 0)} total legs`);
      
      for (const trade of paperTrades) {
        for (const leg of trade.legs) {
          try {
            // Skip legs without period
            if (!leg.period) {
              console.warn(`Skipping leg ${leg.legReference} without period`);
              continue;
            }
            
            const dates = getMonthDates(leg.period);
            if (!dates) {
              console.warn(`Invalid period format for leg ${leg.legReference}: ${leg.period}`);
              continue;
            }
            
            const { startDate, endDate } = dates;
            const periodType = getPeriodType(startDate, endDate, today);
            
            console.log(`Processing leg ${leg.legReference} with product ${leg.product}, period ${leg.period}`);
            
            // Calculate trade price (fixed price or difference)
            const tradePrice = calculatePaperTradePrice(leg);
            
            // Calculate MTM price based on period type
            const mtmPrice = await calculatePaperMTMPrice(leg, today);
            
            if (mtmPrice === null) {
              console.warn(`Could not calculate MTM price for leg ${leg.legReference}`);
              errors.push(leg.legReference);
              continue;
            }
            
            // Calculate MTM value
            const mtmValue = calculatePaperMTMValue(
              tradePrice,
              mtmPrice,
              leg.quantity,
              leg.buySell as 'buy' | 'sell'
            );
            
            positions.push({
              legId: leg.id,
              tradeRef: trade.tradeReference,
              legReference: leg.legReference,
              buySell: leg.buySell,
              product: leg.product,
              quantity: leg.quantity,
              period: leg.period,
              relationshipType: leg.relationshipType,
              calculatedPrice: tradePrice,
              mtmCalculatedPrice: mtmPrice,
              mtmValue,
              periodType,
              rightSide: leg.rightSide
            });
          } catch (error) {
            console.error(`Error calculating MTM for paper leg ${leg.id}:`, error);
            toast.error(`Error calculating MTM for paper leg ${leg.legReference}`);
            errors.push(leg.legReference);
          }
        }
      }
      
      setErrorLegs(errors);
      
      if (positions.length === 0 && paperTrades.length > 0) {
        toast.error('Could not calculate MTM for any paper trades', {
          description: 'Please check the console logs for details'
        });
      } else if (errors.length > 0) {
        toast.warning(`MTM calculation failed for ${errors.length} legs`, {
          description: 'Some trades were skipped due to errors'
        });
      }
      
      return positions;
    },
    enabled: !tradesLoading && paperTrades.length > 0
  });

  const handleViewPrices = (leg: PaperMTMPosition) => {
    setSelectedLeg({
      legId: leg.legId,
      product: leg.product,
      rightSide: leg.rightSide,
      period: leg.period,
      quantity: leg.quantity,
      buySell: leg.buySell as 'buy' | 'sell',
      relationshipType: leg.relationshipType,
      price: leg.calculatedPrice
    });
  };

  const totalMtm = mtmPositions?.reduce((sum, pos) => sum + (pos.mtmValue || 0), 0) || 0;

  if (tradesLoading || calculationLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        <p>Loading paper MTM positions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-right">
        <div className="text-sm font-medium">Total Paper MTM Position</div>
        <div className={`text-2xl font-bold ${totalMtm >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          ${totalMtm.toFixed(2)}
        </div>
      </div>
      
      {errorLegs.length > 0 && (
        <div className="rounded-md bg-amber-50 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">
                MTM calculation failed for {errorLegs.length} leg(s)
              </h3>
              <div className="mt-2 text-sm text-amber-700">
                <p>
                  Some trades could not be processed. This might be due to missing price data or configuration issues.
                  Check the browser console for detailed logs.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {mtmPositions && mtmPositions.length > 0 ? (
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
                  {position.tradeRef}
                </TableCell>
                <TableCell>
                  <ProductToken product={position.product} value="" showTooltip={true} />
                  <Badge variant={position.relationshipType === 'FP' ? 'default' : 
                           position.relationshipType === 'DIFF' ? 'secondary' : 'outline'} 
                         className="ml-2">
                    {position.relationshipType}
                  </Badge>
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
                    position.periodType === 'past' ? 'default' : 
                    position.periodType === 'current' ? 'secondary' : 
                    'outline'
                  }>
                    {position.period} ({position.periodType})
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
        <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
          <p className="mb-2">No paper MTM positions available.</p>
          {paperTrades.length > 0 ? (
            <p>There was an issue calculating MTM values. Check console logs for details.</p>
          ) : (
            <p>Add paper trades to see data here.</p>
          )}
        </div>
      )}

      {selectedLeg && (
        <PaperPriceDetails
          isOpen={!!selectedLeg}
          onClose={() => setSelectedLeg(null)}
          tradeLegId={selectedLeg.legId}
          product={selectedLeg.product}
          rightSide={selectedLeg.rightSide}
          period={selectedLeg.period}
          quantity={selectedLeg.quantity}
          buySell={selectedLeg.buySell}
          relationshipType={selectedLeg.relationshipType}
          price={selectedLeg.price}
        />
      )}
    </div>
  );
};

export default PaperMTMTable;
