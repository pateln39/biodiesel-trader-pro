
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow } from '@/components/ui/table';
import { Filter, Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import ProductLegend from './ProductLegend';
import TerminalTabs from './TerminalTabs';
import TankHeaderSection from './TankHeaderSection';
import SummaryHeaderSection from './SummaryHeaderSection';
import ScrollableTableHeader from './ScrollableTableHeader';
import ScrollableTableBody from './ScrollableTableBody';
import SortableAssignmentList from './SortableAssignmentList';
import TankManagement from './TankManagement';
import { STICKY_COLUMN_WIDTHS } from '@/constants/StorageConstants';
import StorageLogic from '@/utils/StorageLogic';

interface StoragePageLayoutProps {
  useStorageState: any;
}

/**
 * Main layout component for the Storage Page
 */
const StoragePageLayout: React.FC<StoragePageLayoutProps> = ({ useStorageState }) => {
  const {
    // State
    selectedTerminalId,
    setSelectedTerminalId,
    isTankFormOpen,
    isNewTerminal,
    selectedTank,
    
    // Data
    terminals,
    tanks,
    movements,
    tankMovements,
    sortedMovements,
    productOptions,
    heatingOptions,
    PRODUCT_COLORS,
    
    // Calculations
    calculateTankUtilization,
    summaryCalculator,
    getMovementRowBgClass,
    
    // Form handlers
    handleAddTerminal,
    handleAddTank,
    handleTankFormSuccess,
    handleCloseForm,
    
    // Update functions
    updateTankMovement,
    updateMovementQuantity,
    updateAssignmentComments,
    updateTankProduct,
    updateTankSpec,
    updateTankHeating,
    updateTankCapacity,
    updateTankNumber,
  } = useStorageState();

  const totalStickyWidth = StorageLogic.calculateTotalStickyWidth(STICKY_COLUMN_WIDTHS);
  const currentTerminalName = StorageLogic.getCurrentTerminalName(terminals, selectedTerminalId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Storage Management</h1>
        <div className="flex items-center space-x-2">
          <TankManagement 
            selectedTerminalId={selectedTerminalId}
            terminals={terminals}
            isTankFormOpen={isTankFormOpen}
            isNewTerminal={isNewTerminal}
            selectedTank={selectedTank}
            onOpenChange={handleCloseForm}
            onFormSuccess={handleTankFormSuccess}
            onAddTerminal={handleAddTerminal}
            onAddTank={handleAddTank}
          />
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
            Storage tank management for {currentTerminalName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative border rounded-md overflow-hidden">
            <div className="flex">
              {/* Fixed Left Column Section */}
              <ScrollArea 
                className="flex-shrink-0 z-30 border-r border-white/30" 
                orientation="horizontal"
                style={{ width: `${totalStickyWidth}px` }}
              >
                <div style={{ minWidth: `${totalStickyWidth}px` }}>
                  <Table>
                    <TableHeader>
                      {/* Empty header rows to match the main table */}
                      <TableRow className="bg-muted/50 border-b border-white/10 h-12">
                        <TableHead colSpan={9} className="bg-brand-navy text-[10px]"></TableHead>
                      </TableRow>
                      <TableRow className="bg-muted/40 border-b border-white/10 h-10">
                        <TableHead colSpan={9} className="bg-brand-navy text-[10px]"></TableHead>
                      </TableRow>
                      <TableRow className="bg-muted/40 border-b border-white/10 h-14">
                        <TableHead colSpan={9} className="bg-brand-navy text-[10px]"></TableHead>
                      </TableRow>
                      <TableRow className="bg-muted/40 border-b border-white/10 h-14">
                        <TableHead colSpan={9} className="bg-brand-navy text-[10px]"></TableHead>
                      </TableRow>
                      <TableRow className="bg-muted/40 border-b border-white/10 h-8">
                        <TableHead colSpan={9} className="bg-brand-navy text-[10px]"></TableHead>
                      </TableRow>
                      <TableRow className="bg-muted/40 border-b border-white/10 h-8">
                        <TableHead colSpan={9} className="bg-brand-navy text-[10px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    
                    {selectedTerminalId && (
                      <SortableAssignmentList
                        terminalId={selectedTerminalId}
                        movements={movements}
                        updateAssignmentComments={updateAssignmentComments}
                        columnWidths={STICKY_COLUMN_WIDTHS}
                      />
                    )}
                  </Table>
                </div>
              </ScrollArea>
              
              {/* Scrollable Right Section */}
              <div className="overflow-hidden flex-grow">
                <ScrollArea className="h-[700px]" orientation="horizontal">
                  <div className="min-w-[1800px]">
                    <Table>
                      <TableHeader>
                        {/* Product Headers */}
                        <TableRow className="bg-muted/50 border-b border-white/10 h-12">
                          <TankHeaderSection 
                            tanks={tanks}
                            calculateTankUtilization={calculateTankUtilization}
                            updateTankCapacity={updateTankCapacity}
                            updateTankSpec={updateTankSpec}
                            updateTankHeating={updateTankHeating}
                            updateTankNumber={updateTankNumber}
                            updateTankProduct={updateTankProduct}
                            productOptions={productOptions}
                            heatingOptions={heatingOptions}
                            PRODUCT_COLORS={PRODUCT_COLORS}
                          />
                          
                          <SummaryHeaderSection tanks={tanks} />
                        </TableRow>
                        
                        {/* Column headers */}
                        <ScrollableTableHeader tanks={tanks} />
                      </TableHeader>
                      
                      {/* Table body */}
                      <ScrollableTableBody
                        sortedMovements={sortedMovements}
                        tanks={tanks}
                        tankMovements={tankMovements}
                        getMovementRowBgClass={getMovementRowBgClass}
                        getSummaryForMovement={summaryCalculator.getSummaryForMovement}
                        updateTankMovement={updateTankMovement}
                      />
                    </Table>
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StoragePageLayout;
