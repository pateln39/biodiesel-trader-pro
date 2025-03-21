
import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface PhysicalTradeDeleteConfirmationProps {
  isOpen: boolean;
  isDeleting: boolean;
  tradeName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const PhysicalTradeDeleteConfirmation: React.FC<PhysicalTradeDeleteConfirmationProps> = ({
  isOpen,
  isDeleting,
  tradeName,
  onConfirm,
  onCancel,
}) => {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && !isDeleting && onCancel()}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Confirm Deletion</SheetTitle>
          <SheetDescription>
            Are you sure you want to delete trade <span className="font-semibold">{tradeName}</span>? 
            This action cannot be undone.
          </SheetDescription>
        </SheetHeader>
        <SheetFooter className="mt-6">
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
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
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default PhysicalTradeDeleteConfirmation;
