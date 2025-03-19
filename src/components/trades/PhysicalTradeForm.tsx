import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useReferenceData } from '@/hooks/useReferenceData';
import { BuySell, Product, PhysicalTradeType, IncoTerm, Unit, PaymentTerm, CreditStatus, PricingFormula, PhysicalParentTrade, PhysicalTradeLeg, PhysicalTrade } from '@/types';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { generateLegReference } from '@/utils/tradeUtils';
import { DatePicker } from '@/components/ui/date-picker';
import FormulaBuilder from './FormulaBuilder';
import { createEmptyFormula } from '@/utils/formulaUtils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { validateDateRange, validateRequiredField, validateFields } from '@/utils/validationUtils';
import { toast } from 'sonner';

interface PhysicalTradeFormProps {
  tradeReference: string;
  onSubmit: (trade: any) => void;
  onCancel: () => void;
  isEditMode?: boolean;
  initialData?: PhysicalTrade;
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
  formula?: PricingFormula;
  mtmFormula?: PricingFormula;
}

const createDefaultLeg = (): LegFormState => ({
  buySell: 'buy',
  product: 'UCOME',
  sustainability: '',
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
  formula: createEmptyFormula(),
  mtmFormula: createEmptyFormula()
});

const PhysicalTradeForm: React.FC<PhysicalTradeFormProps> = ({ 
  tradeReference, 
  onSubmit, 
  onCancel,
  isEditMode = false,
  initialData
}) => {
  const { counterparties, sustainabilityOptions, creditStatusOptions } = useReferenceData();
  const [physicalType, setPhysicalType] = useState<PhysicalTradeType>(initialData?.physicalType || 'spot');
  const [counterparty, setCounterparty] = useState(initialData?.counterparty || '');
  
  const [legs, setLegs] = useState<LegFormState[]>(
    initialData?.legs?.map(leg => ({
      buySell: leg.buySell,
      product: leg.product,
      sustainability: leg.sustainability || '',
      incoTerm: leg.incoTerm,
      unit: leg.unit,
      paymentTerm: leg.paymentTerm,
      creditStatus: leg.creditStatus,
      quantity: leg.quantity,
      tolerance: leg.tolerance,
      loadingPeriodStart: leg.loadingPeriodStart,
      loadingPeriodEnd: leg.loadingPeriodEnd,
      pricingPeriodStart: leg.pricingPeriodStart,
      pricingPeriodEnd: leg.pricingPeriodEnd,
      formula: leg.formula || createEmptyFormula(),
      mtmFormula: leg.mtmFormula || createEmptyFormula()
    })) || [createDefaultLeg()]
  );

  const handleFormulaChange = (formula: PricingFormula, legIndex: number) => {
    const newLegs = [...legs];
    newLegs[legIndex].formula = formula;
    setLegs(newLegs);
  };

  const handleMtmFormulaChange = (formula: PricingFormula, legIndex: number) => {
    const newLegs = [...legs];
    newLegs[legIndex].mtmFormula = formula;
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

  const updateLeg = (index: number, field: keyof LegFormState, value: string | Date | number | PricingFormula | undefined) => {
    const newLegs = [...legs];
    if (field === 'formula' || field === 'mtmFormula') {
      (newLegs[index] as any)[field] = value as PricingFormula;
    } else if (
      field === 'loadingPeriodStart' || 
      field === 'loadingPeriodEnd' || 
      field === 'pricingPeriodStart' || 
      field === 'pricingPeriodEnd'
    ) {
      (newLegs[index] as any)[field] = value as Date;
    } else if (field === 'buySell') {
      (newLegs[index] as any)[field] = value as BuySell;
    } else if (field === 'product') {
      (newLegs[index] as any)[field] = value as Product;
    } else if (field === 'sustainability') {
      (newLegs[index] as any)[field] = value as string;
    } else if (field === 'incoTerm') {
      (newLegs[index] as any)[field] = value as IncoTerm;
    } else if (field === 'unit') {
      (newLegs[index] as any)[field] = value as Unit;
    } else if (field === 'paymentTerm') {
      (newLegs[index] as any)[field] = value as PaymentTerm;
    } else if (field === 'creditStatus') {
      (newLegs[index] as any)[field] = value as CreditStatus;
    } else {
      (newLegs[index] as any)[field] = Number(value);
    }
    setLegs(newLegs);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const isCounterpartyValid = validateRequiredField(counterparty, 'Counterparty', 'Please select a counterparty');
    
    const legValidations = legs.map((leg, index) => {
      const legNumber = index + 1;
      const validations = [
        validateRequiredField(leg.buySell, `Leg ${legNumber} - Buy/Sell`, 'Please select buy or sell'),
        validateRequiredField(leg.product, `Leg ${legNumber} - Product`, 'Please select a product'),
        validateRequiredField(leg.sustainability, `Leg ${legNumber} - Sustainability`, 'Please select sustainability'),
        validateRequiredField(leg.incoTerm, `Leg ${legNumber} - Incoterm`, 'Please select an incoterm'),
        validateRequiredField(leg.unit, `Leg ${legNumber} - Unit`, 'Please select a unit'),
        validateRequiredField(leg.paymentTerm, `Leg ${legNumber} - Payment Term`, 'Please select a payment term'),
        validateRequiredField(leg.creditStatus, `Leg ${legNumber} - Credit Status`, 'Please select a credit status'),
        validateRequiredField(leg.quantity, `Leg ${legNumber} - Quantity`, 'Please enter a quantity'),
        
        validateDateRange(
          leg.pricingPeriodStart, 
          leg.pricingPeriodEnd, 
          `Leg ${legNumber} - Pricing Period`,
          'End date must be after start date'
        ),
        validateDateRange(
          leg.loadingPeriodStart, 
          leg.loadingPeriodEnd, 
          `Leg ${legNumber} - Loading Period`,
          'End date must be after start date'
        )
      ];
      
      return validateFields(validations);
    });
    
    const areAllLegsValid = legValidations.every(isValid => isValid);
    
    if (isCounterpartyValid && areAllLegsValid) {
      const parentTrade: PhysicalParentTrade = {
        id: initialData?.id || crypto.randomUUID(),
        tradeReference,
        tradeType: 'physical',
        physicalType,
        counterparty,
        createdAt: initialData?.createdAt || new Date(),
        updatedAt: new Date()
      };

      const tradeLegs: PhysicalTradeLeg[] = legs.map((legForm, index) => {
        const legReference = initialData?.legs?.[index]?.legReference || 
                            generateLegReference(tradeReference, index);
        
        const legData: PhysicalTradeLeg = {
          id: initialData?.legs?.[index]?.id || crypto.randomUUID(),
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
          formula: legForm.formula,
          mtmFormula: legForm.mtmFormula
        };
        
        return legData;
      });

      const tradeData: any = {
        ...parentTrade,
        legs: tradeLegs,
        ...legs[0]
      };

      onSubmit(tradeData);
    } else {
      toast.error('Please fix the validation errors before submitting', {
        description: 'Check all required fields and date ranges above.'
      });
    }
  };

  const handleNumberInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
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
                  <Select 
                    value={leg.sustainability} 
                    onValueChange={(value) => updateLeg(legIndex, 'sustainability', value)}
                  >
                    <SelectTrigger id={`leg-${legIndex}-sustainability`}>
                      <SelectValue placeholder="Select sustainability" />
                    </SelectTrigger>
                    <SelectContent>
                      {sustainabilityOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Label htmlFor={`leg-${legIndex}-credit-status`}>Credit Status</Label>
                  <Select 
                    value={leg.creditStatus} 
                    onValueChange={(value) => updateLeg(legIndex, 'creditStatus', value)}
                  >
                    <SelectTrigger id={`leg-${legIndex}-credit-status`}>
                      <SelectValue placeholder="Select credit status" />
                    </SelectTrigger>
                    <SelectContent>
                      {creditStatusOptions.map((status) => (
                        <SelectItem key={status} value={status.toLowerCase()}>
                          {status}
                        </SelectItem>
                      ))}
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
                  <Label htmlFor={`leg-${legIndex}-quantity`}>Quantity</Label>
                  <Input 
                    id={`leg-${legIndex}-quantity`} 
                    type="number" 
                    value={leg.quantity} 
                    onChange={(e) => updateLeg(legIndex, 'quantity', e.target.value)} 
                    onFocus={handleNumberInputFocus}
                    required 
                  />
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
                  <Label htmlFor={`leg-${legIndex}-tolerance`}>Tolerance (%)</Label>
                  <Input 
                    id={`leg-${legIndex}-tolerance`} 
                    type="number" 
                    value={leg.tolerance} 
                    onChange={(e) => updateLeg(legIndex, 'tolerance', e.target.value)} 
                    onFocus={handleNumberInputFocus}
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

              <div className="border rounded-md p-4 bg-gray-50 mb-4">
                <Tabs defaultValue="price">
                  <TabsList className="w-full mb-4">
                    <TabsTrigger value="price">Price Formula</TabsTrigger>
                    <TabsTrigger value="mtm">MTM Formula</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="price">
                    <div className="mb-2">
                      <Label className="font-medium">Price Formula</Label>
                    </div>
                    <FormulaBuilder 
                      value={leg.formula || createEmptyFormula()} 
                      onChange={(formula) => handleFormulaChange(formula, legIndex)}
                      tradeQuantity={leg.quantity || 0}
                      buySell={leg.buySell}
                      selectedProduct={leg.product}
                      formulaType="price"
                      otherFormula={leg.mtmFormula || createEmptyFormula()}
                    />
                  </TabsContent>
                  
                  <TabsContent value="mtm">
                    <div className="mb-2">
                      <Label className="font-medium">MTM Pricing Formula</Label>
                    </div>
                    <FormulaBuilder 
                      value={leg.mtmFormula || createEmptyFormula()} 
                      onChange={(formula) => handleMtmFormulaChange(formula, legIndex)}
                      tradeQuantity={leg.quantity || 0}
                      buySell={leg.buySell}
                      selectedProduct={leg.product}
                      formulaType="mtm"
                      otherFormula={leg.formula || createEmptyFormula()}
                    />
                  </TabsContent>
                </Tabs>
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
          {isEditMode ? 'Update Trade' : 'Create Trade'}
        </Button>
      </div>
    </form>
  );
};

export default PhysicalTradeForm;
