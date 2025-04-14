import React from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Product } from '@/types';
import { Database, Filter, Thermometer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

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

// Define cumulative widths for sticky positioning
const stickyLeftOffsets = [
  'left-0',        // Col 1
  'left-[150px]',  // Col 2
  'left-[270px]',  // Col 3
  'left-[390px]',  // Col 4
  'left-[490px]',  // Col 5
  'left-[590px]',  // Col 6
  'left-[710px]',  // Col 7
  'left-[830px]',  // Col 8
  'left-[950px]',  // Col 9
];

const InventoryPage = () => {
  // Products array to match the types defined in the system
  const products: Product[] = ["UCOME", "RME", "FAME0", "HVO", "RME DC", "UCOME-5"];
  
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
            <div className="relative overflow-hidden">
              <ScrollArea className="w-full border rounded-md">
                <Table>
                  {/* Tank Details and Column Headers */}
                  <TableHeader>
                    {/* Tank Info Headers */}
                    <TableRow className="bg-muted/50 border-b border-white/10">
                      {/* First 9 columns - Static */}
                      <TableHead colSpan={9} className="border-r border-white/30 sticky left-0 z-20 bg-muted/50"></TableHead>
                      
                      {/* Tank headers - Scrollable */}
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
                      {/* First 9 columns - Static */}
                      <TableHead colSpan={9} className="border-r border-white/30 sticky left-0 z-20 bg-muted/40"></TableHead>
                      
                      {/* Tank numbers - Scrollable */}
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
                      {/* First 9 columns - Static */}
                      <TableHead colSpan={9} className="border-r border-white/30 sticky left-0 z-20 bg-muted/40"></TableHead>
                      
                      {/* Capacity MT - Scrollable */}
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
                      {/* First 9 columns - Static */}
                      <TableHead colSpan={9} className="border-r border-white/30 sticky left-0 z-20 bg-muted/40"></TableHead>
                      
                      {/* Capacity M³ - Scrollable */}
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
                      {/* First 9 columns - Static */}
                      <TableHead colSpan={9} className="border-r border-white/30 sticky left-0 z-20 bg-muted/40"></TableHead>
                      
                      {/* Spec - Scrollable */}
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
                      {/* First 9 columns - Static */}
                      <TableHead colSpan={9} className="border-r border-white/30 sticky left-0 z-20 bg-muted/40"></TableHead>
                      
                      {/* Heating - Scrollable */}
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
                    
                    {/* Main data columns */}
                    <TableRow className="bg-muted/50 border-b border-white/10">
                      {/* First 9 columns - Static with sticky positioning */}
                      <TableHead className={cn("w-[150px] sticky", stickyLeftOffsets[0], "z-20", "bg-brand-navy/90")}>Counterparty</TableHead>
                      <TableHead className={cn("w-[120px] sticky", stickyLeftOffsets[1], "z-20", "bg-brand-navy/90")}>Trade Ref.</TableHead>
                      <TableHead className={cn("w-[120px] sticky", stickyLeftOffsets[2], "z-20", "bg-brand-navy/90")}>Barge Name</TableHead>
                      <TableHead className={cn("w-[100px] sticky", stickyLeftOffsets[3], "z-20", "bg-brand-navy/90")}>Movement Date</TableHead>
                      <TableHead className={cn("w-[100px] sticky", stickyLeftOffsets[4], "z-20", "bg-brand-navy/90")}>Nomination Valid From</TableHead>
                      <TableHead className={cn("w-[100px] sticky", stickyLeftOffsets[5], "z-20", "bg-brand-navy/90")}>Customs</TableHead>
                      <TableHead className={cn("w-[120px] sticky", stickyLeftOffsets[6], "z-20", "bg-brand-navy/90")}>Sustainability</TableHead>
                      <TableHead className={cn("w-[120px] sticky", stickyLeftOffsets[7], "z-20", "bg-brand-navy/90")}>Comments</TableHead>
                      <TableHead className={cn("w-[100px] sticky", stickyLeftOffsets[8], "z-20", "bg-brand-navy/90", "border-r border-white/30")}>Qty. (MT)</TableHead>
                      
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
                    {mockInventoryMovements.map((movement) => {
                      // Determine the background color for the row based on buy/sell
                      const bgColorClass = movement.buySell === "buy" 
                        ? "bg-green-900/10 hover:bg-green-900/20" 
                        : "bg-red-900/10 hover:bg-red-900/20";
                      
                      return (
                        <TableRow 
                          key={movement.id} 
                          className={cn("border-b border-white/5", bgColorClass)}
                        >
                          {/* First 9 columns - Static with sticky positioning */}
                          <TableCell className={cn("font-medium sticky", stickyLeftOffsets[0], "z-10", "bg-brand-navy/95")}>
                            {movement.counterpartyName}
                          </TableCell>
                          <TableCell className={cn("sticky", stickyLeftOffsets[1], "z-10", "bg-brand-navy/95")}>
                            {movement.tradeReference}
                          </TableCell>
                          <TableCell className={cn("sticky", stickyLeftOffsets[2], "z-10", "bg-brand-navy/95")}>
                            {movement.bargeName}
                          </TableCell>
                          <TableCell className={cn("sticky", stickyLeftOffsets[3], "z-10", "bg-brand-navy/95")}>
                            {movement.movementDate.toLocaleDateString()}
                          </TableCell>
                          <TableCell className={cn("sticky", stickyLeftOffsets[4], "z-10", "bg-brand-navy/95")}>
                            {movement.nominationValid.toLocaleDateString()}
                          </TableCell>
                          <TableCell className={cn("sticky", stickyLeftOffsets[5], "z-10", "bg-brand-navy/95")}>
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              movement.customsStatus === "cleared" 
                                ? "bg-green-900/60 text-green-200" 
                                : movement.customsStatus === "pending"
                                  ? "bg-yellow-900/60 text-yellow-200"
                                  : "bg-blue-900/60 text-blue-200"
                            )}>
                              {movement.customsStatus}
                            </span>
                          </TableCell>
                          <TableCell className={cn("sticky", stickyLeftOffsets[6], "z-10", "bg-brand-navy/95")}>
                            {movement.sustainability}
                          </TableCell>
                          <TableCell className={cn("sticky", stickyLeftOffsets[7], "z-10", "bg-brand-navy/95")}>
                            {movement.comments || "-"}
                          </TableCell>
                          <TableCell className={cn(
                            "font-semibold sticky", 
                            stickyLeftOffsets[8], 
                            "z-10", 
                            "bg-brand-navy/95",
                            "border-r border-white/30",
                            movement.buySell === "buy" ? "text-green-400" : "text-red-400"
                          )}>
                            {movement.buySell === "buy" 
                              ? `+${movement.scheduledQuantity}` 
                              : `-${movement.scheduledQuantity}`}
                          </TableCell>
                          
                          {/* Tank movement and balance columns - Scrollable */}
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
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default InventoryPage;
