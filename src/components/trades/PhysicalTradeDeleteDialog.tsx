
import React from 'react';
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

interface PhysicalTradeDeleteDialogProps {
  showDeleteConfirmation: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmDelete: () => Promise<void>;
  isDeleting: boolean;
  tradeName: string;
  isLegDelete?: boolean;
}

const PhysicalTradeDeleteDialog: React.FC<PhysicalTradeDeleteDialogProps> = ({
  showDeleteConfirmation,
  onOpenChange,
  onConfirmDelete,
  isDeleting,
  tradeName,
  isLegDelete = false
}) => {
  return (
    <AlertDialog open={showDeleteConfirmation} onOpenChange={onOpenChange}>
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
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
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
  );
};

export default PhysicalTradeDeleteDialog;
