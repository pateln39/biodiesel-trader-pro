import React from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Filter, Thermometer, Database, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useInventoryState } from '@/hooks/useInventoryState';
import { Button } from '@/components/ui/button';
import EditableField from '@/components/operations/inventory/EditableField';
import EditableNumberField from '@/components/operations/inventory/EditableNumberField';
import EditableDropdownField from '@/components/operations/inventory/EditableDropdownField';
import ProductToken from '@/components/operations/inventory/ProductToken';
import ProductLegend from '@/components/operations/inventory/ProductLegend';
import { useTerminals } from '@/hooks/useTerminals';
import { useTanks, Tank } from '@/hooks/useTanks';
import TerminalTabs from '@/components/operations/inventory/TerminalTabs';
import TankForm from '@/components/operations/inventory/TankForm';

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
  const [selectedTerminalId, setSelectedTerminalId] = React.useState<string>();
  const [isTankFormOpen, setIsTankFormOpen] = React.useState(false);
  const [isNewTerminal, setIsNewTerminal] = React.useState(false);
  const [selectedTank, setSelectedTank] = React.useState<Tank>();

  const { terminals } = useTerminals();
  const { tanks, refetchTanks } = useTanks(selectedTerminalId);
  const { 
    movements,
    productOptions,
    heatingOptions,
    PRODUCT_COLORS,
    updateMovementQuantity,
    updateMovementComments,
    updateTankProduct,
    updateTankSpec,
    updateTankHeating,
    updateTankCapacity
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
        
        {/* Terminal tabs */}
        <TerminalTabs
          terminals={terminals}
          selectedTerminalId={selectedTerminalId}
          onTerminalChange={setSelectedTerminalId}
          onAddTerminal={handleAddTerminal}
        />
        
        {/* Inventory table */}
        <Card className="border-r-[3px] border-brand-lime/60 bg-gradient-to-br from-brand-navy/75 to-brand-navy/90">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Inventory Movements</span>
              {selectedTerminalId && (
                <Button variant="outline" size="sm" onClick={handleAddTank}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Tank
                </Button>
              )}
            </CardTitle>
            <CardDescription>
              Tank inventory management for {terminals.find(t => t.id === selectedTerminalId)?.name || 'selected terminal'}
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                        {movements.map((movement, index) => {
                          // Determine the background color for the row based on buy/sell
                          const bgColorClass = movement.buy_sell === "buy" 
                            ? "bg-green-900/10 hover:bg-green-900/20" 
                            : "bg-red-900/10 hover:bg-red-900/20";
                          
                          return (
                            <TableRow 
                              key={`sticky-${movement.id}`} 
                              className={cn("border-b border-white/5 h-10", bgColorClass)}
                            >
                              <TableCell className="bg-brand-navy text-[10px] py-2">
                                <TruncatedCell 
                                  text={movement.counterparty} 
                                  width={stickyColumnWidths.counterparty - 16} 
                                  className="font-medium text-[10px]"
                                />
                              </TableCell>
                              <TableCell className="bg-brand-navy text-[10px] py-2">
                                <TruncatedCell 
                                  text={movement.trade_reference} 
                                  width={stickyColumnWidths.tradeRef - 16} 
                                  className="text-[10px]"
                                />
                              </TableCell>
                              <TableCell className="bg-brand-navy text-[10px] py-2">
                                <TruncatedCell 
                                  text={movement.barge_name} 
                                  width={stickyColumnWidths.bargeName - 16} 
                                  className="text-[10px]"
                                />
                              </TableCell>
                              <TableCell className="bg-brand-navy text-[10px] py-2">
                                <TruncatedCell 
                                  text={movement.inventory_movement_date ? new Date(movement.inventory_movement_date).toLocaleDateString() : '-'} 
                                  width={stickyColumnWidths.movementDate - 16} 
                                  className="text-[10px]"
                                />
                              </TableCell>
                              <TableCell className="bg-brand-navy text-[10px] py-2">
                                <TruncatedCell 
                                  text={movement.nomination_valid ? new Date(movement.nomination_valid).toLocaleDateString() : '-'}
                                  width={stickyColumnWidths.nominationDate - 16} 
                                  className="text-[10px]"
                                />
                              </TableCell>
                              <TableCell className="bg-brand-navy text-[10px] py-2">
                                <span className={cn(
                                  "px-1 py-0.5 rounded-full text-[10px] font-medium truncate block",
                                  movement.customs_status === "T1" 
                                    ? "bg-green-900/60 text-green-200" 
                                    : "bg-blue-900/60 text-blue-200"
                                )} style={{ maxWidth: `${stickyColumnWidths.customs - 16}px` }}>
                                  {movement.customs_status}
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
                                  onSave={(value) => updateMovementComments(movement.id, value)}
                                  maxWidth={stickyColumnWidths.comments - 16}
                                  className="text-[10px]"
                                  placeholder="Add comments..."
                                />
                              </TableCell>
                              <TableCell className="bg-brand-navy text-[10px] py-2 border-r border-white/30">
                                {movement.scheduled_quantity !== 0 && (
                                  <div className="flex justify-center">
                                    <ProductToken 
                                      product={movement.product}
                                      value={`${movement.buy_sell === "buy" ? "+" : "-"}${movement.scheduled_quantity}`}
                                    />
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
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
                            {Object.keys(tanks).map((tankId) => (
                              <TableHead 
                                key={`${tankId}-header`}
                                colSpan={3} 
                                className={cn(
                                  "text-center border-r border-white/30 bg-gradient-to-br from-brand-navy/90 to-brand-navy/70 text-white font-bold text-[10px]"
                                )}
                              >
                                <EditableDropdownField
                                  initialValue={tanks[tankId].current_product}
                                  options={productOptions}
                                  onSave={(value) => updateTankProduct(tankId, value)}
                                  className={cn(
                                    "text-[10px] font-bold text-center w-full",
                                    PRODUCT_COLORS[tanks[tankId].current_product]?.split(' ')[0] // Extract just the background color
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
                          </TableRow>
                          
                          {/* Tank Numbers */}
                          <TableRow className="bg-muted/40 border-b border-white/10 h-10">
                            {Object.keys(tanks).map((tankId) => (
                              <TableHead 
                                key={`${tankId}-tank-number`}
                                colSpan={3} 
                                className="text-center text-[10px] border-r border-white/30"
                              >
                                Tank {tanks[tankId].tank_number}
                              </TableHead>
                            ))}
                            
                            {/* Blank cells for the 6 new columns */}
                            <TableHead 
                              colSpan={6} 
                              className="text-center text-[10px] border-r border-white/30"
                            ></TableHead>
                          </TableRow>
                          
                          {/* Capacity MT - Now editable */}
                          <TableRow className="bg-muted/40 border-b border-white/10 h-14">
                            {Object.keys(tanks).map((tankId) => (
                              <TableHead 
                                key={`${tankId}-capacity`}
                                colSpan={3} 
                                className="text-[10px] border-r border-white/30"
                              >
                                <div className="flex justify-between items-center px-2">
                                  <span>Capacity: </span>
                                  <div className="flex items-center">
                                    <EditableNumberField
                                      initialValue={tanks[tankId].capacity_mt}
                                      onSave={(value) => updateTankCapacity(tankId, value)}
                                      className="text-[10px] w-20"
                                    /> MT
                                    <Database className="h-3 w-3 text-brand-lime/70 ml-2" />
                                  </div>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2 mt-1 mx-2">
                                  <div 
                                    className="bg-brand-lime h-2 rounded-full" 
                                    style={{ 
                                      width: `${Math.min(
                                        (100)
                                        ,
                                        100
                                      )}%` 
                                    }}
                                  ></div>
                                </div>
                                <div className="flex justify-between px-2 mt-1">
                                  <span className="text-[9px] text-muted-foreground">
                                    0 MT
                                  </span>
                                  <span className="text-[9px] text-muted-foreground">
                                    0%
                                  </span>
                                </div>
                              </TableHead>
                            ))}
                            
                            {/* Summary row data */}
                            <TableHead 
                              colSpan={6} 
                              className="text-[10px] border-r border-white/30"
                            >
                              <div className="flex items-center h-full px-2">
                                <span>Total Capacity: {Object.values(tanks).reduce((sum, tank) => sum + tank.capacity_mt, 0)} MT</span>
                              </div>
                            </TableHead>
                          </TableRow>
                          
                          {/* Capacity M³ */}
                          <TableRow className="bg-muted/40 border-b border-white/10 h-14">
                            {Object.keys(tanks).map((tankId) => (
                              <TableHead 
                                key={`${tankId}-capacity-m3`}
                                colSpan={3} 
                                className="text-[10px] border-r border-white/30"
                              >
                                <div className="flex justify-between items-center px-2">
                                  <span>Capacity: {tanks[tankId].capacity_m3} M³</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2 mt-1 mx-2">
                                  <div 
                                    className="bg-brand-blue h-2 rounded-full" 
                                    style={{ 
                                      width: `${Math.min(
                                        (100)
                                        ,
                                        100
                                      )}%` 
                                    }}
                                  ></div>
                                </div>
                                <div className="flex justify-between px-2 mt-1">
                                  <span className="text-[9px] text-muted-foreground">
                                    0 M³
                                  </span>
                                  <span className="text-[9px] text-muted-foreground">
                                    0%
                                  </span>
                                </div>
                              </TableHead>
                            ))}
                            
                            {/* M³ Summary row data */}
                            <TableHead 
                              colSpan={6} 
                              className="text-[10px] border-r border-white/30"
                            >
                              <div className="flex items-center h-full px-2">
                                <span>Total Capacity: {Object.values(tanks).reduce((sum, tank) => sum + tank.capacity_m3, 0)} M³</span>
                              </div>
                            </TableHead>
                          </TableRow>
                          
                          {/* Spec - now editable */}
                          <TableRow className="bg-muted/40 border-b border-white/10 h-8">
                            {Object.keys(tanks).map((tankId) => (
                              <TableHead 
                                key={`${tankId}-spec`}
                                colSpan={3} 
                                className="text-[10px] border-r border-white/30"
                              >
                                <div className="flex justify-between px-2">
                                  <span className="text-muted-foreground">Spec:</span>
                                  <EditableField
                                    initialValue={tanks[tankId].spec}
                                    onSave={(value) => updateTankSpec(tankId, value)}
                                    className="text-[10px]"
                                    maxWidth={100}
                                  />
                                </div>
                              </TableHead>
                            ))}
                            
                            {/* Blank cells for the 6 new columns */}
                            <TableHead 
                              colSpan={6} 
                              className="text-[10px] border-r border-white/30"
                            ></TableHead>
                          </TableRow>
                          
                          {/* Heating - now editable as dropdown */}
                          <TableRow className="bg-muted/40 border-b border-white/10 h-8">
                            {Object.keys(tanks).map((tankId) => (
                              <TableHead 
                                key={`${tankId}-heating`}
                                colSpan={3} 
                                className="text-[10px] border-r border-white/30"
                              >
                                <div className="flex justify-between px-2">
                                  <span className="text-muted-foreground">Heating:</span>
                                  <div className="flex items-center">
                                    <Thermometer className="h-3 w-3 mr-1 text-red-400" />
                                    <EditableDropdownField
                                      initialValue={tanks[tankId].is_heating_enabled ? "true" : "false"}
                                      options={heatingOptions}
                                      onSave={(value) => updateTankHeating(tankId, value)}
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
                          </TableRow>
                          
                          {/* Column headers for tank details and new summary columns */}
                          <TableRow className="bg-muted/50 border-b border-white/10 h-10">
                            {Object.keys(tanks).map((tankId) => (
                              <React.Fragment key={tankId}>
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
                          </TableRow>
                        </TableHeader>
                        
                        <TableBody>
                          {movements.map((movement, index) => {
                            // Determine the background color for the row based on buy/sell
                            const bgColorClass = movement.buy_sell === "buy" 
                              ? "bg-green-900/10 hover:bg-green-900/20" 
                              : "bg-red-900/10 hover:bg-red-900/20";
                            
                            return (
                              <TableRow 
                                key={`scroll-${movement.id}`} 
                                className={cn("border-b border-white/5 h-10", bgColorClass)}
                              >
                                {/* Tank movement and balance columns */}
                                {Object.keys(tanks).map((tankId) => (
                                  <React.Fragment key={`${movement.id}-${tankId}`}>
                                    <TableCell className="text-center text-[10px] py-2">
                                      <EditableNumberField
                                        initialValue={0}
                                        onSave={(value) => {
                                          // TODO: Implement updateMovementQuantity here
                                          console.log('Update movement quantity:', value);
                                        }}
                                        className="text-[10px] w-16"
                                        product={tanks[tankId].current_product}
                                      />
                                    </TableCell>
                                    <TableCell className="text-center text-[10px] py-2">
                                      0
                                    </TableCell>
                                    <TableCell className="text-center text-[10px] py-2 bg-brand-navy border-r border-white/30">
                                      0
                                    </TableCell>
                                  </React.Fragment>
                                ))}
                                
                                {/* New summary columns */}
                                <TableCell className="text-center text-[10px] py-2">0</TableCell>
                                <TableCell className="text-center text-[10px] py-2">0</TableCell>
                                <TableCell className="text-center text-[10px] py-2 font-medium text-green-400">0</TableCell>
                                <TableCell className="text-center text-[10px] py-2 font-medium text-blue-400">0</TableCell>
                                <TableCell className="text-center text-[10px] py-2 font-medium">0</TableCell>
                                <TableCell className="text-center text-[10px] py-2 font-medium border-r border-white/30">0</TableCell>
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
    </Layout>
  );
};

export default InventoryPage;
