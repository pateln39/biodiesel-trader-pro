
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddNewItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (itemName: string) => Promise<void>;
  title: string;
  itemLabel: string;
  placeholder: string;
}

const AddNewItemDialog: React.FC<AddNewItemDialogProps> = ({
  isOpen,
  onClose,
  onAdd,
  title,
  itemLabel,
  placeholder
}) => {
  const [itemName, setItemName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!itemName.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onAdd(itemName.trim());
      setItemName('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleClose = () => {
    setItemName('');
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
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
