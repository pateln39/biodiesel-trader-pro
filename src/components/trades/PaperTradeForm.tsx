
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useReferenceData } from '@/hooks/useReferenceData';
import { BuySell, Product } from '@/types';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { generateLegReference } from '@/utils/tradeUtils';
import { DatePicker } from '@/components/ui/date-picker';

interface PaperTradeFormProps {
  tradeReference: string;
  onSubmit: (trade: any) => void;
  onCancel: () => void;
}

interface PaperLegFormState {
  buySell: BuySell;
  product: Product;
  instrument: string;
  pricingPeriodStart: Date;
  pricingPeriodEnd: Date;
  price: number;
  quantity: number;
  broker: string;
}

const createDefaultLeg = (broker: string = ''): PaperLegFormState => ({
  buySell: 'buy',
  product: 'UCOME',
  instrument: 'Argus UCOME',
  pricingPeriodStart: new Date(),
  pricingPeriodEnd: new Date(),
  price: 0,
  quantity: 0,
  broker: broker
});

const PaperTradeForm: React.FC<PaperTradeFormProps> = ({ tradeReference, onSubmit, onCancel }) => {
  const { counterparties } = useReferenceData();
  
  const [counterparty, setCounterparty] = useState<string>('');
  
  const [legs, setLegs] = useState<PaperLegFormState[]>([createDefaultLeg()]);

  const addLeg = () => {
    setLegs([...legs, createDefaultLeg(legs[0].broker)]);
  };

  const removeLeg = (index: number) => {
    if (legs.length > 1) {
      const newLegs = [...legs];
      newLegs.splice(index, 1);
      setLegs(newLegs);
    }
  };

  const updateLeg = (index: number, field: keyof PaperLegFormState, value: string | Date | number) => {
    const newLegs = [...legs];
    if (field === 'pricingPeriodStart' || field === 'pricingPeriodEnd') {
      (newLegs[index] as any)[field] = value as Date;
    } else if (field === 'instrument' || field === 'broker') {
      (newLegs[index] as any)[field] = value as string;
    } else if (field === 'buySell') {
      (newLegs[index] as any)[field] = value as BuySell;
    } else if (field === 'product') {
      (newLegs[index] as any)[field] = value as Product;
    } else {
      (newLegs[index] as any)[field] = Number(value);
    }
    setLegs(newLegs);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parentTrade: PaperParentTrade = {
      id: crypto.randomUUID(),
      tradeReference,
      tradeType: 'paper',
      counterparty,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const tradeLegs: PaperTradeLeg[] = legs.map((legForm, index) => {
      const legReference = generateLegReference(tradeReference, index);
      
      const legData: PaperTradeLeg = {
        id: crypto.randomUUID(),
        legReference,
        parentTradeId: parentTrade.id,
        buySell: legForm.buySell,
        product: legForm.product,
        instrument: legForm.instrument,
        pricingPeriodStart: legForm.pricingPeriodStart,
        pricingPeriodEnd: legForm.pricingPeriodEnd,
        price: legForm.price,
        quantity: legForm.quantity,
        broker: legForm.broker
      };
      
      return legData;
    });

    const tradeData: any = {
      ...parentTrade,
      ...legs[0],
      legs: tradeLegs
    };

    onSubmit(tradeData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Trade Details</h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="counterparty">Counterparty</Label>
            <Select 
              value={counterparty} 
              onValueChange={setCounterparty}
            >
              <SelectTrigger id="counterparty">
                <SelectValue placeholder="Select counterparty" />
              </SelectTrigger>
              <SelectContent>
                {counterparties.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Trade Legs</h3>
          <Button type="button" variant="outline" onClick={addLeg}>
            <Plus className="h-4 w-4 mr-1" />
            Add Leg
          </Button>
        </div>

        {legs.map((leg, legIndex) => (
          <Card key={legIndex} className="border border-muted">
            <CardHeader className="p-4 flex flex-row items-start justify-between">
              <CardTitle className="text-md">
                Leg {legIndex + 1} ({generateLegReference(tradeReference, legIndex)})
              </CardTitle>
              {legs.length > 1 && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => removeLeg(legIndex)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor={`leg-${legIndex}-buy-sell`}>Buy/Sell</Label>
                  <Select 
                    value={leg.buySell} 
                    onValueChange={(value) => updateLeg(legIndex, 'buySell', value as BuySell)}
                  >
                    <SelectTrigger id={`leg-${legIndex}-buy-sell`}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="sell">Sell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`leg-${legIndex}-product`}>Product</Label>
                  <Select 
                    value={leg.product} 
                    onValueChange={(value) => updateLeg(legIndex, 'product', value as Product)}
                  >
                    <SelectTrigger id={`leg-${legIndex}-product`}>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FAME0">FAME0</SelectItem>
                      <SelectItem value="RME">RME</SelectItem>
                      <SelectItem value="UCOME">UCOME</SelectItem>
                      <SelectItem value="UCOME-5">UCOME-5</SelectItem>
                      <SelectItem value="RME DC">RME DC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor={`leg-${legIndex}-instrument`}>Instrument</Label>
                  <Select 
                    value={leg.instrument} 
                    onValueChange={(value) => updateLeg(legIndex, 'instrument', value)}
                  >
                    <SelectTrigger id={`leg-${legIndex}-instrument`}>
                      <SelectValue placeholder="Select instrument" />
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
                
                <div className="space-y-2">
                  <Label htmlFor={`leg-${legIndex}-broker`}>Broker</Label>
                  <Input 
                    id={`leg-${legIndex}-broker`} 
                    value={leg.broker} 
                    onChange={(e) => updateLeg(legIndex, 'broker', e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label>Pricing Period Start</Label>
                  <DatePicker 
                    date={leg.pricingPeriodStart}
                    setDate={(date) => updateLeg(legIndex, 'pricingPeriodStart', date)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pricing Period End</Label>
                  <DatePicker 
                    date={leg.pricingPeriodEnd}
                    setDate={(date) => updateLeg(legIndex, 'pricingPeriodEnd', date)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`leg-${legIndex}-price`}>Price</Label>
                  <Input 
                    id={`leg-${legIndex}-price`} 
                    type="number" 
                    value={leg.price} 
                    onChange={(e) => updateLeg(legIndex, 'price', e.target.value)} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`leg-${legIndex}-quantity`}>Quantity (MT)</Label>
                  <Input 
                    id={`leg-${legIndex}-quantity`} 
                    type="number" 
                    value={leg.quantity} 
                    onChange={(e) => updateLeg(legIndex, 'quantity', e.target.value)} 
                    required 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Create Trade
        </Button>
      </div>
    </form>
  );
};

export default PaperTradeForm;
