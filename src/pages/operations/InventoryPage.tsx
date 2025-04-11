
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
    product: "UCOME", // Added product
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
    product: "FAME0", // Added product
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
    product: "HVO", // Added product
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
    product: "RME DC", // Added product
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
    product: "UCOME-5", // Added product
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
            <div className="relative">
              {/* Fixed Headers for Tank Info */}
              <div className="mb-0 border-b border-white/10 flex">
                <div className="flex-none w-[1070px]">
                  {/* Empty space for trade data columns */}
                </div>
                <div className="flex-grow overflow-hidden">
                  <ScrollArea orientation="horizontal" className="w-full">
                    <div className="flex min-w-max">
                      {products.map((productName) => (
                        <div 
                          key={`${productName}-header`}
                          className="w-[243px] text-center border-r border-white/30 bg-gradient-to-br from-brand-navy/90 to-brand-navy/70 text-white font-bold p-2"
                        >
                          {productName}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
              
              {/* Tank Numbers */}
              <div className="border-b border-white/10 flex">
                <div className="flex-none w-[1070px]">
                  {/* Empty space for trade data columns */}
                </div>
                <div className="flex-grow overflow-hidden">
                  <ScrollArea orientation="horizontal" className="w-full">
                    <div className="flex min-w-max">
                      {products.map((productName) => (
                        <div 
                          key={`${productName}-tank-number`}
                          className="w-[243px] text-center text-xs border-r border-white/30 bg-muted/40 p-2"
                        >
                          Tank {tankDetails[productName].tankNumber}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
              
              {/* Capacity MT */}
              <div className="border-b border-white/10 flex">
                <div className="flex-none w-[1070px]">
                  {/* Empty space for trade data columns */}
                </div>
                <div className="flex-grow overflow-hidden">
                  <ScrollArea orientation="horizontal" className="w-full">
                    <div className="flex min-w-max">
                      {products.map((productName) => (
                        <div 
                          key={`${productName}-capacity`}
                          className="w-[243px] text-xs border-r border-white/30 bg-muted/40 p-2"
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
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
              
              {/* Capacity M³ */}
              <div className="border-b border-white/10 flex">
                <div className="flex-none w-[1070px]">
                  {/* Empty space for trade data columns */}
                </div>
                <div className="flex-grow overflow-hidden">
                  <ScrollArea orientation="horizontal" className="w-full">
                    <div className="flex min-w-max">
                      {products.map((productName) => (
                        <div 
                          key={`${productName}-capacity-m3`}
                          className="w-[243px] text-xs border-r border-white/30 bg-muted/40 p-2"
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
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
              
              {/* Spec */}
              <div className="border-b border-white/10 flex">
                <div className="flex-none w-[1070px]">
                  {/* Empty space for trade data columns */}
                </div>
                <div className="flex-grow overflow-hidden">
                  <ScrollArea orientation="horizontal" className="w-full">
                    <div className="flex min-w-max">
                      {products.map((productName) => (
                        <div 
                          key={`${productName}-spec`}
                          className="w-[243px] text-xs border-r border-white/30 bg-muted/40 p-2"
                        >
                          <div className="flex justify-between px-2">
                            <span className="text-muted-foreground">Spec:</span>
                            <span>{tankDetails[productName].spec}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
              
              {/* Heating */}
              <div className="border-b border-white/10 flex">
                <div className="flex-none w-[1070px]">
                  {/* Empty space for trade data columns */}
                </div>
                <div className="flex-grow overflow-hidden">
                  <ScrollArea orientation="horizontal" className="w-full">
                    <div className="flex min-w-max">
                      {products.map((productName) => (
                        <div 
                          key={`${productName}-heating`}
                          className="w-[243px] text-xs border-r border-white/30 bg-muted/40 p-2"
                        >
                          <div className="flex justify-between px-2">
                            <span className="text-muted-foreground">Heating:</span>
                            <div className="flex items-center">
                              <Thermometer className="h-3 w-3 mr-1 text-red-400" />
                              <span>{tankDetails[productName].heating ? "Yes" : "No"}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
              
              {/* Main Table Header */}
              <div className="border-b border-white/10 flex">
                <div className="flex-none w-[1070px] flex bg-muted/50">
                  <div className="w-[150px] p-2 text-left font-medium text-muted-foreground">Counterparty</div>
                  <div className="w-[120px] p-2 text-left font-medium text-muted-foreground">Trade Ref.</div>
                  <div className="w-[120px] p-2 text-left font-medium text-muted-foreground">Barge Name</div>
                  <div className="w-[100px] p-2 text-left font-medium text-muted-foreground">Movement Date</div>
                  <div className="w-[100px] p-2 text-left font-medium text-muted-foreground">Nomination Valid From</div>
                  <div className="w-[100px] p-2 text-left font-medium text-muted-foreground">Customs</div>
                  <div className="w-[120px] p-2 text-left font-medium text-muted-foreground">Sustainability</div>
                  <div className="w-[120px] p-2 text-left font-medium text-muted-foreground">Comments</div>
                  <div className="w-[100px] p-2 text-left font-medium text-muted-foreground">Product</div>
                  <div className="w-[100px] p-2 text-left font-medium text-muted-foreground border-r border-white/30">Qty. (MT)</div>
                </div>
                
                <div className="flex-grow overflow-hidden">
                  <ScrollArea orientation="horizontal" className="w-full">
                    <div className="flex min-w-max bg-muted/50">
                      {products.map((productName) => (
                        <React.Fragment key={`header-${productName}`}>
                          <div className="w-[81px] p-2 text-center text-xs font-medium text-muted-foreground">Movement (MT)</div>
                          <div className="w-[81px] p-2 text-center text-xs font-medium text-muted-foreground">Movement (M³)</div>
                          <div className="w-[81px] p-2 text-center text-xs font-medium text-muted-foreground bg-brand-navy border-r border-white/30">Balance</div>
                        </React.Fragment>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
              
              {/* Table Body */}
              {mockInventoryMovements.map((movement) => (
                <div 
                  key={movement.id} 
                  className={cn(
                    "flex border-b border-white/5 hover:bg-brand-navy/80",
                    movement.buySell === "buy" ? "hover:bg-green-900/20" : "hover:bg-red-900/20"
                  )}
                >
                  <div className="flex-none w-[1070px] flex">
                    <div className="w-[150px] p-2 font-medium">{movement.counterpartyName}</div>
                    <div className="w-[120px] p-2">{movement.tradeReference}</div>
                    <div className="w-[120px] p-2">{movement.bargeName}</div>
                    <div className="w-[100px] p-2">{movement.movementDate.toLocaleDateString()}</div>
                    <div className="w-[100px] p-2">{movement.nominationValid.toLocaleDateString()}</div>
                    <div className="w-[100px] p-2">
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
                    </div>
                    <div className="w-[120px] p-2">{movement.sustainability}</div>
                    <div className="w-[120px] p-2">{movement.comments || "-"}</div>
                    <div className="w-[100px] p-2 font-medium">{movement.product}</div>
                    <div className={cn(
                      "w-[100px] p-2 font-semibold border-r border-white/30",
                      movement.buySell === "buy" ? "text-green-400" : "text-red-400"
                    )}>
                      {movement.buySell === "buy" 
                        ? `+${movement.scheduledQuantity}` 
                        : `-${movement.scheduledQuantity}`}
                    </div>
                  </div>
                  
                  <div className="flex-grow overflow-hidden">
                    <ScrollArea orientation="horizontal" className="w-full">
                      <div className="flex min-w-max">
                        {products.map((productName) => (
                          <React.Fragment key={`${movement.id}-${productName}`}>
                            <div 
                              className={cn(
                                "w-[81px] p-2 text-center",
                                movement.tanks[productName].quantity > 0 ? "text-green-400" :
                                movement.tanks[productName].quantity < 0 ? "text-red-400" : "text-muted-foreground"
                              )}
                            >
                              {movement.tanks[productName].quantity !== 0 
                                ? (movement.tanks[productName].quantity > 0 
                                  ? `+${movement.tanks[productName].quantity}` 
                                  : movement.tanks[productName].quantity) 
                                : "-"}
                            </div>
                            <div className="w-[81px] p-2 text-center text-muted-foreground">
                              {movement.tanks[productName].quantity !== 0 ? "-" : "-"}
                            </div>
                            <div className="w-[81px] p-2 text-center bg-brand-navy border-r border-white/30">
                              {movement.tanks[productName].balance}
                            </div>
                          </React.Fragment>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default InventoryPage;
