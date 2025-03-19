
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { PlusCircle } from 'lucide-react';
import { useReferenceData } from '@/hooks/useReferenceData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generateLegReference } from '@/utils/tradeUtils';
import { BuySell, Product } from '@/types/trade';
import { Broker } from '@/types/brokers';
import { useProductRelationships } from '@/hooks/useProductRelationships';
import PaperTradeTable, { TradeLeg, MTMFormula } from './PaperTradeTable';
import ExposureTable, { ExposureRow } from './ExposureTable';

interface PaperTradeFormProps {
  tradeReference: string;
  onSubmit: (trade: any) => void;
  onCancel: () => void;
  isEditMode?: boolean;
  initialData?: any;
}

const createId = () => crypto.randomUUID();

const PaperTradeForm: React.FC<PaperTradeFormProps> = ({
  tradeReference,
  onSubmit,
  onCancel,
  isEditMode = false,
  initialData
}) => {
  const { counterparties } = useReferenceData();
  const { getAutoPopulatedLeg } = useProductRelationships();
  
  // Form state
  const [counterparty, setCounterparty] = useState<string>(initialData?.counterparty || '');
  const [comment, setComment] = useState<string>(initialData?.comment || '');
  
  // Broker state
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [selectedBroker, setSelectedBroker] = useState<string>('');
  const [newBrokerName, setNewBrokerName] = useState<string>('');
  const [isBrokerDialogOpen, setIsBrokerDialogOpen] = useState<boolean>(false);

  // Trade legs and MTM formulas
  const [tradeLegs, setTradeLegs] = useState<TradeLeg[]>([]);
  const [mtmFormulas, setMtmFormulas] = useState<MTMFormula[]>([]);
  
  // Exposure calculation
  const [exposures, setExposures] = useState<ExposureRow[]>([]);
  const [highlightedProduct, setHighlightedProduct] = useState<string | undefined>(undefined);

  // Fetch brokers on component mount
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
        
        if (data && data.length > 0 && !selectedBroker) {
          setSelectedBroker(data[0].id);
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

  // Initialize data if in edit mode
  useEffect(() => {
    if (isEditMode && initialData?.legs?.length > 0) {
      // Map initial data to our component state
      const mappedLegs: TradeLeg[] = initialData.legs.map((leg: any, index: number) => ({
        id: leg.id || createId(),
        side: index % 2 === 0 ? 'A' : 'B', // Just a simple mapping for edit mode
        buySell: leg.buySell,
        product: leg.product,
        pricingPeriodStart: leg.pricingPeriodStart || new Date(),
        pricingPeriodEnd: leg.pricingPeriodEnd || new Date(),
        price: leg.price || 0,
        quantity: leg.quantity || 0
      }));
      
      setTradeLegs(mappedLegs);
      
      // For simplicity, we'll just create one MTM formula if there is mtmFormula data
      if (initialData.mtmFormula) {
        setMtmFormulas([{
          id: createId(),
          formula: "Sample MTM Formula", // This would need proper mapping from your data
          pricingPeriodStart: new Date(),
          pricingPeriodEnd: new Date()
        }]);
      }
    }
  }, [isEditMode, initialData]);

  // Calculate exposure whenever trade legs change
  useEffect(() => {
    calculateExposure();
  }, [tradeLegs]);

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

  // Trade leg functions
  const addLegA = () => {
    const newLeg: TradeLeg = {
      id: createId(),
      side: 'A',
      buySell: 'buy',
      product: 'UCOME',
      pricingPeriodStart: new Date(),
      pricingPeriodEnd: new Date(),
      price: 0,
      quantity: 0
    };
    
    setTradeLegs(prev => [...prev, newLeg]);
  };
  
  const addLegB = () => {
    const newLeg: TradeLeg = {
      id: createId(),
      side: 'B',
      buySell: 'sell',
      product: 'FAME0',
      pricingPeriodStart: new Date(),
      pricingPeriodEnd: new Date(),
      price: 0,
      quantity: 0
    };
    
    setTradeLegs(prev => [...prev, newLeg]);
  };
  
  const removeLeg = (id: string) => {
    setTradeLegs(prev => prev.filter(leg => leg.id !== id));
  };
  
  const updateLeg = (id: string, field: keyof TradeLeg, value: any) => {
    setTradeLegs(prev => {
      const updatedLegs = prev.map(leg => {
        if (leg.id === id) {
          const updatedLeg = { ...leg, [field]: value };
          
          // If we're updating a key field that affects auto-population,
          // check if we need to auto-populate the other side
          if (['product', 'buySell', 'quantity'].includes(field) && updatedLeg.quantity) {
            // Get the auto-populated data for the opposite leg
            const { product, buySell, quantity } = getAutoPopulatedLeg(
              updatedLeg.product,
              updatedLeg.buySell,
              updatedLeg.quantity
            );
            
            // Find if there's a corresponding leg on the other side that should be auto-populated
            const oppositeSide = updatedLeg.side === 'A' ? 'B' : 'A';
            const oppositeLegs = prev.filter(l => l.side === oppositeSide);
            
            if (oppositeLegs.length === 0) {
              // If no opposite leg exists, create one
              const newOppositeLeg: TradeLeg = {
                id: createId(),
                side: oppositeSide,
                buySell: buySell,
                product: product as Product,
                pricingPeriodStart: updatedLeg.pricingPeriodStart,
                pricingPeriodEnd: updatedLeg.pricingPeriodEnd,
                price: 0,
                quantity: Math.abs(quantity)
              };
              
              // Add this new leg to the legs array
              setTimeout(() => {
                setTradeLegs(current => [...current, newOppositeLeg]);
              }, 0);
            }
          }
          
          return updatedLeg;
        }
        return leg;
      });
      
      return updatedLegs;
    });
  };
  
  // MTM formula functions
  const addMTMFormula = () => {
    const newFormula: MTMFormula = {
      id: createId(),
      formula: '',
      pricingPeriodStart: new Date(),
      pricingPeriodEnd: new Date()
    };
    
    setMtmFormulas(prev => [...prev, newFormula]);
  };
  
  const removeMTMFormula = (id: string) => {
    setMtmFormulas(prev => prev.filter(formula => formula.id !== id));
  };
  
  const updateMTMFormula = (id: string, field: keyof MTMFormula, value: any) => {
    setMtmFormulas(prev => 
      prev.map(formula => 
        formula.id === id ? { ...formula, [field]: value } : formula
      )
    );
  };

  // Calculate exposure based on trade legs
  const calculateExposure = () => {
    const exposureMap = new Map<string, Record<string, number>>();
    
    // Process each trade leg to calculate exposure
    tradeLegs.forEach(leg => {
      const { side, buySell, product, quantity, pricingPeriodStart } = leg;
      
      if (!quantity) return;
      
      const month = pricingPeriodStart.toISOString().substr(0, 7); // YYYY-MM format
      
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
      
      // Special case for product relationships (example)
      if (product === 'RME') {
        // For RME, add opposite position to FAME0 for spread
        monthExposure['FAME0'] -= sign * quantity;
      } else if (product === 'UCOME') {
        // For UCOME diff, handle LSGO exposure
        monthExposure['LSGO'] -= sign * quantity;
      }
      
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
    
    setExposures(exposureRows);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!counterparty) {
      toast.error('Please select a counterparty');
      return;
    }
    
    if (!comment) {
      toast.error('Please enter a comment');
      return;
    }
    
    if (tradeLegs.length === 0) {
      toast.error('Please add at least one trade leg');
      return;
    }
    
    // Get the broker name from the selected broker ID
    const broker = brokers.find(b => b.id === selectedBroker)?.name || '';
    
    // Convert our component state to the expected API format
    const formattedTradeLegs = tradeLegs.map((leg, index) => ({
      id: leg.id,
      legReference: generateLegReference(tradeReference, index),
      parentTradeId: initialData?.id || '',
      buySell: leg.buySell,
      product: leg.product,
      instrument: leg.product, // Using product as instrument for now
      pricingPeriodStart: leg.pricingPeriodStart,
      pricingPeriodEnd: leg.pricingPeriodEnd,
      price: leg.price,
      quantity: leg.quantity,
      broker: broker,
      // Simplified formula for now
      formula: {
        tokens: [],
        exposures: {
          physical: {},
          pricing: {}
        }
      },
      mtmFormula: {
        tokens: [],
        exposures: {
          physical: {},
          pricing: {}
        }
      }
    }));
    
    // Submit the data
    onSubmit({
      tradeReference,
      tradeType: 'paper',
      counterparty,
      comment,
      broker: broker,
      legs: formattedTradeLegs
    });
  };

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
      
      <PaperTradeTable
        tradeLegs={tradeLegs}
        mtmFormulas={mtmFormulas}
        onAddLegA={addLegA}
        onAddLegB={addLegB}
        onAddMTMFormula={addMTMFormula}
        onRemoveLeg={removeLeg}
        onRemoveMTMFormula={removeMTMFormula}
        onUpdateLeg={updateLeg}
        onUpdateMTMFormula={updateMTMFormula}
      />
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Exposure Table</h3>
        <ExposureTable 
          exposures={exposures} 
          highlightedProduct={highlightedProduct} 
        />
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
