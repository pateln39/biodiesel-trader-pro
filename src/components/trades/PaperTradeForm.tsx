import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { generateLegReference } from '@/utils/tradeUtils';
import PaperTradeTable from './PaperTradeTable';
import { createEmptyFormula } from '@/utils/formulaUtils';
import { validatePaperTradeForm } from '@/utils/paperTradeValidationUtils';
import { supabase } from '@/integrations/supabase/client';
import { getNextMonths } from '@/utils/dateUtils';
import { mapProductToCanonical } from '@/utils/productMapping';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '@/components/ui/table';
import { usePaperTradeFormKeyboardShortcuts } from '@/hooks/usePaperTradeFormKeyboardShortcuts';

interface PaperTradeFormProps {
  tradeReference: string;
  onSubmit: (trade: any) => void;
  onCancel: () => void;
  isEditMode?: boolean;
  initialData?: any;
  comments?: string;
}

interface BrokerOption {
  id: string;
  name: string;
}

const ALL_PRODUCTS = [
  'Argus UCOME', 
  'Argus FAME0', 
  'Argus RME', 
  'Platts LSGO', 
  'Argus HVO', 
  'ICE GASOIL FUTURES'
];

// Helper function to validate date format (dd-mm-yyyy)
const validateDateFormat = (dateStr: string): boolean => {
  if (!dateStr.trim()) return true; // Empty is valid
  
  const datePattern = /^(\d{2})-(\d{2})-(\d{4})$/;
  const match = dateStr.match(datePattern);
  
  if (!match) return false;
  
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);
  
  // Basic validation
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > 2100) return false;
  
  return true;
};

// Helper function to convert dd-mm-yyyy to ISO date format for database
const formatDateForDatabase = (dateStr: string): string | null => {
  if (!dateStr.trim()) return null;
  
  const datePattern = /^(\d{2})-(\d{2})-(\d{4})$/;
  const match = dateStr.match(datePattern);
  
  if (!match) return null;
  
  const day = match[1];
  const month = match[2];
  const year = match[3];
  
  return `${year}-${month}-${day}`;
};

// Helper function to convert ISO date to dd-mm-yyyy format for display
const formatDateForDisplay = (isoDate: string | Date | null): string => {
  if (!isoDate) return '';
  
  let date: Date;
  if (typeof isoDate === 'string') {
    date = new Date(isoDate);
  } else {
    date = isoDate;
  }
  
  if (isNaN(date.getTime())) return '';
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}-${month}-${year}`;
};

const PaperTradeForm: React.FC<PaperTradeFormProps> = ({ 
  tradeReference, 
  onSubmit, 
  onCancel,
  isEditMode = false,
  initialData,
  comments
}) => {
  const [selectedBroker, setSelectedBroker] = useState('');
  const [brokers, setBrokers] = useState<BrokerOption[]>([]);
  const [isAddingBroker, setIsAddingBroker] = useState(false);
  const [newBrokerName, setNewBrokerName] = useState('');
  const [brokersLoaded, setBrokersLoaded] = useState(false);
  const brokerSelectRef = useRef<HTMLButtonElement>(null);
  
  const [tradeLegs, setTradeLegs] = useState<any[]>(() => {
    if (initialData && initialData.legs && initialData.legs.length > 0) {
      return initialData.legs.map((leg: any) => ({
        ...leg,
        buySell: leg.buySell,
        product: leg.product,
        quantity: leg.quantity,
        period: leg.period,
        price: leg.price,
        broker: leg.broker,
        instrument: leg.instrument,
        relationshipType: leg.relationshipType,
        rightSide: leg.rightSide,
        formula: leg.formula,
        mtmFormula: leg.mtmFormula,
        exposures: leg.exposures,
        // Convert execution date from database format to display format
        executionTradeDate: leg.executionTradeDate ? formatDateForDisplay(leg.executionTradeDate) : ''
      }));
    }
    return [];
  });
  
  const availableMonths = useMemo(() => getNextMonths(13), []);
  
  const [exposureData, setExposureData] = useState<any[]>(() => {
    return availableMonths.map(month => {
      const entry: any = { month };
      ALL_PRODUCTS.forEach(product => {
        entry[product] = 0;
      });
      return entry;
    });
  });
  
  // Focus broker dropdown when form opens (not in edit mode)
  useEffect(() => {
    if (!isEditMode && brokerSelectRef.current) {
      // Small delay to ensure the component is fully rendered
      setTimeout(() => {
        brokerSelectRef.current?.focus();
      }, 100);
    }
  }, [isEditMode]);
  
  // Initialize broker selection from initialData immediately
  useEffect(() => {
    if (initialData?.broker && !selectedBroker) {
      console.log('[PAPER_FORM] Initial broker from data:', initialData.broker);
      
      // For edit mode, we want to preserve the broker name even if we don't have the ID yet
      // We'll match it when brokers are loaded
    }
  }, [initialData, selectedBroker]);
  
  useEffect(() => {
    const fetchBrokers = async () => {
      console.log('[PAPER_FORM] Fetching brokers...');
      
      const { data, error } = await supabase
        .from('brokers')
        .select('*')
        .eq('is_active', true)
        .order('name');
        
      if (error) {
        console.error('[PAPER_FORM] Error fetching brokers:', error);
        toast.error('Failed to load brokers', {
          description: error.message
        });
        return;
      }
      
      console.log('[PAPER_FORM] Brokers loaded:', data?.length || 0);
      setBrokers(data || []);
      setBrokersLoaded(true);
      
      // Handle broker selection after brokers are loaded
      if (data && data.length > 0) {
        if (initialData?.broker) {
          // Find the broker by name (case-insensitive, trimmed)
          const initialBrokerName = initialData.broker.trim().toLowerCase();
          const brokerOption = data.find(b => b.name.trim().toLowerCase() === initialBrokerName);
          
          if (brokerOption) {
            console.log('[PAPER_FORM] Found matching broker:', brokerOption.name, 'ID:', brokerOption.id);
            setSelectedBroker(brokerOption.id);
          } else {
            console.warn('[PAPER_FORM] Broker not found in active list:', initialData.broker);
            console.log('[PAPER_FORM] Available brokers:', data.map(b => b.name));
            
            // In edit mode, if the broker isn't found, don't auto-select first one
            // This preserves the original broker name in the form
            if (!isEditMode && data.length > 0) {
              console.log('[PAPER_FORM] Fallback to first broker for new trade');
              setSelectedBroker(data[0].id);
            }
          }
        } else if (!selectedBroker && !isEditMode) {
          // Only auto-select first broker for new trades
          console.log('[PAPER_FORM] Auto-selecting first broker for new trade');
          setSelectedBroker(data[0].id);
        }
      }
    };
    
    fetchBrokers();
  }, [initialData, selectedBroker, isEditMode]);
  
  useEffect(() => {
    calculateExposures(tradeLegs);
  }, [tradeLegs]);
  
  const handleAddRow = () => {
    const newLeg = {
      id: crypto.randomUUID(),
      product: '',
      buySell: 'buy' as any,
      quantity: 0,
      period: '',
      price: 0,
      relationshipType: 'FP' as any,
      rightSide: null,
      formula: createEmptyFormula(),
      mtmFormula: createEmptyFormula(),
      executionTradeDate: '',
      exposures: {
        physical: {},
        paper: {},
        pricing: {}
      }
    };
    const newLegs = [...tradeLegs, newLeg];
    setTradeLegs(newLegs);
    
    // Focus the product dropdown in the new row after a brief delay
    setTimeout(() => {
      const rowIndex = newLegs.length - 1;
      const productSelect = document.querySelector(`[data-row-index="${rowIndex}"] [data-testid="product-select"]`) as HTMLButtonElement;
      if (productSelect) {
        productSelect.focus();
      }
    }, 100);
  };

  const handleCopyPreviousRow = () => {
    if (tradeLegs.length > 0) {
      const previousLeg = tradeLegs[tradeLegs.length - 1];
      const newLeg = {
        ...JSON.parse(JSON.stringify(previousLeg)),
        id: crypto.randomUUID(),
        period: '',
        executionTradeDate: ''
      };
      if (newLeg.rightSide) {
        newLeg.rightSide.period = '';
      }
      const newLegs = [...tradeLegs, newLeg];
      setTradeLegs(newLegs);
      
      // Focus the product dropdown in the new row after a brief delay
      setTimeout(() => {
        const rowIndex = newLegs.length - 1;
        const productSelect = document.querySelector(`[data-row-index="${rowIndex}"] [data-testid="product-select"]`) as HTMLButtonElement;
        if (productSelect) {
          productSelect.focus();
        }
      }, 100);
    }
  };
  
  // Add keyboard shortcuts for paper trade form
  usePaperTradeFormKeyboardShortcuts({
    onAddBroker: () => setIsAddingBroker(!isAddingBroker),
    onAddRow: handleAddRow,
    onCopyPreviousRow: handleCopyPreviousRow,
    onSubmit: () => {
      const event = new Event('submit', { bubbles: true, cancelable: true });
      document.querySelector('form')?.dispatchEvent(event);
    },
    onCancel,
    hasLegs: tradeLegs.length > 0,
  });
  
  const handleAddBroker = async () => {
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
        throw new Error(`Error adding broker: ${error.message}`);
      }
      
      setBrokers([...brokers, data]);
      setSelectedBroker(data.id);
      setNewBrokerName('');
      setIsAddingBroker(false);
      
      toast.success('Broker added successfully');
    } catch (error: any) {
      toast.error('Failed to add broker', {
        description: error.message
      });
    }
  };
  
  const handleLegsChange = (newLegs: any[]) => {
    setTradeLegs(newLegs);
    calculateExposures(newLegs);
  };
  
  // ... keep existing code (calculateExposures function)
  const calculateExposures = (legs: any[]) => {
    const exposures = availableMonths.map(month => {
      const entry: any = { month };
      ALL_PRODUCTS.forEach(product => {
        entry[product] = 0;
      });
      return entry;
    });
    
    if (legs.length > 0) {
      legs.forEach(leg => {
        // Only include legs with periods that are in the current exposure range
        if (!leg.period || !leg.product || !availableMonths.includes(leg.period)) {
          return;
        }
        
        const monthIndex = exposures.findIndex(e => e.month === leg.period);
        if (monthIndex === -1) return;
        
        const canonicalProduct = mapProductToCanonical(leg.product);
        
        if (canonicalProduct && ALL_PRODUCTS.includes(canonicalProduct)) {
          const quantity = leg.buySell === 'buy' ? leg.quantity : -leg.quantity;
          exposures[monthIndex][canonicalProduct] += quantity || 0;
        }
        
        if (leg.rightSide && leg.rightSide.product) {
          const rightCanonicalProduct = mapProductToCanonical(leg.rightSide.product);
          if (rightCanonicalProduct && ALL_PRODUCTS.includes(rightCanonicalProduct)) {
            const rightQuantity = leg.rightSide.quantity || 0;
            exposures[monthIndex][rightCanonicalProduct] += rightQuantity;
          }
        }
      });
    }
    
    setExposureData(exposures);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const broker = brokers.find(b => b.id === selectedBroker);
    const brokerName = broker?.name || '';
    
    if (!validatePaperTradeForm(brokerName, tradeLegs)) {
      return;
    }
    
    const tradeData = {
      tradeReference,
      tradeType: 'paper',
      broker: brokerName,
      legs: tradeLegs.map((leg, index) => {
        const legReference = initialData?.legs?.[index]?.legReference || 
                            generateLegReference(tradeReference, index);
        
        // Convert execution date from display format to database format                    
        const formattedExecutionDate = leg.executionTradeDate ? 
          formatDateForDatabase(leg.executionTradeDate) : null;
                            
        return {
          ...leg,
          legReference,
          broker: brokerName,
          mtmFormula: leg.mtmFormula || createEmptyFormula(),
          formula: leg.formula || createEmptyFormula(),
          executionTradeDate: formattedExecutionDate
        };
      })
    };
    
    onSubmit(tradeData);
  };
  
  // Get display broker name - show the name from initialData if broker not found in active list
  const getDisplayBrokerName = () => {
    if (selectedBroker) {
      const broker = brokers.find(b => b.id === selectedBroker);
      return broker?.name || '';
    }
    
    // If in edit mode and no broker selected but we have initialData broker, show that
    if (isEditMode && initialData?.broker && brokersLoaded) {
      return initialData.broker;
    }
    
    return '';
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="broker">Broker</Label>
          <div className="flex space-x-2">
            <Select 
              value={selectedBroker} 
              onValueChange={setSelectedBroker}
              disabled={isAddingBroker}
            >
              <SelectTrigger ref={brokerSelectRef} id="broker" className="flex-grow">
                <SelectValue placeholder="Select broker">
                  {getDisplayBrokerName() || "Select broker"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {brokers.map((broker) => (
                  <SelectItem key={broker.id} value={broker.id}>
                    {broker.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsAddingBroker(!isAddingBroker)}
            >
              {isAddingBroker ? 'Cancel' : '+ Add Broker'}
            </Button>
          </div>
          {isEditMode && initialData?.broker && !selectedBroker && brokersLoaded && (
            <p className="text-sm text-orange-600">
              Original broker "{initialData.broker}" not found in active brokers list
            </p>
          )}
        </div>
        
        {isAddingBroker && (
          <div className="space-y-2">
            <Label htmlFor="new-broker">New Broker</Label>
            <div className="flex space-x-2">
              <Input
                id="new-broker"
                value={newBrokerName}
                onChange={(e) => setNewBrokerName(e.target.value)}
                placeholder="Enter broker name"
                className="flex-grow"
              />
              <Button 
                type="button"
                onClick={handleAddBroker}
              >
                Add
              </Button>
            </div>
          </div>
        )}
      </div>

      <Separator />
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Trade Table</h3>
        <div className="border rounded-md p-4 bg-gradient-to-br from-brand-navy/75 via-brand-navy/60 to-brand-lime/25 border-r-[3px] border-brand-lime/30">
          <PaperTradeTable
            legs={tradeLegs}
            onLegsChange={handleLegsChange}
          />
        </div>
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Exposure Table</h3>
          <p className="text-sm text-muted-foreground">
            Only showing exposures for periods within the next 13 months
          </p>
        </div>
        <div className="border rounded-md p-4 bg-gradient-to-br from-brand-navy/75 via-brand-navy/60 to-brand-lime/25 border-r-[3px] border-brand-lime/30 overflow-x-auto">
          <Table className="min-w-full divide-y divide-gray-200">
            <TableHeader className="bg-transparent">
              <TableRow>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Month</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">UCOME</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">FAME0</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">RME</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">LSGO</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">HVO</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">GASOIL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-transparent divide-y divide-gray-200">
              {exposureData.map((row, index) => (
                <TableRow key={index}>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{row.month}</TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-white font-bold">{row['Argus UCOME'] || 0}</TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-white font-bold">{row['Argus FAME0'] || 0}</TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-white font-bold">{row['Argus RME'] || 0}</TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-white font-bold">{row['Platts LSGO'] || 0}</TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-white font-bold">{row['Argus HVO'] || 0}</TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-white font-bold">{row['ICE GASOIL FUTURES'] || 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
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
