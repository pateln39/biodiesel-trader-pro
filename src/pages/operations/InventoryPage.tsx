
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Product } from '@/types';
import { Database, Filter } from 'lucide-react';
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
      "UCOME": { quantity: 800, balance: 2800 },
      "RME": { quantity: 200, balance: 1200 },
      "FAME0": { quantity: 0, balance: 500 },
      "HVO": { quantity: 0, balance: 300 },
      "RME DC": { quantity: 0, balance: 400 },
      "UCOME-5": { quantity: 0, balance: 600 },
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
      "UCOME": { quantity: 0, balance: 2800 },
      "RME": { quantity: 0, balance: 1200 },
      "FAME0": { quantity: 750, balance: 1250 },
      "HVO": { quantity: 0, balance: 300 },
      "RME DC": { quantity: 0, balance: 400 },
      "UCOME-5": { quantity: 0, balance: 600 },
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
      "UCOME": { quantity: -300, balance: 2500 },
      "RME": { quantity: 0, balance: 1200 },
      "FAME0": { quantity: 0, balance: 1250 },
      "HVO": { quantity: -200, balance: 100 },
      "RME DC": { quantity: 0, balance: 400 },
      "UCOME-5": { quantity: 0, balance: 600 },
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
      "UCOME": { quantity: 0, balance: 2500 },
      "RME": { quantity: -200, balance: 1000 },
      "FAME0": { quantity: 0, balance: 1250 },
      "HVO": { quantity: 0, balance: 100 },
      "RME DC": { quantity: 0, balance: 400 },
      "UCOME-5": { quantity: -400, balance: 200 },
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
      "UCOME": { quantity: 500, balance: 3000 },
      "RME": { quantity: 300, balance: 1300 },
      "FAME0": { quantity: 400, balance: 1650 },
      "HVO": { quantity: 0, balance: 100 },
      "RME DC": { quantity: 0, balance: 400 },
      "UCOME-5": { quantity: 0, balance: 200 },
    }
  }
];

// Initial tank capacities
const tankCapacities = {
  "UCOME": 5000,
  "RME": 3000,
  "FAME0": 2500,
  "HVO": 2000,
  "RME DC": 1500,
  "UCOME-5": 2000
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
          {products.map((product) => (
            <Card key={product} className={cn(
              "bg-gradient-to-br from-brand-navy/75 to-brand-navy/90 border-r-[3px]",
              tankCapacities[product] > 2000 ? "border-brand-lime/60" : "border-brand-blue/60"
            )}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{product}</CardTitle>
                <CardDescription>
                  <span>Storage Tank</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Capacity</p>
                    <p className="text-lg font-semibold">{tankCapacities[product]} MT</p>
                  </div>
                  <Database className="h-8 w-8 text-brand-lime/70" />
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div 
                      className="bg-brand-lime h-2.5 rounded-full" 
                      style={{ 
                        width: `${Math.min(
                          (mockInventoryMovements[mockInventoryMovements.length - 1].tanks[product].balance / tankCapacities[product]) * 100,
                          100
                        )}%` 
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-muted-foreground">
                      {mockInventoryMovements[mockInventoryMovements.length - 1].tanks[product].balance} MT
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(
                        (mockInventoryMovements[mockInventoryMovements.length - 1].tanks[product].balance / tankCapacities[product]) * 100
                      )}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Inventory Movements Table */}
        <Card>
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
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[150px]">Counterparty</TableHead>
                    <TableHead className="w-[120px]">Trade Ref.</TableHead>
                    <TableHead className="w-[120px]">Barge Name</TableHead>
                    <TableHead className="w-[100px]">Date</TableHead>
                    <TableHead className="w-[100px]">Valid Until</TableHead>
                    <TableHead className="w-[100px]">Customs</TableHead>
                    <TableHead className="w-[120px]">Sustainability</TableHead>
                    <TableHead className="w-[100px]">Qty. (MT)</TableHead>
                    
                    {/* Tank columns - each with Movement and Balance subcolumns */}
                    {products.map((productName) => (
                      <React.Fragment key={productName}>
                        <TableHead colSpan={2} className="text-center border-l border-gray-300">
                          {productName}
                        </TableHead>
                      </React.Fragment>
                    ))}
                    
                    <TableHead className="text-right">Comments</TableHead>
                  </TableRow>
                  
                  {/* Subheader for tank columns */}
                  <TableRow className="bg-muted/30">
                    <TableHead colSpan={8}></TableHead>
                    {products.map((productName) => (
                      <React.Fragment key={`${productName}-subheaders`}>
                        <TableHead className="text-center text-xs">Mvmt</TableHead>
                        <TableHead className="text-center text-xs bg-gray-100">Balance</TableHead>
                      </React.Fragment>
                    ))}
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                
                <TableBody>
                  {mockInventoryMovements.map((movement) => (
                    <TableRow key={movement.id} className={
                      movement.buySell === "buy" ? "hover:bg-green-50" : "hover:bg-red-50"
                    }>
                      <TableCell className="font-medium">{movement.counterpartyName}</TableCell>
                      <TableCell>{movement.tradeReference}</TableCell>
                      <TableCell>{movement.bargeName}</TableCell>
                      <TableCell>{movement.movementDate.toLocaleDateString()}</TableCell>
                      <TableCell>{movement.nominationValid.toLocaleDateString()}</TableCell>
                      <TableCell>
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          movement.customsStatus === "cleared" 
                            ? "bg-green-100 text-green-800" 
                            : movement.customsStatus === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                        )}>
                          {movement.customsStatus}
                        </span>
                      </TableCell>
                      <TableCell>{movement.sustainability}</TableCell>
                      <TableCell className={cn(
                        "font-semibold",
                        movement.buySell === "buy" ? "text-green-600" : "text-red-600"
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
                              movement.tanks[productName].quantity > 0 ? "text-green-600" :
                              movement.tanks[productName].quantity < 0 ? "text-red-600" : "text-muted-foreground"
                            )}
                          >
                            {movement.tanks[productName].quantity !== 0 
                              ? (movement.tanks[productName].quantity > 0 
                                ? `+${movement.tanks[productName].quantity}` 
                                : movement.tanks[productName].quantity) 
                              : "-"}
                          </TableCell>
                          <TableCell className="text-center bg-gray-100">
                            {movement.tanks[productName].balance}
                          </TableCell>
                        </React.Fragment>
                      ))}
                      
                      <TableCell className="text-right">
                        {movement.comments || "-"}
                      </TableCell>
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

