
import React from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Filter, Thermometer, Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useInventoryState } from '@/hooks/useInventoryState';
import EditableField from '@/components/operations/inventory/EditableField';
import EditableNumberField from '@/components/operations/inventory/EditableNumberField';
import EditableDropdownField from '@/components/operations/inventory/EditableDropdownField';
import ProductToken from '@/components/operations/inventory/ProductToken';
import ProductLegend from '@/components/operations/inventory/ProductLegend';

const stickyColumnWidths = {
  counterparty: 110,
  tradeRef: 80,
  bargeName: 90,
  movementDate: 75,
  nominationDate: 75,
  customs: 75,
  sustainability: 90,
  comments: 90,
  quantity: 70,
};

const totalStickyWidth = Object.values(stickyColumnWidths).reduce((sum, width) => sum + width, 0);

const summaryColumnWidths = {
  totalMT: 80,
  totalM3: 80,
  t1Balance: 80,
  t2Balance: 80,
  currentStock: 100,
  currentUllage: 100,
};

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
  totalMT: "Total (MT)",
  totalM3: "Total (M³)",
  t1Balance: "T1",
  t2Balance: "T2",
  currentStock: "Current Stock",
  currentUllage: "Current Ullage",
};

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
  const {
    movements,
    tanks,
    rowTotals,
    productOptions,
    heatingOptions,
    PRODUCT_COLORS,
    updateMovementQuantity,
    updateMovementComments,
    updateTankProduct,
    updateTankSpec,
    updateTankHeating
  } = useInventoryState();
  
  const tankIds = Object.keys(tanks);
  
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
        
        <ProductLegend />
        
        <Card className="border-r-[3px] border-brand-lime/60 bg-gradient-to-br from-brand-navy/75 to-brand-navy/90">
          <CardHeader>
            <CardTitle>Inventory Movements</CardTitle>
            <CardDescription>
              All product movements affecting tank levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative border rounded-md overflow-hidden">
              <div className="flex">
                <ScrollArea 
                  className="flex-shrink-0 z-30 border-r border-white/30" 
                  orientation="horizontal"
                  style={{ width: `${totalStickyWidth}px` }}
                >
                  <div style={{ minWidth: `${totalStickyWidth}px` }}>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50 border-b border-white/10 h-12">
                          <TableHead 
                            colSpan={9} 
                            className="bg-brand-navy text-[10px]"
                          ></TableHead>
                        </TableRow>
                        <TableRow className="bg-muted/40 border-b border-white/10 h-10">
                          <TableHead 
                            colSpan={9} 
                            className="bg-brand-navy text-[10px]"
                          ></TableHead>
                        </TableRow>
                        <TableRow className="bg-muted/40 border-b border-white/10 h-14">
                          <TableHead 
                            colSpan={9} 
                            className="bg-brand-navy text-[10px]"
                          ></TableHead>
                        </TableRow>
                        <TableRow className="bg-muted/40 border-b border-white/10 h-14">
                          <TableHead 
                            colSpan={9} 
                            className="bg-brand-navy text-[10px]"
                          ></TableHead>
                        </TableRow>
                        <TableRow className="bg-muted/40 border-b border-white/10 h-8">
                          <TableHead 
                            colSpan={9} 
                            className="bg-brand-navy text-[10px]"
                          ></TableHead>
                        </TableRow>
                        <TableRow className="bg-muted/40 border-b border-white/10 h-8">
                          <TableHead 
                            colSpan={9} 
                            className="bg-brand-navy text-[10px]"
                          ></TableHead>
                        </TableRow>
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
                        {movements.map((movement, index) => {
                          const bgColorClass = movement.buySell === "buy" 
                            ? "bg-green-900/10 hover:bg-green-900/20" 
                            : "bg-red-900/10 hover:bg-red-900/20";
                          
                          const totals = rowTotals[index];
                          
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
                                  movement.customsStatus === "T1" 
                                    ? "bg-green-900/60 text-green-200" 
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
                                <EditableField
                                  initialValue={movement.comments}
                                  onSave={(value) => updateMovementComments(movement.id, value)}
                                  maxWidth={stickyColumnWidths.comments - 16}
                                  className="text-[10px]"
                                  placeholder="Add comments..."
                                />
                              </TableCell>
                              <TableCell className="bg-brand-navy text-[10px] py-2 border-r border-white/30">
                                {movement.scheduledQuantity !== 0 && (
                                  <div className="flex justify-center">
                                    <ProductToken 
                                      product={Object.values(movement.tanks).find(t => t.quantity !== 0)?.productAtTimeOfMovement || ""}
                                      value={`${movement.buySell === "buy" ? "+" : "-"}${movement.scheduledQuantity}`}
                                    />
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>
                
                <div className="overflow-hidden flex-grow">
                  <ScrollArea className="h-[700px]" orientation="horizontal">
                    <div className="min-w-[1800px]">
                      <Table>
                        <TableHeader>
                          {tankIds.map((tankId) => (
                            <TableHead 
                              key={`${tankId}-header`}
                              colSpan={3} 
                              className={cn(
                                "text-center border-r border-white/30 bg-gradient-to-br from-brand-navy/90 to-brand-navy/70 text-white font-bold text-[10px]"
                              )}
                            >
                              <EditableDropdownField
                                initialValue={tanks[tankId].product}
                                options={productOptions}
                                onSave={(value) => updateTankProduct(tankId, value)}
                                className={cn(
                                  "text-[10px] font-bold text-center w-full",
                                  PRODUCT_COLORS[tanks[tankId].product]?.split(' ')[0]
                                )}
                                truncate={false}
                              />
                            </TableHead>
                          ))}
                          
                          <TableHead 
                            colSpan={1} 
                            className="text-center border-r border-white/30 bg-gradient-to-br from-brand-navy/90 to-brand-navy/70 text-white font-bold text-[10px]"
                          >
                            <div className="text-[10px] font-bold text-center w-full">
                              Summary
                            </div>
                          </TableHead>
                          <TableHead 
                            colSpan={5} 
                            className="text-center border-r border-white/30 bg-gradient-to-br from-brand-navy/90 to-brand-navy/70 text-white font-bold text-[10px]"
                          >
                            <div className="text-[10px] font-bold text-center w-full">
                              Balances
                            </div>
                          </TableHead>
                        </TableHeader>
                        
                        <TableBody>
                          {/* Restore tank details rows */}
                          <TableRow className="bg-muted/40 border-b border-white/10 h-14">
                            {tankIds.map((tankId) => (
                              <React.Fragment key={tankId}>
                                <TableCell className="text-center text-[10px] py-2">
                                  <EditableField 
                                    initialValue={tanks[tankId].tankNumber} 
                                    className="text-center text-[10px]"
                                    placeholder="Tank Number"
                                  />
                                </TableCell>
                                <TableCell className="text-center text-[10px] py-2">
                                  <EditableField 
                                    initialValue={tanks[tankId].spec} 
                                    className="text-center text-[10px]"
                                    placeholder="Tank Spec"
                                  />
                                </TableCell>
                                <TableCell className="text-center text-[10px] py-2 bg-brand-navy border-r border-white/30">
                                  <EditableDropdownField
                                    initialValue={tanks[tankId].heating ? 'true' : 'false'}
                                    options={heatingOptions}
                                    onSave={(value) => updateTankHeating(tankId, value)}
                                    className="text-center text-[10px]"
                                  />
                                </TableCell>
                              </React.Fragment>
                            ))}
                            <TableCell 
                              colSpan={6} 
                              className="text-center text-[10px] py-2 bg-brand-navy/50"
                            >
                              Tank Details
                            </TableCell>
                          </TableRow>

                          {movements.map((movement, index) => {
                            const bgColorClass = movement.buySell === "buy" 
                              ? "bg-green-900/10 hover:bg-green-900/20" 
                              : "bg-red-900/10 hover:bg-red-900/20";
                            
                            const totals = rowTotals[index];
                            
                            return (
                              <TableRow 
                                key={`scroll-${movement.id}`} 
                                className={cn("border-b border-white/5 h-10", bgColorClass)}
                              >
                                {tankIds.map((tankId) => (
                                  <React.Fragment key={`${movement.id}-${tankId}`}>
                                    <TableCell className="text-center text-[10px] py-2">
                                      {movement.tanks[tankId].quantity !== 0 ? (
                                        <EditableNumberField
                                          initialValue={movement.tanks[tankId].quantity}
                                          onSave={(value) => updateMovementQuantity(movement.id, tankId, value)}
                                          product={movement.tanks[tankId].productAtTimeOfMovement}
                                        />
                                      ) : (
                                        "-"
                                      )}
                                    </TableCell>
                                    <TableCell className="text-center text-[10px] py-2 text-muted-foreground">
                                      {movement.tanks[tankId].quantity !== 0 ? 
                                        Math.round(movement.tanks[tankId].quantity * 1.1) : "-"}
                                    </TableCell>
                                    <TableCell className="text-center text-[10px] py-2 bg-brand-navy border-r border-white/30">
                                      {movement.tanks[tankId].balance}
                                    </TableCell>
                                  </React.Fragment>
                                ))}
                                
                                <TableCell className="text-center text-[10px] py-2">
                                  <span className={totals.totalMT > 0 ? "text-green-500" : "text-red-500"}>
                                    {totals.totalMT !== 0 ? totals.totalMT : "-"}
                                  </span>
                                </TableCell>
                                <TableCell className="text-center text-[10px] py-2">
                                  <span className={totals.totalM3 > 0 ? "text-green-500" : "text-red-500"}>
                                    {totals.totalM3 !== 0 ? totals.totalM3 : "-"}
                                  </span>
                                </TableCell>
                                <TableCell className="text-center text-[10px] py-2 font-medium text-green-400">
                                  {totals.t1Balance !== 0 ? totals.t1Balance : "-"}
                                </TableCell>
                                <TableCell className="text-center text-[10px] py-2 font-medium text-blue-400">
                                  {totals.t2Balance !== 0 ? totals.t2Balance : "-"}
                                </TableCell>
                                <TableCell className="text-center text-[10px] py-2 font-medium">
                                  <span className={totals.currentStock > 0 ? "text-green-500" : "text-red-500"}>
                                    {totals.currentStock}
                                  </span>
                                </TableCell>
                                <TableCell className="text-center text-[10px] py-2 font-medium border-r border-white/30">
                                  <span className={totals.currentUllage > 0 ? "text-green-500" : "text-red-500"}>
                                    {totals.currentUllage}
                                  </span>
                                </TableCell>
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
