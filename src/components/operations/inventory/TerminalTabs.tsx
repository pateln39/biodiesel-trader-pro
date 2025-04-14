
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AddTerminalDialog from './AddTerminalDialog';
import { useTerminals } from '@/hooks/useTerminals';
import { cn } from '@/lib/utils';

interface TerminalTabsProps {
  activeTerminal: string;
  onTerminalChange: (terminalId: string) => void;
}

const TerminalTabs: React.FC<TerminalTabsProps> = ({
  activeTerminal,
  onTerminalChange,
}) => {
  const { terminals, addTerminal } = useTerminals();

  const handleAddTerminal = async (name: string, description?: string) => {
    const newTerminal = await addTerminal(name, description);
    onTerminalChange(newTerminal.id);
  };

  return (
    <div className="flex items-center space-x-2">
      <Tabs value={activeTerminal} onValueChange={onTerminalChange}>
        <TabsList className="bg-brand-navy/90">
          {terminals.map((terminal) => (
            <TabsTrigger
              key={terminal.id}
              value={terminal.id}
              className={cn(
                "data-[state=active]:bg-brand-lime/20",
                "data-[state=active]:text-brand-lime"
              )}
            >
              {terminal.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      
      <AddTerminalDialog onAddTerminal={handleAddTerminal}>
        <Button variant="outline" size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </AddTerminalDialog>
    </div>
  );
};

export default TerminalTabs;
