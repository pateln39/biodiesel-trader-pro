
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { BuySell, Product } from '@/types/trade';

export interface TradeLeg {
  id: string;
  side: 'A' | 'B';
  buySell: BuySell;
  product: Product;
  pricingPeriodStart: Date;
  pricingPeriodEnd: Date;
  price: number;
  quantity: number;
}

export interface MTMFormula {
  id: string;
  formula: string;
  pricingPeriodStart: Date;
  pricingPeriodEnd: Date;
}

interface PaperTradeTableProps {
  tradeLegs: TradeLeg[];
  mtmFormulas: MTMFormula[];
  onAddLegA: () => void;
  onAddLegB: () => void;
  onAddMTMFormula: () => void;
  onRemoveLeg: (id: string) => void;
  onRemoveMTMFormula: (id: string) => void;
  onUpdateLeg: (id: string, field: keyof TradeLeg, value: any) => void;
  onUpdateMTMFormula: (id: string, field: keyof MTMFormula, value: any) => void;
}

const PaperTradeTable: React.FC<PaperTradeTableProps> = ({
  tradeLegs,
  mtmFormulas,
  onAddLegA,
  onAddLegB,
  onAddMTMFormula,
  onRemoveLeg,
  onRemoveMTMFormula,
  onUpdateLeg,
  onUpdateMTMFormula
}) => {
  // Filter legs by side
  const legsA = tradeLegs.filter(leg => leg.side === 'A');
  const legsB = tradeLegs.filter(leg => leg.side === 'B');
  
  // Get the max number of rows needed for the table
  const maxRows = Math.max(legsA.length, legsB.length, mtmFormulas.length);
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Trade Table</h3>
        <div className="flex space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={onAddLegA}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Leg A
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={onAddLegB}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Leg B
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={onAddMTMFormula}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add MTM Formula
          </Button>
        </div>
      </div>
      
      <div className="border rounded-md overflow-auto">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead colSpan={4} className="text-center border-r">LEG A</TableHead>
              <TableHead colSpan={4} className="text-center border-r">LEG B</TableHead>
              <TableHead colSpan={2} className="text-center">MTM</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
            <TableRow>
              <TableHead className="w-[120px]">Product</TableHead>
              <TableHead className="w-[80px]">Buy/Sell</TableHead>
              <TableHead className="w-[120px]">Quantity</TableHead>
              <TableHead className="w-[150px] border-r">Period</TableHead>
              
              <TableHead className="w-[120px]">Product</TableHead>
              <TableHead className="w-[80px]">Buy/Sell</TableHead>
              <TableHead className="w-[120px]">Quantity</TableHead>
              <TableHead className="w-[150px] border-r">Period</TableHead>
              
              <TableHead className="w-[150px]">Formula</TableHead>
              <TableHead className="w-[150px]">Period</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: maxRows }).map((_, rowIndex) => {
              const legA = legsA[rowIndex];
              const legB = legsB[rowIndex];
              const mtmFormula = mtmFormulas[rowIndex];
              
              return (
                <TableRow key={rowIndex}>
                  {/* LEG A */}
                  {legA ? (
                    <>
                      <TableCell>
                        <Select 
                          value={legA.product} 
                          onValueChange={(value) => onUpdateLeg(legA.id, 'product', value as Product)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Product" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FAME0">FAME0</SelectItem>
                            <SelectItem value="RME">RME</SelectItem>
                            <SelectItem value="UCOME">UCOME</SelectItem>
                            <SelectItem value="UCOME-5">UCOME-5</SelectItem>
                            <SelectItem value="RME DC">RME DC</SelectItem>
                            <SelectItem value="HVO">HVO</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={legA.buySell} 
                          onValueChange={(value) => onUpdateLeg(legA.id, 'buySell', value as BuySell)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Buy/Sell" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="buy">Buy</SelectItem>
                            <SelectItem value="sell">Sell</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          value={legA.quantity || ''} 
                          onChange={(e) => onUpdateLeg(legA.id, 'quantity', Number(e.target.value))} 
                        />
                      </TableCell>
                      <TableCell className="border-r">
                        <div className="flex flex-col space-y-2">
                          <Label className="text-xs">Start</Label>
                          <DatePicker 
                            date={legA.pricingPeriodStart}
                            setDate={(date) => onUpdateLeg(legA.id, 'pricingPeriodStart', date)}
                          />
                          <Label className="text-xs">End</Label>
                          <DatePicker 
                            date={legA.pricingPeriodEnd}
                            setDate={(date) => onUpdateLeg(legA.id, 'pricingPeriodEnd', date)}
                          />
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <TableCell colSpan={4} className="border-r text-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={onAddLegA}
                        className="h-20 w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Leg A
                      </Button>
                    </TableCell>
                  )}
                  
                  {/* LEG B */}
                  {legB ? (
                    <>
                      <TableCell>
                        <Select 
                          value={legB.product} 
                          onValueChange={(value) => onUpdateLeg(legB.id, 'product', value as Product)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Product" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FAME0">FAME0</SelectItem>
                            <SelectItem value="RME">RME</SelectItem>
                            <SelectItem value="UCOME">UCOME</SelectItem>
                            <SelectItem value="UCOME-5">UCOME-5</SelectItem>
                            <SelectItem value="RME DC">RME DC</SelectItem>
                            <SelectItem value="HVO">HVO</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={legB.buySell} 
                          onValueChange={(value) => onUpdateLeg(legB.id, 'buySell', value as BuySell)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Buy/Sell" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="buy">Buy</SelectItem>
                            <SelectItem value="sell">Sell</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          value={legB.quantity || ''} 
                          onChange={(e) => onUpdateLeg(legB.id, 'quantity', Number(e.target.value))} 
                        />
                      </TableCell>
                      <TableCell className="border-r">
                        <div className="flex flex-col space-y-2">
                          <Label className="text-xs">Start</Label>
                          <DatePicker 
                            date={legB.pricingPeriodStart}
                            setDate={(date) => onUpdateLeg(legB.id, 'pricingPeriodStart', date)}
                          />
                          <Label className="text-xs">End</Label>
                          <DatePicker 
                            date={legB.pricingPeriodEnd}
                            setDate={(date) => onUpdateLeg(legB.id, 'pricingPeriodEnd', date)}
                          />
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <TableCell colSpan={4} className="border-r text-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={onAddLegB}
                        className="h-20 w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Leg B
                      </Button>
                    </TableCell>
                  )}
                  
                  {/* MTM Formula */}
                  {mtmFormula ? (
                    <>
                      <TableCell>
                        <Input 
                          value={mtmFormula.formula} 
                          onChange={(e) => onUpdateMTMFormula(mtmFormula.id, 'formula', e.target.value)} 
                          placeholder="MTM Formula"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-2">
                          <Label className="text-xs">Start</Label>
                          <DatePicker 
                            date={mtmFormula.pricingPeriodStart}
                            setDate={(date) => onUpdateMTMFormula(mtmFormula.id, 'pricingPeriodStart', date)}
                          />
                          <Label className="text-xs">End</Label>
                          <DatePicker 
                            date={mtmFormula.pricingPeriodEnd}
                            setDate={(date) => onUpdateMTMFormula(mtmFormula.id, 'pricingPeriodEnd', date)}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemoveMTMFormula(mtmFormula.id)}
                          className="h-9 w-9"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </>
                  ) : (
                    <TableCell colSpan={3} className="text-center">
                      {!mtmFormulas.length && rowIndex === 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={onAddMTMFormula}
                          className="h-20 w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add MTM Formula
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PaperTradeTable;
