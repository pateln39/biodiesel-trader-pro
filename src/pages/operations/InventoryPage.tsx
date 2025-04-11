import React from 'react';
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
  
  // CSS class for a row with fixed height
  const rowHeight = "h-12";
  const columnWidth = "w-[150px] min-w-[150px]";
  
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
        
        {/* Inventory Movements Card */}
        <Card className="border-r-[3px] border-brand-lime/60 bg-gradient-to-br from-brand-navy/75 to-brand-navy/90">
          <CardHeader>
            <CardTitle>Inventory Movements</CardTitle>
            <CardDescription>
              All product movements affecting tank levels
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex flex-col">
              {/* Tank details section - blobs above the right table */}
              <div className="flex">
                {/* Empty space on the left (corresponding to the fixed table width) */}
                <div className="flex-none w-[750px]">
                  {/* Empty space */}
                </div>
                
                {/* Tank details blobs */}
                <div className="flex-1 overflow-hidden">
                  <ScrollArea className="w-full">
                    <div className="flex">
                      {products.map((productName) => (
                        <div 
                          key={`tank-${productName}`} 
                          className={`flex-none ${columnWidth} px-1 border-r border-white/30`}
                        >
                          <div className="text-center font-bold text-white bg-gradient-to-br from-brand-navy/90 to-brand-navy/70 p-2 border-b border-white/10">
                            {productName}
                          </div>
                          
                          <div className="text-center text-xs p-2 border-b border-white/10">
                            Tank {tankDetails[productName].tankNumber}
                          </div>
                          
                          <div className="px-2 py-2 border-b border-white/10">
                            <div className="flex justify-between items-center">
                              <span className="text-xs">Capacity: {tankDetails[productName].capacity} MT</span>
                              <Database className="h-4 w-4 text-brand-lime/70" />
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
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
                            <div className="flex justify-between mt-1">
                              <span className="text-xs text-muted-foreground">
                                {mockInventoryMovements[mockInventoryMovements.length - 1].tanks[productName].balance} MT
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {Math.round(
                                  (mockInventoryMovements[mockInventoryMovements.length - 1].tanks[productName].balance / tankDetails[productName].capacity) * 100
                                )}%
                              </span>
                            </div>
                          </div>
                          
                          <div className="px-2 py-2 border-b border-white/10">
                            <div className="flex justify-between items-center">
                              <span className="text-xs">Capacity: {tankDetails[productName].capacityM3} M³</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
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
                            <div className="flex justify-between mt-1">
                              <span className="text-xs text-muted-foreground">
                                {mockInventoryMovements[mockInventoryMovements.length - 1].tanks[productName].balanceM3} M³
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {Math.round(
                                  (mockInventoryMovements[mockInventoryMovements.length - 1].tanks[productName].balanceM3 / tankDetails[productName].capacityM3) * 100
                                )}%
                              </span>
                            </div>
                          </div>
                          
                          <div className="px-2 py-2 border-b border-white/10">
                            <div className="flex justify-between">
                              <span className="text-xs text-muted-foreground">Spec:</span>
                              <span className="text-xs">{tankDetails[productName].spec}</span>
                            </div>
                          </div>
                          
                          <div className="px-2 py-2 border-b border-white/10">
                            <div className="flex justify-between">
                              <span className="text-xs text-muted-foreground">Heating:</span>
                              <div className="flex items-center">
                                <Thermometer className="h-3 w-3 mr-1 text-red-400" />
                                <span className="text-xs">{tankDetails[productName].heating ? "Yes" : "No"}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              {/* Main tables section - aligned left and right tables */}
              <div className="flex mt-3">
                {/* Left fixed table with trade details */}
                <div className="flex-none w-[750px]">
                  <Table className="text-xs border-r border-white/30">
                    <TableHeader>
                      <TableRow className={`bg-muted/50 border-b border-white/10 ${rowHeight}`}>
                        <TableHead className="w-[150px]">Counterparty</TableHead>
                        <TableHead className="w-[120px]">Trade Ref.</TableHead>
                        <TableHead className="w-[120px]">Barge Name</TableHead>
                        <TableHead className="w-[100px]">Movement Date</TableHead>
                        <TableHead className="w-[100px]">Nomination Valid From</TableHead>
                        <TableHead className="w-[100px]">Customs</TableHead>
                        <TableHead className="w-[80px]">Sustainability</TableHead>
                        <TableHead className="w-[80px]">Comments</TableHead>
                        <TableHead className="w-[80px]">Product</TableHead>
                        <TableHead className="w-[80px]">Qty. (MT)</TableHead>
                      </TableRow>
                    </TableHeader>
                    
                    <TableBody>
                      {mockInventoryMovements.map((movement) => (
                        <TableRow 
                          key={`left-${movement.id}`} 
                          className={cn(
                            `hover:bg-brand-navy/80 border-b border-white/5 ${rowHeight}`,
                            movement.buySell === "buy" ? "hover:bg-green-900/20" : "hover:bg-red-900/20"
                          )}
                        >
                          <TableCell className="font-medium p-2">{movement.counterpartyName}</TableCell>
                          <TableCell className="p-2">{movement.tradeReference}</TableCell>
                          <TableCell className="p-2">{movement.bargeName}</TableCell>
                          <TableCell className="p-2">{movement.movementDate.toLocaleDateString()}</TableCell>
                          <TableCell className="p-2">{movement.nominationValid.toLocaleDateString()}</TableCell>
                          <TableCell className="p-2">
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
                          <TableCell className="p-2">{movement.sustainability}</TableCell>
                          <TableCell className="p-2">{movement.comments || "-"}</TableCell>
                          <TableCell className="font-medium p-2">{movement.product}</TableCell>
                          <TableCell className={cn(
                            "font-semibold p-2",
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
                
                {/* Right scrollable table with tank details */}
                <div className="flex-1 overflow-hidden">
                  <ScrollArea className="w-full">
                    <div className="flex">
                      {products.map((productName) => (
                        <div 
                          key={`movement-columns-${productName}`}
                          className="flex-none border-r border-white/30"
                          style={{ width: columnWidth.split(' ')[0].replace('w-[', '').replace(']', '') }}
                        >
                          <Table className="text-xs w-full">
                            <TableHeader>
                              <TableRow className={`bg-muted/50 border-b border-white/10 ${rowHeight}`}>
                                <TableHead className="text-center p-2 w-1/3">Movement (MT)</TableHead>
                                <TableHead className="text-center p-2 w-1/3">Movement (M³)</TableHead>
                                <TableHead className="text-center p-2 w-1/3 bg-brand-navy">Balance</TableHead>
                              </TableRow>
                            </TableHeader>
                            
                            <TableBody>
                              {mockInventoryMovements.map((movement) => (
                                <TableRow 
                                  key={`right-${movement.id}-${productName}`} 
                                  className={cn(
                                    `hover:bg-brand-navy/80 border-b border-white/5 ${rowHeight}`,
                                    movement.buySell === "buy" ? "hover:bg-green-900/20" : "hover:bg-red-900/20"
                                  )}
                                >
                                  <TableCell 
                                    className={cn(
                                      "text-center p-2 w-1/3",
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
                                  <TableCell className="text-center text-muted-foreground p-2 w-1/3">
                                    {movement.tanks[productName].quantity !== 0 ? "-" : "-"}
                                  </TableCell>
                                  <TableCell className="text-center bg-brand-navy p-2 w-1/3">
                                    {movement.tanks[productName].balance}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default InventoryPage;
