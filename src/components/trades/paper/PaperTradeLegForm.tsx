import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { useReferenceData } from '@/hooks/useReferenceData';
import { BuySell, Product } from '@/types/trade';
import { PaperTradePositionSide } from '@/types/paper';
import FormulaBuilder from '@/components/trades/FormulaBuilder';
import { createEmptyFormula } from '@/utils/formulaUtils';
import { PricingFormula } from '@/types/pricing';

interface PaperTradeLegFormProps {
  side: PaperTradePositionSide;
  onChange: (newSide: PaperTradePositionSide) => void;
  products: string[];
  instruments: string[];
  sideReference: string;
}

const PaperTradeLegForm: React.FC<PaperTradeLegFormProps> = ({ side, onChange, products, instruments, sideReference }) => {
  const { counterparties } = useReferenceData();

  const updateSide = (field: keyof PaperTradePositionSide, value: string | number | Date | PricingFormula | undefined) => {
    const newSide = { ...side };
    if (field === 'pricingPeriodStart' || field === 'pricingPeriodEnd') {
      (newSide as any)[field] = value as Date;
    } else if (field === 'buySell') {
      (newSide as any)[field] = value as BuySell;
    } else if (field === 'product') {
      (newSide as any)[field] = value as Product;
    } else if (field === 'instrument') {
      (newSide as any)[field] = value as string;
    }
     else if (field === 'formula' || field === 'mtmFormula') {
      (newSide as any)[field] = value as PricingFormula;
    }
    else if (typeof value === 'number') {
       (newSide as any)[field] = value as number;
    }
    else {
      (newSide as any)[field] = value as string;
    }
    
    onChange(newSide);
  };

  const handleNumberInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  return (
    <Card className="border border-muted">
      <CardHeader className="p-4 flex flex-row items-start justify-between">
        <CardTitle className="text-md">
          Side Details ({sideReference})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor={`side-${sideReference}-buy-sell`}>Buy/Sell</Label>
            <Select
              value={side.buySell}
              onValueChange={(value) => updateSide('buySell', value as BuySell)}
            >
              <SelectTrigger id={`side-${sideReference}-buy-sell`}>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="sell">Sell</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`side-${sideReference}-product`}>Product</Label>
            <Select
              value={side.product}
              onValueChange={(value) => updateSide('product', value as Product)}
            >
              <SelectTrigger id={`side-${sideReference}-product`}>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product} value={product}>
                    {product}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor={`side-${sideReference}-instrument`}>Instrument</Label>
            <Select
              value={side.instrument}
              onValueChange={(value) => updateSide('instrument', value)}
            >
              <SelectTrigger id={`side-${sideReference}-instrument`}>
                <SelectValue placeholder="Select instrument" />
              </SelectTrigger>
              <SelectContent>
                {instruments.map((instrument) => (
                  <SelectItem key={instrument} value={instrument}>
                    {instrument}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`side-${sideReference}-quantity`}>Quantity</Label>
            <Input
              id={`side-${sideReference}-quantity`}
              type="number"
              value={side.quantity}
              onChange={(e) => updateSide('quantity', Number(e.target.value))}
              onFocus={handleNumberInputFocus}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor={`side-${sideReference}-price`}>Price</Label>
            <Input
              id={`side-${sideReference}-price`}
              type="number"
              value={side.price}
              onChange={(e) => updateSide('price', Number(e.target.value))}
              onFocus={handleNumberInputFocus}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`side-${sideReference}-broker`}>Broker</Label>
            <Select
              value={side.broker}
              onValueChange={(value) => updateSide('broker', value)}
            >
              <SelectTrigger id={`side-${sideReference}-broker`}>
                <SelectValue placeholder="Select broker" />
              </SelectTrigger>
              <SelectContent>
                {counterparties.map((counterparty) => (
                  <SelectItem key={counterparty} value={counterparty}>
                    {counterparty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label>Pricing Period Start</Label>
            <DatePicker
              date={side.pricingPeriodStart}
              setDate={(date) => updateSide('pricingPeriodStart', date)}
            />
          </div>
          <div className="space-y-2">
            <Label>Pricing Period End</Label>
            <DatePicker
              date={side.pricingPeriodEnd}
              setDate={(date) => updateSide('pricingPeriodEnd', date)}
            />
          </div>
        </div>

        {/* Formula Builder */}
        <div className="mb-4">
          <Label className="font-medium">Pricing Formula</Label>
          <FormulaBuilder
            value={side.formula || createEmptyFormula()}
            onChange={(formula) => updateSide('formula', formula)}
            tradeQuantity={side.quantity || 0}
            buySell={side.buySell}
            selectedProduct={side.product}
            formulaType="price"
            otherFormula={side.mtmFormula || createEmptyFormula()}
          />
        </div>

        {/* MTM Formula Builder */}
         <div className="mb-4">
          <Label className="font-medium">MTM Pricing Formula</Label>
          <FormulaBuilder
            value={side.mtmFormula || createEmptyFormula()}
            onChange={(formula) => updateSide('mtmFormula', formula)}
            tradeQuantity={side.quantity || 0}
            buySell={side.buySell}
            selectedProduct={side.product}
            formulaType="mtm"
            otherFormula={side.formula || createEmptyFormula()}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default PaperTradeLegForm;
