
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ColorSelect from './ColorSelect';
import { getSuggestedColor } from '@/utils/productColorUtils';

interface AddNewItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (itemName: string, colorName?: string) => Promise<void>;
  title: string;
  itemLabel: string;
  placeholder: string;
  showColorPicker?: boolean;
  existingItems?: string[];
}

const AddNewItemDialog: React.FC<AddNewItemDialogProps> = ({
  isOpen,
  onClose,
  onAdd,
  title,
  itemLabel,
  placeholder,
  showColorPicker = false,
  existingItems = []
}) => {
  const [itemName, setItemName] = useState('');
  const [colorName, setColorName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Set a default color suggestion when the dialog opens
  React.useEffect(() => {
    if (isOpen && showColorPicker) {
      setColorName(getSuggestedColor(existingItems));
    }
  }, [isOpen, showColorPicker, existingItems]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!itemName.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onAdd(itemName.trim(), showColorPicker ? colorName : undefined);
      setItemName('');
      if (showColorPicker) {
        setColorName('');
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleClose = () => {
    setItemName('');
    if (showColorPicker) {
      setColorName('');
    }
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="item-name" className="mb-2 block">
                {itemLabel}
              </Label>
              <Input
                id="item-name"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder={placeholder}
                autoFocus
                className="w-full"
              />
            </div>
            
            {showColorPicker && (
              <div>
                <Label htmlFor="color-name" className="mb-2 block">
                  Token Color
                </Label>
                <ColorSelect 
                  value={colorName} 
                  onChange={setColorName}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Choose a color for the product token that will appear throughout the app
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!itemName.trim() || isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddNewItemDialog;
