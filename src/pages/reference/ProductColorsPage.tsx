
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ProductToken from '@/components/operations/storage/ProductToken';
import { COLOR_OPTIONS } from '@/components/trades/ColorSelect';

interface Product {
  id: string;
  name: string;
  color_class: string;
}

const ProductColorsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('id, name, color_class')
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      setProducts(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateProductColor = async (productName: string, colorClass: string) => {
    try {
      const { error } = await supabase.rpc('update_product_color', {
        product_name: productName,
        color_class_value: colorClass
      });

      if (error) {
        throw error;
      }

      // Update local state
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.name === productName ? { ...product, color_class: colorClass } : product
        )
      );

      toast.success('Product color updated successfully');
    } catch (err) {
      console.error('Error updating product color:', err);
      toast.error('Failed to update product color');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Product Colors</h1>
          <Button onClick={() => fetchProducts()}>
            Refresh
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="bg-gradient-to-br from-brand-navy/75 via-brand-navy/60 to-brand-lime/25 border-r-[3px] border-brand-lime/30">
          <CardHeader>
            <CardTitle>Color Mappings</CardTitle>
            <CardDescription>
              Manage product color assignments for better visual distinction
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-6">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-brand-lime"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {products.map(product => (
                  <div 
                    key={product.id}
                    className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-2">
                      <ProductToken 
                        product={product.name} 
                        value={product.name} 
                        colorClass={product.color_class}
                        showTooltip={false}
                      />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {COLOR_OPTIONS.map(color => (
                        <button
                          key={color.name}
                          className={`w-5 h-5 rounded-full ${color.class} hover:ring-2 hover:ring-offset-1 ${
                            product.color_class === `${color.class} ${color.textClass}` 
                              ? 'ring-2 ring-offset-1 ring-blue-500' 
                              : ''
                          }`}
                          title={color.name}
                          onClick={() => updateProductColor(product.name, `${color.class} ${color.textClass}`)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ProductColorsPage;
