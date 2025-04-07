
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { generateLegReference } from '@/utils/tradeUtils';
import { toast } from 'sonner';

export interface PaperTradeTableProps {
  legs: any[];
  onLegsChange: (newLegs: any[]) => void;
  readOnly?: boolean;
}

interface ProductRelationship {
  id: string;
  product: string;
  relationship_type: 'FP' | 'DIFF' | 'SPREAD';
  paired_product: string | null;
  default_opposite: string | null;
}

const PaperTradeTable: React.FC<PaperTradeTableProps> = ({ 
  legs, 
  onLegsChange,
  readOnly = false 
}) => {
  // Fetch product relationships
  const { data: productRelationships = [], isLoading } = useQuery({
    queryKey: ['product-relationships'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_relationships')
        .select('*')
        .order('product');
        
      if (error) throw error;
      return data as ProductRelationship[];
    }
  });

  // Handle adding a new leg
  const handleAddLeg = () => {
    const newLeg = {
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
    
    onLegsChange([...legs, newLeg]);
  };

  // Handle removing a leg
  const handleRemoveLeg = (index: number) => {
    const newLegs = [...legs];
    newLegs.splice(index, 1);
    onLegsChange(newLegs);
  };

  // Handle change to a leg property
  const handleLegChange = (index: number, side: 'leftSide' | 'rightSide' | 'mtm', field: string, value: any) => {
    const newLegs = [...legs];
    newLegs[index][side][field] = value;
    
    // Special handling for product selection on left side
    if (side === 'leftSide' && field === 'product') {
      handleProductSelection(newLegs, index, value);
    }
    
    // Automatically negate quantity on right side
    if (side === 'leftSide' && field === 'quantity' && newLegs[index].rightSide.product) {
      const quantity = parseFloat(value);
      if (!isNaN(quantity)) {
        newLegs[index].rightSide.quantity = (-quantity).toString();
      }
    }
    
    // If we're changing period on one side, update the other side too
    if (field === 'period') {
      if (side === 'leftSide' && newLegs[index].rightSide.product) {
        newLegs[index].rightSide.period = value;
      } else if (side === 'rightSide' && newLegs[index].leftSide.product) {
        newLegs[index].leftSide.period = value;
      }
    }
    
    onLegsChange(newLegs);
  };

  // Handle product selection
  const handleProductSelection = (legs: any[], index: number, productCode: string) => {
    const relationship = productRelationships.find(r => r.product === productCode);
    
    if (!relationship) {
      console.warn(`No relationship found for product ${productCode}`);
      return;
    }
    
    const leg = legs[index];
    
    // Set relationship type
    leg.relationshipType = relationship.relationship_type;
    
    // Set MTM formula based on product
    leg.mtm.formula = productCode;
    
    // Handle based on relationship type
    if (relationship.relationship_type === 'FP') {
      // Fixed price products have no right side
      leg.rightSide = {
        product: '',
        quantity: '',
        period: '',
        price: ''
      };
    } else if (relationship.relationship_type === 'DIFF') {
      // Diff products have paired product on left, LSGO on right
      leg.leftSide.product = relationship.paired_product || '';
      leg.rightSide.product = relationship.default_opposite || 'LSGO';
      
      // Mirror period and negate quantity
      leg.rightSide.period = leg.leftSide.period;
      const quantity = parseFloat(leg.leftSide.quantity);
      if (!isNaN(quantity)) {
        leg.rightSide.quantity = (-quantity).toString();
      }
    } else if (relationship.relationship_type === 'SPREAD') {
      // Spread products have paired product on left, default opposite on right
      leg.leftSide.product = relationship.paired_product || '';
      leg.rightSide.product = relationship.default_opposite || '';
      
      // Mirror period and negate quantity
      leg.rightSide.period = leg.leftSide.period;
      const quantity = parseFloat(leg.leftSide.quantity);
      if (!isNaN(quantity)) {
        leg.rightSide.quantity = (-quantity).toString();
      }
    }
    
    // Update exposures based on product type
    updateExposures(leg);
  };

  // Update exposures based on product selections
  const updateExposures = (leg: any) => {
    const exposures = {
      physical: {},
      pricing: {}
    };
    
    if (leg.leftSide.product) {
      const quantity = parseFloat(leg.leftSide.quantity) || 0;
      
      if (leg.relationshipType === 'FP') {
        // Single-sided exposure
        exposures.physical[leg.leftSide.product] = quantity;
        exposures.pricing[leg.leftSide.product] = quantity;
      } else if (['DIFF', 'SPREAD'].includes(leg.relationshipType)) {
        // Two-sided exposure
        exposures.physical[leg.leftSide.product] = quantity;
        
        if (leg.rightSide.product) {
          exposures.physical[leg.rightSide.product] = -quantity;
          exposures.pricing[leg.rightSide.product] = -quantity;
        }
        
        exposures.pricing[leg.leftSide.product] = quantity;
      }
    }
    
    leg.exposures = exposures;
  };

  // Get available periods (months)
  const getAvailablePeriods = () => {
    const now = new Date();
    const periods = [];
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthCode = `${date.toLocaleString('default', { month: 'short' })}-${date.getFullYear().toString().slice(2)}`;
      periods.push(monthCode);
    }
    
    return periods;
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading product data...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Left Side</th>
              <th className="text-left p-2">Right Side</th>
              <th className="text-left p-2">MTM</th>
              <th className="text-left p-2 w-[80px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {legs.map((leg, index) => (
              <tr key={leg.legReference || index} className="border-b">
                {/* Left Side */}
                <td className="p-2">
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <Select
                        value={leg.leftSide.product}
                        onValueChange={(value) => handleLegChange(index, 'leftSide', 'product', value)}
                        disabled={readOnly}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Product" />
                        </SelectTrigger>
                        <SelectContent>
                          {productRelationships.map((rel) => (
                            <SelectItem key={rel.id} value={rel.product}>
                              {rel.product}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Input
                        placeholder="Quantity"
                        value={leg.leftSide.quantity}
                        onChange={(e) => handleLegChange(index, 'leftSide', 'quantity', e.target.value)}
                        type="number"
                        disabled={readOnly}
                      />
                    </div>
                    <div>
                      <Select
                        value={leg.leftSide.period}
                        onValueChange={(value) => handleLegChange(index, 'leftSide', 'period', value)}
                        disabled={readOnly}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Period" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailablePeriods().map((period) => (
                            <SelectItem key={period} value={period}>
                              {period}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Input
                        placeholder="Price"
                        value={leg.leftSide.price}
                        onChange={(e) => handleLegChange(index, 'leftSide', 'price', e.target.value)}
                        type="number"
                        disabled={readOnly}
                      />
                    </div>
                  </div>
                </td>
                
                {/* Right Side */}
                <td className="p-2">
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <Input
                        placeholder="Product"
                        value={leg.rightSide.product}
                        readOnly
                        disabled={true}
                        className="bg-muted"
                      />
                    </div>
                    <div>
                      <Input
                        placeholder="Quantity"
                        value={leg.rightSide.quantity}
                        readOnly
                        disabled={true}
                        className="bg-muted"
                      />
                    </div>
                    <div>
                      <Input
                        placeholder="Period"
                        value={leg.rightSide.period}
                        readOnly
                        disabled={true}
                        className="bg-muted"
                      />
                    </div>
                    <div>
                      <Input
                        placeholder="Price"
                        value={leg.rightSide.price}
                        onChange={(e) => handleLegChange(index, 'rightSide', 'price', e.target.value)}
                        type="number"
                        disabled={readOnly || !leg.rightSide.product}
                      />
                    </div>
                  </div>
                </td>
                
                {/* MTM */}
                <td className="p-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Input
                        placeholder="Formula"
                        value={leg.mtm.formula}
                        readOnly
                        disabled={true}
                        className="bg-muted"
                      />
                    </div>
                    <div>
                      <Select
                        value={leg.mtm.period}
                        onValueChange={(value) => handleLegChange(index, 'mtm', 'period', value)}
                        disabled={readOnly}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Period" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailablePeriods().map((period) => (
                            <SelectItem key={period} value={period}>
                              {period}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </td>
                
                {/* Actions */}
                <td className="p-2 text-center">
                  {!readOnly && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveLeg(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {!readOnly && (
        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddLeg}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Row
          </Button>
        </div>
      )}
    </div>
  );
};

export default PaperTradeTable;
