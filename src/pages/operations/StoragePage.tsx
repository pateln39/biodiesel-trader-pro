import React, { useRef } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Filter, Thermometer, Database, Plus, Wrench } from 'lucide-react';
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
import { KeyboardNavigationProvider } from '@/contexts/KeyboardNavigationContext';
import KeyboardNavigableCell from '@/components/operations/storage/KeyboardNavigableCell';
import KeyboardShortcutHandler from '@/components/operations/storage/KeyboardShortcutHandler';

const stickyColumnWidths = {
  counterparty: 110,
  tradeRef: 80,
  bargeName: 90,
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
  const [isNewTerminal, setIsNewTerminal] = React.useState(false);
  const [selectedTank, setSelectedTank] = React.useState<Tank>();

  const gridRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

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

  const { calculateTankUtilization, calculateSummary } = useTankCalculations(tanks, tankMovements);
  const summaryCalculator = calculateSummary();
  
  const sortedMovements = React.useMemo(() => {
    return [...movements].sort((a, b) => {
      if (a.sort_order !== null && b.sort_order !== null) {
        return a.sort_order - b.sort_order;
      }
      if (a.sort_order !== null) return -1;
      if (b.sort_order !== null) return 1;
      
      const dateA = new Date(a.assignment_date || a.created_at);
      const dateB = new Date(b.assignment_date || b.created_at);
      return dateA.getTime() - dateB.getTime();
    });
  }, [movements]);

  const leftColumnCount = Object.keys(stickyColumnWidths).length;
  const rightColumnCount = tanks.length * 3 + Object.keys(summaryColumnWidths).length;
  const rowCount = movements.length;
  const headerRowCount = 1;

  return (
    <Layout>
      <KeyboardNavigationProvider>
        <div className="space-y-6" ref={gridRef} tabIndex={-1}>
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
                  <Button variant="outline" size="sm" onClick={handleAddTank}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Tank
                  </Button>
                )}
              </CardTitle>
              <CardDescription>
                Storage tank management for {terminals.find(t => t.id === selectedTerminalId)?.name || 'selected terminal'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative border rounded-md overflow-hidden" ref={contentRef}>
                <div className="flex">
                  <ScrollArea 
                    className="flex-shrink-0 z-30 border-r border-white/30" 
                    orientation="horizontal"
                    style={{ width: `${totalStickyWidth}px` }}
                    ref={leftPanelRef}
                  >
                    <div style={{ minWidth: `${totalStickyWidth}px` }}>
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50 border-b border-white/10 h-10">
                            <TableHead 
                              colSpan={9} 
                              className="bg-brand-navy text-[10px]"
                            >
                            </TableHead>
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
                    <ScrollArea className="h-[700px]" orientation="horizontal" ref={rightPanelRef}>
                      <div className="min-w-[1800px]">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50 border-b border-white/10 h-10">
                              {tanks.map((tank, tankIndex) => (
                                <TableHead 
                                  key={`${tank.id}-header`}
                                  colSpan={3} 
                                  className={cn(
                                    "text-center border-r border-white/30 bg-gradient-to-br from-brand-navy/90 to-brand-navy/70 text-white font-bold text-[10px]"
                                  )}
                                >
                                  <KeyboardNavigableCell 
                                    row={-1} 
                                    col={tankIndex * 3} 
                                    panel="right" 
                                    className="h-full w-full"
                                    allowEditing={true}
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
                                  </KeyboardNavigableCell>
                                </TableHead>
                              ))}
                              
                              <TableHead 
                                colSpan={1} 
                                className="text-center border-r border-white/30 bg-gradient-to-br from-brand-navy/90 to-brand-navy/70 text-white font-bold text-[10px]"
                              >
                                <KeyboardNavigableCell 
                                  row={-1} 
                                  col={tanks.length * 3} 
                                  panel="right" 
                                  className="h-full w-full"
                                >
                                  <div className="text-[10px] font-bold text-center w-full">
                                    Summary
                                  </div>
                                </KeyboardNavigableCell>
                              </TableHead>
                              <TableHead 
                                colSpan={5} 
                                className="text-center border-r border-white/30 bg-gradient-to-br from-brand-navy/90 to-brand-navy/70 text-white font-bold text-[10px]"
                              >
                                <KeyboardNavigableCell 
                                  row={-1} 
                                  col={tanks.length * 3 + 1} 
                                  panel="right" 
                                  className="h-full w-full"
                                >
                                  <div className="text-[10px] font-bold text-center w-full">
                                    Balances
                                  </div>
                                </KeyboardNavigableCell>
                              </TableHead>
                            </TableRow>
                            <TableRow className="bg-muted/50 border-b border-white/10 h-10">
                              {tanks.map((tank, tankIndex) => (
                                <React.Fragment key={tank.id}>
                                  <TableHead className="text-center text-[10px]">
                                    <KeyboardNavigableCell 
                                      row={-1} 
                                      col={tankIndex * 3} 
                                      panel="right" 
                                      className="h-full w-full"
                                    >
                                      <TruncatedCell
                                        text="Movement (MT)"
                                        width={65}
                                        className="text-[10px] text-center mx-auto"
                                      />
                                    </KeyboardNavigableCell>
                                  </TableHead>
                                  <TableHead className="text-center text-[10px]">
                                    <KeyboardNavigableCell 
                                      row={-1} 
                                      col={tankIndex * 3 + 1} 
                                      panel="right" 
                                      className="h-full w-full"
                                    >
                                      <TruncatedCell
                                        text="Movement (M³)"
                                        width={65}
                                        className="text-[10px] text-center mx-auto"
                                      />
                                    </KeyboardNavigableCell>
                                  </TableHead>
                                  <TableHead className="text-center text-[10px] bg-brand-navy border-r border-white/30">
                                    <KeyboardNavigableCell 
                                      row={-1} 
                                      col={tankIndex * 3 + 2} 
                                      panel="right" 
                                      className="h-full w-full"
                                    >
                                      Balance
                                    </KeyboardNavigableCell>
                                  </TableHead>
                                </React.Fragment>
                              ))}
                              
                              <TableHead className="text-center text-[10px]" style={{ width: `${summaryColumnWidths.totalMT}px` }}>
                                <KeyboardNavigableCell 
                                  row={-1} 
                                  col={tanks.length * 3} 
                                  panel="right" 
                                  className="h-full w-full"
                                >
                                  <TruncatedCell
                                    text={truncatedHeaders.totalMT}
                                    width={summaryColumnWidths.totalMT - 8}
                                    className="text-[10px] text-center mx-auto"
                                  />
                                </KeyboardNavigableCell>
                              </TableHead>
                              <TableHead className="text-center text-[10px]" style={{ width: `${summaryColumnWidths.totalM3}px` }}>
                                <KeyboardNavigableCell 
                                  row={-1} 
                                  col={tanks.length * 3 + 1} 
                                  panel="right" 
                                  className="h-full w-full"
                                >
                                  <TruncatedCell
                                    text={truncatedHeaders.totalM3}
                                    width={summaryColumnWidths.totalM3 - 8}
                                    className="text-[10px] text-center mx-auto"
                                  />
                                </KeyboardNavigableCell>
                              </TableHead>
                              <TableHead className="text-center text-[10px]" style={{ width: `${summaryColumnWidths.t1Balance}px` }}>
                                <KeyboardNavigableCell 
                                  row={-1} 
                                  col={tanks.length * 3 + 2} 
                                  panel="right" 
                                  className="h-full w-full"
                                >
                                  <TruncatedCell
                                    text={truncatedHeaders.t1Balance}
                                    width={summaryColumnWidths.t1Balance - 8}
                                    className="text-[10px] text-center mx-auto"
                                  />
                                </KeyboardNavigableCell>
                              </TableHead>
                              <TableHead className="text-center text-[10px]" style={{ width: `${summaryColumnWidths.t2Balance}px` }}>
                                <KeyboardNavigableCell 
                                  row={-1} 
                                  col={tanks.length * 3 + 3} 
                                  panel="right" 
                                  className="h-full w-full"
                                >
                                  <TruncatedCell
                                    text={truncatedHeaders.t2Balance}
                                    width={summaryColumnWidths.t2Balance - 8}
                                    className="text-[10px] text-center mx-auto"
                                  />
                                </KeyboardNavigableCell>
                              </TableHead>
                              <TableHead className="text-center text-[10px]" style={{ width: `${summaryColumnWidths.currentStock}px` }}>
                                <KeyboardNavigableCell 
                                  row={-1} 
                                  col={tanks.length * 3 + 4} 
                                  panel="right" 
                                  className="h-full w-full"
                                >
                                  <TruncatedCell
                                    text={truncatedHeaders.currentStock}
                                    width={summaryColumnWidths.currentStock - 8}
                                    className="text-[10px] text-center mx-auto"
                                  />
                                </KeyboardNavigableCell>
                              </TableHead>
                              <TableHead className="text-center text-[10px] border-r border-white/30" style={{ width: `${summaryColumnWidths.currentUllage}px` }}>
                                <KeyboardNavigableCell 
                                  row={-1} 
                                  col={tanks.length * 3 + 5} 
                                  panel="right" 
                                  className="h-full w-full"
                                >
                                  <TruncatedCell
                                    text={truncatedHeaders.currentUllage}
                                    width={summaryColumnWidths.currentUllage - 8}
                                    className="text-[10px] text-center mx-auto"
                                  />
                                </KeyboardNavigableCell>
                              </TableHead>
                              <TableHead className="text-center text-[10px] border-r border-white/30" style={{ width: `${summaryColumnWidths.difference}px` }}>
                                <KeyboardNavigableCell 
                                  row={-1} 
                                  col={tanks.length * 3 + 6} 
                                  panel="right" 
                                  className="h-full w-full"
                                >
                                  <TruncatedCell
                                    text={truncatedHeaders.difference}
                                    width={summaryColumnWidths.difference - 8}
                                    className="text-[10px] text-center mx-auto"
                                  />
                                </KeyboardNavigableCell>
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          
                          <TableBody>
                            {sortedMovements.map((movement, rowIndex) => {
                              const bgColorClass = movement.buy_sell === "buy" 
                                ? "bg-green-900/10 hover:bg-green-900/20" 
                                : "bg-red-900/10 hover:bg-red-900/20";
                              
                              const movementSummary = summaryCalculator.getSummaryForMovement(movement.id);
                              
                              return (
                                <TableRow 
                                  key={`scroll-${movement.id}`} 
                                  className={cn("border-b border-white/5 h-10", bgColorClass)}
                                >
                                  {tanks.map((tank, tankIndex) => {
                                    const tankMovement = tankMovements.find(
                                      tm => tm.movement_id === movement.id && tm.tank_id === tank.id
                                    );
                                    
                                    return (
                                      <React.Fragment key={`${movement.id}-${tank.id}`}>
                                        <TableCell className="text-center text-[10px] py-2">
                                          <KeyboardNavigableCell 
                                            row={rowIndex} 
                                            col={tankIndex * 3} 
                                            panel="right" 
                                            className="h-full w-full"
                                            allowEditing={true}
                                          >
                                            <EditableNumberField
                                              initialValue={tankMovement?.quantity_mt || 0}
                                              onSave={(value) => updateTankMovement(movement.id, tank.id, value)}
                                              className="text-[10px] w-16"
                                              product={tankMovement?.product_at_time || tank.current_product}
                                            />
                                          </KeyboardNavigableCell>
                                        </TableCell>
                                        <TableCell className="text-center text-[10px] py-2">
                                          <KeyboardNavigableCell 
                                            row={rowIndex} 
                                            col={tankIndex * 3 + 1} 
                                            panel="right" 
                                            className="h-full w-full"
                                          >
                                            {tankMovement?.quantity_m3 ? (tankMovement.quantity_m3).toFixed(2) : '0.00'}
                                          </KeyboardNavigableCell>
                                        </TableCell>
                                        <TableCell className="text-center text-[10px] py-2 bg-brand-navy border-r border-white/30">
                                          <KeyboardNavigableCell 
                                            row={rowIndex} 
                                            col={tankIndex * 3 + 2} 
                                            panel="right" 
                                            className="h-full w-full"
                                          >
                                            {movementSummary.tankBalances[tank.id]?.balanceMT || 0}
                                          </KeyboardNavigableCell>
                                        </TableCell>
                                      </React.Fragment>
                                    );
                                  })}
                                  
                                  <TableCell className="text-center text-[10px] py-2">
                                    <KeyboardNavigableCell 
                                      row={rowIndex} 
                                      col={tanks.length * 3} 
                                      panel="right" 
                                      className="h-full w-full"
                                    >
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
                                    </KeyboardNavigableCell>
                                  </TableCell>
                                  <TableCell className="text-center text-[10px] py-2">
                                    <KeyboardNavigableCell 
                                      row={rowIndex} 
                                      col={tanks.length * 3 + 1} 
                                      panel="right" 
                                      className="h-full w-full"
                                    >
                                      {(movementSummary.totalMTMoved * 1.1).toFixed(2)}
                                    </KeyboardNavigableCell>
                                  </TableCell>
                                  <TableCell className="text-center text-[10px] py-2 font-medium text-green-400">
                                    <KeyboardNavigableCell 
                                      row={rowIndex} 
                                      col={tanks.length * 3 + 2} 
                                      panel="right" 
                                      className="h-full w-full"
                                    >
                                      {Math.round(movementSummary.t1Balance)}
                                    </KeyboardNavigableCell>
                                  </TableCell>
                                  <TableCell className="text-center text-[10px] py-2 font-medium text-blue-400">
                                    <KeyboardNavigableCell 
                                      row={rowIndex} 
                                      col={tanks.length * 3 + 3} 
                                      panel="right" 
                                      className="h-full w-full"
                                    >
                                      {Math.round(movementSummary.t2Balance)}
                                    </KeyboardNavigableCell>
                                  </TableCell>
                                  <TableCell className="text-center text-[10px] py-2 font-medium">
                                    <KeyboardNavigableCell 
                                      row={rowIndex} 
                                      col={tanks.length * 3 + 4} 
                                      panel="right" 
                                      className="h-full w-full"
                                    >
                                      {Math.round(movementSummary.currentStockMT)}
                                    </KeyboardNavigableCell>
                                  </TableCell>
                                  <TableCell className="text-center text-[10px] py-2 font-medium border-r border-white/30">
                                    <KeyboardNavigableCell 
                                      row={rowIndex} 
                                      col={tanks.length * 3 + 5} 
                                      panel="right" 
                                      className="h-full w-full"
                                    >
                                      {Math.round(movementSummary.currentUllage)}
                                    </KeyboardNavigableCell>
                                  </TableCell>
                                  <TableCell className="text-center text-[10px] py-2 font-medium border-r border-white/30">
                                    <KeyboardNavigableCell 
                                      row={rowIndex} 
                                      col={tanks.length * 3 + 6} 
                                      panel="right" 
                                      className="h-full w-full"
                                    >
                                      {Math.round(movementSummary.totalMTMoved - (movement.assignment_quantity || 0))}
                                    </KeyboardNavigableCell>
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

        <KeyboardShortcutHandler
          terminals={terminals}
          selectedTerminalId={selectedTerminalId}
          onTerminalChange={setSelectedTerminalId}
          onAddTank={handleAddTank}
          onAddTerminal={handleAddTerminal}
          gridRef={gridRef}
          leftPanelRef={leftPanelRef}
          rightPanelRef={rightPanelRef}
          childrenRef={contentRef}
          leftColumnCount={leftColumnCount}
          rightColumnCount={rightColumnCount}
          rowCount={rowCount}
          headerRowCount={1}
        />
      </KeyboardNavigationProvider>
    </Layout>
  );
};

export default StoragePage;
