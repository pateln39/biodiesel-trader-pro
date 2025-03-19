import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { generateLegReference } from '@/utils/tradeUtils';
import { supabase } from '@/integrations/supabase/client';
import { useTradingPeriods } from '@/hooks/useTradingPeriods';
import { useProductRelationships } from '@/hooks/useProductRelationships';
import { BuySell } from '@/types/trade';
import PaperTradeTable, { TradeLeg } from './PaperTradeTable';
import ExposureTable from './ExposureTable';

// Interface for exposure row data
interface ExposureRow {
  month: string;
  UCOME: number;
  FAME0: number;
  RME: number;
  HVO: number;
  LSGO: number;
  ICE_GASOIL_FUTURES: number;
}

// Interface for broker data
interface Broker {
  id: string;
  name: string;
  is_active?: boolean;
}

interface PaperTradeFormProps {
  tradeReference: string;
  onSubmit: (trade: any) => void;
  onCancel: () => void;
}

const PaperTradeForm: React.FC<PaperTradeFormProps> = ({ 
  tradeReference, 
  onSubmit, 
  onCancel
}) => {
  // State for form inputs
  const [comment, setComment] = useState<string>('');
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [selectedBroker, setSelectedBroker] = useState<string>('');
  const [newBrokerName, setNewBrokerName] = useState<string>('');
  const [isBrokerDialogOpen, setIsBrokerDialogOpen] = useState<boolean>(false);
  
  // Get paper products and trading periods
  const { paperProducts, isLoading: isProductsLoading, getPaperProductRule, getAutoPopulatedPaperLeg } = useProductRelationships();
  const { periods, isLoading: isPeriodsLoading } = useTradingPeriods();
  
  // State for legs
  const [tradeLegs, setTradeLegs] = useState<{
    legA: TradeLeg[];
    legB: TradeLeg[];
  }>({
    legA: [],
    legB: []
  });
  
  // State for exposure calculations
  const [exposure, setExposure] = useState<ExposureRow[]>([]);
  const [highlightedProduct, setHighlightedProduct] = useState<string>('');
  
  // Loading state
  const isLoading = isProductsLoading || isPeriodsLoading;

  // Fetch brokers on mount
  useEffect(() => {
    const fetchBrokers = async () => {
      try {
        const { data, error } = await supabase
          .from('brokers')
          .select('*')
          .order('name');
          
        if (error) {
          throw error;
        }
        
        setBrokers(data || []);
        
        if (data && data.length > 0) {
          setSelectedBroker(data[0].id);
        }
      } catch (error: any) {
        console.error('Error loading brokers:', error);
        toast.error('Failed to fetch brokers', {
          description: error.message
        });
      }
    };
    
    fetchBrokers();
  }, []);
  
  // Add a leg to side A
  const addLegA = () => {
    const defaultBroker = brokers.find(b => b.id === selectedBroker)?.name || '';
    const legIndex = tradeLegs.legA.length;
    
    // Get default product for new leg
    const defaultProduct = paperProducts.length > 0 ? paperProducts[0].productCode : '';
    
    const newLeg: TradeLeg = {
      id: crypto.randomUUID(),
      legReference: generateLegReference(tradeReference, legIndex),
      buySell: 'buy',
      product: defaultProduct,
      tradingPeriod: '',
      price: 0,
      quantity: 0,
      broker: defaultBroker
    };
    
    setTradeLegs(prev => ({
      ...prev,
      legA: [...prev.legA, newLeg]
    }));
  };
  
  // Add a leg to side B
  const addLegB = () => {
    const defaultBroker = brokers.find(b => b.id === selectedBroker)?.name || '';
    const legIndex = tradeLegs.legB.length;
    
    // Get default product for new leg
    const defaultProduct = paperProducts.length > 0 ? paperProducts[0].productCode : '';
    
    const newLeg: TradeLeg = {
      id: crypto.randomUUID(),
      legReference: generateLegReference(tradeReference, legIndex),
      buySell: 'sell',
      product: defaultProduct,
      tradingPeriod: '',
      price: 0,
      quantity: 0,
      broker: defaultBroker
    };
    
    setTradeLegs(prev => ({
      ...prev,
      legB: [...prev.legB, newLeg]
    }));
  };
  
  // Update a leg
  const updateLeg = (side: 'A' | 'B', index: number, field: keyof TradeLeg, value: any) => {
    setTradeLegs(prev => {
      const legsArray = side === 'A' ? [...prev.legA] : [...prev.legB];
      const otherSideArray = side === 'A' ? [...prev.legB] : [...prev.legA];
      
      // Update the specified field
      const updatedLeg = { ...legsArray[index], [field]: value };
      legsArray[index] = updatedLeg;
      
      // Apply product rules if product or quantity changed
      if ((field === 'product' || field === 'quantity' || field === 'buySell') && 
          updatedLeg.product && 
          updatedLeg.quantity) {
        
        // Check if we should auto-populate a leg on the other side
        const populatedLeg = getAutoPopulatedPaperLeg(
          updatedLeg.product,
          updatedLeg.buySell as BuySell,
          updatedLeg.quantity
        );
        
        if (populatedLeg) {
          // If we have same index on other side, update it
          if (otherSideArray[index]) {
            otherSideArray[index] = {
              ...otherSideArray[index],
              product: populatedLeg.productCode,
              buySell: populatedLeg.buySell,
              quantity: populatedLeg.quantity
            };
          } else {
            // Otherwise add a new leg to other side
            const defaultBroker = brokers.find(b => b.id === selectedBroker)?.name || '';
            
            otherSideArray.push({
              id: crypto.randomUUID(),
              legReference: generateLegReference(tradeReference, otherSideArray.length),
              product: populatedLeg.productCode,
              buySell: populatedLeg.buySell,
              quantity: populatedLeg.quantity,
              tradingPeriod: updatedLeg.tradingPeriod,
              price: 0,
              broker: defaultBroker
            });
          }
        }
      }
      
      // Update trading period dates if period changed
      if (field === 'tradingPeriod') {
        const period = periods.find(p => p.periodCode === value);
        
        if (period) {
          updatedLeg.periodStart = period.startDate;
          updatedLeg.periodEnd = period.endDate;
        }
      }
      
      return side === 'A' 
        ? { legA: legsArray, legB: otherSideArray }
        : { legA: otherSideArray, legB: legsArray };
    });
  };
  
  // Remove a leg
  const removeLeg = (side: 'A' | 'B', index: number) => {
    setTradeLegs(prev => {
      const legsArray = side === 'A' ? [...prev.legA] : [...prev.legB];
      legsArray.splice(index, 1);
      
      return side === 'A'
        ? { ...prev, legA: legsArray }
        : { ...prev, legB: legsArray };
    });
  };
  
  // Calculate exposure whenever legs change
  useEffect(() => {
    calculateExposure();
  }, [tradeLegs]);
  
  // Calculate exposure based on current legs
  const calculateExposure = () => {
    // Create a map to hold exposure by month
    const exposureMap = new Map<string, Record<string, number>>();
    
    // Process all legs
    const allLegs = [...tradeLegs.legA, ...tradeLegs.legB];
    
    allLegs.forEach(leg => {
      const { buySell, product, quantity, tradingPeriod } = leg;
      
      if (!quantity || !tradingPeriod) return;
      
      const period = periods.find(p => p.periodCode === tradingPeriod);
      if (!period) return;
      
      // Use period code as the month key
      const month = period.periodCode;
      
      // Initialize month record if it doesn't exist
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
    
    // Convert map to array and sort
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
  
  // Submit the form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!comment.trim()) {
      toast.error('Comment is required');
      return;
    }
    
    // Collect all legs
    const allLegs = [...tradeLegs.legA, ...tradeLegs.legB];
    
    if (allLegs.length === 0) {
      toast.error('At least one trade leg is required');
      return;
    }
    
    // Validate each leg
    const invalidLegs = allLegs.filter(leg => 
      !leg.buySell || 
      !leg.product || 
      !leg.tradingPeriod || 
      !leg.quantity ||
      !leg.broker
    );
    
    if (invalidLegs.length > 0) {
      toast.error(`There are ${invalidLegs.length} incomplete legs. Please fill all required fields.`);
      return;
    }
    
    // All validation passed, submit the form
    const submitData = {
      tradeReference,
      tradeType: 'paper',
      comment,
      counterparty: 'Internal', // Default for paper trades
      legs: allLegs.map((leg, index) => ({
        legReference: leg.legReference || generateLegReference(tradeReference, index),
        buySell: leg.buySell,
        product: leg.product,
        instrument: leg.instrument || `Argus ${leg.product}`,
        tradingPeriod: leg.tradingPeriod,
        periodStart: leg.periodStart,
        periodEnd: leg.periodEnd,
        price: leg.price,
        quantity: leg.quantity,
        broker: leg.broker,
        formula: {}, // Empty formula object
        mtmFormula: {} // Empty MTM formula object
      }))
    };
    
    onSubmit(submitData);
  };

  // Reset form
  const resetForm = () => {
    setComment('');
    setTradeLegs({ legA: [], legB: [] });
    setExposure([]);
  };
  
  // Initialize with an empty leg if none exist and data is loaded
  useEffect(() => {
    if (!isLoading && 
        paperProducts.length > 0 && 
        brokers.length > 0 && 
        selectedBroker && 
        tradeLegs.legA.length === 0 && 
        tradeLegs.legB.length === 0) {
      addLegA();
    }
  }, [isLoading, paperProducts, brokers, selectedBroker, tradeLegs]);
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="comment">Comment</Label>
          <Input
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Enter trade comment"
            disabled={isLoading}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Label htmlFor="broker" className="min-w-24">Default Broker</Label>
          <div className="flex-1">
            <Select 
              value={selectedBroker} 
              onValueChange={setSelectedBroker}
              disabled={isLoading || brokers.length === 0}
            >
              <SelectTrigger id="broker">
                <SelectValue placeholder={isLoading ? "Loading brokers..." : "Select broker"} />
              </SelectTrigger>
              <SelectContent>
                {brokers.filter(b => b.is_active !== false).map((broker) => (
                  <SelectItem key={broker.id} value={broker.id}>{broker.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Dialog open={isBrokerDialogOpen} onOpenChange={setIsBrokerDialogOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="sm" disabled={isLoading}>
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
      
      {/* Trade Table Section */}
      <PaperTradeTable
        tradeLegs={tradeLegs}
        tradingPeriods={periods}
        paperProducts={paperProducts}
        onAddLegA={addLegA}
        onAddLegB={addLegB}
        onUpdateLeg={updateLeg}
        onRemoveLeg={removeLeg}
        isLoading={isLoading}
      />
      
      <Separator />
      
      {/* Exposure Table Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Exposure Table</h3>
        <ExposureTable 
          exposures={exposure} 
          highlightedProduct={highlightedProduct}
          onExposureClick={(month, product) => setHighlightedProduct(product)}
        />
      </div>
      
      <Separator />
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="button" variant="outline" onClick={resetForm} disabled={isLoading}>
          Reset
        </Button>
        <Button type="submit" disabled={isLoading}>
          Create Trade
        </Button>
      </div>
    </form>
  );
};

export default PaperTradeForm;
