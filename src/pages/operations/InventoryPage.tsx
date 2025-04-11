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
            <div className="grid grid-cols-[auto_1fr]">
              {/* Static Left Column Headers */}
              <div className="bg-muted/50 border-b border-white/10">
                <div className="p-3 font-medium text-sm"></div>
              </div>
              
              {/* Tank Headers (Scrollable) */}
              <ScrollArea className="overflow-x-auto">
                <div className="min-w-max grid grid-cols-[repeat(6,minmax(250px,1fr))]">
                  {products.map((productName) => (
                    <div 
                      key={`${productName}-header`}
                      className="text-center border-r border-white/30 bg-gradient-to-br from-brand-navy/90 to-brand-navy/70 text-white font-bold p-3"
                    >
                      {productName}
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              {/* Static Left Column Tank Info */}
              <div className="bg-muted/40 border-b border-white/10">
                <div className="p-3 font-medium text-xs"></div>
              </div>
              
              {/* Tank Numbers (Scrollable) */}
              <ScrollArea className="overflow-x-auto">
                <div className="min-w-max grid grid-cols-[repeat(6,minmax(250px,1fr))]">
                  {products.map((productName) => (
                    <div 
                      key={`${productName}-tank-number`}
                      className="text-center text-xs border-r border-white/30 p-3"
                    >
                      Tank {tankDetails[productName].tankNumber}
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              {/* Static Left Column Capacity Info */}
              <div className="bg-muted/40 border-b border-white/10">
                <div className="p-3 font-medium text-xs"></div>
              </div>
              
              {/* Capacity MT (Scrollable) */}
              <ScrollArea className="overflow-x-auto">
                <div className="min-w-max grid grid-cols-[repeat(6,minmax(250px,1fr))]">
                  {products.map((productName) => (
                    <div 
                      key={`${productName}-capacity`}
                      className="text-xs border-r border-white/30 p-3"
                    >
                      <div className="flex justify-between items-center">
                        <span>Capacity: {tankDetails[productName].capacity} MT</span>
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
                  ))}
                </div>
              </ScrollArea>
              
              {/* Static Left Column Capacity M³ */}
              <div className="bg-muted/40 border-b border-white/10">
                <div className="p-3 font-medium text-xs"></div>
              </div>
              
              {/* Capacity M³ (Scrollable) */}
              <ScrollArea className="overflow-x-auto">
                <div className="min-w-max grid grid-cols-[repeat(6,minmax(250px,1fr))]">
                  {products.map((productName) => (
                    <div 
                      key={`${productName}-capacity-m3`}
                      className="text-xs border-r border-white/30 p-3"
                    >
                      <div className="flex justify-between items-center">
                        <span>Capacity: {tankDetails[productName].capacityM3} M³</span>
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
                  ))}
                </div>
              </ScrollArea>
              
              {/* Static Left Column Spec */}
              <div className="bg-muted/40 border-b border-white/10">
                <div className="p-3 font-medium text-xs"></div>
              </div>
              
              {/* Spec (Scrollable) */}
              <ScrollArea className="overflow-x-auto">
                <div className="min-w-max grid grid-cols-[repeat(6,minmax(250px,1fr))]">
                  {products.map((productName) => (
                    <div 
                      key={`${productName}-spec`}
                      className="text-xs border-r border-white/30 p-3"
                    >
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Spec:</span>
                        <span>{tankDetails[productName].spec}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              {/* Static Left Column Heating */}
              <div className="bg-muted/40 border-b border-white/10">
                <div className="p-3 font-medium text-xs"></div>
              </div>
              
              {/* Heating (Scrollable) */}
              <ScrollArea className="overflow-x-auto">
                <div className="min-w-max grid grid-cols-[repeat(6,minmax(250px,1fr))]">
                  {products.map((productName) => (
                    <div 
                      key={`${productName}-heating`}
                      className="text-xs border-r border-white/30 p-3"
                    >
                      <div className="flex justify-between">
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
              
              {/* Main Movement Table */}
              <div className="overflow-visible">
                {/* Fixed column headers */}
                <div className="grid grid-cols-[150px_120px_120px_100px_100px_100px_120px_120px_100px] bg-muted/50 border-b border-white/10">
                  <div className="p-3 font-medium text-sm">Counterparty</div>
                  <div className="p-3 font-medium text-sm">Trade Ref.</div>
                  <div className="p-3 font-medium text-sm">Barge Name</div>
                  <div className="p-3 font-medium text-sm">Movement Date</div>
                  <div className="p-3 font-medium text-sm">Nomination Valid</div>
                  <div className="p-3 font-medium text-sm">Customs</div>
                  <div className="p-3 font-medium text-sm">Sustainability</div>
                  <div className="p-3 font-medium text-sm">Comments</div>
                  <div className="p-3 font-medium text-sm border-r border-white/30">Qty. (MT)</div>
                </div>
                
                {/* Movement data rows */}
                {mockInventoryMovements.map((movement) => (
                  <div 
                    key={movement.id}
                    className={cn(
                      "grid grid-cols-[150px_120px_120px_100px_100px_100px_120px_120px_100px] border-b border-white/5",
                      movement.buySell === "buy" ? "hover:bg-green-900/20" : "hover:bg-red-900/20"
                    )}
                  >
                    <div className="p-3 font-medium">{movement.counterpartyName}</div>
                    <div className="p-3">{movement.tradeReference}</div>
                    <div className="p-3">{movement.bargeName}</div>
                    <div className="p-3">{movement.movementDate.toLocaleDateString()}</div>
                    <div className="p-3">{movement.nominationValid.toLocaleDateString()}</div>
                    <div className="p-3">
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
                    <div className="p-3">{movement.sustainability}</div>
                    <div className="p-3">{movement.comments || "-"}</div>
                    <div className={cn(
                      "p-3 font-semibold border-r border-white/30",
                      movement.buySell === "buy" ? "text-green-400" : "text-red-400"
                    )}>
                      {movement.buySell === "buy" 
                        ? `+${movement.scheduledQuantity}` 
                        : `-${movement.scheduledQuantity}`}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Tank movement and balance columns (Scrollable) */}
              <ScrollArea className="overflow-x-auto">
                <div className="min-w-max">
                  {/* Tank column headers */}
                  <div className="grid grid-cols-[repeat(18,minmax(80px,1fr))] bg-muted/50 border-b border-white/10">
                    {products.map((productName) => (
                      <React.Fragment key={`${productName}-headers`}>
                        <div className="p-3 text-center text-xs">Movement (MT)</div>
                        <div className="p-3 text-center text-xs">Movement (M³)</div>
                        <div className="p-3 text-center text-xs bg-brand-navy border-r border-white/30">Balance</div>
                      </React.Fragment>
                    ))}
                  </div>
                  
                  {/* Tank data rows */}
                  {mockInventoryMovements.map((movement) => (
                    <div 
                      key={`${movement.id}-tanks`}
                      className={cn(
                        "grid grid-cols-[repeat(18,minmax(80px,1fr))] border-b border-white/5",
                        movement.buySell === "buy" ? "hover:bg-green-900/20" : "hover:bg-red-900/20"
                      )}
                    >
                      {products.map((productName) => (
                        <React.Fragment key={`${movement.id}-${productName}`}>
                          <div 
                            className={cn(
                              "p-3 text-center",
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
                          <div className="p-3 text-center text-muted-foreground">
                            {movement.tanks[productName].quantity !== 0 ? "-" : "-"}
                          </div>
                          <div className="p-3 text-center bg-brand-navy border-r border-white/30">
                            {movement.tanks[productName].balance}
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default InventoryPage;
