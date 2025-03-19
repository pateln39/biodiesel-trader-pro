
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PaperTradeHeader } from './paper/PaperTradeHeader';
import { PaperExposureTable } from './paper/PaperExposureTable';
import { useProductRelationships } from '@/hooks/useProductRelationships';
import { useBrokers } from '@/hooks/useBrokers';
import { BuySell, Product } from '@/types';
import { PaperParentTrade, PaperTradeLeg, PaperTradeRow } from '@/types/paper';
import { generateLegReference } from '@/utils/tradeUtils';
import { createEmptyFormula } from '@/utils/formulaUtils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import PaperTradeLegForm from './paper/PaperTradeLegForm';

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
  // State for comment and broker
  const [comment, setComment] = useState<string>(initialData?.comment || '');
  const [selectedBroker, setSelectedBroker] = useState<string>(initialData?.broker || '');
  
  // State for trade legs - either from initialData or with a default leg
  const [legs, setLegs] = useState<PaperTradeLeg[]>(
    initialData?.legs || [
      {
        id: crypto.randomUUID(),
        legReference: generateLegReference(tradeReference, 0),
        parentTradeId: initialData?.id || '',
        buySell: 'buy',
        product: 'UCOME',
        instrument: 'Argus UCOME',
        pricingPeriodStart: new Date(),
        pricingPeriodEnd: new Date(),
        price: 0,
        quantity: 0,
        broker: selectedBroker,
        formula: createEmptyFormula(),
        mtmFormula: createEmptyFormula()
      }
    ]
  );
  
  // Load product relationships and brokers
  const { productRelationships } = useProductRelationships();
  const { brokers } = useBrokers();
  
  // State for exposure data (will be calculated from legs)
  const [exposures, setExposures] = useState<Record<string, Record<string, number>>>({});
  
  // Update exposures whenever legs change
  useEffect(() => {
    calculateExposures();
  }, [legs]);
  
  // When broker is selected, update all legs to use that broker
  useEffect(() => {
    if (selectedBroker) {
      setLegs(prevLegs => 
        prevLegs.map(leg => ({
          ...leg,
          broker: selectedBroker
        }))
      );
    }
  }, [selectedBroker]);
  
  // Calculate exposures from legs
  const calculateExposures = () => {
    // Dummy data for now - this would be calculated based on legs
    const dummyExposures: Record<string, Record<string, number>> = {
      "Jan": { "UCOME": 100, "FAME0": -50, "RME": 0, "HVO": 0, "LSGO": 0, "ICE GASOIL FUTURES": 0 },
      "Feb": { "UCOME": 200, "FAME0": -150, "RME": 0, "HVO": 0, "LSGO": 0, "ICE GASOIL FUTURES": 0 },
      "Mar": { "UCOME": 0, "FAME0": 0, "RME": 0, "HVO": 0, "LSGO": 0, "ICE GASOIL FUTURES": 0 },
      "Apr": { "UCOME": 0, "FAME0": 0, "RME": 0, "HVO": 0, "LSGO": 0, "ICE GASOIL FUTURES": 0 },
      "May": { "UCOME": 0, "FAME0": 0, "RME": 0, "HVO": 0, "LSGO": 0, "ICE GASOIL FUTURES": 0 },
      "Jun": { "UCOME": 0, "FAME0": 0, "RME": 0, "HVO": 0, "LSGO": 0, "ICE GASOIL FUTURES": 0 },
      "Jul": { "UCOME": 0, "FAME0": 0, "RME": 0, "HVO": 0, "LSGO": 0, "ICE GASOIL FUTURES": 0 },
      "Aug": { "UCOME": 0, "FAME0": 0, "RME": 0, "HVO": 0, "LSGO": 0, "ICE GASOIL FUTURES": 0 },
      "Sep": { "UCOME": 0, "FAME0": 0, "RME": 0, "HVO": 0, "LSGO": 0, "ICE GASOIL FUTURES": 0 },
      "Oct": { "UCOME": 0, "FAME0": 0, "RME": 0, "HVO": 0, "LSGO": 0, "ICE GASOIL FUTURES": 0 },
      "Nov": { "UCOME": 0, "FAME0": 0, "RME": 0, "HVO": 0, "LSGO": 0, "ICE GASOIL FUTURES": 0 },
      "Dec": { "UCOME": 0, "FAME0": 0, "RME": 0, "HVO": 0, "LSGO": 0, "ICE GASOIL FUTURES": 0 }
    };
    setExposures(dummyExposures);
  };
  
  // Add a new leg
  const addLeg = () => {
    const newLeg: PaperTradeLeg = {
      id: crypto.randomUUID(),
      legReference: generateLegReference(tradeReference, legs.length),
      parentTradeId: initialData?.id || '',
      buySell: 'buy',
      product: 'UCOME',
      instrument: 'Argus UCOME',
      pricingPeriodStart: new Date(),
      pricingPeriodEnd: new Date(),
      price: 0,
      quantity: 0,
      broker: selectedBroker,
      formula: createEmptyFormula(),
      mtmFormula: createEmptyFormula()
    };
    
    setLegs([...legs, newLeg]);
  };
  
  // Remove a leg by id
  const removeLeg = (id: string) => {
    if (legs.length <= 1) {
      toast.error("Cannot remove the last leg");
      return;
    }
    
    setLegs(prevLegs => prevLegs.filter(leg => leg.id !== id));
  };
  
  // Update a leg
  const updateLeg = (updatedLeg: PaperTradeLeg) => {
    setLegs(prevLegs => 
      prevLegs.map(leg => 
        leg.id === updatedLeg.id ? updatedLeg : leg
      )
    );
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBroker) {
      toast.error("Please select a broker");
      return;
    }
    
    if (legs.some(leg => !leg.quantity || leg.quantity <= 0)) {
      toast.error("All legs must have a valid quantity");
      return;
    }
    
    // Create the parent trade object
    const parentTrade: PaperParentTrade = {
      id: initialData?.id || crypto.randomUUID(),
      tradeReference,
      tradeType: 'paper',
      counterparty: 'Broker', // Paper trades are with broker
      createdAt: initialData?.createdAt || new Date(),
      updatedAt: new Date(),
      comment
    };
    
    // Prepare the final object for submission
    const tradeData = {
      ...parentTrade,
      broker: selectedBroker,
      // Include first leg data for backwards compatibility
      ...legs[0],
      legs
    };
    
    onSubmit(tradeData);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Trade Header - Comment and Broker */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Trade Information</CardTitle>
        </CardHeader>
        <CardContent>
          <PaperTradeHeader
            comment={comment}
            setComment={setComment}
            selectedBroker={selectedBroker}
            setSelectedBroker={setSelectedBroker}
            brokers={brokers}
          />
        </CardContent>
      </Card>
      
      {/* Trade Legs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Trade Legs</CardTitle>
          <Button type="button" onClick={addLeg} variant="outline" size="sm">
            Add Leg
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {legs.map(leg => (
              <PaperTradeLegForm
                key={leg.id}
                leg={leg}
                onChange={updateLeg}
                onRemove={() => removeLeg(leg.id)}
                broker={selectedBroker}
              />
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Exposure Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Exposures</CardTitle>
        </CardHeader>
        <CardContent>
          <PaperExposureTable exposures={exposures} />
        </CardContent>
      </Card>
      
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
