import React, { RefObject } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import SortableAssignmentList from '@/components/operations/storage/SortableAssignmentList';
import EditableDropdownField from '@/components/operations/storage/EditableDropdownField';
import EditableField from '@/components/operations/storage/EditableField';
import EditableNumberField from '@/components/operations/storage/EditableNumberField';
import KeyboardNavigableCell from '@/components/operations/storage/KeyboardNavigableCell';
import ProductLegend from '@/components/operations/storage/ProductLegend';
import TruncatedCell from '@/components/operations/storage/TruncatedCell';
import { Thermometer, Database, Plus, Wrench, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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

interface StorageGridProps {
  selectedTerminalId?: string;
  terminals: any[];
  tanks: any[];
  refetchTanks: () => void;
  movements: any[];
  tankMovements: any[];
  productOptions: any[];
  heatingOptions: any[];
  PRODUCT_COLORS: any;
  updateTankMovement: (...args: any[]) => void;
  updateMovementQuantity: (...args: any[]) => void;
  updateAssignmentComments: (...args: any[]) => void;
  updateTankProduct: (...args: any[]) => void;
  updateTankSpec: (...args: any[]) => void;
  updateTankHeating: (...args: any[]) => void;
  updateTankCapacity: (...args: any[]) => void;
  updateTankNumber: (...args: any[]) => void;
  calculateTankUtilization: (tank: any) => any;
  calculateSummary: () => any;
  gridRef: RefObject<HTMLDivElement>;
  leftPanelRef: RefObject<HTMLDivElement>;
  rightPanelRef: RefObject<HTMLDivElement>;
  contentRef: RefObject<HTMLDivElement>;
}

const StorageGrid: React.FC<StorageGridProps> = ({
  selectedTerminalId,
  terminals,
  tanks,
  refetchTanks,
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
  calculateTankUtilization,
  calculateSummary,
  gridRef,
  leftPanelRef,
  rightPanelRef,
  contentRef,
}) => {
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
  const headerRowCount = 6;

  return (
    <Card className="border-r-[3px] border-brand-lime/60 bg-gradient-to-br from-brand-navy/75 to-brand-navy/90">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Storage Movements</span>
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
                    {/* Add empty row matching heating row height */}
                    <TableRow className="bg-muted/40 border-b border-white/10 h-8">
                      <TableHead colSpan={9} className="bg-brand-navy text-[10px]">
                        <KeyboardNavigableCell row={-1.5} col={0} panel="left" className="h-full w-full">
                          <div className="text-[10px] font-bold">&nbsp;</div>
                        </KeyboardNavigableCell>
                      </TableHead>
                    </TableRow>
                    {/* Match the number of empty header rows in left panel to right panel */}
                    <TableRow className="bg-muted/50 border-b border-white/10 h-12">
                      <TableHead colSpan={9} className="bg-brand-navy text-[10px]">
                        <KeyboardNavigableCell row={-6} col={0} panel="left" className="h-full w-full">
                          <div className="text-[10px] font-bold">&nbsp;</div> {/* <-- Just space, no label */}
                        </KeyboardNavigableCell>
                      </TableHead>
                    </TableRow>
                    <TableRow className="bg-muted/40 border-b border-white/10 h-10">
                      <TableHead colSpan={9} className="bg-brand-navy text-[10px]">
                        <KeyboardNavigableCell row={-5} col={0} panel="left" className="h-full w-full">
                          <div className="text-[10px]">&nbsp;</div>
                        </KeyboardNavigableCell>
                      </TableHead>
                    </TableRow>
                    <TableRow className="bg-muted/40 border-b border-white/10 h-14">
                      <TableHead colSpan={9} className="bg-brand-navy text-[10px]">
                        <KeyboardNavigableCell row={-4} col={0} panel="left" className="h-full w-full">
                          <div className="text-[10px]">&nbsp;</div>
                        </KeyboardNavigableCell>
                      </TableHead>
                    </TableRow>
                    <TableRow className="bg-muted/40 border-b border-white/10 h-14">
                      <TableHead colSpan={9} className="bg-brand-navy text-[10px]">
                        <KeyboardNavigableCell row={-3} col={0} panel="left" className="h-full w-full">
                          <div className="text-[10px]">&nbsp;</div>
                        </KeyboardNavigableCell>
                      </TableHead>
                    </TableRow>
                    <TableRow className="bg-muted/40 border-b border-white/10 h-8">
                      <TableHead colSpan={9} className="bg-brand-navy text-[10px]">
                        <KeyboardNavigableCell row={-2} col={0} panel="left" className="h-full w-full">
                          <div className="text-[10px]">&nbsp;</div>
                        </KeyboardNavigableCell>
                      </TableHead>
                    </TableRow>
                    {/* The SortableAssignmentList component now renders the header row with KeyboardNavigableCells */}
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
                      {/* Tank product row */}
                      <TableRow className="bg-muted/50 border-b border-white/10 h-12">
                        {tanks.map((tank, tankIndex) => (
                          <TableHead 
                            key={`${tank.id}-header`}
                            colSpan={3} 
                            className={cn(
                              "text-center border-r border-white/30 bg-gradient-to-br from-brand-navy/90 to-brand-navy/70 text-white font-bold text-[10px]"
                            )}
                          >
                            <KeyboardNavigableCell 
                              row={-6} 
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
                        
                        {/* Summary and Balances headers */}
                        <TableHead 
                          colSpan={1} 
                          className="text-center border-r border-white/30 bg-gradient-to-br from-brand-navy/90 to-brand-navy/70 text-white font-bold text-[10px]"
                        >
                          <KeyboardNavigableCell 
                            row={-6} 
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
                            row={-6} 
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
                      
                      {/* Tank number row */}
                      <TableRow className="bg-muted/40 border-b border-white/10 h-10">
                        {tanks.map((tank, tankIndex) => (
                          <TableHead 
                            key={`${tank.id}-tank-number`}
                            colSpan={3} 
                            className="text-center text-[10px] border-r border-white/30"
                          >
                            <KeyboardNavigableCell 
                              row={-5} 
                              col={tankIndex * 3} 
                              panel="right" 
                              className="h-full w-full"
                              allowEditing={true}
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
                            </KeyboardNavigableCell>
                          </TableHead>
                        ))}
                        
                        {/* Summary column headers for tank number row */}
                        <TableHead 
                          colSpan={6} 
                          className="text-center text-[10px] border-r border-white/30"
                        >
                          <KeyboardNavigableCell 
                            row={-5} 
                            col={tanks.length * 3} 
                            panel="right" 
                            className="h-full w-full"
                          >
                            <div></div>
                          </KeyboardNavigableCell>
                        </TableHead>
                      </TableRow>
                      
                      {/* Capacity MT row */}
                      <TableRow className="bg-muted/40 border-b border-white/10 h-14">
                        {tanks.map((tank, tankIndex) => (
                          <TableHead 
                            key={`${tank.id}-capacity`}
                            colSpan={3} 
                            className="text-[10px] border-r border-white/30"
                          >
                            <KeyboardNavigableCell 
                              row={-4} 
                              col={tankIndex * 3} 
                              panel="right" 
                              className="h-full w-full"
                              allowEditing={true}
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
                            </KeyboardNavigableCell>
                          </TableHead>
                        ))}
                        
                        {/* Summary for capacity MT row */}
                        <TableHead 
                          colSpan={6} 
                          className="text-[10px] border-r border-white/30"
                        >
                          <KeyboardNavigableCell 
                            row={-4} 
                            col={tanks.length * 3} 
                            panel="right" 
                            className="h-full w-full"
                          >
                            <div className="flex items-center h-full px-2">
                              <span>Total Capacity: {Object.values(tanks).reduce((sum, tank) => sum + tank.capacity_mt, 0).toFixed(2)} MT</span>
                            </div>
                          </KeyboardNavigableCell>
                        </TableHead>
                      </TableRow>
                      
                      {/* Capacity M3 row */}
                      <TableRow className="bg-muted/40 border-b border-white/10 h-14">
                        {tanks.map((tank, tankIndex) => (
                          <TableHead 
                            key={`${tank.id}-capacity-m3`}
                            colSpan={3} 
                            className="text-[10px] border-r border-white/30"
                          >
                            <KeyboardNavigableCell 
                              row={-3} 
                              col={tankIndex * 3} 
                              panel="right" 
                              className="h-full w-full"
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
                            </KeyboardNavigableCell>
                          </TableHead>
                        ))}
                        
                        {/* Summary for capacity M3 row */}
                        <TableHead 
                          colSpan={6} 
                          className="text-[10px] border-r border-white/30"
                        >
                          <KeyboardNavigableCell 
                            row={-3} 
                            col={tanks.length * 3} 
                            panel="right" 
                            className="h-full w-full"
                          >
                            <div className="flex items-center h-full px-2">
                              <span>Total Capacity: {Object.values(tanks).reduce((sum, tank) => sum + tank.capacity_m3, 0).toFixed(2)} M³</span>
                            </div>
                          </KeyboardNavigableCell>
                        </TableHead>
                      </TableRow>
                      
                      {/* The remaining rows are unchanged */}
                      {/* Spec row */}
                      <TableRow className="bg-muted/40 border-b border-white/10 h-8">
                        {tanks.map((tank, tankIndex) => (
                          <TableHead 
                            key={`${tank.id}-spec`}
                            colSpan={3} 
                            className="text-[10px] border-r border-white/30"
                          >
                            <KeyboardNavigableCell 
                              row={-2} 
                              col={tankIndex * 3} 
                              panel="right" 
                              className="h-full w-full"
                              allowEditing={true}
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
                            </KeyboardNavigableCell>
                          </TableHead>
                        ))}
                        
                        {/* Empty space for spec row */}
                        <TableHead 
                          colSpan={6} 
                          className="text-[10px] border-r border-white/30"
                        >
                          <KeyboardNavigableCell 
                            row={-2} 
                            col={tanks.length * 3} 
                            panel="right" 
                            className="h-full w-full"
                          >
                            <div></div>
                          </KeyboardNavigableCell>
                        </TableHead>
                      </TableRow>
                      
                      {/* Heating row */}
                      <TableRow className="bg-muted/40 border-b border-white/10 h-8">
                        {tanks.map((tank, tankIndex) => (
                          <TableHead 
                            key={`${tank.id}-heating`}
                            colSpan={3} 
                            className="text-[10px] border-r border-white/30"
                          >
                            <KeyboardNavigableCell 
                              row={-1.5} 
                              col={tankIndex * 3} 
                              panel="right" 
                              className="h-full w-full"
                              allowEditing={true}
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
                            </KeyboardNavigableCell>
                          </TableHead>
                        ))}
                        
                        {/* Empty space for heating row */}
                        <TableHead 
                          colSpan={6} 
                          className="text-[10px] border-r border-white/30"
                        >
                          <KeyboardNavigableCell 
                            row={-1.5} 
                            col={tanks.length * 3} 
                            panel="right" 
                            className="h-full w-full"
                          >
                            <div></div>
                          </KeyboardNavigableCell>
                        </TableHead>
                      </TableRow>
                      
                      {/* Column headers row */}
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
                        
                        {/* Summary column headers */}
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
                            
                            {/* 1. Total MT */}
                            <TableCell className="text-center text-[10px] py-2">
                              <KeyboardNavigableCell 
                                row={rowIndex} 
                                col={tanks.length * 3} 
                                panel="right" 
                                className="h-full w-full"
                              >
                                <div className="flex items-center justify-center space-x-1">
                                  <span>{Math.round(movementSummary.totalMTMoved)}</span>
                                  {Math.round(movementSummary.totalMTMoved) !== Math.round(movement.assignment_quantity || 0) && (
                                    <Badge 
                                      variant="outline" 
                                      className="bg-yellow-100 text-yellow-800 border-yellow-300 px-1 py-0 text-[8px] rounded-full"
                                    >
                                      !
                                    </Badge>
                                  )}
                                </div>
                              </KeyboardNavigableCell>
                            </TableCell>
                            {/* 2. Total M3 */}
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
                            {/* 3. T1 */}
                            <TableCell className="text-center text-[10px]
