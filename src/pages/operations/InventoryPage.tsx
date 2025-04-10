
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Product } from '@/types';
import { Database, Filter, Thermometer, BarChart3, ChevronsUp, ChevronDown, Droplet, Cylinder, ArrowRight, ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';

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

// Tank SVG Component
const TankVisualization = ({ 
  productName, 
  balance, 
  capacity, 
  tankNumber 
}: { 
  productName: string; 
  balance: number; 
  capacity: number; 
  tankNumber: string;
}) => {
  const fillPercentage = Math.min((balance / capacity) * 100, 100);
  const fillHeight = 180 * (fillPercentage / 100);
  
  // Color mapping for different products
  const colors = {
    "UCOME": { fill: "#9b87f5", stroke: "#7E69AB" },
    "RME": { fill: "#33C3F0", stroke: "#0EA5E9" },
    "FAME0": { fill: "#F97316", stroke: "#c45a12" },
    "HVO": { fill: "#10b981", stroke: "#059669" },
    "RME DC": { fill: "#8B5CF6", stroke: "#7c3aed" },
    "UCOME-5": { fill: "#D946EF", stroke: "#c026d3" }
  };
  
  const color = colors[productName as keyof typeof colors] || { fill: "#9b87f5", stroke: "#7E69AB" };
  
  return (
    <div className="flex flex-col items-center">
      <div className="text-sm font-medium mb-1">{productName}</div>
      <div className="text-xs text-muted-foreground mb-1">Tank {tankNumber}</div>
      <div className="relative w-20 h-48">
        <svg width="80" height="200" viewBox="0 0 80 200" className="absolute">
          {/* Tank body */}
          <rect x="10" y="10" width="60" height="180" rx="5" fill="#1A1F2C" stroke="#403E43" strokeWidth="2" />
          
          {/* Tank connections */}
          <rect x="30" y="0" width="20" height="10" fill="#403E43" stroke="#555" strokeWidth="1" />
          <rect x="30" y="190" width="20" height="10" fill="#403E43" stroke="#555" strokeWidth="1" />
          
          {/* Tank level background - creates depth effect */}
          <rect x="12" y="12" width="56" height="176" rx="4" fill="#222" />
          
          {/* Tank liquid level */}
          <rect 
            x="12" 
            y={190 - fillHeight} 
            width="56" 
            height={fillHeight} 
            rx="4" 
            fill={color.fill} 
            stroke={color.stroke} 
            strokeWidth="1"
            className="transition-all duration-1000 ease-in-out"
          />
          
          {/* Markers for capacity levels */}
          <line x1="10" y1="50" x2="15" y2="50" stroke="#555" strokeWidth="1" />
          <line x1="10" y1="100" x2="15" y2="100" stroke="#555" strokeWidth="1" />
          <line x1="10" y1="150" x2="15" y2="150" stroke="#555" strokeWidth="1" />
          
          {/* Add reflection effect on liquid */}
          <rect 
            x="12" 
            y={190 - fillHeight} 
            width="56" 
            height="8" 
            rx="1" 
            fill="white" 
            opacity="0.2"
          />
        </svg>
        
        {/* Level indicators - text */}
        <div className="absolute left-0 top-[45px] text-[10px] text-muted-foreground">75%</div>
        <div className="absolute left-0 top-[95px] text-[10px] text-muted-foreground">50%</div>
        <div className="absolute left-0 top-[145px] text-[10px] text-muted-foreground">25%</div>
      </div>
      
      <div className="mt-1 text-sm font-semibold">
        {balance} MT
      </div>
      <div className="text-xs text-muted-foreground">
        {Math.round(fillPercentage)}% of {capacity} MT
      </div>
    </div>
  );
};

// Tank Details Card Component
const TankDetailsCard = ({ productName }: { productName: string }) => {
  const details = tankDetails[productName as keyof typeof tankDetails];
  const lastMovement = mockInventoryMovements[mockInventoryMovements.length - 1];
  const balance = lastMovement.tanks[productName as keyof typeof lastMovement.tanks].balance;
  const balanceM3 = lastMovement.tanks[productName as keyof typeof lastMovement.tanks].balanceM3;
  
  // Calculate fill percentages
  const fillPercentageMT = Math.min((balance / details.capacity) * 100, 100);
  const fillPercentageM3 = Math.min((balanceM3 / details.capacityM3) * 100, 100);
  
  return (
    <Card className="bg-gradient-to-br from-brand-navy/90 to-brand-navy/70 border-white/10 shadow-lg">
      <CardContent className="p-4">
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between items-center">
            <div className="font-medium">{productName}</div>
            <div className="text-xs text-muted-foreground">Tank {details.tankNumber}</div>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span>MT Capacity:</span>
              <span>{details.capacity} MT</span>
            </div>
            <Progress value={fillPercentageMT} className="h-2" />
            <div className="flex justify-between text-xs">
              <span>{balance} MT</span>
              <span>{Math.round(fillPercentageMT)}%</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span>M³ Capacity:</span>
              <span>{details.capacityM3} M³</span>
            </div>
            <Progress value={fillPercentageM3} className="h-2" />
            <div className="flex justify-between text-xs">
              <span>{balanceM3} M³</span>
              <span>{Math.round(fillPercentageM3)}%</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center text-xs">
            <span>Spec:</span>
            <span className="text-muted-foreground">{details.spec}</span>
          </div>
          
          <div className="flex justify-between items-center text-xs">
            <span>Heating:</span>
            <div className="flex items-center">
              {details.heating ? (
                <>
                  <Thermometer className="h-3 w-3 mr-1 text-red-400" />
                  <span>Enabled</span>
                </>
              ) : (
                <span>Disabled</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const InventoryPage = () => {
  // Products array to match the types defined in the system
  const products: Product[] = ["UCOME", "RME", "FAME0", "HVO", "RME DC", "UCOME-5"];
  
  // State for view toggle
  const [viewMode, setViewMode] = useState<'table' | 'visual'>('visual');
  
  // State for collapsible sections
  const [tanksExpanded, setTanksExpanded] = useState(true);
  const [movementsExpanded, setMovementsExpanded] = useState(true);
  
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <div className="flex items-center space-x-4">
            <button 
              className={cn(
                "px-4 py-2 text-sm rounded-md transition-colors duration-200",
                viewMode === 'table' 
                  ? "bg-brand-navy text-white" 
                  : "bg-transparent text-muted-foreground border border-muted"
              )}
              onClick={() => setViewMode('table')}
            >
              <BarChart3 className="h-4 w-4 inline-block mr-2" />
              Table View
            </button>
            <button 
              className={cn(
                "px-4 py-2 text-sm rounded-md transition-colors duration-200",
                viewMode === 'visual' 
                  ? "bg-brand-navy text-white" 
                  : "bg-transparent text-muted-foreground border border-muted"
              )}
              onClick={() => setViewMode('visual')}
            >
              <Cylinder className="h-4 w-4 inline-block mr-2" />
              Tank View
            </button>
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filter</span>
            </div>
          </div>
        </div>
        
        {/* Tank Visualizations - Only shown in visual mode */}
        {viewMode === 'visual' && (
          <Collapsible
            open={tanksExpanded}
            onOpenChange={setTanksExpanded}
            className="w-full space-y-2"
          >
            <div className="flex items-center justify-between space-x-4 px-4">
              <h2 className="text-xl font-semibold">Current Tank Levels</h2>
              <CollapsibleTrigger asChild>
                <button className="p-1 rounded-full hover:bg-muted">
                  {tanksExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronsUp className="h-5 w-5" />}
                </button>
              </CollapsibleTrigger>
            </div>
            
            <CollapsibleContent className="space-y-2 transition-all">
              <Card className="border-r-[3px] border-brand-lime/60 bg-gradient-to-br from-brand-navy/75 to-brand-navy/90 overflow-hidden shadow-lg">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
                    {products.map((productName) => {
                      const lastMovement = mockInventoryMovements[mockInventoryMovements.length - 1];
                      const balance = lastMovement.tanks[productName].balance;
                      
                      return (
                        <div key={productName} className="flex flex-col items-center">
                          <TankVisualization 
                            productName={productName}
                            balance={balance}
                            capacity={tankDetails[productName].capacity}
                            tankNumber={tankDetails[productName].tankNumber}
                          />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {products.map((productName) => (
                  <TankDetailsCard key={productName} productName={productName} />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
        
        {/* Inventory Movements Table */}
        <Collapsible
          open={movementsExpanded}
          onOpenChange={setMovementsExpanded}
          className="w-full space-y-2"
        >
          <div className="flex items-center justify-between space-x-4 px-4">
            <h2 className="text-xl font-semibold">Inventory Movements</h2>
            <CollapsibleTrigger asChild>
              <button className="p-1 rounded-full hover:bg-muted">
                {movementsExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronsUp className="h-5 w-5" />}
              </button>
            </CollapsibleTrigger>
          </div>
          
          <CollapsibleContent className="space-y-2 transition-all">
            <Card className="border-r-[3px] border-brand-lime/60 bg-gradient-to-br from-brand-navy/75 to-brand-navy/90 overflow-hidden shadow-lg">
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 border-b border-white/10">
                        <TableHead className="w-[150px]">Counterparty</TableHead>
                        <TableHead className="w-[120px]">Trade Ref.</TableHead>
                        <TableHead className="w-[120px]">Barge Name</TableHead>
                        <TableHead className="w-[100px]">Movement Date</TableHead>
                        <TableHead className="w-[100px]">Customs</TableHead>
                        <TableHead className="w-[100px] border-r border-white/30">Qty. (MT)</TableHead>
                        
                        {products.map((productName) => (
                          <TableHead 
                            key={productName}
                            className="text-center border-r border-white/30 bg-gradient-to-br from-brand-navy/90 to-brand-navy/70 text-white"
                            colSpan={3}
                          >
                            <div className="flex items-center justify-center space-x-2">
                              <Droplet className="h-3 w-3 text-brand-lime/70" />
                              <span>{productName}</span>
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                      
                      <TableRow className="bg-muted/40 border-b border-white/10">
                        <TableHead colSpan={6} className="border-r border-white/30"></TableHead>
                        
                        {products.map((productName) => (
                          <React.Fragment key={`${productName}-subheaders`}>
                            <TableHead className="text-center text-xs">Movement</TableHead>
                            <TableHead className="text-center text-xs">Direction</TableHead>
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
                          <TableCell className="font-medium">{movement.counterpartyName}</TableCell>
                          <TableCell>{movement.tradeReference}</TableCell>
                          <TableCell>{movement.bargeName}</TableCell>
                          <TableCell>{movement.movementDate.toLocaleDateString()}</TableCell>
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
                          <TableCell className={cn(
                            "font-semibold border-r border-white/30",
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
                                  "text-center font-medium",
                                  movement.tanks[productName].quantity > 0 ? "text-green-400" :
                                  movement.tanks[productName].quantity < 0 ? "text-red-400" : "text-muted-foreground"
                                )}
                              >
                                {movement.tanks[productName].quantity !== 0 
                                  ? Math.abs(movement.tanks[productName].quantity)
                                  : "-"}
                              </TableCell>
                              <TableCell className="text-center">
                                {movement.tanks[productName].quantity > 0 ? (
                                  <ArrowUp className="mx-auto h-4 w-4 text-green-400" />
                                ) : movement.tanks[productName].quantity < 0 ? (
                                  <ArrowDown className="mx-auto h-4 w-4 text-red-400" />
                                ) : (
                                  <ArrowRight className="mx-auto h-4 w-4 text-muted-foreground" />
                                )}
                              </TableCell>
                              <TableCell className="text-center font-medium bg-brand-navy border-r border-white/30">
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
          </CollapsibleContent>
        </Collapsible>
      </div>
    </Layout>
  );
};

export default InventoryPage;
