
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ProductLegend from '@/components/operations/inventory/ProductLegend';
import TerminalTabs from '@/components/operations/inventory/TerminalTabs';
import TerminalTanks from '@/components/operations/inventory/TerminalTanks';
import { useTerminals } from '@/hooks/useTerminals';
import { useTankMovements } from '@/hooks/useTankMovements';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Filter, Thermometer, Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useInventoryState } from '@/hooks/useInventoryState';
import EditableField from '@/components/operations/inventory/EditableField';
import EditableNumberField from '@/components/operations/inventory/EditableNumberField';
import EditableDropdownField from '@/components/operations/inventory/EditableDropdownField';
import ProductToken from '@/components/operations/inventory/ProductToken';

// Define sticky column widths for layout calculation
const stickyColumnWidths = {
  counterparty: 110,
  tradeRef: 80,
  bargeName: 90,
  movementDate: 75,
  nominationDate: 75,
  customs: 75,
  sustainability: 90,
  comments: 90,
  quantity: 70,
};

// Calculate total width of sticky columns for positioning
const totalStickyWidth = Object.values(stickyColumnWidths).reduce((sum, width) => sum + width, 0);

// Define summary column widths
const summaryColumnWidths = {
  totalMT: 80,
  totalM3: 80,
  t1Balance: 80,
  t2Balance: 80,
  currentStock: 100,
  currentUllage: 100,
};

// Truncated header names to save space
const truncatedHeaders = {
  counterparty: "Counterparty",
  tradeRef: "Trade Ref",
  bargeName: "Barge",
  movementDate: "Move Date",
  nominationDate: "Nom. Valid",
  customs: "Customs",
  sustainability: "Sustain.",
  comments: "Comments",
  quantity: "Qty (MT)",
  // Add new header names
  totalMT: "Total (MT)",
  totalM3: "Total (M³)",
  t1Balance: "T1",
  t2Balance: "T2",
  currentStock: "Current Stock",
  currentUllage: "Current Ullage",
};

// Helper component for truncated text with tooltip
const TruncatedCell = ({ text, width, className = "" }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <div 
          className={cn(
            "truncate max-w-full", 
            className
          )} 
          style={{ width: `${width}px` }}
        >
          {text}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="max-w-xs break-words">{text}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const InventoryPage = () => {
  const { terminals, tanks } = useTerminals();
  const [activeTerminalId, setActiveTerminalId] = useState<string>('');

  // Set first terminal as active once loaded
  useEffect(() => {
    if (terminals.length > 0 && !activeTerminalId) {
      setActiveTerminalId(terminals[0]?.id || '');
    }
  }, [terminals, activeTerminalId]);

  const {
    movements,
    tankMovements,
    loading: movementsLoading
  } = useTankMovements(activeTerminalId);

  const {
    rowTotals,
    productOptions,
    heatingOptions,
    PRODUCT_COLORS,
    updateMovementQuantity,
    updateMovementComments,
    updateTankProduct,
    updateTankSpec,
    updateTankHeating
  } = useInventoryState();
  
  // Get filtered tanks for the current terminal
  const terminalTanks = tanks.filter(tank => tank.terminal_id === activeTerminalId);
  
  // If no data is loaded yet, show loading state
  if (!activeTerminalId || terminals.length === 0) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Loading terminals and inventory data...</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
        </div>
        
        {/* Product legend at the top */}
        <ProductLegend />
        
        {/* Terminal selection tabs */}
        <TerminalTabs
          activeTerminal={activeTerminalId}
          onTerminalChange={setActiveTerminalId}
        />
        
        {/* Integrated Inventory Movements Table with Tank Details */}
        <Card className="border-r-[3px] border-brand-lime/60 bg-gradient-to-br from-brand-navy/75 to-brand-navy/90">
          <CardHeader>
            <CardTitle>Inventory Movements</CardTitle>
            <CardDescription className="flex justify-between items-center">
              <span>Terminal inventory movements and tank levels</span>
              <TerminalTanks terminalId={activeTerminalId} />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative border rounded-md overflow-hidden">
              {/* For now, render a simplified version to avoid errors */}
              <div className="flex flex-col items-center justify-center p-8">
                <h3 className="text-xl font-semibold mb-4">Inventory Management</h3>
                <p className="text-center max-w-lg mb-6">
                  This panel displays inventory movements and tank levels. 
                  Each terminal can have multiple tanks, and you can track movements between tanks.
                </p>
                <div className="grid grid-cols-3 gap-4 w-full max-w-3xl">
                  {terminalTanks.map((tank) => (
                    <div key={tank.id} className="bg-brand-navy/50 p-4 rounded-lg border border-white/10">
                      <h4 className="font-medium">Tank {tank.tank_number}</h4>
                      <p>Product: {tank.current_product}</p>
                      <p>Capacity: {tank.capacity_mt} MT</p>
                      <p>Capacity: {tank.capacity_m3} M³</p>
                      <p>Heating: {tank.is_heating_enabled ? 'Enabled' : 'Disabled'}</p>
                      <p>Spec: {tank.spec || 'N/A'}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default InventoryPage;
