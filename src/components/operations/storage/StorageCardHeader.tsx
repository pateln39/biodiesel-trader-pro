
import React from 'react';
import { CardTitle, CardDescription } from '@/components/ui/card';
import StorageActionButtons from '@/components/operations/storage/StorageActionButtons';
import { Terminal } from '@/hooks/useTerminals';

interface StorageCardHeaderProps {
  selectedTerminal: Terminal | undefined;
  selectedTerminalId: string | undefined;
  onStockReconciliationClick: () => void;
  onPumpOverClick: () => void;
  onAddTankClick: () => void;
}

const StorageCardHeader: React.FC<StorageCardHeaderProps> = ({
  selectedTerminal,
  selectedTerminalId,
  onStockReconciliationClick,
  onPumpOverClick,
  onAddTankClick
}) => {
  return (
    <>
      <CardTitle className="flex justify-between items-center">
        <span>Storage Movements</span>
        {selectedTerminalId && (
          <StorageActionButtons
            onStockReconciliationClick={onStockReconciliationClick}
            onPumpOverClick={onPumpOverClick}
            onAddTankClick={onAddTankClick}
          />
        )}
      </CardTitle>
      <CardDescription>
        Storage tank management for {selectedTerminal?.name || 'selected terminal'}
      </CardDescription>
    </>
  );
};

export default StorageCardHeader;
