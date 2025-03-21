
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface PhysicalTradeDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  tradeName: string;
  isLegDelete?: boolean;
}

const PhysicalTradeDeleteDialog: React.FC<PhysicalTradeDeleteDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  tradeName,
  isLegDelete = false
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isDeleting && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isLegDelete ? "Delete Trade Leg" : "Delete Trade"}
          </DialogTitle>
          <DialogDescription>
            {isLegDelete 
              ? `Are you sure you want to delete the leg ${tradeName}?`
              : `Are you sure you want to delete the trade ${tradeName}?`
            } This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PhysicalTradeDeleteDialog;
