
import { useState, useMemo } from 'react';
import { Product } from '@/types';

// Types for inventory state management
export interface Tank {
  product: Product;
  capacity: number;
  capacityM3: number;
  tankNumber: string;
  spec: string;
  heating: boolean;
}

export interface TankMovement {
  quantity: number;
  balance: number;
  balanceM3: number;
  productAtTimeOfMovement: Product; // New field to track historical product
}

export interface Movement {
  id: string;
  counterpartyName: string;
  tradeReference: string;
  bargeName: string;
  movementDate: Date;
  nominationValid: Date;
  customsStatus: string;
  sustainability: string;
  comments: string;
  buySell: 'buy' | 'sell';
  scheduledQuantity: number;
  tanks: {
    [tankId: string]: TankMovement;
  };
}

// Interface for row totals
export interface RowTotals {
  totalMT: number;
  totalM3: number;
  t1Balance: number;
  t2Balance: number;
  currentStock: number;
  currentUllage: number;
}

// Product color mapping for tokens
export const PRODUCT_COLORS = {
  'UCOME': 'bg-red-500 text-white',
  'RME': 'bg-purple-500 text-white',
  'FAME0': 'bg-yellow-500 text-black',
  'HVO': 'bg-blue-500 text-white',
  'RME DC': 'bg-green-500 text-white',
  'UCOME-5': 'bg-orange-500 text-white'
};

// Mock data - in a real app this would come from API
const initialTankDetails: { [key: string]: Tank } = {
  "tank1": {
    product: "UCOME",
    capacity: 5000,
    capacityM3: 5500,
    tankNumber: "T125",
    spec: "CFPP +2; W 370; S 21.6; TC 32",
    heating: true
  },
  "tank2": {
    product: "RME",
    capacity: 3000,
    capacityM3: 3300,
    tankNumber: "T241",
    spec: "CFPP +2; W 370; S 21.6; TC 32",
    heating: true
  },
  "tank3": {
    product: "FAME0",
    capacity: 2500,
    capacityM3: 2750,
    tankNumber: "T369",
    spec: "CFPP +2; W 370; S 21.6; TC 32",
    heating: true
  },
  "tank4": {
    product: "HVO",
    capacity: 2000,
    capacityM3: 2200,
    tankNumber: "T482",
    spec: "CFPP +2; W 370; S 21.6; TC 32",
    heating: true
  },
  "tank5": {
    product: "RME DC",
    capacity: 1500,
    capacityM3: 1650,
    tankNumber: "T513",
    spec: "CFPP +2; W 370; S 21.6; TC 32",
    heating: true
  },
  "tank6": {
    product: "UCOME-5",
    capacity: 2000,
    capacityM3: 2200,
    tankNumber: "T649",
    spec: "CFPP +2; W 370; S 21.6; TC 32",
    heating: true
  }
};

// Mock movement data with updated customs status to only T1 or T2
const initialMovements: Movement[] = [
  {
    id: "1",
    counterpartyName: "BioFuel Partners",
    tradeReference: "TR-2025-0123",
    bargeName: "Horizon Trader",
    movementDate: new Date('2025-04-05'),
    nominationValid: new Date('2025-04-10'),
    customsStatus: "T1",
    sustainability: "ISCC",
    comments: "Regular delivery",
    buySell: "buy",
    scheduledQuantity: 1000,
    tanks: {
      "tank1": { quantity: 800, balance: 2800, balanceM3: 3080, productAtTimeOfMovement: "UCOME" },
      "tank2": { quantity: 200, balance: 1200, balanceM3: 1320, productAtTimeOfMovement: "RME" },
      "tank3": { quantity: 0, balance: 500, balanceM3: 550, productAtTimeOfMovement: "FAME0" },
      "tank4": { quantity: 0, balance: 300, balanceM3: 330, productAtTimeOfMovement: "HVO" },
      "tank5": { quantity: 0, balance: 400, balanceM3: 440, productAtTimeOfMovement: "RME DC" },
      "tank6": { quantity: 0, balance: 600, balanceM3: 660, productAtTimeOfMovement: "UCOME-5" },
    }
  },
  {
    id: "2",
    counterpartyName: "GreenEnergy Corp",
    tradeReference: "TR-2025-0124",
    bargeName: "Eco Voyager",
    movementDate: new Date('2025-04-07'),
    nominationValid: new Date('2025-04-12'),
    customsStatus: "T1",
    sustainability: "ISCC EU",
    comments: "Priority shipment",
    buySell: "buy",
    scheduledQuantity: 750,
    tanks: {
      "tank1": { quantity: 0, balance: 2800, balanceM3: 3080, productAtTimeOfMovement: "UCOME" },
      "tank2": { quantity: 0, balance: 1200, balanceM3: 1320, productAtTimeOfMovement: "RME" },
      "tank3": { quantity: 750, balance: 1250, balanceM3: 1375, productAtTimeOfMovement: "FAME0" },
      "tank4": { quantity: 0, balance: 300, balanceM3: 330, productAtTimeOfMovement: "HVO" },
      "tank5": { quantity: 0, balance: 400, balanceM3: 440, productAtTimeOfMovement: "RME DC" },
      "tank6": { quantity: 0, balance: 600, balanceM3: 660, productAtTimeOfMovement: "UCOME-5" },
    }
  },
  {
    id: "3",
    counterpartyName: "EcoFuels Ltd",
    tradeReference: "TR-2025-0125",
    bargeName: "Clean Venture",
    movementDate: new Date('2025-04-09'),
    nominationValid: new Date('2025-04-14'),
    customsStatus: "T2",
    sustainability: "ISCC",
    comments: "",
    buySell: "sell",
    scheduledQuantity: 500,
    tanks: {
      "tank1": { quantity: -300, balance: 2500, balanceM3: 2750, productAtTimeOfMovement: "UCOME" },
      "tank2": { quantity: 0, balance: 1200, balanceM3: 1320, productAtTimeOfMovement: "RME" },
      "tank3": { quantity: 0, balance: 1250, balanceM3: 1375, productAtTimeOfMovement: "FAME0" },
      "tank4": { quantity: -200, balance: 100, balanceM3: 110, productAtTimeOfMovement: "HVO" },
      "tank5": { quantity: 0, balance: 400, balanceM3: 440, productAtTimeOfMovement: "RME DC" },
      "tank6": { quantity: 0, balance: 600, balanceM3: 660, productAtTimeOfMovement: "UCOME-5" },
    }
  },
  {
    id: "4",
    counterpartyName: "Renewable Solutions",
    tradeReference: "TR-2025-0126",
    bargeName: "Green Pioneer",
    movementDate: new Date('2025-04-12'),
    nominationValid: new Date('2025-04-17'),
    customsStatus: "T2",
    sustainability: "ISCC PLUS",
    comments: "Special handling required",
    buySell: "sell",
    scheduledQuantity: 600,
    tanks: {
      "tank1": { quantity: 0, balance: 2500, balanceM3: 2750, productAtTimeOfMovement: "UCOME" },
      "tank2": { quantity: -200, balance: 1000, balanceM3: 1100, productAtTimeOfMovement: "RME" },
      "tank3": { quantity: 0, balance: 1250, balanceM3: 1375, productAtTimeOfMovement: "FAME0" },
      "tank4": { quantity: 0, balance: 100, balanceM3: 110, productAtTimeOfMovement: "HVO" },
      "tank5": { quantity: 0, balance: 400, balanceM3: 440, productAtTimeOfMovement: "RME DC" },
      "tank6": { quantity: -400, balance: 200, balanceM3: 220, productAtTimeOfMovement: "UCOME-5" },
    }
  },
  {
    id: "5",
    counterpartyName: "SustainOil Inc",
    tradeReference: "TR-2025-0127",
    bargeName: "Eco Wave",
    movementDate: new Date('2025-04-15'),
    nominationValid: new Date('2025-04-20'),
    customsStatus: "T1",
    sustainability: "ISCC",
    comments: "",
    buySell: "buy",
    scheduledQuantity: 1200,
    tanks: {
      "tank1": { quantity: 500, balance: 3000, balanceM3: 3300, productAtTimeOfMovement: "UCOME" },
      "tank2": { quantity: 300, balance: 1300, balanceM3: 1430, productAtTimeOfMovement: "RME" },
      "tank3": { quantity: 400, balance: 1650, balanceM3: 1815, productAtTimeOfMovement: "FAME0" },
      "tank4": { quantity: 0, balance: 100, balanceM3: 110, productAtTimeOfMovement: "HVO" },
      "tank5": { quantity: 0, balance: 400, balanceM3: 440, productAtTimeOfMovement: "RME DC" },
      "tank6": { quantity: 0, balance: 200, balanceM3: 220, productAtTimeOfMovement: "UCOME-5" },
    }
  }
];

export const useInventoryState = () => {
  const [movements, setMovements] = useState<Movement[]>(initialMovements);
  const [tanks, setTanks] = useState<{ [key: string]: Tank }>(initialTankDetails);
  
  // Calculate total capacity for all tanks
  const totalTankCapacity = useMemo(() => {
    return Object.values(tanks).reduce((sum, tank) => sum + tank.capacity, 0);
  }, [tanks]);
  
  // Calculate row totals for each movement
  const rowTotals = useMemo(() => {
    // Initialize running T1 and T2 balances
    let runningT1Balance = 0;
    let runningT2Balance = 0;
    
    return movements.map(movement => {
      // Calculate total MT and M3 across all tanks for this movement
      let totalMT = 0;
      let totalM3 = 0;
      let currentStock = 0;
      
      // Sum up all tank quantities and balances
      Object.values(movement.tanks).forEach(tank => {
        totalMT += tank.quantity;
        // For M3, we'll approximate based on the same 1.1 ratio used elsewhere
        totalM3 += Math.round(tank.quantity * 1.1);
        currentStock += tank.balance;
      });
      
      // Update running T1/T2 balances based on customs status
      if (movement.customsStatus === "T1") {
        runningT1Balance += totalMT;
      } else if (movement.customsStatus === "T2") {
        runningT2Balance += totalMT;
      }
      
      // Calculate current ullage
      const currentUllage = totalTankCapacity - currentStock;
      
      return {
        totalMT,
        totalM3,
        t1Balance: runningT1Balance,
        t2Balance: runningT2Balance,
        currentStock,
        currentUllage
      };
    });
  }, [movements, totalTankCapacity]);
  
  // List of available products for dropdown
  const productOptions = useMemo(() => {
    return [
      { label: "UCOME", value: "UCOME" },
      { label: "RME", value: "RME" },
      { label: "FAME0", value: "FAME0" }, 
      { label: "HVO", value: "HVO" },
      { label: "RME DC", value: "RME DC" },
      { label: "UCOME-5", value: "UCOME-5" }
    ];
  }, []);

  // List of heating options for dropdown
  const heatingOptions = useMemo(() => {
    return [
      { label: "Yes", value: "true" },
      { label: "No", value: "false" }
    ];
  }, []);

  // Update movement quantity for a specific tank and recalculate balances
  const updateMovementQuantity = (movementId: string, tankId: string, newQuantity: number) => {
    setMovements(prevMovements => {
      const movementIndex = prevMovements.findIndex(m => m.id === movementId);
      if (movementIndex === -1) return prevMovements;

      const oldQuantity = prevMovements[movementIndex].tanks[tankId].quantity;
      const quantityDiff = newQuantity - oldQuantity;
      
      // Create a deep copy of movements to avoid mutation
      const updatedMovements = [...prevMovements];
      
      // Update the quantity for this movement
      updatedMovements[movementIndex] = {
        ...updatedMovements[movementIndex],
        tanks: {
          ...updatedMovements[movementIndex].tanks,
          [tankId]: {
            ...updatedMovements[movementIndex].tanks[tankId],
            quantity: newQuantity
          }
        }
      };
      
      // Update the balance for this movement and all subsequent movements
      for (let i = movementIndex; i < updatedMovements.length; i++) {
        const movement = updatedMovements[i];
        
        // Only update the balance for the affected tank
        if (i === movementIndex) {
          movement.tanks[tankId].balance += quantityDiff;
          movement.tanks[tankId].balanceM3 = Math.round(movement.tanks[tankId].balance * 1.1); // Approximate conversion
        } else {
          // For subsequent movements, propagate the balance change
          movement.tanks[tankId].balance += quantityDiff;
          movement.tanks[tankId].balanceM3 = Math.round(movement.tanks[tankId].balance * 1.1); // Approximate conversion
        }
      }
      
      return updatedMovements;
    });
  };

  // Update comments for a movement
  const updateMovementComments = (movementId: string, newComments: string) => {
    setMovements(prevMovements => {
      const movementIndex = prevMovements.findIndex(m => m.id === movementId);
      if (movementIndex === -1) return prevMovements;
      
      const updatedMovements = [...prevMovements];
      updatedMovements[movementIndex] = {
        ...updatedMovements[movementIndex],
        comments: newComments
      };
      
      return updatedMovements;
    });
  };

  // Update tank product
  const updateTankProduct = (tankId: string, newProduct: string) => {
    setTanks(prevTanks => ({
      ...prevTanks,
      [tankId]: {
        ...prevTanks[tankId],
        product: newProduct as Product
      }
    }));
  };

  // Update tank spec
  const updateTankSpec = (tankId: string, newSpec: string) => {
    setTanks(prevTanks => ({
      ...prevTanks,
      [tankId]: {
        ...prevTanks[tankId],
        spec: newSpec
      }
    }));
  };

  // Update tank heating
  const updateTankHeating = (tankId: string, newHeating: string) => {
    setTanks(prevTanks => ({
      ...prevTanks,
      [tankId]: {
        ...prevTanks[tankId],
        heating: newHeating === 'true'
      }
    }));
  };

  return {
    movements,
    tanks,
    rowTotals,
    totalTankCapacity,
    productOptions,
    heatingOptions,
    PRODUCT_COLORS,
    updateMovementQuantity,
    updateMovementComments,
    updateTankProduct,
    updateTankSpec,
    updateTankHeating
  };
};
