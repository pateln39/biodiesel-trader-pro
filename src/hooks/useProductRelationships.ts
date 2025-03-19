
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BuySell, Product } from '@/types/trade';

export interface ProductRelationship {
  id: string;
  product: string;
  relationshipType: 'DIFF' | 'SPREAD' | 'FP';
  pairedProduct: string | null;
  defaultOpposite: string | null;
}

interface ProductRule {
  autoPopulate: string | false;
  quantityBehavior: 'same' | 'opposite';
  usesPairedProduct?: boolean;
}

export const useProductRelationships = () => {
  const [relationships, setRelationships] = useState<ProductRelationship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchRelationships = async () => {
      try {
        const { data, error } = await supabase
          .from('product_relationships')
          .select('*');

        if (error) {
          throw new Error(error.message);
        }

        const mappedData = data.map(item => ({
          id: item.id,
          product: item.product,
          relationshipType: item.relationship_type as 'DIFF' | 'SPREAD' | 'FP',
          pairedProduct: item.paired_product,
          defaultOpposite: item.default_opposite
        }));

        setRelationships(mappedData);
      } catch (err: any) {
        setError(err);
        console.error('Error fetching product relationships:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRelationships();
  }, []);

  // Get product rule based on product
  const getProductRule = (product: Product): ProductRule => {
    const relationship = relationships.find(r => r.product === product);

    if (!relationship) {
      // Default rule if no relationship is found
      return {
        autoPopulate: false,
        quantityBehavior: 'same'
      };
    }

    switch (relationship.relationshipType) {
      case 'DIFF':
        return {
          autoPopulate: relationship.defaultOpposite || false,
          quantityBehavior: 'opposite'
        };
      case 'SPREAD':
        return {
          usesPairedProduct: true,
          autoPopulate: relationship.pairedProduct || false,
          quantityBehavior: 'opposite'
        };
      case 'FP':
        return {
          autoPopulate: false,
          quantityBehavior: 'same'
        };
      default:
        return {
          autoPopulate: false,
          quantityBehavior: 'same'
        };
    }
  };

  // Helper to get opposite buy/sell
  const getOppositeBuySell = (buySell: BuySell): BuySell => {
    return buySell === 'buy' ? 'sell' : 'buy';
  };

  // Helper to get auto-populated leg info based on a filled leg
  const getAutoPopulatedLeg = (
    product: Product,
    buySell: BuySell,
    quantity: number
  ) => {
    const rule = getProductRule(product);
    
    const populatedLeg = {
      product: rule.autoPopulate || product,
      buySell: rule.quantityBehavior === 'opposite' ? getOppositeBuySell(buySell) : buySell,
      quantity: rule.quantityBehavior === 'opposite' ? -quantity : quantity
    };

    return populatedLeg;
  };

  return {
    relationships,
    isLoading,
    error,
    getProductRule,
    getOppositeBuySell,
    getAutoPopulatedLeg
  };
};
