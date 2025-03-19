
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatePicker } from '@/components/ui/date-picker';
import { useReferenceData } from '@/hooks/useReferenceData';
import { generateLegReference } from '@/utils/tradeUtils';
import { Plus, Trash2, PlusCircle } from 'lucide-react';
import { validateDateRange, validateRequiredField, validateFields } from '@/utils/validationUtils';
import { toast } from 'sonner';
import { BuySell, Product } from '@/types/trade';
import { PaperTradeLeg } from '@/types/paper';
import { PricingFormula } from '@/types/pricing';
import { createEmptyFormula } from '@/utils/formulaUtils';
import FormulaBuilder from './FormulaBuilder';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Types for the form state
interface TradeLegForm {
  id: string;
  buySell: BuySell;
  product: Product;
  instrument: string;
  pricingPeriodStart: Date;
  pricingPeriodEnd: Date;
  price: number;
  quantity: number;
  broker: string;
  formula: PricingFormula;
  mtmFormula: PricingFormula;
}

interface ExposureRow {
  month: string;
  UCOME: number;
  FAME0: number;
  RME: number;
  HVO: number;
  LSGO: number;
  ICE_GASOIL_FUTURES: number;
}

interface Broker {
  id: string;
  name: string;
  is_active: boolean;
}

interface PaperTradeFormProps {
  tradeReference: string;
  onSubmit: (trade: any) => void;
  onCancel: () => void;
  isEditMode?: boolean;
  initialData?: any;
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
  const [comment, setComment] = useState<string>(initialData?.comment || '');
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [selectedBroker, setSelectedBroker] = useState<string>('');
  const [newBrokerName, setNewBrokerName] = useState<string>('');
  const [isBrokerDialogOpen, setIsBrokerDialogOpen] = useState<boolean>(false);
  
  // Create a unique ID for each leg
  const createId = () => crypto.randomUUID();
  
  // Initialize with one empty leg if no initial data
  const [legs, setLegs] = useState<TradeLegForm[]>(
    initialData?.legs?.map((leg: any) => ({
      id: leg.id || createId(),
      buySell: leg.buySell || 'buy',
      product: leg.product || 'UCOME',
      instrument: leg.instrument || 'Argus UCOME',
      pricingPeriodStart: leg.pricingPeriodStart || new Date(),
      pricingPeriodEnd: leg.pricingPeriodEnd || new Date(),
      price: leg.price || 0,
      quantity: leg.quantity || 0,
      broker: leg.broker || '',
      formula: leg.formula || createEmptyFormula(),
      mtmFormula: leg.mtmFormula || createEmptyFormula(),
    })) || [{
      id: createId(),
      buySell: 'buy',
      product: 'UCOME',
      instrument: 'Argus UCOME',
      pricingPeriodStart: new Date(),
      pricingPeriodEnd: new Date(),
      price: 0,
      quantity: 0,
      broker: '',
      formula: createEmptyFormula(),
      mtmFormula: createEmptyFormula(),
    }]
  );
  
  // Calculate exposure based on trade legs
  const [exposure, setExposure] = useState<ExposureRow[]>([]);

  // Fetch brokers on component mount
  useEffect(() => {
    const fetchBrokers = async () => {
      const { data, error } = await supabase
        .from('brokers')
        .select('*')
        .order('name');
        
      if (error) {
        toast.error('Failed to fetch brokers', {
          description: error.message
        });
        return;
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
    };
    
    fetchBrokers();
  }, []);
  
  // Calculate exposure whenever legs change
  useEffect(() => {
    calculateExposure();
  }, [legs]);
  
  // Add a new leg
  const addLeg = () => {
    const defaultBroker = brokers.find(b => b.id === selectedBroker)?.name || '';
    
    setLegs(prev => [
      ...prev, 
      {
        id: createId(),
        buySell: 'buy',
        product: 'UCOME',
        instrument: 'Argus UCOME',
        pricingPeriodStart: new Date(),
        pricingPeriodEnd: new Date(),
        price: 0,
        quantity: 0,
        broker: defaultBroker,
        formula: createEmptyFormula(),
        mtmFormula: createEmptyFormula(),
      }
    ]);
  };
  
  // Remove a leg
  const removeLeg = (id: string) => {
    if (legs.length <= 1) {
      toast.error('Cannot remove the last trade leg');
      return;
    }
    
    setLegs(prev => prev.filter(leg => leg.id !== id));
  };
  
  // Update a leg
  const updateLeg = (id: string, field: keyof TradeLegForm, value: any) => {
    setLegs(prev => 
      prev.map(leg => 
        leg.id === id ? { ...leg, [field]: value } : leg
      )
    );
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
      // In a real implementation, we'd distribute across all months in the range
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
        ...exposure
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
      
      setBrokers(prev => [...prev, data]);
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
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form fields
    const isCounterpartyValid = validateRequiredField(counterparty, 'Counterparty');
    const isCommentValid = validateRequiredField(comment, 'Comment');
    
    // Validate each leg
    const legValidations = legs.map((leg, index) => {
      const legNumber = index + 1;
      return validateFields([
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
      ]);
    });
    
    // Check if all validations passed
    const areAllLegsValid = legValidations.every(isValid => isValid);
    
    if (isCounterpartyValid && isCommentValid && areAllLegsValid) {
      // Prepare submission data
      const tradeLegs: PaperTradeLeg[] = legs.map((leg, index) => {
        return {
          id: leg.id,
          legReference: generateLegReference(tradeReference, index),
          parentTradeId: initialData?.id || '',
          buySell: leg.buySell,
          product: leg.product,
          instrument: leg.instrument,
          pricingPeriodStart: leg.pricingPeriodStart,
          pricingPeriodEnd: leg.pricingPeriodEnd,
          price: leg.price,
          quantity: leg.quantity,
          broker: leg.broker,
          formula: leg.formula,
          mtmFormula: leg.mtmFormula
        };
      });
      
      // Submit the form
      onSubmit({
        id: initialData?.id,
        tradeReference,
        tradeType: 'paper',
        counterparty,
        comment,
        legs: tradeLegs
      });
    } else {
      toast.error('Please fix all validation errors before submitting');
    }
  };
  
  // Reset all form fields to initial state
  const resetForm = useCallback(() => {
    setCounterparty(initialData?.counterparty || '');
    setComment(initialData?.comment || '');
    
    // Reset legs
    if (initialData?.legs) {
      setLegs(initialData.legs.map((leg: any) => ({
        id: leg.id || createId(),
        buySell: leg.buySell || 'buy',
        product: leg.product || 'UCOME',
        instrument: leg.instrument || 'Argus UCOME',
        pricingPeriodStart: leg.pricingPeriodStart || new Date(),
        pricingPeriodEnd: leg.pricingPeriodEnd || new Date(),
        price: leg.price || 0,
        quantity: leg.quantity || 0,
        broker: leg.broker || '',
        formula: leg.formula || createEmptyFormula(),
        mtmFormula: leg.mtmFormula || createEmptyFormula(),
      })));
    } else {
      setLegs([{
        id: createId(),
        buySell: 'buy',
        product: 'UCOME',
        instrument: 'Argus UCOME',
        pricingPeriodStart: new Date(),
        pricingPeriodEnd: new Date(),
        price: 0,
        quantity: 0,
        broker: brokers.find(b => b.id === selectedBroker)?.name || '',
        formula: createEmptyFormula(),
        mtmFormula: createEmptyFormula(),
      }]);
    }
  }, [initialData, selectedBroker, brokers]);
  
  // Render the form
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header Section */}
      <div className="space-y-4">
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
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="comment">Comment</Label>
            <Input
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Enter trade comment"
            />
          </div>
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
      
      <Separator />
      
      {/* Trade Legs Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Trade Legs</h3>
          <Button type="button" variant="outline" onClick={addLeg}>
            <Plus className="h-4 w-4 mr-1" />
            Add Leg
          </Button>
        </div>
        
        {/* Trade Legs Table */}
        {legs.map((leg, index) => (
          <Card key={leg.id} className="border border-muted">
            <CardHeader className="p-4 flex flex-row items-start justify-between">
              <CardTitle className="text-md">
                Leg {index + 1} ({generateLegReference(tradeReference, index)})
              </CardTitle>
              {legs.length > 1 && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => removeLeg(leg.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor={`leg-${leg.id}-buy-sell`}>Buy/Sell</Label>
                  <Select 
                    value={leg.buySell} 
                    onValueChange={(value) => updateLeg(leg.id, 'buySell', value as BuySell)}
                  >
                    <SelectTrigger id={`leg-${leg.id}-buy-sell`}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="sell">Sell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`leg-${leg.id}-product`}>Product</Label>
                  <Select 
                    value={leg.product} 
                    onValueChange={(value) => updateLeg(leg.id, 'product', value as Product)}
                  >
                    <SelectTrigger id={`leg-${leg.id}-product`}>
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
                  <Label htmlFor={`leg-${leg.id}-instrument`}>Instrument</Label>
                  <Select 
                    value={leg.instrument} 
                    onValueChange={(value) => updateLeg(leg.id, 'instrument', value)}
                  >
                    <SelectTrigger id={`leg-${leg.id}-instrument`}>
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
                  <Label htmlFor={`leg-${leg.id}-broker`}>Broker</Label>
                  <Input 
                    id={`leg-${leg.id}-broker`} 
                    value={leg.broker} 
                    onChange={(e) => updateLeg(leg.id, 'broker', e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label>Pricing Period Start</Label>
                  <DatePicker 
                    date={leg.pricingPeriodStart}
                    setDate={(date) => updateLeg(leg.id, 'pricingPeriodStart', date)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pricing Period End</Label>
                  <DatePicker 
                    date={leg.pricingPeriodEnd}
                    setDate={(date) => updateLeg(leg.id, 'pricingPeriodEnd', date)}
                  />
                </div>
              </div>

              {/* Formula Builder Tabs */}
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
                      onChange={(formula) => updateLeg(leg.id, 'formula', formula)}
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
                      onChange={(formula) => updateLeg(leg.id, 'mtmFormula', formula)}
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
                  <Label htmlFor={`leg-${leg.id}-price`}>Fixed Price (Optional)</Label>
                  <Input 
                    id={`leg-${leg.id}-price`} 
                    type="number" 
                    value={leg.price || ''} 
                    onChange={(e) => updateLeg(leg.id, 'price', Number(e.target.value))} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`leg-${leg.id}-quantity`}>Quantity (MT)</Label>
                  <Input 
                    id={`leg-${leg.id}-quantity`} 
                    type="number" 
                    value={leg.quantity || ''} 
                    onChange={(e) => updateLeg(leg.id, 'quantity', Number(e.target.value))} 
                    required 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Separator />
      
      {/* Exposure Table Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Exposure Table</h3>
        
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Month</TableHead>
                <TableHead>UCOME</TableHead>
                <TableHead>FAME0</TableHead>
                <TableHead>RME</TableHead>
                <TableHead>HVO</TableHead>
                <TableHead>LSGO</TableHead>
                <TableHead>ICE GASOIL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exposure.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                    No exposure data available. Add trade legs with quantities to see exposure.
                  </TableCell>
                </TableRow>
              ) : (
                exposure.map((row) => (
                  <TableRow key={row.month}>
                    <TableCell className="font-medium">{row.month}</TableCell>
                    <TableCell className={row.UCOME !== 0 ? 'font-semibold' : ''}>
                      {row.UCOME !== 0 ? row.UCOME.toFixed(2) : '-'}
                    </TableCell>
                    <TableCell className={row.FAME0 !== 0 ? 'font-semibold' : ''}>
                      {row.FAME0 !== 0 ? row.FAME0.toFixed(2) : '-'}
                    </TableCell>
                    <TableCell className={row.RME !== 0 ? 'font-semibold' : ''}>
                      {row.RME !== 0 ? row.RME.toFixed(2) : '-'}
                    </TableCell>
                    <TableCell className={row.HVO !== 0 ? 'font-semibold' : ''}>
                      {row.HVO !== 0 ? row.HVO.toFixed(2) : '-'}
                    </TableCell>
                    <TableCell className={row.LSGO !== 0 ? 'font-semibold' : ''}>
                      {row.LSGO !== 0 ? row.LSGO.toFixed(2) : '-'}
                    </TableCell>
                    <TableCell className={row.ICE_GASOIL_FUTURES !== 0 ? 'font-semibold' : ''}>
                      {row.ICE_GASOIL_FUTURES !== 0 ? row.ICE_GASOIL_FUTURES.toFixed(2) : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      <Separator />
      
      {/* Form Actions */}
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" variant="outline" onClick={resetForm}>
          Reset
        </Button>
        <Button type="submit">
          {isEditMode ? 'Update Trade' : 'Create Trade'}
        </Button>
      </div>
    </form>
  );
};

export default PaperTradeForm;
