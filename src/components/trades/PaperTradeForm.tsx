
import React, { useState, useEffect } from 'react';
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
  
  // Trade legs state
  const [tradeLegs, setTradeLegs] = useState<any[]>([]);
  const [exposureData, setExposureData] = useState<any[]>([]);
  
  useEffect(() => {
    // Load brokers from database
    const fetchBrokers = async () => {
      const { data, error } = await supabase
        .from('brokers')
        .select('*')
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
    };
    
    fetchBrokers();
  }, []);
  
  // Function to add a new broker
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
  
  // Function to handle legs changes
  const handleLegsChange = (newLegs: any[]) => {
    setTradeLegs(newLegs);
    
    // In a real implementation, you would calculate exposures here
    // For now, we'll just use placeholder data
    calculateExposures(newLegs);
  };
  
  // Placeholder function to calculate exposures
  const calculateExposures = (legs: any[]) => {
    // This would be replaced with actual exposure calculation logic
    const months = ["Jan-24", "Feb-24", "Mar-24", "Apr-24", "May-24", "Jun-24"];
    const products = ["UCOME", "FAME0", "RME", "HVO", "LSGO", "ICE GASOIL FUTURES"];
    
    // Create empty exposure data structure
    const exposures = months.map(month => {
      const entry: any = { month };
      products.forEach(product => {
        entry[product] = 0;
      });
      return entry;
    });
    
    // Update exposures based on legs (placeholder logic)
    legs.forEach(leg => {
      if (leg.period && leg.product && leg.quantity) {
        const monthIndex = months.indexOf(leg.period);
        if (monthIndex >= 0 && products.includes(leg.product)) {
          exposures[monthIndex][leg.product] += leg.quantity;
        }
      }
    });
    
    setExposureData(exposures);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Find selected broker name
    const broker = brokers.find(b => b.id === selectedBroker);
    const brokerName = broker?.name || '';
    
    // Validate form using the new paper trade specific validation
    if (!validatePaperTradeForm(brokerName, tradeLegs)) {
      return;
    }
    
    // Prepare trade data for submission
    const tradeData = {
      tradeReference,
      tradeType: 'paper',
      comment,
      broker: brokerName,
      legs: tradeLegs.map((leg, index) => {
        // Create full leg with references
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.UCOME || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.FAME0 || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.RME || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.HVO || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.LSGO || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row['ICE GASOIL FUTURES'] || 0}</td>
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
