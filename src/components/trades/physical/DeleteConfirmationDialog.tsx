
import React, { useEffect } from 'react';
import { Loader2, Trash2, X } from 'lucide-react';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from "@/lib/utils";

// Create a non-animated version of DialogContent
const NoAnimationDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { isProcessing?: boolean }
>(({ className, children, isProcessing, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay className="fixed inset-0 z-50 bg-black/80" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close 
        className={cn(
          "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          isProcessing ? "pointer-events-none opacity-30" : "opacity-70"
        )}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
NoAnimationDialogContent.displayName = "NoAnimationDialogContent";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemType: 'trade' | 'leg' | null;
  itemReference: string | null;
  isPerformingAction: boolean;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemType,
  itemReference,
  isPerformingAction,
}) => {
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (!isPerformingAction) {
        onClose();
      }
    };
  }, [isPerformingAction, onClose]);

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && !isPerformingAction) {
        // Only allow manual closing if we're not performing an action
        onClose();
      }
    }}>
      <NoAnimationDialogContent isProcessing={isPerformingAction}>
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {itemType === 'trade' ? 'trade' : 'trade leg'} <span className="font-medium">{itemReference}</span>?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-start gap-3">
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPerformingAction}
          >
            {isPerformingAction ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPerformingAction}
          >
            Cancel
          </Button>
        </DialogFooter>
      </NoAnimationDialogContent>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;
