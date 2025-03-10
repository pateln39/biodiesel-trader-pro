
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Instrument, PaperTrade, Trade } from '@/types';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { generateLegReference } from '@/utils/tradeUtils';
import { DatePicker } from '@/components/ui/date-picker';

interface PaperTradeFormProps {
  tradeReference: string;
  onSubmit: (trade: Trade) => void;
  onCancel: () => void;
}

interface PaperTradeLeg {
  instrument: Instrument;
  pricingPeriodStart: Date;
  pricingPeriodEnd: Date;
  price: number;
  quantity: number;
  broker: string;
}

const PaperTradeForm: React.FC<PaperTradeFormProps> = ({ tradeReference, onSubmit, onCancel }) => {
  // For the first leg (always exists)
  const [instrument, setInstrument] = useState<Instrument>('Argus UCOME');
  const [pricingPeriodStart, setPricingPeriodStart] = useState<Date>(new Date());
  const [pricingPeriodEnd, setPricingPeriodEnd] = useState<Date>(new Date());
  const [price, setPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(0);
  const [broker, setBroker] = useState<string>('');

  // For additional legs
  const [legs, setLegs] = useState<PaperTradeLeg[]>([]);

  const addLeg = () => {
    const newLeg: PaperTradeLeg = {
      instrument: 'Argus UCOME',
      pricingPeriodStart: new Date(),
      pricingPeriodEnd: new Date(),
      price: 0,
      quantity: 0,
      broker: broker // Default to same broker as main trade
    };
    
    setLegs([...legs, newLeg]);
  };

  const removeLeg = (index: number) => {
    const newLegs = [...legs];
    newLegs.splice(index, 1);
    setLegs(newLegs);
  };

  const updateLeg = (index: number, field: keyof PaperTradeLeg, value: any) => {
    const newLegs = [...legs];
    if (field === 'pricingPeriodStart' || field === 'pricingPeriodEnd') {
      newLegs[index][field] = value;
    } else if (field === 'instrument' || field === 'broker') {
      newLegs[index][field] = value;
    } else {
      newLegs[index][field] = Number(value);
    }
    setLegs(newLegs);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Create main trade
    const mainTrade: PaperTrade = {
      id: crypto.randomUUID(),
      tradeReference,
      tradeType: 'paper',
      instrument,
      pricingPeriodStart,
      pricingPeriodEnd,
      price,
      quantity,
      broker,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add additional trades
    const allTrades: Trade[] = [mainTrade];
    
    legs.forEach((leg, index) => {
      const legReference = generateLegReference(tradeReference, index);
      
      const legTrade: PaperTrade = {
        id: crypto.randomUUID(),
        tradeReference: legReference,
        tradeType: 'paper',
        instrument: leg.instrument,
        pricingPeriodStart: leg.pricingPeriodStart,
        pricingPeriodEnd: leg.pricingPeriodEnd,
        price: leg.price,
        quantity: leg.quantity,
        broker: leg.broker,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      allTrades.push(legTrade);
    });

    // Pass the main trade to the onSubmit handler
    // In a real implementation, you'd submit all trades to the backend
    onSubmit(mainTrade);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Main Trade Details</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="instrument">Instrument</Label>
            <Select 
              value={instrument} 
              onValueChange={(value) => setInstrument(value as Instrument)}
            >
              <SelectTrigger id="instrument">
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
            <Label htmlFor="broker">Broker</Label>
            <Input 
              id="broker" 
              value={broker} 
              onChange={(e) => setBroker(e.target.value)} 
              required 
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Pricing Period Start</Label>
            <DatePicker 
              date={pricingPeriodStart} 
              setDate={setPricingPeriodStart} 
            />
          </div>
          <div className="space-y-2">
            <Label>Pricing Period End</Label>
            <DatePicker 
              date={pricingPeriodEnd} 
              setDate={setPricingPeriodEnd} 
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input 
              id="price" 
              type="number" 
              value={price} 
              onChange={(e) => setPrice(Number(e.target.value))} 
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity (MT)</Label>
            <Input 
              id="quantity" 
              type="number" 
              value={quantity} 
              onChange={(e) => setQuantity(Number(e.target.value))} 
              required 
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Additional Legs</h3>
          <Button type="button" variant="outline" onClick={addLeg}>
            <Plus className="h-4 w-4 mr-1" />
            Add Leg
          </Button>
        </div>

        {legs.length === 0 && (
          <div className="p-4 border border-dashed rounded-md text-center text-muted-foreground">
            No additional legs added yet. Click "Add Leg" to create additional legs.
          </div>
        )}

        {legs.map((leg, legIndex) => (
          <Card key={legIndex} className="border border-muted">
            <CardHeader className="p-4 flex flex-row items-start justify-between">
              <CardTitle className="text-md">
                Leg {legIndex + 1} ({generateLegReference(tradeReference, legIndex)})
              </CardTitle>
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                onClick={() => removeLeg(legIndex)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor={`leg-instrument-${legIndex}`}>Instrument</Label>
                  <Select 
                    value={leg.instrument} 
                    onValueChange={(value) => updateLeg(legIndex, 'instrument', value as Instrument)}
                  >
                    <SelectTrigger id={`leg-instrument-${legIndex}`}>
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
                  <Label htmlFor={`leg-broker-${legIndex}`}>Broker</Label>
                  <Input 
                    id={`leg-broker-${legIndex}`} 
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
                  <Label htmlFor={`leg-price-${legIndex}`}>Price</Label>
                  <Input 
                    id={`leg-price-${legIndex}`} 
                    type="number" 
                    value={leg.price} 
                    onChange={(e) => updateLeg(legIndex, 'price', e.target.value)} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`leg-quantity-${legIndex}`}>Quantity (MT)</Label>
                  <Input 
                    id={`leg-quantity-${legIndex}`} 
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
