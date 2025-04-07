
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import PaperTradeTable from './paper/PaperTradeTable';
import PaperExposureTable from './paper/PaperExposureTable';
import { generateLegReference } from '@/utils/tradeUtils';

export interface PaperTradeFormProps {
  tradeReference: string;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isEditMode?: boolean;
  initialData?: any;
  readOnly?: boolean;
}

interface Broker {
  id: string;
  name: string;
}

const PaperTradeForm: React.FC<PaperTradeFormProps> = ({ 
  tradeReference, 
  onSubmit, 
  onCancel, 
  isEditMode = false,
  initialData = null,
  readOnly = false
}) => {
  // Base form state
  const [formData, setFormData] = useState({
    tradeReference,
    comment: '',
    broker: '',
    legs: []
  });

  // Fetch brokers
  const { data: brokers = [], isLoading: loadingBrokers } = useQuery({
    queryKey: ['brokers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brokers')
        .select('*')
        .eq('is_active', true)
        .order('name');
        
      if (error) throw error;
      return data as Broker[];
    }
  });

  // Initialize form with data if in edit mode
  useEffect(() => {
    if (isEditMode && initialData) {
      setFormData({
        tradeReference: initialData.tradeReference || tradeReference,
        comment: initialData.comment || '',
        broker: initialData.broker || '',
        legs: initialData.legs || []
      });
    } else if (!isEditMode) {
      // For new trades, always start with an empty leg
      setFormData(prev => ({
        ...prev,
        legs: prev.legs.length === 0 ? [createEmptyLeg()] : prev.legs
      }));
    }
  }, [isEditMode, initialData, tradeReference]);

  // Create an empty trade leg
  const createEmptyLeg = () => {
    return {
      id: null,
      legReference: generateLegReference(),
      leftSide: {
        product: '',
        quantity: '',
        period: '',
        price: ''
      },
      rightSide: {
        product: '',
        quantity: '',
        period: '',
        price: ''
      },
      mtm: {
        formula: '',
        period: ''
      },
      relationshipType: '',
      exposures: {
        physical: {},
        pricing: {}
      }
    };
  };

  // Handle legs changes
  const handleLegsChange = (newLegs: any[]) => {
    setFormData(prev => ({
      ...prev,
      legs: newLegs
    }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (readOnly) {
      toast.error("Cannot submit in read-only mode");
      return;
    }

    // Validation
    if (!formData.comment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    if (!formData.broker) {
      toast.error("Please select a broker");
      return;
    }

    if (formData.legs.length === 0) {
      toast.error("Please add at least one trade");
      return;
    }

    // Check each leg for required fields
    const invalidLegs = formData.legs.filter(leg => {
      const leftSide = leg.leftSide;
      if (!leftSide.product || !leftSide.quantity || !leftSide.period) {
        return true;
      }
      
      // If right side product exists, it must have quantity and period too
      if (leg.rightSide && leg.rightSide.product) {
        return !leg.rightSide.quantity || !leg.rightSide.period;
      }
      
      return false;
    });

    if (invalidLegs.length > 0) {
      toast.error("Please complete all trade details", {
        description: "Some trades have missing required fields"
      });
      return;
    }

    // Transform data for submission
    const submitData = {
      tradeReference: formData.tradeReference,
      tradeType: 'paper',
      comment: formData.comment,
      broker: formData.broker,
      legs: formData.legs.map(leg => ({
        legReference: leg.legReference,
        buySell: leg.leftSide.quantity.startsWith('-') ? 'sell' : 'buy',
        product: leg.leftSide.product,
        quantity: Math.abs(parseFloat(leg.leftSide.quantity)),
        period: leg.leftSide.period,
        price: parseFloat(leg.leftSide.price) || null,
        rightSide: leg.rightSide && leg.rightSide.product ? {
          product: leg.rightSide.product,
          price: parseFloat(leg.rightSide.price) || null
        } : null,
        mtmFormula: leg.mtm.formula,
        mtmPeriod: leg.mtm.period,
        relationshipType: leg.relationshipType,
        exposures: leg.exposures
      }))
    };

    onSubmit(submitData);
  };

  // Calculate exposures from legs
  const calculateExposures = (legs: any[]) => {
    // This would calculate the exposure table data
    // For now, just return mock data
    return [];
  };

  // Add a new broker
  const handleAddBroker = async () => {
    const brokerName = prompt("Enter new broker name:");
    if (!brokerName) return;
    
    try {
      const { data, error } = await supabase
        .from('brokers')
        .insert({ name: brokerName })
        .select()
        .single();
        
      if (error) throw error;
      
      toast.success("Broker added", {
        description: `${brokerName} has been added to the broker list`
      });
      
      setFormData(prev => ({
        ...prev,
        broker: data.id
      }));
    } catch (error) {
      console.error("Error adding broker:", error);
      toast.error("Failed to add broker");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="tradeReference">Trade Reference:</Label>
          <Input
            id="tradeReference"
            value={formData.tradeReference}
            readOnly
            className="bg-muted"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="comment">Comment:</Label>
          <Input
            id="comment"
            value={formData.comment}
            onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
            placeholder="Enter trade comment"
            disabled={readOnly}
          />
        </div>
        
        <div>
          <Label htmlFor="broker">Broker:</Label>
          <div className="flex gap-2">
            <Select 
              value={formData.broker} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, broker: value }))}
              disabled={readOnly}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select broker" />
              </SelectTrigger>
              <SelectContent>
                {brokers.map(broker => (
                  <SelectItem key={broker.id} value={broker.id}>
                    {broker.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {!readOnly && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleAddBroker}
              >
                + Add Broker
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Label>Trade Details:</Label>
        
        <Card>
          <CardContent className="pt-6">
            <PaperTradeTable 
              legs={formData.legs} 
              onLegsChange={handleLegsChange}
              readOnly={readOnly}
            />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Label>Exposure Summary:</Label>
        
        <Card>
          <CardContent className="pt-6">
            <PaperExposureTable 
              data={calculateExposures(formData.legs)} 
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        
        {!readOnly && (
          <Button type="submit">
            {isEditMode ? 'Update Trade' : 'Create Trade'}
          </Button>
        )}
      </div>
    </form>
  );
};

export default PaperTradeForm;
