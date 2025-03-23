import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Edit, Trash2, X, Filter, ChevronRight, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useTrades } from '@/modules/trade/hooks';
import { usePaperTrades } from '@/hooks/usePaperTrades';
import { deleteTrade } from '@/modules/trade/utils/tradeDeleteUtils';

interface PaperTradeLeg {
  id: string;
  product: string;
  period: string;
  buySell: 'buy' | 'sell';
  quantity: number;
  price: number;
  broker?: string;
  relationshipType?: 'spread' | 'swap' | null;
  rightSide?: {
    product: string;
    quantity: number;
    price: number;
  } | null;
  mtmFormula?: any;
  formula?: any;
}

interface PaperTradeTableProps {
  legs: PaperTradeLeg[];
  onLegsChange: (legs: PaperTradeLeg[]) => void;
}

const PaperTradeTable: React.FC<PaperTradeTableProps> = ({ legs, onLegsChange }) => {
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  
  useEffect(() => {
    setAvailableMonths(getNextMonths(8));
  }, []);
  
  const handleAddLeg = () => {
    const newLeg: PaperTradeLeg = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      product: '',
      period: availableMonths[0] || '',
      buySell: 'buy',
      quantity: 0,
      price: 0,
      relationshipType: null,
      rightSide: null
    };
    
    onLegsChange([...legs, newLeg]);
  };
  
  const handleRemoveLeg = (legId: string) => {
    onLegsChange(legs.filter(leg => leg.id !== legId));
  };
  
  const handleLegChange = (legId: string, field: keyof PaperTradeLeg, value: any) => {
    const updatedLegs = legs.map(leg => {
      if (leg.id === legId) {
        return { ...leg, [field]: value };
      }
      return leg;
    });
    
    onLegsChange(updatedLegs);
  };
  
  const handleRightSideChange = (legId: string, field: string, value: any) => {
    const updatedLegs = legs.map(leg => {
      if (leg.id === legId) {
        const rightSide = leg.rightSide || { product: '', quantity: 0, price: 0 };
        return { 
          ...leg, 
          rightSide: { 
            ...rightSide, 
            [field]: value 
          } 
        };
      }
      return leg;
    });
    
    onLegsChange(updatedLegs);
  };
  
  const handleRelationshipTypeChange = (legId: string, value: 'spread' | 'swap' | null) => {
    const updatedLegs = legs.map(leg => {
      if (leg.id === legId) {
        if (value === null) {
          return { ...leg, relationshipType: null, rightSide: null };
        } else {
          const rightSide = leg.rightSide || { product: '', quantity: 0, price: 0 };
          return { ...leg, relationshipType: value, rightSide };
        }
      }
      return leg;
    });
    
    onLegsChange(updatedLegs);
  };
  
  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Buy/Sell</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead>Relationship</TableHead>
            <TableHead>Against Product</TableHead>
            <TableHead className="text-right">Against Qty</TableHead>
            <TableHead className="text-right">Against Price</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {legs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-6 text-muted-foreground">
                No trade legs added. Click "Add Leg" to start building your trade.
              </TableCell>
            </TableRow>
          ) : (
            legs.map((leg) => (
              <TableRow key={leg.id}>
                <TableCell>
                  <Select 
                    value={leg.product} 
                    onValueChange={(value) => handleLegChange(leg.id, 'product', value)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UCOME">UCOME</SelectItem>
                      <SelectItem value="FAME0">FAME0</SelectItem>
                      <SelectItem value="RME">RME</SelectItem>
                      <SelectItem value="HVO">HVO</SelectItem>
                      <SelectItem value="LSGO">LSGO</SelectItem>
                      <SelectItem value="ICE GASOIL FUTURES">ICE GASOIL FUTURES</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select 
                    value={leg.period} 
                    onValueChange={(value) => handleLegChange(leg.id, 'period', value)}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMonths.map((month) => (
                        <SelectItem key={month} value={month}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select 
                    value={leg.buySell} 
                    onValueChange={(value: 'buy' | 'sell') => handleLegChange(leg.id, 'buySell', value)}
                  >
                    <SelectTrigger className="w-[100px]">
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
                    value={leg.quantity || ''}
                    onChange={(e) => handleLegChange(leg.id, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-[100px] text-right"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={leg.price || ''}
                    onChange={(e) => handleLegChange(leg.id, 'price', parseFloat(e.target.value) || 0)}
                    className="w-[100px] text-right"
                  />
                </TableCell>
                <TableCell>
                  <Select 
                    value={leg.relationshipType || ''} 
                    onValueChange={(value) => handleRelationshipTypeChange(
                      leg.id, 
                      value === '' ? null : value as 'spread' | 'swap'
                    )}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      <SelectItem value="spread">Spread</SelectItem>
                      <SelectItem value="swap">Swap</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {leg.relationshipType && (
                    <Select 
                      value={leg.rightSide?.product || ''} 
                      onValueChange={(value) => handleRightSideChange(leg.id, 'product', value)}
                      disabled={!leg.relationshipType}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UCOME">UCOME</SelectItem>
                        <SelectItem value="FAME0">FAME0</SelectItem>
                        <SelectItem value="RME">RME</SelectItem>
                        <SelectItem value="HVO">HVO</SelectItem>
                        <SelectItem value="LSGO">LSGO</SelectItem>
                        <SelectItem value="ICE GASOIL FUTURES">ICE GASOIL FUTURES</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                <TableCell>
                  {leg.relationshipType && (
                    <Input
                      type="number"
                      value={leg.rightSide?.quantity || ''}
                      onChange={(e) => handleRightSideChange(leg.id, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-[100px] text-right"
                      disabled={!leg.relationshipType}
                    />
                  )}
                </TableCell>
                <TableCell>
                  {leg.relationshipType && (
                    <Input
                      type="number"
                      value={leg.rightSide?.price || ''}
                      onChange={(e) => handleRightSideChange(leg.id, 'price', parseFloat(e.target.value) || 0)}
                      className="w-[100px] text-right"
                      disabled={!leg.relationshipType}
                    />
                  )}
                </TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleRemoveLeg(leg.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      
      <div className="flex justify-end">
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleAddLeg}
          className="flex items-center"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Leg
        </Button>
      </div>
    </div>
  );
};

export default PaperTradeTable;
