import { useState, useEffect, useMemo } from 'react';
import { useInventoryState } from '@/hooks/useInventoryState';
import { useTerminals } from '@/hooks/useTerminals';
import { useTanks } from '@/hooks/useTanks';
import { useTankCalculations } from '@/hooks/useTankCalculations';

/**
 * Custom hook to manage all state related to the storage page
 */
export const useStorageState = () => {
  // State
  const [selectedTerminalId, setSelectedTerminalId] = useState<string>();
  const [isTankFormOpen, setIsTankFormOpen] = useState(false);
  const [isNewTerminal, setIsNewTerminal] = useState(false);
  const [selectedTank, setSelectedTank] = useState<any>();

  // Hooks
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

  // Set initial terminal when terminals are loaded
  useEffect(() => {
    if (terminals.length > 0 && !selectedTerminalId) {
      setSelectedTerminalId(terminals[0].id);
    }
  }, [terminals, selectedTerminalId]);

  // Calculate tank utilization and summary
  const { calculateTankUtilization, calculateSummary } = useTankCalculations(tanks, tankMovements);
  const summaryCalculator = calculateSummary();
  
  // Sort movements by sort_order or date
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

  // Helper function to get background color class for movement rows
  const getMovementRowBgClass = (buySell?: string) => {
    return buySell === "buy" 
      ? "bg-green-900/10 hover:bg-green-900/20" 
      : "bg-red-900/10 hover:bg-red-900/20";
  };

  // Tank form handlers
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

  const handleEditTank = (tank: any) => {
    setIsNewTerminal(false);
    setSelectedTank(tank);
    setIsTankFormOpen(true);
  };

  const handleTankFormSuccess = () => {
    refetchTanks();
  };

  const handleCloseForm = () => {
    setIsTankFormOpen(false);
  };

  return {
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
    handleEditTank,
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
    
    // Other
    refetchTanks,
  };
};
