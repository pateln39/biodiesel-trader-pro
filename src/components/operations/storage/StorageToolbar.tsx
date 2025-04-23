
import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Wrench, Filter } from 'lucide-react';
import ProductLegend from '@/components/operations/storage/ProductLegend';
import TerminalTabs from '@/components/operations/storage/TerminalTabs';

interface StorageToolbarProps {
  terminals: any[];
  selectedTerminalId?: string;
  onTerminalChange: (id?: string) => void;
  onAddTerminal: () => void;
  onMaintenance: () => Promise<void>;
  onAddTank: () => void;
}

const StorageToolbar: React.FC<StorageToolbarProps> = ({
  terminals,
  selectedTerminalId,
  onTerminalChange,
  onAddTerminal,
  onMaintenance,
  onAddTank
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle Alt+T and Alt+N keyboard shortcuts
    if (e.altKey) {
      if (e.key === 't') {
        e.preventDefault();
        onAddTank();
      } else if (e.key === 'n') {
        e.preventDefault();
        onAddTerminal();
      }
    }
  };

  return (
    <div className="space-y-6" onKeyDown={handleKeyDown}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Storage Management</h1>
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="mr-2">
                <Wrench className="h-4 w-4 mr-1" />
                Maintenance
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white">
              <DropdownMenuItem onClick={onMaintenance}>
                <Wrench className="h-4 w-4 mr-2" />
                Cleanup Tank Data
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Filter className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filter</span>
        </div>
      </div>
      <ProductLegend />
      <TerminalTabs
        terminals={terminals}
        selectedTerminalId={selectedTerminalId}
        onTerminalChange={onTerminalChange}
        onAddTerminal={onAddTerminal}
      />
      <div className="flex justify-end w-full">
        {selectedTerminalId && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onAddTank}
            title="Add Tank (Alt+T)"
          >
            Add Tank
          </Button>
        )}
      </div>
    </div>
  );
};

export default StorageToolbar;
