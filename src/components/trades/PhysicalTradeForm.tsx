import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useReferenceData } from '@/hooks/useReferenceData';
import { BuySell, Product, PhysicalTradeType, IncoTerm, Unit, PaymentTerm, CreditStatus, CustomsStatus, PhysicalTrade, PhysicalTradeLeg, PricingType } from '@/types';
import { PricingFormula } from '@/types/pricing';
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
import { calculateMonthlyPricingDistribution } from '@/utils/formulaCalculation';
import { Switch } from '@/components/ui/switch';
import { getAvailableEfpMonths } from '@/utils/efpUtils';
import { createEmptyExposureResult } from '@/utils/formulaCalculation';
import { isDateRangeInFuture, getMonthsInDateRange, getDefaultMtmFutureMonth } from '@/utils/mtmUtils';
import { createEfpFormula, updateFormulaWithEfpExposure } from '@/utils/efpFormulaUtils';
import AddNewItemDialog from './AddNewItemDialog';

interface PhysicalTradeFormProps {
  tradeReference: string;
  onSubmit: (trade: any) => void;
  onCancel: () => void;
  isEditMode?: boolean;
  initialData?: PhysicalTrade;
  comments?: string;
}

interface LegFormState {
  buySell: BuySell;
  product: Product;
  sustainability: string;
  incoTerm: IncoTerm;
  unit: Unit;
  paymentTerm: PaymentTerm;
  creditStatus: CreditStatus;
  customsStatus: CustomsStatus;
  quantity: number;
  tolerance: number;
  loadingPeriodStart: Date;
  loadingPeriodEnd: Date;
  pricingPeriodStart: Date;
  pricingPeriodEnd: Date;
  formula?: PricingFormula;
  mtmFormula?: PricingFormula;
  pricingType: PricingType;
  efpPremium: number | null;
  efpAgreedStatus: boolean;
  efpFixedValue: number | null;
  efpDesignatedMonth: string;
  mtmFutureMonth: string;
}

const createDefaultLeg = (): LegFormState => ({
  buySell: 'buy',
  product: 'UCOME',
  sustainability: '',
  incoTerm: 'FOB',
  unit: 'MT',
  paymentTerm: '30 days',
  creditStatus: 'pending',
  customsStatus: 'T1',
  quantity: 0,
  tolerance: 5,
  loadingPeriodStart: new Date(),
  loadingPeriodEnd: new Date(),
  pricingPeriodStart: new Date(),
  pricingPeriodEnd: new Date(),
  formula: createEmptyFormula(),
  mtmFormula: createEmptyFormula(),
  pricingType: "standard",
  efpPremium: null,
  efpAgreedStatus: false,
  efpFixedValue: null,
  efpDesignatedMonth: getAvailableEfpMonths()[0],
  mtmFutureMonth: "",
});

const EFPPricingForm = ({
  values,
  onChange
}: {
  values: LegFormState;
  onChange: (field: keyof LegFormState, value: any) => void;
}) => {
  const availableMonths = getAvailableEfpMonths();

  useEffect(() => {
    if (values.pricingType === 'efp') {
      const updatedFormula = createEfpFormula(
        values.quantity || 0,
        values.buySell,
        values.efpAgreedStatus,
        values.efpDesignatedMonth
      );
      
      onChange('formula', updatedFormula);
    }
  }, [values.pricingType, values.quantity, values.buySell, values.efpAgreedStatus, values.efpDesignatedMonth]);

  return <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="efpPremium">EFP Premium</Label>
          <Input id="efpPremium" type="number" value={values.efpPremium || ""} onChange={e => onChange("efpPremium", e.target.value ? Number(e.target.value) : null)} />
        </div>
        
        <div className="flex items-center space-x-2 pt-6">
          <Switch id="efpAgreedStatus" checked={values.efpAgreedStatus} onCheckedChange={checked => onChange("efpAgreedStatus", checked)} />
          <Label htmlFor="efpAgreedStatus">EFP Agreed/Fixed</Label>
        </div>
        
        {values.efpAgreedStatus ? <div>
            <Label htmlFor="efpFixedValue">Fixed Value</Label>
            <Input id="efpFixedValue" type="number" value={values.efpFixedValue || ""} onChange={e => onChange("efpFixedValue", e.target.value ? Number(e.target.value) : null)} />
          </div> : <div>
            <Label htmlFor="efpDesignatedMonth">Designated Month</Label>
            <Select value={values.efpDesignatedMonth} onValueChange={value => onChange("efpDesignatedMonth", value)}>
              <SelectTrigger id="efpDesignatedMonth">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map(month => <SelectItem key={month} value={month}>{month}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>}
      </div>
    </div>;
};

const PhysicalTradeForm: React.FC<PhysicalTradeFormProps> = ({
  tradeReference,
  onSubmit,
  onCancel,
  isEditMode = false,
  initialData,
  comments
}) => {
  const {
    counterparties,
    sustainabilityOptions,
    creditStatusOptions,
    customsStatusOptions,
    productOptions,
    addProduct,
    addCounterparty
  } = useReferenceData();

  const [physicalType, setPhysicalType] = useState<PhysicalTradeType>(initialData?.physicalType || 'spot');
  const [counterparty, setCounterparty] = useState(initialData?.counterparty || '');
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [isAddCounterpartyDialogOpen, setIsAddCounterpartyDialogOpen] = useState(false);
  const [selectedProductLegIndex, setSelectedProductLegIndex] = useState<number | null>(null);

  const [legs, setLegs] = useState<LegFormState[]>(initialData?.legs?.map(leg => ({
    buySell: leg.buySell,
    product: leg.product as Product,
    sustainability: leg.sustainability || '',
    incoTerm: leg.incoTerm || 'FOB',
    unit: leg.unit || 'MT',
    paymentTerm: leg.paymentTerm || '30 days',
    creditStatus: leg.creditStatus || 'pending',
    customsStatus: leg.customsStatus || 'T1',
    quantity: leg.quantity,
    tolerance: leg.tolerance || 0,
    loadingPeriodStart: leg.loadingPeriodStart,
    loadingPeriodEnd: leg.loadingPeriodEnd,
    pricingPeriodStart: leg.pricingPeriodStart,
    pricingPeriodEnd: leg.pricingPeriodEnd,
    formula: leg.formula || createEmptyFormula(),
    mtmFormula: leg.mtmFormula || createEmptyFormula(),
    pricingType: leg.pricingType || "standard",
    efpPremium: leg.efpPremium || null,
    efpAgreedStatus: leg.efpAgreedStatus || false,
    efpFixedValue: leg.efpFixedValue || null,
    efpDesignatedMonth: leg.efpDesignatedMonth || getAvailableEfpMonths()[0],
    mtmFutureMonth: leg.mtmFutureMonth || "",
  })) || [createDefaultLeg()]);

  const handleFormulaChange = (formula: PricingFormula, legIndex: number) => {
    const newLegs = [...legs];
    newLegs[legIndex].formula = formula;
    if (newLegs[legIndex].pricingPeriodStart && newLegs[legIndex].pricingPeriodEnd) {
      const monthlyDistribution = calculateMonthlyPricingDistribution(
        formula.tokens, 
        newLegs[legIndex].quantity || 0, 
        newLegs[legIndex].buySell, 
        newLegs[legIndex].pricingPeriodStart, 
        newLegs[legIndex].pricingPeriodEnd
      );
      newLegs[legIndex].formula = {
        ...formula,
        monthlyDistribution
      };
    }
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

  const updateLeg = (index: number, field: keyof LegFormState, value: any) => {
    const newLegs = [...legs];
    (newLegs[index] as any)[field] = value;
    
    if (['pricingPeriodStart', 'pricingPeriodEnd'].includes(field)) {
      const leg = newLegs[index];
      if (leg.pricingPeriodStart && leg.pricingPeriodEnd) {
        if (isDateRangeInFuture(leg.pricingPeriodStart, leg.pricingPeriodEnd)) {
          const availableMonths = getMonthsInDateRange(leg.pricingPeriodStart, leg.pricingPeriodEnd);
          if (!leg.mtmFutureMonth || !availableMonths.includes(leg.mtmFutureMonth)) {
            leg.mtmFutureMonth = getDefaultMtmFutureMonth(leg.pricingPeriodStart);
          }
        }
      }
    }
    
    if (['formula', 'pricingPeriodStart', 'pricingPeriodEnd', 'buySell', 'quantity'].includes(field) && newLegs[index].formula && newLegs[index].pricingPeriodStart && newLegs[index].pricingPeriodEnd && newLegs[index].pricingType !== 'efp') {
      const leg = newLegs[index];
      const monthlyDistribution = calculateMonthlyPricingDistribution(
        leg.formula.tokens, 
        leg.quantity || 0, 
        leg.buySell, 
        leg.pricingPeriodStart, 
        leg.pricingPeriodEnd
      );
      leg.formula = {
        ...leg.formula,
        monthlyDistribution
      };
    }
    
    if (['pricingType', 'buySell', 'quantity', 'efpAgreedStatus', 'efpDesignatedMonth'].includes(field)) {
      const leg = newLegs[index];
      
      if (leg.pricingType === 'efp') {
        leg.formula = createEfpFormula(
          leg.quantity || 0,
          leg.buySell,
          leg.efpAgreedStatus,
          leg.efpDesignatedMonth
        );
      }
    }
    
    setLegs(newLegs);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isCounterpartyValid = validateRequiredField(counterparty, 'Counterparty');
    const legValidations = legs.map((leg, index) => {
      const legNumber = index + 1;
      const validations = [validateRequiredField(leg.buySell, `Leg ${legNumber} - Buy/Sell`), validateRequiredField(leg.product, `Leg ${legNumber} - Product`), validateRequiredField(leg.sustainability, `Leg ${legNumber} - Sustainability`), validateRequiredField(leg.incoTerm, `Leg ${legNumber} - Incoterm`), validateRequiredField(leg.unit, `Leg ${legNumber} - Unit`), validateRequiredField(leg.paymentTerm, `Leg ${legNumber} - Payment Term`), validateRequiredField(leg.creditStatus, `Leg ${legNumber} - Credit Status`), validateRequiredField(leg.customsStatus, `Leg ${legNumber} - Customs Status`), validateRequiredField(leg.quantity, `Leg ${legNumber} - Quantity`), validateDateRange(leg.pricingPeriodStart, leg.pricingPeriodEnd, `Leg ${legNumber} - Pricing Period`), validateDateRange(leg.loadingPeriodStart, leg.loadingPeriodEnd, `Leg ${legNumber} - Loading Period`)];
      if (leg.pricingType === 'efp') {
        validations.push(validateRequiredField(leg.efpPremium, `Leg ${legNumber} - EFP Premium`));
        if (leg.efpAgreedStatus) {
          validations.push(validateRequiredField(leg.efpFixedValue, `Leg ${legNumber} - EFP Fixed Value`));
        } else {
          validations.push(validateRequiredField(leg.efpDesignatedMonth, `Leg ${legNumber} - EFP Designated Month`));
        }
      }
      if (leg.pricingPeriodStart && leg.pricingPeriodEnd && 
          isDateRangeInFuture(leg.pricingPeriodStart, leg.pricingPeriodEnd)) {
        validations.push(validateRequiredField(leg.mtmFutureMonth, `Leg ${legNumber} - MTM Future Month`));
      }
      return validateFields(validations);
    });
    const areAllLegsValid = legValidations.every(isValid => isValid);
    if (isCounterpartyValid && areAllLegsValid) {
      const parentTrade = {
        id: initialData?.id || crypto.randomUUID(),
        tradeReference,
        tradeType: 'physical' as const,
        physicalType,
        counterparty,
        createdAt: initialData?.createdAt || new Date(),
        updatedAt: new Date()
      };
      
      const tradeLegs = prepareLegsForSubmission(legs);
      
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

  const prepareLegsForSubmission = (legs: LegFormState[]): PhysicalTradeLeg[] => {
    return legs.map((legForm, index) => {
      const legReference = initialData?.legs?.[index]?.legReference || generateLegReference(tradeReference, index);
      
      let formula = legForm.formula;
      if (legForm.pricingType === 'efp') {
        formula = createEfpFormula(
          legForm.quantity || 0,
          legForm.buySell,
          legForm.efpAgreedStatus,
          legForm.efpDesignatedMonth
        );
      }
      
      const legData: PhysicalTradeLeg = {
        id: initialData?.legs?.[index]?.id || crypto.randomUUID(),
        legReference,
        parentTradeId: initialData?.id || '',
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
        customsStatus: legForm.customsStatus,
        formula: formula,
        mtmFormula: legForm.mtmFormula,
        pricingType: legForm.pricingType,
        efpPremium: legForm.efpPremium !== null ? legForm.efpPremium : undefined,
        efpAgreedStatus: legForm.efpAgreedStatus,
        efpFixedValue: legForm.efpFixedValue !== null ? legForm.efpFixedValue : undefined,
        efpDesignatedMonth: legForm.efpDesignatedMonth,
        mtmFutureMonth: legForm.mtmFutureMonth
      };
      
      return legData;
    });
  };

  const handleNumberInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const handleAddProduct = async (productName: string) => {
    await addProduct(productName);
    
    // If we were adding a product for a specific leg, select it
    if (selectedProductLegIndex !== null) {
      const newLegs = [...legs];
      newLegs[selectedProductLegIndex].product = productName as Product;
      setLegs(newLegs);
      setSelectedProductLegIndex(null);
    }
  };
  
  const handleAddCounterparty = async (counterpartyName: string) => {
    await addCounterparty(counterpartyName);
    setCounterparty(counterpartyName);
  };

  const openAddProductDialog = (legIndex?: number) => {
    if (legIndex !== undefined) {
      setSelectedProductLegIndex(legIndex);
    } else {
      setSelectedProductLegIndex(null);
    }
    setIsAddProductDialogOpen(true);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="physical-type">Trade Type</Label>
          <Select value={physicalType} onValueChange={value => setPhysicalType(value as PhysicalTradeType)}>
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
          <Select value={counterparty} onValueChange={setCounterparty}>
            <SelectTrigger id="counterparty">
              <SelectValue placeholder="Select counterparty" />
            </SelectTrigger>
            <SelectContent>
              {counterparties.map(name => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
              <SelectItem value="__add_new__" className="text-primary font-medium">
                <div className="flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Counterparty
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {counterparty === "__add_new__" && (
        <div className="mt-1">
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={() => setIsAddCounterpartyDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add New Counterparty
          </Button>
        </div>
      )}

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
                {physicalType === 'spot' ? 'Spot Trade Details' : `Leg ${legIndex + 1} (${generateLegReference(tradeReference, legIndex)})`}
              </CardTitle>
              {physicalType === 'term' && legs.length > 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => removeLeg(legIndex)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor={`leg-${legIndex}-buy-sell`}>Buy/Sell</Label>
                  <Select value={leg.buySell} onValueChange={value => updateLeg(legIndex, 'buySell', value as BuySell)}>
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
                  <Select value={leg.product} onValueChange={value => {
                    if (value === "__add_new__") {
                      openAddProductDialog(legIndex);
                    } else {
                      updateLeg(legIndex, 'product', value as Product);
                    }
                  }}>
                    <SelectTrigger id={`leg-${legIndex}-product`}>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* First show the built-in product options */}
                      <SelectItem value="FAME0">FAME0</SelectItem>
                      <SelectItem value="RME">RME</SelectItem>
                      <SelectItem value="UCOME">UCOME</SelectItem>
                      <SelectItem value="UCOME-5">UCOME-5</SelectItem>
                      <SelectItem value="RME DC">RME DC</SelectItem>
                      <SelectItem value="HVO">HVO</SelectItem>
                      
                      {/* Then show products from the database */}
                      {productOptions
                        .filter(product => 
                          !["FAME0", "RME", "UCOME", "UCOME-5", "RME DC", "HVO"].includes(product)
                        )
                        .map(product => (
                          <SelectItem key={product} value={product}>
                            {product}
                          </SelectItem>
                        ))
                      }
                      
                      {/* Option to add a new product */}
                      <SelectItem value="__add_new__" className="text-primary font-medium">
                        <div className="flex items-center">
                          <Plus className="h-4 w-4 mr-2" />
                          Add New Product
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`leg-${legIndex}-sustainability`}>Sustainability</Label>
                  <Select value={leg.sustainability} onValueChange={value => updateLeg(legIndex, 'sustainability', value)}>
                    <SelectTrigger id={`leg-${legIndex}-sustainability`}>
                      <SelectValue placeholder="Select sustainability" />
                    </SelectTrigger>
                    <SelectContent>
                      {sustainabilityOptions.map(option => (
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
                  <Select value={leg.incoTerm} onValueChange={value => updateLeg(legIndex, 'incoTerm', value as IncoTerm)}>
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
                  <Select value={leg.creditStatus} onValueChange={value => updateLeg(legIndex, 'creditStatus', value)}>
                    <SelectTrigger id={`leg-${legIndex}-credit-status`}>
                      <SelectValue placeholder="Select credit status" />
                    </SelectTrigger>
                    <SelectContent>
                      {creditStatusOptions.map(status => (
                        <SelectItem key={status} value={status.toLowerCase()}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`leg-${legIndex}-product-credit-status`}>Customs Status</Label>
                  <Select value={leg.customsStatus} onValueChange={value => updateLeg(legIndex, 'customsStatus', value)}>
                    <SelectTrigger id={`leg-${legIndex}-product-credit-status`}>
                      <SelectValue placeholder="Select customs status" />
                    </SelectTrigger>
                    <SelectContent>
                      {customsStatusOptions.map(status => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor={`leg-${legIndex}-payment-term`}>Payment Term</Label>
                  <Select value={leg.paymentTerm} onValueChange={value => updateLeg(legIndex, 'paymentTerm', value as PaymentTerm)}>
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

                <div className="space-y-2">
                  <Label htmlFor={`leg-${legIndex}-quantity`}>Quantity</Label>
                  <Input id={`leg-${legIndex}-quantity`} type="number" value={leg.quantity} onChange={e => updateLeg(legIndex, 'quantity', e.target.value ? Number(e.target.value) : 0)} onFocus={handleNumberInputFocus} required />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`leg-${legIndex}-unit`}>Unit</Label>
                  <Select value={leg.unit} onValueChange={value => updateLeg(legIndex, 'unit', value as Unit)}>
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
              </div>

              <div className="space-y-2 mb-4">
                <Label htmlFor={`leg-${legIndex}-tolerance`}>Tolerance (%)</Label>
                <Input id={`leg-${legIndex}-tolerance`} type="number" value={leg.tolerance} onChange={e => updateLeg(legIndex, 'tolerance', e.target.value ? Number(e.target.value) : 0)} onFocus={handleNumberInputFocus} required />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label>Pricing Period Start</Label>
                  <DatePicker date={leg.pricingPeriodStart} setDate={date => updateLeg(legIndex, 'pricingPeriodStart', date)} />
                </div>
                <div className="space-y-2">
                  <Label>Pricing Period End</Label>
                  <DatePicker date={leg.pricingPeriodEnd} setDate={date => updateLeg(legIndex, 'pricingPeriodEnd', date)} />
                </div>
              </div>
              
              {leg.pricingPeriodStart && leg.pricingPeriodEnd && 
               isDateRangeInFuture(leg.pricingPeriodStart, leg.pricingPeriodEnd) && (
                <div className="mb-4">
                  <Label htmlFor={`leg-${legIndex}-mtm-future-month`} className="text-orange-500">
                    MTM Future Month <span className="text-xs">(Required for future pricing periods)</span>
                  </Label>
                  <Select 
                    value={leg.mtmFutureMonth} 
                    onValueChange={value => updateLeg(legIndex, 'mtmFutureMonth', value)}
                  >
                    <SelectTrigger id={`leg-${legIndex}-mtm-future-month`}>
                      <SelectValue placeholder="Select month for MTM calculation" />
                    </SelectTrigger>
                    <SelectContent>
                      {getMonthsInDateRange(leg.pricingPeriodStart, leg.pricingPeriodEnd).map(month => (
                        <SelectItem key={month} value={month}>{month}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-muted-foreground mt-1">
                    Select which month's forward prices to use for MTM calculations
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label>Loading Period Start</Label>
                  <DatePicker date={leg.loadingPeriodStart} setDate={date => updateLeg(legIndex, 'loadingPeriodStart', date)} />
                </div>
                <div className="space-y-2">
                  <Label>Loading Period End</Label>
                  <DatePicker date={leg.loadingPeriodEnd} setDate={date => updateLeg(legIndex, 'loadingPeriodEnd', date)} />
                </div>
              </div>

              <div className="mb-4">
                <Label className="mb-2 block">Pricing Type</Label>
                <Select value={leg.pricingType} onValueChange={value => updateLeg(legIndex, 'pricingType', value as "standard" | "efp")}>
                  <SelectTrigger id={`leg-${legIndex}-pricing-type`}>
                    <SelectValue placeholder="Select pricing type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard Formula</SelectItem>
                    <SelectItem value="efp">ICE Gasoil EFP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md p-4 mb-4 bg-gradient-to-br from-brand-navy/75 via-brand-navy/60 to-brand-lime/25 border-r-[3px] border-brand-lime/30 shadow-md">
                <Tabs defaultValue="price">
                  <TabsList className="w-full mb-4">
                    <TabsTrigger value="price" disabled={leg.pricingType === 'efp'} className={leg.pricingType === 'efp' ? 'opacity-50' : ''}>
                      Price Formula
                    </TabsTrigger>
                    <TabsTrigger value="efp" disabled={leg.pricingType !== 'efp'} className={leg.pricingType !== 'efp' ? 'opacity-50' : ''}>
                      EFP Pricing
                    </TabsTrigger>
                    <TabsTrigger value="mtm">MTM Formula</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="price">
                    <div className="mb-2">
                      <Label className="font-medium">Price Formula</Label>
                    </div>
                    {leg.pricingType === 'standard' ? <FormulaBuilder value={leg.formula || createEmptyFormula()} onChange={formula => handleFormulaChange(formula, legIndex)} tradeQuantity={leg.quantity || 0} buySell={leg.buySell} selectedProduct={leg.product} formulaType="price" otherFormula={leg.mtmFormula || createEmptyFormula()} /> : <div className="text-muted-foreground text-sm italic">
                        Standard formula pricing is disabled when EFP pricing is selected.
                      </div>}
                  </TabsContent>
                  
                  <TabsContent value="efp">
                    <div className="mb-2">
                      <Label className="font-medium">EFP Pricing Details</Label>
                    </div>
                    <EFPPricingForm values={leg} onChange={(field, value) => updateLeg(legIndex, field, value)} />
                  </TabsContent>
                  
                  <TabsContent value="mtm">
                    <div className="mb-2">
                      <Label className="font-medium">MTM Pricing Formula</Label>
                    </div>
                    <FormulaBuilder value={leg.mtmFormula || createEmptyFormula()} onChange={formula => handleMtmFormulaChange(formula, legIndex)} tradeQuantity={leg.quantity || 0} buySell={leg.buySell} selectedProduct={leg.product} formulaType="mtm" otherFormula={leg.formula || createEmptyFormula()} />
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

      {/* Dialogs for adding new items */}
      <AddNewItemDialog
        isOpen={isAddProductDialogOpen}
        onClose={() => setIsAddProductDialogOpen(false)}
        onAdd={handleAddProduct}
        title="Add New Product"
        itemLabel="Product Name"
        placeholder="Enter product name"
      />
      
      <AddNewItemDialog
        isOpen={isAddCounterpartyDialogOpen}
        onClose={() => {
          setIsAddCounterpartyDialogOpen(false);
          if (counterparty === "__add_new__") {
            setCounterparty("");
          }
        }}
        onAdd={handleAddCounterparty}
        title="Add New Counterparty"
        itemLabel="Counterparty Name"
        placeholder="Enter counterparty name"
      />
    </form>
  );
};

export default PhysicalTradeForm;
