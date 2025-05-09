
import React from 'react';
import { Button } from '@/components/ui/button';
import { Package, Waves, Plus } from 'lucide-react';

interface StorageActionButtonsProps {
  onStockReconciliationClick: () => void;
  onPumpOverClick: () => void;
  onAddTankClick: () => void;
}

const StorageActionButtons: React.FC<StorageActionButtonsProps> = ({
  onStockReconciliationClick,
  onPumpOverClick,
  onAddTankClick
}) => {
  return (
    <div className="flex items-center space-x-2">
      <Button variant="outline" size="sm" onClick={onStockReconciliationClick}>
        <Package className="h-4 w-4 mr-1" />
        Stock Reconciliation
      </Button>
      <Button variant="outline" size="sm" onClick={onPumpOverClick}>
        <Waves className="h-4 w-4 mr-1" />
        Internal Pump Over
      </Button>
      <Button variant="outline" size="sm" onClick={onAddTankClick}>
        <Plus className="h-4 w-4 mr-1" />
        Add Tank
      </Button>
    </div>
  );
};

export default StorageActionButtons;
