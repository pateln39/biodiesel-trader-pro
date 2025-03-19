
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PaperTradeHeader } from './paper/PaperTradeHeader';
import PaperTradeTable from './paper/PaperTradeTable';
import { PaperExposureTable } from './paper/PaperExposureTable';
import { useBrokers } from '@/hooks/useBrokers';
import { PaperParentTrade, PaperTradePositionSide, PaperTradeRow as PaperTradeRowType } from '@/types/paper';
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
      return initialData.rows.map((row: any) => ({
        ...row,
        leftSide: row.legA ? {
          ...row.legA,
          sideReference: row.legA.legReference
        } : null,
        rightSide: row.legB ? {
          ...row.legB,
          sideReference: row.legB.legReference
        } : null,
        // Remove the old properties since we've migrated them
        legA: undefined,
        legB: undefined
      }));
    } else if (initialData?.legs && initialData.legs.length > 0) {
      // Convert from old legacy format with individual legs to rows format
      const legsByPair: Record<string, PaperTradePositionSide[]> = {};
      
      // Group sides by the first part of sideReference (e.g., "TR-001-1A" and "TR-001-1B" go together)
      initialData.legs.forEach((leg: any) => {
        const side = {
          ...leg,
          sideReference: leg.legReference
        };
        const baseRef = side.sideReference.slice(0, -1); // Remove last character (A/B)
        if (!legsByPair[baseRef]) {
          legsByPair[baseRef] = [];
        }
        legsByPair[baseRef].push(side);
      });
      
      // Convert to rows
      return Object.values(legsByPair).map((sides) => {
        const leftSide = sides.find(s => s.sideReference.endsWith('A'));
        const rightSide = sides.find(s => s.sideReference.endsWith('B'));
        
        return {
          id: crypto.randomUUID(),
          leftSide: leftSide || null,
          rightSide: rightSide || null,
          mtmFormula: initialData.mtmFormula || createEmptyFormula()
        };
      });
    } else {
      // Create a default first row
      return [{
        id: crypto.randomUUID(),
        leftSide: {
          id: crypto.randomUUID(),
          sideReference: generateLegReference(tradeReference, 0, 'A'),
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
        rightSide: null,
        mtmFormula: createEmptyFormula()
      }];
    }
  });
  
  // Load brokers
  const { brokers } = useBrokers();
  
  // When broker is selected, update all sides to use that broker
  useEffect(() => {
    if (selectedBroker) {
      setRows(prevRows => 
        prevRows.map(row => ({
          ...row,
          leftSide: row.leftSide ? { ...row.leftSide, broker: selectedBroker } : null,
          rightSide: row.rightSide ? { ...row.rightSide, broker: selectedBroker } : null
        }))
      );
    }
  }, [selectedBroker]);
  
  // Add a new row
  const addRow = () => {
    const newRow: PaperTradeRowType = {
      id: crypto.randomUUID(),
      leftSide: {
        id: crypto.randomUUID(),
        sideReference: generateLegReference(tradeReference, rows.length, 'A'),
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
      rightSide: null,
      mtmFormula: createEmptyFormula()
    };
    
    setRows([...rows, newRow]);
  };
  
  // Remove a row by id
  const removeRow = (id: string) => {
    if (rows.length <= 1) {
      toast.error("Cannot remove the last position");
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
    
    // Check if each row has at least one side with valid quantity
    const invalidRow = rows.find(row => 
      (!row.leftSide || row.leftSide.quantity <= 0) && 
      (!row.rightSide || row.rightSide.quantity <= 0)
    );
    
    if (invalidRow) {
      toast.error("All positions must have at least one side with a valid quantity");
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
      // Flatten all sides for DB storage (for backward compatibility with old 'legs' structure)
      const allSides: PaperTradePositionSide[] = [];
      rows.forEach(row => {
        if (row.leftSide) allSides.push({
          ...row.leftSide,
          legReference: row.leftSide.sideReference // For backward compatibility
        } as any);
        if (row.rightSide) allSides.push({
          ...row.rightSide,
          legReference: row.rightSide.sideReference // For backward compatibility
        } as any);
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
      
      // Ensure rows are compatible with old format for backward compatibility
      const compatibleRows = rows.map(row => ({
        ...row,
        legA: row.leftSide,
        legB: row.rightSide
      }));
      
      // Prepare the final object for submission
      const tradeData = {
        ...parentTrade,
        // Include first side data for backwards compatibility
        ...(allSides[0] || {}),
        legs: allSides,
        rows: compatibleRows // Include the rows structure for the new UI
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
      
      {/* Trade Position Rows */}
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
