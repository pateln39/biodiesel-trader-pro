
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PaperTradeHeader } from './paper/PaperTradeHeader';
import PaperTradeTable from './paper/PaperTradeTable';
import { PaperExposureTable } from './paper/PaperExposureTable';
import { useBrokers } from '@/hooks/useBrokers';
import { PaperParentTrade, PaperTradeLeg, PaperTradeRow as PaperTradeRowType } from '@/types/paper';
import { generateLegReference } from '@/utils/tradeUtils';
import { createEmptyFormula } from '@/utils/formulaUtils';
import { toast } from 'sonner';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for trade rows
  const [rows, setRows] = useState<PaperTradeRowType[]>(() => {
    if (initialData?.rows && initialData.rows.length > 0) {
      // Use rows from initialData if available
      return initialData.rows;
    } else if (initialData?.legs && initialData.legs.length > 0) {
      // Convert from old legacy format with individual legs to rows format
      const legsByPair: Record<string, PaperTradeLeg[]> = {};
      
      // Group legs by the first part of legReference (e.g., "TR-001-1A" and "TR-001-1B" go together)
      initialData.legs.forEach((leg: PaperTradeLeg) => {
        const baseRef = leg.legReference.slice(0, -1); // Remove last character (A/B)
        if (!legsByPair[baseRef]) {
          legsByPair[baseRef] = [];
        }
        legsByPair[baseRef].push(leg);
      });
      
      // Convert to rows
      return Object.values(legsByPair).map((legs) => {
        const legA = legs.find(l => l.legReference.endsWith('A'));
        const legB = legs.find(l => l.legReference.endsWith('B'));
        
        return {
          id: crypto.randomUUID(),
          legA: legA || null,
          legB: legB || null,
          mtmFormula: initialData.mtmFormula || createEmptyFormula()
        };
      });
    } else {
      // Create a default first row
      return [{
        id: crypto.randomUUID(),
        legA: {
          id: crypto.randomUUID(),
          legReference: generateLegReference(tradeReference, 0, 'A'),
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
        },
        legB: null,
        mtmFormula: createEmptyFormula()
      }];
    }
  });
  
  // Load brokers
  const { brokers } = useBrokers();
  
  // When broker is selected, update all legs to use that broker
  useEffect(() => {
    if (selectedBroker) {
      setRows(prevRows => 
        prevRows.map(row => ({
          ...row,
          legA: row.legA ? { ...row.legA, broker: selectedBroker } : null,
          legB: row.legB ? { ...row.legB, broker: selectedBroker } : null
        }))
      );
    }
  }, [selectedBroker]);
  
  // Add a new row
  const addRow = () => {
    const newRow: PaperTradeRowType = {
      id: crypto.randomUUID(),
      legA: {
        id: crypto.randomUUID(),
        legReference: generateLegReference(tradeReference, rows.length, 'A'),
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
      },
      legB: null,
      mtmFormula: createEmptyFormula()
    };
    
    setRows([...rows, newRow]);
  };
  
  // Remove a row by id
  const removeRow = (id: string) => {
    if (rows.length <= 1) {
      toast.error("Cannot remove the last row");
      return;
    }
    
    setRows(prevRows => prevRows.filter(row => row.id !== id));
  };
  
  // Update a row
  const updateRow = (updatedRow: PaperTradeRowType) => {
    setRows(prevRows => 
      prevRows.map(row => 
        row.id === updatedRow.id ? updatedRow : row
      )
    );
  };
  
  // Validate the form
  const validateForm = (): boolean => {
    if (!selectedBroker) {
      toast.error("Please select a broker");
      return false;
    }
    
    // Check if each row has at least one leg with valid quantity
    const invalidRow = rows.find(row => 
      (!row.legA || row.legA.quantity <= 0) && 
      (!row.legB || row.legB.quantity <= 0)
    );
    
    if (invalidRow) {
      toast.error("All rows must have at least one leg with a valid quantity");
      return false;
    }
    
    return true;
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || isSubmitting) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Flatten all legs for DB storage
      const allLegs: PaperTradeLeg[] = [];
      rows.forEach(row => {
        if (row.legA) allLegs.push(row.legA);
        if (row.legB) allLegs.push(row.legB);
      });
      
      // Create the parent trade object
      const parentTrade: PaperParentTrade = {
        id: initialData?.id || crypto.randomUUID(),
        tradeReference,
        tradeType: 'paper',
        counterparty: 'Broker', // Paper trades are with broker
        broker: selectedBroker,
        createdAt: initialData?.createdAt || new Date(),
        updatedAt: new Date(),
        comment
      };
      
      // Prepare the final object for submission
      const tradeData = {
        ...parentTrade,
        // Include first leg data for backwards compatibility
        ...(allLegs[0] || {}),
        legs: allLegs,
        rows // Include the rows structure for the new UI
      };
      
      onSubmit(tradeData);
    } catch (error: any) {
      console.error('Error preparing trade data:', error);
      toast.error("Failed to prepare trade data");
    } finally {
      setIsSubmitting(false);
    }
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
            disabled={isSubmitting}
          />
        </CardContent>
      </Card>
      
      {/* Trade Rows */}
      <PaperTradeTable 
        rows={rows}
        onAddRow={addRow}
        onUpdateRow={updateRow}
        onRemoveRow={removeRow}
        broker={selectedBroker}
        tradeReference={tradeReference}
        disabled={isSubmitting}
      />
      
      {/* Exposure Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Exposures</CardTitle>
        </CardHeader>
        <CardContent>
          <PaperExposureTable rows={rows} />
        </CardContent>
      </Card>
      
      <Separator />
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Processing...' : isEditMode ? 'Update Trade' : 'Create Trade'}
        </Button>
      </div>
    </form>
  );
};

export default PaperTradeForm;
