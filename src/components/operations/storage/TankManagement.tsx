
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Wrench } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import TankForm from './TankForm';
import { Tank } from '@/hooks/useTanks';
import { Terminal } from '@/hooks/useTerminals';
import { 
  cleanupOrphanedTankMovements, 
  initializeAssignmentSortOrder, 
  fixDuplicateSortOrders 
} from '@/utils/cleanupUtils';

interface TankManagementProps {
  selectedTerminalId?: string;
  terminals: Terminal[];
  isTankFormOpen: boolean;
  isNewTerminal: boolean;
  selectedTank?: Tank;
  onOpenChange: (open: boolean) => void;
  onFormSuccess: () => void;
  onAddTerminal: () => void;
  onAddTank: () => void;
}

/**
 * Component for tank management operations (add, edit, maintenance)
 */
const TankManagement: React.FC<TankManagementProps> = ({
  selectedTerminalId,
  terminals,
  isTankFormOpen,
  isNewTerminal,
  selectedTank,
  onOpenChange,
  onFormSuccess,
  onAddTerminal,
  onAddTank
}) => {
  const handleMaintenance = async () => {
    if (selectedTerminalId) {
      await cleanupOrphanedTankMovements(selectedTerminalId);
      await initializeAssignmentSortOrder(selectedTerminalId);
      await fixDuplicateSortOrders(selectedTerminalId);
      onFormSuccess();
    }
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="mr-2">
              <Wrench className="h-4 w-4 mr-1" />
              Maintenance
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleMaintenance}>
              <Wrench className="h-4 w-4 mr-2" />
              Cleanup Tank Data
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {selectedTerminalId && (
        <Button variant="outline" size="sm" onClick={onAddTank}>
          <Plus className="h-4 w-4 mr-1" />
          Add Tank
        </Button>
      )}
      
      <TankForm
        open={isTankFormOpen}
        onOpenChange={onOpenChange}
        onSuccess={onFormSuccess}
        terminal={terminals.find(t => t.id === selectedTerminalId)}
        tank={selectedTank}
        isNewTerminal={isNewTerminal}
      />
    </>
  );
};

export default TankManagement;
