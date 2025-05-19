import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useReferenceData } from '@/hooks/useReferenceData';
import { PricingFormula } from '@/types/pricing';
import { BuySell, Product, IncoTerm, Unit, PaymentTerm, CreditStatus, CustomsStatus } from '@/types';
import { DatePicker } from '@/components/ui/date-picker';
import { generateTradeReference } from '@/utils/tradeUtils';
import { createEmptyFormula } from '@/utils/formulaUtils';
import FormulaBuilder from './FormulaBuilder';
import { calculateMonthlyPricingDistribution } from '@/utils/formulaCalculation';
import { Switch } from '@/components/ui/switch';
import { getAvailableEfpMonths } from '@/utils/efpUtils';
import { createEfpFormula } from '@/utils/efpFormulaUtils';
import AddNewItemDialog from '@/components/common/AddNewItemDialog';

interface PaperTradeFormProps {
  tradeReference: string;
  onSubmit: (tradeData: any) => void;
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
  customsStatus: CustomsStatus;
  quantity: number;
  tolerance: number;
  loadingPeriodStart: Date;
  loadingPeriodEnd: Date;
  pricingPeriodStart: Date;
  pricingPeriodEnd: Date;
  formula: PricingFormula;
  pricingType: 'standard' | 'efp';
  efpPremium: number | null;
  efpAgreedStatus: boolean;
  efpFixedValue: number | null;
  efpDesignatedMonth: string;
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
  pricingType: 'standard',
  efpPremium: null,
  efpAgreedStatus: false,
  efpFixedValue: null,
  efpDesignatedMonth: getAvailableEfpMonths()[0],
});

const PaperTradeForm: React.FC<PaperTradeFormProps> = ({ tradeReference, onSubmit, onCancel }) => {
  const {
    counterparties,
    sustainabilityOptions,
    creditStatusOptions,
    customsStatusOptions,
    productOptions,
    addCounterparty
  } = useReferenceData();

  const [counterparty, setCounterparty] = useState('');
  const [buySell, setBuySell] = useState<BuySell>('buy');
  const [product, setProduct] = useState<Product>('UCOME');
  const [sustainability, setSustainability] = useState('');
  const [incoTerm, setIncoTerm] = useState<IncoTerm>('FOB');
  const [unit, setUnit] = useState<Unit>('MT');
  const [paymentTerm, setPaymentTerm] = useState<PaymentTerm>('30 days');
  const [creditStatus, setCreditStatus] = useState<CreditStatus>('pending');
  const [customsStatus, setCustomsStatus] = useState<CustomsStatus>('T1');
  const [quantity, setQuantity] = useState<number>(0);
  const [tolerance, setTolerance] = useState<number>(5);
  const [loadingPeriodStart, setLoadingPeriodStart] = useState<Date>(new Date());
  const [loadingPeriodEnd, setLoadingPeriodEnd] = useState<Date>(new Date());
  const [pricingPeriodStart, setPricingPeriodStart] = useState<Date>(new Date());
  const [pricingPeriodEnd, setPricingPeriodEnd] = useState<Date>(new Date());
  const [formula, setFormula] = useState<PricingFormula>(createEmptyFormula());
  const [pricingType, setPricingType] = useState<'standard' | 'efp'>('standard');
  const [efpPremium, setEfpPremium] = useState<number | null>(null);
  const [efpAgreedStatus, setEfpAgreedStatus] = useState<boolean>(false);
  const [efpFixedValue, setEfpFixedValue] = useState<number | null>(null);
  const [efpDesignatedMonth, setEfpDesignatedMonth] = useState<string>(getAvailableEfpMonths()[0]);

  useEffect(() => {
    if (pricingType === 'efp') {
      const updatedFormula = createEfpFormula(
        quantity || 0,
        buySell,
        efpAgreedStatus,
        efpDesignatedMonth
      );
      setFormula(updatedFormula);
    } else {
      // Recalculate monthly distribution for standard pricing
      const monthlyDistribution = calculateMonthlyPricingDistribution(
        formula.tokens,
        quantity || 0,
        buySell,
        pricingPeriodStart,
        pricingPeriodEnd
      );
      setFormula({
        ...formula,
        monthlyDistribution
      });
    }
  }, [pricingType, quantity, buySell, efpAgreedStatus, efpDesignatedMonth, formula.tokens, pricingPeriodStart, pricingPeriodEnd]);

  const handleFormulaChange = (newFormula: PricingFormula) => {
    setFormula(newFormula);
    const monthlyDistribution = calculateMonthlyPricingDistribution(
      newFormula.tokens,
      quantity || 0,
      buySell,
      pricingPeriodStart,
      pricingPeriodEnd
    );
    setFormula({
      ...newFormula,
      monthlyDistribution
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const tradeData = {
      tradeReference,
      counterparty,
      buySell,
      product,
      sustainability,
      incoTerm,
      unit,
      paymentTerm,
      creditStatus,
      customsStatus,
      quantity,
      tolerance,
      loadingPeriodStart,
      loadingPeriodEnd,
      pricingPeriodStart,
      pricingPeriodEnd,
      formula,
      pricingType,
      efpPremium,
      efpAgreedStatus,
      efpFixedValue,
      efpDesignatedMonth
    };

    onSubmit(tradeData);
  };

  const handleAddCounterparty = async (name: string) => {
    await addCounterparty(name);
    setCounterparty(name); // Auto-select the newly added counterparty
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Trade Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="counterparty">Counterparty</Label>
                <AddNewItemDialog 
                  title="Add New Counterparty" 
                  description="Enter the name of the new counterparty"
                  itemLabel="Name"
                  onAddItem={handleAddCounterparty}
                  buttonLabel="+ Add Counterparty"
                />
              </div>
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
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="buy-sell">Buy/Sell</Label>
              <Select value={buySell} onValueChange={setBuySell}>
                <SelectTrigger id="buy-sell">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">Buy</SelectItem>
                  <SelectItem value="sell">Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product">Product</Label>
              <Select value={product} onValueChange={setProduct}>
                <SelectTrigger id="product">
                  <SelectValue placeholder="Select product" />
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="sustainability">Sustainability</Label>
              <Select value={sustainability} onValueChange={setSustainability}>
                <SelectTrigger id="sustainability">
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

            <div className="space-y-2">
              <Label htmlFor="inco-term">Incoterm</Label>
              <Select value={incoTerm} onValueChange={setIncoTerm}>
                <SelectTrigger id="inco-term">
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
              <Select value={unit} onValueChange={setUnit}>
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
              <Select value={paymentTerm} onValueChange={setPaymentTerm}>
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
              <Select value={creditStatus} onValueChange={setCreditStatus}>
                <SelectTrigger id="credit-status">
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
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customs-status">Customs Status</Label>
              <Select value={customsStatus} onValueChange={setCustomsStatus}>
                <SelectTrigger id="customs-status">
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

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                type="number"
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tolerance">Tolerance (%)</Label>
              <Input
                type="number"
                id="tolerance"
                value={tolerance}
                onChange={(e) => setTolerance(e.target.value ? Number(e.target.value) : 0)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Loading Period Start</Label>
              <DatePicker date={loadingPeriodStart} setDate={setLoadingPeriodStart} />
            </div>
            <div className="space-y-2">
              <Label>Loading Period End</Label>
              <DatePicker date={loadingPeriodEnd} setDate={setLoadingPeriodEnd} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pricing Period Start</Label>
              <DatePicker date={pricingPeriodStart} setDate={setPricingPeriodStart} />
            </div>
            <div className="space-y-2">
              <Label>Pricing Period End</Label>
              <DatePicker date={pricingPeriodEnd} setDate={setPricingPeriodEnd} />
            </div>
          </div>

          <div className="mb-4">
            <Label className="mb-2 block">Pricing Type</Label>
            <Select value={pricingType} onValueChange={setPricingType}>
              <SelectTrigger id="pricing-type">
                <SelectValue placeholder="Select pricing type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard Formula</SelectItem>
                <SelectItem value="efp">ICE Gasoil EFP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {pricingType === 'efp' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="efpPremium">EFP Premium</Label>
                  <Input
                    id="efpPremium"
                    type="number"
                    value={efpPremium || ""}
                    onChange={e => setEfpPremium(e.target.value ? Number(e.target.value) : null)}
                  />
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <Switch id="efpAgreedStatus" checked={efpAgreedStatus} onCheckedChange={setEfpAgreedStatus} />
                  <Label htmlFor="efpAgreedStatus">EFP Agreed/Fixed</Label>
                </div>

                {efpAgreedStatus ? (
                  <div>
                    <Label htmlFor="efpFixedValue">Fixed Value</Label>
                    <Input
                      id="efpFixedValue"
                      type="number"
                      value={efpFixedValue || ""}
                      onChange={e => setEfpFixedValue(e.target.value ? Number(e.target.value) : null)}
                    />
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="efpDesignatedMonth">Designated Month</Label>
                    <Select value={efpDesignatedMonth} onValueChange={setEfpDesignatedMonth}>
                      <SelectTrigger id="efpDesignatedMonth">
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableEfpMonths().map(month => (
                          <SelectItem key={month} value={month}>{month}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Pricing Formula</Label>
              <FormulaBuilder
                value={formula}
                onChange={handleFormulaChange}
                tradeQuantity={quantity || 0}
                buySell={buySell}
                selectedProduct={product}
                formulaType="price"
                otherFormula={createEmptyFormula()}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Create Trade</Button>
      </div>
    </form>
  );
};

export default PaperTradeForm;
