
import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';

interface PhysicalTradeDeleteDialogProps {
  showDeleteConfirmation: boolean;
  deleteMode: 'trade' | 'leg';
  deleteItemDetails: {
    id: string;
    reference: string;
    legNumber?: number;
  };
  isDeleting: boolean;
  deletionProgress: number;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onOpenChange: (open: boolean) => void;
}

const PhysicalTradeDeleteDialog: React.FC<PhysicalTradeDeleteDialogProps> = ({
  showDeleteConfirmation,
  deleteMode,
  deleteItemDetails,
  isDeleting,
  deletionProgress,
  onConfirmDelete,
  onCancelDelete,
  onOpenChange
}) => {
  // Log important state changes for debugging
  useEffect(() => {
    console.log(`[PHYSICAL DELETE DIALOG] Dialog visible: ${showDeleteConfirmation}, isDeleting: ${isDeleting}`);
  }, [showDeleteConfirmation, isDeleting]);

  // Handle Cancel button click in a safe way
  const handleCancel = (e: React.MouseEvent) => {
    // Stop propagation to prevent multiple handlers firing
    e.preventDefault();
    e.stopPropagation();
    console.log("[PHYSICAL DELETE DIALOG] Cancel button clicked directly");
    onCancelDelete();
  };

  // Separate handler for dialog open state changes to ensure proper behavior
  const handleOpenChange = (open: boolean) => {
    console.log(`[PHYSICAL DELETE DIALOG] Dialog open state change: ${open}, isDeleting: ${isDeleting}`);
    
    // If dialog is closing and we're not in the process of deleting, consider it a cancel
    if (!open && !isDeleting) {
      console.log("[PHYSICAL DELETE DIALOG] Dialog dismissed - treating as cancel");
      onCancelDelete();
    }
    
    // Always inform parent of state changes
    onOpenChange(open);
  };

  return (
    <>
      {isDeleting && (
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-1">
            Deleting physical {deleteMode}... Please wait
          </p>
          <Progress value={deletionProgress} className="h-2" />
        </div>
      )}
    
      <AlertDialog 
        open={showDeleteConfirmation}
        onOpenChange={handleOpenChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteMode === 'trade' ? (
                <>This will permanently delete the physical trade {deleteItemDetails.reference} from the database.</>
              ) : (
                <>This will permanently delete leg {deleteItemDetails.legNumber} of trade {deleteItemDetails.reference} from the database.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel} disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={onConfirmDelete} 
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</>
              ) : (
                <>Delete</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PhysicalTradeDeleteDialog;
