import React, { useCallback, useMemo, useRef } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Filter, Thermometer, Database, Plus, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useInventoryState } from '@/hooks/useInventoryState';
import { Button } from '@/components/ui/button';
import EditableField from '@/components/operations/storage/EditableField';
import EditableDropdownField from '@/components/operations/storage/EditableDropdownField';
import ProductToken from '@/components/operations/storage/ProductToken';
import ProductLegend from '@/components/operations/storage/ProductLegend';
import { useTerminals } from '@/hooks/useTerminals';
import { useTanks, Tank } from '@/hooks/useTanks';
import TerminalTabs from '@/components/operations/storage/TerminalTabs';
import TankForm from '@/components/operations/storage/TankForm';
import { useTankCalculations } from '@/hooks/useTankCalculations';
import SortableAssignmentList from '@/components/operations/storage/SortableAssignmentList';
import { TruncatedCell } from '@/components/operations/storage/TruncatedCell';
import NavigableCell from '@/components/operations/storage/NavigableCell';
import NavigableRow from '@/components/operations/storage/NavigableRow';
import { useCellNavigation, CellPosition } from '@/hooks/useCellNavigation';
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
import TankHeaderCell from '@/components/operations/storage/TankHeaderCell';
import TankCapacityM3Cell from '@/components/operations/storage/TankCapacityM3Cell';
import TankSpecRow from '@/components/operations/storage/TankSpecRow';
import TankMovementCell from '@/components/operations/storage/TankMovementCell';
import MovementQuantityIndicator from '@/components/operations/storage/MovementQuantityIndicator';
import { TableColumnWidth, SummaryColumnWidth, TableHeaderLabels } from '@/types/storage';

const LABEL_COUNTERPARTY = "Counterparty";
const LABEL_TRADE_REF = "Trade Ref";
const LABEL_BARGE = "Barge";
const LABEL_MOVE_DATE = "Move Date";
const LABEL_NOM_VALID = "Nom. Valid";
const LABEL_CUSTOMS = "Customs";
const LABEL_SUSTAIN = "Sustain.";
const LABEL_COMMENTS = "Comments";
const LABEL_QTY_MT = "Qty (MT)";
const LABEL_TOTAL_MT = "Total (MT)";
const LABEL_TOTAL_M3 = "Total (M³)";
const LABEL_T1 = "T1";
const LABEL_T2 = "T2";
const LABEL_CURRENT_STOCK = "Current Stock";
const LABEL_CURRENT_ULLAGE = "Current Ullage";
const LABEL_DIFFERENCE = "Total (MT) - Qty (MT)";
const LABEL_TANK = "Tank";
const LABEL_CAPACITY = "Capacity:";
const LABEL_SPEC = "Spec:";
const LABEL_HEATING = "Heating:";
const LABEL_SUMMARY = "Summary";
const LABEL_BALANCES = "Balances";
const LABEL_TOTAL_CAPACITY = "Total Capacity:";

const HEADER_FONT_SIZE = "text-[10px]";
const CAPACITY_WIDTH = 100;
const HEATING_WIDTH = 100;

const stickyColumnWidths: TableColumnWidth = {
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

const summaryColumnWidths: SummaryColumnWidth = {
  totalMT: 80,
  totalM3: 80,
  t1Balance: 80,
  t2Balance: 80,
  currentStock: 100,
  currentUllage: 100,
  difference: 100,
};

const truncatedHeaders: TableHeaderLabels = {
  counterparty: LABEL_COUNTERPARTY,
  tradeRef: LABEL_TRADE_REF,
  bargeName: LABEL_BARGE,
  movementDate: LABEL_MOVE_DATE,
  nominationDate: LABEL_NOM_VALID,
  customs: LABEL_CUSTOMS,
  sustainability: LABEL_SUSTAIN,
  comments: LABEL_COMMENTS,
  quantity: LABEL_QTY_MT,
  totalMT: LABEL_TOTAL_MT,
  totalM3: LABEL_TOTAL_M3,
  t1Balance: LABEL_T1,
  t2Balance: LABEL_T2,
  currentStock: LABEL_CURRENT_STOCK,
  currentUllage: LABEL_CURRENT_ULLAGE,
  difference: LABEL_DIFFERENCE,
};

const StoragePage: React.FC = () => {
  const [selectedTerminalId, setSelectedTerminalId] = React.useState<string>();
  const [isTankFormOpen, setIsTankFormOpen] = React.useState(false);
  const [isNewTerminal, setIsNewTerminal] = React.useState(false);
  const [selectedTank, setSelectedTank] = React.useState<Tank>();
  const rightScrollAreaRef = useRef<HTMLDivElement>(null);

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

  const { calculateTankUtilization, calculateSummary } = useTankCalculations(tanks, tankMovements);
  const summaryCalculator = calculateSummary();

  const sortedMovements = useMemo(() => {
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

  const leftColCount = Object.keys(stickyColumnWidths).length;
  const rightColCount = tanks.length * 3 + Object.keys(summaryColumnWidths).length;

  const {
    activeCell,
    setActiveCell,
    registerCellRef,
    focusCell,
    handleKeyDown
  } = useCellNavigation({
    leftColCount,
    rightColCount,
    rowCount: sortedMovements.length,
    scrollAreaRef: rightScrollAreaRef
  });

  const handleCellFocus = useCallback((position: CellPosition) => {
    setActiveCell(position);
  }, [setActiveCell]);

  const handleAddTerminal = useCallback(() => {
    setIsNewTerminal(true);
    setSelectedTank(undefined);
    setIsTankFormOpen(true);
  }, []);

  const handleAddTank = useCallback(() => {
    setIsNewTerminal(false);
    setSelectedTank(undefined);
    setIsTankFormOpen(true);
  }, []);

  const handleTankFormSuccess = useCallback(() => {
    refetchTanks();
  }, [refetchTanks]);

  const handleMaintenance = useCallback(async () => {
    if (selectedTerminalId) {
      await cleanupOrphanedTankMovements(selectedTerminalId);
      await initializeAssignmentSortOrder(selectedTerminalId);
      await fixDuplicateSortOrders(selectedTerminalId);
      refetchTanks();
    }
  }, [selectedTerminalId, refetchTanks]);

  const getMovementRowBgClass = useCallback((buySell?: string) => {
    return buySell === "buy" 
      ? "bg-green-900/10 hover:bg-green-900/20" 
      : "bg-red-900/10 hover:bg-red-900/20";
  }, []);

  const isCellActive = useCallback((row: number, col: number, zone: 'left' | 'right') => {
    return activeCell?.row === row && activeCell?.col === col && activeCell?.zone === zone;
  }, [activeCell]);

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
                  <ScrollArea 
                    ref={rightScrollAreaRef}
                    className="h-[700px]" 
                    orientation="horizontal"
                  >
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
                                    `text-[10px] font-bold text-center w-full`,
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
                                {truncatedHeaders.totalMT}
                              </div>
                            </TableHead>
                            <TableHead 
                              colSpan={5} 
                              className="text-center border-r border-white/30 bg-gradient-to-br from-brand-navy/90 to-brand-navy/70 text-white font-bold text-[10px]"
                            >
                              <div className="text-[10px] font-bold text-center w-full">
                                {truncatedHeaders.currentStock}
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
                                <TankHeaderCell 
                                  tank={tank} 
                                  utilization={calculateTankUtilization(tank)} 
                                  updateTankCapacity={updateTankCapacity}
                                  headerFontSize="text-[10px]"
                                />
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
                                <TankCapacityM3Cell
                                  tank={tank}
                                  utilization={calculateTankUtilization(tank)}
                                />
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
                                <TankSpecRow
                                  tank={tank}
                                  updateTankSpec={updateTankSpec}
                                  updateTankHeating={updateTankHeating}
                                  heatingOptions={heatingOptions}
                                  isSpecRow={true}
                                />
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
                                <TankSpecRow
                                  tank={tank}
                                  updateTankSpec={updateTankSpec}
                                  updateTankHeating={updateTankHeating}
                                  heatingOptions={heatingOptions}
                                  isSpecRow={false}
                                />
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
                            
                            {Object.entries(summaryColumnWidths).map(([key, width], index) => (
                              <TableHead 
                                key={`summary-header-${key}`}
                                className={cn(
                                  "text-center text-[10px]",
                                  key === 'currentUllage' || key === 'difference' ? "border-r border-white/30" : ""
                                )}
                                style={{ width: `${width}px` }}
                              >
                                <TruncatedCell
                                  text={truncatedHeaders[key as keyof TableHeaderLabels]}
                                  width={width - 8}
                                  className="text-[10px] text-center mx-auto"
                                />
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        
                        <TableBody>
                          {sortedMovements.map((movement, rowIndex) => {
                            const bgColorClass = getMovementRowBgClass(movement.buy_sell);
                            const movementSummary = summaryCalculator.getSummaryForMovement(movement.id);
                            
                            return (
                              <NavigableRow 
                                key={`scroll-${movement.id}`}
                                row={rowIndex}
                                onKeyDown={handleKeyDown}
                                activeCell={activeCell}
                                className={cn("border-b border-white/5 h-10", bgColorClass)}
                              >
                                {tanks.map((tank, tankIndex) => {
                                  const tankMovement = tankMovements.find(
                                    tm => tm.movement_id === movement.id && tm.tank_id === tank.id
                                  );
                                  
                                  const colBase = tankIndex * 3;
                                  
                                  return (
                                    <React.Fragment key={`${movement.id}-${tank.id}`}>
                                      <NavigableCell 
                                        row={rowIndex}
                                        col={colBase}
                                        zone="right"
                                        isActive={isCellActive(rowIndex, colBase, 'right')}
                                        onCellFocus={handleCellFocus}
                                        registerCellRef={registerCellRef}
                                        className="text-center py-2"
                                      >
                                        <TankMovementCell
                                          tankMovement={tankMovement}
                                          movementId={movement.id}
                                          tankId={tank.id}
                                          tankProduct={tank.current_product}
                                          updateTankMovement={updateTankMovement}
                                        />
                                      </NavigableCell>
                                      <NavigableCell 
                                        row={rowIndex}
                                        col={colBase + 1}
                                        zone="right"
                                        isActive={isCellActive(rowIndex, colBase + 1, 'right')}
                                        onCellFocus={handleCellFocus}
                                        registerCellRef={registerCellRef}
                                        className="text-center text-[10px] py-2"
                                      >
                                        {tankMovement?.quantity_m3 ? (tankMovement.quantity_m3).toFixed(2) : '0.00'}
                                      </NavigableCell>
                                      <NavigableCell 
                                        row={rowIndex}
                                        col={colBase + 2}
                                        zone="right"
                                        isActive={isCellActive(rowIndex, colBase + 2, 'right')}
                                        onCellFocus={handleCellFocus}
                                        registerCellRef={registerCellRef}
                                        className="text-center text-[10px] py-2 bg-brand-navy border-r border-white/30"
                                      >
                                        {movementSummary.tankBalances[tank.id]?.balanceMT || 0}
                                      </NavigableCell>
                                    </React.Fragment>
                                  );
                                })}
                                
                                {Object.keys(summaryColumnWidths).map((key, index) => {
                                  const colOffset = tanks.length * 3;
                                  let content = null;
                                  
                                  switch(key) {
                                    case 'totalMT':
                                      content = (
                                        <MovementQuantityIndicator 
                                          totalMTMoved={movementSummary.totalMTMoved}
                                          assignmentQuantity={movement.assignment_quantity || 0}
                                        />
                                      );
                                      break;
                                    case 'totalM3':
                                      content = (movementSummary.totalMTMoved * 1.1).toFixed(2);
                                      break;
                                    case 't1Balance':
                                      content = <span className="font-medium text-green-400">{Math.round(movementSummary.t1Balance)}</span>;
                                      break;
                                    case 't2Balance':
                                      content = <span className="font-medium text-blue-400">{Math.round(movementSummary.t2Balance)}</span>;
                                      break;
                                    case 'currentStock':
                                      content = <span className="font-medium">{Math.round(movementSummary.currentStockMT)}</span>;
                                      break;
                                    case 'currentUllage':
                                      content = <span className="font-medium">{Math.round(movementSummary.currentUllage)}</span>;
                                      break;
                                    case 'difference':
                                      content = <span className="font-medium">
                                        {Math.round(movementSummary.totalMTMoved - (movement.assignment_quantity || 0))}
                                      </span>;
                                      break;
                                  }
                                  
                                  return (
                                    <NavigableCell 
                                      key={`${movement.id}-summary-${key}`}
                                      row={rowIndex}
                                      col={colOffset + index}
                                      zone="right"
                                      isActive={isCellActive(rowIndex, colOffset + index, 'right')}
                                      onCellFocus={handleCellFocus}
                                      registerCellRef={registerCellRef}
                                      className={cn(
                                        "text-center text-[10px] py-2",
                                        (key === 'currentUllage' || key === 'difference') && "border-r border-white/30"
                                      )}
                                    >
                                      {content}
                                    </NavigableCell>
                                  );
                                })}
                              </NavigableRow>
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
    </Layout>
  );
};

export default StoragePage;
