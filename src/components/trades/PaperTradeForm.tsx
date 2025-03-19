
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useReferenceData } from '@/hooks/useReferenceData';
import { generateLegReference } from '@/utils/tradeUtils';
import { Plus, Trash2, PlusCircle } from 'lucide-react';
import { validateRequiredField, validateFields } from '@/utils/validationUtils';
import { toast } from 'sonner';
import { BuySell } from '@/types/trade';
import { PaperTradeLeg, PaperTradeProduct } from '@/types/paper';
import { PricingFormula } from '@/types/pricing';
import { createEmptyFormula } from '@/utils/formulaUtils';
import FormulaBuilder from './FormulaBuilder';
import ExposureTable from './ExposureTable';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { useProductRelationships } from '@/hooks/useProductRelationships';
import { useTradingPeriods } from '@/hooks/useTradingPeriods';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Broker } from '@/types/brokers';

interface TradeLegForm {
  id: string;
  legReference: string;
  buySell: BuySell;
  product: string;
  instrument: string;
  tradingPeriod: string;
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
  const [comment, setComment] = useState<string>(initialData?.comment || '');
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [selectedBroker, setSelectedBroker] = useState<string>('');
  const [newBrokerName, setNewBrokerName] = useState<string>('');
  const [isBrokerDialogOpen, setIsBrokerDialogOpen] = useState<boolean>(false);
  
  const { paperProducts, isLoading: isProductsLoading } = useProductRelationships();
  const { periods, isLoading: isPeriodsLoading } = useTradingPeriods();
  
  const createId = () => crypto.randomUUID();
  
  const [legs, setLegs] = useState<TradeLegForm[]>(
    initialData?.legs?.map((leg: any) => ({
      id: leg.id || createId(),
      legReference: leg.legReference || generateLegReference(tradeReference, 0),
      buySell: leg.buySell || 'buy',
      product: leg.product || '',
      instrument: leg.instrument || '',
      tradingPeriod: leg.tradingPeriod || '',
      price: leg.price || 0,
      quantity: leg.quantity || 0,
      broker: leg.broker || '',
      formula: leg.formula || createEmptyFormula(),
      mtmFormula: leg.mtmFormula || createEmptyFormula(),
    })) || [{
      id: createId(),
      legReference: generateLegReference(tradeReference, 0),
      buySell: 'buy',
      product: '',
      instrument: '',
      tradingPeriod: '',
      price: 0,
      quantity: 0,
      broker: '',
      formula: createEmptyFormula(),
      mtmFormula: createEmptyFormula(),
    }]
  );
  
  const [exposure, setExposure] = useState<ExposureRow[]>([]);
  const [highlightedProduct, setHighlightedProduct] = useState<string>('');

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
      
      if (data && data.length > 0 && !selectedBroker) {
        setSelectedBroker(data[0].id);
        
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
  
  useEffect(() => {
    calculateExposure();
  }, [legs]);
  
  const getInstrumentOptions = (productCode: string) => {
    const paperProduct = paperProducts.find(p => p.productCode === productCode);
    
    if (!paperProduct) return [''];
    
    switch (paperProduct.category) {
      case 'FP':
        return [`Argus ${paperProduct.baseProduct}`];
      case 'DIFF':
        return [`Argus ${paperProduct.baseProduct} vs Platts ${paperProduct.pairedProduct}`];
      case 'SPREAD':
        return [`Argus ${paperProduct.baseProduct} vs Argus ${paperProduct.pairedProduct}`];
      default:
        return [''];
    }
  };
  
  const addLeg = () => {
    const defaultBroker = brokers.find(b => b.id === selectedBroker)?.name || '';
    const legIndex = legs.length;
    
    setLegs(prev => [
      ...prev, 
      {
        id: createId(),
        legReference: generateLegReference(tradeReference, legIndex),
        buySell: 'buy',
        product: paperProducts.length > 0 ? paperProducts[0].productCode : '',
        instrument: '',
        tradingPeriod: periods.length > 0 ? periods[0].periodCode : '',
        price: 0,
        quantity: 0,
        broker: defaultBroker,
        formula: createEmptyFormula(),
        mtmFormula: createEmptyFormula(),
      }
    ]);
  };
  
  const removeLeg = (id: string) => {
    if (legs.length <= 1) {
      toast.error('Cannot remove the last trade leg');
      return;
    }
    
    setLegs(prev => prev.filter(leg => leg.id !== id));
  };
  
  const updateLeg = (id: string, field: keyof TradeLegForm, value: any) => {
    setLegs(prev => 
      prev.map(leg => {
        if (leg.id !== id) return leg;
        
        const updatedLeg = { ...leg, [field]: value };
        
        // Auto-update instrument when product changes
        if (field === 'product') {
          const instruments = getInstrumentOptions(value);
          updatedLeg.instrument = instruments[0] || '';
        }
        
        return updatedLeg;
      })
    );
  };
  
  const calculateExposure = () => {
    const exposureMap = new Map<string, Record<string, number>>();
    
    legs.forEach(leg => {
      const { buySell, product, quantity, tradingPeriod } = leg;
      
      if (!quantity || !tradingPeriod) return;
      
      const period = periods.find(p => p.periodCode === tradingPeriod);
      if (!period) return;
      
      const month = period.periodCode;
      
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
      
      const monthExposure = exposureMap.get(month)!;
      
      // Find the paper product
      const paperProduct = paperProducts.find(p => p.productCode === product);
      if (!paperProduct) return;
      
      const sign = buySell === 'buy' ? 1 : -1;
      
      // Apply different logic based on product category
      switch (paperProduct.category) {
        case 'FP':
          if (paperProduct.baseProduct) {
            monthExposure[paperProduct.baseProduct as keyof typeof monthExposure] += sign * quantity;
          }
          break;
        case 'DIFF':
          if (paperProduct.baseProduct) {
            monthExposure[paperProduct.baseProduct as keyof typeof monthExposure] += sign * quantity;
          }
          if (paperProduct.pairedProduct) {
            monthExposure[paperProduct.pairedProduct as keyof typeof monthExposure] -= sign * quantity;
          }
          break;
        case 'SPREAD':
          if (paperProduct.baseProduct) {
            monthExposure[paperProduct.baseProduct as keyof typeof monthExposure] += sign * quantity;
          }
          if (paperProduct.pairedProduct) {
            monthExposure[paperProduct.pairedProduct as keyof typeof monthExposure] -= sign * quantity;
          }
          break;
      }
      
      exposureMap.set(month, monthExposure);
    });
    
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
    
    exposureRows.sort((a, b) => a.month.localeCompare(b.month));
    
    setExposure(exposureRows);
  };
  
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
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const isCommentValid = validateRequiredField(comment, 'Comment');
    
    const legValidations = legs.map((leg, index) => {
      const legNumber = index + 1;
      return validateFields([
        validateRequiredField(leg.buySell, `Leg ${legNumber} - Buy/Sell`),
        validateRequiredField(leg.product, `Leg ${legNumber} - Product`),
        validateRequiredField(leg.instrument, `Leg ${legNumber} - Instrument`),
        validateRequiredField(leg.tradingPeriod, `Leg ${legNumber} - Trading Period`),
        validateRequiredField(leg.broker, `Leg ${legNumber} - Broker`),
        validateRequiredField(leg.quantity, `Leg ${legNumber} - Quantity`)
      ]);
    });
    
    const areAllLegsValid = legValidations.every(isValid => isValid);
    
    if (isCommentValid && areAllLegsValid) {
      // Prepare the leg data with trading period dates
      const tradeLegs: PaperTradeLeg[] = legs.map(leg => {
        const period = periods.find(p => p.periodCode === leg.tradingPeriod);
        return {
          id: leg.id,
          legReference: leg.legReference,
          parentTradeId: initialData?.id || '',
          buySell: leg.buySell,
          product: leg.product,
          instrument: leg.instrument,
          tradingPeriod: leg.tradingPeriod,
          periodStart: period?.startDate,
          periodEnd: period?.endDate,
          price: leg.price,
          quantity: leg.quantity,
          broker: leg.broker,
          formula: leg.formula,
          mtmFormula: leg.mtmFormula
        };
      });
      
      onSubmit({
        id: initialData?.id,
        tradeReference,
        tradeType: 'paper',
        comment,
        legs: tradeLegs
      });
    } else {
      toast.error('Please fix all validation errors before submitting');
    }
  };
  
  const resetForm = useCallback(() => {
    setComment(initialData?.comment || '');
    
    if (initialData?.legs) {
      setLegs(initialData.legs.map((leg: any) => ({
        id: leg.id || createId(),
        legReference: leg.legReference || generateLegReference(tradeReference, 0),
        buySell: leg.buySell || 'buy',
        product: leg.product || '',
        instrument: leg.instrument || '',
        tradingPeriod: leg.tradingPeriod || '',
        price: leg.price || 0,
        quantity: leg.quantity || 0,
        broker: leg.broker || '',
        formula: leg.formula || createEmptyFormula(),
        mtmFormula: leg.mtmFormula || createEmptyFormula(),
      })));
    } else {
      setLegs([{
        id: createId(),
        legReference: generateLegReference(tradeReference, 0),
        buySell: 'buy',
        product: paperProducts.length > 0 ? paperProducts[0].productCode : '',
        instrument: paperProducts.length > 0 ? getInstrumentOptions(paperProducts[0].productCode)[0] : '',
        tradingPeriod: periods.length > 0 ? periods[0].periodCode : '',
        price: 0,
        quantity: 0,
        broker: brokers.find(b => b.id === selectedBroker)?.name || '',
        formula: createEmptyFormula(),
        mtmFormula: createEmptyFormula(),
      }]);
    }
  }, [initialData, selectedBroker, brokers, paperProducts, periods, tradeReference]);
  
  const isLoading = isProductsLoading || isPeriodsLoading;
  
  if (isLoading) {
    return <div className="flex justify-center p-8">Loading trade data...</div>;
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="comment">Comment</Label>
            <Input
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Enter trade comment"
            />
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
      
      <Separator />
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Trade Legs</h3>
          <Button type="button" variant="outline" onClick={addLeg}>
            <Plus className="h-4 w-4 mr-1" />
            Add Leg
          </Button>
        </div>
        
        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0">
              <TableRow>
                <TableHead className="w-[80px]">Action</TableHead>
                <TableHead className="w-[100px]">Buy/Sell</TableHead>
                <TableHead className="w-[140px]">Product</TableHead>
                <TableHead className="w-[120px]">Period</TableHead>
                <TableHead className="w-[100px]">Quantity</TableHead>
                <TableHead className="w-[100px]">Price</TableHead>
                <TableHead className="w-[120px]">Broker</TableHead>
                <TableHead className="w-[100px]">Formula</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {legs.map((leg, index) => (
                <TableRow key={leg.id}>
                  <TableCell>
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
                  </TableCell>
                  <TableCell>
                    <Select 
                      value={leg.buySell} 
                      onValueChange={(value) => updateLeg(leg.id, 'buySell', value as BuySell)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buy">Buy</SelectItem>
                        <SelectItem value="sell">Sell</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select 
                      value={leg.product} 
                      onValueChange={(value) => updateLeg(leg.id, 'product', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {paperProducts.map((product) => (
                          <SelectItem key={product.id} value={product.productCode}>
                            {product.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select 
                      value={leg.tradingPeriod} 
                      onValueChange={(value) => updateLeg(leg.id, 'tradingPeriod', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="" disabled>Select a period</SelectItem>
                        
                        {/* Monthly periods */}
                        <SelectItem value="" disabled className="font-semibold text-primary">
                          Monthly
                        </SelectItem>
                        {periods
                          .filter(p => p.periodType === 'MONTH')
                          .map((period) => (
                            <SelectItem key={period.id} value={period.periodCode}>
                              {period.periodCode}
                            </SelectItem>
                          ))}
                        
                        {/* Quarterly periods */}
                        <SelectItem value="" disabled className="font-semibold text-primary mt-2">
                          Quarterly
                        </SelectItem>
                        {periods
                          .filter(p => p.periodType === 'QUARTER')
                          .map((period) => (
                            <SelectItem key={period.id} value={period.periodCode}>
                              {period.periodCode}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      value={leg.quantity || ''} 
                      onChange={(e) => updateLeg(leg.id, 'quantity', Number(e.target.value))} 
                      placeholder="Qty"
                      required 
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      value={leg.price || ''} 
                      onChange={(e) => updateLeg(leg.id, 'price', Number(e.target.value))} 
                      placeholder="Price"
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      value={leg.broker} 
                      onChange={(e) => updateLeg(leg.id, 'broker', e.target.value)} 
                      placeholder="Broker"
                      required 
                    />
                  </TableCell>
                  <TableCell>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // Show formula dialog or expand row for formula editing
                        toast.info(`Formula editing for ${leg.legReference}`, {
                          description: "Formula editing is available in the details section below"
                        });
                      }}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Formula editing sections */}
        {legs.map((leg, index) => (
          <Card key={`formula-${leg.id}`} className="border border-muted">
            <CardHeader className="p-4">
              <CardTitle className="text-md">
                Formula Details: {leg.legReference} - {paperProducts.find(p => p.productCode === leg.product)?.displayName || leg.product}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-4">
                <div className="space-y-2">
                  <Label>Product</Label>
                  <div className="p-2 bg-muted rounded">
                    {paperProducts.find(p => p.productCode === leg.product)?.displayName || leg.product}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Instrument</Label>
                  <div className="p-2 bg-muted rounded">
                    {leg.instrument || 'Not specified'}
                  </div>
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
                      onChange={(formula) => updateLeg(leg.id, 'formula', formula)}
                      tradeQuantity={leg.quantity || 0}
                      buySell={leg.buySell}
                      selectedProduct={paperProducts.find(p => p.productCode === leg.product)?.baseProduct || ''}
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
                      selectedProduct={paperProducts.find(p => p.productCode === leg.product)?.baseProduct || ''}
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
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Exposure Table</h3>
        <ExposureTable 
          exposures={exposure} 
          highlightedProduct={highlightedProduct}
        />
      </div>
      
      <Separator />
      
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
