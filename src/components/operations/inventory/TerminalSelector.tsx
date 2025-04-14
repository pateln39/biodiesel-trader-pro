
import React from 'react';
import { Plus } from 'lucide-react';
import {
  Tabs,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AddTerminalDialog } from './AddTerminalDialog';
import { Terminal } from '@/hooks/useTerminals';

interface TerminalSelectorProps {
  terminals: Terminal[];
  selectedTerminalId: string | undefined;
  onTerminalChange: (terminalId: string) => void;
  onAddTerminal: (data: { name: string; description?: string }) => void;
}

export function TerminalSelector({
  terminals,
  selectedTerminalId,
  onTerminalChange,
  onAddTerminal,
}: TerminalSelectorProps) {
  const [addTerminalDialogOpen, setAddTerminalDialogOpen] = React.useState(false);

  return (
    <div className="flex items-center space-x-2">
      <Tabs 
        value={selectedTerminalId} 
        onValueChange={onTerminalChange}
        className="mr-2"
      >
        <TabsList>
          {terminals.map((terminal) => (
            <TabsTrigger key={terminal.id} value={terminal.id}>
              {terminal.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      
      <Button 
        variant="outline" 
        size="sm" 
        className="h-9"
        onClick={() => setAddTerminalDialogOpen(true)}
      >
        <Plus className="h-4 w-4 mr-1" /> Add Terminal
      </Button>

      <AddTerminalDialog
        open={addTerminalDialogOpen}
        onOpenChange={setAddTerminalDialogOpen}
        onAddTerminal={onAddTerminal}
      />
    </div>
  );
}
