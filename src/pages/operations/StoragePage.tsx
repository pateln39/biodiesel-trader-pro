
import React from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Filter, Thermometer, Database, Plus, Wrench, Waves } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useInventoryState } from '@/hooks/useInventoryState';
import { Button } from '@/components/ui/button';
import EditableField from '@/components/operations/storage/EditableField';
import EditableNumberField from '@/components/operations/storage/EditableNumberField';
import EditableDropdownField from '@/components/operations/storage/EditableDropdownField';
import ProductToken from '@/components/operations/storage/ProductToken';
import ProductLegend from '@/components/operations/storage/ProductLegend';
import { useTerminals } from '@/hooks/useTerminals';
import { useTanks, Tank } from '@/hooks/useTanks';
import TerminalTabs from '@/components/operations/storage/TerminalTabs';
import TankForm from '@/components/operations/storage/TankForm';
import PumpOverFormDialog from '@/components/operations/storage/PumpOverFormDialog';
import { useTankCalculations } from '@/hooks/useTankCalculations';
import { Badge } from '@/components/ui/badge';
import SortableAssignmentList from '@/components/operations/storage/SortableAssignmentList';
import { TruncatedCell } from '@/components/operations/storage/TruncatedCell';
import { 
  cleanupOrphanedTankMovements, 
  initializeAssignmentSortOrder, 
  fixDuplicateSortOrders 
} from '@/utils/cleanupUtils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const stickyColumnWidths = {
  counterparty: 110,
  tradeRef: 80,
  bargeName: 90,
  bargeImo: 85,  // Add width for the new IMO column
  movementDate: 75,
  nominationDate: 75,
  customs: 75,
  sustainability: 90,
  comments: 100,
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
  const [isNewTerminal, setIsNewTerminal] = React.useState(false);
  const [selectedTank, setSelectedTank] = React.useState<Tank>();

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

  const handleMaintenance = async () => {
    if (selectedTerminalId) {
      await cleanupOrphanedTankMovements(selectedTerminalId);
      await initializeAssignmentSortOrder(selectedTerminalId);
      await fixDuplicateSortOrders(selectedTerminalId);
      refetchTanks();
    }
  };

  const handlePumpOverClick = () => {
    setIsPumpOverFormOpen(true);
  };

  const handlePumpOverSubmit = (quantity: number, comment?: string) => {
    if (selectedTerminalId) {
      createPumpOver(quantity, comment);
    }
  };

  const { calculateTankUtilization, calculateSummary } = useTankCalculations(tanks, tankMovements);
  const summaryCalculator = calculateSummary();
  
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
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleMaintenance}>
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
          onTerminalChange={setSelectedTerminalId}
          onAddTerminal={handleAddTerminal}
        />
        
        <Card className="border-r-[3px] border-brand-lime/60 bg-gradient-to-br from-brand-navy/75 to-brand-navy/90">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Storage Movements</span>
              {selectedTerminalId && (
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={handlePumpOverClick}>
                    <Waves className="h-4 w-4 mr-1" />
                    Internal Pump Over
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleAddTank}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Tank
                  </Button>
                </div>
              )}
            </CardTitle>
            <CardDescription>
              Storage tank management for {terminals.find(t => t.id === selectedTerminalId)?.name || 'selected terminal'}
            </CardDescription>
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
                                  {Math.round(movementSummary.totalMTMoved - (movement.assignment_quantity || 0))}
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
    </Layout>
  );
};

export default StoragePage;
