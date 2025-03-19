
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PaperTradeHeader } from './paper/PaperTradeHeader';
import { PaperExposureTable } from './paper/PaperExposureTable';
import { useProductRelationships } from '@/hooks/useProductRelationships';
import { useBrokers } from '@/hooks/useBrokers';
import { BuySell, Product } from '@/types';
import { PaperParentTrade, PaperTradeLeg, PaperTradeRow as PaperTradeRowType } from '@/types/paper';
import { generateLegReference } from '@/utils/tradeUtils';
import { createEmptyFormula } from '@/utils/formulaUtils';
import { toast } from 'sonner';
import PaperTradeRowComponent from './paper/PaperTradeRow';

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
  
  // State for trade rows (replacing the old legs state)
  const [rows, setRows] = useState<PaperTradeRowType[]>(() => {
    if (initialData?.rows) {
      // Use rows from initialData if available
      return initialData.rows;
    } else if (initialData?.legs && initialData.legs.length > 0) {
      // Convert from old legacy format with individual legs to rows
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
      // Create a default row
      return [{
        id: crypto.randomUUID(),
        legA: {
          id: crypto.randomUUID(),
          legReference: `${tradeReference}-0A`,
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
  
  // Load product relationships and brokers
  const { productRelationships } = useProductRelationships();
  const { brokers } = useBrokers();
  
  // State for exposure data (will be calculated from rows)
  const [exposures, setExposures] = useState<Record<string, Record<string, number>>>({});
  
  // Update exposures whenever rows change
  useEffect(() => {
    calculateExposures();
  }, [rows]);
  
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
  
  // Calculate exposures from rows
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
  
  // Add a new row
  const addRow = () => {
    const newRow: PaperTradeRowType = {
      id: crypto.randomUUID(),
      legA: {
        id: crypto.randomUUID(),
        legReference: `${tradeReference}-${rows.length}A`,
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
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBroker) {
      toast.error("Please select a broker");
      return;
    }
    
    // Check if each row has at least one leg with valid quantity
    if (rows.some(row => (!row.legA || row.legA.quantity <= 0) && (!row.legB || row.legB.quantity <= 0))) {
      toast.error("All rows must have at least one leg with a valid quantity");
      return;
    }
    
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
      createdAt: initialData?.createdAt || new Date(),
      updatedAt: new Date(),
      comment
    };
    
    // Prepare the final object for submission
    const tradeData = {
      ...parentTrade,
      broker: selectedBroker,
      // Include first leg data for backwards compatibility
      ...allLegs[0],
      legs: allLegs,
      rows // Include the rows structure for the new UI
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
      
      {/* Trade Rows */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Trade Rows</CardTitle>
          <Button type="button" onClick={addRow} variant="outline" size="sm">
            Add Row
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rows.map((row, index) => (
              <PaperTradeRowComponent
                key={row.id}
                row={row}
                onChange={updateRow}
                onRemove={() => removeRow(row.id)}
                broker={selectedBroker}
                tradeReference={tradeReference}
                rowIndex={index}
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
