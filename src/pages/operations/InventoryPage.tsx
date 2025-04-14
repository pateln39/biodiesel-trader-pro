import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Filter, Thermometer, Database, Plus, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import EditableField from '@/components/operations/inventory/EditableField';
import EditableNumberField from '@/components/operations/inventory/EditableNumberField';
import EditableDropdownField from '@/components/operations/inventory/EditableDropdownField';
import ProductToken from '@/components/operations/inventory/ProductToken';
import ProductLegend from '@/components/operations/inventory/ProductLegend';
import { TerminalSelector } from '@/components/operations/inventory/TerminalSelector';
import { useTerminals } from '@/hooks/useTerminals';
import { useTanks, Tank } from '@/hooks/useTanks';
import { Button } from '@/components/ui/button';
import { AddTankDialog } from '@/components/operations/inventory/AddTankDialog';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTankMovements, TankMovement } from '@/hooks/useTankMovements';
import Select from '@/components/ui/select';
import { SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

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
const TruncatedCell = ({ text, width, className = "" }: { text: string | number, width: number, className?: string }) => (
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

interface InventoryMovement {
  id: string;
  counterpartyName: string;
  tradeReference: string;
  bargeName: string;
  movementDate: Date;
  nominationValid: Date;
  customsStatus: string;
  sustainability: string;
  comments: string;
  quantity: number;
  buySell: string;
  product: string;
  tanks: Record<string, {
    productAtTimeOfMovement: string;
    quantity: number;
    balance: number;
    balanceM3: number;
  }>;
}

// Define product color mapping
const PRODUCT_COLORS: Record<string, string> = {
  "ULSFO": "bg-blue-500 text-white",
  "VLSFO": "bg-green-500 text-white",
  "MGO": "bg-amber-500 text-white",
  "LSMGO": "bg-orange-500 text-white",
  "HSFO": "bg-red-500 text-white",
  "Blend": "bg-purple-500 text-white",
  "IFO": "bg-teal-500 text-white",
  "": "bg-gray-500 text-white"
};

interface TerminalOption {
  label: string;
  value: string;
}

const InventoryPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedTerminalId, setSelectedTerminalId] = useState<string | undefined>(undefined);
  const [addTankDialogOpen, setAddTankDialogOpen] = useState(false);
  
  // Fetch all terminals
  const { 
    terminals, 
    isLoading: terminalsLoading, 
    addTerminal 
  } = useTerminals();

  // Set initial terminal when terminals load
  useEffect(() => {
    if (terminals.length > 0 && !selectedTerminalId) {
      setSelectedTerminalId(terminals[0].id);
    }
  }, [terminals, selectedTerminalId]);

  // Transform terminal names into options
  const terminalOptions: TerminalOption[] = terminals.map(terminal => ({
    label: terminal.name,
    value: terminal.id
  }));

  // Fetch tanks for selected terminal
  const { 
    tanks, 
    isLoading: tanksLoading, 
    addTank, 
    updateTank 
  } = useTanks(selectedTerminalId);

  // Fetch movements for selected terminal with dates
  const fetchTerminalMovements = async (): Promise<InventoryMovement[]> => {
    if (!selectedTerminalId) return [];

    try {
      const { data, error } = await supabase
        .from('movements')
        .select('*, trade_reference(counterparty)')
        .eq('terminal_id', selectedTerminalId)
        .order('inventory_movement_date', { ascending: true });
      
      if (error) throw error;
      
      if (!data?.length) return [];

      // Transform the data to match our InventoryMovement type
      const movements: InventoryMovement[] = data.map((m: any) => ({
        id: m.id,
        counterpartyName: m.counterparty || 'Unknown',
        tradeReference: m.trade_reference || '',
        bargeName: m.barge_name || '',
        movementDate: m.inventory_movement_date ? new Date(m.inventory_movement_date) : new Date(),
        nominationValid: m.nomination_valid ? new Date(m.nomination_valid) : new Date(),
        customsStatus: m.customs_status || 'T2',
        sustainability: m.sustainability || '',
        comments: m.comments || '',
        quantity: m.actual_quantity || m.scheduled_quantity || 0,
        buySell: m.buy_sell || 'buy',
        product: m.product || '',
        tanks: {} // Will be populated with tank movements
      }));

      return movements;
    } catch (error: any) {
      console.error('[INVENTORY] Error fetching terminal movements:', error);
      toast.error("Failed to load movements", { description: error.message });
      return [];
    }
  };

  const { 
    data: terminalMovements = [], 
    isLoading: movementsLoading,
    refetch: refetchMovements
  } = useQuery({
    queryKey: ['terminalMovements', selectedTerminalId],
    queryFn: fetchTerminalMovements,
    enabled: !!selectedTerminalId
  });

  // Fetch tank movements for all tanks in this terminal
  const fetchAllTankMovements = async (): Promise<Record<string, TankMovement[]>> => {
    if (!selectedTerminalId || !tanks.length) return {};

    try {
      const tankIds = tanks.map(tank => tank.id);
      
      const { data, error } = await supabase
        .from('tank_movements')
        .select('*')
        .in('tank_id', tankIds)
        .order('movement_date', { ascending: true });
      
      if (error) throw error;

      // Group by tank ID
      const movementsByTank: Record<string, TankMovement[]> = {};
      
      for (const tankId of tankIds) {
        movementsByTank[tankId] = [];
      }
      
      // Transform and group data
      if (data) {
        for (const movement of data) {
          const tankId = movement.tank_id;
          if (!movementsByTank[tankId]) {
            movementsByTank[tankId] = [];
          }
          
          movementsByTank[tankId].push({
            id: movement.id,
            movementId: movement.movement_id,
            tankId: movement.tank_id,
            quantityMt: Number(movement.quantity_mt),
            quantityM3: Number(movement.quantity_m3),
            balanceMt: Number(movement.balance_mt),
            balanceM3: Number(movement.balance_m3),
            productAtTime: movement.product_at_time,
            movementDate: new Date(movement.movement_date),
            createdAt: new Date(movement.created_at),
            updatedAt: new Date(movement.updated_at)
          });
        }
      }

      return movementsByTank;
    } catch (error: any) {
      console.error('[INVENTORY] Error fetching tank movements:', error);
      toast.error("Failed to load tank movements", { description: error.message });
      return {};
    }
  };

  const { 
    data: tankMovementsMap = {}, 
    isLoading: tankMovementsLoading,
    refetch: refetchTankMovements
  } = useQuery({
    queryKey: ['allTankMovements', selectedTerminalId, tanks.map(t => t.id).join('-')],
    queryFn: fetchAllTankMovements,
    enabled: !!selectedTerminalId && tanks.length > 0
  });

  // Add tank movement mutation
  const addTankMovementMutation = useMutation({
    mutationFn: async (newMovement: {
      movementId: string;
      tankId: string;
      quantityMt: number;
      productAtTime: string;
    }) => {
      // First, get the last movement for this tank to calculate balance
      const { data: lastMovements } = await supabase
        .from('tank_movements')
        .select('*')
        .eq('tank_id', newMovement.tankId)
        .order('movement_date', { ascending: false })
        .limit(1);
      
      const previousBalanceMt = lastMovements?.length 
        ? Number(lastMovements[0].balance_mt) 
        : 0;
      
      const previousBalanceM3 = lastMovements?.length 
        ? Number(lastMovements[0].balance_m3) 
        : 0;
      
      // Calculate new balance and m3 values
      const quantityM3 = newMovement.quantityMt * 1.1; // Simple conversion
      const newBalanceMt = previousBalanceMt + newMovement.quantityMt;
      const newBalanceM3 = previousBalanceM3 + quantityM3;
      
      // Get movement date from movements table
      const { data: movementData } = await supabase
        .from('movements')
        .select('inventory_movement_date')
        .eq('id', newMovement.movementId)
        .single();
      
      const movementDate = movementData?.inventory_movement_date 
        ? new Date(movementData.inventory_movement_date)
        : new Date();
      
      // Create the tank movement
      const { data, error } = await supabase
        .from('tank_movements')
        .insert({
          movement_id: newMovement.movementId,
          tank_id: newMovement.tankId,
          quantity_mt: newMovement.quantityMt,
          quantity_m3: quantityM3,
          balance_mt: newBalanceMt,
          balance_m3: newBalanceM3,
          product_at_time: newMovement.productAtTime,
          movement_date: movementDate.toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allTankMovements'] });
      toast.success("Tank movement added", {
        description: "Movement quantity has been assigned to tank"
      });
    },
    onError: (error: any) => {
      console.error('[INVENTORY] Error adding tank movement:', error);
      toast.error("Failed to add tank movement", { 
        description: error.message 
      });
    }
  });

  // Update tank movement mutation
  const updateTankMovementMutation = useMutation({
    mutationFn: async ({ 
      id, 
      tankId, 
      quantityMt 
    }: { 
      id: string; 
      tankId: string;
      quantityMt: number 
    }) => {
      // Get the current movement
      const { data: currentMovement } = await supabase
        .from('tank_movements')
        .select('*')
        .eq('id', id)
        .single();
      
      if (!currentMovement) {
        throw new Error('Movement not found');
      }
      
      // Calculate quantity difference
      const quantityDiff = quantityMt - Number(currentMovement.quantity_mt);
      const quantityM3Diff = quantityDiff * 1.1; // Simple conversion
      
      // Update this movement
      const { data, error } = await supabase
        .from('tank_movements')
        .update({
          quantity_mt: quantityMt,
          quantity_m3: quantityMt * 1.1,
          balance_mt: Number(currentMovement.balance_mt) + quantityDiff,
          balance_m3: Number(currentMovement.balance_m3) + quantityM3Diff
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update all subsequent movements' balances
      const { data: subsequentMovements } = await supabase
        .from('tank_movements')
        .select('*')
        .eq('tank_id', tankId)
        .gt('movement_date', currentMovement.movement_date)
        .order('movement_date', { ascending: true });
      
      if (subsequentMovements?.length) {
        for (const movement of subsequentMovements) {
          await supabase
            .from('tank_movements')
            .update({
              balance_mt: Number(movement.balance_mt) + quantityDiff,
              balance_m3: Number(movement.balance_m3) + quantityM3Diff
            })
            .eq('id', movement.id);
        }
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allTankMovements'] });
      toast.success("Tank movement updated", {
        description: "Movement quantity has been updated"
      });
    },
    onError: (error: any) => {
      console.error('[INVENTORY] Error updating tank movement:', error);
      toast.error("Failed to update tank movement", { 
        description: error.message 
      });
    }
  });

  // Create merged data for UI with both movements and their tank data
  const mergedMovements = React.useMemo(() => {
    return terminalMovements.map(movement => {
      // Find all tank movements for this movement
      const movementTanks: Record<string, {
        productAtTimeOfMovement: string;
        quantity: number;
        balance: number;
        balanceM3: number;
      }> = {};
      
      // Initialize with all tanks and zero values
      tanks.forEach(tank => {
        movementTanks[tank.id] = {
          productAtTimeOfMovement: tank.currentProduct,
          quantity: 0,
          balance: 0,
          balanceM3: 0
        };
      });
      
      // Find all tank movements for this movement ID
      for (const tankId in tankMovementsMap) {
        const tankMovement = tankMovementsMap[tankId].find(tm => tm.movementId === movement.id);
        if (tankMovement) {
          movementTanks[tankId] = {
            productAtTimeOfMovement: tankMovement.productAtTime,
            quantity: tankMovement.quantityMt,
            balance: tankMovement.balanceMt,
            balanceM3: tankMovement.balanceM3
          };
        }
      }
      
      return {
        ...movement,
        tanks: movementTanks
      };
    });
  }, [terminalMovements, tankMovementsMap, tanks]);

  // Calculate row totals (last 6 columns)
  const rowTotals = React.useMemo(() => {
    return mergedMovements.map(movement => {
      let totalMT = 0;
      let totalM3 = 0;
      let t1Balance = 0;
      let t2Balance = 0;
      
      // Sum up quantities across all tanks for this movement
      for (const tankId in movement.tanks) {
        const tankData = movement.tanks[tankId];
        totalMT += tankData.quantity;
        totalM3 += tankData.quantity * 1.1; // Simple conversion
        
        // Use the movement's customs status to allocate to T1/T2
        if (movement.customsStatus === 'T1') {
          t1Balance += tankData.quantity;
        } else {
          t2Balance += tankData.quantity;
        }
      }
      
      // Current stock is the sum of all balances across tanks
      const currentStock = Object.values(movement.tanks).reduce(
        (sum, tank) => sum + tank.balance, 0
      );
      
      // Calculate ullage (remaining capacity)
      const totalCapacity = tanks.reduce((sum, tank) => sum + tank.capacityMt, 0);
      const currentUllage = totalCapacity - currentStock;
      
      return {
        totalMT,
        totalM3: Math.round(totalM3),
        t1Balance,
        t2Balance,
        currentStock,
        currentUllage
      };
    });
  }, [mergedMovements, tanks]);

  // Get tank movements for a specific combination of tank and movement
  const getTankMovementId = (movementId: string, tankId: string): string | undefined => {
    const tankMovements = tankMovementsMap[tankId] || [];
    const tankMovement = tankMovements.find(tm => tm.movementId === movementId);
    return tankMovement?.id;
  };

  // Handlers
  const handleAddTank = (tankData: Omit<Tank, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (selectedTerminalId) {
      addTank(tankData);
    }
  };

  const handleUpdateTankProduct = (tankId: string, product: string) => {
    updateTank({ id: tankId, currentProduct: product });
  };

  const handleUpdateTankSpec = (tankId: string, spec: string) => {
    updateTank({ id: tankId, spec });
  };

  const handleUpdateTankHeating = (tankId: string, heatingEnabled: string) => {
    updateTank({ id: tankId, isHeatingEnabled: heatingEnabled === 'true' });
  };

  const handleUpdateTankNumber = (tankId: string, tankNumber: string) => {
    updateTank({ id: tankId, tankNumber });
  };

  const handleUpdateTankCapacity = (tankId: string, capacityMt: number) => {
    // Calculate M3 based on MT with a simple conversion
    const capacityM3 = capacityMt * 1.1;
    updateTank({ id: tankId, capacityMt, capacityM3 });
  };

  const handleUpdateMovementQuantity = (movementId: string, tankId: string, quantity: number) => {
    const tankMovementId = getTankMovementId(movementId, tankId);
    
    if (tankMovementId) {
      // Update existing tank movement
      updateTankMovementMutation.mutate({
        id: tankMovementId,
        tankId,
        quantityMt: quantity
      });
    } else {
      // Create new tank movement
      const movement = terminalMovements.find(m => m.id === movementId);
      if (movement) {
        const tank = tanks.find(t => t.id === tankId);
        if (tank) {
          addTankMovementMutation.mutate({
            movementId,
            tankId,
            quantityMt: quantity,
            productAtTime: tank.currentProduct
          });
        }
      }
    }
  };

  const handleUpdateMovementComments = async (movementId: string, comments: string) => {
    try {
      const { error } = await supabase
        .from('movements')
        .update({ comments })
        .eq('id', movementId);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['terminalMovements'] });
      toast.success("Comments updated", {
        description: "Movement comments have been updated"
      });
    } catch (error: any) {
      console.error('[INVENTORY] Error updating comments:', error);
      toast.error("Failed to update comments", { 
        description: error.message 
      });
    }
  };

  // Product options for dropdowns
  const productOptions = Object.keys(PRODUCT_COLORS).filter(p => p !== "");

  // Heating options
  const heatingOptions = [
    { value: "true", label: "Enabled" },
    { value: "false", label: "Disabled" }
  ];

  // Loading state
  const isLoading = terminalsLoading || tanksLoading || movementsLoading || tankMovementsLoading;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filter</span>
          </div>
        </div>
        
        {/* Product legend at the top */}
        <ProductLegend />
        
        {/* Terminal selector */}
        <div className="flex justify-between items-center">
          <Select
            value={selectedTerminalId}
            onValueChange={handleTerminalChange}
          >
            <SelectTrigger>
              <SelectValue>
                {terminalOptions.find(opt => opt.value === selectedTerminalId)?.label || 'Select Terminal'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {terminalOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedTerminalId && (
            <Button 
              variant="outline"
              onClick={() => setAddTankDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Tank
            </Button>
          )}
        </div>
        
        {/* Integrated Inventory Movements Table with Tank Details */}
        <Card className="border-r-[3px] border-brand-lime/60 bg-gradient-to-br from-brand-navy/75 to-brand-navy/90">
          <CardHeader>
            <CardTitle>Inventory Movements</CardTitle>
            <CardDescription>
              {selectedTerminalId && terminals.find(t => t.id === selectedTerminalId)?.name} Terminal Inventory
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <p className="text-muted-foreground">Loading inventory data...</p>
              </div>
            ) : (
              <div className="relative border rounded-md overflow-hidden">
                {/* Two-panel layout with fixed sticky columns and scrollable tank details */}
                <div className="flex">
                  {/* Fixed left panel for sticky columns - NOW WITH SCROLL AREA */}
                  <ScrollArea 
                    className="flex-shrink-0 z-30 border-r border-white/30" 
                    orientation="horizontal"
                    style={{ width: `${totalStickyWidth}px` }}
                  >
                    <div style={{ minWidth: `${totalStickyWidth}px` }}>
                      <Table>
                        {/* Sticky Column Headers - NOW ALIGNED WITH RIGHT PANEL */}
                        <TableHeader>
                          {/* Row 1: Product headers - empty for sticky columns */}
                          <TableRow className="bg-muted/50 border-b border-white/10 h-12">
                            <TableHead 
                              colSpan={9} 
                              className="bg-brand-navy text-[10px]"
                            ></TableHead>
                          </TableRow>
                          
                          {/* Row 2: Tank numbers - empty for sticky columns */}
                          <TableRow className="bg-muted/40 border-b border-white/10 h-10">
                            <TableHead 
                              colSpan={9} 
                              className="bg-brand-navy text-[10px]"
                            ></TableHead>
                          </TableRow>
                          
                          {/* Row 3: Tank capacity MT - empty for sticky columns */}
                          <TableRow className="bg-muted/40 border-b border-white/10 h-14">
                            <TableHead 
                              colSpan={9} 
                              className="bg-brand-navy text-[10px]"
                            ></TableHead>
                          </TableRow>
                          
                          {/* Row 4: Tank capacity M³ - empty for sticky columns */}
                          <TableRow className="bg-muted/40 border-b border-white/10 h-14">
                            <TableHead 
                              colSpan={9} 
                              className="bg-brand-navy text-[10px]"
                            ></TableHead>
                          </TableRow>
                          
                          {/* Row 5: Tank specs - empty for sticky columns */}
                          <TableRow className="bg-muted/40 border-b border-white/10 h-8">
                            <TableHead 
                              colSpan={9} 
                              className="bg-brand-navy text-[10px]"
                            ></TableHead>
                          </TableRow>
                          
                          {/* Row 6: Tank heating - empty for sticky columns */}
                          <TableRow className="bg-muted/40 border-b border-white/10 h-8">
                            <TableHead 
                              colSpan={9} 
                              className="bg-brand-navy text-[10px]"
                            ></TableHead>
                          </TableRow>
                          
                          {/* Row 7: Main column headers - ALIGNED WITH "Movement (MT)/Balance" */}
                          <TableRow className="bg-muted/50 border-b border-white/10 h-10">
                            <TableHead 
                              className={`w-[${stickyColumnWidths.counterparty}px] bg-brand-navy text-[10px]`}
                              style={{ width: `${stickyColumnWidths.counterparty}px` }}
                            >
                              <TruncatedCell 
                                text={truncatedHeaders.counterparty} 
                                width={stickyColumnWidths.counterparty - 8} 
                                className="text-[10px] font-medium"
                              />
                            </TableHead>
                            <TableHead 
                              className={`bg-brand-navy text-[10px]`}
                              style={{ width: `${stickyColumnWidths.tradeRef}px` }}
                            >
                              <TruncatedCell 
                                text={truncatedHeaders.tradeRef} 
                                width={stickyColumnWidths.tradeRef - 8} 
                                className="text-[10px] font-medium"
                              />
                            </TableHead>
                            <TableHead 
                              className={`bg-brand-navy text-[10px]`}
                              style={{ width: `${stickyColumnWidths.bargeName}px` }}
                            >
                              <TruncatedCell 
                                text={truncatedHeaders.bargeName} 
                                width={stickyColumnWidths.bargeName - 8} 
                                className="text-[10px] font-medium"
                              />
                            </TableHead>
                            <TableHead 
                              className={`bg-brand-navy text-[10px]`}
                              style={{ width: `${stickyColumnWidths.movementDate}px` }}
                            >
                              <TruncatedCell 
                                text={truncatedHeaders.movementDate} 
                                width={stickyColumnWidths.movementDate - 8} 
                                className="text-[10px] font-medium"
                              />
                            </TableHead>
                            <TableHead 
                              className={`bg-brand-navy text-[10px]`}
                              style={{ width: `${stickyColumnWidths.nominationDate}px` }}
                            >
                              <TruncatedCell 
                                text={truncatedHeaders.nominationDate} 
                                width={stickyColumnWidths.nominationDate - 8} 
                                className="text-[10px] font-medium"
                              />
                            </TableHead>
                            <TableHead 
                              className={`bg-brand-navy text-[10px]`}
                              style={{ width: `${stickyColumnWidths.customs}px` }}
                            >
                              <TruncatedCell 
                                text={truncatedHeaders.customs} 
                                width={stickyColumnWidths.customs - 8} 
                                className="text-[10px] font-medium"
                              />
                            </TableHead>
                            <TableHead 
                              className={`bg-brand-navy text-[10px]`}
                              style={{ width: `${stickyColumnWidths.sustainability}px` }}
                            >
                              <TruncatedCell 
                                text={truncatedHeaders.sustainability} 
                                width={stickyColumnWidths.sustainability - 8} 
                                className="text-[10px] font-medium"
                              />
                            </TableHead>
                            <TableHead 
                              className={`bg-brand-navy text-[10px]`}
                              style={{ width: `${stickyColumnWidths.comments}px` }}
                            >
                              <TruncatedCell 
                                text={truncatedHeaders.comments} 
                                width={stickyColumnWidths.comments - 8} 
                                className="text-[10px] font-medium"
                              />
                            </TableHead>
                            <TableHead 
                              className={`bg-brand-navy text-[10px] border-r border-white/30`}
                              style={{ width: `${stickyColumnWidths.quantity}px` }}
                            >
                              <TruncatedCell 
                                text={truncatedHeaders.quantity} 
                                width={stickyColumnWidths.quantity - 8} 
                                className="text-[10px] font-medium"
                              />
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        
                        <TableBody>
                          {mergedMovements.length > 0 ? (
                            mergedMovements.map((movement, index) => {
                              // Determine the background color for the row based on buy/sell
                              const bgColorClass = movement.buySell === "buy" 
                                ? "bg-green-900/10 hover:bg-green-900/20" 
                                : "bg-red-900/10 hover:bg-red-900/20";
                              
                              return (
                                <TableRow 
                                  key={`sticky-${movement.id}`} 
                                  className={cn("border-b border-white/5 h-10", bgColorClass)}
                                >
                                  <TableCell className="bg-brand-navy text-[10px] py-2">
                                    <TruncatedCell 
                                      text={movement.counterpartyName} 
                                      width={stickyColumnWidths.counterparty - 16} 
                                      className="font-medium text-[10px]"
                                    />
                                  </TableCell>
                                  <TableCell className="bg-brand-navy text-[10px] py-2">
                                    <TruncatedCell 
                                      text={movement.tradeReference} 
                                      width={stickyColumnWidths.tradeRef - 16} 
                                      className="text-[10px]"
                                    />
                                  </TableCell>
                                  <TableCell className="bg-brand-navy text-[10px] py-2">
                                    <TruncatedCell 
                                      text={movement.bargeName} 
                                      width={stickyColumnWidths.bargeName - 16} 
                                      className="text-[10px]"
                                    />
                                  </TableCell>
                                  <TableCell className="bg-brand-navy text-[10px] py-2">
                                    <TruncatedCell 
                                      text={format(movement.movementDate, 'dd/MM/yyyy')} 
                                      width={stickyColumnWidths.movementDate - 16} 
                                      className="text-[10px]"
                                    />
                                  </TableCell>
                                  <TableCell className="bg-brand-navy text-[10px] py-2">
                                    <TruncatedCell 
                                      text={format(movement.nominationValid, 'dd/MM/yyyy')} 
                                      width={stickyColumnWidths.nominationDate - 16} 
                                      className="text-[10px]"
                                    />
                                  </TableCell>
                                  <TableCell className="bg-brand-navy text-[10px] py-2">
                                    <span className={cn(
                                      "px-1 py-0.5 rounded-full text-[10px] font-medium truncate block",
                                      movement.customsStatus === "T1" 
                                        ? "bg-green-900/60 text-green-200" 
                                        : "bg-blue-900/60 text-blue-200"
                                    )} style={{ maxWidth: `${stickyColumnWidths.customs - 16}px` }}>
                                      {movement.customsStatus}
                                    </span>
                                  </TableCell>
                                  <TableCell className="bg-brand-navy text-[10px] py-2">
                                    <TruncatedCell 
                                      text={movement.sustainability} 
                                      width={stickyColumnWidths.sustainability - 16} 
                                      className="text-[10px]"
                                    />
                                  </TableCell>
                                  <TableCell className="bg-brand-navy text-[10px] py-2">
                                    {/* Make comments editable */}
                                    <EditableField
                                      initialValue={movement.comments}
                                      onSave={(value) => handleUpdateMovementComments(movement.id, value)}
                                      maxWidth={stickyColumnWidths.comments - 16}
                                      className="text-[10px]"
                                      placeholder="Add comments..."
                                    />
                                  </TableCell>
                                  <TableCell className="bg-brand-navy text-[10px] py-2 border-r border-white/30">
                                    <div className="flex justify-center">
                                      {rowTotals[index].totalMT !== movement.quantity && (
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <AlertCircle className="mr-1 h-3 w-3 text-yellow-400" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Total tank quantities don't match movement quantity</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      )}
                                      <ProductToken 
                                        product={movement.product}
                                        value={`${movement.buySell === "buy" ? "+" : "-"}${movement.quantity}`}
                                      />
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          ) : (
                            <TableRow>
                              <TableCell 
                                colSpan={9}
                                className="h-20 text-center text-muted-foreground bg-brand-navy"
                              >
                                No movements assigned to this terminal
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </ScrollArea>
                  
                  {/* Scrollable right panel for tank details */}
                  <div className="overflow-hidden flex-grow">
                    <ScrollArea className="h-[700px]" orientation="horizontal">
                      <div className="min-w-[1800px]"> {/* Increased minimum width to accommodate new columns */}
                        <Table>
                          <TableHeader>
                            {/* Tank Info Headers - Now with editable product selection */}
                            <TableRow className="bg-muted/50 border-b border-white/10 h-12">
                              {tanks.length > 0 ? (
                                <>
                                  {tanks.map((tank) => (
                                    <TableHead 
                                      key={`${tank.id}-header`}
                                      colSpan={3} 
                                      className={cn(
                                        "text-center border-r border-white/30 bg-gradient-to-br from-brand-navy/90 to-brand-navy/70 text-white font-bold text-[10px]"
                                      )}
                                    >
                                      <EditableDropdownField
                                        initialValue={tank.currentProduct}
                                        options={productOptions}
                                        onSave={(value) => handleUpdateTankProduct(tank.id, value)}
                                        className={cn(
                                          "text-[10px] font-bold text-center w-full",
                                          PRODUCT_COLORS[tank.currentProduct]?.split(' ')[0] // Extract just the background color
                                        )}
                                        truncate={false}
                                      />
                                    </TableHead>
                                  ))}
                                  
                                  {/* Add headers for the 6 new columns */}
                                  <TableHead 
                                    colSpan={1} 
                                    className="text-center border-r border-white/30 bg-gradient-to-br from-brand-navy/90 to-brand-navy/70 text-white font-bold text-[10px]"
                                  >
                                    <div className="text-[10px] font-bold text-center w-full">
                                      Summary
                                    </div>
                                  </TableHead>
                                  <TableHead 
                                    colSpan={5} 
                                    className="text-center border-r border-white/30 bg-gradient-to-br from-brand-navy/90 to-brand-navy/70 text-white font-bold text-[10px]"
                                  >
                                    <div className="text-[10px] font-bold text-center w-full">
                                      Balances
                                    </div>
                                  </TableHead>
                                </>
                              ) : (
                                <TableHead 
                                  colSpan={6} 
                                  className="text-center border-r border-white/30 bg-gradient-to-br from-brand-navy/90 to-brand-navy/70 text-white font-bold text-[10px]"
                                >
                                  <div className="text-[10px] font-bold text-center w-full">
                                    No tanks available - click "Add Tank" to create one
                                  </div>
                                </TableHead>
                              )}
                            </TableRow>
                            
                            {/* Tank Numbers */}
                            <TableRow className="bg-muted/40 border-b border-white/10 h-10">
                              {tanks.length > 0 ? (
                                <>
                                  {tanks.map((tank) => (
                                    <TableHead 
                                      key={`${tank.id}-tank-number`}
                                      colSpan={3} 
                                      className="text-center text-[10px] border-r border-white/30"
                                    >
                                      <EditableField
                                        initialValue={tank.tankNumber}
                                        onSave={(value) => handleUpdateTankNumber(tank.id, value)}
                                        className="text-[10px] text-center"
                                        placeholder="Tank number"
                                      />
                                    </TableHead>
                                  ))}
                                  
                                  {/* Blank cells for the 6 new columns */}
                                  <TableHead 
                                    colSpan={6} 
                                    className="text-center text-[10px] border-r border-white/30"
                                  ></TableHead>
                                </>
                              ) : (
                                <TableHead 
                                  colSpan={6} 
                                  className="text-center text-[10px] border-r border-white/30"
                                ></TableHead>
                              )}
                            </TableRow>
                            
                            {/* Capacity MT */}
                            <TableRow className="bg-muted/40 border-b border-white/10 h-14">
                              {tanks.length > 0 ? (
                                <>
                                  {tanks.map((tank) => {
                                    // Find the last movement for this tank to get current balance
                                    const tankMovements = tankMovementsMap[tank.id] || [];
                                    const lastMovement = tankMovements.length > 0 
                                      ? tankMovements[tankMovements.length - 1] 
                                      : null;
                                    
                                    const currentBalance = lastMovement?.balanceMt || 0;
                                    const fillPercentage = (currentBalance / tank.capacityMt) * 100;
                                    
                                    return (
                                      <TableHead 
                                        key={`${tank.id}-capacity`}
                                        colSpan={3} 
                                        className="text-[10px] border-r border-white/30"
                                      >
                                        <div className="flex justify-between items-center px-2">
                                          <span>Capacity: 
                                            <EditableNumberField
                                              initialValue={tank.capacityMt}
                                              onSave={(value) => handleUpdateTankCapacity(tank.id, value)}
                                              className="text-[10px] ml-1 inline-block"
                                              placeholder="Capacity"
                                              prefix=""
                                            /> MT
                                          </span>
                                          <Database className="h-3 w-3 text-brand-lime/70" />
                                        </div>
                                        <div className="w-full bg-gray-700 rounded-full h-2 mt-1 mx-2">
                                          <div 
                                            className="bg-brand-lime h-2 rounded-full" 
                                            style={{ 
                                              width: `${Math.min(fillPercentage, 100)}%` 
                                            }}
                                          ></div>
                                        </div>
                                        <div className="flex justify-between px-2 mt-1">
                                          <span className="text-[9px] text-muted-foreground">
                                            {currentBalance} MT
                                          </span>
                                          <span className="text-[9px] text-muted-foreground">
                                            {Math.round(fillPercentage)}%
                                          </span>
                                        </div>
                                      </TableHead>
                                    );
                                  })}
                                  
                                  {/* Summary row data */}
                                  <TableHead 
                                    colSpan={6} 
                                    className="text-[10px] border-r border-white/30"
                                  >
                                    <div className="flex items-center h-full px-2">
                                      <span>Total Capacity: {tanks.reduce((sum, tank) => sum + tank.capacityMt, 0)} MT</span>
                                    </div>
                                  </TableHead>
                                </>
                              ) : (
                                <TableHead 
                                  colSpan={6} 
                                  className="text-[10px] border-r border-white/30"
                                >
                                  <div className="flex items-center h-full px-2">
                                    <span>Total Capacity: 0 MT</span>
                                  </div>
                                </TableHead>
                              )}
                            </TableRow>
                            
                            {/* Capacity M³ */}
                            <TableRow className="bg-muted/40 border-b border-white/10 h-14">
                              {tanks.length > 0 ? (
                                <>
                                  {tanks.map((tank) => {
                                    // Find the last movement for this tank to get current balance
                                    const tankMovements = tankMovementsMap[tank.id] || [];
                                    const lastMovement = tankMovements.length > 0 
                                      ? tankMovements[tankMovements.length - 1] 
                                      : null;
                                    
                                    const currentBalanceM3 = lastMovement?.balanceM3 || 0;
                                    const fillPercentageM3 = (currentBalanceM3 / tank.capacityM3) * 100;
                                    
                                    return (
                                      <TableHead 
                                        key={`${tank.id}-capacity-m3`}
                                        colSpan={3} 
                                        className="text-[10px] border-r border-white/30"
                                      >
                                        <div className="flex justify-between items-center px-2">
                                          <span>Capacity: {tank.capacityM3.toFixed(0)} M³</span>
                                        </div>
                                        <div className="w-full bg-gray-700 rounded-full h-2 mt-1 mx-2">
                                          <div 
                                            className="bg-brand-blue h-2 rounded-full" 
                                            style={{ 
                                              width: `${Math.min(fillPercentageM3, 100)}%` 
                                            }}
                                          ></div>
                                        </div>
                                        <div className="flex justify-between px-2 mt-1">
                                          <span className="text-[9px] text-muted-foreground">
                                            {currentBalanceM3.toFixed(0)} M³
                                          </span>
                                          <span className="text-[9px] text-muted-foreground">
                                            {Math.round(fillPercentageM3)}%
                                          </span>
                                        </div>
                                      </TableHead>
                                    );
                                  })}
                                  
                                  {/* M³ Summary row data */}
                                  <TableHead 
                                    colSpan={6} 
                                    className="text-[10px] border-r border-white/30"
                                  >
                                    <div className="flex items-center h-full px-2">
                                      <span>Total Capacity: {tanks.reduce((sum, tank) => sum + tank.capacityM3, 0).toFixed(0)} M³</span>
                                    </div>
                                  </TableHead>
                                </>
                              ) : (
                                <TableHead 
                                  colSpan={6} 
                                  className="text-[10px] border-r border-white/30"
                                >
                                  <div className="flex items-center h-full px-2">
                                    <span>Total Capacity: 0 M³</span>
                                  </div>
                                </TableHead>
                              )}
                            </TableRow>
                            
                            {/* Spec - now editable */}
                            <TableRow className="bg-muted/40 border-b border-white/10 h-8">
                              {tanks.length > 0 ? (
                                <>
                                  {tanks.map((tank) => (
                                    <TableHead 
                                      key={`${tank.id}-spec`}
                                      colSpan={3} 
                                      className="text-[10px] border-r border-white/30"
                                    >
                                      <div className="flex justify-between px-2">
                                        <span className="text-muted-foreground">Spec:</span>
                                        <EditableField
                                          initialValue={tank.spec || ''}
                                          onSave={(value) => handleUpdateTankSpec(tank.id, value)}
                                          className="text-[10px]"
                                          maxWidth={100}
                                          placeholder="Add spec..."
                                        />
                                      </div>
                                    </TableHead>
                                  ))}
                                  
                                  {/* Blank cells for the 6 new columns */}
                                  <TableHead 
                                    colSpan={6} 
                                    className="text-[10px] border-r border-white/30"
                                  ></TableHead>
                                </>
                              ) : (
                                <TableHead 
                                  colSpan={6} 
                                  className="text-[10px] border-r border-white/30"
                                ></TableHead>
                              )}
                            </TableRow>
                            
                            {/* Heating - now editable as dropdown */}
                            <TableRow className="bg-muted/40 border-b border-white/10 h-8">
                              {tanks.length > 0 ? (
                                <>
                                  {tanks.map((tank) => (
                                    <TableHead 
                                      key={`${tank.id}-heating`}
                                      colSpan={3} 
                                      className="text-[10px] border-r border-white/30"
                                    >
                                      <div className="flex justify-between px-2">
                                        <span className="text-muted-foreground">Heating:</span>
                                        <div className="flex items-center">
                                          <Thermometer className="h-3 w-3 mr-1 text-red-400" />
                                          <EditableDropdownField
                                            initialValue={tank.isHeatingEnabled ? "true" : "false"}
                                            options={heatingOptions.map(o => o.value)}
                                            optionLabels={heatingOptions.map(o => o.label)}
                                            onSave={(value) => handleUpdateTankHeating(tank.id, value)}
                                            className="text-[10px]"
                                            truncate={false}
                                          />
                                        </div>
                                      </div>
                                    </TableHead>
                                  ))}
                                  
                                  {/* Blank cells for the 6 new columns */}
                                  <TableHead 
                                    colSpan={6} 
                                    className="text-[10px] border-r border-white/30"
                                  ></TableHead>
                                </>
                              ) : (
                                <TableHead 
                                  colSpan={6} 
                                  className="text-[10px] border-r border-white/30"
                                ></TableHead>
                              )}
                            </TableRow>
                            
                            {/* Column headers for tank details and new summary columns */}
                            <TableRow className="bg-muted/50 border-b border-white/10 h-10">
                              {tanks.length > 0 ? (
                                <>
                                  {tanks.map((tank) => (
                                    <React.Fragment key={tank.id}>
                                      <TableHead className="text-center text-[10px]">
                                        <TruncatedCell
                                          text="Movement (MT)"
                                          width={65}
                                          className="text-[10px] text-center mx-auto"
                                        />
                                      </TableHead>
                                      <TableHead className="text-center text-[10px]">
                                        <TruncatedCell
                                          text="Movement (M³)"
                                          width={65}
                                          className="text-[10px] text-center mx-auto"
                                        />
                                      </TableHead>
                                      <TableHead className="text-center text-[10px] bg-brand-navy border-r border-white/30">Balance</TableHead>
                                    </React.Fragment>
                                  ))}
                                  
                                  {/* Headers for the 6 new columns */}
                                  <TableHead className="text-center text-[10px]" style={{ width: `${summaryColumnWidths.totalMT}px` }}>
                                    <TruncatedCell
                                      text={truncatedHeaders.totalMT}
                                      width={summaryColumnWidths.totalMT - 8}
                                      className="text-[10px] text-center mx-auto"
                                    />
                                  </TableHead>
                                  <TableHead className="text-center text-[10px]" style={{ width: `${summaryColumnWidths.totalM3}px` }}>
                                    <TruncatedCell
                                      text={truncatedHeaders.totalM3}
                                      width={summaryColumnWidths.totalM3 - 8}
                                      className="text-[10px] text-center mx-auto"
                                    />
                                  </TableHead>
                                  <TableHead className="text-center text-[10px]" style={{ width: `${summaryColumnWidths.t1Balance}px` }}>
                                    <TruncatedCell
                                      text={truncatedHeaders.t1Balance}
                                      width={summaryColumnWidths.t1Balance - 8}
                                      className="text-[10px] text-center mx-auto"
                                    />
                                  </TableHead>
                                  <TableHead className="text-center text-[10px]" style={{ width: `${summaryColumnWidths.t2Balance}px` }}>
                                    <TruncatedCell
                                      text={truncatedHeaders.t2Balance}
                                      width={summaryColumnWidths.t2Balance - 8}
                                      className="text-[10px] text-center mx-auto"
                                    />
                                  </TableHead>
                                  <TableHead className="text-center text-[10px]" style={{ width: `${summaryColumnWidths.currentStock}px` }}>
                                    <TruncatedCell
                                      text={truncatedHeaders.currentStock}
                                      width={summaryColumnWidths.currentStock - 8}
                                      className="text-[10px] text-center mx-auto"
                                    />
                                  </TableHead>
                                  <TableHead className="text-center text-[10px] border-r border-white/30" style={{ width: `${summaryColumnWidths.currentUllage}px` }}>
                                    <TruncatedCell
                                      text={truncatedHeaders.currentUllage}
                                      width={summaryColumnWidths.currentUllage - 8}
                                      className="text-[10px] text-center mx-auto"
                                    />
                                  </TableHead>
                                </>
                              ) : (
                                <TableHead 
                                  colSpan={6} 
                                  className="text-center text-[10px] border-r border-white/30"
                                >
                                  <div className="text-[10px] text-center mx-auto">
                                    No tank data available
                                  </div>
                                </TableHead>
                              )}
                            </TableRow>
                          </TableHeader>
                          
                          <TableBody>
                            {mergedMovements.length > 0 ? (
                              mergedMovements.map((movement, index) => {
                                // Determine the background color for the row based on buy/sell
                                const bgColorClass = movement.buySell === "buy" 
                                  ? "bg-green-900/10 hover:bg-green-900/20" 
                                  : "bg-red-900/10 hover:bg-red-900/20";
                                
                                // Get the row totals for this movement
                                const totals = rowTotals[index];
                                
                                return (
                                  <TableRow 
                                    key={`scroll-${movement.id}`} 
                                    className={cn("border-b border-white/5 h-10", bgColorClass)}
                                  >
                                    {/* Tank movement and balance columns */}
                                    {tanks.map((tank) => {
                                      const tankData = movement.tanks[tank.id] || {
                                        productAtTimeOfMovement: tank.currentProduct,
                                        quantity: 0,
                                        balance: 0,
                                        balanceM3: 0
                                      };
                                      
                                      return (
                                        <React.Fragment key={`${movement.id}-${tank.id}`}>
                                          <TableCell className="text-center text-[10px] py-2">
                                            {/* Make quantity editable with product token */}
                                            <EditableNumberField
                                              initialValue={tankData.quantity}
                                              onSave={(value) => handleUpdateMovementQuantity(movement.id, tank.id, value)}
                                              product={tankData.productAtTimeOfMovement}
                                              placeholder="0"
                                            />
                                          </TableCell>
                                          <TableCell className="text-center text-[10px] py-2">
                                            <ProductToken 
                                              product={tankData.productAtTimeOfMovement}
                                              value={Math.round(tankData.quantity * 1.1)}
                                              showTooltip={true}
                                            />
                                          </TableCell>
                                          <TableCell className="text-center text-[10px] py-2 bg-brand-navy border-r border-white/30">
                                            {tankData.balance || 0}
                                          </TableCell>
                                        </React.Fragment>
                                      );
                                    })}
                                    
                                    {/* New summary columns */}
                                    <TableCell className="text-center text-[10px] py-2">
                                      {totals.totalMT !== 0 ? (
                                        <ProductToken 
                                          product={movement.product}
                                          value={totals.totalMT}
                                          showTooltip={totals.totalMT !== movement.quantity}
                                          tooltipText={`Expected: ${movement.quantity} MT`}
                                        />
                                      ) : "-"}
                                    </TableCell>
                                    <TableCell className="text-center text-[10px] py-2">
                                      {totals.totalM3 !== 0 ? (
                                        <ProductToken 
                                          product={movement.product}
                                          value={totals.totalM3}
                                        />
                                      ) : "-"}
                                    </TableCell>
                                    <TableCell className="text-center text-[10px] py-2 font-medium text-green-400">
                                      {totals.t1Balance !== 0 ? totals.t1Balance : "-"}
                                    </TableCell>
                                    <TableCell className="text-center text-[10px] py-2 font-medium text-blue-400">
                                      {totals.t2Balance !== 0 ? totals.t2Balance : "-"}
                                    </TableCell>
                                    <TableCell className="text-center text-[10px] py-2 font-medium">
                                      {totals.currentStock}
                                    </TableCell>
                                    <TableCell className="text-center text-[10px] py-2 font-medium border-r border-white/30">
                                      {totals.currentUllage}
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            ) : (
                              <TableRow>
                                <TableCell 
                                  colSpan={tanks.length * 3 + 6}
                                  className="h-20 text-center text-muted-foreground"
                                >
                                  No movements assigned to this terminal
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Add Tank Dialog */}
      <AddTankDialog
        open={addTankDialogOpen}
        onOpenChange={setAddTankDialogOpen}
        onAddTank={handleAddTank}
        terminalId={selectedTerminalId || ''}
        productOptions={productOptions}
      />
    </Layout>
  );
};

export default InventoryPage;
