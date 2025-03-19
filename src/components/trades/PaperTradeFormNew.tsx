
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { PaperTradeHeader } from './paper/PaperTradeHeader';
import { PaperTradeTable } from './paper/PaperTradeTable';
import { PaperExposureTable } from './paper/PaperExposureTable';
import { PaperTrade, PaperTradeLeg, PaperTradeRow } from '@/types/paper';
import { supabase } from '@/integrations/supabase/client';
import { generateLegReference } from '@/utils/tradeUtils';
import { createEmptyFormula } from '@/utils/formulaUtils';
import { useBrokers } from '@/hooks/useBrokers';
import { useProductRelationships } from '@/hooks/useProductRelationships';
import { v4 as uuidv4 } from 'uuid';

interface PaperTradeFormNewProps {
  tradeReference: string;
  onSubmit: (trade: any) => void;
  onCancel: () => void;
  isEditMode?: boolean;
  initialData?: PaperTrade;
}

const PaperTradeFormNew: React.FC<PaperTradeFormNewProps> = ({
  tradeReference,
  onSubmit,
  onCancel,
  isEditMode = false,
  initialData
}) => {
  const { brokers } = useBrokers();
  const { productRelationships } = useProductRelationships();
  
  // State for the form
  const [comment, setComment] = useState<string>(initialData?.comment || '');
  const [selectedBroker, setSelectedBroker] = useState<string>(initialData?.broker || '');
  
  // State for the trade rows (3-column structure)
  const [tradeRows, setTradeRows] = useState<PaperTradeRow[]>(() => {
    if (initialData?.rows && initialData.rows.length > 0) {
      return initialData.rows;
    } else if (initialData?.legs && initialData.legs.length > 0) {
      // Convert legacy format to new format
      return [{
        id: uuidv4(),
        legA: initialData.legs[0] || null,
        legB: initialData.legs.length > 1 ? initialData.legs[1] : null,
        mtmFormula: initialData.mtmFormula
      }];
    } else {
      // Create a new empty row
      return [{
        id: uuidv4(),
        legA: null,
        legB: null,
        mtmFormula: createEmptyFormula()
      }];
    }
  });
  
  // Exposure state
  const [exposures, setExposures] = useState<Record<string, Record<string, number>>>({});
  
  // Add a new row to the trade table
  const addRow = () => {
    setTradeRows([
      ...tradeRows,
      {
        id: uuidv4(),
        legA: null,
        legB: null,
        mtmFormula: createEmptyFormula()
      }
    ]);
  };
  
  // Remove a row from the trade table
  const removeRow = (rowId: string) => {
    if (tradeRows.length > 1) {
      setTradeRows(tradeRows.filter(row => row.id !== rowId));
    } else {
      toast.warning("Cannot remove the last row");
    }
  };
  
  // Update leg A in a row
  const updateLegA = (rowId: string, legData: PaperTradeLeg | null) => {
    setTradeRows(tradeRows.map(row => {
      if (row.id === rowId) {
        return { ...row, legA: legData };
      }
      return row;
    }));
  };
  
  // Update leg B in a row
  const updateLegB = (rowId: string, legData: PaperTradeLeg | null) => {
    setTradeRows(tradeRows.map(row => {
      if (row.id === rowId) {
        return { ...row, legB: legData };
      }
      return row;
    }));
  };
  
  // Update MTM formula in a row
  const updateMtmFormula = (rowId: string, formula: any) => {
    setTradeRows(tradeRows.map(row => {
      if (row.id === rowId) {
        return { ...row, mtmFormula: formula };
      }
      return row;
    }));
  };
  
  // Calculate and update the exposures based on trade rows
  useEffect(() => {
    // Calculate exposures based on tradeRows
    const calculatedExposures: Record<string, Record<string, number>> = {};
    
    // Initialize the structure with empty values
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const products = ["UCOME", "FAME0", "RME", "UCOME-5", "RME DC", "LSGO", "ICE GASOIL FUTURES"];
    
    months.forEach(month => {
      calculatedExposures[month] = {};
      products.forEach(product => {
        calculatedExposures[month][product] = 0;
      });
    });
    
    // Calculate exposures from all legs
    tradeRows.forEach(row => {
      // Process leg A
      if (row.legA) {
        const legA = row.legA;
        const month = new Date(legA.pricingPeriodStart).toLocaleString('default', { month: 'short' });
        const product = legA.product;
        
        if (calculatedExposures[month] && product) {
          const qty = legA.buySell === "buy" ? legA.quantity : -legA.quantity;
          calculatedExposures[month][product] = (calculatedExposures[month][product] || 0) + qty;
        }
      }
      
      // Process leg B
      if (row.legB) {
        const legB = row.legB;
        const month = new Date(legB.pricingPeriodStart).toLocaleString('default', { month: 'short' });
        const product = legB.product;
        
        if (calculatedExposures[month] && product) {
          const qty = legB.buySell === "buy" ? legB.quantity : -legB.quantity;
          calculatedExposures[month][product] = (calculatedExposures[month][product] || 0) + qty;
        }
      }
    });
    
    setExposures(calculatedExposures);
  }, [tradeRows]);

  // Validate the form before submission
  const validateForm = () => {
    // Basic validation
    if (!selectedBroker) {
      toast.error("Please select a broker");
      return false;
    }
    
    // Check if at least one leg is defined
    const hasValidLeg = tradeRows.some(row => row.legA !== null || row.legB !== null);
    if (!hasValidLeg) {
      toast.error("At least one trade leg must be defined");
      return false;
    }
    
    // Validate relationship rules
    let isValid = true;
    
    tradeRows.forEach((row, index) => {
      if (row.legA && !row.legB) {
        // For single-leg trades, check if the product allows it
        const relationship = productRelationships.find(r => r.product === row.legA?.product);
        if (relationship && 
           (relationship.relationship_type === 'DIFF' || relationship.relationship_type === 'SPREAD')) {
          toast.error(`Row ${index + 1}: Products with DIFF or SPREAD relationships require both legs`);
          isValid = false;
        }
      } 
      else if (!row.legA && row.legB) {
        // Similar check for leg B
        const relationship = productRelationships.find(r => r.default_opposite === row.legB?.product);
        if (relationship && 
           (relationship.relationship_type === 'DIFF' || relationship.relationship_type === 'SPREAD')) {
          toast.error(`Row ${index + 1}: Products with DIFF or SPREAD relationships require both legs`);
          isValid = false;
        }
      }
    });
    
    return isValid;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate the form
      if (!validateForm()) {
        return;
      }
      
      // Prepare parent trade data
      const parentTradeData = {
        trade_reference: tradeReference,
        trade_type: "paper",
        counterparty: "Paper Trade", // Default counterparty for paper trades
        comment: comment
      };
      
      // Insert or update parent trade
      let parentTradeId;
      if (isEditMode && initialData?.id) {
        // Update existing parent trade
        const { error: updateError } = await supabase
          .from('parent_trades')
          .update(parentTradeData)
          .eq('id', initialData.id);
          
        if (updateError) throw updateError;
        parentTradeId = initialData.id;
      } else {
        // Insert new parent trade
        const { data: parentTrade, error: insertError } = await supabase
          .from('parent_trades')
          .insert(parentTradeData)
          .select('id')
          .single();
          
        if (insertError) throw insertError;
        parentTradeId = parentTrade.id;
      }
      
      // Process all legs from the rows
      const legsToInsert: any[] = [];
      const legsToUpdate: any[] = [];
      let legIndex = 0;
      
      tradeRows.forEach(row => {
        // Process leg A
        if (row.legA) {
          const legData = {
            parent_trade_id: parentTradeId,
            leg_reference: row.legA.legReference || generateLegReference(tradeReference, legIndex++),
            buy_sell: row.legA.buySell,
            product: row.legA.product,
            instrument: row.legA.instrument,
            pricing_period_start: row.legA.pricingPeriodStart,
            pricing_period_end: row.legA.pricingPeriodEnd,
            price: row.legA.price,
            quantity: row.legA.quantity,
            broker: selectedBroker,
            pricing_formula: row.legA.formula,
            mtm_formula: row.mtmFormula
          };
          
          if (row.legA.id && row.legA.id.startsWith('new-')) {
            // New leg to insert
            legsToInsert.push(legData);
          } else if (row.legA.id) {
            // Existing leg to update
            legsToUpdate.push({ id: row.legA.id, ...legData });
          }
        }
        
        // Process leg B
        if (row.legB) {
          const legData = {
            parent_trade_id: parentTradeId,
            leg_reference: row.legB.legReference || generateLegReference(tradeReference, legIndex++),
            buy_sell: row.legB.buySell,
            product: row.legB.product,
            instrument: row.legB.instrument,
            pricing_period_start: row.legB.pricingPeriodStart,
            pricing_period_end: row.legB.pricingPeriodEnd,
            price: row.legB.price,
            quantity: row.legB.quantity,
            broker: selectedBroker,
            pricing_formula: row.legB.formula,
            mtm_formula: row.mtmFormula
          };
          
          if (row.legB.id && row.legB.id.startsWith('new-')) {
            // New leg to insert
            legsToInsert.push(legData);
          } else if (row.legB.id) {
            // Existing leg to update
            legsToUpdate.push({ id: row.legB.id, ...legData });
          }
        }
      });
      
      // Insert new legs
      if (legsToInsert.length > 0) {
        const { error: insertLegsError } = await supabase
          .from('trade_legs')
          .insert(legsToInsert);
          
        if (insertLegsError) throw insertLegsError;
      }
      
      // Update existing legs
      for (const leg of legsToUpdate) {
        const { id, ...legData } = leg;
        const { error: updateLegError } = await supabase
          .from('trade_legs')
          .update(legData)
          .eq('id', id);
          
        if (updateLegError) throw updateLegError;
      }
      
      // Success
      toast.success(`Paper trade ${isEditMode ? 'updated' : 'created'} successfully`);
      
      // Prepare complete trade data for the callback
      const completeTradeData = {
        id: parentTradeId,
        tradeReference,
        tradeType: "paper" as const,
        counterparty: "Paper Trade",
        comment,
        createdAt: new Date(),
        updatedAt: new Date(),
        broker: selectedBroker,
        rows: tradeRows
      };
      
      onSubmit(completeTradeData);
    } catch (error: any) {
      console.error("Error saving paper trade:", error);
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} paper trade: ${error.message}`);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Paper Trade Details</CardTitle>
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
      
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle>Trade Table</CardTitle>
          <Button type="button" onClick={addRow} variant="outline" size="sm">
            Add Row
          </Button>
        </CardHeader>
        <CardContent>
          <PaperTradeTable
            rows={tradeRows}
            onUpdateLegA={updateLegA}
            onUpdateLegB={updateLegB}
            onUpdateMtmFormula={updateMtmFormula}
            onRemoveRow={removeRow}
            productRelationships={productRelationships}
            selectedBroker={selectedBroker}
            tradeReference={tradeReference}
          />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Exposure Table</CardTitle>
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

export default PaperTradeFormNew;
