
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Waves,
  Package,
  PlusSquare,
} from 'lucide-react';

export interface StorageActionButtonsProps {
  onPumpOverClick: () => void;
  onStockReconciliationClick: () => void;
  onAddTankClick: () => void;
}

const StorageActionButtons = ({
  onPumpOverClick,
  onStockReconciliationClick,
  onAddTankClick
}: StorageActionButtonsProps) => {
  return (
    <div className="flex items-center space-x-2">
      <Button
        size="sm"
        variant="outline"
        className="flex items-center"
        onClick={onPumpOverClick}
      >
        <Waves className="mr-1 h-4 w-4" />
        <span>Pump Over</span>
      </Button>
      
      <Button
        size="sm"
        variant="outline"
        className="flex items-center"
        onClick={onStockReconciliationClick}
      >
        <Package className="mr-1 h-4 w-4" />
        <span>Stock Reconciliation</span>
      </Button>
      
      <Button
        size="sm"
        variant="outline"
        className="flex items-center"
        onClick={onAddTankClick}
      >
        <PlusSquare className="mr-1 h-4 w-4" />
        <span>Add Tank</span>
      </Button>
    </div>
  );
};

export default StorageActionButtons;
