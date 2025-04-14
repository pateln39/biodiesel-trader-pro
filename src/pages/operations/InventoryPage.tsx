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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useMovementTanks, MovementTank } from '@/hooks/useMovementTanks';

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

const totalStickyWidth = Object.values(stickyColumnWidths).reduce((sum, width) => sum + width, 0);

const summaryColumnWidths = {
  totalMT: 80,
  totalM3: 80,
  t1Balance: 80,
  t2Balance: 80,
  currentStock: 100,
  currentUllage: 100,
};

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
  totalMT: "Total (MT)",
  totalM3: "Total (M³)",
  t1Balance: "T1",
  t2Balance: "T2",
  currentStock: "Current Stock",
  currentUllage: "Current Ullage",
};

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

const PRODUCT_COLORS: Record<string, string> = {
  "UCOME": "bg-blue-500 text-white",
  "RME": "bg-green-500 text-white",
  "FAME0": "bg-amber-500 text-white",
  "HVO": "bg-red-500 text-white",
  "RME DC": "bg-purple-500 text-white",
  "UCOME-5": "bg-teal-500 text-white",
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
  
  const { 
    terminals, 
    isLoading: terminalsLoading, 
    addTerminal 
  } = useTerminals();

  useEffect(() => {
    if (terminals.length > 0 && !selectedTerminalId) {
      setSelectedTerminalId(terminals[0].id);
    }
  }, [terminals, selectedTerminalId]);

  const terminalOptions: TerminalOption[] = terminals.map(terminal => ({
    label: terminal.name,
    value: terminal.id
  }));

  const { 
    tanks, 
    isLoading: tanksLoading, 
    addTank, 
    updateTank 
  } = useTanks(selectedTerminalId);

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

      const movementsByTank: Record<string, TankMovement[]> = {};
      
      for (const tankId of tankIds) {
        movementsByTank[tankId] = [];
      }
      
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

  const addTankMovementMutation = useMutation({
    mutationFn: async (newMovement: {
      movementId: string;
      tankId: string;
      quantityMt: number;
      productAtTime: string;
    }) => {
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
      
      const quantityM3 = newMovement.quantityMt * 1.1;
      const newBalanceMt = previousBalanceMt + newMovement.quantityMt;
      const newBalanceM3 = previousBalanceM3 + quantityM3;
      
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
          movement_date: new Date().toISOString()
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
      const { data: currentMovement } = await supabase
        .from('tank_movements')
        .select('*')
        .eq('id', id)
        .single();
      
      if (!currentMovement) {
        throw new Error('Movement not found');
      }
      
      const quantityDiff = quantityMt - Number(currentMovement.quantity_mt);
      const quantityM3Diff = quantityDiff * 1.1;
      
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

  const mergedMovements = React.useMemo(() => {
    return terminalMovements.map(movement => {
      const movementTanks: Record<string, {
        productAtTimeOfMovement: string;
        quantity: number;
        balance: number;
        balanceM3: number;
      }> = {};
      
      tanks.forEach(tank => {
        movementTanks[tank.id] = {
          productAtTimeOfMovement: tank.currentProduct,
          quantity: 0,
          balance: 0,
          balanceM3: 0
        };
      });
      
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

  const rowTotals = React.useMemo(() => {
    return mergedMovements.map(movement => {
      let totalMT = 0;
      let totalM3 = 0;
      let t1Balance = 0;
      let t2Balance = 0;
      
      for (const tankId in movement.tanks) {
        const tankData = movement.tanks[tankId];
        totalMT += tankData.quantity;
        totalM3 += tankData.quantity * 1.1;
        
        if (movement.customsStatus === 'T1') {
          t1Balance += tankData.quantity;
        } else {
          t2Balance += tankData.quantity;
        }
      }
      
      const currentStock = Object.values(movement.tanks).reduce(
        (sum, tank) => sum + tank.balance, 0
      );
      
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

  const getTankMovementId = (movementId: string, tankId: string): string | undefined => {
    const tankMovements = tankMovementsMap[tankId] || [];
    const tankMovement = tankMovements.find(tm => tm.movementId === movementId);
    return tankMovement?.id;
  };

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
    const capacityM3 = capacityMt * 1.1;
    updateTank({ id: tankId, capacityMt, capacityM3 });
  };

  const handleUpdateMovementQuantity = (movementId: string, tankId: string, quantity: number) => {
    const tankMovementId = getTankMovementId(movementId, tankId);
    
    if (tankMovementId) {
      updateTankMovementMutation.mutate({
        id: tankMovementId,
        tankId,
        quantityMt: quantity
      });
    } else {
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

  const productOptions = ["UCOME", "RME", "FAME0", "HVO", "RME DC", "UCOME-5"];
  
  const productOptionsForDropdown = productOptions.map(product => ({
    label: product,
    value: product
  }));

  const heatingOptions = [
    { value: "true", label: "Enabled" },
    { value: "false", label: "Disabled" }
  ];

  const heatingOptionsForDropdown = heatingOptions.map(option => ({
    label: option.label,
    value: option.value
  }));

  const isLoading = terminalsLoading || tanksLoading || movementsLoading || tankMovementsLoading;

  const handleTerminalChange = (terminalId: string) => {
    setSelectedTerminalId(terminalId);
  };

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
        
        <ProductLegend />
        
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
                <div className="flex">
                  <ScrollArea 
                    className="flex-shrink-0 z-30 border-r border-white/30" 
                    orientation="horizontal"
                    style={{ width: `${totalStickyWidth}px` }}
                  >
                    <div style={{ minWidth: `${totalStickyWidth}px` }}>
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50 border-b border-white/10 h-12">
                            <TableHead 
                              colSpan={9} 
                              className="bg-brand-navy text-[10px]"
                            ></TableHead>
                          </TableRow>
                          
                          <TableRow className="bg-muted/40 border-b border-white/10 h-10">
                            <TableHead 
                              colSpan={9} 
                              className="bg-brand-navy text-[10px]"
                            ></TableHead>
                          </TableRow>
                          
                          <TableRow className="bg-muted/40 border-b border-white/10 h-14">
                            <TableHead 
                              colSpan={9} 
                              className="bg-brand-navy text-[10px]"
                            ></TableHead>
                          </TableRow>
                          
                          <TableRow className="bg-muted/40 border-b border-white/10 h-14">
                            <TableHead 
                              colSpan={9} 
                              className="bg-brand-navy text-[10px]"
                            ></TableHead>
                          </TableRow>
                          
                          <TableRow className="bg-muted/40 border-b border-white/10 h-8">
                            <TableHead 
                              colSpan={9} 
                              className="bg-brand-navy text-[10px]"
                            ></TableHead>
                          </TableRow>
                          
                          <TableRow className="bg-muted/40 border-b border-white/10 h-8">
                            <TableHead 
                              colSpan={9} 
                              className="bg-brand-navy text-[10px]"
                            ></TableHead>
                          </TableRow>
                          
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
                                      text={format(movement.movementDate, 'dd/MM/yy')}
                                      width={stickyColumnWidths.movementDate - 16}
                                      className="text-[10px]"
                                    />
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          ) : (
                            <TableRow>
                              <TableCell colSpan={9} className="h-24 text-center">
                                No inventory movements found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <AddTankDialog 
          open={addTankDialogOpen} 
          onOpenChange={setAddTankDialogOpen}
          terminalId={selectedTerminalId}
          onSubmit={handleAddTank}
          productOptions={productOptionsForDropdown}
        />
      </div>
    </Layout>
  );
};

export default InventoryPage;
