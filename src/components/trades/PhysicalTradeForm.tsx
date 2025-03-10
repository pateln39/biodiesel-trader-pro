
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PhysicalTrade, PhysicalTradeType, BuySell, Product, IncoTerm, Unit, PaymentTerm, CreditStatus, Trade, PricingComponent, PhysicalTradeLeg, PricingFormula } from '@/types';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { generateLegReference } from '@/utils/tradeUtils';
import { DatePicker } from '@/components/ui/date-picker';
import FormulaBuilder from './FormulaBuilder';
import { createEmptyFormula, convertToTraditionalFormat, convertToNewFormulaFormat } from '@/utils/formulaUtils';

interface PhysicalTradeFormProps {
  tradeReference: string;
  onSubmit: (trade: Trade) => void;
  onCancel: () => void;
}

interface LegFormState {
  quantity: number;
  tolerance: number;
  loadingPeriodStart: Date;
  loadingPeriodEnd: Date;
  pricingPeriodStart: Date;
  pricingPeriodEnd: Date;
  pricingFormula: PricingComponent[];
  formula?: PricingFormula;
}

const PhysicalTradeForm: React.FC<PhysicalTradeFormProps> = ({ tradeReference, onSubmit, onCancel }) => {
  const [physicalType, setPhysicalType] = useState<PhysicalTradeType>('spot');
  const [buySell, setBuySell] = useState<BuySell>('buy');
  const [counterparty, setCounterparty] = useState('');
  const [product, setProduct] = useState<Product>('UCOME');
  const [sustainability, setSustainability] = useState('ISCC');
  const [incoTerm, setIncoTerm] = useState<IncoTerm>('FOB');
  const [unit, setUnit] = useState<Unit>('MT');
  const [paymentTerm, setPaymentTerm] = useState<PaymentTerm>('30 days');
  const [creditStatus, setCreditStatus] = useState<CreditStatus>('pending');
  
  // For main trade details - only used for spot trades
  const [mainQuantity, setMainQuantity] = useState<number>(0);
  const [mainTolerance, setMainTolerance] = useState<number>(5);
  const [mainLoadingStart, setMainLoadingStart] = useState<Date>(new Date());
  const [mainLoadingEnd, setMainLoadingEnd] = useState<Date>(new Date());
  const [mainPricingStart, setMainPricingStart] = useState<Date>(new Date());
  const [mainPricingEnd, setMainPricingEnd] = useState<Date>(new Date());
  const [mainPricingFormula, setMainPricingFormula] = useState<PricingComponent[]>([
    { instrument: 'Argus UCOME', percentage: 100, adjustment: 0 }
  ]);
  const [mainFormula, setMainFormula] = useState<PricingFormula>(createEmptyFormula());

  // For legs - only used for term trades
  const [legs, setLegs] = useState<LegFormState[]>([]);

  // Initialize the main formula from pricing components
  useEffect(() => {
    setMainFormula(convertToNewFormulaFormat(mainPricingFormula));
  }, []);

  const addPricingComponent = (legIndex: number | null) => {
    if (legIndex === null) {
      // Adding to main trade
      setMainPricingFormula([
        ...mainPricingFormula,
        { instrument: 'Argus UCOME', percentage: 0, adjustment: 0 }
      ]);
    } else {
      // Adding to a leg
      const newLegs = [...legs];
      newLegs[legIndex].pricingFormula.push(
        { instrument: 'Argus UCOME', percentage: 0, adjustment: 0 }
      );
      setLegs(newLegs);
    }
  };

  const removePricingComponent = (legIndex: number | null, componentIndex: number) => {
    if (legIndex === null) {
      // Removing from main trade
      const newFormula = [...mainPricingFormula];
      newFormula.splice(componentIndex, 1);
      setMainPricingFormula(newFormula);
    } else {
      // Removing from a leg
      const newLegs = [...legs];
      newLegs[legIndex].pricingFormula.splice(componentIndex, 1);
      setLegs(newLegs);
    }
  };

  const updatePricingComponent = (
    legIndex: number | null, 
    componentIndex: number, 
    field: keyof PricingComponent, 
    value: any
  ) => {
    if (legIndex === null) {
      // Updating main trade
      const newFormula = [...mainPricingFormula];
      newFormula[componentIndex] = { 
        ...newFormula[componentIndex], 
        [field]: field === 'instrument' ? value : Number(value) 
      };
      setMainPricingFormula(newFormula);
    } else {
      // Updating a leg
      const newLegs = [...legs];
      newLegs[legIndex].pricingFormula[componentIndex] = { 
        ...newLegs[legIndex].pricingFormula[componentIndex], 
        [field]: field === 'instrument' ? value : Number(value) 
      };
      setLegs(newLegs);
    }
  };

  const handleFormulaChange = (formula: PricingFormula, legIndex: number | null) => {
    if (legIndex === null) {
      // Update main formula
      setMainFormula(formula);
      // Also update traditional format for backward compatibility
      setMainPricingFormula(convertToTraditionalFormat(formula));
    } else {
      // Update leg formula
      const newLegs = [...legs];
      newLegs[legIndex].formula = formula;
      // Also update traditional format for backward compatibility
      newLegs[legIndex].pricingFormula = convertToTraditionalFormat(formula);
      setLegs(newLegs);
    }
  };

  const addLeg = () => {
    const newLeg: LegFormState = {
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
    };
    
    setLegs([...legs, newLeg]);
  };

  const removeLeg = (index: number) => {
    const newLegs = [...legs];
    newLegs.splice(index, 1);
    setLegs(newLegs);
  };

  const updateLeg = (index: number, field: keyof LegFormState, value: any) => {
    const newLegs = [...legs];
    if (field === 'pricingFormula') {
      newLegs[index][field] = value;
    } else if (
      field === 'loadingPeriodStart' || 
      field === 'loadingPeriodEnd' || 
      field === 'pricingPeriodStart' || 
      field === 'pricingPeriodEnd' ||
      field === 'formula'
    ) {
      newLegs[index][field] = value;
    } else {
      newLegs[index][field] = Number(value);
    }
    setLegs(newLegs);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Create trade object
    const tradeData: PhysicalTrade = {
      id: crypto.randomUUID(),
      tradeReference,
      tradeType: 'physical',
      physicalType,
      buySell,
      counterparty,
      product,
      sustainability,
      incoTerm,
      unit,
      paymentTerm,
      creditStatus,
      createdAt: new Date(),
      updatedAt: new Date(),
      legs: [],
      quantity: mainQuantity,
      tolerance: mainTolerance,
      loadingPeriodStart: mainLoadingStart,
      loadingPeriodEnd: mainLoadingEnd,
      pricingPeriodStart: mainPricingStart,
      pricingPeriodEnd: mainPricingEnd,
      pricingFormula: [...mainPricingFormula],
      formula: mainFormula
    };

    // Add legs for term trades
    if (physicalType === 'term') {
      tradeData.legs = legs.map((legForm, index) => {
        const legReference = generateLegReference(tradeReference, index);
        
        const legData: PhysicalTradeLeg = {
          id: crypto.randomUUID(),
          legReference,
          parentTradeId: tradeData.id,
          quantity: legForm.quantity,
          tolerance: legForm.tolerance,
          loadingPeriodStart: legForm.loadingPeriodStart,
          loadingPeriodEnd: legForm.loadingPeriodEnd,
          pricingPeriodStart: legForm.pricingPeriodStart,
          pricingPeriodEnd: legForm.pricingPeriodEnd,
          pricingFormula: [...legForm.pricingFormula],
          formula: legForm.formula
        };
        
        return legData;
      });
    }

    onSubmit(tradeData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
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
          <Label htmlFor="buy-sell">Buy/Sell</Label>
          <Select 
            value={buySell} 
            onValueChange={(value) => setBuySell(value as BuySell)}
          >
            <SelectTrigger id="buy-sell">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="buy">Buy</SelectItem>
              <SelectItem value="sell">Sell</SelectItem>
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

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="product">Product</Label>
          <Select 
            value={product} 
            onValueChange={(value) => setProduct(value as Product)}
          >
            <SelectTrigger id="product">
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
          <Label htmlFor="sustainability">Sustainability</Label>
          <Input 
            id="sustainability" 
            value={sustainability} 
            onChange={(e) => setSustainability(e.target.value)} 
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="incoterm">Incoterm</Label>
          <Select 
            value={incoTerm} 
            onValueChange={(value) => setIncoTerm(value as IncoTerm)}
          >
            <SelectTrigger id="incoterm">
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
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="unit">Unit</Label>
          <Select 
            value={unit} 
            onValueChange={(value) => setUnit(value as Unit)}
          >
            <SelectTrigger id="unit">
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
          <Label htmlFor="payment-term">Payment Term</Label>
          <Select 
            value={paymentTerm} 
            onValueChange={(value) => setPaymentTerm(value as PaymentTerm)}
          >
            <SelectTrigger id="payment-term">
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

        <div className="space-y-2">
          <Label htmlFor="credit-status">Credit Status</Label>
          <Select 
            value={creditStatus} 
            onValueChange={(value) => setCreditStatus(value as CreditStatus)}
          >
            <SelectTrigger id="credit-status">
              <SelectValue placeholder="Select credit status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {physicalType === 'spot' ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Spot Trade Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input 
                id="quantity" 
                type="number" 
                value={mainQuantity} 
                onChange={(e) => setMainQuantity(Number(e.target.value))} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tolerance">Tolerance (%)</Label>
              <Input 
                id="tolerance" 
                type="number" 
                value={mainTolerance} 
                onChange={(e) => setMainTolerance(Number(e.target.value))} 
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Loading Period Start</Label>
              <DatePicker 
                date={mainLoadingStart} 
                setDate={setMainLoadingStart} 
              />
            </div>
            <div className="space-y-2">
              <Label>Loading Period End</Label>
              <DatePicker 
                date={mainLoadingEnd} 
                setDate={setMainLoadingEnd} 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pricing Period Start</Label>
              <DatePicker 
                date={mainPricingStart} 
                setDate={setMainPricingStart} 
              />
            </div>
            <div className="space-y-2">
              <Label>Pricing Period End</Label>
              <DatePicker 
                date={mainPricingEnd} 
                setDate={setMainPricingEnd} 
              />
            </div>
          </div>

          {/* New Formula Builder */}
          <div className="border rounded-md p-4 bg-gray-50">
            <FormulaBuilder 
              value={mainFormula} 
              onChange={(formula) => handleFormulaChange(formula, null)}
              tradeQuantity={mainQuantity || 0}
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
                onClick={() => addPricingComponent(null)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Component
              </Button>
            </div>
            
            {mainPricingFormula.map((component, index) => (
              <div key={index} className="grid grid-cols-10 gap-2 items-end mt-2">
                <div className="col-span-4">
                  <Label htmlFor={`instrument-${index}`} className="text-xs">Instrument</Label>
                  <Select 
                    value={component.instrument} 
                    onValueChange={(value) => updatePricingComponent(null, index, 'instrument', value)}
                  >
                    <SelectTrigger id={`instrument-${index}`}>
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
                  <Label htmlFor={`percentage-${index}`} className="text-xs">Percentage (%)</Label>
                  <Input 
                    id={`percentage-${index}`} 
                    type="number" 
                    value={component.percentage} 
                    onChange={(e) => updatePricingComponent(null, index, 'percentage', e.target.value)} 
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor={`adjustment-${index}`} className="text-xs">Adjustment (+/-)</Label>
                  <Input 
                    id={`adjustment-${index}`} 
                    type="number" 
                    value={component.adjustment} 
                    onChange={(e) => updatePricingComponent(null, index, 'adjustment', e.target.value)} 
                  />
                </div>
                <div className="col-span-2 flex justify-end">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removePricingComponent(null, index)}
                    disabled={mainPricingFormula.length <= 1}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Term Trade Legs</h3>
            <Button type="button" variant="outline" onClick={addLeg}>
              <Plus className="h-4 w-4 mr-1" />
              Add Leg
            </Button>
          </div>

          {legs.length === 0 && (
            <div className="p-4 border border-dashed rounded-md text-center text-muted-foreground">
              No legs added yet. Click "Add Leg" to create a term trade leg.
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
                    <Label htmlFor={`leg-quantity-${legIndex}`}>Quantity</Label>
                    <Input 
                      id={`leg-quantity-${legIndex}`} 
                      type="number" 
                      value={leg.quantity} 
                      onChange={(e) => updateLeg(legIndex, 'quantity', e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`leg-tolerance-${legIndex}`}>Tolerance (%)</Label>
                    <Input 
                      id={`leg-tolerance-${legIndex}`} 
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

                {/* New Formula Builder for Leg */}
                <div className="border rounded-md p-4 bg-gray-50 mb-4">
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
      )}

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
