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
import { formatProductDisplay, formatMTMDisplay } from '@/utils/tradeUtils';

interface PaperTradeTableProps {
  legs: any[];
  onLegsChange: (legs: any[]) => void;
}

const PaperTradeTable: React.FC<PaperTradeTableProps> = ({ legs, onLegsChange }) => {
  const [productRelationships, setProductRelationships] = useState<ProductRelationship[]>([]);
  
  const availablePeriods = getNextMonths(13);
  
  useEffect(() => {
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
      
      const typedData = data?.map(item => ({
        ...item,
        relationship_type: item.relationship_type as PaperRelationshipType
      })) as ProductRelationship[];
      
      setProductRelationships(typedData || []);
    };
    
    fetchProductRelationships();
  }, []);
  
  useEffect(() => {
    if (legs.length > 0) {
      const updatedLegs = legs.map(leg => {
        if (leg.relationshipType !== 'FP' && leg.rightSide) {
          if (leg.rightSide.quantity !== -leg.quantity) {
            return {
              ...leg,
              rightSide: {
                ...leg.rightSide,
                quantity: -leg.quantity
              }
            };
          }
        }
        return leg;
      });
      
      const needsUpdate = updatedLegs.some((leg, index) => 
        leg.rightSide?.quantity !== legs[index].rightSide?.quantity
      );
      
      if (needsUpdate) {
        onLegsChange(updatedLegs);
      }
    }
  }, [legs]);
  
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
      mtmFormula: createEmptyFormula(),
      exposures: {
        physical: {},
        paper: {},
        pricing: {}
      }
    };
    
    onLegsChange([...legs, newLeg]);
  };

  const copyPreviousLeg = () => {
    if (legs.length === 0) return;
    
    const previousLeg = legs[legs.length - 1];
    
    const newLeg = {
      ...JSON.parse(JSON.stringify(previousLeg)),
      id: crypto.randomUUID(),
      period: ''
    };
    
    if (newLeg.rightSide) {
      newLeg.rightSide.period = '';
    }
    
    onLegsChange([...legs, newLeg]);
    toast.success('Previous row copied', {
      description: 'Please select a period for the new row'
    });
  };
  
  const removeLeg = (index: number) => {
    const newLegs = [...legs];
    newLegs.splice(index, 1);
    onLegsChange(newLegs);
  };
  
  const handleProductSelect = (index: number, selectedProduct: string) => {
    if (!selectedProduct) {
      return;
    }
    
    const relationship = productRelationships.find(pr => pr.product === selectedProduct);
    
    if (!relationship) {
      toast.error(`Product relationship not found for ${selectedProduct}`);
      return;
    }
    
    const newLegs = [...legs];
    let updatedLeg = { ...newLegs[index] };
    
    if (relationship.relationship_type === 'FP') {
      updatedLeg = {
        ...updatedLeg,
        product: relationship.paired_product || '',
        relationshipType: 'FP' as PaperRelationshipType,
        rightSide: null,
        instrument: `${relationship.paired_product} FP`,
        mtmFormula: {
          ...createEmptyFormula(),
          name: `${relationship.paired_product} FP`,
          exposures: {
            physical: {
              [relationship.paired_product || '']: updatedLeg.quantity || 0
            },
            pricing: {}
          }
        },
        exposures: {
          physical: {
            [relationship.paired_product || '']: updatedLeg.quantity || 0
          },
          paper: {
            [relationship.paired_product || '']: updatedLeg.quantity || 0
          },
          pricing: {}
        }
      };
    } else if (relationship.relationship_type === 'DIFF' || relationship.relationship_type === 'SPREAD') {
      const rightQuantity = updatedLeg.quantity ? -updatedLeg.quantity : 0;
      
      updatedLeg = {
        ...updatedLeg,
        product: relationship.paired_product || '',
        relationshipType: relationship.relationship_type,
        rightSide: {
          product: relationship.default_opposite || '',
          quantity: rightQuantity,
          period: updatedLeg.period || '',
          price: 0
        },
        instrument: relationship.relationship_type === 'DIFF' 
          ? `${relationship.paired_product} DIFF` 
          : `${relationship.paired_product}-${relationship.default_opposite} SPREAD`,
        mtmFormula: {
          ...createEmptyFormula(),
          name: selectedProduct,
          rightSide: {
            product: relationship.default_opposite || '',
            quantity: rightQuantity,
            period: updatedLeg.period || '',
            price: 0
          },
          exposures: {
            physical: {
              [relationship.paired_product || '']: updatedLeg.quantity || 0,
              [relationship.default_opposite || '']: rightQuantity
            }
          }
        },
        exposures: {
          physical: {
            [relationship.paired_product || '']: updatedLeg.quantity || 0,
            [relationship.default_opposite || '']: rightQuantity
          },
          paper: {
            [relationship.paired_product || '']: updatedLeg.quantity || 0,
            [relationship.default_opposite || '']: rightQuantity
          },
          pricing: {}
        }
      };
    }
    
    newLegs[index] = updatedLeg;
    onLegsChange(newLegs);
  };
  
  const updateLeftSide = (index: number, field: string, value: any) => {
    const newLegs = [...legs];
    const leg = { ...newLegs[index] };
    
    (leg as any)[field] = value;
    
    if (leg.rightSide && (field === 'quantity' || field === 'period')) {
      leg.rightSide = {
        ...leg.rightSide,
        quantity: field === 'quantity' ? -value : leg.rightSide.quantity,
        period: field === 'period' ? value : leg.rightSide.period
      };
      
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
      
      if (field === 'quantity' && leg.relationshipType === 'FP' && leg.product) {
        if (leg.mtmFormula) {
          leg.mtmFormula = {
            ...leg.mtmFormula,
            exposures: {
              physical: {
                [leg.product]: value
              },
              pricing: {}
            }
          };
        }
      }
      
      if (leg.exposures && leg.rightSide && leg.relationshipType !== 'FP') {
        leg.exposures = {
          ...leg.exposures,
          physical: {
            ...leg.exposures.physical,
            [leg.product]: value,
            [leg.rightSide.product]: -value
          },
          paper: {
            ...leg.exposures.paper,
            [leg.product]: value,
            [leg.rightSide.product]: -value
          }
        };
      }
    }
    
    newLegs[index] = leg;
    onLegsChange(newLegs);
  };
  
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
  
  const formatValue = (value: any) => {
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    return value;
  };
  
  const getRelationshipDisplayText = (leg: any) => {
    if (!leg.relationshipType) return "Select product";
    
    let relationship;
    
    if (leg.relationshipType === 'FP') {
      relationship = productRelationships.find(pr => 
        pr.relationship_type === 'FP' && 
        pr.paired_product === leg.product
      );
    } else {
      relationship = productRelationships.find(pr => 
        pr.relationship_type === leg.relationshipType && 
        pr.paired_product === leg.product
      );
    }
    
    return relationship?.product || "Select product";
  };

  const getProductDisplay = (leg: any) => {
    if (!leg.product) return "";
    
    return formatProductDisplay(
      leg.product,
      leg.relationshipType,
      leg.rightSide?.product
    );
  };
  
  const getMTMFormulaDisplay = (leg: any) => {
    if (!leg.product) return "";
    
    return formatMTMDisplay(
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
          <thead className="bg-gradient-to-br from-brand-navy/75 via-brand-navy/60 to-brand-lime/25">
            <tr>
              <th className="px-2 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"></th>
              <th className="px-4 py-3 text-center text-xs font-medium text-white uppercase tracking-wider" colSpan={1}>PRODUCT TYPE</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-white uppercase tracking-wider" colSpan={4}>LEFT SIDE</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-white uppercase tracking-wider" colSpan={4}>RIGHT SIDE</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-white uppercase tracking-wider" colSpan={2}>MTM</th>
            </tr>
            <tr>
              <th className="px-2 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"></th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Product</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Product</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Qty</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Period</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Price</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Product</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Qty</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Period</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Price</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Formula</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Period</th>
            </tr>
          </thead>
          <tbody className="bg-transparent divide-y divide-gray-200">
            {legs.length > 0 ? (
              legs.map((leg, index) => (
                <tr key={leg.id || index} className="bg-gradient-to-br from-brand-navy/75 via-brand-navy/60 to-brand-lime/25">
                  <td className="px-2 py-3 text-white">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeLeg(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                  
                  <td className="px-4 py-3 text-white">
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
                  
                  <td className="px-4 py-3 text-white">
                    <Input 
                      type="text" 
                      value={leg.product || ''} 
                      readOnly
                      className="w-full bg-brand-navy/30 text-white border-brand-navy/50 cursor-default"
                    />
                  </td>
                  
                  <td className="px-4 py-3 text-white">
                    <Input 
                      type="number" 
                      value={leg.quantity || ''} 
                      onChange={(e) => updateLeftSide(index, 'quantity', Number(e.target.value))}
                      className="w-24"
                    />
                  </td>
                  <td className="px-4 py-3 text-white">
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
                  <td className="px-4 py-3 text-white">
                    <Input 
                      type="number" 
                      value={leg.price !== undefined ? leg.price : ''}
                      min="0"
                      onChange={(e) => updateLeftSide(index, 'price', e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-24"
                    />
                  </td>
                  
                  {leg.rightSide ? (
                    <>
                      <td className="px-4 py-3 text-white">
                        <Input 
                          type="text" 
                          value={leg.rightSide.product || ''} 
                          readOnly
                          className="w-full bg-brand-navy/30 text-white border-brand-navy/50 cursor-default"
                        />
                      </td>
                      <td className="px-4 py-3 text-white">
                        <Input 
                          type="number" 
                          value={leg.rightSide.quantity || ''} 
                          readOnly
                          className="w-24 bg-brand-navy/30 text-white border-brand-navy/50 cursor-default"
                        />
                      </td>
                      <td className="px-4 py-3 text-white">
                        <Input 
                          type="text" 
                          value={leg.rightSide.period || ''} 
                          readOnly
                          className="w-32 bg-brand-navy/30 text-white border-brand-navy/50 cursor-default"
                        />
                      </td>
                      <td className="px-4 py-3 text-white">
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
                    <td colSpan={4} className="px-4 py-3 text-center text-white">
                      {leg.relationshipType === 'FP' ? 'No right side for Fixed Price' : 'Select a product first'}
                    </td>
                  )}
                  
                  <td className="px-4 py-3 text-white">
                    <Input 
                      type="text" 
                      value={getMTMFormulaDisplay(leg)} 
                      readOnly
                      className="w-32 bg-brand-navy/30 text-white border-brand-navy/50 cursor-default"
                    />
                  </td>
                  <td className="px-4 py-3 text-white">
                    <Input 
                      type="text" 
                      value={leg.period || ''} 
                      readOnly
                      className="w-32 bg-brand-navy/30 text-white border-brand-navy/50 cursor-default"
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={12} className="px-6 py-4 text-center text-white bg-gradient-to-br from-brand-navy/75 via-brand-navy/60 to-brand-lime/25">
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
