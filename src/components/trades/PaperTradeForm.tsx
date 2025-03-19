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
import { Broker } from '@/types/brokers';
import { TradingPeriod, PeriodType } from '@/types/paper';

interface TradeLegForm {
  id: string;
  buySell: BuySell;
  product: Product;
  instrument: string;
  tradingPeriod: string;
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
  const [tradingPeriods, setTradingPeriods] = useState<TradingPeriod[]>([]);
  const [isLoadingPeriods, setIsLoadingPeriods] = useState<boolean>(true);
  
  const createId = () => crypto.randomUUID();
  
  const [legs, setLegs] = useState<TradeLegForm[]>(
    initialData?.legs?.map((leg: any) => ({
      id: leg.id || createId(),
      buySell: leg.buySell || 'buy',
      product: leg.product || 'UCOME',
      instrument: leg.instrument || 'Argus UCOME',
      tradingPeriod: leg.tradingPeriod || '',
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
      tradingPeriod: '',
      pricingPeriodStart: new Date(),
      pricingPeriodEnd: new Date(),
      price: 0,
      quantity: 0,
      broker: '',
      formula: createEmptyFormula(),
      mtmFormula: createEmptyFormula(),
    }]
  );
  
  const [exposure, setExposure] = useState<ExposureRow[]>([]);

  // Fetch trading periods
  useEffect(() => {
    const fetchTradingPeriods = async () => {
      setIsLoadingPeriods(true);
      try {
        const { data, error } = await supabase
          .from('trading_periods')
          .select('*')
          .eq('is_active', true)
          .order('start_date', { ascending: true });
          
        if (error) {
          throw error;
        }
        
        const mappedPeriods = data.map(period => ({
          id: period.id,
          periodCode: period.period_code,
          periodType: period.period_type as PeriodType,
          startDate: new Date(period.start_date),
          endDate: new Date(period.end_date)
        }));
        
        setTradingPeriods(mappedPeriods);
      } catch (error: any) {
        toast.error('Failed to fetch trading periods', {
          description: error.message
        });
      } finally {
        setIsLoadingPeriods(false);
      }
    };
    
    fetchTradingPeriods();
  }, []);

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
  
  const addLeg = () => {
    const defaultBroker = brokers.find(b => b.id === selectedBroker)?.name || '';
    
    setLegs(prev => [
      ...prev, 
      {
        id: createId(),
        buySell: 'buy',
        product: 'UCOME',
        instrument: 'Argus UCOME',
        tradingPeriod: '',
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
  
  const removeLeg = (id: string) => {
    if (legs.length <= 1) {
      toast.error('Cannot remove the last trade leg');
      return;
    }
    
    setLegs(prev => prev.filter(leg => leg.id !== id));
  };
  
  const updateLeg = (id: string, field: keyof TradeLegForm, value: any) => {
    setLegs(prev => 
      prev.map(leg => 
        leg.id === id ? { ...leg, [field]: value } : leg
      )
    );
  };
  
  // Update period dates when trading period changes
  const handleTradingPeriodChange = (legId: string, periodCode: string) => {
    const period = tradingPeriods.find(p => p.periodCode === periodCode);
    
    if (period) {
      updateLeg(legId, 'tradingPeriod', periodCode);
      updateLeg(legId, 'pricingPeriodStart', period.startDate);
      updateLeg(legId, 'pricingPeriodEnd', period.endDate);
    }
  };
  
  const calculateExposure = () => {
    const exposureMap = new Map<string, Record<string, number>>();
    
    legs.forEach(leg => {
      const { buySell, product, quantity, pricingPeriodStart, pricingPeriodEnd } = leg;
      
      if (!quantity) return;
      
      const startMonth = `${pricingPeriodStart.getFullYear()}-${String(pricingPeriodStart.getMonth() + 1).padStart(2, '0')}`;
      const endMonth = `${pricingPeriodEnd.getFullYear()}-${String(pricingPeriodEnd.getMonth() + 1).padStart(2, '0')}`;
      
      const month = startMonth;
      
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
      
      const sign = buySell === 'buy' ? 1 : -1;
      monthExposure[product as keyof typeof monthExposure] += sign * quantity;
      
      if (product === 'RME') {
        monthExposure['FAME0'] -= sign * quantity;
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
    
    const isCounterpartyValid = validateRequiredField(counterparty, 'Counterparty');
    const isCommentValid = validateRequiredField(comment, 'Comment');
    
    const legValidations = legs.map((leg, index) => {
      const legNumber = index + 1;
      return validateFields([
        validateRequiredField(leg.buySell, `Leg ${legNumber} - Buy/Sell`),
        validateRequiredField(leg.product, `Leg ${legNumber} - Product`),
        validateRequiredField(leg.instrument, `Leg ${legNumber} - Instrument`),
        validateRequiredField(leg.broker, `Leg ${legNumber} - Broker`),
        validateRequiredField(leg.quantity, `Leg ${legNumber} - Quantity`),
        validateRequiredField(leg.tradingPeriod, `Leg ${legNumber} - Trading Period`),
      ]);
    });
    
    const areAllLegsValid = legValidations.every(isValid => isValid);
    
    if (isCounterpartyValid && isCommentValid && areAllLegsValid) {
      const tradeLegs: PaperTradeLeg[] = legs.map((leg, index) => {
        return {
          id: leg.id,
          legReference: generateLegReference(tradeReference, index),
          parentTradeId: initialData?.id || '',
          buySell: leg.buySell,
          product: leg.product,
          instrument: leg.instrument,
          tradingPeriod: leg.tradingPeriod,
          periodStart: leg.pricingPeriodStart,
          periodEnd: leg.pricingPeriodEnd,
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
        counterparty,
        comment,
        legs: tradeLegs
      });
    } else {
      toast.error('Please fix all validation errors before submitting');
    }
  };
  
  const resetForm = useCallback(() => {
    setCounterparty(initialData?.counterparty || '');
    setComment(initialData?.comment || '');
    
    if (initialData?.legs) {
      setLegs(initialData.legs.map((leg: any) => ({
        id: leg.id || createId(),
        buySell: leg.buySell || 'buy',
        product: leg.product || 'UCOME',
        instrument: leg.instrument || 'Argus UCOME',
        tradingPeriod: leg.tradingPeriod || '',
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
        tradingPeriod: '',
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
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Trade Legs</h3>
          <Button type="button" variant="outline" onClick={addLeg}>
            <Plus className="h-4 w-4 mr-1" />
            Add Leg
          </Button>
        </div>
        
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
                  <Label htmlFor={`leg-${leg.id}-period`}>Trading Period</Label>
                  <Select 
                    value={leg.tradingPeriod} 
                    onValueChange={(value) => handleTradingPeriodChange(leg.id, value)}
                    disabled={isLoadingPeriods}
                  >
                    <SelectTrigger id={`leg-${leg.id}-period`}>
                      <SelectValue placeholder={isLoadingPeriods ? "Loading periods..." : "Select period"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="" disabled>Select a trading period</SelectItem>
                      
                      {/* Monthly periods */}
                      <SelectItem value="" disabled className="font-semibold">Monthly Periods</SelectItem>
                      {tradingPeriods
                        .filter(p => p.periodType === 'MONTH')
                        .map(period => (
                          <SelectItem key={period.id} value={period.periodCode}>
                            {period.periodCode}
                          </SelectItem>
                        ))
                      }
                      
                      {/* Quarterly periods */}
                      <SelectItem value="" disabled className="font-semibold mt-2">Quarterly Periods</SelectItem>
                      {tradingPeriods
                        .filter(p => p.periodType === 'QUARTER')
                        .map(period => (
                          <SelectItem key={period.id} value={period.periodCode}>
                            {period.periodCode}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Period Range</Label>
                  <div className="text-sm border border-muted rounded-md p-2 bg-gray-50">
                    {leg.tradingPeriod ? (
                      <>
                        <p><span className="font-medium">Start:</span> {leg.pricingPeriodStart.toLocaleDateString()}</p>
                        <p><span className="font-medium">End:</span> {leg.pricingPeriodEnd.toLocaleDateString()}</p>
                      </>
                    ) : (
                      <p className="text-muted-foreground">Select a trading period</p>
                    )}
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
