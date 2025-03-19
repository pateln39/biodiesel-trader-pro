
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useReferenceData } from '@/hooks/useReferenceData';
import { BuySell, Product } from '@/types';
import { PaperParentTrade, PaperTradeLeg, PaperTrade } from '@/types/paper';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { generateLegReference } from '@/utils/tradeUtils';
import { DatePicker } from '@/components/ui/date-picker';
import FormulaBuilder from './FormulaBuilder';
import { createEmptyFormula } from '@/utils/formulaUtils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PricingFormula } from '@/types/pricing';
import { validateDateRange, validateRequiredField, validateFields } from '@/utils/validationUtils';
import { toast } from 'sonner';
import { Broker } from '@/types/brokers';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { PlusCircle } from 'lucide-react';

interface PaperTradeFormProps {
  tradeReference: string;
  onSubmit: (trade: any) => void;
  onCancel: () => void;
  isEditMode?: boolean;
  initialData?: PaperTrade;
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
  formula?: PricingFormula;
  mtmFormula?: PricingFormula;
}

const createDefaultLeg = (broker: string = ''): PaperLegFormState => ({
  buySell: 'buy',
  product: 'UCOME',
  instrument: 'Argus UCOME',
  pricingPeriodStart: new Date(),
  pricingPeriodEnd: new Date(),
  price: 0,
  quantity: 0,
  broker: broker,
  formula: createEmptyFormula(),
  mtmFormula: createEmptyFormula()
});

interface ExposureRow {
  month: string;
  UCOME: number;
  FAME0: number;
  RME: number;
  HVO: number;
  LSGO: number;
  ICE_GASOIL_FUTURES: number;
}

const PaperTradeForm: React.FC<PaperTradeFormProps> = ({ 
  tradeReference, 
  onSubmit, 
  onCancel, 
  isEditMode = false,
  initialData 
}) => {
  const { counterparties } = useReferenceData();
  const [counterparty, setCounterparty] = useState<string>(initialData?.counterparty || '');
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [selectedBroker, setSelectedBroker] = useState<string>('');
  const [newBrokerName, setNewBrokerName] = useState<string>('');
  const [isBrokerDialogOpen, setIsBrokerDialogOpen] = useState<boolean>(false);
  const [exposure, setExposure] = useState<ExposureRow[]>([]);
  
  const [legs, setLegs] = useState<PaperLegFormState[]>([
    initialData ? {
      buySell: initialData.buySell || 'buy',
      product: initialData.product || 'UCOME',
      instrument: initialData.instrument || '',
      pricingPeriodStart: initialData.pricingPeriodStart || new Date(),
      pricingPeriodEnd: initialData.pricingPeriodEnd || new Date(),
      price: initialData.price || 0,
      quantity: initialData.quantity || 0,
      broker: initialData.broker || '',
      formula: initialData.formula || createEmptyFormula(),
      mtmFormula: initialData.mtmFormula || createEmptyFormula()
    } : createDefaultLeg()
  ]);

  // Fetch brokers on component mount
  useEffect(() => {
    const fetchBrokers = async () => {
      try {
        const { data, error } = await supabase
          .from('brokers')
          .select('id, name, is_active, created_at');
          
        if (error) {
          throw error;
        }
        
        setBrokers(data || []);
        
        // Set default broker if available
        if (data && data.length > 0 && !selectedBroker) {
          setSelectedBroker(data[0].id);
          
          // Set default broker for all legs
          setLegs(prevLegs => 
            prevLegs.map(leg => ({
              ...leg,
              broker: data[0].name
            }))
          );
        }
      } catch (error: any) {
        console.error('Error fetching brokers:', error);
        toast.error('Failed to fetch brokers', {
          description: error.message
        });
      }
    };
    
    fetchBrokers();
  }, []);

  // Calculate exposure whenever legs change
  useEffect(() => {
    calculateExposure();
  }, [legs]);

  const addLeg = () => {
    const defaultBroker = brokers.find(b => b.id === selectedBroker)?.name || '';
    setLegs([...legs, createDefaultLeg(defaultBroker)]);
  };

  const removeLeg = (index: number) => {
    if (legs.length > 1) {
      const newLegs = [...legs];
      newLegs.splice(index, 1);
      setLegs(newLegs);
    } else {
      toast.error('Cannot remove the last trade leg');
    }
  };

  const updateLeg = (index: number, field: keyof PaperLegFormState, value: string | Date | number | PricingFormula) => {
    const newLegs = [...legs];
    if (field === 'pricingPeriodStart' || field === 'pricingPeriodEnd') {
      (newLegs[index] as any)[field] = value as Date;
    } else if (field === 'instrument' || field === 'broker') {
      (newLegs[index] as any)[field] = value as string;
    } else if (field === 'buySell') {
      (newLegs[index] as any)[field] = value as BuySell;
    } else if (field === 'product') {
      (newLegs[index] as any)[field] = value as Product;
    } else if (field === 'formula' || field === 'mtmFormula') {
      (newLegs[index] as any)[field] = value as PricingFormula;
    } else {
      (newLegs[index] as any)[field] = Number(value);
    }
    setLegs(newLegs);
  };

  const handleFormulaChange = (formula: PricingFormula, legIndex: number) => {
    updateLeg(legIndex, 'formula', formula);
  };

  const handleMtmFormulaChange = (formula: PricingFormula, legIndex: number) => {
    updateLeg(legIndex, 'mtmFormula', formula);
  };

  // Simple exposure calculation
  const calculateExposure = () => {
    // Create a map of months to exposures
    const exposureMap = new Map<string, Record<string, number>>();
    
    // For each leg, calculate the exposure
    legs.forEach(leg => {
      const { buySell, product, quantity, pricingPeriodStart, pricingPeriodEnd } = leg;
      
      // Skip legs with no quantity
      if (!quantity) return;
      
      // Get the month from the pricing period
      const startMonth = `${pricingPeriodStart.getFullYear()}-${String(pricingPeriodStart.getMonth() + 1).padStart(2, '0')}`;
      const endMonth = `${pricingPeriodEnd.getFullYear()}-${String(pricingPeriodEnd.getMonth() + 1).padStart(2, '0')}`;
      
      // For simplicity, just use the start month in this example
      const month = startMonth;
      
      // Initialize the month if it doesn't exist
      if (!exposureMap.has(month)) {
        exposureMap.set(month, {
          UCOME: 0,
          FAME0: 0,
          RME: 0,
          HVO: 0,
          LSGO: 0,
          ICE_GASOIL_FUTURES: 0
        });
      }
      
      // Get the current exposure for this month
      const monthExposure = exposureMap.get(month)!;
      
      // Update the exposure based on the leg
      // For buy, add the quantity. For sell, subtract it.
      const sign = buySell === 'buy' ? 1 : -1;
      monthExposure[product as keyof typeof monthExposure] += sign * quantity;
      
      // Special case for spreads (simplified for this example)
      if (product === 'RME') {
        // If RME, add opposite position to FAME0 for spread
        monthExposure['FAME0'] -= sign * quantity;
      }
      
      // Update the map
      exposureMap.set(month, monthExposure);
    });
    
    // Convert the map to an array of ExposureRow
    const exposureRows: ExposureRow[] = [];
    exposureMap.forEach((exposure, month) => {
      exposureRows.push({
        month,
        UCOME: exposure.UCOME,
        FAME0: exposure.FAME0,
        RME: exposure.RME,
        HVO: exposure.HVO,
        LSGO: exposure.LSGO,
        ICE_GASOIL_FUTURES: exposure.ICE_GASOIL_FUTURES
      });
    });
    
    // Sort by month
    exposureRows.sort((a, b) => a.month.localeCompare(b.month));
    
    setExposure(exposureRows);
  };

  // Add a new broker
  const addBroker = async () => {
    if (!newBrokerName.trim()) {
      toast.error('Broker name cannot be empty');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('brokers')
        .insert({ name: newBrokerName.trim() })
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      setBrokers(prev => [...prev, data as Broker]);
      setSelectedBroker(data.id);
      setNewBrokerName('');
      setIsBrokerDialogOpen(false);
      
      toast.success('Broker added successfully');
    } catch (error: any) {
      toast.error('Failed to add broker', {
        description: error.message
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const isCounterpartyValid = validateRequiredField(counterparty, 'Counterparty');
    
    const legValidations = legs.map((leg, index) => {
      const legNumber = index + 1;
      const validations = [
        validateRequiredField(leg.buySell, `Leg ${legNumber} - Buy/Sell`),
        validateRequiredField(leg.product, `Leg ${legNumber} - Product`),
        validateRequiredField(leg.instrument, `Leg ${legNumber} - Instrument`),
        validateRequiredField(leg.broker, `Leg ${legNumber} - Broker`),
        validateRequiredField(leg.quantity, `Leg ${legNumber} - Quantity`),
        validateDateRange(
          leg.pricingPeriodStart, 
          leg.pricingPeriodEnd, 
          `Leg ${legNumber} - Pricing Period`
        )
      ];
      
      return validateFields(validations);
    });
    
    const areAllLegsValid = legValidations.every(isValid => isValid);
    
    if (isCounterpartyValid && areAllLegsValid) {
      const parentTrade: PaperParentTrade = {
        id: initialData?.id || crypto.randomUUID(),
        tradeReference,
        tradeType: 'paper',
        counterparty,
        createdAt: initialData?.createdAt || new Date(),
        updatedAt: new Date()
      };

      const tradeLegs: PaperTradeLeg[] = legs.map((legForm, index) => {
        const legReference = initialData?.legs?.[index]?.legReference || 
                          generateLegReference(tradeReference, index);
        
        const legData: PaperTradeLeg = {
          id: initialData?.legs?.[index]?.id || crypto.randomUUID(),
          legReference,
          parentTradeId: parentTrade.id,
          buySell: legForm.buySell,
          product: legForm.product,
          instrument: legForm.instrument,
          pricingPeriodStart: legForm.pricingPeriodStart,
          pricingPeriodEnd: legForm.pricingPeriodEnd,
          price: legForm.price,
          quantity: legForm.quantity,
          broker: legForm.broker,
          formula: legForm.formula,
          mtmFormula: legForm.mtmFormula
        };
        
        return legData;
      });

      const tradeData: any = {
        ...parentTrade,
        ...legs[0],
        legs: tradeLegs
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
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Trade Details</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

          <div className="flex items-center space-x-2">
            <Label htmlFor="broker" className="min-w-24">Default Broker</Label>
            <div className="flex-1">
              <Select 
                value={selectedBroker} 
                onValueChange={setSelectedBroker}
              >
                <SelectTrigger id="broker">
                  <SelectValue placeholder="Select broker" />
                </SelectTrigger>
                <SelectContent>
                  {brokers.filter(b => b.is_active).map((broker) => (
                    <SelectItem key={broker.id} value={broker.id}>{broker.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Dialog open={isBrokerDialogOpen} onOpenChange={setIsBrokerDialogOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Add Broker
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Broker</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="newBrokerName">Broker Name</Label>
                    <Input
                      id="newBrokerName"
                      value={newBrokerName}
                      onChange={(e) => setNewBrokerName(e.target.value)}
                      placeholder="Enter broker name"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <DialogClose asChild>
                      <Button type="button" variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="button" onClick={addBroker}>Add Broker</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
                      <SelectItem value="HVO">HVO</SelectItem>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`leg-${legIndex}-price`}>Fixed Price (Optional)</Label>
                  <Input 
                    id={`leg-${legIndex}-price`} 
                    type="number" 
                    value={leg.price} 
                    onChange={(e) => updateLeg(legIndex, 'price', e.target.value)} 
                    onFocus={handleNumberInputFocus}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`leg-${legIndex}-quantity`}>Quantity (MT)</Label>
                  <Input 
                    id={`leg-${legIndex}-quantity`} 
                    type="number" 
                    value={leg.quantity} 
                    onChange={(e) => updateLeg(legIndex, 'quantity', e.target.value)} 
                    onFocus={handleNumberInputFocus}
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
          {isEditMode ? 'Update Trade' : 'Create Trade'}
        </Button>
      </div>
    </form>
  );
};

export default PaperTradeForm;
