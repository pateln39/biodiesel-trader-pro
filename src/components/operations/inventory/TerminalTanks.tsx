
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AddTankDialog from './AddTankDialog';
import { useTerminals, Tank } from '@/hooks/useTerminals';

interface TerminalTanksProps {
  terminalId: string;
  onTanksChange?: () => void;
}

const TerminalTanks: React.FC<TerminalTanksProps> = ({
  terminalId,
  onTanksChange
}) => {
  const { tanks, addTank } = useTerminals();

  const terminalTanks = tanks.filter(tank => tank.terminal_id === terminalId);

  const handleAddTank = async (tankData: Omit<Tank, 'id' | 'terminal_id'>) => {
    await addTank(terminalId, {
      ...tankData,
      display_order: terminalTanks.length + 1
    });
    if (onTanksChange) {
      onTanksChange();
    }
  };

  return (
    <div className="flex justify-end mb-4">
      <AddTankDialog onAddTank={handleAddTank}>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Tank
        </Button>
      </AddTankDialog>
    </div>
  );
};

export default TerminalTanks;
