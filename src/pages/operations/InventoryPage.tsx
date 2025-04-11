import React, { useRef, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Product } from '@/types';
import { Database, Filter, Thermometer } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock data for inventory movements
const mockInventoryMovements = [
  {
    id: "1",
    counterpartyName: "BioFuel Partners",
    tradeReference: "TR-2025-0123",
    bargeName: "Horizon Trader",
    movementDate: new Date('2025-04-05'),
    nominationValid: new Date('2025-04-10'),
    customsStatus: "cleared",
    sustainability: "ISCC",
    comments: "Regular delivery",
    buySell: "buy",
    scheduledQuantity: 1000,
    product: "UCOME",
    tanks: {
      "UCOME": { quantity: 800, balance: 2800, balanceM3: 3080 },
      "RME": { quantity: 200, balance: 1200, balanceM3: 1320 },
      "FAME0": { quantity: 0, balance: 500, balanceM3: 550 },
      "HVO": { quantity: 0, balance: 300, balanceM3: 330 },
      "RME DC": { quantity: 0, balance: 400, balanceM3: 440 },
      "UCOME-5": { quantity: 0, balance: 600, balanceM3: 660 },
    }
  },
  {
    id: "2",
    counterpartyName: "GreenEnergy Corp",
    tradeReference: "TR-2025-0124",
    bargeName: "Eco Voyager",
    movementDate: new Date('2025-04-07'),
    nominationValid: new Date('2025-04-12'),
    customsStatus: "pending",
    sustainability: "ISCC EU",
    comments: "Priority shipment",
    buySell: "buy",
    scheduledQuantity: 750,
    product: "FAME0",
    tanks: {
      "UCOME": { quantity: 0, balance: 2800, balanceM3: 3080 },
      "RME": { quantity: 0, balance: 1200, balanceM3: 1320 },
      "FAME0": { quantity: 750, balance: 1250, balanceM3: 1375 },
      "HVO": { quantity: 0, balance: 300, balanceM3: 330 },
      "RME DC": { quantity: 0, balance: 400, balanceM3: 440 },
      "UCOME-5": { quantity: 0, balance: 600, balanceM3: 660 },
    }
  },
  {
    id: "3",
    counterpartyName: "EcoFuels Ltd",
    tradeReference: "TR-2025-0125",
    bargeName: "Clean Venture",
    movementDate: new Date('2025-04-09'),
    nominationValid: new Date('2025-04-14'),
    customsStatus: "cleared",
    sustainability: "ISCC",
    comments: "",
    buySell: "sell",
    scheduledQuantity: 500,
    product: "HVO",
    tanks: {
      "UCOME": { quantity: -300, balance: 2500, balanceM3: 2750 },
      "RME": { quantity: 0, balance: 1200, balanceM3: 1320 },
      "FAME0": { quantity: 0, balance: 1250, balanceM3: 1375 },
      "HVO": { quantity: -200, balance: 100, balanceM3: 110 },
      "RME DC": { quantity: 0, balance: 400, balanceM3: 440 },
      "UCOME-5": { quantity: 0, balance: 600, balanceM3: 660 },
    }
  },
  {
    id: "4",
    counterpartyName: "Renewable Solutions",
    tradeReference: "TR-2025-0126",
    bargeName: "Green Pioneer",
    movementDate: new Date('2025-04-12'),
    nominationValid: new Date('2025-04-17'),
    customsStatus: "T1",
    sustainability: "ISCC PLUS",
    comments: "Special handling required",
    buySell: "sell",
    scheduledQuantity: 600,
    product: "RME DC",
    tanks: {
      "UCOME": { quantity: 0, balance: 2500, balanceM3: 2750 },
      "RME": { quantity: -200, balance: 1000, balanceM3: 1100 },
      "FAME0": { quantity: 0, balance: 1250, balanceM3: 1375 },
      "HVO": { quantity: 0, balance: 100, balanceM3: 110 },
      "RME DC": { quantity: 0, balance: 400, balanceM3: 440 },
      "UCOME-5": { quantity: -400, balance: 200, balanceM3: 220 },
    }
  },
  {
    id: "5",
    counterpartyName: "SustainOil Inc",
    tradeReference: "TR-2025-0127",
    bargeName: "Eco Wave",
    movementDate: new Date('2025-04-15'),
    nominationValid: new Date('2025-04-20'),
    customsStatus: "cleared",
    sustainability: "ISCC",
    comments: "",
    buySell: "buy",
    scheduledQuantity: 1200,
    product: "UCOME-5",
    tanks: {
      "UCOME": { quantity: 500, balance: 3000, balanceM3: 3300 },
      "RME": { quantity: 300, balance: 1300, balanceM3: 1430 },
      "FAME0": { quantity: 400, balance: 1650, balanceM3: 1815 },
      "HVO": { quantity: 0, balance: 100, balanceM3: 110 },
      "RME DC": { quantity: 0, balance: 400, balanceM3: 440 },
      "UCOME-5": { quantity: 0, balance: 200, balanceM3: 220 },
    }
  }
];

// Initial tank capacities and details
const tankDetails = {
  "UCOME": {
    capacity: 5000,
    capacityM3: 5500,
    tankNumber: "T125",
    spec: "CFPP +2; W 370; S 21.6; TC 32",
    heating: true
  },
  "RME": {
    capacity: 3000,
    capacityM3: 3300,
    tankNumber: "T241",
    spec: "CFPP +2; W 370; S 21.6; TC 32",
    heating: true
  },
  "FAME0": {
    capacity: 2500,
    capacityM3: 2750,
    tankNumber: "T369",
    spec: "CFPP +2; W 370; S 21.6; TC 32",
    heating: true
  },
  "HVO": {
    capacity: 2000,
    capacityM3: 2200,
    tankNumber: "T482",
    spec: "CFPP +2; W 370; S 21.6; TC 32",
    heating: true
  },
  "RME DC": {
    capacity: 1500,
    capacityM3: 1650,
    tankNumber: "T513",
    spec: "CFPP +2; W 370; S 21.6; TC 32",
    heating: true
  },
  "UCOME-5": {
    capacity: 2000,
    capacityM3: 2200,
    tankNumber: "T649",
    spec: "CFPP +2; W 370; S 21.6; TC 32",
    heating: true
  }
};

const InventoryPage = () => {
  // Products array to match the types defined in the system
  const products: Product[] = ["UCOME", "RME", "FAME0", "HVO", "RME DC", "UCOME-5"];
  
  // References to track row heights for alignment
  const leftTableRowsRef = useRef<(HTMLTableRowElement | null)[]>([]);
  const rightTableRowsRef = useRef<(HTMLTableRowElement | null)[]>([]);
  
  // Effect to align row heights between tables
  useEffect(() => {
    const alignRowHeights = () => {
      if (leftTableRowsRef.current && rightTableRowsRef.current) {
        // Match rows in both tables
        for (let i = 0; i < leftTableRowsRef.current.length; i++) {
          const leftRow = leftTableRowsRef.current[i];
          const rightRow = rightTableRowsRef.current[i];
          
          if (leftRow && rightRow) {
            // Get the height of both rows
            const leftHeight = leftRow.offsetHeight;
            const rightHeight = rightRow.offsetHeight;
            
            // Set both rows to the maximum height
            const maxHeight = Math.max(leftHeight, rightHeight);
            leftRow.style.height = `${maxHeight}px`;
            rightRow.style.height = `${maxHeight}px`;
          }
        }
      }
    };
    
    // Align initially and on window resize
    alignRowHeights();
    window.addEventListener('resize', alignRowHeights);
    
    return () => {
      window.removeEventListener('resize', alignRowHeights);
    };
  }, []);
  
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
        
        {/* Integrated Inventory Movements Table with Tank Details */}
        <Card className="border-r-[3px] border-brand-lime/60 bg-gradient-to-br from-brand-navy/75 to-brand-navy/90">
          <CardHeader>
            <CardTitle>Inventory Movements</CardTitle>
            <CardDescription>
              All product movements affecting tank levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="inventory-table-container flex w-full">
              {/* Fixed columns table - Left side */}
              <div className="inventory-fixed-columns min-w-[600px] w-[600px] overflow-hidden">
                <Table>
                  {/* Fixed Column Headers */}
                  <TableHeader>
                    {/* Empty rows to match the tank details rows */}
                    <TableRow className="bg-muted/50 border-b border-white/10 h-[36px]">
                      <TableHead colSpan={10}></TableHead>
                    </TableRow>
                    <TableRow className="bg-muted/40 border-b border-white/10 h-[54px]">
                      <TableHead colSpan={10}></TableHead>
                    </TableRow>
                    <TableRow className="bg-muted/40 border-b border-white/10 h-[76px]">
                      <TableHead colSpan={10}></TableHead>
                    </TableRow>
                    <TableRow className="bg-muted/40 border-b border-white/10 h-[76px]">
                      <TableHead colSpan={10}></TableHead>
                    </TableRow>
                    <TableRow className="bg-muted/40 border-b border-white/10 h-[40px]">
                      <TableHead colSpan={10}></TableHead>
                    </TableRow>
                    <TableRow className="bg-muted/40 border-b border-white/10 h-[40px]">
                      <TableHead colSpan={10}></TableHead>
                    </TableRow>
                    
                    {/* Main fixed column headers */}
                    <TableRow className="bg-muted/50 border-b border-white/10">
                      <TableHead className="w-[110px] text-xs">Counterparty</TableHead>
                      <TableHead className="w-[80px] text-xs">Trade Ref.</TableHead>
                      <TableHead className="w-[80px] text-xs">Barge Name</TableHead>
                      <TableHead className="w-[80px] text-xs">Movement Date</TableHead>
                      <TableHead className="w-[80px] text-xs">Nomination Valid</TableHead>
                      <TableHead className="w-[60px] text-xs">Customs</TableHead>
                      <TableHead className="w-[70px] text-xs">Sustainability</TableHead>
                      <TableHead className="w-[70px] text-xs">Comments</TableHead>
                      <TableHead className="w-[70px] text-xs">Product</TableHead>
                      <TableHead className="w-[70px] text-xs">Qty. (MT)</TableHead>
                    </TableRow>
                  </TableHeader>
                  
                  <TableBody>
                    {mockInventoryMovements.map((movement, index) => (
                      <TableRow 
                        key={`fixed-${movement.id}`} 
                        className={cn(
                          "hover:bg-brand-navy/80 border-b border-white/5",
                          movement.buySell === "buy" ? "hover:bg-green-900/20" : "hover:bg-red-900/20"
                        )}
                        ref={el => leftTableRowsRef.current[index] = el}
                      >
                        <TableCell className="font-medium text-xs truncate max-w-[110px]">{movement.counterpartyName}</TableCell>
                        <TableCell className="text-xs truncate max-w-[80px]">{movement.tradeReference}</TableCell>
                        <TableCell className="text-xs truncate max-w-[80px]">{movement.bargeName}</TableCell>
                        <TableCell className="text-xs truncate max-w-[80px]">{movement.movementDate.toLocaleDateString()}</TableCell>
                        <TableCell className="text-xs truncate max-w-[80px]">{movement.nominationValid.toLocaleDateString()}</TableCell>
                        <TableCell className="max-w-[60px]">
                          <span className={cn(
                            "px-1 py-0.5 rounded-full text-xs font-medium",
                            movement.customsStatus === "cleared" 
                              ? "bg-green-900/60 text-green-200" 
                              : movement.customsStatus === "pending"
                                ? "bg-yellow-900/60 text-yellow-200"
                                : "bg-blue-900/60 text-blue-200"
                          )}>
                            {movement.customsStatus}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs truncate max-w-[70px]">{movement.sustainability}</TableCell>
                        <TableCell className="text-xs truncate max-w-[70px]">{movement.comments || "-"}</TableCell>
                        <TableCell className="font-medium text-xs truncate max-w-[70px]">{movement.product}</TableCell>
                        <TableCell className={cn(
                          "font-semibold text-xs",
                          movement.buySell === "buy" ? "text-green-400" : "text-red-400"
                        )}>
                          {movement.buySell === "buy" 
                            ? `+${movement.scheduledQuantity}` 
                            : `-${movement.scheduledQuantity}`}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Scrollable tank columns - Right side */}
              <div className="inventory-scrollable-columns flex-1 bg-white/5 rounded-r-md">
                <ScrollArea className="w-full">
                  <div className="min-w-[1200px]">
                    <Table>
                      {/* Tank Info Headers */}
                      <TableHeader>
                        <TableRow className="bg-muted/50 border-b border-white/10">
                          {products.map((productName) => (
                            <TableHead 
                              key={`${productName}-header`}
                              colSpan={3} 
                              className="text-center border-r border-white/30 bg-gradient-to-br from-brand-navy/90 to-brand-navy/70 text-white font-bold"
                            >
                              {productName}
                            </TableHead>
                          ))}
                        </TableRow>
                        
                        {/* Tank Numbers */}
                        <TableRow className="bg-muted/40 border-b border-white/10">
                          {products.map((productName) => (
                            <TableHead 
                              key={`${productName}-tank-number`}
                              colSpan={3} 
                              className="text-center text-xs border-r border-white/30"
                            >
                              Tank {tankDetails[productName].tankNumber}
                            </TableHead>
                          ))}
                        </TableRow>
                        
                        {/* Capacity MT */}
                        <TableRow className="bg-muted/40 border-b border-white/10">
                          {products.map((productName) => (
                            <TableHead 
                              key={`${productName}-capacity`}
                              colSpan={3} 
                              className="text-xs border-r border-white/30"
                            >
                              <div className="flex justify-between items-center px-2">
                                <span>Capacity: {tankDetails[productName].capacity} MT</span>
                                <Database className="h-4 w-4 text-brand-lime/70" />
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-2 mt-1 mx-2">
                                <div 
                                  className="bg-brand-lime h-2 rounded-full" 
                                  style={{ 
                                    width: `${Math.min(
                                      (mockInventoryMovements[mockInventoryMovements.length - 1].tanks[productName].balance / tankDetails[productName].capacity) * 100,
                                      100
                                    )}%` 
                                  }}
                                ></div>
                              </div>
                              <div className="flex justify-between px-2 mt-1">
                                <span className="text-xs text-muted-foreground">
                                  {mockInventoryMovements[mockInventoryMovements.length - 1].tanks[productName].balance} MT
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {Math.round(
                                    (mockInventoryMovements[mockInventoryMovements.length - 1].tanks[productName].balance / tankDetails[productName].capacity) * 100
                                  )}%
                                </span>
                              </div>
                            </TableHead>
                          ))}
                        </TableRow>
                        
                        {/* Capacity M³ */}
                        <TableRow className="bg-muted/40 border-b border-white/10">
                          {products.map((productName) => (
                            <TableHead 
                              key={`${productName}-capacity-m3`}
                              colSpan={3} 
                              className="text-xs border-r border-white/30"
                            >
                              <div className="flex justify-between items-center px-2">
                                <span>Capacity: {tankDetails[productName].capacityM3} M³</span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-2 mt-1 mx-2">
                                <div 
                                  className="bg-brand-blue h-2 rounded-full" 
                                  style={{ 
                                    width: `${Math.min(
                                      (mockInventoryMovements[mockInventoryMovements.length - 1].tanks[productName].balanceM3 / tankDetails[productName].capacityM3) * 100,
                                      100
                                    )}%` 
                                  }}
                                ></div>
                              </div>
                              <div className="flex justify-between px-2 mt-1">
                                <span className="text-xs text-muted-foreground">
                                  {mockInventoryMovements[mockInventoryMovements.length - 1].tanks[productName].balanceM3} M³
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {Math.round(
                                    (mockInventoryMovements[mockInventoryMovements.length - 1].tanks[productName].balanceM3 / tankDetails[productName].capacityM3) * 100
                                  )}%
                                </span>
                              </div>
                            </TableHead>
                          ))}
                        </TableRow>
                        
                        {/* Spec */}
                        <TableRow className="bg-muted/40 border-b border-white/10">
                          {products.map((productName) => (
                            <TableHead 
                              key={`${productName}-spec`}
                              colSpan={3} 
                              className="text-xs border-r border-white/30"
                            >
                              <div className="flex justify-between px-2">
                                <span className="text-muted-foreground">Spec:</span>
                                <span>{tankDetails[productName].spec}</span>
                              </div>
                            </TableHead>
                          ))}
                        </TableRow>
                        
                        {/* Heating */}
                        <TableRow className="bg-muted/40 border-b border-white/10">
                          {products.map((productName) => (
                            <TableHead 
                              key={`${productName}-heating`}
                              colSpan={3} 
                              className="text-xs border-r border-white/30"
                            >
                              <div className="flex justify-between px-2">
                                <span className="text-muted-foreground">Heating:</span>
                                <div className="flex items-center">
                                  <Thermometer className="h-3 w-3 mr-1 text-red-400" />
                                  <span>{tankDetails[productName].heating ? "Yes" : "No"}</span>
                                </div>
                              </div>
                            </TableHead>
                          ))}
                        </TableRow>
                        
                        {/* Tank columns header */}
                        <TableRow className="bg-muted/50 border-b border-white/10">
                          {/* Tank columns - each with Movement and Balance subcolumns */}
                          {products.map((productName) => (
                            <React.Fragment key={productName}>
                              <TableHead className="text-center text-xs">Movement (MT)</TableHead>
                              <TableHead className="text-center text-xs">Movement (M³)</TableHead>
                              <TableHead className="text-center text-xs bg-brand-navy border-r border-white/30">Balance</TableHead>
                            </React.Fragment>
                          ))}
                        </TableRow>
                      </TableHeader>
                      
                      <TableBody>
                        {mockInventoryMovements.map((movement, index) => (
                          <TableRow 
                            key={`tank-${movement.id}`} 
                            className={cn(
                              "hover:bg-brand-navy/80 border-b border-white/5",
                              movement.buySell === "buy" ? "hover:bg-green-900/20" : "hover:bg-red-900/20"
                            )}
                            ref={el => rightTableRowsRef.current[index] = el}
                          >
                            {/* Tank movement and balance columns */}
                            {products.map((productName) => (
                              <React.Fragment key={`${movement.id}-${productName}`}>
                                <TableCell 
                                  className={cn(
                                    "text-center",
                                    movement.tanks[productName].quantity > 0 ? "text-green-400" :
                                    movement.tanks[productName].quantity < 0 ? "text-red-400" : "text-muted-foreground"
                                  )}
                                >
                                  {movement.tanks[productName].quantity !== 0 
                                    ? (movement.tanks[productName].quantity > 0 
                                      ? `+${movement.tanks[productName].quantity}` 
                                      : movement.tanks[productName].quantity) 
                                    : "-"}
                                </TableCell>
                                <TableCell className="text-center text-muted-foreground">
                                  {movement.tanks[productName].quantity !== 0 ? "-" : "-"}
                                </TableCell>
                                <TableCell className="text-center bg-brand-navy border-r border-white/30">
                                  {movement.tanks[productName].balance}
                                </TableCell>
                              </React.Fragment>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* CSS to ensure proper layout */}
      <style>
        {`
        .inventory-table-container {
          display: flex;
          width: 100%;
          overflow: hidden;
          border-radius: 0.375rem;
        }
        
        .inventory-fixed-columns {
          flex-shrink: 0;
          border-right: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .inventory-fixed-columns .table {
          width: 100%;
        }
        
        .inventory-scrollable-columns {
          flex-grow: 1;
          overflow: hidden;
        }
        `}
      </style>
    </Layout>
  );
};

export default InventoryPage;
