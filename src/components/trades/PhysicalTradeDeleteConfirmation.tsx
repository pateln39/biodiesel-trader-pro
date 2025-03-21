
import React from 'react';
import DeleteConfirmationDialog from '@/components/common/DeleteConfirmationDialog';

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
    <DeleteConfirmationDialog
      isOpen={isOpen}
      isDeleting={isDeleting}
      itemName={tradeName}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
};

export default PhysicalTradeDeleteConfirmation;
