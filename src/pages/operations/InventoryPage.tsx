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
            <div className="overflow-hidden">
              <style jsx global>{`
                .sticky-column {
                  position: sticky;
                  left: 0;
                  z-index: 10;
                  background-color: #091C3E;
                }
                
                .sticky-column-1 { left: 0; }
                .sticky-column-2 { left: 150px; }
                .sticky-column-3 { left: 270px; }
                .sticky-column-4 { left: 390px; }
                .sticky-column-5 { left: 490px; }
                .sticky-column-6 { left: 590px; }
                .sticky-column-7 { left: 690px; }
                .sticky-column-8 { left: 810px; }
                .sticky-column-9 { left: 930px; }
                .sticky-column-10 { left: 1030px; }
                
                .sticky-header {
                  position: sticky;
                  left: 0;
                  z-index: 11;
                  background-color: rgba(9, 28, 62, 0.9);
                }

                .sticky-column-with-border {
                  border-right: 1px solid rgba(255, 255, 255, 0.3);
                  box-shadow: 6px 0 5px -5px rgba(0, 0, 0, 0.3);
                }
              `}</style>
              
              <div className="overflow-x-auto" style={{ maxWidth: '100%' }}>
                <Table>
                  {/* Tank Details and Column Headers */}
                  <TableHeader>
                    {/* Tank Info Headers */}
                    <TableRow className="bg-muted/50 border-b border-white/10">
                      <TableHead colSpan={10} className="border-r border-white/30 sticky-header sticky-column-1 sticky-column-with-border"></TableHead>
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
                      <TableHead colSpan={10} className="border-r border-white/30 sticky-header sticky-column-1 sticky-column-with-border"></TableHead>
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
                      <TableHead colSpan={10} className="border-r border-white/30 sticky-header sticky-column-1 sticky-column-with-border"></TableHead>
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
                      <TableHead colSpan={10} className="border-r border-white/30 sticky-header sticky-column-1 sticky-column-with-border"></TableHead>
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
                      <TableHead colSpan={10} className="border-r border-white/30 sticky-header sticky-column-1 sticky-column-with-border"></TableHead>
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
                      <TableHead colSpan={10} className="border-r border-white/30 sticky-header sticky-column-1 sticky-column-with-border"></TableHead>
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
                      <TableHead className="w-[150px] sticky-header sticky-column-1">Counterparty</TableHead>
                      <TableHead className="w-[120px] sticky-header sticky-column-2">Trade Ref.</TableHead>
                      <TableHead className="w-[120px] sticky-header sticky-column-3">Barge Name</TableHead>
                      <TableHead className="w-[100px] sticky-header sticky-column-4">Movement Date</TableHead>
                      <TableHead className="w-[100px] sticky-header sticky-column-5">Nomination Valid From</TableHead>
                      <TableHead className="w-[100px] sticky-header sticky-column-6">Customs</TableHead>
                      <TableHead className="w-[120px] sticky-header sticky-column-7">Sustainability</TableHead>
                      <TableHead className="w-[120px] sticky-header sticky-column-8">Comments</TableHead>
                      <TableHead className="w-[100px] sticky-header sticky-column-9">Product</TableHead>
                      <TableHead className="w-[100px] sticky-header sticky-column-10 border-r border-white/30 sticky-column-with-border">Qty. (MT)</TableHead>
                      
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
                    {mockInventoryMovements.map((movement) => (
                      <TableRow key={movement.id} className={cn(
                        "hover:bg-brand-navy/80 border-b border-white/5",
                        movement.buySell === "buy" ? "hover:bg-green-900/20" : "hover:bg-red-900/20"
                      )}>
                        <TableCell className="font-medium sticky-column sticky-column-1">{movement.counterpartyName}</TableCell>
                        <TableCell className="sticky-column sticky-column-2">{movement.tradeReference}</TableCell>
                        <TableCell className="sticky-column sticky-column-3">{movement.bargeName}</TableCell>
                        <TableCell className="sticky-column sticky-column-4">{movement.movementDate.toLocaleDateString()}</TableCell>
                        <TableCell className="sticky-column sticky-column-5">{movement.nominationValid.toLocaleDateString()}</TableCell>
                        <TableCell className="sticky-column sticky-column-6">
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
                        <TableCell className="sticky-column sticky-column-7">{movement.sustainability}</TableCell>
                        <TableCell className="sticky-column sticky-column-8">{movement.comments || "-"}</TableCell>
                        <TableCell className="font-medium sticky-column sticky-column-9">{movement.product}</TableCell>
                        <TableCell className={cn(
                          "font-semibold border-r border-white/30 sticky-column sticky-column-10 sticky-column-with-border",
                          movement.buySell === "buy" ? "text-green-400" : "text-red-400"
                        )}>
                          {movement.buySell === "buy" 
                            ? `+${movement.scheduledQuantity}` 
                            : `-${movement.scheduledQuantity}`}
                        </TableCell>
                        
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
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default InventoryPage;
