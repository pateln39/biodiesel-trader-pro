
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Panel - Tank Status */}
              <div className="bg-brand-navy/50 p-4 rounded-lg border border-white/10">
                <h3 className="text-lg font-semibold mb-4">Tank Status</h3>
                {terminalTanks.length > 0 ? (
                  <div className="space-y-4">
                    {terminalTanks.map((tank) => (
                      <div key={tank.id} className="bg-brand-navy/30 p-3 rounded border border-white/5">
                        <h4 className="font-medium">Tank {tank.tank_number}</h4>
                        <p className="text-sm">Product: {tank.current_product || 'Empty'}</p>
                        <p className="text-sm">Capacity (MT): {tank.capacity_mt}</p>
                        <p className="text-sm">Capacity (M³): {tank.capacity_m3}</p>
                        <p className="text-sm">Heating: {tank.is_heating_enabled ? 'Enabled' : 'Disabled'}</p>
                        <p className="text-sm">Spec: {tank.spec || 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">No tanks available</p>
                )}
              </div>

              {/* Center Panel - Movements */}
              <div className="lg:col-span-2 bg-brand-navy/50 p-4 rounded-lg border border-white/10">
                <h3 className="text-lg font-semibold mb-4">Movement History</h3>
                {movements && movements.length > 0 ? (
                  <div className="space-y-4">
                    {movements.map((movement) => (
                      <div key={movement.id} className="bg-brand-navy/30 p-3 rounded border border-white/5">
                        <p className="text-sm">Reference: {movement.reference_number}</p>
                        <p className="text-sm">Product: {movement.product}</p>
                        <p className="text-sm">Date: {movement.inventory_movement_date ? 
                          new Date(movement.inventory_movement_date).toLocaleDateString() : 'Not set'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">No movements available</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default InventoryPage;
