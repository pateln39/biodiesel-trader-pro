
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { createEmptyFormula } from '@/utils/formulaUtils';
import { toast } from 'sonner';
import { ProductRelationship, PaperRelationshipType, BuySell } from '@/types/trade';
import { getNextMonths } from '@/utils/dateUtils';
import { formatProductDisplay } from '@/utils/tradeUtils';

interface PaperTradeTableProps {
  legs: any[];
  onLegsChange: (legs: any[]) => void;
}

const PaperTradeTable: React.FC<PaperTradeTableProps> = ({ legs, onLegsChange }) => {
  const [productRelationships, setProductRelationships] = useState<ProductRelationship[]>([]);
  
  // Available periods - dynamically generated for next 8 months
  const availablePeriods = getNextMonths(8);
  
  useEffect(() => {
    // Load product relationships from database
    const fetchProductRelationships = async () => {
      const { data, error } = await supabase
        .from('product_relationships')
        .select('*');
        
      if (error) {
        toast.error('Failed to load product relationships', {
          description: error.message
        });
        return;
      }
      
      // Cast the relationship_type field to ensure it's one of our allowed types
      const typedData = data?.map(item => ({
        ...item,
        relationship_type: item.relationship_type as PaperRelationshipType
      })) as ProductRelationship[];
      
      setProductRelationships(typedData || []);
    };
    
    fetchProductRelationships();
  }, []);
  
  // Add a new leg
  const addLeg = () => {
    const newLeg = {
      id: crypto.randomUUID(),
      product: '',
      buySell: 'buy' as BuySell,
      quantity: 0,
      period: '',
      price: 0,
      relationshipType: 'FP' as PaperRelationshipType,
      rightSide: null,
      formula: createEmptyFormula(),
      mtmFormula: createEmptyFormula()
    };
    
    onLegsChange([...legs, newLeg]);
  };

  // Copy the previous leg with a new ID and empty period
  const copyPreviousLeg = () => {
    if (legs.length === 0) return;
    
    const previousLeg = legs[legs.length - 1];
    
    // Create a deep clone of the previous leg
    const newLeg = {
      ...JSON.parse(JSON.stringify(previousLeg)),
      id: crypto.randomUUID(),
      period: '' // Clear the period
    };
    
    // If there's a right side, update its period too
    if (newLeg.rightSide) {
      newLeg.rightSide.period = '';
    }
    
    onLegsChange([...legs, newLeg]);
    toast.success('Previous row copied', {
      description: 'Please select a period for the new row'
    });
  };
  
  // Remove a leg
  const removeLeg = (index: number) => {
    const newLegs = [...legs];
    newLegs.splice(index, 1);
    onLegsChange(newLegs);
  };
  
  // Handle selection of a paper product (FP, DIFF, SPREAD)
  const handleProductSelect = (index: number, selectedProduct: string) => {
    // If no product selected, do nothing
    if (!selectedProduct) {
      return;
    }
    
    // Find the product relationship for the selected product
    const relationship = productRelationships.find(pr => pr.product === selectedProduct);
    
    if (!relationship) {
      toast.error(`Product relationship not found for ${selectedProduct}`);
      return;
    }
    
    const newLegs = [...legs];
    let updatedLeg = { ...newLegs[index] };
    
    // Update leg based on relationship type
    if (relationship.relationship_type === 'FP') {
      // Fixed Price - single sided
      updatedLeg = {
        ...updatedLeg,
        product: relationship.paired_product || '',
        relationshipType: 'FP' as PaperRelationshipType,
        rightSide: null, // No right side for FP
        instrument: `${relationship.paired_product} FP`
      };
    } else if (relationship.relationship_type === 'DIFF' || relationship.relationship_type === 'SPREAD') {
      // DIFF or SPREAD - paired products
      updatedLeg = {
        ...updatedLeg,
        product: relationship.paired_product || '',
        relationshipType: relationship.relationship_type,
        rightSide: {
          product: relationship.default_opposite || '',
          quantity: updatedLeg.quantity ? -updatedLeg.quantity : 0,
          period: updatedLeg.period || '',
          price: 0
        },
        instrument: relationship.relationship_type === 'DIFF' 
          ? `${relationship.paired_product} DIFF` 
          : `${relationship.paired_product}-${relationship.default_opposite} SPREAD`,
        mtmFormula: {
          ...createEmptyFormula(),
          name: selectedProduct, // Use the selected product as MTM formula name
          rightSide: {
            product: relationship.default_opposite || '',
            quantity: updatedLeg.quantity ? -updatedLeg.quantity : 0,
            period: updatedLeg.period || '',
            price: 0
          },
          exposures: {
            physical: {
              [relationship.paired_product || '']: updatedLeg.quantity || 0,
              [relationship.default_opposite || '']: updatedLeg.quantity ? -updatedLeg.quantity : 0
            }
          }
        }
      };
    }
    
    newLegs[index] = updatedLeg;
    onLegsChange(newLegs);
  };
  
  // Update left side field
  const updateLeftSide = (index: number, field: string, value: any) => {
    const newLegs = [...legs];
    const leg = { ...newLegs[index] };
    
    // Update the field
    (leg as any)[field] = value;
    
    // If quantity or period changes, update right side if it exists
    if (leg.rightSide && (field === 'quantity' || field === 'period')) {
      leg.rightSide = {
        ...leg.rightSide,
        quantity: field === 'quantity' ? -value : leg.rightSide.quantity,
        period: field === 'period' ? value : leg.rightSide.period
      };
      
      // Update the mtmFormula exposures for DIFF/SPREAD trades
      if (leg.mtmFormula && leg.relationshipType !== 'FP') {
        const exposures = {
          physical: {
            [leg.product]: value,
            [leg.rightSide.product]: -value
          }
        };
        
        leg.mtmFormula = {
          ...leg.mtmFormula,
          exposures
        };
      }
    }
    
    newLegs[index] = leg;
    onLegsChange(newLegs);
  };
  
  // Update right side field
  const updateRightSide = (index: number, field: string, value: any) => {
    const newLegs = [...legs];
    const leg = { ...newLegs[index] };
    
    if (!leg.rightSide) return;
    
    leg.rightSide = {
      ...leg.rightSide,
      [field]: value
    };
    
    newLegs[index] = leg;
    onLegsChange(newLegs);
  };
  
  // Format a value for display
  const formatValue = (value: any) => {
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    return value;
  };
  
  // Get display text for relationship selection
  const getRelationshipDisplayText = (leg: any) => {
    if (!leg.relationshipType) return "Select product";
    
    const relationship = productRelationships.find(pr => 
      pr.relationship_type === leg.relationshipType && 
      pr.paired_product === leg.product
    );
    
    return relationship?.product || "Select product";
  };

  // Format product display based on relationship type and product
  const getProductDisplay = (leg: any) => {
    if (!leg.product) return "";
    
    return formatProductDisplay(
      leg.product,
      leg.relationshipType,
      leg.rightSide?.product
    );
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-end space-x-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={copyPreviousLeg}
          disabled={legs.length === 0}
        >
          <Copy className="h-4 w-4 mr-1" />
          Copy Previous Row
        </Button>
        <Button type="button" variant="outline" onClick={addLeg}>
          <Plus className="h-4 w-4 mr-1" />
          Add Row
        </Button>
      </div>
      
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" colSpan={4}>LEFT SIDE</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" colSpan={4}>RIGHT SIDE</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" colSpan={2}>MTM</th>
            </tr>
            <tr>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Formula</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {legs.length > 0 ? (
              legs.map((leg, index) => (
                <tr key={leg.id || index}>
                  <td className="px-2 py-3">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeLeg(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                  
                  {/* LEFT SIDE */}
                  <td className="px-4 py-3">
                    <Select 
                      value={getRelationshipDisplayText(leg)}
                      onValueChange={(value) => handleProductSelect(index, value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {productRelationships.map((pr) => (
                          <SelectItem key={pr.id} value={pr.product}>
                            {pr.product}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <Input 
                      type="number" 
                      value={leg.quantity || ''} 
                      onChange={(e) => updateLeftSide(index, 'quantity', Number(e.target.value))}
                      className="w-24"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Select 
                      value={leg.period || ''} 
                      onValueChange={(value) => updateLeftSide(index, 'period', value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePeriods.map((period) => (
                          <SelectItem key={period} value={period}>
                            {period}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <Input 
                      type="number" 
                      value={leg.price !== undefined ? leg.price : ''}
                      min="0"
                      onChange={(e) => updateLeftSide(index, 'price', e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-24"
                    />
                  </td>
                  
                  {/* RIGHT SIDE */}
                  {leg.rightSide ? (
                    <>
                      <td className="px-4 py-3">
                        <Input 
                          type="text" 
                          value={leg.rightSide.product || ''} 
                          readOnly
                          className="w-full bg-gray-50"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input 
                          type="number" 
                          value={leg.rightSide.quantity || ''} 
                          readOnly
                          className="w-24 bg-gray-50"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input 
                          type="text" 
                          value={leg.rightSide.period || ''} 
                          readOnly
                          className="w-32 bg-gray-50"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input 
                          type="number"
                          min="0"
                          value={leg.rightSide.price !== undefined ? leg.rightSide.price : ''}
                          onChange={(e) => updateRightSide(index, 'price', e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-24"
                        />
                      </td>
                    </>
                  ) : (
                    <td colSpan={4} className="px-4 py-3 text-center text-sm text-gray-500">
                      {leg.relationshipType === 'FP' ? 'No right side for Fixed Price' : 'Select a product first'}
                    </td>
                  )}
                  
                  {/* MTM */}
                  <td className="px-4 py-3">
                    <Input 
                      type="text" 
                      value={getProductDisplay(leg)} 
                      readOnly
                      className="w-32 bg-gray-50"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input 
                      type="text" 
                      value={leg.period || ''} 
                      readOnly
                      className="w-32 bg-gray-50"
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={11} className="px-6 py-4 text-center text-sm text-gray-500">
                  No trade legs yet. Click "Add Row" to start building your trade.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaperTradeTable;
