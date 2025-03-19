
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

export interface PaperTradeProduct {
  id: string;
  productCode: string;
  displayName: string;
  category: 'FP' | 'DIFF' | 'SPREAD';
  baseProduct: string | null;
  pairedProduct: string | null;
}

interface ProductRule {
  autoPopulate: string | false;
  quantityBehavior: 'same' | 'opposite';
  usesPairedProduct?: boolean;
}

export const useProductRelationships = () => {
  const [relationships, setRelationships] = useState<ProductRelationship[]>([]);
  const [paperProducts, setPaperProducts] = useState<PaperTradeProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        // Fetch traditional product relationships
        const { data: relationshipData, error: relError } = await supabase
          .from('product_relationships')
          .select('*');

        if (relError) {
          throw new Error(relError.message);
        }

        const mappedRelationships = relationshipData.map(item => ({
          id: item.id,
          product: item.product,
          relationshipType: item.relationship_type as 'DIFF' | 'SPREAD' | 'FP',
          pairedProduct: item.paired_product,
          defaultOpposite: item.default_opposite
        }));

        setRelationships(mappedRelationships);

        // Fetch paper trade products
        const { data: paperProductData, error: paperError } = await supabase
          .from('paper_trade_products')
          .select('*')
          .eq('is_active', true);

        if (paperError) {
          throw new Error(paperError.message);
        }

        const mappedPaperProducts = paperProductData.map(item => ({
          id: item.id,
          productCode: item.product_code,
          displayName: item.display_name,
          category: item.category as 'FP' | 'DIFF' | 'SPREAD',
          baseProduct: item.base_product,
          pairedProduct: item.paired_product
        }));

        setPaperProducts(mappedPaperProducts);
      } catch (err: any) {
        setError(err);
        console.error('Error fetching product data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductData();
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

  // Get product rule based on paper product code
  const getPaperProductRule = (productCode: string): ProductRule => {
    const paperProduct = paperProducts.find(p => p.productCode === productCode);

    if (!paperProduct) {
      // Default rule if no product is found
      return {
        autoPopulate: false,
        quantityBehavior: 'same'
      };
    }

    switch (paperProduct.category) {
      case 'DIFF':
        return {
          autoPopulate: paperProduct.pairedProduct || false,
          quantityBehavior: 'opposite'
        };
      case 'SPREAD':
        return {
          usesPairedProduct: true,
          autoPopulate: paperProduct.pairedProduct || false,
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

  // Helper to get auto-populated leg info based on a filled paper leg
  const getAutoPopulatedPaperLeg = (
    productCode: string,
    buySell: BuySell,
    quantity: number
  ) => {
    const rule = getPaperProductRule(productCode);
    const paperProduct = paperProducts.find(p => p.productCode === productCode);
    
    if (!paperProduct || !rule.autoPopulate) {
      return null;
    }
    
    const pairedProductCode = paperProducts.find(
      p => p.baseProduct === rule.autoPopulate
    )?.productCode || '';
    
    const populatedLeg = {
      productCode: pairedProductCode || productCode,
      buySell: rule.quantityBehavior === 'opposite' ? getOppositeBuySell(buySell) : buySell,
      quantity: rule.quantityBehavior === 'opposite' ? -quantity : quantity
    };

    return populatedLeg;
  };

  return {
    relationships,
    paperProducts,
    isLoading,
    error,
    getProductRule,
    getPaperProductRule,
    getOppositeBuySell,
    getAutoPopulatedLeg,
    getAutoPopulatedPaperLeg
  };
};
