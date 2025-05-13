import React from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Thermometer, Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useInventoryState, PRODUCT_COLORS } from '@/hooks/useInventoryState';
import EditableField from '@/components/operations/storage/EditableField';
import EditableNumberField from '@/components/operations/storage/EditableNumberField';
import EditableDropdownField from '@/components/operations/storage/EditableDropdownField';
import ProductLegend from '@/components/operations/storage/ProductLegend';
import { useTerminals } from '@/hooks/useTerminals';
import { useTanks, Tank } from '@/hooks/useTanks';
import TerminalTabs from '@/components/operations/storage/TerminalTabs';
import TankForm from '@/components/operations/storage/TankForm';
import PumpOverFormDialog from '@/components/operations/storage/PumpOverFormDialog';
import StockReconciliationFormDialog from '@/components/operations/storage/StockReconciliationFormDialog';
import DeletePumpOverDialog from '@/components/operations/storage/DeletePumpOverDialog';
import DeleteStockReconciliationDialog from '@/components/operations/storage/DeleteStockReconciliationDialog';
import DeleteStorageMovementDialog from '@/components/operations/storage/DeleteStorageMovementDialog';
import { useTankCalculations } from '@/hooks/useTankCalculations';
import { Badge } from '@/components/ui/badge';
import SortableAssignmentList from '@/components/operations/storage/SortableAssignmentList';
import { TruncatedCell } from '@/components/operations/storage/TruncatedCell';
import StorageHeader from '@/components/operations/storage/StorageHeader';
import StorageCardHeader from '@/components/operations/storage/StorageCardHeader';

const stickyColumnWidths = {
  counterparty: 110,
  tradeRef: 80,
  bargeName: 90,
  bargeImo: 85,
  movementDate: 75,
  nominationDate: 75,
  customs: 75,
  sustainability: 90,
  comments: 100,
  quantity: 70,
  actions: 50,  // New column for actions
};

const totalStickyWidth = Object.values(stickyColumnWidths).reduce((sum, width) => sum + width, 0);

const summaryColumnWidths = {
  totalMT: 80,
  totalM3: 80,
  t1Balance: 80,
  t2Balance: 80,
  currentStock: 100,
  currentUllage: 100,
  difference: 100,
};

const truncatedHeaders = {
  counterparty: "Counterparty",
  tradeRef: "Trade Ref",
  bargeName: "Barge",
  bargeImo: "IMO",
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
  difference: "Total (MT) - Qty (MT)",
};

const StoragePage = () => {
  const [selectedTerminalId, setSelectedTerminalId] = React.useState<string>();
  const [isTankFormOpen, setIsTankFormOpen] = React.useState(false);
  const [isPumpOverFormOpen, setIsPumpOverFormOpen] = React.useState(false);
  const [isStockReconciliationFormOpen, setIsStockReconciliationFormOpen] = React.useState(false);
  const [isNewTerminal, setIsNewTerminal] = React.useState(false);
  const [selectedTank, setSelectedTank] = React.useState<Tank>();
  // Add state for pump over deletion
  const [pumpOverToDelete, setPumpOverToDelete] = React.useState<{
    assignmentId: string;
    movementId: string;
    quantity: number;
  } | null>(null);
  // Add state for stock reconciliation deletion
  const [stockReconciliationToDelete, setStockReconciliationToDelete] = React.useState<{
    assignmentId: string;
    movementId: string;
  } | null>(null);
  // Add state for storage movement deletion
  const [storageMovementToDelete, setStorageMovementToDelete] = React.useState<string | null>(null);

  const { terminals } = useTerminals();
  const { tanks, refetchTanks } = useTanks(selectedTerminalId);
  const { 
    movements,
    tankMovements,
    productOptions,
    heatingOptions,
    PRODUCT_COLORS,
    updateTankMovement,
    updateMovementQuantity,
    updateAssignmentComments,
    updateTankProduct,
    updateTankSpec,
    updateTankHeating,
    updateTankCapacity,
    updateTankNumber,
    createPumpOver,
    deletePumpOver,
    deleteStorageMovement,
    createStockReconciliation,
    deleteStockReconciliation,
  } = useInventoryState(selectedTerminalId);

  React.useEffect(() => {
    if (terminals.length > 0 && !selectedTerminalId) {
      setSelectedTerminalId(terminals[0].id);
    }
  }, [terminals, selectedTerminalId]);

  const handleAddTerminal = () => {
    setIsNewTerminal(true);
    setSelectedTank(undefined);
    setIsTankFormOpen(true);
  };

  const handleAddTank = () => {
    setIsNewTerminal(false);
    setSelectedTank(undefined);
    setIsTankFormOpen(true);
  };

  const handleTankFormSuccess = () => {
    refetchTanks();
  };

  const handlePumpOverClick = () => {
    setIsPumpOverFormOpen(true);
  };

  const handleStockReconciliationClick = () => {
    setIsStockReconciliationFormOpen(true);
  };

  const handlePumpOverSubmit = (quantity: number, comment?: string) => {
    if (selectedTerminalId) {
      createPumpOver(quantity, comment);
    }
  };

  const handleStockReconciliationSubmit = (quantity: number, comment: string) => {
    if (selectedTerminalId) {
      createStockReconciliation(quantity, comment);
    }
  };

  const handleDeletePumpOver = (assignmentId: string, movementId: string) => {
    const assignment = assignments.find(a => a.id === assignmentId);
    if (assignment) {
      setPumpOverToDelete({
        assignmentId,
        movementId,
        quantity: assignment.quantity_mt
      });
    }
  };

  const handleDeleteStockReconciliation = (assignmentId: string, movementId: string) => {
    setStockReconciliationToDelete({
      assignmentId,
      movementId
    });
  };

  const handleDeleteStorageMovement = (assignmentId: string) => {
    setStorageMovementToDelete(assignmentId);
  };

  const confirmDeletePumpOver = () => {
    if (pumpOverToDelete) {
      deletePumpOver(pumpOverToDelete.assignmentId, pumpOverToDelete.movementId);
    }
  };

  const confirmDeleteStockReconciliation = () => {
    if (stockReconciliationToDelete) {
      deleteStockReconciliation(
        stockReconciliationToDelete.assignmentId, 
        stockReconciliationToDelete.movementId
      );
    }
  };

  const confirmDeleteStorageMovement = () => {
    if (storageMovementToDelete) {
      deleteStorageMovement(storageMovementToDelete);
    }
  };

  const { calculateTankUtilization, calculateSummary } = useTankCalculations(tanks, tankMovements);
  const summaryCalculator = calculateSummary();
  
  // Get assignments from movements for deletion functionality
  const assignments = React.useMemo(() => {
    return movements.map(movement => ({
      id: movement.assignment_id,
      quantity_mt: movement.assignment_quantity || 0,
      movement_id: movement.id,
      comments: movement.terminal_comments
    }));
  }, [movements]);
  
  const sortedMovements = React.useMemo(() => {
    return [...movements].sort((a, b) => {
      if (a.sort_order !== null && b.sort_order !== null) {
        return a.sort_order - b.sort_order;
      }
      if (a.sort_order !== null) return -1;
      if (b.sort_order !== null) return 1;
      
      // Use nullish coalescing for possibly missing properties
      const dateA = new Date(a.assignment_date || a.created_at || new Date());
      const dateB = new Date(b.assignment_date || b.created_at || new Date());
      return dateA.getTime() - dateB.getTime();
    });
  }, [movements]);

  return (
    <Layout>
      <div className="space-y-6">
        <StorageHeader title="Storage Management" />
        
        <ProductLegend />
        
        <TerminalTabs
          terminals={terminals}
          selectedTerminalId={selectedTerminalId}
          onTerminalChange={setSelectedTerminalId}
          onAddTerminal={handleAddTerminal}
        />
        
        <Card className="border-r-[3px] border-brand-lime/60 bg-gradient-to-br from-brand-navy/75 to-brand-navy/90">
          <CardHeader>
            <StorageCardHeader
              selectedTerminal={terminals.find(t => t.id === selectedTerminalId)}
              selectedTerminalId={selectedTerminalId}
              onStockReconciliationClick={handleStockReconciliationClick}
              onPumpOverClick={handlePumpOverClick}
              onAddTankClick={handleAddTank}
            />
          </CardHeader>
          <CardContent>
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
                      </TableHeader>
                      
                      {selectedTerminalId && (
                        <SortableAssignmentList
                          terminalId={selectedTerminalId}
                          movements={movements}
                          updateAssignmentComments={updateAssignmentComments}
                          columnWidths={stickyColumnWidths}
                          onDeletePumpOver={handleDeletePumpOver}
                          onDeleteStorageMovement={handleDeleteStorageMovement}
                          onDeleteStockReconciliation={handleDeleteStockReconciliation}
                        />
                      )}
                    </Table>
                  </div>
                </ScrollArea>
                
                <div className="overflow-hidden flex-grow">
                  <ScrollArea className="h-[700px]" orientation="horizontal">
                    <div className="min-w-[1800px]">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50 border-b border-white/10 h-12">
                            {tanks.map((tank) => (
                              <TableHead 
                                key={`${tank.id}-header`}
                                colSpan={3} 
                                className={cn(
                                  "text-center border-r border-white/30 bg-gradient-to-br from-brand-navy/90 to-brand-navy/70 text-white font-bold text-[10px]"
                                )}
                              >
                                <EditableDropdownField
                                  initialValue={tank.current_product}
                                  options={productOptions}
                                  onSave={(value) => updateTankProduct(tank.id, value)}
                                  className={cn(
                                    "text-[10px] font-bold text-center w-full",
                                    PRODUCT_COLORS[tank.current_product]?.split(' ')[0]
                                  )}
                                  truncate={false}
                                />
                              </TableHead>
                            ))}
                            
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
                          </TableRow>
                          
                          <TableRow className="bg-muted/40 border-b border-white/10 h-10">
                            {tanks.map((tank) => (
                              <TableHead 
                                key={`${tank.id}-tank-number`}
                                colSpan={3} 
                                className="text-center text-[10px] border-r border-white/30"
                              >
                                <div className="flex items-center justify-center">
                                  <span className="mr-1">Tank</span>
                                  <EditableField
                                    initialValue={tank.tank_number}
                                    onSave={(value) => updateTankNumber(tank.id, value)}
                                    className="text-[10px] text-center"
                                    truncate={false}
                                  />
                                </div>
                              </TableHead>
                            ))}
                            
                            <TableHead 
                              colSpan={6} 
                              className="text-center text-[10px] border-r border-white/30"
                            ></TableHead>
                          </TableRow>
                          
                          <TableRow className="bg-muted/40 border-b border-white/10 h-14">
                            {tanks.map((tank) => (
                              <TableHead 
                                key={`${tank.id}-capacity`}
                                colSpan={3} 
                                className="text-[10px] border-r border-white/30"
                              >
                                <div className="flex justify-between items-center px-2">
                                  <span>Capacity: </span>
                                  <div className="flex items-center">
                                    <EditableNumberField
                                      initialValue={tank.capacity_mt}
                                      onSave={(value) => updateTankCapacity(tank.id, value)}
                                      className="text-[10px] w-20"
                                    /> MT
                                    <Database className="h-3 w-3 text-brand-lime/70 ml-2" />
                                  </div>
                                </div>
                                {(() => {
                                  const utilization = calculateTankUtilization(tank);
                                  return (
                                    <>
                                      <div className="w-full bg-gray-700 rounded-full h-2 mt-1 mx-2">
                                        <div 
                                          className="bg-brand-lime h-2 rounded-full" 
                                          style={{ 
                                            width: `${Math.min(utilization.utilizationMT, 100)}%` 
                                          }}
                                        ></div>
                                      </div>
                                      <div className="flex justify-between px-2 mt-1">
                                        <span className="text-[9px] text-muted-foreground">
                                          {Math.round(utilization.currentBalance)} MT
                                        </span>
                                        <span className="text-[9px] text-muted-foreground">
                                          {Math.round(utilization.utilizationMT)}%
                                        </span>
                                      </div>
                                    </>
                                  );
                                })()}
                              </TableHead>
                            ))}
                            
                            <TableHead 
                              colSpan={6} 
                              className="text-[10px] border-r border-white/30"
                            >
                              <div className="flex items-center h-full px-2">
                                <span>Total Capacity: {Object.values(tanks).reduce((sum, tank) => sum + tank.capacity_mt, 0).toFixed(2)} MT</span>
                              </div>
                            </TableHead>
                          </TableRow>
                          
                          <TableRow className="bg-muted/40 border-b border-white/10 h-14">
                            {tanks.map((tank) => (
                              <TableHead 
                                key={`${tank.id}-capacity-m3`}
                                colSpan={3} 
                                className="text-[10px] border-r border-white/30"
                              >
                                <div className="flex justify-between items-center px-2">
                                  <span>Capacity:</span>
                                  <div className="flex items-center">
                                    {tank.capacity_m3.toFixed(2)} M³
                                  </div>
                                </div>
                                {(() => {
                                  const utilization = calculateTankUtilization(tank);
                                  return (
                                    <>
                                      <div className="w-full bg-gray-700 rounded-full h-2 mt-1 mx-2">
                                        <div 
                                          className="bg-brand-blue h-2 rounded-full" 
                                          style={{ 
                                            width: `${Math.min(utilization.utilizationM3, 100)}%` 
                                          }}
                                        ></div>
                                      </div>
                                      <div className="flex justify-between px-2 mt-1">
                                        <span className="text-[9px] text-muted-foreground">
                                          {utilization.balanceM3.toFixed(2)} M³
                                        </span>
                                        <span className="text-[9px] text-muted-foreground">
                                          {Math.round(utilization.utilizationM3)}%
                                        </span>
                                      </div>
                                    </>
                                  );
                                })()}
                              </TableHead>
                            ))}
                            
                            <TableHead 
                              colSpan={6} 
                              className="text-[10px] border-r border-white/30"
                            >
                              <div className="flex items-center h-full px-2">
                                <span>Total Capacity: {Object.values(tanks).reduce((sum, tank) => sum + tank.capacity_m3, 0).toFixed(2)} M³</span>
                              </div>
                            </TableHead>
                          </TableRow>
                          
                          <TableRow className="bg-muted/40 border-b border-white/10 h-8">
                            {tanks.map((tank) => (
                              <TableHead 
                                key={`${tank.id}-spec`}
                                colSpan={3} 
                                className="text-[10px] border-r border-white/30"
                              >
                                <div className="flex justify-between px-2">
                                  <span className="text-muted-foreground">Spec:</span>
                                  <EditableField
                                    initialValue={tank.spec}
                                    onSave={(value) => updateTankSpec(tank.id, value)}
                                    className="text-[10px]"
                                    maxWidth={100}
                                  />
                                </div>
                              </TableHead>
                            ))}
                            
                            <TableHead 
                              colSpan={6} 
                              className="text-[10px] border-r border-white/30"
                            ></TableHead>
                          </TableRow>
                          
                          <TableRow className="bg-muted/40 border-b border-white/10 h-8">
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
                                      initialValue={tank.is_heating_enabled ? "true" : "false"}
                                      options={heatingOptions}
                                      onSave={(value) => updateTankHeating(tank.id, value)}
                                      className="text-[10px]"
                                      truncate={false}
                                    />
                                  </div>
                                </div>
                              </TableHead>
                            ))}
                            
                            <TableHead 
                              colSpan={6} 
                              className="text-[10px] border-r border-white/30"
                            ></TableHead>
                          </TableRow>
                          
                          <TableRow className="bg-muted/50 border-b border-white/10 h-10">
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
                            <TableHead className="text-center text-[10px] border-r border-white/30" style={{ width: `${summaryColumnWidths.difference}px` }}>
                              <TruncatedCell
                                text={truncatedHeaders.difference}
                                width={summaryColumnWidths.difference - 8}
                                className="text-[10px] text-center mx-auto"
                              />
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        
                        <TableBody>
                          {sortedMovements.map((movement, index) => {
                            // Check if this is a pump over row
                            const isPumpOver = movement.terminal_comments === 'PUMP_OVER';
                            
                            // Check if this is a stock reconciliation row
                            // Use 'in' operator to safely check if product exists on the movement object
                            const isStockReconciliation = 
                              ('product' in movement && movement.product === 'RECONCILIATION') && 
                              movement.terminal_comments === 'STOCK_RECONCILIATION';
                            
                            const bgColorClass = movement.buy_sell === "buy" 
                              ? "bg-green-900/10 hover:bg-green-900/20" 
                              : "bg-red-900/10 hover:bg-red-900/20";
                            
                            const movementSummary = summaryCalculator.getSummaryForMovement(movement.id);
                            
                            return (
                              <TableRow 
                                key={`scroll-${movement.id}`} 
                                className={cn("border-b border-white/5 h-10", bgColorClass)}
                              >
                                {tanks.map((tank) => {
                                  const tankMovement = tankMovements.find(
                                    tm => tm.movement_id === movement.id && tm.tank_id === tank.id
                                  );
                                  
                                  return (
                                    <React.Fragment key={`${movement.id}-${tank.id}`}>
                                      <TableCell className="text-center text-[10px] py-2">
                                        <EditableNumberField
                                          initialValue={tankMovement?.quantity_mt || 0}
                                          onSave={(value) => updateTankMovement(movement.id, tank.id, value)}
                                          className="text-[10px] w-16"
                                          product={tankMovement?.product_at_time || tank.current_product}
                                        />
                                      </TableCell>
                                      <TableCell className="text-center text-[10px] py-2">
                                        {tankMovement?.quantity_m3 ? (tankMovement.quantity_m3).toFixed(2) : '0.00'}
                                      </TableCell>
                                      <TableCell className="text-center text-[10px] py-2 bg-brand-navy border-r border-white/30">
                                        {movementSummary.tankBalances[tank.id]?.balanceMT || 0}
                                      </TableCell>
                                    </React.Fragment>
                                  );
                                })}
                                
                                <TableCell className="text-center text-[10px] py-2">
                                  {(() => {
                                    const totalMTMoved = Math.round(movementSummary.totalMTMoved);
                                    const movementQuantity = Math.round(movement.assignment_quantity || 0);
                                    
                                    if (isPumpOver || isStockReconciliation) {
                                      // For pump overs and stock reconciliations, show an exclamation if total is NOT zero
                                      // but only for pump overs, never for stock reconciliations
                                      return (
                                        <div className="flex items-center justify-center space-x-1">
                                          <span>{totalMTMoved}</span>
                                          {isPumpOver && totalMTMoved !== 0 && (
                                            <Badge 
                                              variant="outline" 
                                              className="bg-yellow-100 text-yellow-800 border-yellow-300 px-1 py-0 text-[8px] rounded-full"
                                            >
                                              !
                                            </Badge>
                                          )}
                                        </div>
                                      );
                                    } else {
                                      // For normal movements, show an exclamation if total doesn't match quantity
                                      return (
                                        <div className="flex items-center justify-center space-x-1">
                                          <span>{totalMTMoved}</span>
                                          {totalMTMoved !== movementQuantity && (
                                            <Badge 
                                              variant="outline" 
                                              className="bg-yellow-100 text-yellow-800 border-yellow-300 px-1 py-0 text-[8px] rounded-full"
                                            >
                                              !
                                            </Badge>
                                          )}
                                        </div>
                                      );
                                    }
                                  })()}
                                </TableCell>
                                <TableCell className="text-center text-[10px] py-2">
                                  {(movementSummary.totalMTMoved * 1.1).toFixed(2)}
                                </TableCell>
                                <TableCell className="text-center text-[10px] py-2 font-medium text-green-400">
                                  {Math.round(movementSummary.t1Balance)}
                                </TableCell>
                                <TableCell className="text-center text-[10px] py-2 font-medium text-blue-400">
                                  {Math.round(movementSummary.t2Balance)}
                                </TableCell>
                                <TableCell className="text-center text-[10px] py-2 font-medium">
                                  {Math.round(movementSummary.currentStockMT)}
                                </TableCell>
                                <TableCell className="text-center text-[10px] py-2 font-medium border-r border-white/30">
                                  {Math.round(movementSummary.currentUllage)}
                                </TableCell>
                                <TableCell className="text-center text-[10px] py-2 font-medium border-r border-white/30">
                                  {isPumpOver || isStockReconciliation ? 
                                    <span className="text-white">-</span> : 
                                    Math.round(movementSummary.totalMTMoved - (movement.assignment_quantity || 0))
                                  }
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <TankForm
        open={isTankFormOpen}
        onOpenChange={setIsTankFormOpen}
        onSuccess={handleTankFormSuccess}
        terminal={terminals.find(t => t.id === selectedTerminalId)}
        tank={selectedTank}
        isNewTerminal={isNewTerminal}
      />

      <PumpOverFormDialog
        open={isPumpOverFormOpen}
        onOpenChange={setIsPumpOverFormOpen}
        onSubmit={handlePumpOverSubmit}
      />

      <StockReconciliationFormDialog
        open={isStockReconciliationFormOpen}
        onOpenChange={setIsStockReconciliationFormOpen}
        onSubmit={handleStockReconciliationSubmit}
      />

      <DeletePumpOverDialog
        open={!!pumpOverToDelete}
        onOpenChange={(open) => !open && setPumpOverToDelete(null)}
        onConfirm={confirmDeletePumpOver}
        quantity={pumpOverToDelete?.quantity || 0}
      />

      <DeleteStockReconciliationDialog
        open={!!stockReconciliationToDelete}
        onOpenChange={(open) => !open && setStockReconciliationToDelete(null)}
        onConfirm={confirmDeleteStockReconciliation}
        assignmentId={stockReconciliationToDelete?.assignmentId || ''}
      />

      <DeleteStorageMovementDialog
        open={!!storageMovementToDelete}
        onOpenChange={(open) => !open && setStorageMovementToDelete(null)}
        onConfirm={confirmDeleteStorageMovement}
        assignmentId={storageMovementToDelete || ''}
      />
    </Layout>
  );
};

export default StoragePage;
