
import React from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
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
        
        {/* Tank Capacities Overview */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-6">
          {products.map((productName) => (
            <Card key={productName} className="bg-gradient-to-br from-brand-navy/75 to-brand-navy/90 border-r-[3px] border-brand-lime/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{productName}</CardTitle>
                <CardDescription>
                  <div className="flex flex-col">
                    <span>Storage Tank {tankDetails[productName].tankNumber}</span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Capacity</p>
                    <p className="text-lg font-semibold">{tankDetails[productName].capacity} MT</p>
                  </div>
                  <Database className="h-8 w-8 text-brand-lime/70" />
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div 
                      className="bg-brand-lime h-2.5 rounded-full" 
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
                
                {/* M3 Capacity Section */}
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground">Capacity (M³)</p>
                  <p className="text-sm font-semibold">{tankDetails[productName].capacityM3} M³</p>
                  <div className="w-full bg-gray-700 rounded-full h-2.5 mt-1">
                    <div 
                      className="bg-brand-blue h-2.5 rounded-full" 
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
                
                {/* Spec and Heating Section */}
                <div className="mt-3 pt-2 border-t border-gray-700">
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Spec:</span>
                      <span className="text-xs">{tankDetails[productName].spec}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-muted-foreground">Heating:</span>
                      <div className="flex items-center">
                        <Thermometer className="h-3 w-3 mr-1 text-red-400" />
                        <span className="text-xs">{tankDetails[productName].heating ? "Yes" : "No"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Inventory Movements Table */}
        <Card className="border-r-[3px] border-brand-lime/60 bg-gradient-to-br from-brand-navy/75 to-brand-navy/90">
          <CardHeader>
            <CardTitle>Inventory Movements</CardTitle>
            <CardDescription>
              All product movements affecting tank levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 border-b border-white/10">
                    <TableHead className="w-[150px]">Counterparty</TableHead>
                    <TableHead className="w-[120px]">Trade Ref.</TableHead>
                    <TableHead className="w-[120px]">Barge Name</TableHead>
                    <TableHead className="w-[100px]">Movement Date</TableHead>
                    <TableHead className="w-[100px]">Nomination Valid From</TableHead>
                    <TableHead className="w-[100px]">Customs</TableHead>
                    <TableHead className="w-[120px]">Sustainability</TableHead>
                    <TableHead className="w-[120px]">Comments</TableHead>
                    <TableHead className="w-[100px]">Qty. (MT)</TableHead>
                    
                    {/* Tank columns - each with Movement and Balance subcolumns */}
                    {products.map((productName) => (
                      <React.Fragment key={productName}>
                        <TableHead colSpan={3} className="text-center border-l border-gray-300">
                          {productName}
                        </TableHead>
                      </React.Fragment>
                    ))}
                  </TableRow>
                  
                  {/* Subheader for tank columns */}
                  <TableRow className="bg-muted/30 border-b border-white/10">
                    <TableHead colSpan={9}></TableHead>
                    {products.map((productName) => (
                      <React.Fragment key={`${productName}-subheaders`}>
                        <TableHead className="text-center text-xs">Movement (MT)</TableHead>
                        <TableHead className="text-center text-xs">Movement (M³)</TableHead>
                        <TableHead className="text-center text-xs bg-brand-navy">Balance</TableHead>
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
                      <TableCell className="font-medium">{movement.counterpartyName}</TableCell>
                      <TableCell>{movement.tradeReference}</TableCell>
                      <TableCell>{movement.bargeName}</TableCell>
                      <TableCell>{movement.movementDate.toLocaleDateString()}</TableCell>
                      <TableCell>{movement.nominationValid.toLocaleDateString()}</TableCell>
                      <TableCell>
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
                      <TableCell>{movement.sustainability}</TableCell>
                      <TableCell>{movement.comments || "-"}</TableCell>
                      <TableCell className={cn(
                        "font-semibold",
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
                          <TableCell className="text-center bg-brand-navy">
                            {movement.tanks[productName].balance}
                          </TableCell>
                        </React.Fragment>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default InventoryPage;
