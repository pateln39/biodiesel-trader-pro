
import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { generateLegReference } from '@/modules/trade/utils/tradeUtils';
import { PaperTradeTable } from '@/modules/trade/components';
import { createEmptyFormula } from '@/modules/pricing/utils/formulaUtils';
import { validatePaperTradeForm } from '@/modules/trade/utils/paperTradeValidationUtils';
import { supabase } from '@/integrations/supabase/client';
import { getNextMonths } from '@/core/utils/dateUtils';

interface PaperTradeFormProps {
  tradeReference: string;
  onSubmit: (trade: any) => void;
  onCancel: () => void;
  isEditMode?: boolean;
  initialData?: any;
}

interface BrokerOption {
  id: string;
  name: string;
}

const PaperTradeForm: React.FC<PaperTradeFormProps> = ({ 
  tradeReference, 
  onSubmit, 
  onCancel,
  isEditMode = false,
  initialData
}) => {
  const [comment, setComment] = useState(initialData?.comment || '');
  const [selectedBroker, setSelectedBroker] = useState('');
  const [brokers, setBrokers] = useState<BrokerOption[]>([]);
  const [isAddingBroker, setIsAddingBroker] = useState(false);
  const [newBrokerName, setNewBrokerName] = useState('');
  
  const [tradeLegs, setTradeLegs] = useState<any[]>([]);
  
  const availableMonths = useMemo(() => getNextMonths(8), []);
  
  const [exposureData, setExposureData] = useState<any[]>(() => {
    return availableMonths.map(month => ({
      month,
      UCOME: 0,
      FAME0: 0,
      RME: 0,
      HVO: 0,
      LSGO: 0,
      'ICE GASOIL FUTURES': 0
    }));
  });
  
  useEffect(() => {
    const fetchBrokers = async () => {
      try {
        const { data, error } = await supabase
          .from('brokers')
          .select('id, name')
          .eq('is_active', true)
          .order('name');
          
        if (error) {
          toast.error('Failed to load brokers', {
            description: error.message
          });
          return;
        }
        
        setBrokers(data || []);
        if (data && data.length > 0 && !selectedBroker) {
          setSelectedBroker(data[0].id);
        }
      } catch (err: any) {
        console.error('Error fetching brokers:', err);
        toast.error('An unexpected error occurred while loading brokers');
      }
    };
    
    fetchBrokers();
  }, []);
  
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
  
  const calculateExposures = (legs: any[]) => {
    const exposures = availableMonths.map(month => {
      const entry: any = { month };
      ['UCOME', 'FAME0', 'RME', 'HVO', 'LSGO', 'ICE GASOIL FUTURES'].forEach(product => {
        entry[product] = 0;
      });
      return entry;
    });
    
    legs.forEach(leg => {
      if (!leg.period || !leg.product) return;
      
      const monthIndex = exposures.findIndex(e => e.month === leg.period);
      if (monthIndex === -1) return;
      
      if (exposures[monthIndex][leg.product] !== undefined) {
        const quantity = leg.buySell === 'buy' ? leg.quantity : -leg.quantity;
        exposures[monthIndex][leg.product] += quantity || 0;
      }
      
      if (leg.rightSide && leg.rightSide.product) {
        const rightProduct = leg.rightSide.product;
        if (exposures[monthIndex][rightProduct] !== undefined) {
          exposures[monthIndex][rightProduct] += leg.rightSide.quantity || 0;
        }
      }
    });
    
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
      comment,
      broker: brokerName,
      legs: tradeLegs.map((leg, index) => {
        const legReference = initialData?.legs?.[index]?.legReference || 
                           generateLegReference(tradeReference, index);
                            
        return {
          ...leg,
          legReference,
          broker: brokerName,
          mtmFormula: leg.mtmFormula || createEmptyFormula(),
          formula: leg.formula || createEmptyFormula(),
        };
      })
    };
    
    onSubmit(tradeData);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="comment">Comment</Label>
          <Input
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Enter optional comment"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="broker">Broker</Label>
          <div className="flex space-x-2">
            <Select 
              value={selectedBroker} 
              onValueChange={setSelectedBroker}
              disabled={isAddingBroker}
            >
              <SelectTrigger id="broker" className="flex-grow">
                <SelectValue placeholder="Select broker" />
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
        <PaperTradeTable
          legs={tradeLegs}
          onLegsChange={handleLegsChange}
        />
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Exposure Table</h3>
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UCOME</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FAME0</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RME</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HVO</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LSGO</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ICE GASOIL FUTURES</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {exposureData.length > 0 ? (
                exposureData.map((row, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.month}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-bold">{row.UCOME || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-bold">{row.FAME0 || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-bold">{row.RME || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-bold">{row.HVO || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-bold">{row.LSGO || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-bold">{row['ICE GASOIL FUTURES'] || 0}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    No exposure data available. Add trade legs to see the exposure table.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
