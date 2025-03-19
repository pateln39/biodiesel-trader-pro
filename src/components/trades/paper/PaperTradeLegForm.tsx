
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { PaperTradeLeg } from '@/types/paper';
import FormulaBuilder from '../FormulaBuilder';
import { createEmptyFormula } from '@/utils/formulaUtils';
import { Product, BuySell } from '@/types/trade';
import { Badge } from '@/components/ui/badge';

interface PaperTradeLegFormProps {
  leg: PaperTradeLeg;
  onChange: (leg: PaperTradeLeg) => void;
  onRemove?: () => void;
  broker: string;
  side: 'A' | 'B';
  disabled?: boolean;
}

const PaperTradeLegForm: React.FC<PaperTradeLegFormProps> = ({
  leg,
  onChange,
  onRemove,
  broker,
  side,
  disabled = false
}) => {
  const updateField = <K extends keyof PaperTradeLeg>(field: K, value: PaperTradeLeg[K]) => {
    onChange({ ...leg, [field]: value });
  };
  
  return (
    <Card className={`border ${disabled ? 'opacity-70' : ''}`}>
      <CardContent className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Badge variant={side === 'A' ? 'default' : 'secondary'}>Leg {side}</Badge>
            <div className="text-sm font-medium">{leg.legReference}</div>
          </div>
          {onRemove && (
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              onClick={onRemove}
              className="text-destructive h-8 w-8 p-0"
              disabled={disabled}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`buySell-${leg.id}`}>Buy/Sell</Label>
            <Select 
              value={leg.buySell} 
              onValueChange={(value) => updateField('buySell', value as BuySell)}
              disabled={disabled}
            >
              <SelectTrigger id={`buySell-${leg.id}`}>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="sell">Sell</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`product-${leg.id}`}>Product</Label>
            <Select 
              value={leg.product} 
              onValueChange={(value) => updateField('product', value as Product)}
              disabled={disabled}
            >
              <SelectTrigger id={`product-${leg.id}`}>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UCOME">UCOME</SelectItem>
                <SelectItem value="FAME0">FAME0</SelectItem>
                <SelectItem value="RME">RME</SelectItem>
                <SelectItem value="UCOME-5">UCOME-5</SelectItem>
                <SelectItem value="RME DC">RME DC</SelectItem>
                <SelectItem value="LSGO">LSGO</SelectItem>
                <SelectItem value="ICE GASOIL FUTURES">ICE GASOIL FUTURES</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={`instrument-${leg.id}`}>Instrument</Label>
          <Select 
            value={leg.instrument} 
            onValueChange={(value) => updateField('instrument', value)}
            disabled={disabled}
          >
            <SelectTrigger id={`instrument-${leg.id}`}>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Argus UCOME">Argus UCOME</SelectItem>
              <SelectItem value="Argus RME">Argus RME</SelectItem>
              <SelectItem value="Argus FAME0">Argus FAME0</SelectItem>
              <SelectItem value="Platts LSGO">Platts LSGO</SelectItem>
              <SelectItem value="Platts diesel">Platts diesel</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Period Start</Label>
            <DatePicker 
              date={new Date(leg.pricingPeriodStart)} 
              setDate={(date) => updateField('pricingPeriodStart', date)}
              disabled={disabled}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Period End</Label>
            <DatePicker 
              date={new Date(leg.pricingPeriodEnd)} 
              setDate={(date) => updateField('pricingPeriodEnd', date)}
              disabled={disabled}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`quantity-${leg.id}`}>Quantity (MT)</Label>
            <Input 
              id={`quantity-${leg.id}`} 
              type="number" 
              value={leg.quantity} 
              onChange={(e) => updateField('quantity', Number(e.target.value))}
              disabled={disabled}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`price-${leg.id}`}>Fixed Price (Optional)</Label>
            <Input 
              id={`price-${leg.id}`} 
              type="number" 
              value={leg.price} 
              onChange={(e) => updateField('price', Number(e.target.value))}
              disabled={disabled}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Price Formula</Label>
          <div className="border rounded-md p-3 bg-gray-50">
            <FormulaBuilder
              value={leg.formula || createEmptyFormula()}
              onChange={(formula) => updateField('formula', formula)}
              tradeQuantity={leg.quantity || 0}
              buySell={leg.buySell}
              selectedProduct={leg.product}
              formulaType="price"
              otherFormula={leg.mtmFormula || createEmptyFormula()}
              disabled={disabled}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaperTradeLegForm;
