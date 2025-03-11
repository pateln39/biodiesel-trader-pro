
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  PhysicalParentTrade, 
  PhysicalTradeLeg, 
  PhysicalTradeType, 
  BuySell, 
  Product, 
  IncoTerm, 
  Unit, 
  PaymentTerm, 
  CreditStatus, 
  Trade, 
  PricingComponent, 
  PricingFormula 
} from '@/types';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { generateLegReference } from '@/utils/tradeUtils';
import { DatePicker } from '@/components/ui/date-picker';
import FormulaBuilder from './FormulaBuilder';
import { createEmptyFormula, convertToTraditionalFormat, convertToNewFormulaFormat } from '@/utils/formulaUtils';

interface PhysicalTradeFormProps {
  tradeReference: string;
  onSubmit: (trade: any) => void;
  onCancel: () => void;
}

interface LegFormState {
  buySell: BuySell;
  product: Product;
  sustainability: string;
  incoTerm: IncoTerm;
  unit: Unit;
  paymentTerm: PaymentTerm;
  creditStatus: CreditStatus;
  quantity: number;
  tolerance: number;
  loadingPeriodStart: Date;
  loadingPeriodEnd: Date;
  pricingPeriodStart: Date;
  pricingPeriodEnd: Date;
  pricingFormula: PricingComponent[];
  formula?: PricingFormula;
}

const createDefaultLeg = (): LegFormState => ({
  buySell: 'buy',
  product: 'UCOME',
  sustainability: 'ISCC',
  incoTerm: 'FOB',
  unit: 'MT',
  paymentTerm: '30 days',
  creditStatus: 'pending',
  quantity: 0,
  tolerance: 5,
  loadingPeriodStart: new Date(),
  loadingPeriodEnd: new Date(),
  pricingPeriodStart: new Date(),
  pricingPeriodEnd: new Date(),
  pricingFormula: [
    { instrument: 'Argus UCOME', percentage: 100, adjustment: 0 }
  ],
  formula: createEmptyFormula()
});

const PhysicalTradeForm: React.FC<PhysicalTradeFormProps> = ({ tradeReference, onSubmit, onCancel }) => {
  // Parent trade fields (minimal)
  const [physicalType, setPhysicalType] = useState<PhysicalTradeType>('spot');
  const [counterparty, setCounterparty] = useState('');
  
  // Legs (all contain trading details)
  const [legs, setLegs] = useState<LegFormState[]>([createDefaultLeg()]);
  
  const addPricingComponent = (legIndex: number) => {
    const newLegs = [...legs];
    newLegs[legIndex].pricingFormula.push(
      { instrument: 'Argus UCOME', percentage: 0, adjustment: 0 }
    );
    setLegs(newLegs);
  };

  const removePricingComponent = (legIndex: number, componentIndex: number) => {
    const newLegs = [...legs];
    newLegs[legIndex].pricingFormula.splice(componentIndex, 1);
    setLegs(newLegs);
  };

  const updatePricingComponent = (
    legIndex: number, 
    componentIndex: number, 
    field: keyof PricingComponent, 
    value: string | number
  ) => {
    const newLegs = [...legs];
    newLegs[legIndex].pricingFormula[componentIndex] = { 
      ...newLegs[legIndex].pricingFormula[componentIndex], 
      [field]: field === 'instrument' ? value as Instrument : Number(value) 
    };
    setLegs(newLegs);
  };

  const handleFormulaChange = (formula: PricingFormula, legIndex: number) => {
    const newLegs = [...legs];
    newLegs[legIndex].formula = formula;
    // Also update traditional format for backward compatibility
    newLegs[legIndex].pricingFormula = convertToTraditionalFormat(formula);
    setLegs(newLegs);
  };

  const addLeg = () => {
    setLegs([...legs, createDefaultLeg()]);
  };

  const removeLeg = (index: number) => {
    if (legs.length > 1) {
      const newLegs = [...legs];
      newLegs.splice(index, 1);
      setLegs(newLegs);
    }
  };

  const updateLeg = (index: number, field: keyof LegFormState, value: any) => {
    const newLegs = [...legs];
    if (field === 'pricingFormula' || field === 'formula') {
      newLegs[index][field] = value;
    } else if (
      field === 'loadingPeriodStart' || 
      field === 'loadingPeriodEnd' || 
      field === 'pricingPeriodStart' || 
      field === 'pricingPeriodEnd'
    ) {
      newLegs[index][field] = value;
    } else if (
      field === 'buySell' || 
      field === 'product' || 
      field === 'sustainability' || 
      field === 'incoTerm' || 
      field === 'unit' || 
      field === 'paymentTerm' || 
      field === 'creditStatus'
    ) {
      newLegs[index][field] = value;
    } else {
      newLegs[index][field] = Number(value);
    }
    setLegs(newLegs);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Create parent trade object
    const parentTrade: PhysicalParentTrade = {
      id: crypto.randomUUID(),
      tradeReference,
      tradeType: 'physical',
      physicalType,
      counterparty,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Create trade legs
    const tradeLegs: PhysicalTradeLeg[] = legs.map((legForm, index) => {
      const legReference = generateLegReference(tradeReference, index);
      
      const legData: PhysicalTradeLeg = {
        id: crypto.randomUUID(),
        legReference,
        parentTradeId: parentTrade.id,
        buySell: legForm.buySell,
        product: legForm.product,
        sustainability: legForm.sustainability,
        incoTerm: legForm.incoTerm,
        quantity: legForm.quantity,
        tolerance: legForm.tolerance,
        loadingPeriodStart: legForm.loadingPeriodStart,
        loadingPeriodEnd: legForm.loadingPeriodEnd,
        pricingPeriodStart: legForm.pricingPeriodStart,
        pricingPeriodEnd: legForm.pricingPeriodEnd,
        unit: legForm.unit,
        paymentTerm: legForm.paymentTerm,
        creditStatus: legForm.creditStatus,
        pricingFormula: [...legForm.pricingFormula],
        formula: legForm.formula
      };
      
      return legData;
    });

    // Create a backward-compatible trade object for the onSubmit handler
    const tradeData: any = {
      ...parentTrade,
      legs: tradeLegs,
      // Add first leg's data to the parent for backward compatibility
      ...legs[0]
    };

    onSubmit(tradeData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="physical-type">Trade Type</Label>
          <Select 
            value={physicalType} 
            onValueChange={(value) => setPhysicalType(value as PhysicalTradeType)}
          >
            <SelectTrigger id="physical-type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="spot">Spot</SelectItem>
              <SelectItem value="term">Term</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="counterparty">Counterparty</Label>
          <Input 
            id="counterparty" 
            value={counterparty} 
            onChange={(e) => setCounterparty(e.target.value)} 
            required 
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Trade Legs</h3>
          {physicalType === 'term' && (
            <Button type="button" variant="outline" onClick={addLeg}>
              <Plus className="h-4 w-4 mr-1" />
              Add Leg
            </Button>
          )}
        </div>

        {legs.map((leg, legIndex) => (
          <Card key={legIndex} className="border border-muted">
            <CardHeader className="p-4 flex flex-row items-start justify-between">
              <CardTitle className="text-md">
                {physicalType === 'spot' 
                  ? 'Spot Trade Details' 
                  : `Leg ${legIndex + 1} (${generateLegReference(tradeReference, legIndex)})`}
              </CardTitle>
              {physicalType === 'term' && legs.length > 1 && (
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
              <div className="grid grid-cols-3 gap-4 mb-4">
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

                <div className="space-y-2">
                  <Label htmlFor={`leg-${legIndex}-sustainability`}>Sustainability</Label>
                  <Input 
                    id={`leg-${legIndex}-sustainability`} 
                    value={leg.sustainability} 
                    onChange={(e) => updateLeg(legIndex, 'sustainability', e.target.value)} 
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor={`leg-${legIndex}-incoterm`}>Incoterm</Label>
                  <Select 
                    value={leg.incoTerm} 
                    onValueChange={(value) => updateLeg(legIndex, 'incoTerm', value as IncoTerm)}
                  >
                    <SelectTrigger id={`leg-${legIndex}-incoterm`}>
                      <SelectValue placeholder="Select incoterm" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FOB">FOB</SelectItem>
                      <SelectItem value="CIF">CIF</SelectItem>
                      <SelectItem value="DES">DES</SelectItem>
                      <SelectItem value="DAP">DAP</SelectItem>
                      <SelectItem value="FCA">FCA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`leg-${legIndex}-unit`}>Unit</Label>
                  <Select 
                    value={leg.unit} 
                    onValueChange={(value) => updateLeg(legIndex, 'unit', value as Unit)}
                  >
                    <SelectTrigger id={`leg-${legIndex}-unit`}>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MT">Metric Tons (MT)</SelectItem>
                      <SelectItem value="KG">Kilograms (KG)</SelectItem>
                      <SelectItem value="L">Liters (L)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`leg-${legIndex}-payment-term`}>Payment Term</Label>
                  <Select 
                    value={leg.paymentTerm} 
                    onValueChange={(value) => updateLeg(legIndex, 'paymentTerm', value as PaymentTerm)}
                  >
                    <SelectTrigger id={`leg-${legIndex}-payment-term`}>
                      <SelectValue placeholder="Select payment term" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="advance">Advance</SelectItem>
                      <SelectItem value="30 days">30 Days</SelectItem>
                      <SelectItem value="60 days">60 Days</SelectItem>
                      <SelectItem value="90 days">90 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor={`leg-${legIndex}-credit-status`}>Credit Status</Label>
                  <Select 
                    value={leg.creditStatus} 
                    onValueChange={(value) => updateLeg(legIndex, 'creditStatus', value as CreditStatus)}
                  >
                    <SelectTrigger id={`leg-${legIndex}-credit-status`}>
                      <SelectValue placeholder="Select credit status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`leg-${legIndex}-quantity`}>Quantity</Label>
                  <Input 
                    id={`leg-${legIndex}-quantity`} 
                    type="number" 
                    value={leg.quantity} 
                    onChange={(e) => updateLeg(legIndex, 'quantity', e.target.value)} 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`leg-${legIndex}-tolerance`}>Tolerance (%)</Label>
                  <Input 
                    id={`leg-${legIndex}-tolerance`} 
                    type="number" 
                    value={leg.tolerance} 
                    onChange={(e) => updateLeg(legIndex, 'tolerance', e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label>Loading Period Start</Label>
                  <DatePicker 
                    date={leg.loadingPeriodStart}
                    setDate={(date) => updateLeg(legIndex, 'loadingPeriodStart', date)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Loading Period End</Label>
                  <DatePicker 
                    date={leg.loadingPeriodEnd}
                    setDate={(date) => updateLeg(legIndex, 'loadingPeriodEnd', date)}
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

              {/* Formula Builder */}
              <div className="border rounded-md p-4 bg-gray-50">
                <FormulaBuilder 
                  value={leg.formula || createEmptyFormula()} 
                  onChange={(formula) => handleFormulaChange(formula, legIndex)}
                  tradeQuantity={leg.quantity || 0}
                />
              </div>
              
              {/* Legacy Pricing Formula (Hidden but kept for compatibility) */}
              <div className="hidden">
                <div className="flex items-center justify-between">
                  <Label>Legacy Pricing Formula</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => addPricingComponent(legIndex)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Component
                  </Button>
                </div>
                
                {leg.pricingFormula.map((component, componentIndex) => (
                  <div key={componentIndex} className="grid grid-cols-10 gap-2 items-end mt-2">
                    <div className="col-span-4">
                      <Label htmlFor={`leg-${legIndex}-instrument-${componentIndex}`} className="text-xs">Instrument</Label>
                      <Select 
                        value={component.instrument} 
                        onValueChange={(value) => updatePricingComponent(legIndex, componentIndex, 'instrument', value)}
                      >
                        <SelectTrigger id={`leg-${legIndex}-instrument-${componentIndex}`}>
                          <SelectValue />
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
                    <div className="col-span-2">
                      <Label htmlFor={`leg-${legIndex}-percentage-${componentIndex}`} className="text-xs">Percentage (%)</Label>
                      <Input 
                        id={`leg-${legIndex}-percentage-${componentIndex}`} 
                        type="number" 
                        value={component.percentage} 
                        onChange={(e) => updatePricingComponent(legIndex, componentIndex, 'percentage', e.target.value)} 
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor={`leg-${legIndex}-adjustment-${componentIndex}`} className="text-xs">Adjustment (+/-)</Label>
                      <Input 
                        id={`leg-${legIndex}-adjustment-${componentIndex}`} 
                        type="number" 
                        value={component.adjustment} 
                        onChange={(e) => updatePricingComponent(legIndex, componentIndex, 'adjustment', e.target.value)} 
                      />
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removePricingComponent(legIndex, componentIndex)}
                        disabled={leg.pricingFormula.length <= 1}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
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

export default PhysicalTradeForm;
