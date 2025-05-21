
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import ProductToken from '@/components/operations/storage/ProductToken';
import { useReferenceData } from '@/hooks/useReferenceData';
import ColorSelect from './ColorSelect';
import { Loader2 } from 'lucide-react';

interface ProductColorsManagementProps {
  open: boolean;
  onClose: () => void;
}

const ProductColorsManagement: React.FC<ProductColorsManagementProps> = ({ open, onClose }) => {
  const { productData, updateProductColor, isUpdatingProductColor } = useReferenceData();
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('');

  const handleEdit = (productName: string, currentColor?: string) => {
    setEditingProduct(productName);
    
    // Set a default color if none exists
    if (currentColor) {
      // Try to extract color name from the class string
      const colorMatch = currentColor.match(/bg-(\w+)-\d+/);
      if (colorMatch && colorMatch[1]) {
        // Capitalize the first letter
        setSelectedColor(colorMatch[1].charAt(0).toUpperCase() + colorMatch[1].slice(1));
      } else {
        setSelectedColor('Blue');
      }
    } else {
      setSelectedColor('Blue');
    }
  };

  const handleSave = (productName: string) => {
    updateProductColor(productName, selectedColor);
    setEditingProduct(null);
  };

  const handleCancel = () => {
    setEditingProduct(null);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Manage Product Colors</DialogTitle>
        </DialogHeader>
        
        <div className="overflow-auto max-h-[70vh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Current Display</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productData.map((product) => (
                <TableRow key={product.name}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>
                    <ProductToken 
                      product={product.name} 
                      value={product.name}
                      colorClass={product.color_class}
                      showTooltip={false} 
                    />
                  </TableCell>
                  <TableCell>
                    {editingProduct === product.name ? (
                      <div className="flex items-center space-x-2">
                        <ColorSelect value={selectedColor} onChange={setSelectedColor} />
                        <Button 
                          size="sm" 
                          onClick={() => handleSave(product.name)}
                          disabled={isUpdatingProductColor}
                        >
                          {isUpdatingProductColor ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                          Save
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={handleCancel}
                          disabled={isUpdatingProductColor}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEdit(product.name, product.color_class)}
                      >
                        Change Color
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductColorsManagement;
