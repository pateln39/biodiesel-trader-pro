
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';

interface AddNewItemDialogProps {
  title: string;
  description: string;
  itemLabel: string;
  onAddItem: (itemName: string) => Promise<void>;
  buttonLabel?: string;
}

const AddNewItemDialog: React.FC<AddNewItemDialogProps> = ({
  title,
  description,
  itemLabel,
  onAddItem,
  buttonLabel = "Add New"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onAddItem(itemName.trim());
      setIsOpen(false);
      setItemName('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className="whitespace-nowrap" 
        onClick={() => setIsOpen(true)}
      >
        <Plus className="w-4 h-4 mr-1" /> {buttonLabel}
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="item-name" className="text-right col-span-1">
                  {itemLabel}
                </label>
                <Input
                  id="item-name"
                  className="col-span-3"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !itemName.trim()}>
                {isSubmitting ? "Adding..." : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddNewItemDialog;
