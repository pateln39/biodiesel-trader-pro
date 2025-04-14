
import React from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Product } from '@/types';
import { Database, Filter, Thermometer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

// Define sticky column widths for layout calculation - REDUCED WIDTHS HERE
const stickyColumnWidths = {
  counterparty: 110, // Reduced from 130
  tradeRef: 80, // Reduced from 100
  bargeName: 90, // Reduced from 110
  movementDate: 75, // Reduced from 90
  nominationDate: 75, // Reduced from 90
  customs: 75, // Reduced from 90
  sustainability: 90, // Reduced from 110
  comments: 90, // Reduced from 110
  quantity: 70, // Reduced from 90
};

// Calculate total width of sticky columns for positioning
const totalStickyWidth = Object.values(stickyColumnWidths).reduce((sum, width) => sum + width, 0);

// Truncated header names to save space
const truncatedHeaders = {
  counterparty: "Counterparty",
  tradeRef: "Trade Ref",
  bargeName: "Barge",
  movementDate: "Move Date",
  nominationDate: "Nom. Valid",
  customs: "Customs",
  sustainability: "Sustain.",
  comments: "Comments",
  quantity: "Qty (MT)",
};

// Helper component for truncated text with tooltip
const TruncatedCell = ({ text, width, className = "" }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <div 
          className={cn(
            "truncate max-w-full", 
            className
          )} 
          style={{ width: `${width}px` }}
        >
          {text}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="max-w-xs break-words">{text}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

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
            <div className="relative border rounded-md overflow-hidden">
              {/* Two-panel layout with fixed sticky columns and scrollable tank details */}
              <div className="flex">
                {/* Fixed left panel for sticky columns */}
                <div 
                  className="flex-shrink-0 z-30 border-r border-white/30"
                  style={{ width: `${totalStickyWidth}px` }}
                >
                  <Table>
                    {/* Sticky Column Headers - NOW ALIGNED WITH RIGHT PANEL */}
                    <TableHeader>
                      {/* Row 1: Product headers - empty for sticky columns */}
                      <TableRow className="bg-muted/50 border-b border-white/10 h-12">
                        <TableHead 
                          colSpan={9} 
                          className="bg-brand-navy text-[10px]"
                        ></TableHead>
                      </TableRow>
                      
                      {/* Row 2: Tank numbers - empty for sticky columns */}
                      <TableRow className="bg-muted/40 border-b border-white/10 h-10">
                        <TableHead 
                          colSpan={9} 
                          className="bg-brand-navy text-[10px]"
                        ></TableHead>
                      </TableRow>
                      
                      {/* Row 3: Tank capacity MT - empty for sticky columns */}
                      <TableRow className="bg-muted/40 border-b border-white/10 h-14">
                        <TableHead 
                          colSpan={9} 
                          className="bg-brand-navy text-[10px]"
                        ></TableHead>
                      </TableRow>
                      
                      {/* Row 4: Tank capacity M³ - empty for sticky columns */}
                      <TableRow className="bg-muted/40 border-b border-white/10 h-14">
                        <TableHead 
                          colSpan={9} 
                          className="bg-brand-navy text-[10px]"
                        ></TableHead>
                      </TableRow>
                      
                      {/* Row 5: Tank specs - empty for sticky columns */}
                      <TableRow className="bg-muted/40 border-b border-white/10 h-8">
                        <TableHead 
                          colSpan={9} 
                          className="bg-brand-navy text-[10px]"
                        ></TableHead>
                      </TableRow>
                      
                      {/* Row 6: Tank heating - empty for sticky columns */}
                      <TableRow className="bg-muted/40 border-b border-white/10 h-8">
                        <TableHead 
                          colSpan={9} 
                          className="bg-brand-navy text-[10px]"
                        ></TableHead>
                      </TableRow>
                      
                      {/* Row 7: Main column headers - ALIGNED WITH "Movement (MT)/Balance" */}
                      <TableRow className="bg-muted/50 border-b border-white/10 h-10">
                        <TableHead 
                          className={`w-[${stickyColumnWidths.counterparty}px] bg-brand-navy text-[10px]`}
                          style={{ width: `${stickyColumnWidths.counterparty}px` }}
                        >
                          <TruncatedCell 
                            text={truncatedHeaders.counterparty} 
                            width={stickyColumnWidths.counterparty - 8} 
                            className="text-[10px] font-medium"
                          />
                        </TableHead>
                        <TableHead 
                          className={`bg-brand-navy text-[10px]`}
                          style={{ width: `${stickyColumnWidths.tradeRef}px` }}
                        >
                          <TruncatedCell 
                            text={truncatedHeaders.tradeRef} 
                            width={stickyColumnWidths.tradeRef - 8} 
                            className="text-[10px] font-medium"
                          />
                        </TableHead>
                        <TableHead 
                          className={`bg-brand-navy text-[10px]`}
                          style={{ width: `${stickyColumnWidths.bargeName}px` }}
                        >
                          <TruncatedCell 
                            text={truncatedHeaders.bargeName} 
                            width={stickyColumnWidths.bargeName - 8} 
                            className="text-[10px] font-medium"
                          />
                        </TableHead>
                        <TableHead 
                          className={`bg-brand-navy text-[10px]`}
                          style={{ width: `${stickyColumnWidths.movementDate}px` }}
                        >
                          <TruncatedCell 
                            text={truncatedHeaders.movementDate} 
                            width={stickyColumnWidths.movementDate - 8} 
                            className="text-[10px] font-medium"
                          />
                        </TableHead>
                        <TableHead 
                          className={`bg-brand-navy text-[10px]`}
                          style={{ width: `${stickyColumnWidths.nominationDate}px` }}
                        >
                          <TruncatedCell 
                            text={truncatedHeaders.nominationDate} 
                            width={stickyColumnWidths.nominationDate - 8} 
                            className="text-[10px] font-medium"
                          />
                        </TableHead>
                        <TableHead 
                          className={`bg-brand-navy text-[10px]`}
                          style={{ width: `${stickyColumnWidths.customs}px` }}
                        >
                          <TruncatedCell 
                            text={truncatedHeaders.customs} 
                            width={stickyColumnWidths.customs - 8} 
                            className="text-[10px] font-medium"
                          />
                        </TableHead>
                        <TableHead 
                          className={`bg-brand-navy text-[10px]`}
                          style={{ width: `${stickyColumnWidths.sustainability}px` }}
                        >
                          <TruncatedCell 
                            text={truncatedHeaders.sustainability} 
                            width={stickyColumnWidths.sustainability - 8} 
                            className="text-[10px] font-medium"
                          />
                        </TableHead>
                        <TableHead 
                          className={`bg-brand-navy text-[10px]`}
                          style={{ width: `${stickyColumnWidths.comments}px` }}
                        >
                          <TruncatedCell 
                            text={truncatedHeaders.comments} 
                            width={stickyColumnWidths.comments - 8} 
                            className="text-[10px] font-medium"
                          />
                        </TableHead>
                        <TableHead 
                          className={`bg-brand-navy text-[10px] border-r border-white/30`}
                          style={{ width: `${stickyColumnWidths.quantity}px` }}
                        >
                          <TruncatedCell 
                            text={truncatedHeaders.quantity} 
                            width={stickyColumnWidths.quantity - 8} 
                            className="text-[10px] font-medium"
                          />
                        </TableHead>
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
                            key={`sticky-${movement.id}`} 
                            className={cn("border-b border-white/5 h-10", bgColorClass)}
                          >
                            <TableCell className="bg-brand-navy text-[10px] py-2">
                              <TruncatedCell 
                                text={movement.counterpartyName} 
                                width={stickyColumnWidths.counterparty - 16} 
                                className="font-medium text-[10px]"
                              />
                            </TableCell>
                            <TableCell className="bg-brand-navy text-[10px] py-2">
                              <TruncatedCell 
                                text={movement.tradeReference} 
                                width={stickyColumnWidths.tradeRef - 16} 
                                className="text-[10px]"
                              />
                            </TableCell>
                            <TableCell className="bg-brand-navy text-[10px] py-2">
                              <TruncatedCell 
                                text={movement.bargeName} 
                                width={stickyColumnWidths.bargeName - 16} 
                                className="text-[10px]"
                              />
                            </TableCell>
                            <TableCell className="bg-brand-navy text-[10px] py-2">
                              <TruncatedCell 
                                text={movement.movementDate.toLocaleDateString()} 
                                width={stickyColumnWidths.movementDate - 16} 
                                className="text-[10px]"
                              />
                            </TableCell>
                            <TableCell className="bg-brand-navy text-[10px] py-2">
                              <TruncatedCell 
                                text={movement.nominationValid.toLocaleDateString()} 
                                width={stickyColumnWidths.nominationDate - 16} 
                                className="text-[10px]"
                              />
                            </TableCell>
                            <TableCell className="bg-brand-navy text-[10px] py-2">
                              <span className={cn(
                                "px-1 py-0.5 rounded-full text-[10px] font-medium truncate block",
                                movement.customsStatus === "cleared" 
                                  ? "bg-green-900/60 text-green-200" 
                                  : movement.customsStatus === "pending"
                                    ? "bg-yellow-900/60 text-yellow-200"
                                    : "bg-blue-900/60 text-blue-200"
                              )} style={{ maxWidth: `${stickyColumnWidths.customs - 16}px` }}>
                                {movement.customsStatus}
                              </span>
                            </TableCell>
                            <TableCell className="bg-brand-navy text-[10px] py-2">
                              <TruncatedCell 
                                text={movement.sustainability} 
                                width={stickyColumnWidths.sustainability - 16} 
                                className="text-[10px]"
                              />
                            </TableCell>
                            <TableCell className="bg-brand-navy text-[10px] py-2">
                              <TruncatedCell 
                                text={movement.comments || "-"} 
                                width={stickyColumnWidths.comments - 16} 
                                className="text-[10px]"
                              />
                            </TableCell>
                            <TableCell className={cn(
                              "font-semibold bg-brand-navy text-[10px] py-2 border-r border-white/30",
                              movement.buySell === "buy" ? "text-green-400" : "text-red-400"
                            )}>
                              {movement.buySell === "buy" 
                                ? `+${movement.scheduledQuantity}` 
                                : `-${movement.scheduledQuantity}`}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Scrollable right panel for tank details */}
                <div className="overflow-hidden flex-grow">
                  <ScrollArea className="h-[700px]" orientation="horizontal">
                    <div className="min-w-[1200px]"> {/* FURTHER REDUCED MINIMUM WIDTH */}
                      <Table>
                        <TableHeader>
                          {/* Tank Info Headers */}
                          <TableRow className="bg-muted/50 border-b border-white/10 h-12">
                            {products.map((productName) => (
                              <TableHead 
                                key={`${productName}-header`}
                                colSpan={3} 
                                className="text-center border-r border-white/30 bg-gradient-to-br from-brand-navy/90 to-brand-navy/70 text-white font-bold text-[10px]"
                              >
                                {productName}
                              </TableHead>
                            ))}
                          </TableRow>
                          
                          {/* Tank Numbers */}
                          <TableRow className="bg-muted/40 border-b border-white/10 h-10">
                            {products.map((productName) => (
                              <TableHead 
                                key={`${productName}-tank-number`}
                                colSpan={3} 
                                className="text-center text-[10px] border-r border-white/30"
                              >
                                Tank {tankDetails[productName].tankNumber}
                              </TableHead>
                            ))}
                          </TableRow>
                          
                          {/* Capacity MT */}
                          <TableRow className="bg-muted/40 border-b border-white/10 h-14">
                            {products.map((productName) => (
                              <TableHead 
                                key={`${productName}-capacity`}
                                colSpan={3} 
                                className="text-[10px] border-r border-white/30"
                              >
                                <div className="flex justify-between items-center px-2">
                                  <span>Capacity: {tankDetails[productName].capacity} MT</span>
                                  <Database className="h-3 w-3 text-brand-lime/70" />
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
                                  <span className="text-[9px] text-muted-foreground">
                                    {mockInventoryMovements[mockInventoryMovements.length - 1].tanks[productName].balance} MT
                                  </span>
                                  <span className="text-[9px] text-muted-foreground">
                                    {Math.round(
                                      (mockInventoryMovements[mockInventoryMovements.length - 1].tanks[productName].balance / tankDetails[productName].capacity) * 100
                                    )}%
                                  </span>
                                </div>
                              </TableHead>
                            ))}
                          </TableRow>
                          
                          {/* Capacity M³ */}
                          <TableRow className="bg-muted/40 border-b border-white/10 h-14">
                            {products.map((productName) => (
                              <TableHead 
                                key={`${productName}-capacity-m3`}
                                colSpan={3} 
                                className="text-[10px] border-r border-white/30"
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
                                  <span className="text-[9px] text-muted-foreground">
                                    {mockInventoryMovements[mockInventoryMovements.length - 1].tanks[productName].balanceM3} M³
                                  </span>
                                  <span className="text-[9px] text-muted-foreground">
                                    {Math.round(
                                      (mockInventoryMovements[mockInventoryMovements.length - 1].tanks[productName].balanceM3 / tankDetails[productName].capacityM3) * 100
                                    )}%
                                  </span>
                                </div>
                              </TableHead>
                            ))}
                          </TableRow>
                          
                          {/* Spec */}
                          <TableRow className="bg-muted/40 border-b border-white/10 h-8">
                            {products.map((productName) => (
                              <TableHead 
                                key={`${productName}-spec`}
                                colSpan={3} 
                                className="text-[10px] border-r border-white/30"
                              >
                                <div className="flex justify-between px-2">
                                  <span className="text-muted-foreground">Spec:</span>
                                  <TruncatedCell
                                    text={tankDetails[productName].spec}
                                    width={100}
                                    className="text-[10px]"
                                  />
                                </div>
                              </TableHead>
                            ))}
                          </TableRow>
                          
                          {/* Heating */}
                          <TableRow className="bg-muted/40 border-b border-white/10 h-8">
                            {products.map((productName) => (
                              <TableHead 
                                key={`${productName}-heating`}
                                colSpan={3} 
                                className="text-[10px] border-r border-white/30"
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
                          
                          {/* Column headers for tank details - ALIGNED WITH LEFT PANEL HEADERS */}
                          <TableRow className="bg-muted/50 border-b border-white/10 h-10">
                            {products.map((productName) => (
                              <React.Fragment key={productName}>
                                <TableHead className="text-center text-[10px]">Move MT</TableHead>
                                <TableHead className="text-center text-[10px]">Move M³</TableHead>
                                <TableHead className="text-center text-[10px] bg-brand-navy border-r border-white/30">Balance</TableHead>
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
                                key={`scroll-${movement.id}`} 
                                className={cn("border-b border-white/5 h-10", bgColorClass)}
                              >
                                {/* Tank movement and balance columns */}
                                {products.map((productName) => (
                                  <React.Fragment key={`${movement.id}-${productName}`}>
                                    <TableCell 
                                      className={cn(
                                        "text-center text-[10px] py-2",
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
                                    <TableCell className="text-center text-[10px] py-2 text-muted-foreground">
                                      {movement.tanks[productName].quantity !== 0 ? "-" : "-"}
                                    </TableCell>
                                    <TableCell className="text-center text-[10px] py-2 bg-brand-navy border-r border-white/30">
                                      {movement.tanks[productName].balance}
                                    </TableCell>
                                  </React.Fragment>
                                ))}
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
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
