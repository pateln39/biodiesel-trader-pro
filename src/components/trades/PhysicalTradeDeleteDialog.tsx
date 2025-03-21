
import React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

interface PhysicalTradeDeleteDialogProps {
  showDeleteConfirmation: boolean;
  onOpenChange: (open: boolean) => void;
}

const PhysicalTradeDeleteDialog: React.FC<PhysicalTradeDeleteDialogProps> = ({
  showDeleteConfirmation,
  onOpenChange
}) => {
  return (
    <AlertDialog open={showDeleteConfirmation} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Feature Disabled</AlertDialogTitle>
          <AlertDialogDescription>
            The trade deletion feature has been disabled in this version.
          </AlertDialogDescription>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PhysicalTradeDeleteDialog;
