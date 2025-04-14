
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Terminal } from '@/hooks/useTerminals';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface TerminalTabsProps {
  terminals: Terminal[];
  selectedTerminalId: string | undefined;
  onTerminalChange: (terminalId: string) => void;
  onAddTerminal: () => void;
}

const TerminalTabs: React.FC<TerminalTabsProps> = ({
  terminals,
  selectedTerminalId,
  onTerminalChange,
  onAddTerminal
}) => {
  return (
    <div className="flex items-center space-x-4 mb-6">
      <Tabs value={selectedTerminalId} onValueChange={onTerminalChange}>
        <TabsList>
          {terminals.map((terminal) => (
            <TabsTrigger key={terminal.id} value={terminal.id}>
              {terminal.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Button variant="outline" size="sm" onClick={onAddTerminal}>
        <Plus className="h-4 w-4 mr-1" />
        Add Terminal
      </Button>
    </div>
  );
};

export default TerminalTabs;
