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
import StorageToolbar from '@/components/operations/storage/StorageToolbar';
import StorageGrid from '@/components/operations/storage/StorageGrid';

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
  const headerRowCount = 6;

  return (
    <Layout>
      <KeyboardNavigationProvider>
        <div>
          <StorageToolbar
            terminals={terminals}
            selectedTerminalId={selectedTerminalId}
            onTerminalChange={setSelectedTerminalId}
            onAddTerminal={handleAddTerminal}
            onMaintenance={handleMaintenance}
            onAddTank={handleAddTank}
          />
          <StorageGrid
            selectedTerminalId={selectedTerminalId}
            terminals={terminals}
            tanks={tanks}
            refetchTanks={refetchTanks}
            movements={movements}
            tankMovements={tankMovements}
            productOptions={productOptions}
            heatingOptions={heatingOptions}
            PRODUCT_COLORS={PRODUCT_COLORS}
            updateTankMovement={updateTankMovement}
            updateMovementQuantity={updateMovementQuantity}
            updateAssignmentComments={updateAssignmentComments}
            updateTankProduct={updateTankProduct}
            updateTankSpec={updateTankSpec}
            updateTankHeating={updateTankHeating}
            updateTankCapacity={updateTankCapacity}
            updateTankNumber={updateTankNumber}
            calculateTankUtilization={calculateTankUtilization}
            calculateSummary={calculateSummary}
            gridRef={gridRef}
            leftPanelRef={leftPanelRef}
            rightPanelRef={rightPanelRef}
            contentRef={contentRef}
          />
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
            headerRowCount={headerRowCount}
          />
        </div>
      </KeyboardNavigationProvider>
    </Layout>
  );
};

export default StoragePage;
