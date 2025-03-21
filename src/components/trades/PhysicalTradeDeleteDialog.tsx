
import React, { useEffect } from 'react';
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
import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface PhysicalTradeDeleteDialogProps {
  showDeleteConfirmation: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmDelete: () => Promise<void>;
  onCancelDelete: () => void;
  isDeleting: boolean;
  tradeName: string;
  isLegDelete?: boolean;
  deletionProgress?: number;
}

const PhysicalTradeDeleteDialog: React.FC<PhysicalTradeDeleteDialogProps> = ({
  showDeleteConfirmation,
  onOpenChange,
  onConfirmDelete,
  onCancelDelete,
  isDeleting,
  tradeName,
  isLegDelete = false,
  deletionProgress = 0
}) => {
  // Log dialog state changes for debugging
  useEffect(() => {
    console.log(`[PHYSICAL DELETE DIALOG] Dialog visible: ${showDeleteConfirmation}, isDeleting: ${isDeleting}`);
  }, [showDeleteConfirmation, isDeleting]);

  // Handle dialog state changes to ensure proper behavior
  const handleOpenChange = (isOpen: boolean) => {
    console.log(`[PHYSICAL DELETE DIALOG] Dialog open state change: ${isOpen}, isDeleting: ${isDeleting}`);
    if (!isOpen && !isDeleting) {
      // Only invoke cancel if we're closing and not in the process of deleting
      onCancelDelete();
    }
    // Always inform parent of open state changes
    onOpenChange(isOpen);
  };

  return (
    <>
      {isDeleting && (
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-1">
            Deleting {isLegDelete ? 'trade leg' : 'trade'}... Please wait
          </p>
          <Progress value={deletionProgress} className="h-2" />
        </div>
      )}

      <AlertDialog open={showDeleteConfirmation} onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isLegDelete ? "Delete Trade Leg" : "Delete Trade"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isLegDelete 
                ? `Are you sure you want to delete the leg ${tradeName}? This action cannot be undone.`
                : `Are you sure you want to delete the trade ${tradeName}? This action cannot be undone.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCancelDelete} disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                onConfirmDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PhysicalTradeDeleteDialog;
