This file is a merged representation of the entire codebase, combined into a single document by Repomix. The content has been processed where security check has been disabled.

# File Summary

## Purpose
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Security check has been disabled - content may contain sensitive information

## Additional Info

# Directory Structure
```
public/
  placeholder.svg
src/
  components/
    pricing/
      PriceDetails.tsx
      PriceUploader.tsx
      PricingInstruments.tsx
    trades/
      paper/
        PaperTradeRowActions.tsx
      physical/
        DeleteProgressIndicator.tsx
        FormulaCellDisplay.tsx
        TableErrorState.tsx
        TableLoadingState.tsx
        TableRowActions.tsx
        TradeTableRow.tsx
      FormulaBuilder.tsx
      PaperTradeForm.tsx
      PaperTradeTable.tsx
      PhysicalTradeForm.tsx
      TableErrorState.tsx
      TableLoadingState.tsx
    ui/
      accordion.tsx
      alert-dialog.tsx
      alert.tsx
      aspect-ratio.tsx
      avatar.tsx
      badge.tsx
      breadcrumb.tsx
      button.tsx
      calendar.tsx
      card.tsx
      carousel.tsx
      chart.tsx
      checkbox.tsx
      collapsible.tsx
      command.tsx
      context-menu.tsx
      date-picker.tsx
      dialog.tsx
      drawer.tsx
      dropdown-menu.tsx
      form.tsx
      hover-card.tsx
      input-otp.tsx
      input.tsx
      label.tsx
      menubar.tsx
      navigation-menu.tsx
      pagination.tsx
      popover.tsx
      progress.tsx
      radio-group.tsx
      resizable.tsx
      scroll-area.tsx
      select.tsx
      separator.tsx
      sheet.tsx
      sidebar.tsx
      skeleton.tsx
      slider.tsx
      sonner.tsx
      switch.tsx
      table.tsx
      tabs.tsx
      textarea.tsx
      toast.tsx
      toaster.tsx
      toggle-group.tsx
      toggle.tsx
      tooltip.tsx
      use-toast.ts
    DashboardCard.tsx
    Layout.tsx
  data/
    mockData.ts
  hooks/
    use-mobile.tsx
    use-toast.ts
    usePaperTrades.ts
    useReferenceData.ts
    useTrades.ts
  integrations/
    supabase/
      client.ts
      types.ts
  lib/
    utils.ts
  pages/
    audit/
      AuditLogPage.tsx
    operations/
      OperationsPage.tsx
    pricing/
      PricingAdminPage.tsx
    profile/
      ProfilePage.tsx
    risk/
      ExposurePage.tsx
      MTMPage.tsx
      PNLPage.tsx
      PricesPage.tsx
    trades/
      PaperTradeDeletePage.tsx
      PaperTradeEditPage.tsx
      PaperTradeList.tsx
      PhysicalTradeTable.tsx
      TradeDeletePage.tsx
      TradeEditPage.tsx
      TradeEntryPage.tsx
      TradesPage.tsx
    Index.tsx
    NotFound.tsx
  routes/
    PricingRoutes.tsx
  types/
    common.ts
    index.ts
    paper.ts
    physical.ts
    pricing.ts
    trade.ts
  utils/
    dateParsingUtils.ts
    dateUtils.ts
    formulaCalculation.ts
    formulaUtils.ts
    paperTradeDeleteUtils.ts
    paperTradeSubscriptionUtils.ts
    paperTradeValidationUtils.ts
    physicalTradeDeleteUtils.ts
    physicalTradeSubscriptionUtils.ts
    priceCalculationUtils.ts
    productMapping.ts
    subscriptionUtils.ts
    tradeUtils.ts
    validationUtils.ts
  App.css
  App.tsx
  index.css
  main.tsx
  vite-env.d.ts
supabase/
  config.toml
.gitignore
components.json
database_backup_2103.sql
db_backup_1303.sql
eslint.config.js
index.html
package.json
PAPER_TRADE_IMPLEMENTATION_PLAN.md
postcss.config.js
proration_pricing_exposure.md
README.md
Supabase schema 2103.md
system-architecture.md
tailwind.config.ts
tsconfig.app.json
tsconfig.json
tsconfig.node.json
updated-prd.md
vite.config.ts
```

# Files

## File: public/placeholder.svg
````
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" fill="none"><rect width="1200" height="1200" fill="#EAEAEA" rx="3"/><g opacity=".5"><g opacity=".5"><path fill="#FAFAFA" d="M600.709 736.5c-75.454 0-136.621-61.167-136.621-136.62 0-75.454 61.167-136.621 136.621-136.621 75.453 0 136.62 61.167 136.62 136.621 0 75.453-61.167 136.62-136.62 136.62Z"/><path stroke="#C9C9C9" stroke-width="2.418" d="M600.709 736.5c-75.454 0-136.621-61.167-136.621-136.62 0-75.454 61.167-136.621 136.621-136.621 75.453 0 136.62 61.167 136.62 136.621 0 75.453-61.167 136.62-136.62 136.62Z"/></g><path stroke="url(#a)" stroke-width="2.418" d="M0-1.209h553.581" transform="scale(1 -1) rotate(45 1163.11 91.165)"/><path stroke="url(#b)" stroke-width="2.418" d="M404.846 598.671h391.726"/><path stroke="url(#c)" stroke-width="2.418" d="M599.5 795.742V404.017"/><path stroke="url(#d)" stroke-width="2.418" d="m795.717 796.597-391.441-391.44"/><path fill="#fff" d="M600.709 656.704c-31.384 0-56.825-25.441-56.825-56.824 0-31.384 25.441-56.825 56.825-56.825 31.383 0 56.824 25.441 56.824 56.825 0 31.383-25.441 56.824-56.824 56.824Z"/><g clip-path="url(#e)"><path fill="#666" fill-rule="evenodd" d="M616.426 586.58h-31.434v16.176l3.553-3.554.531-.531h9.068l.074-.074 8.463-8.463h2.565l7.18 7.181V586.58Zm-15.715 14.654 3.698 3.699 1.283 1.282-2.565 2.565-1.282-1.283-5.2-5.199h-6.066l-5.514 5.514-.073.073v2.876a2.418 2.418 0 0 0 2.418 2.418h26.598a2.418 2.418 0 0 0 2.418-2.418v-8.317l-8.463-8.463-7.181 7.181-.071.072Zm-19.347 5.442v4.085a6.045 6.045 0 0 0 6.046 6.045h26.598a6.044 6.044 0 0 0 6.045-6.045v-7.108l1.356-1.355-1.282-1.283-.074-.073v-17.989h-38.689v23.43l-.146.146.146.147Z" clip-rule="evenodd"/></g><path stroke="#C9C9C9" stroke-width="2.418" d="M600.709 656.704c-31.384 0-56.825-25.441-56.825-56.824 0-31.384 25.441-56.825 56.825-56.825 31.383 0 56.824 25.441 56.824 56.825 0 31.383-25.441 56.824-56.824 56.824Z"/></g><defs><linearGradient id="a" x1="554.061" x2="-.48" y1=".083" y2=".087" gradientUnits="userSpaceOnUse"><stop stop-color="#C9C9C9" stop-opacity="0"/><stop offset=".208" stop-color="#C9C9C9"/><stop offset=".792" stop-color="#C9C9C9"/><stop offset="1" stop-color="#C9C9C9" stop-opacity="0"/></linearGradient><linearGradient id="b" x1="796.912" x2="404.507" y1="599.963" y2="599.965" gradientUnits="userSpaceOnUse"><stop stop-color="#C9C9C9" stop-opacity="0"/><stop offset=".208" stop-color="#C9C9C9"/><stop offset=".792" stop-color="#C9C9C9"/><stop offset="1" stop-color="#C9C9C9" stop-opacity="0"/></linearGradient><linearGradient id="c" x1="600.792" x2="600.794" y1="403.677" y2="796.082" gradientUnits="userSpaceOnUse"><stop stop-color="#C9C9C9" stop-opacity="0"/><stop offset=".208" stop-color="#C9C9C9"/><stop offset=".792" stop-color="#C9C9C9"/><stop offset="1" stop-color="#C9C9C9" stop-opacity="0"/></linearGradient><linearGradient id="d" x1="404.85" x2="796.972" y1="403.903" y2="796.02" gradientUnits="userSpaceOnUse"><stop stop-color="#C9C9C9" stop-opacity="0"/><stop offset=".208" stop-color="#C9C9C9"/><stop offset=".792" stop-color="#C9C9C9"/><stop offset="1" stop-color="#C9C9C9" stop-opacity="0"/></linearGradient><clipPath id="e"><path fill="#fff" d="M581.364 580.535h38.689v38.689h-38.689z"/></clipPath></defs></svg>
````

## File: src/components/pricing/PriceDetails.tsx
````typescript
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  calculateTradeLegPrice, 
  calculateMTMPrice, 
  calculateMTMValue, 
  PricingPeriodType,
  applyPricingFormula 
} from '@/utils/priceCalculationUtils';
import { format } from 'date-fns';
import { Instrument, PricingFormula, PriceDetail, MTMPriceDetail } from '@/types';
import { formulaToDisplayString } from '@/utils/formulaUtils';

interface PriceDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  tradeLegId: string;
  formula?: PricingFormula;
  mtmFormula?: PricingFormula;
  startDate: Date;
  endDate: Date;
  quantity: number;
  buySell: 'buy' | 'sell';
}

const PriceDetails: React.FC<PriceDetailsProps> = ({
  isOpen,
  onClose,
  tradeLegId,
  formula,
  mtmFormula,
  startDate,
  endDate,
  quantity,
  buySell,
}) => {
  const [loading, setLoading] = useState(true);
  const [priceData, setPriceData] = useState<{
    price: number;
    periodType: PricingPeriodType;
    priceDetails: PriceDetail;
  } | null>(null);
  
  const [mtmPriceData, setMtmPriceData] = useState<{
    price: number;
    priceDetails: MTMPriceDetail;
  } | null>(null);
  
  const [mtmValue, setMtmValue] = useState<number>(0);

  useEffect(() => {
    const fetchPriceData = async () => {
      if (!isOpen || !formula) return;
      setLoading(true);

      try {
        // Ensure start date is before end date
        const validStartDate = startDate < endDate ? startDate : endDate;
        const validEndDate = endDate > startDate ? endDate : startDate;

        const tradePriceResult = await calculateTradeLegPrice(
          formula,
          validStartDate,
          validEndDate
        );
        setPriceData(tradePriceResult);
        
        const formulaToUse = mtmFormula || formula;
        const mtmPriceResult = await calculateMTMPrice(formulaToUse);
        setMtmPriceData(mtmPriceResult);
          
        const mtmVal = calculateMTMValue(
          tradePriceResult.price,
          mtmPriceResult.price,
          quantity,
          buySell
        );
        setMtmValue(mtmVal);
      } catch (error) {
        console.error('Error fetching price details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPriceData();
  }, [isOpen, formula, mtmFormula, startDate, endDate, quantity, buySell]);

  const getInstrumentsFromPriceData = (data: any) => {
    if (!data || !data.priceDetails || !data.priceDetails.instruments) return [];
    return Object.keys(data.priceDetails.instruments);
  };

  const tradeInstruments = priceData ? getInstrumentsFromPriceData(priceData) : [];
  const mtmInstruments = mtmPriceData ? getInstrumentsFromPriceData(mtmPriceData) : [];

  const getPricesByDate = () => {
    if (!priceData) return [];
    
    const dateMap = new Map<string, {date: Date, prices: {[instrument: string]: number}, formulaPrice: number}>();
    
    tradeInstruments.forEach(instrument => {
      if (!priceData.priceDetails.instruments[instrument as Instrument]) return;
      
      const instrumentPrices = priceData.priceDetails.instruments[instrument as Instrument]?.prices || [];
      instrumentPrices.forEach(({ date, price }) => {
        const dateStr = date.toISOString().split('T')[0];
        
        if (!dateMap.has(dateStr)) {
          dateMap.set(dateStr, {
            date,
            prices: {
              [instrument]: price
            },
            formulaPrice: 0 // Initialize formula price
          });
        } else {
          const existingEntry = dateMap.get(dateStr)!;
          existingEntry.prices[instrument] = price;
        }
      });
    });
    
    // Calculate formula price for each date
    if (formula) {
      const entries = Array.from(dateMap.values());
      
      entries.forEach(entry => {
        const dailyInstrumentPrices: Record<Instrument, number> = {} as Record<Instrument, number>;
        
        // Fill in the instrument prices for this day
        tradeInstruments.forEach(instrument => {
          dailyInstrumentPrices[instrument as Instrument] = entry.prices[instrument] || 0;
        });
        
        // Apply the formula to get the daily price
        entry.formulaPrice = applyPricingFormula(formula, dailyInstrumentPrices);
      });
      
      return entries.sort((a, b) => b.date.getTime() - a.date.getTime());
    }
    
    return Array.from(dateMap.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  const getAveragePrices = () => {
    const averages: {[instrument: string]: number} = {};
    
    if (priceData && priceData.priceDetails.instruments) {
      tradeInstruments.forEach(instrument => {
        averages[instrument] = priceData.priceDetails.instruments[instrument as Instrument]?.average || 0;
      });
    }
    
    return averages;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-7xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Price Details</DialogTitle>
          <DialogDescription>
            Detailed price information for the selected trade leg
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <p>Loading price details...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <Tabs defaultValue="trade">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="trade">Trade Price</TabsTrigger>
                {mtmPriceData && <TabsTrigger value="mtm">MTM Price</TabsTrigger>}
                {mtmPriceData && <TabsTrigger value="summary">MTM Summary</TabsTrigger>}
              </TabsList>
              
              <TabsContent value="trade">
                {priceData && (
                  <>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            Calculated Price
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            ${priceData.price.toFixed(2)}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            Pricing Period
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm">
                            {format(startDate, 'MMM d, yyyy')} -{' '}
                            {format(endDate, 'MMM d, yyyy')}
                          </div>
                          <Badge
                            className="mt-1"
                            variant={
                              priceData.periodType === 'historical'
                                ? 'default'
                                : priceData.periodType === 'current'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {priceData.periodType}
                          </Badge>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            Quantity
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {quantity.toLocaleString()} MT
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">
                        Pricing Table
                      </h3>

                      {tradeInstruments.length > 0 ? (
                        <Card>
                          <CardHeader className="pb-2 bg-muted/50">
                            <CardTitle className="text-sm font-medium">
                              <span>Consolidated Price Data</span>
                            </CardTitle>
                          </CardHeader>
                          <div className="max-h-[400px] overflow-auto">
                            <Table>
                              <TableHeader className="sticky top-0 bg-background z-10">
                                <TableRow>
                                  <TableHead className="w-[120px]">Date</TableHead>
                                  {tradeInstruments.map((instrument) => (
                                    <TableHead key={instrument} className="text-right">
                                      {instrument}
                                    </TableHead>
                                  ))}
                                  <TableHead className="text-right w-[300px]">
                                    {formula ? formulaToDisplayString(formula.tokens) : 'Formula N/A'}
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {getPricesByDate().map((dateEntry) => (
                                  <TableRow key={dateEntry.date.toISOString()}>
                                    <TableCell className="font-medium">
                                      {format(dateEntry.date, 'MMM d, yyyy')}
                                    </TableCell>
                                    {tradeInstruments.map((instrument) => (
                                      <TableCell key={instrument} className="text-right">
                                        ${(dateEntry.prices[instrument] || 0).toFixed(2)}
                                      </TableCell>
                                    ))}
                                    <TableCell className="text-right">
                                      ${dateEntry.formulaPrice.toFixed(2)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                                <TableRow className="bg-muted/20 font-bold border-t-2">
                                  <TableCell className="font-bold">Average</TableCell>
                                  {tradeInstruments.map((instrument) => {
                                    const averages = getAveragePrices();
                                    return (
                                      <TableCell key={`avg-${instrument}`} className="text-right">
                                        ${(averages[instrument] || 0).toFixed(2)}
                                      </TableCell>
                                    );
                                  })}
                                  <TableCell className="text-right text-primary">
                                    ${priceData.price.toFixed(2)}
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>
                        </Card>
                      ) : (
                        <div className="text-muted-foreground">
                          No price details available for this trade leg
                        </div>
                      )}
                    </div>
                  </>
                )}
              </TabsContent>
              
              {mtmPriceData && (
                <TabsContent value="mtm">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          MTM Price
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          ${mtmPriceData.price.toFixed(2)}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          Pricing Type
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge className="mt-1">
                          Latest Available Price
                        </Badge>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          Quantity
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {quantity.toLocaleString()} MT
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      MTM Components
                    </h3>

                    {mtmInstruments.length > 0 ? (
                      mtmInstruments.map((instrument) => (
                        <Card key={instrument} className="overflow-hidden">
                          <CardHeader className="bg-muted/50 pb-3">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-md">
                                {instrument}
                              </CardTitle>
                              <div className="font-medium">
                                Latest Price:{' '}
                                <span className="font-bold">
                                  $
                                  {mtmPriceData.priceDetails.instruments[
                                    instrument as Instrument
                                  ].price.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-3">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Price Date:</span>
                              <span>
                                {mtmPriceData.priceDetails.instruments[instrument as Instrument].date 
                                  ? format(mtmPriceData.priceDetails.instruments[instrument as Instrument].date as Date, 'MMM d, yyyy') 
                                  : 'N/A'}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground mt-2">
                              <p>This price represents the most recent available price for {instrument}.</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-muted-foreground">
                        No MTM price details available for this trade leg
                      </div>
                    )}
                  </div>
                </TabsContent>
              )}
              
              {mtmPriceData && (
                <TabsContent value="summary">
                  <div className="grid grid-cols-1 gap-4 mb-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>MTM Calculation Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell className="font-medium">Trade Price</TableCell>
                              <TableCell className="text-right">${priceData?.price.toFixed(2)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">MTM Price (Latest)</TableCell>
                              <TableCell className="text-right">${mtmPriceData.price.toFixed(2)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Quantity</TableCell>
                              <TableCell className="text-right">{quantity.toLocaleString()} MT</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Direction Factor</TableCell>
                              <TableCell className="text-right">
                                {buySell === 'buy' ? '-1 (Buy)' : '+1 (Sell)'}
                              </TableCell>
                            </TableRow>
                            <TableRow className="font-bold text-lg">
                              <TableCell>MTM Value</TableCell>
                              <TableCell className={`text-right ${mtmValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ${mtmValue.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                        
                        <div className="mt-4 p-4 bg-muted rounded-md">
                          <p className="text-sm text-muted-foreground">
                            MTM Value = (Trade Price - MTM Price) × Quantity × Direction Factor
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">
                            MTM Value = (${priceData?.price.toFixed(2)} - ${mtmPriceData.price.toFixed(2)}) × {quantity.toLocaleString()} × {buySell === 'buy' ? '-1' : '+1'} = ${mtmValue.toFixed(2)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PriceDetails;
````

## File: src/components/pricing/PriceUploader.tsx
````typescript
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, UploadCloud, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { parseExcelDate, formatDateForStorage } from '@/utils/dateParsingUtils';

// Define validation error types
type ValidationError = {
  row: number;
  column: string;
  message: string;
};

// Define upload result type
type UploadResult = {
  success: boolean;
  message: string;
  errors?: ValidationError[];
  rowsProcessed?: number;
  rowsInserted?: number;
};

const PriceUploader = () => {
  const [file, setFile] = useState<File | null>(null);
  const [priceType, setPriceType] = useState<'historical' | 'forward'>('historical');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [instruments, setInstruments] = useState<any[]>([]);

  // Fetch pricing instruments on component mount
  React.useEffect(() => {
    const fetchInstruments = async () => {
      try {
        const { data, error } = await supabase
          .from('pricing_instruments')
          .select('id, instrument_code, display_name')
          .order('display_name');
        
        if (error) throw error;
        setInstruments(data || []);
      } catch (error: any) {
        console.error('Error fetching instruments:', error.message);
        toast.error('Failed to load pricing instruments');
      }
    };

    fetchInstruments();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setUploadResult(null);
    }
  };

  const validateHistoricalPriceData = (data: any[]): ValidationError[] => {
    const errors: ValidationError[] = [];
    const instrumentCodes = new Set(instruments.map(i => i.instrument_code));
    const processedDates = new Map<string, Set<string>>();

    data.forEach((row, index) => {
      const rowNum = index + 2; // +2 because of 0-indexing and header row
      
      // Validate date with enhanced date parsing
      if (!row.Date) {
        errors.push({ row: rowNum, column: 'Date', message: 'Missing date' });
      } else {
        const parsedDateResult = parseExcelDate(row.Date);
        
        if (!parsedDateResult.success) {
          errors.push({ 
            row: rowNum, 
            column: 'Date', 
            message: parsedDateResult.error || 'Invalid date format' 
          });
        } else {
          // Store the parsed date back in the row for later processing
          row.ParsedDate = parsedDateResult.date;
          
          // Check for duplicate dates per instrument
          const dateStr = formatDateForStorage(parsedDateResult.date!);
          
          // Check each instrument column for duplicates
          Object.keys(row).forEach(key => {
            if (key === 'Date' || key === 'ParsedDate') return;
            
            if (!instrumentCodes.has(key)) return; // Skip non-instrument columns
            
            if (!processedDates.has(key)) {
              processedDates.set(key, new Set());
            }
            
            const datesForInstrument = processedDates.get(key)!;
            if (datesForInstrument.has(dateStr)) {
              errors.push({ 
                row: rowNum, 
                column: key, 
                message: `Duplicate date ${dateStr} for instrument ${key}` 
              });
            } else {
              datesForInstrument.add(dateStr);
            }
          });
        }
      }

      // Check for each instrument column
      Object.keys(row).forEach(key => {
        if (key === 'Date' || key === 'ParsedDate') return;
        
        // Validate instrument code
        if (!instrumentCodes.has(key)) {
          errors.push({ row: rowNum, column: key, message: `Unknown instrument code: ${key}` });
          return;
        }
        
        // Validate price value
        const price = row[key];
        if (price === undefined || price === null || price === '') {
          // Empty prices are allowed, they'll be skipped
          return;
        }
        
        const numPrice = Number(price);
        if (isNaN(numPrice)) {
          errors.push({ row: rowNum, column: key, message: `Invalid price value: ${price}` });
        }
      });
    });

    return errors;
  };

  const validateForwardPriceData = (data: any[]): ValidationError[] => {
    const errors: ValidationError[] = [];
    const instrumentCodes = new Set(instruments.map(i => i.instrument_code));
    const processedMonths = new Map<string, Set<string>>();

    data.forEach((row, index) => {
      const rowNum = index + 2; // +2 because of 0-indexing and header row
      
      // Validate forward month with enhanced date parsing
      if (!row['Forward Month']) {
        errors.push({ row: rowNum, column: 'Forward Month', message: 'Missing forward month' });
      } else {
        // For forward month, we need a yyyy-MM format
        const monthValue = row['Forward Month'];
        let monthStr: string | null = null;
        
        // If it's already a properly formatted string
        if (typeof monthValue === 'string' && /^\d{4}-\d{2}$/.test(monthValue)) {
          monthStr = monthValue;
        } 
        // If it's a full date, extract year and month
        else {
          const parsedDateResult = parseExcelDate(monthValue);
          
          if (parsedDateResult.success && parsedDateResult.date) {
            const date = parsedDateResult.date;
            monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          } else {
            errors.push({ 
              row: rowNum, 
              column: 'Forward Month', 
              message: 'Invalid month format. Use YYYY-MM or a recognizable date' 
            });
          }
        }
        
        if (monthStr) {
          // Store the parsed month back in the row for later processing
          row.ParsedMonth = monthStr;
          
          // Check for duplicate months per instrument
          Object.keys(row).forEach(key => {
            if (key === 'Forward Month' || key === 'ParsedMonth') return;
            
            if (!instrumentCodes.has(key)) return; // Skip non-instrument columns
            
            if (!processedMonths.has(key)) {
              processedMonths.set(key, new Set());
            }
            
            const monthsForInstrument = processedMonths.get(key)!;
            if (monthsForInstrument.has(monthStr!)) {
              errors.push({ 
                row: rowNum, 
                column: key, 
                message: `Duplicate month ${monthStr} for instrument ${key}` 
              });
            } else {
              monthsForInstrument.add(monthStr!);
            }
          });
        }
      }

      // Check for each instrument column
      Object.keys(row).forEach(key => {
        if (key === 'Forward Month' || key === 'ParsedMonth') return;
        
        // Validate instrument code
        if (!instrumentCodes.has(key)) {
          errors.push({ row: rowNum, column: key, message: `Unknown instrument code: ${key}` });
          return;
        }
        
        // Validate price value
        const price = row[key];
        if (price === undefined || price === null || price === '') {
          // Empty prices are allowed, they'll be skipped
          return;
        }
        
        const numPrice = Number(price);
        if (isNaN(numPrice)) {
          errors.push({ row: rowNum, column: key, message: `Invalid price value: ${price}` });
        }
      });
    });

    return errors;
  };

  const processHistoricalPriceData = async (data: any[]): Promise<UploadResult> => {
    const instrumentIdMap = new Map(instruments.map(i => [i.instrument_code, i.id]));
    let rowsProcessed = 0;
    let rowsInserted = 0;
    const batchSize = 50;
    const rows = [];

    for (const row of data) {
      rowsProcessed++;
      // Use the pre-parsed date from validation step, or try to parse again
      const date = row.ParsedDate || (row.Date ? parseExcelDate(row.Date).date : null);
      
      if (!date) continue;
      
      const dateStr = formatDateForStorage(date);
      
      for (const [key, value] of Object.entries(row)) {
        if (key === 'Date' || key === 'ParsedDate' || value === '' || value === null || value === undefined) continue;
        
        const instrumentId = instrumentIdMap.get(key);
        if (!instrumentId) continue;
        
        const price = Number(value);
        if (isNaN(price)) continue;
        
        rows.push({
          instrument_id: instrumentId,
          price_date: dateStr,
          price: price
        });
      }
    }

    // Process in batches
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { error } = await supabase
        .from('historical_prices')
        .upsert(batch, { onConflict: 'instrument_id,price_date' });
      
      if (error) {
        console.error('Error inserting historical prices:', error);
        return {
          success: false,
          message: `Error inserting data: ${error.message}`,
          rowsProcessed,
          rowsInserted: i
        };
      }
      
      rowsInserted += batch.length;
    }

    return {
      success: true,
      message: `Successfully processed ${rowsProcessed} rows and inserted ${rowsInserted} price points.`,
      rowsProcessed,
      rowsInserted
    };
  };

  const processForwardPriceData = async (data: any[]): Promise<UploadResult> => {
    const instrumentIdMap = new Map(instruments.map(i => [i.instrument_code, i.id]));
    let rowsProcessed = 0;
    let rowsInserted = 0;
    const batchSize = 50;
    const rows = [];

    for (const row of data) {
      rowsProcessed++;
      
      // Use the pre-parsed month from validation step, or try to parse
      let monthStr = row.ParsedMonth;
      
      if (!monthStr && row['Forward Month']) {
        const parsedDate = parseExcelDate(row['Forward Month']);
        if (parsedDate.success && parsedDate.date) {
          const date = parsedDate.date;
          monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }
      }
      
      if (!monthStr) continue;
      
      const dateStr = `${monthStr}-01`; // First day of month
      
      for (const [key, value] of Object.entries(row)) {
        if (key === 'Forward Month' || key === 'ParsedMonth' || value === '' || value === null || value === undefined) continue;
        
        const instrumentId = instrumentIdMap.get(key);
        if (!instrumentId) continue;
        
        const price = Number(value);
        if (isNaN(price)) continue;
        
        rows.push({
          instrument_id: instrumentId,
          forward_month: dateStr,
          price: price
        });
      }
    }

    // Process in batches
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { error } = await supabase
        .from('forward_prices')
        .upsert(batch, { onConflict: 'instrument_id,forward_month' });
      
      if (error) {
        console.error('Error inserting forward prices:', error);
        return {
          success: false,
          message: `Error inserting data: ${error.message}`,
          rowsProcessed,
          rowsInserted: i
        };
      }
      
      rowsInserted += batch.length;
    }

    return {
      success: true,
      message: `Successfully processed ${rowsProcessed} rows and inserted ${rowsInserted} price points.`,
      rowsProcessed,
      rowsInserted
    };
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      // Parse Excel file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Convert to JSON with header handling
      const options = { 
        raw: false, 
        dateNF: 'yyyy-mm-dd',
        header: 1
      };
      
      // Get the header row and data rows
      const rows = XLSX.utils.sheet_to_json(worksheet, { ...options, header: 1 });
      
      if (rows.length < 2) {
        setUploadResult({
          success: false,
          message: 'The uploaded file contains no data or is missing headers'
        });
        setIsUploading(false);
        return;
      }
      
      // Extract headers from first row
      const headers = rows[0] as string[];
      
      // Create array of objects with proper headers
      const jsonData = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i] as any[];
        const obj: Record<string, any> = {};
        
        for (let j = 0; j < headers.length; j++) {
          if (j < row.length) {
            obj[headers[j]] = row[j];
          }
        }
        
        // Skip empty rows (rows with no values)
        const hasValues = Object.values(obj).some(val => val !== undefined && val !== null && val !== '');
        if (hasValues) {
          jsonData.push(obj);
        }
      }
      
      if (jsonData.length === 0) {
        setUploadResult({
          success: false,
          message: 'The uploaded file contains no valid data rows'
        });
        setIsUploading(false);
        return;
      }

      // Validate data
      const errors = priceType === 'historical' 
        ? validateHistoricalPriceData(jsonData)
        : validateForwardPriceData(jsonData);
      
      if (errors.length > 0) {
        setUploadResult({
          success: false,
          message: `Validation failed with ${errors.length} errors`,
          errors
        });
        setIsUploading(false);
        return;
      }

      // Process and upload data
      const result = priceType === 'historical'
        ? await processHistoricalPriceData(jsonData)
        : await processForwardPriceData(jsonData);
      
      setUploadResult(result);
      
      if (result.success) {
        toast.success('Price data uploaded successfully');
      } else {
        toast.error('Failed to upload price data');
      }
    } catch (error: any) {
      console.error('Error processing file:', error);
      setUploadResult({
        success: false,
        message: `Error processing file: ${error.message}`
      });
      toast.error('Failed to process file');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      priceType === 'historical' 
        ? { Date: new Date() }
        : { 'Forward Month': format(new Date(), 'yyyy-MM') }
    ];
    
    // Add instrument columns
    const rowData = templateData[0];
    instruments.forEach(instrument => {
      rowData[instrument.instrument_code] = '';
    });
    
    // Create worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    
    // Download
    const fileName = priceType === 'historical' 
      ? 'historical_prices_template.xlsx' 
      : 'forward_prices_template.xlsx';
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price-type">Price Type</Label>
          <Select
            value={priceType}
            onValueChange={(value) => setPriceType(value as 'historical' | 'forward')}
          >
            <SelectTrigger id="price-type">
              <SelectValue placeholder="Select price type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="historical">Historical Prices</SelectItem>
              <SelectItem value="forward">Forward Prices</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="excel-file">Excel File</Label>
          <div className="flex items-center gap-2">
            <Input
              id="excel-file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
            >
              Template
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          onClick={handleUpload}
          disabled={!file || isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <UploadCloud className="mr-2 h-4 w-4" />
              Upload
            </>
          )}
        </Button>
      </div>
      
      {uploadResult && (
        <Alert variant={uploadResult.success ? "default" : "destructive"}>
          {uploadResult.success ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>
            {uploadResult.success ? 'Upload Successful' : 'Upload Failed'}
          </AlertTitle>
          <AlertDescription>
            <div className="mt-2">
              <p>{uploadResult.message}</p>
              
              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className="mt-4 max-h-40 overflow-y-auto">
                  <h4 className="text-sm font-medium mb-2">Validation Errors:</h4>
                  <ul className="text-sm space-y-1">
                    {uploadResult.errors.slice(0, 10).map((error, idx) => (
                      <li key={idx}>
                        Row {error.row}, Column "{error.column}": {error.message}
                      </li>
                    ))}
                    {uploadResult.errors.length > 10 && (
                      <li>...and {uploadResult.errors.length - 10} more errors</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Upload Instructions</h3>
        
        <div className="text-sm space-y-2">
          <p>
            <strong>Historical Prices:</strong> Upload daily price data for instruments. The file must 
            include a <code>Date</code> column in the first column, with additional columns for each 
            instrument code.
          </p>
          
          <p>
            <strong>Forward Prices:</strong> Upload monthly forward price data. The file must include a 
            <code>Forward Month</code> column in YYYY-MM format, with additional columns for each 
            instrument code.
          </p>
          
          <p>
            Download a template file to see the required format. The system will validate your data 
            before uploading and report any errors found.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PriceUploader;
````

## File: src/components/pricing/PricingInstruments.tsx
````typescript
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Pencil, Plus, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type PricingInstrument = {
  id: string;
  instrument_code: string;
  display_name: string;
  description: string | null;
  category: string | null;
  is_active: boolean;
};

const PricingInstruments = () => {
  const [instruments, setInstruments] = useState<PricingInstrument[]>([]);
  const [filteredInstruments, setFilteredInstruments] = useState<PricingInstrument[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentInstrument, setCurrentInstrument] = useState<Partial<PricingInstrument> | null>(null);
  
  const fetchInstruments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('pricing_instruments')
        .select('*')
        .order('display_name');
      
      if (error) throw error;
      setInstruments(data || []);
      setFilteredInstruments(data || []);
    } catch (error: any) {
      console.error('Error fetching instruments:', error.message);
      toast.error('Failed to load pricing instruments');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchInstruments();
  }, []);
  
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredInstruments(instruments);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = instruments.filter(
        instrument => 
          instrument.instrument_code.toLowerCase().includes(term) ||
          instrument.display_name.toLowerCase().includes(term) ||
          (instrument.description && instrument.description.toLowerCase().includes(term)) ||
          (instrument.category && instrument.category.toLowerCase().includes(term))
      );
      setFilteredInstruments(filtered);
    }
  }, [searchTerm, instruments]);
  
  const handleEdit = (instrument: PricingInstrument) => {
    setCurrentInstrument(instrument);
    setIsDialogOpen(true);
  };
  
  const handleAdd = () => {
    setCurrentInstrument({
      instrument_code: '',
      display_name: '',
      description: '',
      category: '',
      is_active: true
    });
    setIsDialogOpen(true);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentInstrument || !currentInstrument.instrument_code || !currentInstrument.display_name) {
      toast.error('Code and name are required');
      return;
    }
    
    try {
      if (currentInstrument.id) {
        // Update existing
        const { error } = await supabase
          .from('pricing_instruments')
          .update({
            instrument_code: currentInstrument.instrument_code,
            display_name: currentInstrument.display_name,
            description: currentInstrument.description,
            category: currentInstrument.category,
            is_active: currentInstrument.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentInstrument.id);
          
        if (error) throw error;
        toast.success('Instrument updated successfully');
      } else {
        // Insert new
        const { error } = await supabase
          .from('pricing_instruments')
          .insert({
            instrument_code: currentInstrument.instrument_code,
            display_name: currentInstrument.display_name,
            description: currentInstrument.description,
            category: currentInstrument.category,
            is_active: currentInstrument.is_active
          });
          
        if (error) throw error;
        toast.success('Instrument added successfully');
      }
      
      // Refresh list and close dialog
      await fetchInstruments();
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving instrument:', error.message);
      toast.error(`Failed to save: ${error.message}`);
    }
  };
  
  const handleToggleActive = async (instrument: PricingInstrument) => {
    try {
      const { error } = await supabase
        .from('pricing_instruments')
        .update({ 
          is_active: !instrument.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', instrument.id);
        
      if (error) throw error;
      
      // Update local state
      setInstruments(instruments.map(item => 
        item.id === instrument.id 
          ? { ...item, is_active: !item.is_active } 
          : item
      ));
      
      toast.success(`Instrument ${instrument.is_active ? 'deactivated' : 'activated'}`);
    } catch (error: any) {
      console.error('Error updating instrument status:', error.message);
      toast.error('Failed to update instrument status');
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search" 
            placeholder="Search instruments..."
            className="pl-8 w-[300px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Instrument
        </Button>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInstruments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                  {isLoading ? 'Loading instruments...' : 'No instruments found'}
                </TableCell>
              </TableRow>
            ) : (
              filteredInstruments.map((instrument) => (
                <TableRow key={instrument.id}>
                  <TableCell className="font-mono">{instrument.instrument_code}</TableCell>
                  <TableCell>{instrument.display_name}</TableCell>
                  <TableCell>{instrument.category || '—'}</TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {instrument.description || '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={instrument.is_active}
                        onCheckedChange={() => handleToggleActive(instrument)}
                        aria-label="Toggle active state"
                      />
                      <span className={instrument.is_active ? 'text-green-600' : 'text-muted-foreground'}>
                        {instrument.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEdit(instrument)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {currentInstrument?.id ? 'Edit Instrument' : 'Add New Instrument'}
              </DialogTitle>
              <DialogDescription>
                {currentInstrument?.id 
                  ? 'Update the details for this pricing instrument' 
                  : 'Add a new pricing instrument to the system'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="instrument-code" className="text-right">
                  Code
                </Label>
                <Input
                  id="instrument-code"
                  value={currentInstrument?.instrument_code || ''}
                  onChange={(e) => setCurrentInstrument({
                    ...currentInstrument!,
                    instrument_code: e.target.value
                  })}
                  className="col-span-3"
                  required
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="display-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="display-name"
                  value={currentInstrument?.display_name || ''}
                  onChange={(e) => setCurrentInstrument({
                    ...currentInstrument!,
                    display_name: e.target.value
                  })}
                  className="col-span-3"
                  required
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Category
                </Label>
                <Select
                  value={currentInstrument?.category || ''}
                  onValueChange={(value) => setCurrentInstrument({
                    ...currentInstrument!,
                    category: value
                  })}
                >
                  <SelectTrigger className="col-span-3" id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    <SelectItem value="Biodiesel">Biodiesel</SelectItem>
                    <SelectItem value="Feedstock">Feedstock</SelectItem>
                    <SelectItem value="Refined Products">Refined Products</SelectItem>
                    <SelectItem value="HVO">HVO</SelectItem>
                    <SelectItem value="Ethanol">Ethanol</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Input
                  id="description"
                  value={currentInstrument?.description || ''}
                  onChange={(e) => setCurrentInstrument({
                    ...currentInstrument!,
                    description: e.target.value
                  })}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="is-active" className="text-right">
                  Active
                </Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Switch
                    id="is-active"
                    checked={currentInstrument?.is_active}
                    onCheckedChange={(checked) => setCurrentInstrument({
                      ...currentInstrument!,
                      is_active: checked
                    })}
                  />
                  <Label htmlFor="is-active" className="cursor-pointer">
                    {currentInstrument?.is_active ? 'Active' : 'Inactive'}
                  </Label>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {currentInstrument?.id ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PricingInstruments;
````

## File: src/components/trades/paper/PaperTradeRowActions.tsx
````typescript
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface PaperTradeRowActionsProps {
  tradeId: string;
  legId?: string;
  isMultiLeg: boolean;
  legReference?: string;
  tradeReference: string;
}

const PaperTradeRowActions: React.FC<PaperTradeRowActionsProps> = ({
  tradeId,
  legId,
  isMultiLeg,
  legReference,
  tradeReference,
}) => {
  const navigate = useNavigate();
  
  // Handle row delete action
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isMultiLeg && legId) {
      console.log(`[PAPER_ROW_ACTIONS] Navigating to leg deletion: ${legId}`);
      navigate(`/trades/paper/delete/${tradeId}/leg/${legId}`);
    } else {
      console.log(`[PAPER_ROW_ACTIONS] Navigating to trade deletion: ${tradeId}`);
      navigate(`/trades/paper/delete/${tradeId}`);
    }
  };
  
  // Handle edit action
  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log(`[PAPER_ROW_ACTIONS] Requesting edit for paper trade: ${tradeId}`);
    navigate(`/trades/paper/edit/${tradeId}`);
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Trade
        </DropdownMenuItem>
        {isMultiLeg && legId && legReference ? (
          <DropdownMenuItem 
            onClick={handleDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Trade Leg
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem 
            onClick={handleDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Trade
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PaperTradeRowActions;
````

## File: src/components/trades/physical/DeleteProgressIndicator.tsx
````typescript
import React from 'react';
import { Progress } from '@/components/ui/progress';

interface DeleteProgressIndicatorProps {
  isDeleting: boolean;
  deletingId: string;
  progress: number;
}

const DeleteProgressIndicator: React.FC<DeleteProgressIndicatorProps> = ({
  isDeleting,
  deletingId,
  progress,
}) => {
  if (!isDeleting) return null;

  return (
    <div className="mb-4">
      <p className="text-sm text-muted-foreground mb-1">
        Deleting {deletingId}... Please wait
      </p>
      <Progress value={progress} className="h-2" />
    </div>
  );
};

export default DeleteProgressIndicator;
````

## File: src/components/trades/physical/FormulaCellDisplay.tsx
````typescript
import React from 'react';
import { PhysicalTrade, PhysicalTradeLeg } from '@/types';
import { formulaToDisplayString } from '@/utils/formulaUtils';

interface FormulaCellDisplayProps {
  trade: PhysicalTrade | PhysicalTradeLeg;
}

const FormulaCellDisplay: React.FC<FormulaCellDisplayProps> = ({ trade }) => {
  if (!trade.formula || !trade.formula.tokens || trade.formula.tokens.length === 0) {
    return <span className="text-muted-foreground italic">No formula</span>;
  }
  
  const displayText = formulaToDisplayString(trade.formula.tokens);
  
  return (
    <div className="max-w-[300px] overflow-hidden">
      <span 
        className="text-sm font-mono hover:bg-muted px-1 py-0.5 rounded" 
        title={displayText}
      >
        {displayText}
      </span>
    </div>
  );
};

export default FormulaCellDisplay;
````

## File: src/components/trades/physical/TableErrorState.tsx
````typescript
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TableErrorStateProps {
  error: Error | null;
  onRetry: () => void;
}

const TableErrorState: React.FC<TableErrorStateProps> = ({ error, onRetry }) => {
  return (
    <div className="p-8 flex flex-col items-center text-center space-y-4">
      <AlertCircle className="h-10 w-10 text-destructive" />
      <div>
        <h3 className="font-medium">Failed to load trades</h3>
        <p className="text-muted-foreground text-sm">
          {error instanceof Error ? error.message : 'Unknown error occurred'}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try Again
      </Button>
    </div>
  );
};

export default TableErrorState;
````

## File: src/components/trades/physical/TableLoadingState.tsx
````typescript
import React from 'react';
import { Loader2 } from 'lucide-react';

const TableLoadingState: React.FC = () => {
  return (
    <div className="p-8 flex justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
};

export default TableLoadingState;
````

## File: src/components/trades/physical/TableRowActions.tsx
````typescript
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface TableRowActionsProps {
  tradeId: string;
  legId?: string;
  isMultiLeg: boolean;
  legReference?: string;
  tradeReference: string;
}

const TableRowActions: React.FC<TableRowActionsProps> = ({
  tradeId,
  legId,
  isMultiLeg,
  legReference,
  tradeReference,
}) => {
  const navigate = useNavigate();
  
  // Handle row delete action
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isMultiLeg && legId) {
      console.log(`[ROW_ACTIONS] Navigating to leg deletion: ${legId}`);
      navigate(`/trades/delete/${tradeId}/leg/${legId}`);
    } else {
      console.log(`[ROW_ACTIONS] Navigating to trade deletion: ${tradeId}`);
      navigate(`/trades/delete/${tradeId}`);
    }
  };
  
  // Handle edit action
  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log(`[ROW_ACTIONS] Requesting edit for trade: ${tradeId}`);
    navigate(`/trades/edit/${tradeId}`);
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Trade
        </DropdownMenuItem>
        {isMultiLeg && legId && legReference ? (
          <DropdownMenuItem 
            onClick={handleDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Trade Leg
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem 
            onClick={handleDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Trade
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TableRowActions;
````

## File: src/components/trades/physical/TradeTableRow.tsx
````typescript
import React from 'react';
import { Link } from 'react-router-dom';
import { Link2 } from 'lucide-react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PhysicalTrade, PhysicalTradeLeg } from '@/types';
import FormulaCellDisplay from './FormulaCellDisplay';
import TableRowActions from './TableRowActions';

interface TradeTableRowProps {
  trade: PhysicalTrade;
  leg: PhysicalTradeLeg;
  legIndex: number;
}

const TradeTableRow: React.FC<TradeTableRowProps> = ({
  trade,
  leg,
  legIndex,
}) => {
  const hasMultipleLegs = trade.legs && trade.legs.length > 1;
  
  return (
    <TableRow className={legIndex > 0 ? "border-t-0" : undefined}>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Link to={`/trades/${trade.id}`} className="text-primary hover:underline">
            {trade.physicalType === 'term' ? 
              `${trade.tradeReference}-${leg.legReference.split('-').pop()}` : 
              trade.tradeReference
            }
          </Link>
          {hasMultipleLegs && trade.physicalType === 'term' && (
            <Badge variant="outline" className="h-5 text-xs">
              <Link2 className="mr-1 h-3 w-3" />
              {legIndex === 0 ? "Primary" : `Leg ${legIndex + 1}`}
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="capitalize">{leg.buySell}</TableCell>
      <TableCell>{leg.incoTerm}</TableCell>
      <TableCell className="text-right">{leg.quantity} {leg.unit}</TableCell>
      <TableCell>{leg.product}</TableCell>
      <TableCell>{trade.counterparty}</TableCell>
      <TableCell>
        <FormulaCellDisplay trade={leg} />
      </TableCell>
      <TableCell className="text-center">
        <TableRowActions
          tradeId={trade.id}
          legId={leg.id}
          isMultiLeg={hasMultipleLegs && trade.physicalType === 'term'}
          legReference={leg.legReference}
          tradeReference={trade.tradeReference}
        />
      </TableCell>
    </TableRow>
  );
};

export default TradeTableRow;
````

## File: src/components/trades/FormulaBuilder.tsx
````typescript
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { FormulaToken, Instrument, PricingFormula } from '@/types';
import { 
  createInstrumentToken,
  createFixedValueToken,
  createPercentageToken,
  createOperatorToken,
  createOpenBracketToken,
  createCloseBracketToken,
  formulaToString
} from '@/utils/formulaUtils';
import { 
  canAddTokenType, 
  calculateExposures,
  calculatePhysicalExposure,
  calculatePricingExposure,
  createEmptyExposureResult
} from '@/utils/formulaCalculation';

interface FormulaBuilderProps {
  value: PricingFormula;
  onChange: (formula: PricingFormula) => void;
  tradeQuantity: number;
  buySell?: 'buy' | 'sell';
  selectedProduct?: string;
  formulaType: 'price' | 'mtm';
  otherFormula?: PricingFormula;
}

const FormulaBuilder: React.FC<FormulaBuilderProps> = ({ 
  value, 
  onChange,
  tradeQuantity,
  buySell = 'buy',
  selectedProduct,
  formulaType,
  otherFormula
}) => {
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument>('Argus UCOME');
  const [fixedValue, setFixedValue] = useState<string>('0');
  const [percentageValue, setPercentageValue] = useState<string>('0');

  useEffect(() => {
    if (value.tokens.length > 0 && tradeQuantity !== 0) {
      if (formulaType === 'price') {
        const pricingExposure = calculatePricingExposure(value.tokens, tradeQuantity, buySell);
        const physicalExposure = otherFormula && otherFormula.tokens.length > 0 
          ? calculatePhysicalExposure(otherFormula.tokens, tradeQuantity, buySell)
          : createEmptyExposureResult().physical;
        
        if (JSON.stringify({ physical: physicalExposure, pricing: pricingExposure }) !== JSON.stringify(value.exposures)) {
          onChange({
            ...value,
            exposures: {
              physical: physicalExposure,
              pricing: pricingExposure
            }
          });
        }
      } 
      else if (formulaType === 'mtm') {
        const physicalExposure = calculatePhysicalExposure(value.tokens, tradeQuantity, buySell);
        const pricingExposure = otherFormula && otherFormula.tokens.length > 0
          ? calculatePricingExposure(otherFormula.tokens, tradeQuantity, buySell)
          : createEmptyExposureResult().pricing;
        
        if (JSON.stringify({ physical: physicalExposure, pricing: pricingExposure }) !== JSON.stringify(value.exposures)) {
          onChange({
            ...value,
            exposures: {
              physical: physicalExposure,
              pricing: pricingExposure
            }
          });
        }
      }
    }
  }, [value.tokens, otherFormula?.tokens, tradeQuantity, buySell, formulaType]);

  const handleAddInstrument = () => {
    if (!canAddTokenType(value.tokens, 'instrument')) return;
    const newToken = createInstrumentToken(selectedInstrument);
    const newTokens = [...value.tokens, newToken];
    onChange({
      tokens: newTokens,
      exposures: calculateExposures(newTokens, tradeQuantity, buySell, selectedProduct)
    });
  };

  const handleAddFixedValue = () => {
    if (!canAddTokenType(value.tokens, 'fixedValue')) return;
    const newToken = createFixedValueToken(Number(fixedValue) || 0);
    const newTokens = [...value.tokens, newToken];
    onChange({
      tokens: newTokens,
      exposures: calculateExposures(newTokens, tradeQuantity, buySell, selectedProduct)
    });
  };

  const handleAddPercentage = () => {
    if (!canAddTokenType(value.tokens, 'percentage')) return;
    const newToken = createPercentageToken(Number(percentageValue) || 0);
    const newTokens = [...value.tokens, newToken];
    onChange({
      tokens: newTokens,
      exposures: calculateExposures(newTokens, tradeQuantity, buySell, selectedProduct)
    });
  };

  const handleAddOpenBracket = () => {
    if (!canAddTokenType(value.tokens, 'openBracket')) return;
    const newToken = createOpenBracketToken();
    const newTokens = [...value.tokens, newToken];
    onChange({
      tokens: newTokens,
      exposures: calculateExposures(newTokens, tradeQuantity, buySell, selectedProduct)
    });
  };

  const handleAddCloseBracket = () => {
    if (!canAddTokenType(value.tokens, 'closeBracket')) return;
    const newToken = createCloseBracketToken();
    const newTokens = [...value.tokens, newToken];
    onChange({
      tokens: newTokens,
      exposures: calculateExposures(newTokens, tradeQuantity, buySell, selectedProduct)
    });
  };

  const handleAddOperator = (operator: string) => {
    if (!canAddTokenType(value.tokens, 'operator')) return;
    const newToken = createOperatorToken(operator);
    const newTokens = [...value.tokens, newToken];
    onChange({
      tokens: newTokens,
      exposures: calculateExposures(newTokens, tradeQuantity, buySell, selectedProduct)
    });
  };

  const handleRemoveToken = (tokenId: string) => {
    const newTokens = value.tokens.filter(token => token.id !== tokenId);
    onChange({
      tokens: newTokens,
      exposures: calculateExposures(newTokens, tradeQuantity, buySell, selectedProduct)
    });
  };

  const resetFormula = () => {
    onChange({
      tokens: [],
      exposures: {
        physical: {
          'Argus UCOME': 0,
          'Argus RME': 0,
          'Argus FAME0': 0,
          'Platts LSGO': 0,
          'Platts Diesel': 0,
          'Argus HVO': 0,
          'ICE GASOIL FUTURES': 0,
        },
        pricing: {
          'Argus UCOME': 0,
          'Argus RME': 0,
          'Argus FAME0': 0,
          'Platts LSGO': 0,
          'Platts Diesel': 0,
          'Argus HVO': 0,
          'ICE GASOIL FUTURES': 0,
        }
      }
    });
  };

  const getTokenDisplay = (token: FormulaToken): string => {
    if (token.type === 'percentage') {
      return `${token.value}%`;
    }
    return token.value;
  };

  const formatExposure = (value: number): string => {
    return Math.round(value).toLocaleString('en-US');
  };

  const getExposureColorClass = (value: number): string => {
    if (value > 0) return 'text-green-600 border-green-200 bg-green-50';
    if (value < 0) return 'text-red-600 border-red-200 bg-red-50';
    return '';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">
          {formulaType === 'price' ? 'Pricing Formula' : 'MTM Formula'}
        </Label>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={resetFormula}
        >
          Reset Formula
        </Button>
      </div>
      
      <Card className="border border-muted">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 flex-wrap min-h-[2.5rem]">
            {value.tokens.length > 0 ? (
              value.tokens.map((token) => (
                <Badge 
                  key={token.id} 
                  variant="outline" 
                  className={`text-sm py-1 px-3 flex items-center gap-2 ${
                    token.type === 'openBracket' || token.type === 'closeBracket' 
                      ? 'bg-gray-100' 
                      : token.type === 'operator' 
                        ? 'bg-blue-50' 
                        : token.type === 'percentage' 
                          ? 'bg-green-50' 
                          : token.type === 'instrument' 
                            ? 'bg-purple-50' 
                            : 'bg-orange-50'
                  }`}
                >
                  {getTokenDisplay(token)}
                  <button 
                    onClick={() => handleRemoveToken(token.id)}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            ) : (
              <div className="text-muted-foreground">No formula defined</div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 flex-1 min-w-[150px]">
          <Label>Operators & Brackets</Label>
          <div className="flex gap-2 flex-wrap">
            <Button 
              type="button" 
              onClick={() => handleAddOperator('+')} 
              size="sm" 
              variant="outline"
              disabled={!canAddTokenType(value.tokens, 'operator')}
            >
              +
            </Button>
            <Button 
              type="button" 
              onClick={() => handleAddOperator('-')} 
              size="sm" 
              variant="outline"
              disabled={!canAddTokenType(value.tokens, 'operator')}
            >
              -
            </Button>
            <Button 
              type="button" 
              onClick={() => handleAddOperator('*')} 
              size="sm" 
              variant="outline"
              disabled={!canAddTokenType(value.tokens, 'operator')}
            >
              ×
            </Button>
            <Button 
              type="button" 
              onClick={() => handleAddOperator('/')} 
              size="sm" 
              variant="outline"
              disabled={!canAddTokenType(value.tokens, 'operator')}
            >
              ÷
            </Button>
            <Button 
              type="button" 
              onClick={handleAddOpenBracket} 
              size="sm" 
              variant="outline"
              disabled={!canAddTokenType(value.tokens, 'openBracket')}
            >
              (
            </Button>
            <Button 
              type="button" 
              onClick={handleAddCloseBracket} 
              size="sm" 
              variant="outline"
              disabled={!canAddTokenType(value.tokens, 'closeBracket')}
            >
              )
            </Button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Add Instrument</Label>
          <div className="flex gap-2">
            <Select 
              value={selectedInstrument} 
              onValueChange={(value) => setSelectedInstrument(value as Instrument)}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select instrument" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Argus UCOME">Argus UCOME</SelectItem>
                <SelectItem value="Argus RME">Argus RME</SelectItem>
                <SelectItem value="Argus FAME0">Argus FAME0</SelectItem>
                <SelectItem value="Argus HVO">Argus HVO</SelectItem>
                <SelectItem value="Platts LSGO">Platts LSGO</SelectItem>
                <SelectItem value="Platts Diesel">Platts Diesel</SelectItem>
                <SelectItem value="ICE GASOIL FUTURES">ICE GASOIL FUTURES</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              type="button" 
              onClick={handleAddInstrument} 
              size="sm"
              disabled={!canAddTokenType(value.tokens, 'instrument')}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Add Fixed Value</Label>
          <div className="flex gap-2">
            <Input 
              type="number"
              value={fixedValue}
              onChange={(e) => setFixedValue(e.target.value)}
              className="flex-1"
            />
            <Button 
              type="button" 
              onClick={handleAddFixedValue} 
              size="sm"
              disabled={!canAddTokenType(value.tokens, 'fixedValue')}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Add Percentage</Label>
          <div className="flex gap-2 items-center">
            <div className="flex-1 flex items-center">
              <Input 
                type="number"
                value={percentageValue}
                onChange={(e) => setPercentageValue(e.target.value)}
                className="flex-1"
              />
              <div className="pl-2 pr-1">%</div>
            </div>
            <Button 
              type="button" 
              onClick={handleAddPercentage} 
              size="sm"
              disabled={!canAddTokenType(value.tokens, 'percentage')}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <div className="mt-4 space-y-4">
        <div>
          <Label className="text-base font-medium">Physical Exposure</Label>
          <div className="mt-2 flex flex-wrap gap-2 min-h-[2.5rem]">
            {Object.entries(value.exposures.physical).map(([instrument, exposure]) => {
              if (exposure === 0) return null;
              
              return (
                <Badge 
                  key={instrument} 
                  variant="outline" 
                  className={`text-sm py-1 px-3 ${getExposureColorClass(exposure)}`}
                >
                  {instrument}: {formatExposure(exposure)} MT
                </Badge>
              );
            })}
            
            {!Object.values(value.exposures.physical).some(v => v !== 0) && (
              <div className="text-muted-foreground">No physical exposures</div>
            )}
          </div>
        </div>
        
        <div>
          <Label className="text-base font-medium">Pricing Exposure</Label>
          <div className="mt-2 flex flex-wrap gap-2 min-h-[2.5rem]">
            {Object.entries(value.exposures.pricing).map(([instrument, exposure]) => {
              if (exposure === 0) return null;
              
              return (
                <Badge 
                  key={instrument} 
                  variant="outline" 
                  className={`text-sm py-1 px-3 ${getExposureColorClass(exposure)}`}
                >
                  {instrument}: {formatExposure(exposure)} MT
                </Badge>
              );
            })}
            
            {!Object.values(value.exposures.pricing).some(v => v !== 0) && (
              <div className="text-muted-foreground">No pricing exposures</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormulaBuilder;
````

## File: src/components/trades/PaperTradeForm.tsx
````typescript
import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { generateLegReference } from '@/utils/tradeUtils';
import PaperTradeTable from './PaperTradeTable';
import { createEmptyFormula } from '@/utils/formulaUtils';
import { validatePaperTradeForm } from '@/utils/paperTradeValidationUtils';
import { supabase } from '@/integrations/supabase/client';
import { getNextMonths } from '@/utils/dateUtils';
import { mapProductToCanonical } from '@/utils/productMapping';

interface PaperTradeFormProps {
  tradeReference: string;
  onSubmit: (trade: any) => void;
  onCancel: () => void;
  isEditMode?: boolean;
  initialData?: any;
}

interface BrokerOption {
  id: string;
  name: string;
}

// List of all products that should always be shown in the exposure table
const ALL_PRODUCTS = [
  'Argus UCOME', 
  'Argus FAME0', 
  'Argus RME', 
  'Platts LSGO', 
  'Argus HVO', 
  'ICE GASOIL FUTURES'
];

const PaperTradeForm: React.FC<PaperTradeFormProps> = ({ 
  tradeReference, 
  onSubmit, 
  onCancel,
  isEditMode = false,
  initialData
}) => {
  const [selectedBroker, setSelectedBroker] = useState('');
  const [brokers, setBrokers] = useState<BrokerOption[]>([]);
  const [isAddingBroker, setIsAddingBroker] = useState(false);
  const [newBrokerName, setNewBrokerName] = useState('');
  
  const [tradeLegs, setTradeLegs] = useState<any[]>(() => {
    if (initialData && initialData.legs && initialData.legs.length > 0) {
      return initialData.legs.map((leg: any) => ({
        ...leg,
        buySell: leg.buySell,
        product: leg.product,
        quantity: leg.quantity,
        period: leg.period,
        price: leg.price,
        broker: leg.broker,
        instrument: leg.instrument,
        relationshipType: leg.relationshipType,
        rightSide: leg.rightSide,
        formula: leg.formula,
        mtmFormula: leg.mtmFormula,
        exposures: leg.exposures
      }));
    }
    return [];
  });
  
  const availableMonths = useMemo(() => getNextMonths(13), []);
  
  const [exposureData, setExposureData] = useState<any[]>(() => {
    // Always initialize with ALL_PRODUCTS for all months
    return availableMonths.map(month => {
      const entry: any = { month };
      ALL_PRODUCTS.forEach(product => {
        entry[product] = 0;
      });
      return entry;
    });
  });
  
  useEffect(() => {
    if (initialData && initialData.broker) {
      const fetchBrokerIdByName = async () => {
        const { data, error } = await supabase
          .from('brokers')
          .select('id')
          .eq('name', initialData.broker)
          .single();
          
        if (data && !error) {
          setSelectedBroker(data.id);
        }
      };
      
      fetchBrokerIdByName();
    }
  }, [initialData]);
  
  useEffect(() => {
    const fetchBrokers = async () => {
      const { data, error } = await supabase
        .from('brokers')
        .select('*')
        .eq('is_active', true)
        .order('name');
        
      if (error) {
        toast.error('Failed to load brokers', {
          description: error.message
        });
        return;
      }
      
      setBrokers(data || []);
      if (data && data.length > 0 && !selectedBroker) {
        setSelectedBroker(data[0].id);
      }
    };
    
    fetchBrokers();
  }, []);
  
  useEffect(() => {
    // Always calculate exposures, even if there are no trade legs
    calculateExposures(tradeLegs);
  }, [tradeLegs]);
  
  const handleAddBroker = async () => {
    if (!newBrokerName.trim()) {
      toast.error('Broker name cannot be empty');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('brokers')
        .insert({ name: newBrokerName.trim() })
        .select()
        .single();
        
      if (error) {
        throw new Error(`Error adding broker: ${error.message}`);
      }
      
      setBrokers([...brokers, data]);
      setSelectedBroker(data.id);
      setNewBrokerName('');
      setIsAddingBroker(false);
      
      toast.success('Broker added successfully');
    } catch (error: any) {
      toast.error('Failed to add broker', {
        description: error.message
      });
    }
  };
  
  const handleLegsChange = (newLegs: any[]) => {
    setTradeLegs(newLegs);
    calculateExposures(newLegs);
  };
  
  const calculateExposures = (legs: any[]) => {
    // Reset all exposures to 0 for all months and all products
    const exposures = availableMonths.map(month => {
      const entry: any = { month };
      ALL_PRODUCTS.forEach(product => {
        entry[product] = 0;
      });
      return entry;
    });
    
    // Only accumulate exposures if there are trade legs
    if (legs.length > 0) {
      legs.forEach(leg => {
        if (!leg.period || !leg.product) return;
        
        const monthIndex = exposures.findIndex(e => e.month === leg.period);
        if (monthIndex === -1) return;
        
        const canonicalProduct = mapProductToCanonical(leg.product);
        
        if (canonicalProduct && ALL_PRODUCTS.includes(canonicalProduct)) {
          const quantity = leg.buySell === 'buy' ? leg.quantity : -leg.quantity;
          exposures[monthIndex][canonicalProduct] += quantity || 0;
        }
        
        if (leg.rightSide && leg.rightSide.product) {
          const rightCanonicalProduct = mapProductToCanonical(leg.rightSide.product);
          if (rightCanonicalProduct && ALL_PRODUCTS.includes(rightCanonicalProduct)) {
            const rightQuantity = leg.rightSide.quantity || 0;
            exposures[monthIndex][rightCanonicalProduct] += rightQuantity;
          }
        }
      });
    }
    
    setExposureData(exposures);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const broker = brokers.find(b => b.id === selectedBroker);
    const brokerName = broker?.name || '';
    
    if (!validatePaperTradeForm(brokerName, tradeLegs)) {
      return;
    }
    
    const tradeData = {
      tradeReference,
      tradeType: 'paper',
      broker: brokerName,
      legs: tradeLegs.map((leg, index) => {
        const legReference = initialData?.legs?.[index]?.legReference || 
                            generateLegReference(tradeReference, index);
                            
        return {
          ...leg,
          legReference,
          broker: brokerName,
          mtmFormula: leg.mtmFormula || createEmptyFormula(),
          formula: leg.formula || createEmptyFormula(),
        };
      })
    };
    
    onSubmit(tradeData);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="broker">Broker</Label>
          <div className="flex space-x-2">
            <Select 
              value={selectedBroker} 
              onValueChange={setSelectedBroker}
              disabled={isAddingBroker}
            >
              <SelectTrigger id="broker" className="flex-grow">
                <SelectValue placeholder="Select broker" />
              </SelectTrigger>
              <SelectContent>
                {brokers.map((broker) => (
                  <SelectItem key={broker.id} value={broker.id}>
                    {broker.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsAddingBroker(!isAddingBroker)}
            >
              {isAddingBroker ? 'Cancel' : '+ Add Broker'}
            </Button>
          </div>
        </div>
        
        {isAddingBroker && (
          <div className="space-y-2">
            <Label htmlFor="new-broker">New Broker</Label>
            <div className="flex space-x-2">
              <Input
                id="new-broker"
                value={newBrokerName}
                onChange={(e) => setNewBrokerName(e.target.value)}
                placeholder="Enter broker name"
                className="flex-grow"
              />
              <Button 
                type="button"
                onClick={handleAddBroker}
              >
                Add
              </Button>
            </div>
          </div>
        )}
      </div>

      <Separator />
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Trade Table</h3>
        <PaperTradeTable
          legs={tradeLegs}
          onLegsChange={handleLegsChange}
        />
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Exposure Table</h3>
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UCOME</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FAME0</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RME</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LSGO</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HVO</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GASOIL</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {exposureData.map((row, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.month}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-bold">{row['Argus UCOME'] || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-bold">{row['Argus FAME0'] || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-bold">{row['Argus RME'] || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-bold">{row['Platts LSGO'] || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-bold">{row['Argus HVO'] || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-bold">{row['ICE GASOIL FUTURES'] || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Separator />

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {isEditMode ? 'Update Trade' : 'Create Trade'}
        </Button>
      </div>
    </form>
  );
};

export default PaperTradeForm;
````

## File: src/components/trades/PaperTradeTable.tsx
````typescript
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { createEmptyFormula } from '@/utils/formulaUtils';
import { toast } from 'sonner';
import { ProductRelationship, PaperRelationshipType, BuySell } from '@/types/trade';
import { getNextMonths } from '@/utils/dateUtils';
import { formatProductDisplay, formatMTMDisplay } from '@/utils/tradeUtils';

interface PaperTradeTableProps {
  legs: any[];
  onLegsChange: (legs: any[]) => void;
}

const PaperTradeTable: React.FC<PaperTradeTableProps> = ({ legs, onLegsChange }) => {
  const [productRelationships, setProductRelationships] = useState<ProductRelationship[]>([]);
  
  const availablePeriods = getNextMonths(13);
  
  useEffect(() => {
    const fetchProductRelationships = async () => {
      const { data, error } = await supabase
        .from('product_relationships')
        .select('*');
        
      if (error) {
        toast.error('Failed to load product relationships', {
          description: error.message
        });
        return;
      }
      
      const typedData = data?.map(item => ({
        ...item,
        relationship_type: item.relationship_type as PaperRelationshipType
      })) as ProductRelationship[];
      
      setProductRelationships(typedData || []);
    };
    
    fetchProductRelationships();
  }, []);
  
  useEffect(() => {
    if (legs.length > 0) {
      const updatedLegs = legs.map(leg => {
        if (leg.relationshipType !== 'FP' && leg.rightSide) {
          if (leg.rightSide.quantity !== -leg.quantity) {
            return {
              ...leg,
              rightSide: {
                ...leg.rightSide,
                quantity: -leg.quantity
              }
            };
          }
        }
        return leg;
      });
      
      const needsUpdate = updatedLegs.some((leg, index) => 
        leg.rightSide?.quantity !== legs[index].rightSide?.quantity
      );
      
      if (needsUpdate) {
        onLegsChange(updatedLegs);
      }
    }
  }, [legs]);
  
  const addLeg = () => {
    const newLeg = {
      id: crypto.randomUUID(),
      product: '',
      buySell: 'buy' as BuySell,
      quantity: 0,
      period: '',
      price: 0,
      relationshipType: 'FP' as PaperRelationshipType,
      rightSide: null,
      formula: createEmptyFormula(),
      mtmFormula: createEmptyFormula(),
      exposures: {
        physical: {},
        paper: {},
        pricing: {}
      }
    };
    
    onLegsChange([...legs, newLeg]);
  };

  const copyPreviousLeg = () => {
    if (legs.length === 0) return;
    
    const previousLeg = legs[legs.length - 1];
    
    const newLeg = {
      ...JSON.parse(JSON.stringify(previousLeg)),
      id: crypto.randomUUID(),
      period: ''
    };
    
    if (newLeg.rightSide) {
      newLeg.rightSide.period = '';
    }
    
    onLegsChange([...legs, newLeg]);
    toast.success('Previous row copied', {
      description: 'Please select a period for the new row'
    });
  };
  
  const removeLeg = (index: number) => {
    const newLegs = [...legs];
    newLegs.splice(index, 1);
    onLegsChange(newLegs);
  };
  
  const handleProductSelect = (index: number, selectedProduct: string) => {
    if (!selectedProduct) {
      return;
    }
    
    const relationship = productRelationships.find(pr => pr.product === selectedProduct);
    
    if (!relationship) {
      toast.error(`Product relationship not found for ${selectedProduct}`);
      return;
    }
    
    const newLegs = [...legs];
    let updatedLeg = { ...newLegs[index] };
    
    if (relationship.relationship_type === 'FP') {
      updatedLeg = {
        ...updatedLeg,
        product: relationship.paired_product || '',
        relationshipType: 'FP' as PaperRelationshipType,
        rightSide: null,
        instrument: `${relationship.paired_product} FP`,
        mtmFormula: {
          ...createEmptyFormula(),
          name: `${relationship.paired_product} FP`,
          exposures: {
            physical: {
              [relationship.paired_product || '']: updatedLeg.quantity || 0
            },
            pricing: {}
          }
        },
        exposures: {
          physical: {
            [relationship.paired_product || '']: updatedLeg.quantity || 0
          },
          paper: {
            [relationship.paired_product || '']: updatedLeg.quantity || 0
          },
          pricing: {}
        }
      };
    } else if (relationship.relationship_type === 'DIFF' || relationship.relationship_type === 'SPREAD') {
      const rightQuantity = updatedLeg.quantity ? -updatedLeg.quantity : 0;
      
      updatedLeg = {
        ...updatedLeg,
        product: relationship.paired_product || '',
        relationshipType: relationship.relationship_type,
        rightSide: {
          product: relationship.default_opposite || '',
          quantity: rightQuantity,
          period: updatedLeg.period || '',
          price: 0
        },
        instrument: relationship.relationship_type === 'DIFF' 
          ? `${relationship.paired_product} DIFF` 
          : `${relationship.paired_product}-${relationship.default_opposite} SPREAD`,
        mtmFormula: {
          ...createEmptyFormula(),
          name: selectedProduct,
          rightSide: {
            product: relationship.default_opposite || '',
            quantity: rightQuantity,
            period: updatedLeg.period || '',
            price: 0
          },
          exposures: {
            physical: {
              [relationship.paired_product || '']: updatedLeg.quantity || 0,
              [relationship.default_opposite || '']: rightQuantity
            }
          }
        },
        exposures: {
          physical: {
            [relationship.paired_product || '']: updatedLeg.quantity || 0,
            [relationship.default_opposite || '']: rightQuantity
          },
          paper: {
            [relationship.paired_product || '']: updatedLeg.quantity || 0,
            [relationship.default_opposite || '']: rightQuantity
          },
          pricing: {}
        }
      };
    }
    
    newLegs[index] = updatedLeg;
    onLegsChange(newLegs);
  };
  
  const updateLeftSide = (index: number, field: string, value: any) => {
    const newLegs = [...legs];
    const leg = { ...newLegs[index] };
    
    (leg as any)[field] = value;
    
    if (leg.rightSide && (field === 'quantity' || field === 'period')) {
      leg.rightSide = {
        ...leg.rightSide,
        quantity: field === 'quantity' ? -value : leg.rightSide.quantity,
        period: field === 'period' ? value : leg.rightSide.period
      };
      
      if (leg.mtmFormula && leg.relationshipType !== 'FP') {
        const exposures = {
          physical: {
            [leg.product]: value,
            [leg.rightSide.product]: -value
          }
        };
        
        leg.mtmFormula = {
          ...leg.mtmFormula,
          exposures
        };
      }
      
      if (field === 'quantity' && leg.relationshipType === 'FP' && leg.product) {
        if (leg.mtmFormula) {
          leg.mtmFormula = {
            ...leg.mtmFormula,
            exposures: {
              physical: {
                [leg.product]: value
              },
              pricing: {}
            }
          };
        }
      }
      
      if (leg.exposures && leg.rightSide && leg.relationshipType !== 'FP') {
        leg.exposures = {
          ...leg.exposures,
          physical: {
            ...leg.exposures.physical,
            [leg.product]: value,
            [leg.rightSide.product]: -value
          },
          paper: {
            ...leg.exposures.paper,
            [leg.product]: value,
            [leg.rightSide.product]: -value
          }
        };
      }
    }
    
    newLegs[index] = leg;
    onLegsChange(newLegs);
  };
  
  const updateRightSide = (index: number, field: string, value: any) => {
    const newLegs = [...legs];
    const leg = { ...newLegs[index] };
    
    if (!leg.rightSide) return;
    
    leg.rightSide = {
      ...leg.rightSide,
      [field]: value
    };
    
    newLegs[index] = leg;
    onLegsChange(newLegs);
  };
  
  const formatValue = (value: any) => {
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    return value;
  };
  
  const getRelationshipDisplayText = (leg: any) => {
    if (!leg.relationshipType) return "Select product";
    
    let relationship;
    
    if (leg.relationshipType === 'FP') {
      relationship = productRelationships.find(pr => 
        pr.relationship_type === 'FP' && 
        pr.paired_product === leg.product
      );
    } else {
      relationship = productRelationships.find(pr => 
        pr.relationship_type === leg.relationshipType && 
        pr.paired_product === leg.product
      );
    }
    
    return relationship?.product || "Select product";
  };

  const getProductDisplay = (leg: any) => {
    if (!leg.product) return "";
    
    return formatProductDisplay(
      leg.product,
      leg.relationshipType,
      leg.rightSide?.product
    );
  };
  
  const getMTMFormulaDisplay = (leg: any) => {
    if (!leg.product) return "";
    
    return formatMTMDisplay(
      leg.product,
      leg.relationshipType,
      leg.rightSide?.product
    );
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-end space-x-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={copyPreviousLeg}
          disabled={legs.length === 0}
        >
          <Copy className="h-4 w-4 mr-1" />
          Copy Previous Row
        </Button>
        <Button type="button" variant="outline" onClick={addLeg}>
          <Plus className="h-4 w-4 mr-1" />
          Add Row
        </Button>
      </div>
      
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" colSpan={1}>PRODUCT TYPE</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" colSpan={4}>LEFT SIDE</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" colSpan={4}>RIGHT SIDE</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" colSpan={2}>MTM</th>
            </tr>
            <tr>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Formula</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {legs.length > 0 ? (
              legs.map((leg, index) => (
                <tr key={leg.id || index}>
                  <td className="px-2 py-3">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeLeg(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                  
                  <td className="px-4 py-3">
                    <Select 
                      value={getRelationshipDisplayText(leg)}
                      onValueChange={(value) => handleProductSelect(index, value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {productRelationships.map((pr) => (
                          <SelectItem key={pr.id} value={pr.product}>
                            {pr.product}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  
                  <td className="px-4 py-3">
                    <Input 
                      type="text" 
                      value={leg.product || ''} 
                      readOnly
                      className="w-full bg-gray-50"
                    />
                  </td>
                  
                  <td className="px-4 py-3">
                    <Input 
                      type="number" 
                      value={leg.quantity || ''} 
                      onChange={(e) => updateLeftSide(index, 'quantity', Number(e.target.value))}
                      className="w-24"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Select 
                      value={leg.period || ''} 
                      onValueChange={(value) => updateLeftSide(index, 'period', value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePeriods.map((period) => (
                          <SelectItem key={period} value={period}>
                            {period}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <Input 
                      type="number" 
                      value={leg.price !== undefined ? leg.price : ''}
                      min="0"
                      onChange={(e) => updateLeftSide(index, 'price', e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-24"
                    />
                  </td>
                  
                  {leg.rightSide ? (
                    <>
                      <td className="px-4 py-3">
                        <Input 
                          type="text" 
                          value={leg.rightSide.product || ''} 
                          readOnly
                          className="w-full bg-gray-50"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input 
                          type="number" 
                          value={leg.rightSide.quantity || ''} 
                          readOnly
                          className="w-24 bg-gray-50"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input 
                          type="text" 
                          value={leg.rightSide.period || ''} 
                          readOnly
                          className="w-32 bg-gray-50"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input 
                          type="number"
                          min="0"
                          value={leg.rightSide.price !== undefined ? leg.rightSide.price : ''}
                          onChange={(e) => updateRightSide(index, 'price', e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-24"
                        />
                      </td>
                    </>
                  ) : (
                    <td colSpan={4} className="px-4 py-3 text-center text-sm text-gray-500">
                      {leg.relationshipType === 'FP' ? 'No right side for Fixed Price' : 'Select a product first'}
                    </td>
                  )}
                  
                  <td className="px-4 py-3">
                    <Input 
                      type="text" 
                      value={getMTMFormulaDisplay(leg)} 
                      readOnly
                      className="w-32 bg-gray-50"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input 
                      type="text" 
                      value={leg.period || ''} 
                      readOnly
                      className="w-32 bg-gray-50"
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={12} className="px-6 py-4 text-center text-sm text-gray-500">
                  No trade legs yet. Click "Add Row" to start building your trade.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaperTradeTable;
````

## File: src/components/trades/PhysicalTradeForm.tsx
````typescript
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useReferenceData } from '@/hooks/useReferenceData';
import { BuySell, Product, PhysicalTradeType, IncoTerm, Unit, PaymentTerm, CreditStatus, PricingFormula, PhysicalParentTrade, PhysicalTradeLeg, PhysicalTrade } from '@/types';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { generateLegReference } from '@/utils/tradeUtils';
import { DatePicker } from '@/components/ui/date-picker';
import FormulaBuilder from './FormulaBuilder';
import { createEmptyFormula } from '@/utils/formulaUtils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { validateDateRange, validateRequiredField, validateFields } from '@/utils/validationUtils';
import { toast } from 'sonner';
import { calculateMonthlyPricingDistribution } from '@/utils/formulaCalculation';

interface PhysicalTradeFormProps {
  tradeReference: string;
  onSubmit: (trade: any) => void;
  onCancel: () => void;
  isEditMode?: boolean;
  initialData?: PhysicalTrade;
}

interface LegFormState {
  buySell: BuySell;
  product: Product;
  sustainability: string;
  incoTerm: IncoTerm;
  unit: Unit;
  paymentTerm: PaymentTerm;
  creditStatus: CreditStatus;
  quantity: number;
  tolerance: number;
  loadingPeriodStart: Date;
  loadingPeriodEnd: Date;
  pricingPeriodStart: Date;
  pricingPeriodEnd: Date;
  formula?: PricingFormula;
  mtmFormula?: PricingFormula;
}

const createDefaultLeg = (): LegFormState => ({
  buySell: 'buy',
  product: 'UCOME',
  sustainability: '',
  incoTerm: 'FOB',
  unit: 'MT',
  paymentTerm: '30 days',
  creditStatus: 'pending',
  quantity: 0,
  tolerance: 5,
  loadingPeriodStart: new Date(),
  loadingPeriodEnd: new Date(),
  pricingPeriodStart: new Date(),
  pricingPeriodEnd: new Date(),
  formula: createEmptyFormula(),
  mtmFormula: createEmptyFormula()
});

const PhysicalTradeForm: React.FC<PhysicalTradeFormProps> = ({ 
  tradeReference, 
  onSubmit, 
  onCancel,
  isEditMode = false,
  initialData
}) => {
  
  const { counterparties, sustainabilityOptions, creditStatusOptions } = useReferenceData();
  const [physicalType, setPhysicalType] = useState<PhysicalTradeType>(initialData?.physicalType || 'spot');
  const [counterparty, setCounterparty] = useState(initialData?.counterparty || '');
  
  const [legs, setLegs] = useState<LegFormState[]>(
    initialData?.legs?.map(leg => ({
      buySell: leg.buySell,
      product: leg.product,
      sustainability: leg.sustainability || '',
      incoTerm: leg.incoTerm,
      unit: leg.unit,
      paymentTerm: leg.paymentTerm,
      creditStatus: leg.creditStatus,
      quantity: leg.quantity,
      tolerance: leg.tolerance,
      loadingPeriodStart: leg.loadingPeriodStart,
      loadingPeriodEnd: leg.loadingPeriodEnd,
      pricingPeriodStart: leg.pricingPeriodStart,
      pricingPeriodEnd: leg.pricingPeriodEnd,
      formula: leg.formula || createEmptyFormula(),
      mtmFormula: leg.mtmFormula || createEmptyFormula()
    })) || [createDefaultLeg()]
  );

  const handleFormulaChange = (formula: PricingFormula, legIndex: number) => {
    const newLegs = [...legs];
    newLegs[legIndex].formula = formula;
    
    if (newLegs[legIndex].pricingPeriodStart && newLegs[legIndex].pricingPeriodEnd) {
      const monthlyDistribution = calculateMonthlyPricingDistribution(
        formula.tokens,
        newLegs[legIndex].quantity || 0,
        newLegs[legIndex].buySell,
        newLegs[legIndex].pricingPeriodStart,
        newLegs[legIndex].pricingPeriodEnd
      );
      
      newLegs[legIndex].formula = {
        ...formula,
        monthlyDistribution
      };
    }
    
    setLegs(newLegs);
  };

  const handleMtmFormulaChange = (formula: PricingFormula, legIndex: number) => {
    const newLegs = [...legs];
    newLegs[legIndex].mtmFormula = formula;
    setLegs(newLegs);
  };

  const addLeg = () => {
    setLegs([...legs, createDefaultLeg()]);
  };

  const removeLeg = (index: number) => {
    if (legs.length > 1) {
      const newLegs = [...legs];
      newLegs.splice(index, 1);
      setLegs(newLegs);
    }
  };

  const updateLeg = (index: number, field: keyof LegFormState, value: string | Date | number | PricingFormula | undefined) => {
    const newLegs = [...legs];
    
    if (field === 'formula' || field === 'mtmFormula') {
      (newLegs[index] as any)[field] = value as PricingFormula;
    } else if (
      field === 'loadingPeriodStart' || 
      field === 'loadingPeriodEnd' || 
      field === 'pricingPeriodStart' || 
      field === 'pricingPeriodEnd'
    ) {
      (newLegs[index] as any)[field] = value as Date;
      
      if (field === 'pricingPeriodStart' || field === 'pricingPeriodEnd') {
        const leg = newLegs[index];
        
        if (leg.formula && leg.pricingPeriodStart && leg.pricingPeriodEnd) {
          const monthlyDistribution = calculateMonthlyPricingDistribution(
            leg.formula.tokens,
            leg.quantity || 0,
            leg.buySell,
            leg.pricingPeriodStart,
            leg.pricingPeriodEnd
          );
          
          leg.formula = {
            ...leg.formula,
            monthlyDistribution
          };
        }
      }
    } else if (field === 'buySell') {
      (newLegs[index] as any)[field] = value as BuySell;
      
      const leg = newLegs[index];
      if (leg.formula && leg.pricingPeriodStart && leg.pricingPeriodEnd) {
        const monthlyDistribution = calculateMonthlyPricingDistribution(
          leg.formula.tokens,
          leg.quantity || 0,
          value as BuySell,
          leg.pricingPeriodStart,
          leg.pricingPeriodEnd
        );
        
        leg.formula = {
          ...leg.formula,
          monthlyDistribution
        };
      }
    } else if (field === 'quantity') {
      (newLegs[index] as any)[field] = Number(value);
      
      const leg = newLegs[index];
      if (leg.formula && leg.pricingPeriodStart && leg.pricingPeriodEnd) {
        const monthlyDistribution = calculateMonthlyPricingDistribution(
          leg.formula.tokens,
          Number(value) || 0,
          leg.buySell,
          leg.pricingPeriodStart,
          leg.pricingPeriodEnd
        );
        
        leg.formula = {
          ...leg.formula,
          monthlyDistribution
        };
      }
    } else {
      (newLegs[index] as any)[field] = value;
    }
    
    setLegs(newLegs);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const isCounterpartyValid = validateRequiredField(counterparty, 'Counterparty');
    
    const legValidations = legs.map((leg, index) => {
      const legNumber = index + 1;
      const validations = [
        validateRequiredField(leg.buySell, `Leg ${legNumber} - Buy/Sell`),
        validateRequiredField(leg.product, `Leg ${legNumber} - Product`),
        validateRequiredField(leg.sustainability, `Leg ${legNumber} - Sustainability`),
        validateRequiredField(leg.incoTerm, `Leg ${legNumber} - Incoterm`),
        validateRequiredField(leg.unit, `Leg ${legNumber} - Unit`),
        validateRequiredField(leg.paymentTerm, `Leg ${legNumber} - Payment Term`),
        validateRequiredField(leg.creditStatus, `Leg ${legNumber} - Credit Status`),
        validateRequiredField(leg.quantity, `Leg ${legNumber} - Quantity`),
        
        validateDateRange(
          leg.pricingPeriodStart, 
          leg.pricingPeriodEnd, 
          `Leg ${legNumber} - Pricing Period`
        ),
        validateDateRange(
          leg.loadingPeriodStart, 
          leg.loadingPeriodEnd, 
          `Leg ${legNumber} - Loading Period`
        )
      ];
      
      return validateFields(validations);
    });
    
    const areAllLegsValid = legValidations.every(isValid => isValid);
    
    if (isCounterpartyValid && areAllLegsValid) {
      const parentTrade: PhysicalParentTrade = {
        id: initialData?.id || crypto.randomUUID(),
        tradeReference,
        tradeType: 'physical',
        physicalType,
        counterparty,
        createdAt: initialData?.createdAt || new Date(),
        updatedAt: new Date()
      };

      const tradeLegs: PhysicalTradeLeg[] = legs.map((legForm, index) => {
        const legReference = initialData?.legs?.[index]?.legReference || 
                            generateLegReference(tradeReference, index);
        
        const legData: PhysicalTradeLeg = {
          id: initialData?.legs?.[index]?.id || crypto.randomUUID(),
          legReference,
          parentTradeId: parentTrade.id,
          buySell: legForm.buySell,
          product: legForm.product,
          sustainability: legForm.sustainability,
          incoTerm: legForm.incoTerm,
          quantity: legForm.quantity,
          tolerance: legForm.tolerance,
          loadingPeriodStart: legForm.loadingPeriodStart,
          loadingPeriodEnd: legForm.loadingPeriodEnd,
          pricingPeriodStart: legForm.pricingPeriodStart,
          pricingPeriodEnd: legForm.pricingPeriodEnd,
          unit: legForm.unit,
          paymentTerm: legForm.paymentTerm,
          creditStatus: legForm.creditStatus,
          formula: legForm.formula,
          mtmFormula: legForm.mtmFormula
        };
        
        return legData;
      });

      const tradeData: any = {
        ...parentTrade,
        legs: tradeLegs,
        ...legs[0]
      };

      onSubmit(tradeData);
    } else {
      toast.error('Please fix the validation errors before submitting', {
        description: 'Check all required fields and date ranges above.'
      });
    }
  };

  const handleNumberInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="physical-type">Trade Type</Label>
          <Select 
            value={physicalType} 
            onValueChange={(value) => setPhysicalType(value as PhysicalTradeType)}
          >
            <SelectTrigger id="physical-type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="spot">Spot</SelectItem>
              <SelectItem value="term">Term</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="counterparty">Counterparty</Label>
          <Select 
            value={counterparty} 
            onValueChange={setCounterparty}
          >
            <SelectTrigger id="counterparty">
              <SelectValue placeholder="Select counterparty" />
            </SelectTrigger>
            <SelectContent>
              {counterparties.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Trade Legs</h3>
          {physicalType === 'term' && (
            <Button type="button" variant="outline" onClick={addLeg}>
              <Plus className="h-4 w-4 mr-1" />
              Add Leg
            </Button>
          )}
        </div>

        {legs.map((leg, legIndex) => (
          <Card key={legIndex} className="border border-muted">
            <CardHeader className="p-4 flex flex-row items-start justify-between">
              <CardTitle className="text-md">
                {physicalType === 'spot' 
                  ? 'Spot Trade Details' 
                  : `Leg ${legIndex + 1} (${generateLegReference(tradeReference, legIndex)})`}
              </CardTitle>
              {physicalType === 'term' && legs.length > 1 && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => removeLeg(legIndex)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor={`leg-${legIndex}-buy-sell`}>Buy/Sell</Label>
                  <Select 
                    value={leg.buySell} 
                    onValueChange={(value) => updateLeg(legIndex, 'buySell', value as BuySell)}
                  >
                    <SelectTrigger id={`leg-${legIndex}-buy-sell`}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="sell">Sell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`leg-${legIndex}-product`}>Product</Label>
                  <Select 
                    value={leg.product} 
                    onValueChange={(value) => updateLeg(legIndex, 'product', value as Product)}
                  >
                    <SelectTrigger id={`leg-${legIndex}-product`}>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FAME0">FAME0</SelectItem>
                      <SelectItem value="RME">RME</SelectItem>
                      <SelectItem value="UCOME">UCOME</SelectItem>
                      <SelectItem value="UCOME-5">UCOME-5</SelectItem>
                      <SelectItem value="RME DC">RME DC</SelectItem>
                      <SelectItem value="HVO">HVO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`leg-${legIndex}-sustainability`}>Sustainability</Label>
                  <Select 
                    value={leg.sustainability} 
                    onValueChange={(value) => updateLeg(legIndex, 'sustainability', value)}
                  >
                    <SelectTrigger id={`leg-${legIndex}-sustainability`}>
                      <SelectValue placeholder="Select sustainability" />
                    </SelectTrigger>
                    <SelectContent>
                      {sustainabilityOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor={`leg-${legIndex}-incoterm`}>Incoterm</Label>
                  <Select 
                    value={leg.incoTerm} 
                    onValueChange={(value) => updateLeg(legIndex, 'incoTerm', value as IncoTerm)}
                  >
                    <SelectTrigger id={`leg-${legIndex}-incoterm`}>
                      <SelectValue placeholder="Select incoterm" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FOB">FOB</SelectItem>
                      <SelectItem value="CIF">CIF</SelectItem>
                      <SelectItem value="DES">DES</SelectItem>
                      <SelectItem value="DAP">DAP</SelectItem>
                      <SelectItem value="FCA">FCA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`leg-${legIndex}-credit-status`}>Credit Status</Label>
                  <Select 
                    value={leg.creditStatus} 
                    onValueChange={(value) => updateLeg(legIndex, 'creditStatus', value)}
                  >
                    <SelectTrigger id={`leg-${legIndex}-credit-status`}>
                      <SelectValue placeholder="Select credit status" />
                    </SelectTrigger>
                    <SelectContent>
                      {creditStatusOptions.map((status) => (
                        <SelectItem key={status} value={status.toLowerCase()}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`leg-${legIndex}-payment-term`}>Payment Term</Label>
                  <Select 
                    value={leg.paymentTerm} 
                    onValueChange={(value) => updateLeg(legIndex, 'paymentTerm', value as PaymentTerm)}
                  >
                    <SelectTrigger id={`leg-${legIndex}-payment-term`}>
                      <SelectValue placeholder="Select payment term" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="advance">Advance</SelectItem>
                      <SelectItem value="30 days">30 Days</SelectItem>
                      <SelectItem value="60 days">60 Days</SelectItem>
                      <SelectItem value="90 days">90 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor={`leg-${legIndex}-quantity`}>Quantity</Label>
                  <Input 
                    id={`leg-${legIndex}-quantity`} 
                    type="number" 
                    value={leg.quantity} 
                    onChange={(e) => updateLeg(legIndex, 'quantity', e.target.value)} 
                    onFocus={handleNumberInputFocus}
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`leg-${legIndex}-unit`}>Unit</Label>
                  <Select 
                    value={leg.unit} 
                    onValueChange={(value) => updateLeg(legIndex, 'unit', value as Unit)}
                  >
                    <SelectTrigger id={`leg-${legIndex}-unit`}>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MT">Metric Tons (MT)</SelectItem>
                      <SelectItem value="KG">Kilograms (KG)</SelectItem>
                      <SelectItem value="L">Liters (L)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`leg-${legIndex}-tolerance`}>Tolerance (%)</Label>
                  <Input 
                    id={`leg-${legIndex}-tolerance`} 
                    type="number" 
                    value={leg.tolerance} 
                    onChange={(e) => updateLeg(legIndex, 'tolerance', e.target.value)} 
                    onFocus={handleNumberInputFocus}
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label>Pricing Period Start</Label>
                  <DatePicker 
                    date={leg.pricingPeriodStart}
                    setDate={(date) => updateLeg(legIndex, 'pricingPeriodStart', date)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pricing Period End</Label>
                  <DatePicker 
                    date={leg.pricingPeriodEnd}
                    setDate={(date) => updateLeg(legIndex, 'pricingPeriodEnd', date)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label>Loading Period Start</Label>
                  <DatePicker 
                    date={leg.loadingPeriodStart}
                    setDate={(date) => updateLeg(legIndex, 'loadingPeriodStart', date)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Loading Period End</Label>
                  <DatePicker 
                    date={leg.loadingPeriodEnd}
                    setDate={(date) => updateLeg(legIndex, 'loadingPeriodEnd', date)}
                  />
                </div>
              </div>

              <div className="border rounded-md p-4 bg-gray-50 mb-4">
                <Tabs defaultValue="price">
                  <TabsList className="w-full mb-4">
                    <TabsTrigger value="price">Price Formula</TabsTrigger>
                    <TabsTrigger value="mtm">MTM Formula</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="price">
                    <div className="mb-2">
                      <Label className="font-medium">Price Formula</Label>
                    </div>
                    <FormulaBuilder 
                      value={leg.formula || createEmptyFormula()} 
                      onChange={(formula) => handleFormulaChange(formula, legIndex)}
                      tradeQuantity={leg.quantity || 0}
                      buySell={leg.buySell}
                      selectedProduct={leg.product}
                      formulaType="price"
                      otherFormula={leg.mtmFormula || createEmptyFormula()}
                    />
                  </TabsContent>
                  
                  <TabsContent value="mtm">
                    <div className="mb-2">
                      <Label className="font-medium">MTM Pricing Formula</Label>
                    </div>
                    <FormulaBuilder 
                      value={leg.mtmFormula || createEmptyFormula()} 
                      onChange={(formula) => handleMtmFormulaChange(formula, legIndex)}
                      tradeQuantity={leg.quantity || 0}
                      buySell={leg.buySell}
                      selectedProduct={leg.product}
                      formulaType="mtm"
                      otherFormula={leg.formula || createEmptyFormula()}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {isEditMode ? 'Update Trade' : 'Create Trade'}
        </Button>
      </div>
    </form>
  );
};

export default PhysicalTradeForm;
````

## File: src/components/trades/TableErrorState.tsx
````typescript
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TableErrorStateProps {
  error: Error | null;
  onRetry: () => void;
}

const TableErrorState: React.FC<TableErrorStateProps> = ({ error, onRetry }) => {
  return (
    <div className="p-8 flex flex-col items-center text-center space-y-4">
      <AlertCircle className="h-10 w-10 text-destructive" />
      <div>
        <h3 className="font-medium">Failed to load trades</h3>
        <p className="text-muted-foreground text-sm">
          {error instanceof Error ? error.message : 'Unknown error occurred'}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try Again
      </Button>
    </div>
  );
};

export default TableErrorState;
````

## File: src/components/trades/TableLoadingState.tsx
````typescript
import React from 'react';
import { Loader2 } from 'lucide-react';

const TableLoadingState: React.FC = () => {
  return (
    <div className="p-8 flex justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
};

export default TableLoadingState;
````

## File: src/components/ui/accordion.tsx
````typescript
import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

const Accordion = AccordionPrimitive.Root

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b", className)}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </AccordionPrimitive.Content>
))

AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
````

## File: src/components/ui/alert-dialog.tsx
````typescript
import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const AlertDialog = AlertDialogPrimitive.Root

const AlertDialogTrigger = AlertDialogPrimitive.Trigger

const AlertDialogPortal = AlertDialogPrimitive.Portal

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    />
  </AlertDialogPortal>
))
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName

const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
AlertDialogHeader.displayName = "AlertDialogHeader"

const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
AlertDialogFooter.displayName = "AlertDialogFooter"

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold", className)}
    {...props}
  />
))
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
AlertDialogDescription.displayName =
  AlertDialogPrimitive.Description.displayName

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(buttonVariants(), className)}
    {...props}
  />
))
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(
      buttonVariants({ variant: "outline" }),
      "mt-2 sm:mt-0",
      className
    )}
    {...props}
  />
))
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
````

## File: src/components/ui/alert.tsx
````typescript
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
````

## File: src/components/ui/aspect-ratio.tsx
````typescript
import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio"

const AspectRatio = AspectRatioPrimitive.Root

export { AspectRatio }
````

## File: src/components/ui/avatar.tsx
````typescript
import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
````

## File: src/components/ui/badge.tsx
````typescript
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
````

## File: src/components/ui/breadcrumb.tsx
````typescript
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"

const Breadcrumb = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<"nav"> & {
    separator?: React.ReactNode
  }
>(({ ...props }, ref) => <nav ref={ref} aria-label="breadcrumb" {...props} />)
Breadcrumb.displayName = "Breadcrumb"

const BreadcrumbList = React.forwardRef<
  HTMLOListElement,
  React.ComponentPropsWithoutRef<"ol">
>(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    className={cn(
      "flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5",
      className
    )}
    {...props}
  />
))
BreadcrumbList.displayName = "BreadcrumbList"

const BreadcrumbItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentPropsWithoutRef<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn("inline-flex items-center gap-1.5", className)}
    {...props}
  />
))
BreadcrumbItem.displayName = "BreadcrumbItem"

const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<"a"> & {
    asChild?: boolean
  }
>(({ asChild, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a"

  return (
    <Comp
      ref={ref}
      className={cn("transition-colors hover:text-foreground", className)}
      {...props}
    />
  )
})
BreadcrumbLink.displayName = "BreadcrumbLink"

const BreadcrumbPage = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<"span">
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    role="link"
    aria-disabled="true"
    aria-current="page"
    className={cn("font-normal text-foreground", className)}
    {...props}
  />
))
BreadcrumbPage.displayName = "BreadcrumbPage"

const BreadcrumbSeparator = ({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) => (
  <li
    role="presentation"
    aria-hidden="true"
    className={cn("[&>svg]:size-3.5", className)}
    {...props}
  >
    {children ?? <ChevronRight />}
  </li>
)
BreadcrumbSeparator.displayName = "BreadcrumbSeparator"

const BreadcrumbEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    role="presentation"
    aria-hidden="true"
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More</span>
  </span>
)
BreadcrumbEllipsis.displayName = "BreadcrumbElipssis"

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}
````

## File: src/components/ui/button.tsx
````typescript
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
````

## File: src/components/ui/calendar.tsx
````typescript
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
````

## File: src/components/ui/card.tsx
````typescript
import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
````

## File: src/components/ui/carousel.tsx
````typescript
import * as React from "react"
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type CarouselApi = UseEmblaCarouselType[1]
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParameters[0]
type CarouselPlugin = UseCarouselParameters[1]

type CarouselProps = {
  opts?: CarouselOptions
  plugins?: CarouselPlugin
  orientation?: "horizontal" | "vertical"
  setApi?: (api: CarouselApi) => void
}

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]
  api: ReturnType<typeof useEmblaCarousel>[1]
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
} & CarouselProps

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }

  return context
}

const Carousel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & CarouselProps
>(
  (
    {
      orientation = "horizontal",
      opts,
      setApi,
      plugins,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [carouselRef, api] = useEmblaCarousel(
      {
        ...opts,
        axis: orientation === "horizontal" ? "x" : "y",
      },
      plugins
    )
    const [canScrollPrev, setCanScrollPrev] = React.useState(false)
    const [canScrollNext, setCanScrollNext] = React.useState(false)

    const onSelect = React.useCallback((api: CarouselApi) => {
      if (!api) {
        return
      }

      setCanScrollPrev(api.canScrollPrev())
      setCanScrollNext(api.canScrollNext())
    }, [])

    const scrollPrev = React.useCallback(() => {
      api?.scrollPrev()
    }, [api])

    const scrollNext = React.useCallback(() => {
      api?.scrollNext()
    }, [api])

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault()
          scrollPrev()
        } else if (event.key === "ArrowRight") {
          event.preventDefault()
          scrollNext()
        }
      },
      [scrollPrev, scrollNext]
    )

    React.useEffect(() => {
      if (!api || !setApi) {
        return
      }

      setApi(api)
    }, [api, setApi])

    React.useEffect(() => {
      if (!api) {
        return
      }

      onSelect(api)
      api.on("reInit", onSelect)
      api.on("select", onSelect)

      return () => {
        api?.off("select", onSelect)
      }
    }, [api, onSelect])

    return (
      <CarouselContext.Provider
        value={{
          carouselRef,
          api: api,
          opts,
          orientation:
            orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
          scrollPrev,
          scrollNext,
          canScrollPrev,
          canScrollNext,
        }}
      >
        <div
          ref={ref}
          onKeyDownCapture={handleKeyDown}
          className={cn("relative", className)}
          role="region"
          aria-roledescription="carousel"
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    )
  }
)
Carousel.displayName = "Carousel"

const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { carouselRef, orientation } = useCarousel()

  return (
    <div ref={carouselRef} className="overflow-hidden">
      <div
        ref={ref}
        className={cn(
          "flex",
          orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
          className
        )}
        {...props}
      />
    </div>
  )
})
CarouselContent.displayName = "CarouselContent"

const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { orientation } = useCarousel()

  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className
      )}
      {...props}
    />
  )
})
CarouselItem.displayName = "CarouselItem"

const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel()

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute  h-8 w-8 rounded-full",
        orientation === "horizontal"
          ? "-left-12 top-1/2 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="sr-only">Previous slide</span>
    </Button>
  )
})
CarouselPrevious.displayName = "CarouselPrevious"

const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollNext, canScrollNext } = useCarousel()

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute h-8 w-8 rounded-full",
        orientation === "horizontal"
          ? "-right-12 top-1/2 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ArrowRight className="h-4 w-4" />
      <span className="sr-only">Next slide</span>
    </Button>
  )
})
CarouselNext.displayName = "CarouselNext"

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
}
````

## File: src/components/ui/chart.tsx
````typescript
import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >["children"]
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "Chart"

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([_, config]) => config.theme || config.color
  )

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color
    return color ? `  --color-${key}: ${color};` : null
  })
  .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
    React.ComponentProps<"div"> & {
      hideLabel?: boolean
      hideIndicator?: boolean
      indicator?: "line" | "dot" | "dashed"
      nameKey?: string
      labelKey?: string
    }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const { config } = useChart()

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null
      }

      const [item] = payload
      const key = `${labelKey || item.dataKey || item.name || "value"}`
      const itemConfig = getPayloadConfigFromPayload(config, item, key)
      const value =
        !labelKey && typeof label === "string"
          ? config[label as keyof typeof config]?.label || label
          : itemConfig?.label

      if (labelFormatter) {
        return (
          <div className={cn("font-medium", labelClassName)}>
            {labelFormatter(value, payload)}
          </div>
        )
      }

      if (!value) {
        return null
      }

      return <div className={cn("font-medium", labelClassName)}>{value}</div>
    }, [
      label,
      labelFormatter,
      payload,
      hideLabel,
      labelClassName,
      config,
      labelKey,
    ])

    if (!active || !payload?.length) {
      return null
    }

    const nestLabel = payload.length === 1 && indicator !== "dot"

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        )}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)
            const indicatorColor = color || item.payload.fill || item.color

            return (
              <div
                key={item.dataKey}
                className={cn(
                  "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                  indicator === "dot" && "items-center"
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                            {
                              "h-2.5 w-2.5": indicator === "dot",
                              "w-1": indicator === "line",
                              "w-0 border-[1.5px] border-dashed bg-transparent":
                                indicator === "dashed",
                              "my-0.5": nestLabel && indicator === "dashed",
                            }
                          )}
                          style={
                            {
                              "--color-bg": indicatorColor,
                              "--color-border": indicatorColor,
                            } as React.CSSProperties
                          }
                        />
                      )
                    )}
                    <div
                      className={cn(
                        "flex flex-1 justify-between leading-none",
                        nestLabel ? "items-end" : "items-center"
                      )}
                    >
                      <div className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-muted-foreground">
                          {itemConfig?.label || item.name}
                        </span>
                      </div>
                      {item.value && (
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {item.value.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltip"

const ChartLegend = RechartsPrimitive.Legend

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> &
    Pick<RechartsPrimitive.LegendProps, "payload" | "verticalAlign"> & {
      hideIcon?: boolean
      nameKey?: string
    }
>(
  (
    { className, hideIcon = false, payload, verticalAlign = "bottom", nameKey },
    ref
  ) => {
    const { config } = useChart()

    if (!payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center gap-4",
          verticalAlign === "top" ? "pb-3" : "pt-3",
          className
        )}
      >
        {payload.map((item) => {
          const key = `${nameKey || item.dataKey || "value"}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)

          return (
            <div
              key={item.value}
              className={cn(
                "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
              )}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          )
        })}
      </div>
    )
  }
)
ChartLegendContent.displayName = "ChartLegend"

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (typeof payload !== "object" || payload === null) {
    return undefined
  }

  const payloadPayload =
    "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined

  let configLabelKey: string = key

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === "string"
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config]
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
}
````

## File: src/components/ui/checkbox.tsx
````typescript
import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
````

## File: src/components/ui/collapsible.tsx
````typescript
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

const Collapsible = CollapsiblePrimitive.Root

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger

const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
````

## File: src/components/ui/command.tsx
````typescript
import * as React from "react"
import { type DialogProps } from "@radix-ui/react-dialog"
import { Command as CommandPrimitive } from "cmdk"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Dialog, DialogContent } from "@/components/ui/dialog"

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
      className
    )}
    {...props}
  />
))
Command.displayName = CommandPrimitive.displayName

interface CommandDialogProps extends DialogProps {}

const CommandDialog = ({ children, ...props }: CommandDialogProps) => {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0 shadow-lg">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  </div>
))

CommandInput.displayName = CommandPrimitive.Input.displayName

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
    {...props}
  />
))

CommandList.displayName = CommandPrimitive.List.displayName

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="py-6 text-center text-sm"
    {...props}
  />
))

CommandEmpty.displayName = CommandPrimitive.Empty.displayName

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
      className
    )}
    {...props}
  />
))

CommandGroup.displayName = CommandPrimitive.Group.displayName

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 h-px bg-border", className)}
    {...props}
  />
))
CommandSeparator.displayName = CommandPrimitive.Separator.displayName

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected='true']:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50",
      className
    )}
    {...props}
  />
))

CommandItem.displayName = CommandPrimitive.Item.displayName

const CommandShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}
CommandShortcut.displayName = "CommandShortcut"

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}
````

## File: src/components/ui/context-menu.tsx
````typescript
import * as React from "react"
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const ContextMenu = ContextMenuPrimitive.Root

const ContextMenuTrigger = ContextMenuPrimitive.Trigger

const ContextMenuGroup = ContextMenuPrimitive.Group

const ContextMenuPortal = ContextMenuPrimitive.Portal

const ContextMenuSub = ContextMenuPrimitive.Sub

const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup

const ContextMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <ContextMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </ContextMenuPrimitive.SubTrigger>
))
ContextMenuSubTrigger.displayName = ContextMenuPrimitive.SubTrigger.displayName

const ContextMenuSubContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
ContextMenuSubContent.displayName = ContextMenuPrimitive.SubContent.displayName

const ContextMenuContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Portal>
    <ContextMenuPrimitive.Content
      ref={ref}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </ContextMenuPrimitive.Portal>
))
ContextMenuContent.displayName = ContextMenuPrimitive.Content.displayName

const ContextMenuItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <ContextMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
ContextMenuItem.displayName = ContextMenuPrimitive.Item.displayName

const ContextMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <ContextMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <ContextMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </ContextMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </ContextMenuPrimitive.CheckboxItem>
))
ContextMenuCheckboxItem.displayName =
  ContextMenuPrimitive.CheckboxItem.displayName

const ContextMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <ContextMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <ContextMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </ContextMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </ContextMenuPrimitive.RadioItem>
))
ContextMenuRadioItem.displayName = ContextMenuPrimitive.RadioItem.displayName

const ContextMenuLabel = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <ContextMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold text-foreground",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
ContextMenuLabel.displayName = ContextMenuPrimitive.Label.displayName

const ContextMenuSeparator = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-border", className)}
    {...props}
  />
))
ContextMenuSeparator.displayName = ContextMenuPrimitive.Separator.displayName

const ContextMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}
ContextMenuShortcut.displayName = "ContextMenuShortcut"

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
}
````

## File: src/components/ui/date-picker.tsx
````typescript
import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DatePickerProps {
  date: Date;
  setDate: (date: Date) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function DatePicker({ date, setDate, disabled, placeholder = "Select date" }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(date) => date && setDate(date)}
          initialFocus
          className="p-3 pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
}
````

## File: src/components/ui/dialog.tsx
````typescript
import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
````

## File: src/components/ui/drawer.tsx
````typescript
import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/lib/utils"

const Drawer = ({
  shouldScaleBackground = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root
    shouldScaleBackground={shouldScaleBackground}
    {...props}
  />
)
Drawer.displayName = "Drawer"

const DrawerTrigger = DrawerPrimitive.Trigger

const DrawerPortal = DrawerPrimitive.Portal

const DrawerClose = DrawerPrimitive.Close

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/80", className)}
    {...props}
  />
))
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background",
        className
      )}
      {...props}
    >
      <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
      {children}
    </DrawerPrimitive.Content>
  </DrawerPortal>
))
DrawerContent.displayName = "DrawerContent"

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}
    {...props}
  />
)
DrawerHeader.displayName = "DrawerHeader"

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("mt-auto flex flex-col gap-2 p-4", className)}
    {...props}
  />
)
DrawerFooter.displayName = "DrawerFooter"

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DrawerTitle.displayName = DrawerPrimitive.Title.displayName

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DrawerDescription.displayName = DrawerPrimitive.Description.displayName

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
````

## File: src/components/ui/dropdown-menu.tsx
````typescript
import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const DropdownMenu = DropdownMenuPrimitive.Root

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

const DropdownMenuGroup = DropdownMenuPrimitive.Group

const DropdownMenuPortal = DropdownMenuPrimitive.Portal

const DropdownMenuSub = DropdownMenuPrimitive.Sub

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}
````

## File: src/components/ui/form.tsx
````typescript
import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
} from "react-hook-form"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()

  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField()

  return (
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  )
})
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message) : children

  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}
````

## File: src/components/ui/hover-card.tsx
````typescript
import * as React from "react"
import * as HoverCardPrimitive from "@radix-ui/react-hover-card"

import { cn } from "@/lib/utils"

const HoverCard = HoverCardPrimitive.Root

const HoverCardTrigger = HoverCardPrimitive.Trigger

const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <HoverCardPrimitive.Content
    ref={ref}
    align={align}
    sideOffset={sideOffset}
    className={cn(
      "z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName

export { HoverCard, HoverCardTrigger, HoverCardContent }
````

## File: src/components/ui/input-otp.tsx
````typescript
import * as React from "react"
import { OTPInput, OTPInputContext } from "input-otp"
import { Dot } from "lucide-react"

import { cn } from "@/lib/utils"

const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    containerClassName={cn(
      "flex items-center gap-2 has-[:disabled]:opacity-50",
      containerClassName
    )}
    className={cn("disabled:cursor-not-allowed", className)}
    {...props}
  />
))
InputOTP.displayName = "InputOTP"

const InputOTPGroup = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center", className)} {...props} />
))
InputOTPGroup.displayName = "InputOTPGroup"

const InputOTPSlot = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & { index: number }
>(({ index, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index]

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center border-y border-r border-input text-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
        isActive && "z-10 ring-2 ring-ring ring-offset-background",
        className
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
        </div>
      )}
    </div>
  )
})
InputOTPSlot.displayName = "InputOTPSlot"

const InputOTPSeparator = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ ...props }, ref) => (
  <div ref={ref} role="separator" {...props}>
    <Dot />
  </div>
))
InputOTPSeparator.displayName = "InputOTPSeparator"

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
````

## File: src/components/ui/input.tsx
````typescript
import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    // Add default handler to select all content on focus for number inputs
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      if (type === 'number') {
        e.target.select();
      }
      // Call the original onFocus handler if it exists
      if (props.onFocus) {
        props.onFocus(e);
      }
    };

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        onFocus={handleFocus}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
````

## File: src/components/ui/label.tsx
````typescript
import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
````

## File: src/components/ui/menubar.tsx
````typescript
import * as React from "react"
import * as MenubarPrimitive from "@radix-ui/react-menubar"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const MenubarMenu = MenubarPrimitive.Menu

const MenubarGroup = MenubarPrimitive.Group

const MenubarPortal = MenubarPrimitive.Portal

const MenubarSub = MenubarPrimitive.Sub

const MenubarRadioGroup = MenubarPrimitive.RadioGroup

const Menubar = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Root
    ref={ref}
    className={cn(
      "flex h-10 items-center space-x-1 rounded-md border bg-background p-1",
      className
    )}
    {...props}
  />
))
Menubar.displayName = MenubarPrimitive.Root.displayName

const MenubarTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-3 py-1.5 text-sm font-medium outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
      className
    )}
    {...props}
  />
))
MenubarTrigger.displayName = MenubarPrimitive.Trigger.displayName

const MenubarSubTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <MenubarPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </MenubarPrimitive.SubTrigger>
))
MenubarSubTrigger.displayName = MenubarPrimitive.SubTrigger.displayName

const MenubarSubContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
MenubarSubContent.displayName = MenubarPrimitive.SubContent.displayName

const MenubarContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Content>
>(
  (
    { className, align = "start", alignOffset = -4, sideOffset = 8, ...props },
    ref
  ) => (
    <MenubarPrimitive.Portal>
      <MenubarPrimitive.Content
        ref={ref}
        align={align}
        alignOffset={alignOffset}
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}
      />
    </MenubarPrimitive.Portal>
  )
)
MenubarContent.displayName = MenubarPrimitive.Content.displayName

const MenubarItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <MenubarPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
MenubarItem.displayName = MenubarPrimitive.Item.displayName

const MenubarCheckboxItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <MenubarPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <MenubarPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.CheckboxItem>
))
MenubarCheckboxItem.displayName = MenubarPrimitive.CheckboxItem.displayName

const MenubarRadioItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <MenubarPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <MenubarPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.RadioItem>
))
MenubarRadioItem.displayName = MenubarPrimitive.RadioItem.displayName

const MenubarLabel = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <MenubarPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
MenubarLabel.displayName = MenubarPrimitive.Label.displayName

const MenubarSeparator = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
MenubarSeparator.displayName = MenubarPrimitive.Separator.displayName

const MenubarShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}
MenubarShortcut.displayname = "MenubarShortcut"

export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarLabel,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarPortal,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarGroup,
  MenubarSub,
  MenubarShortcut,
}
````

## File: src/components/ui/navigation-menu.tsx
````typescript
import * as React from "react"
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu"
import { cva } from "class-variance-authority"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

const NavigationMenu = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Root
    ref={ref}
    className={cn(
      "relative z-10 flex max-w-max flex-1 items-center justify-center",
      className
    )}
    {...props}
  >
    {children}
    <NavigationMenuViewport />
  </NavigationMenuPrimitive.Root>
))
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName

const NavigationMenuList = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.List
    ref={ref}
    className={cn(
      "group flex flex-1 list-none items-center justify-center space-x-1",
      className
    )}
    {...props}
  />
))
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName

const NavigationMenuItem = NavigationMenuPrimitive.Item

const navigationMenuTriggerStyle = cva(
  "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
)

const NavigationMenuTrigger = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Trigger
    ref={ref}
    className={cn(navigationMenuTriggerStyle(), "group", className)}
    {...props}
  >
    {children}{" "}
    <ChevronDown
      className="relative top-[1px] ml-1 h-3 w-3 transition duration-200 group-data-[state=open]:rotate-180"
      aria-hidden="true"
    />
  </NavigationMenuPrimitive.Trigger>
))
NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName

const NavigationMenuContent = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Content
    ref={ref}
    className={cn(
      "left-0 top-0 w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 md:absolute md:w-auto ",
      className
    )}
    {...props}
  />
))
NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName

const NavigationMenuLink = NavigationMenuPrimitive.Link

const NavigationMenuViewport = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <div className={cn("absolute left-0 top-full flex justify-center")}>
    <NavigationMenuPrimitive.Viewport
      className={cn(
        "origin-top-center relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 md:w-[var(--radix-navigation-menu-viewport-width)]",
        className
      )}
      ref={ref}
      {...props}
    />
  </div>
))
NavigationMenuViewport.displayName =
  NavigationMenuPrimitive.Viewport.displayName

const NavigationMenuIndicator = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Indicator>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Indicator>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Indicator
    ref={ref}
    className={cn(
      "top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:fade-in",
      className
    )}
    {...props}
  >
    <div className="relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm bg-border shadow-md" />
  </NavigationMenuPrimitive.Indicator>
))
NavigationMenuIndicator.displayName =
  NavigationMenuPrimitive.Indicator.displayName

export {
  navigationMenuTriggerStyle,
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
}
````

## File: src/components/ui/pagination.tsx
````typescript
import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { ButtonProps, buttonVariants } from "@/components/ui/button"

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
)
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
))
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<ButtonProps, "size"> &
  React.ComponentProps<"a">

const PaginationLink = ({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? "outline" : "ghost",
        size,
      }),
      className
    )}
    {...props}
  />
)
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to previous page"
    size="default"
    className={cn("gap-1 pl-2.5", className)}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span>Previous</span>
  </PaginationLink>
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to next page"
    size="default"
    className={cn("gap-1 pr-2.5", className)}
    {...props}
  >
    <span>Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
)
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}
````

## File: src/components/ui/popover.tsx
````typescript
import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent }
````

## File: src/components/ui/progress.tsx
````typescript
import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
````

## File: src/components/ui/radio-group.tsx
````typescript
import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-2", className)}
      {...props}
      ref={ref}
    />
  )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-2.5 w-2.5 fill-current text-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }
````

## File: src/components/ui/resizable.tsx
````typescript
import { GripVertical } from "lucide-react"
import * as ResizablePrimitive from "react-resizable-panels"

import { cn } from "@/lib/utils"

const ResizablePanelGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
  <ResizablePrimitive.PanelGroup
    className={cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className
    )}
    {...props}
  />
)

const ResizablePanel = ResizablePrimitive.Panel

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean
}) => (
  <ResizablePrimitive.PanelResizeHandle
    className={cn(
      "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
        <GripVertical className="h-2.5 w-2.5" />
      </div>
    )}
  </ResizablePrimitive.PanelResizeHandle>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
````

## File: src/components/ui/scroll-area.tsx
````typescript
import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollBar orientation="horizontal" />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        "h-full w-2 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-2 flex-col border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
````

## File: src/components/ui/select.tsx
````typescript
import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
````

## File: src/components/ui/separator.tsx
````typescript
import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
````

## File: src/components/ui/sheet.tsx
````typescript
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
import * as React from "react"

import { cn } from "@/lib/utils"

const Sheet = SheetPrimitive.Root

const SheetTrigger = SheetPrimitive.Trigger

const SheetClose = SheetPrimitive.Close

const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4  border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
  VariantProps<typeof sheetVariants> { }

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      {children}
      <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet, SheetClose,
  SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetOverlay, SheetPortal, SheetTitle, SheetTrigger
}
````

## File: src/components/ui/sidebar.tsx
````typescript
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { VariantProps, cva } from "class-variance-authority"
import { PanelLeft } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const SIDEBAR_COOKIE_NAME = "sidebar:state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

type SidebarContext = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContext | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    defaultOpen?: boolean
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }
>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const isMobile = useIsMobile()
    const [openMobile, setOpenMobile] = React.useState(false)

    // This is the internal state of the sidebar.
    // We use openProp and setOpenProp for control from outside the component.
    const [_open, _setOpen] = React.useState(defaultOpen)
    const open = openProp ?? _open
    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === "function" ? value(open) : value
        if (setOpenProp) {
          setOpenProp(openState)
        } else {
          _setOpen(openState)
        }

        // This sets the cookie to keep the sidebar state.
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
      },
      [setOpenProp, open]
    )

    // Helper to toggle the sidebar.
    const toggleSidebar = React.useCallback(() => {
      return isMobile
        ? setOpenMobile((open) => !open)
        : setOpen((open) => !open)
    }, [isMobile, setOpen, setOpenMobile])

    // Adds a keyboard shortcut to toggle the sidebar.
    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault()
          toggleSidebar()
        }
      }

      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
    }, [toggleSidebar])

    // We add a state so that we can do data-state="expanded" or "collapsed".
    // This makes it easier to style the sidebar with Tailwind classes.
    const state = open ? "expanded" : "collapsed"

    const contextValue = React.useMemo<SidebarContext>(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
    )

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={0}>
          <div
            style={
              {
                "--sidebar-width": SIDEBAR_WIDTH,
                "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
                ...style,
              } as React.CSSProperties
            }
            className={cn(
              "group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar",
              className
            )}
            ref={ref}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    )
  }
)
SidebarProvider.displayName = "SidebarProvider"

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    side?: "left" | "right"
    variant?: "sidebar" | "floating" | "inset"
    collapsible?: "offcanvas" | "icon" | "none"
  }
>(
  (
    {
      side = "left",
      variant = "sidebar",
      collapsible = "offcanvas",
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

    if (collapsible === "none") {
      return (
        <div
          className={cn(
            "flex h-full w-[--sidebar-width] flex-col bg-sidebar text-sidebar-foreground",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      )
    }

    if (isMobile) {
      return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
          <SheetContent
            data-sidebar="sidebar"
            data-mobile="true"
            className="w-[--sidebar-width] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
            style={
              {
                "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
              } as React.CSSProperties
            }
            side={side}
          >
            <div className="flex h-full w-full flex-col">{children}</div>
          </SheetContent>
        </Sheet>
      )
    }

    return (
      <div
        ref={ref}
        className="group peer hidden md:block text-sidebar-foreground"
        data-state={state}
        data-collapsible={state === "collapsed" ? collapsible : ""}
        data-variant={variant}
        data-side={side}
      >
        {/* This is what handles the sidebar gap on desktop */}
        <div
          className={cn(
            "duration-200 relative h-svh w-[--sidebar-width] bg-transparent transition-[width] ease-linear",
            "group-data-[collapsible=offcanvas]:w-0",
            "group-data-[side=right]:rotate-180",
            variant === "floating" || variant === "inset"
              ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]"
              : "group-data-[collapsible=icon]:w-[--sidebar-width-icon]"
          )}
        />
        <div
          className={cn(
            "duration-200 fixed inset-y-0 z-10 hidden h-svh w-[--sidebar-width] transition-[left,right,width] ease-linear md:flex",
            side === "left"
              ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
              : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
            // Adjust the padding for floating and inset variants.
            variant === "floating" || variant === "inset"
              ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)]"
              : "group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[side=left]:border-r group-data-[side=right]:border-l",
            className
          )}
          {...props}
        >
          <div
            data-sidebar="sidebar"
            className="flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow"
          >
            {children}
          </div>
        </div>
      </div>
    )
  }
)
Sidebar.displayName = "Sidebar"

const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      ref={ref}
      data-sidebar="trigger"
      variant="ghost"
      size="icon"
      className={cn("h-7 w-7", className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <PanelLeft />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
})
SidebarTrigger.displayName = "SidebarTrigger"

const SidebarRail = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button">
>(({ className, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()

  return (
    <button
      ref={ref}
      data-sidebar="rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        "absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex",
        "[[data-side=left]_&]:cursor-w-resize [[data-side=right]_&]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full group-data-[collapsible=offcanvas]:hover:bg-sidebar",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className
      )}
      {...props}
    />
  )
})
SidebarRail.displayName = "SidebarRail"

const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"main">
>(({ className, ...props }, ref) => {
  return (
    <main
      ref={ref}
      className={cn(
        "relative flex min-h-svh flex-1 flex-col bg-background",
        "peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow",
        className
      )}
      {...props}
    />
  )
})
SidebarInset.displayName = "SidebarInset"

const SidebarInput = React.forwardRef<
  React.ElementRef<typeof Input>,
  React.ComponentProps<typeof Input>
>(({ className, ...props }, ref) => {
  return (
    <Input
      ref={ref}
      data-sidebar="input"
      className={cn(
        "h-8 w-full bg-background shadow-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        className
      )}
      {...props}
    />
  )
})
SidebarInput.displayName = "SidebarInput"

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="header"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  )
})
SidebarHeader.displayName = "SidebarHeader"

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="footer"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  )
})
SidebarFooter.displayName = "SidebarFooter"

const SidebarSeparator = React.forwardRef<
  React.ElementRef<typeof Separator>,
  React.ComponentProps<typeof Separator>
>(({ className, ...props }, ref) => {
  return (
    <Separator
      ref={ref}
      data-sidebar="separator"
      className={cn("mx-2 w-auto bg-sidebar-border", className)}
      {...props}
    />
  )
})
SidebarSeparator.displayName = "SidebarSeparator"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        className
      )}
      {...props}
    />
  )
})
SidebarContent.displayName = "SidebarContent"

const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="group"
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
      {...props}
    />
  )
})
SidebarGroup.displayName = "SidebarGroup"

const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "div"

  return (
    <Comp
      ref={ref}
      data-sidebar="group-label"
      className={cn(
        "duration-200 flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-[margin,opa] ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        className
      )}
      {...props}
    />
  )
})
SidebarGroupLabel.displayName = "SidebarGroupLabel"

const SidebarGroupAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      ref={ref}
      data-sidebar="group-action"
      className={cn(
        "absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 after:md:hidden",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
})
SidebarGroupAction.displayName = "SidebarGroupAction"

const SidebarGroupContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="group-content"
    className={cn("w-full text-sm", className)}
    {...props}
  />
))
SidebarGroupContent.displayName = "SidebarGroupContent"

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu"
    className={cn("flex w-full min-w-0 flex-col gap-1", className)}
    {...props}
  />
))
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    data-sidebar="menu-item"
    className={cn("group/menu-item relative", className)}
    {...props}
  />
))
SidebarMenuItem.displayName = "SidebarMenuItem"

const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline:
          "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
      },
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm group-data-[collapsible=icon]:!p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean
    isActive?: boolean
    tooltip?: string | React.ComponentProps<typeof TooltipContent>
  } & VariantProps<typeof sidebarMenuButtonVariants>
>(
  (
    {
      asChild = false,
      isActive = false,
      variant = "default",
      size = "default",
      tooltip,
      className,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    const { isMobile, state } = useSidebar()

    const button = (
      <Comp
        ref={ref}
        data-sidebar="menu-button"
        data-size={size}
        data-active={isActive}
        className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
        {...props}
      />
    )

    if (!tooltip) {
      return button
    }

    if (typeof tooltip === "string") {
      tooltip = {
        children: tooltip,
      }
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent
          side="right"
          align="center"
          hidden={state !== "collapsed" || isMobile}
          {...tooltip}
        />
      </Tooltip>
    )
  }
)
SidebarMenuButton.displayName = "SidebarMenuButton"

const SidebarMenuAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean
    showOnHover?: boolean
  }
>(({ className, asChild = false, showOnHover = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-action"
      className={cn(
        "absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 peer-hover/menu-button:text-sidebar-accent-foreground [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 after:md:hidden",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        showOnHover &&
          "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground md:opacity-0",
        className
      )}
      {...props}
    />
  )
})
SidebarMenuAction.displayName = "SidebarMenuAction"

const SidebarMenuBadge = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="menu-badge"
    className={cn(
      "absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums text-sidebar-foreground select-none pointer-events-none",
      "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
      "peer-data-[size=sm]/menu-button:top-1",
      "peer-data-[size=default]/menu-button:top-1.5",
      "peer-data-[size=lg]/menu-button:top-2.5",
      "group-data-[collapsible=icon]:hidden",
      className
    )}
    {...props}
  />
))
SidebarMenuBadge.displayName = "SidebarMenuBadge"

const SidebarMenuSkeleton = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    showIcon?: boolean
  }
>(({ className, showIcon = false, ...props }, ref) => {
  // Random width between 50 to 90%.
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`
  }, [])

  return (
    <div
      ref={ref}
      data-sidebar="menu-skeleton"
      className={cn("rounded-md h-8 flex gap-2 px-2 items-center", className)}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="size-4 rounded-md"
          data-sidebar="menu-skeleton-icon"
        />
      )}
      <Skeleton
        className="h-4 flex-1 max-w-[--skeleton-width]"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  )
})
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton"

const SidebarMenuSub = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu-sub"
    className={cn(
      "mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5",
      "group-data-[collapsible=icon]:hidden",
      className
    )}
    {...props}
  />
))
SidebarMenuSub.displayName = "SidebarMenuSub"

const SidebarMenuSubItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ ...props }, ref) => <li ref={ref} {...props} />)
SidebarMenuSubItem.displayName = "SidebarMenuSubItem"

const SidebarMenuSubButton = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentProps<"a"> & {
    asChild?: boolean
    size?: "sm" | "md"
    isActive?: boolean
  }
>(({ asChild = false, size = "md", isActive, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a"

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        "flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground outline-none ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground",
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
        size === "sm" && "text-xs",
        size === "md" && "text-sm",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
})
SidebarMenuSubButton.displayName = "SidebarMenuSubButton"

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
}
````

## File: src/components/ui/skeleton.tsx
````typescript
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
````

## File: src/components/ui/slider.tsx
````typescript
import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
````

## File: src/components/ui/sonner.tsx
````typescript
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
````

## File: src/components/ui/switch.tsx
````typescript
import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
````

## File: src/components/ui/table.tsx
````typescript
import * as React from "react"

import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-xs", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "transition-colors data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-8 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-2 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-xs text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
````

## File: src/components/ui/tabs.tsx
````typescript
import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
````

## File: src/components/ui/textarea.tsx
````typescript
import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
````

## File: src/components/ui/toast.tsx
````typescript
import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
````

## File: src/components/ui/toaster.tsx
````typescript
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
````

## File: src/components/ui/toggle-group.tsx
````typescript
import * as React from "react"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { toggleVariants } from "@/components/ui/toggle"

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants>
>({
  size: "default",
  variant: "default",
})

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, children, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn("flex items-center justify-center gap-1", className)}
    {...props}
  >
    <ToggleGroupContext.Provider value={{ variant, size }}>
      {children}
    </ToggleGroupContext.Provider>
  </ToggleGroupPrimitive.Root>
))

ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> &
    VariantProps<typeof toggleVariants>
>(({ className, children, variant, size, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext)

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        className
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
})

ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName

export { ToggleGroup, ToggleGroupItem }
````

## File: src/components/ui/toggle.tsx
````typescript
import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-3",
        sm: "h-9 px-2.5",
        lg: "h-11 px-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(toggleVariants({ variant, size, className }))}
    {...props}
  />
))

Toggle.displayName = TogglePrimitive.Root.displayName

export { Toggle, toggleVariants }
````

## File: src/components/ui/tooltip.tsx
````typescript
import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
````

## File: src/components/ui/use-toast.ts
````typescript
// Redirect to Sonner toast for consistency
import { toast } from "sonner";

export { toast };

// For backward compatibility with any existing useToast references
export const useToast = () => {
  return {
    toast,
    dismiss: () => {}
  };
};
````

## File: src/components/DashboardCard.tsx
````typescript
import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

interface DashboardCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  count?: number;
  linkTo: string;
  linkText: string;
}

const DashboardCard = ({
  title,
  description,
  icon: Icon,
  count,
  linkTo,
  linkText,
}: DashboardCardProps) => {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {count !== undefined ? count : '-'}
        </div>
        <p className="text-xs text-muted-foreground mt-2">{description}</p>
      </CardContent>
      <CardFooter>
        <Link 
          to={linkTo}
          className="text-primary hover:underline text-sm flex items-center"
        >
          {linkText}
        </Link>
      </CardFooter>
    </Card>
  );
};

export default DashboardCard;
````

## File: src/components/Layout.tsx
````typescript
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, TrendingUp, Package, Clock, PieChart, User, LogOut, Menu, X, BarChart, LineChart, DollarSign, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [riskSubmenuOpen, setRiskSubmenuOpen] = useState(true);
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isRiskSection = () => {
    return location.pathname.startsWith('/risk');
  };

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: <PieChart className="h-5 w-5" /> },
    { path: '/trades', label: 'Trade Entry', icon: <FileText className="h-5 w-5" /> },
    { path: '/operations', label: 'Operations', icon: <Package className="h-5 w-5" /> },
    { 
      label: 'Risk', 
      icon: <LineChart className="h-5 w-5" />,
      submenu: [
        { path: '/risk/mtm', label: 'MTM', icon: <TrendingUp className="h-4 w-4" /> },
        { path: '/risk/pnl', label: 'PNL', icon: <DollarSign className="h-4 w-4" /> },
        { path: '/risk/exposure', label: 'Exposure', icon: <BarChart className="h-4 w-4" /> },
        { path: '/risk/prices', label: 'Prices', icon: <LineChart className="h-4 w-4" /> },
      ],
    },
    { path: '/audit', label: 'Audit Log', icon: <Clock className="h-5 w-5" /> },
  ];

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleRiskSubmenu = () => setRiskSubmenuOpen(!riskSubmenuOpen);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-primary-foreground shadow-md z-20">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleSidebar}
              className="text-primary-foreground hover:bg-primary/90"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <span className="font-bold text-xl">BioDiesel CTRM</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative group">
              <button className="flex items-center space-x-1">
                <User className="h-5 w-5" />
                <span>Admin</span>
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg hidden group-hover:block z-10">
                <div className="py-1">
                  <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</Link>
                  <Link to="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Settings</Link>
                  <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <div className="flex items-center space-x-2">
                      <LogOut className="h-4 w-4" />
                      <span>Sign out</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside 
          className={cn(
            "fixed inset-y-0 left-0 pt-16 z-10 bg-card shadow-md transition-all duration-300 ease-in-out",
            sidebarOpen ? "w-64 translate-x-0" : "w-0 -translate-x-full"
          )}
        >
          <nav className="p-4 space-y-2 overflow-y-auto h-full">
            {menuItems.map((item, index) => (
              item.submenu ? (
                <div key={index} className="space-y-1">
                  <Collapsible
                    open={riskSubmenuOpen}
                    onOpenChange={toggleRiskSubmenu}
                    className="rounded-md transition-colors"
                  >
                    <CollapsibleTrigger asChild>
                      <button className="flex items-center justify-between w-full p-3 font-medium">
                        <div className="flex items-center space-x-3">
                          {item.icon}
                          <span>{item.label}</span>
                        </div>
                        {riskSubmenuOpen ? 
                          <ChevronDown className="h-4 w-4" /> : 
                          <ChevronRight className="h-4 w-4" />
                        }
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-8 space-y-1 animate-accordion-down">
                      {item.submenu.map((subItem) => (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          className={`flex items-center space-x-3 p-2 rounded-md transition-colors ${
                            isActive(subItem.path)
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-primary/5'
                          }`}
                        >
                          {subItem.icon}
                          <span>{subItem.label}</span>
                        </Link>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              ) : (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 p-3 rounded-md transition-colors ${
                    isActive(item.path)
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-primary/5'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              )
            ))}
          </nav>
        </aside>

        <main 
          className={cn(
            "flex-1 p-6 bg-background overflow-auto transition-all duration-300 ease-in-out",
            sidebarOpen ? "ml-64" : "ml-0"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
````

## File: src/data/mockData.ts
````typescript
// Import types from their correct locations
import { PaperTrade } from '@/types/paper';
import { PhysicalTrade } from '@/types/physical';
import { Movement, AuditLog } from '@/types/common';

// Mock data for audit logs
export const mockAuditLogs: AuditLog[] = [
  {
    id: '1',
    timestamp: new Date('2023-03-15T10:30:00'),
    entityType: 'trade',
    entityId: 'TR-1234',
    field: 'quantity',
    oldValue: '100',
    newValue: '150',
    userId: 'user1@example.com'
  },
  {
    id: '2',
    timestamp: new Date('2023-03-14T14:22:00'),
    entityType: 'trade',
    entityId: 'TR-1236',
    field: 'counterparty',
    oldValue: 'Acme Corp',
    newValue: 'Beta Industries',
    userId: 'user2@example.com'
  },
  {
    id: '3',
    timestamp: new Date('2023-03-12T09:45:00'),
    entityType: 'trade', // Changed from 'payment' to 'trade'
    entityId: 'PAY-789',
    field: 'status',
    oldValue: 'pending',
    newValue: 'completed',
    userId: 'user1@example.com'
  }
];

// Mock data for physical trades - updated to match PhysicalTrade interface
export const mockPhysicalTrades: PhysicalTrade[] = [
  {
    id: 'PT001',
    tradeType: 'physical',
    physicalType: 'spot',
    tradeReference: 'PHY-2023-001',
    counterparty: 'EcoFuels GmbH',
    buySell: 'buy',
    product: 'FAME0',
    sustainability: 'ISCC EU',
    incoTerm: 'FOB',
    quantity: 1000,
    unit: 'MT',
    tolerance: 2.5,
    loadingPeriodStart: new Date('2023-04-01'),
    loadingPeriodEnd: new Date('2023-04-15'),
    pricingPeriodStart: new Date('2023-04-01'),
    pricingPeriodEnd: new Date('2023-04-15'),
    paymentTerm: '30 days',
    creditStatus: 'approved',
    createdAt: new Date('2023-03-10'),
    updatedAt: new Date('2023-03-10'),
    legs: []
  },
  {
    id: 'PT002',
    tradeType: 'physical',
    physicalType: 'spot',
    tradeReference: 'PHY-2023-002',
    counterparty: 'Renewable Energy Corp',
    buySell: 'sell',
    product: 'RME',
    sustainability: 'ISCC EU',
    incoTerm: 'CIF',
    quantity: 2000,
    unit: 'MT',
    tolerance: 5,
    loadingPeriodStart: new Date('2023-04-10'),
    loadingPeriodEnd: new Date('2023-04-20'),
    pricingPeriodStart: new Date('2023-04-10'),
    pricingPeriodEnd: new Date('2023-04-20'),
    paymentTerm: '30 days',
    creditStatus: 'approved',
    createdAt: new Date('2023-03-12'),
    updatedAt: new Date('2023-03-12'),
    legs: []
  }
];

// Mock data for movements
export const mockMovements: Movement[] = [
  {
    id: 'MOV001',
    tradeId: 'PT001',
    vesselName: 'Green Voyager',
    scheduledQuantity: 500,
    nominatedDate: new Date('2023-04-05'),
    loadport: 'Rotterdam',
    status: 'scheduled'
  },
  {
    id: 'MOV002',
    tradeId: 'PT001',
    vesselName: 'Green Voyager',
    scheduledQuantity: 500,
    nominatedDate: new Date('2023-04-12'),
    loadport: 'Rotterdam',
    status: 'scheduled'
  },
  {
    id: 'MOV003',
    tradeId: 'PT002',
    vesselName: 'Eco Pioneer',
    scheduledQuantity: 1000,
    nominatedDate: new Date('2023-04-15'),
    loadport: 'Hamburg',
    status: 'in-progress' // Changed from 'nominated' to 'in-progress'
  }
];
````

## File: src/hooks/use-mobile.tsx
````typescript
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
````

## File: src/hooks/use-toast.ts
````typescript
import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

function toast({ ...props }: Toast) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
````

## File: src/hooks/usePaperTrades.ts
````typescript
import { useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BuySell, Product } from '@/types/trade';
import { PaperTrade, PaperTradeLeg } from '@/types/paper';
import { setupPaperTradeSubscriptions } from '@/utils/paperTradeSubscriptionUtils';
import { generateLegReference, generateInstrumentName } from '@/utils/tradeUtils';
import { mapProductToCanonical } from '@/utils/productMapping';

const debounce = (fn: Function, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function(...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
};

export const usePaperTrades = () => {
  const queryClient = useQueryClient();
  const realtimeChannelsRef = useRef<{ [key: string]: any }>({});
  const isProcessingRef = useRef<boolean>(false);
  
  const debouncedRefetch = useRef(debounce((fn: Function) => {
    if (isProcessingRef.current) {
      console.log("[PAPER] Skipping paper trade refetch as an operation is in progress");
      return;
    }
    console.log("[PAPER] Executing debounced paper trade refetch");
    fn();
  }, 500)).current;
  
  const { data: paperTrades, isLoading, error, refetch } = useQuery({
    queryKey: ['paper-trades'],
    queryFn: fetchPaperTrades,
    staleTime: 2000,
    refetchOnWindowFocus: false
  });
  
  async function fetchPaperTrades(): Promise<PaperTrade[]> {
    const { data: paperTradesData, error: paperTradesError } = await supabase
      .from('paper_trades')
      .select(`
        id,
        trade_reference,
        counterparty,
        broker,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });
      
    if (paperTradesError) {
      console.error('[PAPER] Error fetching paper trades:', paperTradesError.message);
      throw paperTradesError;
    }
    
    if (!paperTradesData || paperTradesData.length === 0) {
      return [];
    }
    
    console.log(`[PAPER] Found ${paperTradesData.length} paper trades`);
    
    const tradesWithLegs = await Promise.all(
      paperTradesData.map(async (paperTrade) => {
        const { data: legs, error: legsError } = await supabase
          .from('paper_trade_legs')
          .select('*')
          .eq('paper_trade_id', paperTrade.id)
          .order('leg_reference', { ascending: true });
          
        if (legsError) {
          console.error('[PAPER] Error fetching paper trade legs:', legsError.message);
          return {
            id: paperTrade.id,
            tradeReference: paperTrade.trade_reference,
            tradeType: 'paper' as const,
            counterparty: paperTrade.counterparty,
            broker: paperTrade.broker || '',
            createdAt: new Date(paperTrade.created_at),
            updatedAt: new Date(paperTrade.updated_at),
            legs: []
          };
        }
        
        return {
          id: paperTrade.id,
          tradeReference: paperTrade.trade_reference,
          tradeType: 'paper' as const,
          counterparty: paperTrade.counterparty,
          broker: paperTrade.broker || '',
          createdAt: new Date(paperTrade.created_at),
          updatedAt: new Date(paperTrade.updated_at),
          legs: (legs || []).map((leg) => {
            const instrument = leg.instrument || '';
            let relationshipType: 'FP' | 'DIFF' | 'SPREAD' = 'FP';
            
            if (instrument.includes('DIFF')) {
              relationshipType = 'DIFF';
            } else if (instrument.includes('SPREAD')) {
              relationshipType = 'SPREAD';
            }
            
            let rightSide = undefined;
            
            if (leg.mtm_formula && 
                typeof leg.mtm_formula === 'object' && 
                'rightSide' in leg.mtm_formula) {
              rightSide = leg.mtm_formula.rightSide;
            }
            
            let exposuresObj: PaperTradeLeg['exposures'] = {
              physical: {},
              pricing: {},
              paper: {}
            };
            
            if (leg.exposures) {
              if (typeof leg.exposures === 'object') {
                const exposuresData = leg.exposures as Record<string, any>;
                
                if (exposuresData.physical && typeof exposuresData.physical === 'object') {
                  Object.entries(exposuresData.physical).forEach(([key, value]) => {
                    const canonicalProduct = mapProductToCanonical(key);
                    exposuresObj.physical[canonicalProduct] = value as number;
                  });
                  
                  if (!rightSide && Object.keys(exposuresData.physical).length === 2 && relationshipType !== 'FP') {
                    const products = Object.keys(exposuresData.physical);
                    if (products.length === 2) {
                      const mainProduct = mapProductToCanonical(leg.product);
                      const secondProduct = products.find(p => mapProductToCanonical(p) !== mainProduct);
                      
                      if (secondProduct) {
                        rightSide = {
                          product: secondProduct,
                          quantity: exposuresData.physical[secondProduct],
                          period: leg.period || '',
                        };
                      }
                    }
                  }
                }
                
                if (exposuresData.paper && typeof exposuresData.paper === 'object') {
                  Object.entries(exposuresData.paper).forEach(([key, value]) => {
                    const canonicalProduct = mapProductToCanonical(key);
                    exposuresObj.paper[canonicalProduct] = value as number;
                  });
                }
                
                if (exposuresData.pricing && typeof exposuresData.pricing === 'object') {
                  Object.entries(exposuresData.pricing).forEach(([key, value]) => {
                    const canonicalProduct = mapProductToCanonical(key);
                    exposuresObj.pricing[canonicalProduct] = value as number;
                  });
                }
              }
            } 
            if (leg.mtm_formula && typeof leg.mtm_formula === 'object') {
              const mtmData = leg.mtm_formula as Record<string, any>;
              
              if (mtmData.exposures && typeof mtmData.exposures === 'object') {
                const mtmExposures = mtmData.exposures as Record<string, any>;
                
                if (mtmExposures.physical && typeof mtmExposures.physical === 'object') {
                  Object.entries(mtmExposures.physical).forEach(([key, value]) => {
                    const canonicalProduct = mapProductToCanonical(key);
                    exposuresObj.physical[canonicalProduct] = value as number;
                    exposuresObj.paper[canonicalProduct] = value as number;
                  });
                  
                  if (!rightSide && Object.keys(mtmExposures.physical).length === 2 && relationshipType !== 'FP') {
                    const products = Object.keys(mtmExposures.physical);
                    if (products.length === 2) {
                      const mainProduct = mapProductToCanonical(leg.product);
                      const secondProduct = products.find(p => mapProductToCanonical(p) !== mainProduct);
                      
                      if (secondProduct) {
                        rightSide = {
                          product: secondProduct,
                          quantity: mtmExposures.physical[secondProduct],
                          period: leg.period || '',
                        };
                      }
                    }
                  }
                }
                
                if (mtmExposures.pricing && typeof mtmExposures.pricing === 'object') {
                  Object.entries(mtmExposures.pricing).forEach(([key, value]) => {
                    const canonicalProduct = mapProductToCanonical(key);
                    exposuresObj.pricing[canonicalProduct] = value as number;
                  });
                }
              }
            }
            
            if (rightSide && !rightSide.period && leg.period) {
              rightSide.period = leg.period;
            }
            
            if (rightSide && rightSide.price === undefined) {
              rightSide.price = 0;
            }
            
            if (rightSide && rightSide.product) {
              rightSide.product = mapProductToCanonical(rightSide.product);
            }
            
            return {
              id: leg.id,
              paperTradeId: leg.paper_trade_id,
              legReference: leg.leg_reference,
              buySell: leg.buy_sell as BuySell,
              product: mapProductToCanonical(leg.product) as Product,
              quantity: leg.quantity,
              period: leg.period || leg.trading_period || '', 
              price: leg.price || 0,
              broker: leg.broker,
              instrument: leg.instrument,
              relationshipType,
              rightSide: rightSide,
              formula: leg.formula ? (typeof leg.formula === 'string' ? JSON.parse(leg.formula) : leg.formula) : undefined,
              mtmFormula: leg.mtm_formula ? (typeof leg.mtm_formula === 'string' ? JSON.parse(leg.mtm_formula) : leg.mtm_formula) : undefined,
              exposures: exposuresObj
            } as PaperTradeLeg;
          })
        } as PaperTrade;
      })
    );
    
    return tradesWithLegs;
  };
  
  const setupRealtimeSubscriptions = useCallback(() => {
    return setupPaperTradeSubscriptions(
      realtimeChannelsRef,
      isProcessingRef, 
      debouncedRefetch,
      refetch
    );
  }, [refetch, debouncedRefetch]);
  
  useEffect(() => {
    const cleanup = setupRealtimeSubscriptions();
    
    return () => {
      cleanup();
    };
  }, [setupRealtimeSubscriptions]);
  
  const { mutate: createPaperTrade, isPending: isCreating } = useMutation({
    mutationFn: async (trade: Partial<PaperTrade>) => {
      const { data: paperTrade, error: paperTradeError } = await supabase
        .from('paper_trades')
        .insert({
          trade_reference: trade.tradeReference,
          counterparty: trade.broker || 'Paper Trade',
          broker: trade.broker
        })
        .select('id')
        .single();
        
      if (paperTradeError) {
        throw new Error(`Error creating paper trade: ${paperTradeError.message}`);
      }
      
      if (trade.legs && trade.legs.length > 0) {
        for (let i = 0; i < trade.legs.length; i++) {
          const leg = trade.legs[i];
          const legReference = generateLegReference(trade.tradeReference || '', i);
          
          let tradingPeriod = leg.period;
          
          let pricingPeriodStart = null;
          let pricingPeriodEnd = null;
          
          if (tradingPeriod) {
            try {
              const [month, year] = tradingPeriod.split('-');
              const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                .findIndex(m => m === month);
              
              if (monthIndex !== -1) {
                const fullYear = 2000 + parseInt(year);
                
                pricingPeriodStart = new Date(fullYear, monthIndex, 1).toISOString();
                
                const lastDay = new Date(fullYear, monthIndex + 1, 0).getDate();
                pricingPeriodEnd = new Date(fullYear, monthIndex, lastDay).toISOString();
              }
            } catch (e) {
              console.error('Error parsing period date:', e);
            }
          }
          
          const exposures = {
            physical: {},
            paper: {},
            pricing: {}
          };
          
          if (leg.relationshipType === 'FP') {
            const canonicalProduct = mapProductToCanonical(leg.product);
            exposures.paper[canonicalProduct] = leg.quantity || 0;
            
            exposures.pricing[canonicalProduct] = leg.quantity || 0;
          } else if (leg.rightSide) {
            const canonicalLeftProduct = mapProductToCanonical(leg.product);
            const canonicalRightProduct = mapProductToCanonical(leg.rightSide.product);
            
            exposures.paper[canonicalLeftProduct] = leg.quantity || 0;
            exposures.paper[canonicalRightProduct] = leg.rightSide.quantity || 0;
            
            exposures.pricing[canonicalLeftProduct] = leg.quantity || 0;
            exposures.pricing[canonicalRightProduct] = leg.rightSide.quantity || 0;
          }
          
          const instrument = generateInstrumentName(
            leg.product, 
            leg.relationshipType,
            leg.rightSide?.product
          );
          
          let mtmFormulaForDb = null;
          if (leg.mtmFormula) {
            mtmFormulaForDb = typeof leg.mtmFormula === 'string' ? JSON.parse(leg.mtmFormula) : {...leg.mtmFormula};
          } else {
            mtmFormulaForDb = {};
          }
          
          if (leg.rightSide) {
            mtmFormulaForDb.rightSide = {
              ...leg.rightSide,
              price: leg.rightSide.price || 0
            };
          }
          
          const formulaForDb = leg.formula ? (typeof leg.formula === 'string' ? JSON.parse(leg.formula) : leg.formula) : null;
          
          const legData = {
            leg_reference: legReference,
            paper_trade_id: paperTrade.id,
            buy_sell: leg.buySell,
            product: mapProductToCanonical(leg.product) as Product,
            quantity: leg.quantity,
            price: leg.price,
            broker: leg.broker || trade.broker,
            period: tradingPeriod,
            trading_period: tradingPeriod,
            formula: formulaForDb,
            mtm_formula: mtmFormulaForDb,
            pricing_period_start: pricingPeriodStart,
            pricing_period_end: pricingPeriodEnd,
            instrument: instrument,
            exposures: JSON.parse(JSON.stringify(exposures))
          };
          
          const { error: legError } = await supabase
            .from('paper_trade_legs')
            .insert(legData);
            
          if (legError) {
            throw new Error(`Error creating trade leg: ${legError.message}`);
          }
        }
      }
      
      return { ...trade, id: paperTrade.id };
    },
    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['paper-trades'] });
        queryClient.invalidateQueries({ queryKey: ['exposure-data'] });
        toast.success('Paper trade created successfully');
      }, 500);
    },
    onError: (error: Error) => {
      toast.error('Failed to create paper trade', {
        description: error.message
      });
    }
  });
  
  return {
    paperTrades: paperTrades || [],
    isLoading,
    error,
    createPaperTrade,
    isCreating,
    refetchPaperTrades: refetch
  };
};
````

## File: src/hooks/useReferenceData.ts
````typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useReferenceData = () => {
  const fetchCounterparties = async () => {
    const { data, error } = await supabase
      .from('counterparties')
      .select('name')
      .order('name');
    
    if (error) throw error;
    return data.map(item => item.name);
  };

  const fetchSustainability = async () => {
    const { data, error } = await supabase
      .from('sustainability')
      .select('name')
      .order('name');
    
    if (error) throw error;
    return data.map(item => item.name);
  };

  const fetchCreditStatus = async () => {
    const { data, error } = await supabase
      .from('credit_status')
      .select('name')
      .order('name');
    
    if (error) throw error;
    return data.map(item => item.name);
  };

  const { data: counterparties = [] } = useQuery({
    queryKey: ['counterparties'],
    queryFn: fetchCounterparties
  });

  const { data: sustainabilityOptions = [] } = useQuery({
    queryKey: ['sustainability'],
    queryFn: fetchSustainability
  });

  const { data: creditStatusOptions = [] } = useQuery({
    queryKey: ['creditStatus'],
    queryFn: fetchCreditStatus
  });

  return {
    counterparties,
    sustainabilityOptions,
    creditStatusOptions
  };
};
````

## File: src/hooks/useTrades.ts
````typescript
import React, { useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Trade,
  TradeType,
  PhysicalTrade,
  BuySell,
  Product,
  IncoTerm,
  Unit,
  PaymentTerm,
  CreditStatus,
  DbParentTrade,
  DbTradeLeg,
} from '@/types';
import { validateAndParsePricingFormula } from '@/utils/formulaUtils';
import { setupPhysicalTradeSubscriptions } from '@/utils/physicalTradeSubscriptionUtils';

const fetchTrades = async (): Promise<Trade[]> => {
  try {
    const { data: parentTrades, error: parentTradesError } = await supabase
      .from('parent_trades')
      .select('*')
      .eq('trade_type', 'physical')
      .order('created_at', { ascending: false });

    if (parentTradesError) {
      throw new Error(`Error fetching parent trades: ${parentTradesError.message}`);
    }

    const { data: tradeLegs, error: tradeLegsError } = await supabase
      .from('trade_legs')
      .select('*')
      .order('created_at', { ascending: false });

    if (tradeLegsError) {
      throw new Error(`Error fetching trade legs: ${tradeLegsError.message}`);
    }

    const mappedTrades = parentTrades.map((parent: DbParentTrade) => {
      const legs = tradeLegs.filter((leg: DbTradeLeg) => leg.parent_trade_id === parent.id);
      
      const firstLeg = legs.length > 0 ? legs[0] : null;
      
      if (parent.trade_type === 'physical' && firstLeg) {
        const physicalTrade: PhysicalTrade = {
          id: parent.id,
          tradeReference: parent.trade_reference,
          tradeType: 'physical', 
          createdAt: new Date(parent.created_at),
          updatedAt: new Date(parent.updated_at),
          physicalType: (parent.physical_type || 'spot') as 'spot' | 'term',
          counterparty: parent.counterparty,
          buySell: firstLeg.buy_sell as BuySell,
          product: firstLeg.product as Product,
          sustainability: firstLeg.sustainability || '',
          incoTerm: (firstLeg.inco_term || 'FOB') as IncoTerm,
          quantity: firstLeg.quantity,
          tolerance: firstLeg.tolerance || 0,
          loadingPeriodStart: firstLeg.loading_period_start ? new Date(firstLeg.loading_period_start) : new Date(),
          loadingPeriodEnd: firstLeg.loading_period_end ? new Date(firstLeg.loading_period_end) : new Date(),
          pricingPeriodStart: firstLeg.pricing_period_start ? new Date(firstLeg.pricing_period_start) : new Date(),
          pricingPeriodEnd: firstLeg.pricing_period_end ? new Date(firstLeg.pricing_period_end) : new Date(),
          unit: (firstLeg.unit || 'MT') as Unit,
          paymentTerm: (firstLeg.payment_term || '30 days') as PaymentTerm,
          creditStatus: (firstLeg.credit_status || 'pending') as CreditStatus,
          formula: validateAndParsePricingFormula(firstLeg.pricing_formula),
          mtmFormula: validateAndParsePricingFormula(firstLeg.mtm_formula),
          legs: legs.map(leg => ({
            id: leg.id,
            parentTradeId: leg.parent_trade_id,
            legReference: leg.leg_reference,
            buySell: leg.buy_sell as BuySell,
            product: leg.product as Product,
            sustainability: leg.sustainability || '',
            incoTerm: (leg.inco_term || 'FOB') as IncoTerm,
            quantity: leg.quantity,
            tolerance: leg.tolerance || 0,
            loadingPeriodStart: leg.loading_period_start ? new Date(leg.loading_period_start) : new Date(),
            loadingPeriodEnd: leg.loading_period_end ? new Date(leg.loading_period_end) : new Date(),
            pricingPeriodStart: leg.pricing_period_start ? new Date(leg.pricing_period_start) : new Date(),
            pricingPeriodEnd: leg.pricing_period_end ? new Date(leg.pricing_period_end) : new Date(),
            unit: (leg.unit || 'MT') as Unit,
            paymentTerm: (leg.payment_term || '30 days') as PaymentTerm,
            creditStatus: (leg.credit_status || 'pending') as CreditStatus,
            formula: validateAndParsePricingFormula(leg.pricing_formula),
            mtmFormula: validateAndParsePricingFormula(leg.mtm_formula)
          }))
        };
        return physicalTrade;
      } 
      
      return {
        id: parent.id,
        tradeReference: parent.trade_reference,
        tradeType: parent.trade_type as TradeType,
        createdAt: new Date(parent.created_at),
        updatedAt: new Date(parent.updated_at),
        counterparty: parent.counterparty,
        buySell: 'buy' as BuySell,
        product: 'UCOME' as Product,
        legs: []
      } as Trade;
    });

    return mappedTrades;
  } catch (error: any) {
    console.error('[PHYSICAL] Error fetching trades:', error);
    throw new Error(error.message);
  }
};

export const useTrades = () => {
  const realtimeChannelsRef = useRef<{ [key: string]: any }>({});
  
  const { 
    data: trades = [], 
    isLoading: loading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['trades'],
    queryFn: fetchTrades,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 2000,
  });

  const setupRealtimeSubscriptions = useCallback(() => {
    return setupPhysicalTradeSubscriptions(
      realtimeChannelsRef,
      refetch
    );
  }, [refetch]);

  useEffect(() => {
    const cleanup = setupRealtimeSubscriptions();
    
    return () => {
      cleanup();
    };
  }, [setupRealtimeSubscriptions]);

  return { 
    trades, 
    loading, 
    error, 
    refetchTrades: refetch
  };
};
````

## File: src/integrations/supabase/client.ts
````typescript
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://btwnoflfuiucxzqfqvgk.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0d25vZmxmdWl1Y3h6cWZxdmdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMxNTM0MjIsImV4cCI6MjA0ODcyOTQyMn0.oUrH-d1z0_nMf1lglwBoY_BIn6Lx1frjxsWhbk4CSXk";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Run the following SQL to enable real-time on our tables:
// ALTER PUBLICATION supabase_realtime ADD TABLE parent_trades, trade_legs;
// ALTER TABLE parent_trades REPLICA IDENTITY FULL;
// ALTER TABLE trade_legs REPLICA IDENTITY FULL;
````

## File: src/integrations/supabase/types.ts
````typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          id: string
          new_data: Json | null
          old_data: Json | null
          operation: string
          record_id: string
          table_name: string
          timestamp: string
          user_id: string | null
        }
        Insert: {
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          operation: string
          record_id: string
          table_name: string
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          operation?: string
          record_id?: string
          table_name?: string
          timestamp?: string
          user_id?: string | null
        }
        Relationships: []
      }
      brokers: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      counterparties: {
        Row: {
          bank_details: Json | null
          contact_details: Json | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
          vat_number: string | null
        }
        Insert: {
          bank_details?: Json | null
          contact_details?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
          vat_number?: string | null
        }
        Update: {
          bank_details?: Json | null
          contact_details?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
          vat_number?: string | null
        }
        Relationships: []
      }
      credit_status: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      forward_prices: {
        Row: {
          created_at: string
          forward_month: string
          id: string
          instrument_id: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          forward_month: string
          id?: string
          instrument_id: string
          price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          forward_month?: string
          id?: string
          instrument_id?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forward_prices_instrument_id_fkey"
            columns: ["instrument_id"]
            isOneToOne: false
            referencedRelation: "pricing_instruments"
            referencedColumns: ["id"]
          },
        ]
      }
      historical_prices: {
        Row: {
          created_at: string
          id: string
          instrument_id: string
          price: number
          price_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          instrument_id: string
          price: number
          price_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          instrument_id?: string
          price?: number
          price_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "historical_prices_instrument_id_fkey"
            columns: ["instrument_id"]
            isOneToOne: false
            referencedRelation: "pricing_instruments"
            referencedColumns: ["id"]
          },
        ]
      }
      inco_terms: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          calculated_price: number | null
          comments: string | null
          created_at: string
          currency: string
          due_date: string
          id: string
          invoice_date: string
          invoice_reference: string
          invoice_type: string
          movement_id: string | null
          quantity: number | null
          status: string
          total_amount: number | null
          updated_at: string
          vat_amount: number | null
          vat_rate: number | null
        }
        Insert: {
          amount: number
          calculated_price?: number | null
          comments?: string | null
          created_at?: string
          currency?: string
          due_date: string
          id?: string
          invoice_date: string
          invoice_reference: string
          invoice_type: string
          movement_id?: string | null
          quantity?: number | null
          status?: string
          total_amount?: number | null
          updated_at?: string
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Update: {
          amount?: number
          calculated_price?: number | null
          comments?: string | null
          created_at?: string
          currency?: string
          due_date?: string
          id?: string
          invoice_date?: string
          invoice_reference?: string
          invoice_type?: string
          movement_id?: string | null
          quantity?: number | null
          status?: string
          total_amount?: number | null
          updated_at?: string
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_movement_id_fkey"
            columns: ["movement_id"]
            isOneToOne: false
            referencedRelation: "movements"
            referencedColumns: ["id"]
          },
        ]
      }
      movements: {
        Row: {
          actualized: boolean | null
          actualized_date: string | null
          actualized_quantity: number | null
          bl_date: string | null
          bl_quantity: number | null
          cash_flow_date: string | null
          comments: string | null
          created_at: string
          disport: string | null
          id: string
          inspector: string | null
          loadport: string | null
          movement_reference: string
          nominated_date: string | null
          nomination_valid_date: string | null
          status: string
          trade_leg_id: string | null
          updated_at: string
          vessel_name: string | null
        }
        Insert: {
          actualized?: boolean | null
          actualized_date?: string | null
          actualized_quantity?: number | null
          bl_date?: string | null
          bl_quantity?: number | null
          cash_flow_date?: string | null
          comments?: string | null
          created_at?: string
          disport?: string | null
          id?: string
          inspector?: string | null
          loadport?: string | null
          movement_reference: string
          nominated_date?: string | null
          nomination_valid_date?: string | null
          status: string
          trade_leg_id?: string | null
          updated_at?: string
          vessel_name?: string | null
        }
        Update: {
          actualized?: boolean | null
          actualized_date?: string | null
          actualized_quantity?: number | null
          bl_date?: string | null
          bl_quantity?: number | null
          cash_flow_date?: string | null
          comments?: string | null
          created_at?: string
          disport?: string | null
          id?: string
          inspector?: string | null
          loadport?: string | null
          movement_reference?: string
          nominated_date?: string | null
          nomination_valid_date?: string | null
          status?: string
          trade_leg_id?: string | null
          updated_at?: string
          vessel_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movements_trade_leg_id_fkey"
            columns: ["trade_leg_id"]
            isOneToOne: false
            referencedRelation: "trade_legs"
            referencedColumns: ["id"]
          },
        ]
      }
      paper_trade_legs: {
        Row: {
          broker: string | null
          buy_sell: string
          created_at: string
          exposures: Json | null
          formula: Json | null
          id: string
          instrument: string | null
          leg_reference: string
          mtm_formula: Json | null
          paper_trade_id: string
          period: string | null
          price: number | null
          pricing_period_end: string | null
          pricing_period_start: string | null
          product: string
          quantity: number
          trading_period: string | null
          updated_at: string
        }
        Insert: {
          broker?: string | null
          buy_sell: string
          created_at?: string
          exposures?: Json | null
          formula?: Json | null
          id?: string
          instrument?: string | null
          leg_reference: string
          mtm_formula?: Json | null
          paper_trade_id: string
          period?: string | null
          price?: number | null
          pricing_period_end?: string | null
          pricing_period_start?: string | null
          product: string
          quantity: number
          trading_period?: string | null
          updated_at?: string
        }
        Update: {
          broker?: string | null
          buy_sell?: string
          created_at?: string
          exposures?: Json | null
          formula?: Json | null
          id?: string
          instrument?: string | null
          leg_reference?: string
          mtm_formula?: Json | null
          paper_trade_id?: string
          period?: string | null
          price?: number | null
          pricing_period_end?: string | null
          pricing_period_start?: string | null
          product?: string
          quantity?: number
          trading_period?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "paper_trade_legs_paper_trade_id_fkey"
            columns: ["paper_trade_id"]
            isOneToOne: false
            referencedRelation: "paper_trades"
            referencedColumns: ["id"]
          },
        ]
      }
      paper_trade_products: {
        Row: {
          base_product: string | null
          category: string
          created_at: string | null
          display_name: string
          id: string
          is_active: boolean | null
          paired_product: string | null
          product_code: string
        }
        Insert: {
          base_product?: string | null
          category: string
          created_at?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          paired_product?: string | null
          product_code: string
        }
        Update: {
          base_product?: string | null
          category?: string
          created_at?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          paired_product?: string | null
          product_code?: string
        }
        Relationships: []
      }
      paper_trades: {
        Row: {
          broker: string | null
          counterparty: string
          created_at: string
          id: string
          trade_reference: string
          updated_at: string
        }
        Insert: {
          broker?: string | null
          counterparty: string
          created_at?: string
          id?: string
          trade_reference: string
          updated_at?: string
        }
        Update: {
          broker?: string | null
          counterparty?: string
          created_at?: string
          id?: string
          trade_reference?: string
          updated_at?: string
        }
        Relationships: []
      }
      parent_trades: {
        Row: {
          counterparty: string
          created_at: string
          id: string
          physical_type: string | null
          trade_reference: string
          trade_type: string
          updated_at: string
        }
        Insert: {
          counterparty: string
          created_at?: string
          id?: string
          physical_type?: string | null
          trade_reference: string
          trade_type: string
          updated_at?: string
        }
        Update: {
          counterparty?: string
          created_at?: string
          id?: string
          physical_type?: string | null
          trade_reference?: string
          trade_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_terms: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          comments: string | null
          created_at: string
          currency: string
          id: string
          invoice_id: string | null
          payment_date: string
          payment_method: string | null
          payment_reference: string
          updated_at: string
        }
        Insert: {
          amount: number
          comments?: string | null
          created_at?: string
          currency?: string
          id?: string
          invoice_id?: string | null
          payment_date: string
          payment_method?: string | null
          payment_reference: string
          updated_at?: string
        }
        Update: {
          amount?: number
          comments?: string | null
          created_at?: string
          currency?: string
          id?: string
          invoice_id?: string | null
          payment_date?: string
          payment_method?: string | null
          payment_reference?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_instruments: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          display_name: string
          id: string
          instrument_code: string
          is_active: boolean | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          instrument_code: string
          is_active?: boolean | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          instrument_code?: string
          is_active?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      product_relationships: {
        Row: {
          created_at: string | null
          default_opposite: string | null
          id: string
          paired_product: string | null
          product: string
          relationship_type: string
        }
        Insert: {
          created_at?: string | null
          default_opposite?: string | null
          id?: string
          paired_product?: string | null
          product: string
          relationship_type: string
        }
        Update: {
          created_at?: string | null
          default_opposite?: string | null
          id?: string
          paired_product?: string | null
          product?: string
          relationship_type?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      sustainability: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      trade_legs: {
        Row: {
          broker: string | null
          buy_sell: string
          calculated_price: number | null
          created_at: string
          credit_status: string | null
          exposures: Json | null
          id: string
          inco_term: string | null
          instrument: string | null
          last_calculation_date: string | null
          leg_reference: string
          loading_period_end: string | null
          loading_period_start: string | null
          mtm_calculated_price: number | null
          mtm_formula: Json | null
          mtm_last_calculation_date: string | null
          parent_trade_id: string
          payment_term: string | null
          price: number | null
          pricing_formula: Json | null
          pricing_period_end: string | null
          pricing_period_start: string | null
          product: string
          quantity: number
          sustainability: string | null
          tolerance: number | null
          trading_period: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          broker?: string | null
          buy_sell: string
          calculated_price?: number | null
          created_at?: string
          credit_status?: string | null
          exposures?: Json | null
          id?: string
          inco_term?: string | null
          instrument?: string | null
          last_calculation_date?: string | null
          leg_reference: string
          loading_period_end?: string | null
          loading_period_start?: string | null
          mtm_calculated_price?: number | null
          mtm_formula?: Json | null
          mtm_last_calculation_date?: string | null
          parent_trade_id: string
          payment_term?: string | null
          price?: number | null
          pricing_formula?: Json | null
          pricing_period_end?: string | null
          pricing_period_start?: string | null
          product: string
          quantity: number
          sustainability?: string | null
          tolerance?: number | null
          trading_period?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          broker?: string | null
          buy_sell?: string
          calculated_price?: number | null
          created_at?: string
          credit_status?: string | null
          exposures?: Json | null
          id?: string
          inco_term?: string | null
          instrument?: string | null
          last_calculation_date?: string | null
          leg_reference?: string
          loading_period_end?: string | null
          loading_period_start?: string | null
          mtm_calculated_price?: number | null
          mtm_formula?: Json | null
          mtm_last_calculation_date?: string | null
          parent_trade_id?: string
          payment_term?: string | null
          price?: number | null
          pricing_formula?: Json | null
          pricing_period_end?: string | null
          pricing_period_start?: string | null
          product?: string
          quantity?: number
          sustainability?: string | null
          tolerance?: number | null
          trading_period?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_legs_parent_trade_id_fkey"
            columns: ["parent_trade_id"]
            isOneToOne: false
            referencedRelation: "parent_trades"
            referencedColumns: ["id"]
          },
        ]
      }
      trading_periods: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          is_active: boolean | null
          period_code: string
          period_type: string
          start_date: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          is_active?: boolean | null
          period_code: string
          period_type: string
          start_date: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          period_code?: string
          period_type?: string
          start_date?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
````

## File: src/lib/utils.ts
````typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
````

## File: src/pages/audit/AuditLogPage.tsx
````typescript
import React from 'react';
import { Download, Filter, Search } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockAuditLogs } from '@/data/mockData';

const AuditLogPage = () => {
  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search audit logs..."
              className="pl-8"
            />
          </div>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" /> Filter
          </Button>
        </div>

        <div className="bg-card rounded-md border shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-3 font-medium">Timestamp</th>
                  <th className="text-left p-3 font-medium">Entity Type</th>
                  <th className="text-left p-3 font-medium">Entity ID</th>
                  <th className="text-left p-3 font-medium">Field</th>
                  <th className="text-left p-3 font-medium">Old Value</th>
                  <th className="text-left p-3 font-medium">New Value</th>
                  <th className="text-left p-3 font-medium">User</th>
                </tr>
              </thead>
              <tbody>
                {mockAuditLogs.map((log) => (
                  <tr key={log.id} className="border-t hover:bg-muted/50">
                    <td className="p-3 whitespace-nowrap">{formatDateTime(log.timestamp)}</td>
                    <td className="p-3 capitalize">{log.entityType}</td>
                    <td className="p-3">{log.entityId}</td>
                    <td className="p-3 capitalize">{log.field}</td>
                    <td className="p-3">{log.oldValue || '-'}</td>
                    <td className="p-3">{log.newValue}</td>
                    <td className="p-3">{log.userId}</td>
                  </tr>
                ))}
                {mockAuditLogs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-muted-foreground">
                      No audit logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AuditLogPage;
````

## File: src/pages/operations/OperationsPage.tsx
````typescript
import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Filter } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockMovements, mockPhysicalTrades } from '@/data/mockData';
import { formatDate, calculateOpenQuantity } from '@/utils/tradeUtils';

const OperationsPage = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Operations</h1>
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" /> Calendar View
          </Button>
        </div>

        <Tabs defaultValue="open-trades" className="space-y-4">
          <TabsList className="grid w-full md:w-[400px] grid-cols-2">
            <TabsTrigger value="open-trades">Open Trades</TabsTrigger>
            <TabsTrigger value="movements">Movements</TabsTrigger>
          </TabsList>

          <TabsContent value="open-trades" className="space-y-4">
            <div className="bg-card rounded-md border shadow-sm">
              <div className="p-4 flex justify-between items-center border-b">
                <h2 className="font-semibold">Open Trades</h2>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" /> Filter
                </Button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-3 font-medium">Reference</th>
                      <th className="text-left p-3 font-medium">Counterparty</th>
                      <th className="text-left p-3 font-medium">Product</th>
                      <th className="text-right p-3 font-medium">Total Quantity</th>
                      <th className="text-right p-3 font-medium">Scheduled</th>
                      <th className="text-right p-3 font-medium">Open Quantity</th>
                      <th className="text-left p-3 font-medium">Loading Period</th>
                      <th className="text-center p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockPhysicalTrades.map((trade) => {
                      // Calculate scheduled quantity for this trade
                      const scheduledQuantity = mockMovements
                        .filter(m => m.tradeId === trade.id && m.legId === undefined)
                        .reduce((sum, m) => sum + m.scheduledQuantity, 0);
                      
                      // Calculate open quantity
                      const openQuantity = calculateOpenQuantity(
                        trade.quantity,
                        trade.tolerance,
                        scheduledQuantity
                      );
                      
                      return (
                        <tr key={trade.id} className="border-t hover:bg-muted/50">
                          <td className="p-3">
                            <Link to={`/operations/${trade.id}`} className="text-primary hover:underline">
                              {trade.tradeReference}
                            </Link>
                          </td>
                          <td className="p-3">{trade.counterparty}</td>
                          <td className="p-3">{trade.product}</td>
                          <td className="p-3 text-right">{trade.quantity} {trade.unit}</td>
                          <td className="p-3 text-right">{scheduledQuantity} {trade.unit}</td>
                          <td className="p-3 text-right">{openQuantity.toFixed(2)} {trade.unit}</td>
                          <td className="p-3">
                            {formatDate(trade.loadingPeriodStart)} - {formatDate(trade.loadingPeriodEnd)}
                          </td>
                          <td className="p-3 text-center">
                            <Link to={`/operations/${trade.id}`}>
                              <Button variant="ghost" size="sm">Schedule</Button>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                    {mockPhysicalTrades.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-muted-foreground">
                          No open trades found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="movements" className="space-y-4">
            <div className="bg-card rounded-md border shadow-sm">
              <div className="p-4 border-b">
                <h2 className="font-semibold">Recent Movements</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-3 font-medium">Trade Ref</th>
                      <th className="text-left p-3 font-medium">Vessel</th>
                      <th className="text-right p-3 font-medium">Quantity</th>
                      <th className="text-left p-3 font-medium">Nominated Date</th>
                      <th className="text-left p-3 font-medium">Loadport</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-center p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockMovements.map((movement) => {
                      const trade = mockPhysicalTrades.find(t => t.id === movement.tradeId);
                      
                      return (
                        <tr key={movement.id} className="border-t hover:bg-muted/50">
                          <td className="p-3">
                            <Link to={`/trades/${movement.tradeId}`} className="text-primary hover:underline">
                              {trade?.tradeReference}
                              {movement.legId && ' (Leg)'}
                            </Link>
                          </td>
                          <td className="p-3">{movement.vesselName || 'N/A'}</td>
                          <td className="p-3 text-right">{movement.scheduledQuantity} {trade?.unit}</td>
                          <td className="p-3">{movement.nominatedDate ? formatDate(movement.nominatedDate) : 'N/A'}</td>
                          <td className="p-3">{movement.loadport || 'N/A'}</td>
                          <td className="p-3 capitalize">{movement.status}</td>
                          <td className="p-3 text-center">
                            <Button variant="ghost" size="sm">View</Button>
                          </td>
                        </tr>
                      );
                    })}
                    {mockMovements.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-muted-foreground">
                          No movements scheduled.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default OperationsPage;
````

## File: src/pages/pricing/PricingAdminPage.tsx
````typescript
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Layout from '@/components/Layout';
import { Helmet } from 'react-helmet-async';
import PriceUploader from '@/components/pricing/PriceUploader';
import PricingInstruments from '@/components/pricing/PricingInstruments';

const PricingAdminPage = () => {
  return (
    <Layout>
      <Helmet>
        <title>Pricing Administration</title>
      </Helmet>
      
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Pricing Administration</h1>
        <p className="text-muted-foreground">
          Manage pricing instruments and upload price data
        </p>

        <Separator />

        <Tabs defaultValue="upload" className="space-y-4">
          <TabsList>
            <TabsTrigger value="upload">Price Upload</TabsTrigger>
            <TabsTrigger value="instruments">Instruments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Price Data Upload</CardTitle>
                <CardDescription>
                  Upload historical or forward price data from Excel files
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PriceUploader />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="instruments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pricing Instruments</CardTitle>
                <CardDescription>
                  View and manage pricing instruments used in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PricingInstruments />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default PricingAdminPage;
````

## File: src/pages/profile/ProfilePage.tsx
````typescript
import React from 'react';
import { Save, User } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const ProfilePage = () => {
  return (
    <Layout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account information.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your personal details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-12 w-12 text-muted-foreground" />
                </div>
                <button className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium">Full Name</label>
                <Input id="name" defaultValue="Admin User" />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="email" className="text-sm font-medium">Email Address</label>
                <Input id="email" type="email" defaultValue="admin@example.com" />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="role" className="text-sm font-medium">Role</label>
                <Input id="role" defaultValue="Administrator" disabled />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button>
              <Save className="mr-2 h-4 w-4" /> Save Changes
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>
              Update your password to keep your account secure.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label htmlFor="current-password" className="text-sm font-medium">Current Password</label>
                <Input id="current-password" type="password" />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="new-password" className="text-sm font-medium">New Password</label>
                <Input id="new-password" type="password" />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="confirm-password" className="text-sm font-medium">Confirm New Password</label>
                <Input id="confirm-password" type="password" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button>
              <Save className="mr-2 h-4 w-4" /> Update Password
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default ProfilePage;
````

## File: src/pages/risk/ExposurePage.tsx
````typescript
import React, { useMemo, useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent 
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Helmet } from 'react-helmet-async';
import { validateAndParsePricingFormula } from '@/utils/formulaUtils';
import { getNextMonths, formatMonthCode } from '@/utils/dateUtils';
import TableLoadingState from '@/components/trades/TableLoadingState';
import TableErrorState from '@/components/trades/TableErrorState';
import { Checkbox } from "@/components/ui/checkbox";
import { 
  mapProductToCanonical, 
  parsePaperInstrument, 
  formatExposureTableProduct,
  isPricingInstrument,
  shouldUseSpecialBackground,
  getExposureProductBackgroundClass
} from '@/utils/productMapping';
import { calculateNetExposure } from '@/utils/tradeUtils';

interface ExposureData {
  physical: number;
  pricing: number;
  paper: number;
  netExposure: number;
}

interface ProductExposure {
  [product: string]: ExposureData;
}

interface MonthlyExposure {
  month: string;
  products: ProductExposure;
  totals: ExposureData;
}

interface PricingInstrument {
  id: string;
  display_name: string;
  instrument_code: string;
  is_active: boolean;
}

const CATEGORY_ORDER = ['Physical', 'Pricing', 'Paper', 'Exposure'];

const usePricingInstruments = () => {
  return useQuery({
    queryKey: ['pricing-instruments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing_instruments')
        .select('id, display_name, instrument_code, is_active')
        .eq('is_active', true);
        
      if (error) throw error;
      return data || [];
    }
  });
};

const calculateProductGroupTotal = (
  monthProducts: ProductExposure,
  productGroup: string[],
  category: keyof ExposureData = 'netExposure'
): number => {
  return productGroup.reduce((total, product) => {
    if (monthProducts[product]) {
      return total + (monthProducts[product][category] || 0);
    }
    return total;
  }, 0);
};

const ExposurePage = () => {
  const [periods] = React.useState<string[]>(getNextMonths(13));
  const [visibleCategories, setVisibleCategories] = useState<string[]>(CATEGORY_ORDER);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  
  const { data: pricingInstruments = [], isLoading: instrumentsLoading } = usePricingInstruments();
  
  const ALLOWED_PRODUCTS = useMemo(() => {
    const instrumentProducts = pricingInstruments.map(
      (inst: PricingInstrument) => mapProductToCanonical(inst.display_name)
    );
    
    const biodieselProducts = ['Argus UCOME', 'Argus FAME0', 'Argus RME', 'Argus HVO'];
    
    return Array.from(new Set([...instrumentProducts, ...biodieselProducts]));
  }, [pricingInstruments]);
  
  const BIODIESEL_PRODUCTS = useMemo(() => {
    return ALLOWED_PRODUCTS.filter(p => p.includes('Argus'));
  }, [ALLOWED_PRODUCTS]);
  
  const PRICING_INSTRUMENT_PRODUCTS = useMemo(() => {
    return ALLOWED_PRODUCTS.filter(p => !p.includes('Argus'));
  }, [ALLOWED_PRODUCTS]);

  const { data: tradeData, isLoading, error, refetch } = useQuery({
    queryKey: ['exposure-data'],
    queryFn: async () => {
      const { data: physicalTradeLegs, error: physicalError } = await supabase
        .from('trade_legs')
        .select(`
          id,
          leg_reference,
          buy_sell,
          product,
          quantity,
          pricing_formula,
          mtm_formula,
          trading_period,
          pricing_period_start,
          loading_period_start
        `)
        .order('trading_period', { ascending: true });
        
      if (physicalError) throw physicalError;
      
      const { data: paperTradeLegs, error: paperError } = await supabase
        .from('paper_trade_legs')
        .select(`
          id,
          leg_reference,
          buy_sell,
          product,
          quantity,
          formula,
          mtm_formula,
          exposures,
          period,
          trading_period,
          instrument
        `)
        .order('period', { ascending: true });
        
      if (paperError) throw paperError;
      
      return {
        physicalTradeLegs: physicalTradeLegs || [],
        paperTradeLegs: paperTradeLegs || []
      };
    }
  });

  const exposureData = useMemo(() => {
    const exposuresByMonth: Record<string, Record<string, ExposureData>> = {};
    const allProductsFound = new Set<string>();
    
    periods.forEach(month => {
      exposuresByMonth[month] = {};
      
      ALLOWED_PRODUCTS.forEach(product => {
        exposuresByMonth[month][product] = {
          physical: 0,
          pricing: 0,
          paper: 0,
          netExposure: 0
        };
      });
    });
    
    if (tradeData) {
      const { physicalTradeLegs, paperTradeLegs } = tradeData;
      
      if (physicalTradeLegs && physicalTradeLegs.length > 0) {
        physicalTradeLegs.forEach(leg => {
          let physicalExposureMonth = '';
          
          if (leg.loading_period_start) {
            physicalExposureMonth = formatMonthCode(new Date(leg.loading_period_start));
          } else if (leg.trading_period) {
            physicalExposureMonth = leg.trading_period;
          } else if (leg.pricing_period_start) {
            physicalExposureMonth = formatMonthCode(new Date(leg.pricing_period_start));
          }
          
          let pricingExposureMonth = leg.trading_period || '';
          
          if (!pricingExposureMonth && leg.pricing_period_start) {
            pricingExposureMonth = formatMonthCode(new Date(leg.pricing_period_start));
          }
          
          if (!physicalExposureMonth || !periods.includes(physicalExposureMonth)) {
            return;
          }
          
          const canonicalProduct = mapProductToCanonical(leg.product || 'Unknown');
          const quantityMultiplier = leg.buy_sell === 'buy' ? 1 : -1;
          const quantity = (leg.quantity || 0) * quantityMultiplier;
          
          allProductsFound.add(canonicalProduct);
          
          if (!exposuresByMonth[physicalExposureMonth][canonicalProduct]) {
            exposuresByMonth[physicalExposureMonth][canonicalProduct] = {
              physical: 0,
              pricing: 0,
              paper: 0,
              netExposure: 0
            };
          }
          
          const mtmFormula = validateAndParsePricingFormula(leg.mtm_formula);
          
          if (mtmFormula.tokens.length > 0) {
            if (mtmFormula.exposures && mtmFormula.exposures.physical) {
              Object.entries(mtmFormula.exposures.physical).forEach(([baseProduct, weight]) => {
                const canonicalBaseProduct = mapProductToCanonical(baseProduct);
                allProductsFound.add(canonicalBaseProduct);
                
                if (!exposuresByMonth[physicalExposureMonth][canonicalBaseProduct]) {
                  exposuresByMonth[physicalExposureMonth][canonicalBaseProduct] = {
                    physical: 0,
                    pricing: 0,
                    paper: 0,
                    netExposure: 0
                  };
                }
                
                const actualExposure = typeof weight === 'number' ? weight * quantityMultiplier : 0;
                exposuresByMonth[physicalExposureMonth][canonicalBaseProduct].physical += actualExposure;
              });
            } else {
              exposuresByMonth[physicalExposureMonth][canonicalProduct].physical += quantity;
            }
          } else {
            exposuresByMonth[physicalExposureMonth][canonicalProduct].physical += quantity;
          }
          
          if (pricingExposureMonth && periods.includes(pricingExposureMonth)) {
            const pricingFormula = validateAndParsePricingFormula(leg.pricing_formula);
            
            if (pricingFormula.monthlyDistribution) {
              Object.entries(pricingFormula.monthlyDistribution).forEach(([instrument, monthlyValues]) => {
                const canonicalInstrument = mapProductToCanonical(instrument);
                allProductsFound.add(canonicalInstrument);
                
                Object.entries(monthlyValues).forEach(([monthCode, value]) => {
                  if (periods.includes(monthCode) && value !== 0) {
                    if (!exposuresByMonth[monthCode][canonicalInstrument]) {
                      exposuresByMonth[monthCode][canonicalInstrument] = {
                        physical: 0,
                        pricing: 0,
                        paper: 0,
                        netExposure: 0
                      };
                    }
                    
                    exposuresByMonth[monthCode][canonicalInstrument].pricing += value;
                  }
                });
              });
            } else if (pricingFormula.exposures && pricingFormula.exposures.pricing) {
              Object.entries(pricingFormula.exposures.pricing).forEach(([instrument, value]) => {
                const canonicalInstrument = mapProductToCanonical(instrument);
                allProductsFound.add(canonicalInstrument);
                
                if (!exposuresByMonth[pricingExposureMonth][canonicalInstrument]) {
                  exposuresByMonth[pricingExposureMonth][canonicalInstrument] = {
                    physical: 0,
                    pricing: 0,
                    paper: 0,
                    netExposure: 0
                  };
                }
                
                exposuresByMonth[pricingExposureMonth][canonicalInstrument].pricing += Number(value) || 0;
              });
            }
          }
        });
      }
      
      if (paperTradeLegs && paperTradeLegs.length > 0) {
        paperTradeLegs.forEach(leg => {
          const month = leg.period || leg.trading_period || '';
          
          if (!month || !periods.includes(month)) {
            return;
          }
          
          if (leg.instrument) {
            const { baseProduct, oppositeProduct, relationshipType } = parsePaperInstrument(leg.instrument);
            
            if (baseProduct) {
              allProductsFound.add(baseProduct);
              
              if (!exposuresByMonth[month][baseProduct]) {
                exposuresByMonth[month][baseProduct] = {
                  physical: 0,
                  pricing: 0,
                  paper: 0,
                  netExposure: 0
                };
              }
              
              const buySellMultiplier = leg.buy_sell === 'buy' ? 1 : -1;
              const quantity = (leg.quantity || 0) * buySellMultiplier;
              
              exposuresByMonth[month][baseProduct].paper += quantity;
              exposuresByMonth[month][baseProduct].pricing += quantity;
              
              if ((relationshipType === 'DIFF' || relationshipType === 'SPREAD') && oppositeProduct) {
                allProductsFound.add(oppositeProduct);
                
                if (!exposuresByMonth[month][oppositeProduct]) {
                  exposuresByMonth[month][oppositeProduct] = {
                    physical: 0,
                    pricing: 0,
                    paper: 0,
                    netExposure: 0
                  };
                }
                
                exposuresByMonth[month][oppositeProduct].paper += -quantity;
                exposuresByMonth[month][oppositeProduct].pricing += -quantity;
              }
            } else if (leg.exposures && typeof leg.exposures === 'object') {
              const exposuresData = leg.exposures as Record<string, any>;
              
              if (exposuresData.physical && typeof exposuresData.physical === 'object') {
                Object.entries(exposuresData.physical).forEach(([prodName, value]) => {
                  const canonicalProduct = mapProductToCanonical(prodName);
                  allProductsFound.add(canonicalProduct);
                  
                  if (!exposuresByMonth[month][canonicalProduct]) {
                    exposuresByMonth[month][canonicalProduct] = {
                      physical: 0,
                      pricing: 0,
                      netExposure: 0,
                      paper: 0
                    };
                  }
                  
                  exposuresByMonth[month][canonicalProduct].paper += Number(value) || 0;
                  
                  if (!exposuresData.pricing || 
                      typeof exposuresData.pricing !== 'object' || 
                      !exposuresData.pricing[prodName]) {
                    exposuresByMonth[month][canonicalProduct].pricing += Number(value) || 0;
                  }
                });
              }
              
              if (exposuresData.pricing && typeof exposuresData.pricing === 'object') {
                Object.entries(exposuresData.pricing).forEach(([instrument, value]) => {
                  const canonicalInstrument = mapProductToCanonical(instrument);
                  allProductsFound.add(canonicalInstrument);
                  
                  if (!exposuresByMonth[month][canonicalInstrument]) {
                    exposuresByMonth[month][canonicalInstrument] = {
                      physical: 0,
                      pricing: 0,
                      paper: 0,
                      netExposure: 0
                    };
                  }
                  
                  exposuresByMonth[month][canonicalInstrument].pricing += Number(value) || 0;
                });
              }
            } else if (leg.mtm_formula && typeof leg.mtm_formula === 'object') {
              const mtmFormula = leg.mtm_formula as Record<string, any>;
              
              if (mtmFormula.exposures && typeof mtmFormula.exposures === 'object') {
                const mtmExposures = mtmFormula.exposures as Record<string, any>;
                
                if (mtmExposures.physical && typeof mtmExposures.physical === 'object') {
                  Object.entries(mtmExposures.physical).forEach(([prodName, value]) => {
                    const canonicalProduct = mapProductToCanonical(prodName);
                    allProductsFound.add(canonicalProduct);
                    
                    if (!exposuresByMonth[month][canonicalProduct]) {
                      exposuresByMonth[month][canonicalProduct] = {
                        physical: 0,
                        pricing: 0,
                        paper: 0,
                        netExposure: 0
                      };
                    }
                    
                    const paperExposure = Number(value) || 0;
                    exposuresByMonth[month][canonicalProduct].paper += paperExposure;
                    
                    if (!mtmExposures.pricing || 
                        !(prodName in (mtmExposures.pricing || {}))) {
                      exposuresByMonth[month][canonicalProduct].pricing += paperExposure;
                    }
                  });
                }
                
                if (mtmExposures.pricing && typeof mtmExposures.pricing === 'object') {
                  Object.entries(mtmExposures.pricing).forEach(([prodName, value]) => {
                    const canonicalProduct = mapProductToCanonical(prodName);
                    allProductsFound.add(canonicalProduct);
                    
                    if (!exposuresByMonth[month][canonicalProduct]) {
                      exposuresByMonth[month][canonicalProduct] = {
                        physical: 0,
                        pricing: 0,
                        paper: 0,
                        netExposure: 0
                      };
                    }
                    
                    exposuresByMonth[month][canonicalProduct].pricing += Number(value) || 0;
                  });
                }
              }
            } else {
              const canonicalProduct = mapProductToCanonical(leg.product || 'Unknown');
              
              if (leg.mtm_formula && typeof leg.mtm_formula === 'object') {
                const mtmFormula = validateAndParsePricingFormula(leg.mtm_formula);
                
                if (mtmFormula.exposures && mtmFormula.exposures.physical && Object.keys(mtmFormula.exposures.physical).length > 0) {
                  const buySellMultiplier = leg.buy_sell === 'buy' ? 1 : -1;
                  
                  Object.entries(mtmFormula.exposures.physical).forEach(([pBaseProduct, weight]) => {
                    const canonicalBaseProduct = mapProductToCanonical(pBaseProduct);
                    allProductsFound.add(canonicalBaseProduct);
                    
                    if (!exposuresByMonth[month][canonicalBaseProduct]) {
                      exposuresByMonth[month][canonicalBaseProduct] = {
                        physical: 0,
                        pricing: 0,
                        paper: 0,
                        netExposure: 0
                      };
                    }
                    
                    const actualExposure = typeof weight === 'number' ? weight * buySellMultiplier : 0;
                    exposuresByMonth[month][canonicalBaseProduct].paper += actualExposure;
                    
                    if (!mtmFormula.exposures.pricing || 
                        !(pBaseProduct in (mtmFormula.exposures.pricing || {}))) {
                      exposuresByMonth[month][canonicalBaseProduct].pricing += actualExposure;
                    }
                  });
                  
                  if (mtmFormula.exposures.pricing) {
                    Object.entries(mtmFormula.exposures.pricing).forEach(([pBaseProduct, weight]) => {
                      const canonicalBaseProduct = mapProductToCanonical(pBaseProduct);
                      allProductsFound.add(canonicalBaseProduct);
                      
                      if (!exposuresByMonth[month][canonicalBaseProduct]) {
                        exposuresByMonth[month][canonicalBaseProduct] = {
                          physical: 0,
                          pricing: 0,
                          paper: 0,
                          netExposure: 0
                        };
                      }
                      
                      const actualExposure = typeof weight === 'number' ? weight * buySellMultiplier : 0;
                      exposuresByMonth[month][canonicalBaseProduct].pricing += actualExposure;
                    });
                  }
                } else {
                  if (!exposuresByMonth[month][canonicalProduct]) {
                    exposuresByMonth[month][canonicalProduct] = {
                      physical: 0,
                      pricing: 0,
                      paper: 0,
                      netExposure: 0
                    };
                  }
                  
                  const buySellMultiplier = leg.buy_sell === 'buy' ? 1 : -1;
                  const paperExposure = (leg.quantity || 0) * buySellMultiplier;
                  exposuresByMonth[month][canonicalProduct].paper += paperExposure;
                  exposuresByMonth[month][canonicalProduct].pricing += paperExposure;
                }
              } else {
                if (!exposuresByMonth[month][canonicalProduct]) {
                  exposuresByMonth[month][canonicalProduct] = {
                    physical: 0,
                    pricing: 0,
                    paper: 0,
                    netExposure: 0
                  };
                }
                
                const buySellMultiplier = leg.buy_sell === 'buy' ? 1 : -1;
                const paperExposure = (leg.quantity || 0) * buySellMultiplier;
                exposuresByMonth[month][canonicalProduct].paper += paperExposure;
                exposuresByMonth[month][canonicalProduct].pricing += paperExposure;
              }
            }
          } else if (leg.exposures && typeof leg.exposures === 'object') {
            const exposuresData = leg.exposures as Record<string, any>;
            
            if (exposuresData.physical && typeof exposuresData.physical === 'object') {
              Object.entries(exposuresData.physical).forEach(([prodName, value]) => {
                const canonicalProduct = mapProductToCanonical(prodName);
                allProductsFound.add(canonicalProduct);
                
                if (!exposuresByMonth[month][canonicalProduct]) {
                  exposuresByMonth[month][canonicalProduct] = {
                    physical: 0,
                    pricing: 0,
                    netExposure: 0,
                    paper: 0
                  };
                }
                
                exposuresByMonth[month][canonicalProduct].paper += Number(value) || 0;
                
                if (!exposuresData.pricing || 
                    typeof exposuresData.pricing !== 'object' || 
                    !exposuresData.pricing[prodName]) {
                  exposuresByMonth[month][canonicalProduct].pricing += Number(value) || 0;
                }
              });
            }
            
            if (exposuresData.pricing && typeof exposuresData.pricing === 'object') {
              Object.entries(exposuresData.pricing).forEach(([instrument, value]) => {
                const canonicalInstrument = mapProductToCanonical(instrument);
                allProductsFound.add(canonicalInstrument);
                
                if (!exposuresByMonth[month][canonicalInstrument]) {
                  exposuresByMonth[month][canonicalInstrument] = {
                    physical: 0,
                    pricing: 0,
                    paper: 0,
                    netExposure: 0
                  };
                }
                
                exposuresByMonth[month][canonicalInstrument].pricing += Number(value) || 0;
              });
            }
          } else if (leg.mtm_formula && typeof leg.mtm_formula === 'object') {
            const mtmFormula = leg.mtm_formula as Record<string, any>;
            
            if (mtmFormula.exposures && typeof mtmFormula.exposures === 'object') {
              const mtmExposures = mtmFormula.exposures as Record<string, any>;
              
              if (mtmExposures.physical && typeof mtmExposures.physical === 'object') {
                Object.entries(mtmExposures.physical).forEach(([prodName, value]) => {
                  const canonicalProduct = mapProductToCanonical(prodName);
                  allProductsFound.add(canonicalProduct);
                  
                  if (!exposuresByMonth[month][canonicalProduct]) {
                    exposuresByMonth[month][canonicalProduct] = {
                      physical: 0,
                      pricing: 0,
                      paper: 0,
                      netExposure: 0
                    };
                  }
                  
                  const paperExposure = Number(value) || 0;
                  exposuresByMonth[month][canonicalProduct].paper += paperExposure;
                  
                  if (!mtmExposures.pricing || 
                      !(prodName in (mtmExposures.pricing || {}))) {
                    exposuresByMonth[month][canonicalProduct].pricing += paperExposure;
                  }
                });
              }
              
              if (mtmExposures.pricing && typeof mtmExposures.pricing === 'object') {
                Object.entries(mtmExposures.pricing).forEach(([prodName, value]) => {
                  const canonicalProduct = mapProductToCanonical(prodName);
                  allProductsFound.add(canonicalProduct);
                  
                  if (!exposuresByMonth[month][canonicalProduct]) {
                    exposuresByMonth[month][canonicalProduct] = {
                      physical: 0,
                      pricing: 0,
                      paper: 0,
                      netExposure: 0
                    };
                  }
                  
                  exposuresByMonth[month][canonicalProduct].pricing += Number(value) || 0;
                });
              }
            }
          } else {
            const canonicalProduct = mapProductToCanonical(leg.product || 'Unknown');
            
            if (leg.mtm_formula && typeof leg.mtm_formula === 'object') {
              const mtmFormula = validateAndParsePricingFormula(leg.mtm_formula);
              
              if (mtmFormula.exposures && mtmFormula.exposures.physical && Object.keys(mtmFormula.exposures.physical).length > 0) {
                const buySellMultiplier = leg.buy_sell === 'buy' ? 1 : -1;
                
                Object.entries(mtmFormula.exposures.physical).forEach(([pBaseProduct, weight]) => {
                  const canonicalBaseProduct = mapProductToCanonical(pBaseProduct);
                  allProductsFound.add(canonicalBaseProduct);
                  
                  if (!exposuresByMonth[month][canonicalBaseProduct]) {
                    exposuresByMonth[month][canonicalBaseProduct] = {
                      physical: 0,
                      pricing: 0,
                      paper: 0,
                      netExposure: 0
                    };
                  }
                  
                  const actualExposure = typeof weight === 'number' ? weight * buySellMultiplier : 0;
                  exposuresByMonth[month][canonicalBaseProduct].paper += actualExposure;
                  
                  if (!mtmFormula.exposures.pricing || 
                      !(pBaseProduct in (mtmFormula.exposures.pricing || {}))) {
                    exposuresByMonth[month][canonicalBaseProduct].pricing += actualExposure;
                  }
                });
                
                if (mtmFormula.exposures.pricing) {
                  Object.entries(mtmFormula.exposures.pricing).forEach(([pBaseProduct, weight]) => {
                    const canonicalBaseProduct = mapProductToCanonical(pBaseProduct);
                    allProductsFound.add(canonicalBaseProduct);
                    
                    if (!exposuresByMonth[month][canonicalBaseProduct]) {
                      exposuresByMonth[month][canonicalBaseProduct] = {
                        physical: 0,
                        pricing: 0,
                        paper: 0,
                        netExposure: 0
                      };
                    }
                    
                    const actualExposure = typeof weight === 'number' ? weight * buySellMultiplier : 0;
                    exposuresByMonth[month][canonicalBaseProduct].pricing += actualExposure;
                  });
                }
              } else {
                if (!exposuresByMonth[month][canonicalProduct]) {
                  exposuresByMonth[month][canonicalProduct] = {
                    physical: 0,
                    pricing: 0,
                    paper: 0,
                    netExposure: 0
                  };
                }
                
                const buySellMultiplier = leg.buy_sell === 'buy' ? 1 : -1;
                const paperExposure = (leg.quantity || 0) * buySellMultiplier;
                exposuresByMonth[month][canonicalProduct].paper += paperExposure;
                exposuresByMonth[month][canonicalProduct].pricing += paperExposure;
              }
            } else {
              if (!exposuresByMonth[month][canonicalProduct]) {
                exposuresByMonth[month][canonicalProduct] = {
                  physical: 0,
                  pricing: 0,
                  paper: 0,
                  netExposure: 0
                };
              }
              
              const buySellMultiplier = leg.buy_sell === 'buy' ? 1 : -1;
              const paperExposure = (leg.quantity || 0) * buySellMultiplier;
              exposuresByMonth[month][canonicalProduct].paper += paperExposure;
              exposuresByMonth[month][canonicalProduct].pricing += paperExposure;
            }
          }
        });
      }
    }
    
    const monthlyExposures: MonthlyExposure[] = periods.map(month => {
      const monthData = exposuresByMonth[month];
      const productsData: Record<string, ExposureData> = {};
      const totals: ExposureData = { physical: 0, pricing: 0, paper: 0, netExposure: 0 };
      
      Object.entries(monthData).forEach(([product, exposure]) => {
        if (ALLOWED_PRODUCTS.includes(product)) {
          exposure.netExposure = calculateNetExposure(
            exposure.physical,
            exposure.pricing
          );
          
          productsData[product] = exposure;
          
          totals.physical += exposure.physical;
          totals.pricing += exposure.pricing;
          totals.paper += exposure.paper;
        }
      });
      
      totals.netExposure = calculateNetExposure(totals.physical, totals.pricing);
      
      return {
        month,
        products: productsData,
        totals
      };
    });
    
    return monthlyExposures;
  }, [tradeData, periods, ALLOWED_PRODUCTS]);

  const allProducts = useMemo(() => {
    return [...ALLOWED_PRODUCTS].sort();
  }, [ALLOWED_PRODUCTS]);

  useEffect(() => {
    if (allProducts.length > 0) {
      setSelectedProducts([...allProducts]);
    }
  }, [allProducts]);

  const grandTotals = useMemo(() => {
    const totals: ExposureData = { physical: 0, pricing: 0, paper: 0, netExposure: 0 };
    const productTotals: Record<string, ExposureData> = {};
    
    allProducts.forEach(product => {
      productTotals[product] = { physical: 0, pricing: 0, paper: 0, netExposure: 0 };
    });
    
    exposureData.forEach(monthData => {
      totals.physical += monthData.totals.physical;
      totals.pricing += monthData.totals.pricing;
      totals.paper += monthData.totals.paper;
      
      totals.netExposure = calculateNetExposure(totals.physical, totals.pricing);
      
      Object.entries(monthData.products).forEach(([product, exposure]) => {
        if (productTotals[product]) {
          productTotals[product].physical += exposure.physical;
          productTotals[product].pricing += exposure.pricing;
          productTotals[product].paper += exposure.paper;
          
          productTotals[product].netExposure = calculateNetExposure(
            productTotals[product].physical,
            productTotals[product].pricing
          );
        }
      });
    });
    
    return { totals, productTotals };
  }, [exposureData, allProducts]);

  const groupGrandTotals = useMemo(() => {
    const biodieselTotal = BIODIESEL_PRODUCTS.reduce((total, product) => {
      if (grandTotals.productTotals[product]) {
        return total + grandTotals.productTotals[product].netExposure;
      }
      return total;
    }, 0);
    
    const pricingInstrumentTotal = PRICING_INSTRUMENT_PRODUCTS.reduce((total, product) => {
      if (grandTotals.productTotals[product]) {
        return total + grandTotals.productTotals[product].netExposure;
      }
      return total;
    }, 0);
    
    return {
      biodieselTotal,
      pricingInstrumentTotal,
      totalRow: biodieselTotal + pricingInstrumentTotal
    };
  }, [grandTotals, BIODIESEL_PRODUCTS, PRICING_INSTRUMENT_PRODUCTS]);

  const getValueColorClass = (value: number): string => {
    return value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-muted-foreground';
  };

  const formatValue = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toLocaleString()}`;
  };

  const exposureCategories = CATEGORY_ORDER;

  const getCategoryColorClass = (category: string): string => {
    switch (category) {
      case 'Physical':
        return 'bg-orange-800';
      case 'Pricing':
        return 'bg-green-800';
      case 'Paper':
        return 'bg-blue-800';
      case 'Exposure':
        return 'bg-green-600';
      default:
        return '';
    }
  };

  const toggleCategory = (category: string) => {
    setVisibleCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(cat => cat !== category);
      } else {
        const newCategories = [...prev, category];
        return [...CATEGORY_ORDER].filter(cat => newCategories.includes(cat));
      }
    });
  };

  const filteredProducts = useMemo(() => {
    return allProducts;
  }, [allProducts]);

  const orderedVisibleCategories = useMemo(() => {
    return CATEGORY_ORDER.filter(category => visibleCategories.includes(category));
  }, [visibleCategories]);

  const shouldShowProductInCategory = (product: string, category: string): boolean => {
    if (category === 'Physical' && product === 'ICE GASOIL FUTURES') {
      return false;
    }
    return true;
  };

  const shouldShowBiodieselTotal = true;
  
  const shouldShowPricingInstrumentTotal = true;
  
  const shouldShowTotalRow = true;

  const isLoadingData = isLoading || instrumentsLoading;

  return (
    <Layout>
      <Helmet>
        <title>Exposure Reporting</title>
      </Helmet>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Exposure Reporting</h1>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <Download className="mr-2 h-3 w-3" /> Export
            </Button>
          </div>
        </div>

        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Category Filters</label>
                <div className="flex flex-wrap gap-2">
                  {exposureCategories.map(category => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`category-${category}`} 
                        checked={visibleCategories.includes(category)} 
                        onCheckedChange={() => toggleCategory(category)}
                      />
                      <label 
                        htmlFor={`category-${category}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {category}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoadingData ? (
          <Card>
            <CardContent className="pt-4">
              <TableLoadingState />
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="pt-4">
              <TableErrorState error={error as Error} onRetry={refetch} />
            </CardContent>
          </Card>
        ) : exposureData.length === 0 || filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="pt-4">
              <div className="flex justify-center items-center h-40">
                <p className="text-muted-foreground">No exposure data found.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <CardContent className="p-0 overflow-auto">
              <div className="w-full overflow-auto">
                <div style={{ width: "max-content", minWidth: "100%" }}>
                  <Table className="border-collapse">
                    <TableHeader>
                      <TableRow className="bg-muted/50 border-b-[1px] border-black">
                        <TableHead 
                          rowSpan={2} 
                          className="border-r-[1px] border-b-[1px] border-black text-left p-1 font-bold text-black text-xs bg-white sticky left-0 z-10"
                        >
                          Month
                        </TableHead>
                        {orderedVisibleCategories.map((category, catIndex) => {
                          const categoryProducts = filteredProducts.filter(product => 
                            shouldShowProductInCategory(product, category)
                          );
                          
                          let colSpan = categoryProducts.length;
                          
                          if (category === 'Exposure') {
                            if (shouldShowPricingInstrumentTotal) colSpan += 1;
                            if (shouldShowTotalRow) colSpan += 1;
                          }
                          
                          return (
                            <TableHead 
                              key={category} 
                              colSpan={colSpan} 
                              className={`text-center p-1 font-bold text-black text-xs border-b-[1px] ${
                                catIndex < orderedVisibleCategories.length - 1 ? 'border-r-[1px]' : ''
                              } border-black`}
                            >
                              {category}
                            </TableHead>
                          );
                        })}
                      </TableRow>
                      
                      <TableRow className="bg-muted/30 border-b-[1px] border-black">
                        {orderedVisibleCategories.flatMap((category, catIndex) => {
                          const categoryProducts = filteredProducts.filter(product => 
                            shouldShowProductInCategory(product, category)
                          );
                          
                          if (category === 'Exposure') {
                            const ucomeIndex = categoryProducts.findIndex(p => p === 'Argus UCOME');
                            
                            const headers = [];
                            
                            categoryProducts.forEach((product, index) => {
                              headers.push(
                                <TableHead 
                                  key={`${category}-${product}`} 
                                  className={`text-right p-1 text-xs whitespace-nowrap border-t-0 border-r-[1px] border-black ${
                                    getExposureProductBackgroundClass(product)
                                  } text-white font-bold`}
                                >
                                  {formatExposureTableProduct(product)}
                                </TableHead>
                              );
                              
                              if (index === ucomeIndex && shouldShowBiodieselTotal) {
                                headers.push(
                                  <TableHead 
                                    key={`${category}-biodiesel-total`} 
                                    className={`text-right p-1 text-xs whitespace-nowrap border-t-0 border-r-[1px] border-black ${
                                      getCategoryColorClass(category)
                                    } text-white font-bold`}
                                  >
                                    Total Biodiesel
                                  </TableHead>
                                );
                              }
                            });
                            
                            if (shouldShowPricingInstrumentTotal) {
                              headers.push(
                                <TableHead 
                                  key={`${category}-pricing-instrument-total`} 
                                  className={`text-right p-1 text-xs whitespace-nowrap border-t-0 border-r-[1px] border-black ${
                                    getExposureProductBackgroundClass('', false, true)
                                  } text-white font-bold`}
                                >
                                  Total Pricing Instrument
                                </TableHead>
                              );
                            }
                            
                            if (shouldShowTotalRow) {
                              headers.push(
                                <TableHead 
                                  key={`${category}-total-row`} 
                                  className={`text-right p-1 text-xs whitespace-nowrap border-t-0 ${
                                    getExposureProductBackgroundClass('', true)
                                  } ${
                                    catIndex < orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : ''
                                  } text-white font-bold`}
                                >
                                  Total Row
                                </TableHead>
                              );
                            }
                            
                            return headers;
                          } else {
                            return categoryProducts.map((product, index) => (
                              <TableHead 
                                key={`${category}-${product}`} 
                                className={`text-right p-1 text-xs whitespace-nowrap border-t-0 ${
                                  getCategoryColorClass(category)
                                } ${
                                  index === categoryProducts.length - 1 && 
                                  catIndex < orderedVisibleCategories.length - 1
                                    ? 'border-r-[1px] border-black' : ''
                                } ${
                                  index > 0 ? 'border-l-[0px]' : ''
                                } text-white font-bold`}
                              >
                                {formatExposureTableProduct(product)}
                              </TableHead>
                            ));
                          }
                        })}
                      </TableRow>
                    </TableHeader>
                    
                    <TableBody>
                      {exposureData.map((monthData) => (
                        <TableRow key={monthData.month} className="bg-white hover:bg-gray-50">
                          <TableCell className="font-medium border-r-[1px] border-black text-xs sticky left-0 bg-white z-10">
                            {monthData.month}
                          </TableCell>
                          
                          {orderedVisibleCategories.map((category, catIndex) => {
                            const categoryProducts = filteredProducts.filter(product => 
                              shouldShowProductInCategory(product, category)
                            );
                            
                            const cells = [];
                            
                            if (category === 'Physical') {
                              categoryProducts.forEach((product, index) => {
                                const productData = monthData.products[product] || { physical: 0, pricing: 0, paper: 0, netExposure: 0 };
                                cells.push(
                                  <TableCell 
                                    key={`${monthData.month}-physical-${product}`} 
                                    className={`text-right text-xs p-1 ${getValueColorClass(productData.physical)} ${
                                      index === categoryProducts.length - 1 && catIndex < orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : ''
                                    }`}
                                  >
                                    {formatValue(productData.physical)}
                                  </TableCell>
                                );
                              });
                            } else if (category === 'Pricing') {
                              categoryProducts.forEach((product, index) => {
                                const productData = monthData.products[product] || { physical: 0, pricing: 0, paper: 0, netExposure: 0 };
                                cells.push(
                                  <TableCell 
                                    key={`${monthData.month}-pricing-${product}`} 
                                    className={`text-right text-xs p-1 ${getValueColorClass(productData.pricing)} ${
                                      index === categoryProducts.length - 1 && catIndex < orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : ''
                                    }`}
                                  >
                                    {formatValue(productData.pricing)}
                                  </TableCell>
                                );
                              });
                            } else if (category === 'Paper') {
                              categoryProducts.forEach((product, index) => {
                                const productData = monthData.products[product] || { physical: 0, pricing: 0, paper: 0, netExposure: 0 };
                                cells.push(
                                  <TableCell 
                                    key={`${monthData.month}-paper-${product}`} 
                                    className={`text-right text-xs p-1 ${getValueColorClass(productData.paper)} ${
                                      index === categoryProducts.length - 1 && catIndex < orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : ''
                                    }`}
                                  >
                                    {formatValue(productData.paper)}
                                  </TableCell>
                                );
                              });
                            } else if (category === 'Exposure') {
                              const ucomeIndex = categoryProducts.findIndex(p => p === 'Argus UCOME');
                              
                              categoryProducts.forEach((product, index) => {
                                const productData = monthData.products[product] || { physical: 0, pricing: 0, paper: 0, netExposure: 0 };
                                cells.push(
                                  <TableCell 
                                    key={`${monthData.month}-net-${product}`} 
                                    className={`text-right text-xs p-1 font-medium border-r-[1px] border-black ${getValueColorClass(productData.netExposure)}`}
                                  >
                                    {formatValue(productData.netExposure)}
                                  </TableCell>
                                );
                                
                                if (index === ucomeIndex && shouldShowBiodieselTotal) {
                                  const biodieselTotal = calculateProductGroupTotal(
                                    monthData.products,
                                    BIODIESEL_PRODUCTS
                                  );
                                  
                                  cells.push(
                                    <TableCell 
                                      key={`${monthData.month}-biodiesel-total`} 
                                      className={`text-right text-xs p-1 font-medium border-r-[1px] border-black ${getValueColorClass(biodieselTotal)} bg-green-50`}
                                    >
                                      {formatValue(biodieselTotal)}
                                    </TableCell>
                                  );
                                }
                              });
                              
                              if (shouldShowPricingInstrumentTotal) {
                                const pricingInstrumentTotal = calculateProductGroupTotal(
                                  monthData.products,
                                  PRICING_INSTRUMENT_PRODUCTS
                                );
                                
                                cells.push(
                                  <TableCell 
                                    key={`${monthData.month}-pricing-instrument-total`} 
                                    className={`text-right text-xs p-1 font-medium border-r-[1px] border-black ${getValueColorClass(pricingInstrumentTotal)} bg-blue-50`}
                                  >
                                    {formatValue(pricingInstrumentTotal)}
                                  </TableCell>
                                );
                              }
                              
                              if (shouldShowTotalRow) {
                                const biodieselTotal = calculateProductGroupTotal(
                                  monthData.products,
                                  BIODIESEL_PRODUCTS
                                );
                                
                                const pricingInstrumentTotal = calculateProductGroupTotal(
                                  monthData.products,
                                  PRICING_INSTRUMENT_PRODUCTS
                                );
                                
                                const totalRow = biodieselTotal + pricingInstrumentTotal;
                                
                                cells.push(
                                  <TableCell 
                                    key={`${monthData.month}-total-row`} 
                                    className={`text-right text-xs p-1 font-medium ${getValueColorClass(totalRow)} bg-gray-100 ${
                                      catIndex < orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : ''
                                    }`}
                                  >
                                    {formatValue(totalRow)}
                                  </TableCell>
                                );
                              }
                            }
                            
                            return cells;
                          })}
                        </TableRow>
                      ))}
                      
                      <TableRow className="bg-gray-700 text-white font-bold border-t-[1px] border-black">
                        <TableCell className="border-r-[1px] border-black text-xs p-1 sticky left-0 bg-gray-700 z-10 text-white">
                          Total
                        </TableCell>
                        
                        {orderedVisibleCategories.map((category, catIndex) => {
                          const categoryProducts = filteredProducts.filter(product => 
                            shouldShowProductInCategory(product, category)
                          );
                          
                          const cells = [];
                          
                          if (category === 'Physical') {
                            categoryProducts.forEach((product, index) => {
                              cells.push(
                                <TableCell 
                                  key={`total-physical-${product}`} 
                                  className={`text-right text-xs p-1 ${
                                    grandTotals.productTotals[product]?.physical > 0 ? 'text-green-300' : 
                                    grandTotals.productTotals[product]?.physical < 0 ? 'text-red-300' : 'text-gray-300'
                                  } font-bold ${
                                    index === categoryProducts.length - 1 && catIndex < orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : ''
                                  }`}
                                >
                                  {formatValue(grandTotals.productTotals[product]?.physical || 0)}
                                </TableCell>
                              );
                            });
                          } else if (category === 'Pricing') {
                            categoryProducts.forEach((product, index) => {
                              cells.push(
                                <TableCell 
                                  key={`total-pricing-${product}`} 
                                  className={`text-right text-xs p-1 ${
                                    grandTotals.productTotals[product]?.pricing > 0 ? 'text-green-300' : 
                                    grandTotals.productTotals[product]?.pricing < 0 ? 'text-red-300' : 'text-gray-300'
                                  } font-bold ${
                                    index === categoryProducts.length - 1 && catIndex < orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : ''
                                  }`}
                                >
                                  {formatValue(grandTotals.productTotals[product]?.pricing || 0)}
                                </TableCell>
                              );
                            });
                          } else if (category === 'Paper') {
                            categoryProducts.forEach((product, index) => {
                              cells.push(
                                <TableCell 
                                  key={`total-paper-${product}`} 
                                  className={`text-right text-xs p-1 ${
                                    grandTotals.productTotals[product]?.paper > 0 ? 'text-green-300' : 
                                    grandTotals.productTotals[product]?.paper < 0 ? 'text-red-300' : 'text-gray-300'
                                  } font-bold ${
                                    index === categoryProducts.length - 1 && catIndex < orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : ''
                                  }`}
                                >
                                  {formatValue(grandTotals.productTotals[product]?.paper || 0)}
                                </TableCell>
                              );
                            });
                          } else if (category === 'Exposure') {
                            const ucomeIndex = categoryProducts.findIndex(p => p === 'Argus UCOME');
                            
                            categoryProducts.forEach((product, index) => {
                              cells.push(
                                <TableCell 
                                  key={`total-net-${product}`} 
                                  className={`text-right text-xs p-1 border-r-[1px] border-black ${
                                    grandTotals.productTotals[product]?.netExposure > 0 ? 'text-green-300' : 
                                    grandTotals.productTotals[product]?.netExposure < 0 ? 'text-red-300' : 'text-gray-300'
                                  } font-bold`}
                                >
                                  {formatValue(grandTotals.productTotals[product]?.netExposure || 0)}
                                </TableCell>
                              );
                              
                              if (index === ucomeIndex && shouldShowBiodieselTotal) {
                                cells.push(
                                  <TableCell 
                                    key={`total-biodiesel-total`} 
                                    className={`text-right text-xs p-1 border-r-[1px] border-black ${
                                      groupGrandTotals.biodieselTotal > 0 ? 'text-green-300' : 
                                      groupGrandTotals.biodieselTotal < 0 ? 'text-red-300' : 'text-gray-300'
                                    } font-bold bg-green-900`}
                                  >
                                    {formatValue(groupGrandTotals.biodieselTotal)}
                                  </TableCell>
                                );
                              }
                            });
                            
                            if (shouldShowPricingInstrumentTotal) {
                              cells.push(
                                <TableCell 
                                  key={`total-pricing-instrument-total`} 
                                  className={`text-right text-xs p-1 border-r-[1px] border-black ${
                                    groupGrandTotals.pricingInstrumentTotal > 0 ? 'text-green-300' : 
                                    groupGrandTotals.pricingInstrumentTotal < 0 ? 'text-red-300' : 'text-gray-300'
                                  } font-bold bg-blue-900`}
                                >
                                  {formatValue(groupGrandTotals.pricingInstrumentTotal)}
                                </TableCell>
                              );
                            }
                            
                            if (shouldShowTotalRow) {
                              cells.push(
                                <TableCell 
                                  key={`total-total-row`} 
                                  className={`text-right text-xs p-1 ${
                                    groupGrandTotals.totalRow > 0 ? 'text-green-300' : 
                                    groupGrandTotals.totalRow < 0 ? 'text-red-300' : 'text-gray-300'
                                  } font-bold bg-gray-800 ${
                                    catIndex < orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : ''
                                  }`}
                                >
                                  {formatValue(groupGrandTotals.totalRow)}
                                </TableCell>
                              );
                            }
                          }
                          
                          return cells;
                        })}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default ExposurePage;
````

## File: src/pages/risk/MTMPage.tsx
````typescript
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Eye } from 'lucide-react';
import { useTrades } from '@/hooks/useTrades';
import { 
  calculateTradeLegPrice, 
  calculateMTMPrice, 
  calculateMTMValue, 
  PricingPeriodType 
} from '@/utils/priceCalculationUtils';
import PriceDetails from '@/components/pricing/PriceDetails';
import { PhysicalTrade } from '@/types';
import { PaperTrade } from '@/types/paper';
import { formatMTMDisplay } from '@/utils/tradeUtils';

const MTMPage = () => {
  const { trades, loading: tradesLoading, refetchTrades } = useTrades();
  const [selectedLeg, setSelectedLeg] = useState<{
    legId: string;
    formula: any;
    mtmFormula: any;
    startDate: Date;
    endDate: Date;
    quantity: number;
    buySell: 'buy' | 'sell';
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const physicalTrades = trades.filter(
    (trade): trade is PhysicalTrade => trade.tradeType === 'physical'
  );

  type MTMPosition = {
    legId: string;
    tradeRef: string;
    legReference: string;
    physicalType: string;
    buySell: string;
    product: string;
    quantity: number;
    startDate: Date;
    endDate: Date;
    formula: any;
    mtmFormula: any;
    calculatedPrice: number;
    mtmCalculatedPrice: number;
    mtmValue: number;
    periodType?: PricingPeriodType;
  };

  const tradeLegs = physicalTrades.flatMap(trade => 
    trade.legs?.map(leg => {
      let startDate = leg.pricingPeriodStart;
      let endDate = leg.pricingPeriodEnd;
      
      if (startDate > endDate) {
        const temp = startDate;
        startDate = endDate;
        endDate = temp;
      }
      
      return {
        legId: leg.id,
        tradeRef: trade.tradeReference,
        legReference: leg.legReference,
        physicalType: trade.physicalType,
        buySell: leg.buySell.toLowerCase(),
        product: leg.product,
        quantity: leg.quantity,
        startDate: startDate,
        endDate: endDate,
        formula: leg.formula,
        mtmFormula: leg.mtmFormula,
        calculatedPrice: 0,
        mtmCalculatedPrice: 0,
      };
    }) || []
  );

  const { data: mtmPositions, isLoading: calculationLoading } = useQuery({
    queryKey: ['mtmPositions', tradeLegs],
    queryFn: async () => {
      if (tradeLegs.length === 0) return [];
      
      const positions = await Promise.all(
        tradeLegs.map(async (leg) => {
          if (!leg.formula) return { ...leg, calculatedPrice: 0, mtmCalculatedPrice: 0, mtmValue: 0 };
          
          try {
            const priceResult = await calculateTradeLegPrice(
              leg.formula,
              leg.startDate,
              leg.endDate
            );
            
            const mtmFormula = leg.mtmFormula || leg.formula;
            const mtmPriceResult = await calculateMTMPrice(mtmFormula);
            
            const mtmValue = calculateMTMValue(
              priceResult.price,
              mtmPriceResult.price,
              leg.quantity,
              leg.buySell as 'buy' | 'sell'
            );
            
            return {
              ...leg,
              calculatedPrice: priceResult.price,
              mtmCalculatedPrice: mtmPriceResult.price,
              mtmValue,
              periodType: priceResult.periodType
            } as MTMPosition;
          } catch (error) {
            console.error(`Error calculating MTM for leg ${leg.legId}:`, error);
            return { ...leg, calculatedPrice: 0, mtmCalculatedPrice: 0, mtmValue: 0 } as MTMPosition;
          }
        })
      );
      
      return positions;
    },
    enabled: !tradesLoading && tradeLegs.length > 0
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchTrades();
    setRefreshing(false);
  };

  const handleViewPrices = (leg: any) => {
    setSelectedLeg({
      legId: leg.legId,
      formula: leg.formula,
      mtmFormula: leg.mtmFormula,
      startDate: leg.startDate,
      endDate: leg.endDate,
      quantity: leg.quantity,
      buySell: leg.buySell as 'buy' | 'sell'
    });
  };

  const totalMtm = mtmPositions?.reduce((sum, pos) => sum + (pos.mtmValue || 0), 0) || 0;

  const renderPaperFormula = (trade: PaperTrade) => {
    if (!trade.legs || trade.legs.length === 0) {
      return <span className="text-muted-foreground italic">No formula</span>;
    }
    
    const firstLeg = trade.legs[0];
    
    return <span>{formatMTMDisplay(
      firstLeg.product,
      firstLeg.relationshipType,
      firstLeg.rightSide?.product
    )}</span>;
  };

  return (
    <Layout>
      <Helmet>
        <title>Mark-to-Market</title>
      </Helmet>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mark-to-Market</h1>
            <p className="text-muted-foreground">
              View real-time Mark-to-Market positions across all trading activities
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={refreshing || tradesLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Separator />
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>MTM Positions</CardTitle>
                <CardDescription>
                  Current Mark-to-Market position values by instrument and trade
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">Total MTM Position</div>
                <div className={`text-2xl font-bold ${totalMtm >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${totalMtm.toFixed(2)}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {tradesLoading || calculationLoading ? (
              <div className="flex items-center justify-center p-12 text-muted-foreground">
                <p>Loading MTM positions...</p>
              </div>
            ) : mtmPositions && mtmPositions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trade Ref</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>B/S</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Trade Price</TableHead>
                    <TableHead className="text-right">MTM Price</TableHead>
                    <TableHead className="text-right">MTM Value</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mtmPositions.map((position) => (
                    <TableRow key={position.legId}>
                      <TableCell>
                        {position.physicalType === 'term' ? (
                          <>
                            {position.tradeRef}-{position.legReference.split('-').pop()}
                          </>
                        ) : (
                          <>
                            {position.tradeRef}
                          </>
                        )}
                      </TableCell>
                      <TableCell>{position.product}</TableCell>
                      <TableCell>
                        <Badge variant={position.buySell === 'buy' ? 'default' : 'outline'}>
                          {position.buySell.charAt(0).toUpperCase() + position.buySell.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {position.quantity.toLocaleString()} MT
                      </TableCell>
                      <TableCell className="text-right">
                        ${position.calculatedPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        ${position.mtmCalculatedPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={position.mtmValue >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ${position.mtmValue.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          position.periodType === 'historical' ? 'default' : 
                          position.periodType === 'current' ? 'secondary' : 
                          'outline'
                        }>
                          {position.periodType || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewPrices(position)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex items-center justify-center p-12 text-muted-foreground">
                <p>No MTM positions available. Add trades with pricing formulas to see data here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedLeg && (
        <PriceDetails
          isOpen={!!selectedLeg}
          onClose={() => setSelectedLeg(null)}
          tradeLegId={selectedLeg.legId}
          formula={selectedLeg.formula}
          mtmFormula={selectedLeg.mtmFormula}
          startDate={selectedLeg.startDate}
          endDate={selectedLeg.endDate}
          quantity={selectedLeg.quantity}
          buySell={selectedLeg.buySell}
        />
      )}
    </Layout>
  );
};

export default MTMPage;
````

## File: src/pages/risk/PNLPage.tsx
````typescript
import React from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const PNLPage = () => {
  return (
    <Layout>
      <Helmet>
        <title>Profit and Loss</title>
      </Helmet>
      
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Profit and Loss</h1>
        <p className="text-muted-foreground">
          View realized and unrealized P&L across your trading portfolio
        </p>

        <Separator />
        
        <Card>
          <CardHeader>
            <CardTitle>P&L Analysis</CardTitle>
            <CardDescription>
              Detailed profit and loss analysis by trade and instrument
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-12 text-muted-foreground">
              <p>P&L reporting dashboard coming soon...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PNLPage;
````

## File: src/pages/risk/PricesPage.tsx
````typescript
import React from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import PriceUploader from '@/components/pricing/PriceUploader';
import { Toaster } from '@/components/ui/toaster';

const PricesPage = () => {
  return (
    <Layout>
      <Helmet>
        <title>Pricing Management</title>
      </Helmet>
      
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Pricing Management</h1>
        <p className="text-muted-foreground">
          Manage price uploads
        </p>

        <Separator />

        <Tabs defaultValue="upload" className="space-y-4">
          <TabsList>
            <TabsTrigger value="upload">Price Upload</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Price Data Upload</CardTitle>
                <CardDescription>
                  Upload historical or forward price data from Excel files
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PriceUploader />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <Toaster />
    </Layout>
  );
};

export default PricesPage;
````

## File: src/pages/trades/PaperTradeDeletePage.tsx
````typescript
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Trash2, AlertTriangle } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { usePaperTrades } from '@/hooks/usePaperTrades';
import { deletePaperTrade, deletePaperTradeLeg } from '@/utils/paperTradeDeleteUtils';

const PaperTradeDeletePage = () => {
  const { id: tradeId, legId } = useParams();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { paperTrades, isLoading, refetchPaperTrades } = usePaperTrades();
  
  const trade = paperTrades.find(t => t.id === tradeId);
  const leg = legId ? trade?.legs.find(l => l.id === legId) : null;
  
  const isLegDeletion = Boolean(legId);
  const isMultiLeg = trade?.legs.length && trade.legs.length > 1;
  
  useEffect(() => {
    if (!isLoading && !trade) {
      setError('Trade not found');
    }
  }, [trade, isLoading]);
  
  const handleDelete = async () => {
    if (!tradeId) return;
    
    setIsDeleting(true);
    setError(null);
    
    try {
      if (isLegDeletion && legId) {
        console.log(`[PAPER_DELETE] Deleting paper trade leg: ${legId} from trade: ${tradeId}`);
        await deletePaperTradeLeg(legId, tradeId);
      } else {
        console.log(`[PAPER_DELETE] Deleting entire paper trade: ${tradeId}`);
        await deletePaperTrade(tradeId);
      }
      
      setIsSuccess(true);
      refetchPaperTrades();
      
      // Navigate back after successful deletion - now redirecting to paper tab
      setTimeout(() => {
        navigate('/trades?tab=paper');
      }, 2000);
      
    } catch (err) {
      console.error('Error during deletion:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsDeleting(false);
    }
  };
  
  const renderDeleteContent = () => {
    if (isSuccess) {
      return (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-green-600">Success</AlertTitle>
          <AlertDescription>
            {isLegDeletion
              ? `Paper trade leg ${leg?.legReference} has been deleted.`
              : `Paper trade ${trade?.tradeReference} has been deleted.`
            }
            <div className="mt-2">
              Redirecting to trades list...
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }

    return (
      <>
        <Alert className="mb-6 bg-amber-50 border-amber-200">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <AlertTitle className="text-amber-600">Warning</AlertTitle>
          <AlertDescription>
            {isLegDeletion
              ? `You are about to delete a paper trade leg. This action cannot be undone.${!isMultiLeg ? ' Since this is the only leg, the entire trade will be deleted.' : ''}`
              : 'You are about to delete an entire paper trade. This action cannot be undone.'
            }
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader className="bg-muted/40">
            <CardTitle>
              {isLegDeletion
                ? `Delete Paper Trade Leg: ${leg?.legReference}`
                : `Delete Paper Trade: ${trade?.tradeReference}`
              }
            </CardTitle>
            <CardDescription>
              {isLegDeletion
                ? 'You are about to delete a specific leg of this paper trade.'
                : 'This will permanently delete the paper trade and all its legs.'
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Trade Reference</h3>
                <p className="text-lg font-medium">{trade?.tradeReference}</p>
              </div>

              {isLegDeletion && leg ? (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Leg Reference</h3>
                    <p className="text-lg font-medium">{leg.legReference}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Product & Period</h3>
                    <p className="text-lg font-medium">{leg.product} - {leg.period}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Quantity & Price</h3>
                    <p className="text-lg font-medium">{leg.quantity} at {leg.price}</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Broker</h3>
                    <p className="text-lg font-medium">{trade?.broker}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Number of Legs</h3>
                    <p className="text-lg font-medium">{trade?.legs.length || 0}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex justify-between border-t bg-muted/30 px-6 py-4">
            <Button variant="outline" disabled={isDeleting} asChild>
              <Link to="/trades">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Cancel
              </Link>
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>Deleting...</>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isLegDeletion ? 'Delete Leg' : 'Delete Trade'}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </>
    );
  };

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            {isLegDeletion ? 'Delete Paper Trade Leg' : 'Delete Paper Trade'}
          </h1>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="py-8">
              <div className="flex justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            </CardContent>
          </Card>
        ) : (
          renderDeleteContent()
        )}
      </div>
    </Layout>
  );
};

export default PaperTradeDeletePage;
````

## File: src/pages/trades/PaperTradeEditPage.tsx
````typescript
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import PaperTradeForm from '@/components/trades/PaperTradeForm';
import { usePaperTrades } from '@/hooks/usePaperTrades';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const PaperTradeEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { paperTrades, isLoading, refetchPaperTrades } = usePaperTrades();
  const [error, setError] = useState<string | null>(null);
  
  // Find the trade from fetched trades
  const trade = paperTrades.find(t => t.id === id);
  
  console.log('[PAPER_EDIT] Current trade data:', trade);
  
  // Make sure all trade legs have properly configured rightSide data
  const processedTrade = React.useMemo(() => {
    if (!trade) return null;
    
    return {
      ...trade,
      legs: trade.legs.map(leg => {
        // Ensure that DIFF and SPREAD have proper rightSide quantities
        if (leg.relationshipType !== 'FP' && leg.rightSide) {
          return {
            ...leg,
            rightSide: {
              ...leg.rightSide,
              quantity: -leg.quantity // Ensure rightSide quantity is negative of left side
            }
          };
        }
        return leg;
      })
    };
  }, [trade]);
  
  // Update mutation
  const { mutate: updatePaperTrade, isPending: isUpdating } = useMutation({
    mutationFn: async (updatedTrade: any) => {
      if (!id) throw new Error('Trade ID is missing');
      
      console.log('[PAPER_EDIT] Updating paper trade:', id, updatedTrade);
      
      // 1. Update the parent trade record
      const { error: tradeUpdateError } = await supabase
        .from('paper_trades')
        .update({
          broker: updatedTrade.broker
        })
        .eq('id', id);
        
      if (tradeUpdateError) {
        throw new Error(`Error updating paper trade: ${tradeUpdateError.message}`);
      }
      
      // 2. Get current legs for comparison
      const { data: currentLegs, error: legsFetchError } = await supabase
        .from('paper_trade_legs')
        .select('*')
        .eq('paper_trade_id', id);
        
      if (legsFetchError) {
        throw new Error(`Error fetching current paper trade legs: ${legsFetchError.message}`);
      }
      
      // 3. Process legs: update existing, add new ones
      // For simplicity, we'll delete and re-create all legs
      const { error: deleteLegsError } = await supabase
        .from('paper_trade_legs')
        .delete()
        .eq('paper_trade_id', id);
        
      if (deleteLegsError) {
        throw new Error(`Error deleting existing paper trade legs: ${deleteLegsError.message}`);
      }
      
      // 4. Insert all legs from the form
      for (const leg of updatedTrade.legs) {
        // Make sure rightSide data is properly formatted for the database
        let mtmFormula = leg.mtmFormula || {};
        if (leg.rightSide && leg.relationshipType !== 'FP') {
          mtmFormula.rightSide = leg.rightSide;
        }
        
        // Make sure exposures are properly updated
        let exposures = leg.exposures || { physical: {}, pricing: {}, paper: {} };
        
        // Always ensure physical is an empty object for paper trades
        exposures.physical = {};
        
        if (leg.relationshipType === 'FP' && leg.product) {
          exposures.paper = { [leg.product]: leg.quantity };
          exposures.pricing = { [leg.product]: leg.quantity };
        } else if (leg.rightSide && leg.product) {
          exposures.paper = { 
            [leg.product]: leg.quantity,
            [leg.rightSide.product]: leg.rightSide.quantity 
          };
          exposures.pricing = { 
            [leg.product]: leg.quantity,
            [leg.rightSide.product]: leg.rightSide.quantity 
          };
        }
        
        // Create each leg
        const legData = {
          paper_trade_id: id,
          leg_reference: leg.legReference,
          buy_sell: leg.buySell,
          product: leg.product,
          quantity: leg.quantity,
          period: leg.period,
          price: leg.price,
          broker: leg.broker || updatedTrade.broker,
          instrument: leg.instrument,
          trading_period: leg.period,
          formula: leg.formula,
          mtm_formula: mtmFormula,
          exposures: exposures
        };
        
        const { error: createLegError } = await supabase
          .from('paper_trade_legs')
          .insert(legData);
          
        if (createLegError) {
          throw new Error(`Error creating paper trade leg: ${createLegError.message}`);
        }
      }
      
      return { ...updatedTrade, id };
    },
    onSuccess: () => {
      toast.success('Paper trade updated successfully');
      refetchPaperTrades();
      navigate('/trades');
    },
    onError: (error: Error) => {
      setError(error.message);
      toast.error('Failed to update paper trade', {
        description: error.message
      });
    }
  });
  
  // Handler for form submission
  const handleSubmit = (formData: any) => {
    updatePaperTrade(formData);
  };
  
  // Handle when trade is not found
  useEffect(() => {
    if (!isLoading && !trade && id) {
      setError(`Paper trade with ID ${id} not found`);
    }
  }, [trade, isLoading, id]);
  
  if (isLoading) {
    return (
      <Layout>
        <Card>
          <CardContent className="py-8">
            <div className="flex justify-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          </CardContent>
        </Card>
      </Layout>
    );
  }
  
  if (error && !trade) {
    return (
      <Layout>
        <div className="space-y-4">
          <div className="flex items-center">
            <Button variant="outline" size="sm" className="mr-4" asChild>
              <Link to="/trades">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Trades
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Edit Paper Trade</h1>
          </div>
          
          <Alert variant="destructive">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center">
          <Button variant="outline" size="sm" className="mr-4" asChild>
            <Link to="/trades">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Trades
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Edit Paper Trade</h1>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {processedTrade && (
          <Card>
            <CardContent className="pt-6">
              <PaperTradeForm
                tradeReference={processedTrade.tradeReference}
                onSubmit={handleSubmit}
                onCancel={() => navigate('/trades')}
                isEditMode={true}
                initialData={processedTrade}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default PaperTradeEditPage;
````

## File: src/pages/trades/PaperTradeList.tsx
````typescript
import React from 'react';
import { Link } from 'react-router-dom';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { PaperTrade } from '@/types/paper';
import { formatProductDisplay, calculateDisplayPrice } from '@/utils/productMapping';
import TableLoadingState from '@/components/trades/TableLoadingState';
import TableErrorState from '@/components/trades/TableErrorState';
import PaperTradeRowActions from '@/components/trades/paper/PaperTradeRowActions';

interface PaperTradeListProps {
  paperTrades: PaperTrade[];
  isLoading: boolean;
  error: Error | null;
  refetchPaperTrades: () => void;
}

const PaperTradeList: React.FC<PaperTradeListProps> = ({
  paperTrades,
  isLoading,
  error,
  refetchPaperTrades
}) => {
  if (isLoading) {
    return <TableLoadingState />;
  }

  if (error) {
    return <TableErrorState error={error} onRetry={refetchPaperTrades} />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Reference</TableHead>
          <TableHead>Broker</TableHead>
          <TableHead>Products</TableHead>
          <TableHead>Period</TableHead>
          <TableHead className="text-right">Quantity</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead className="text-center">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {paperTrades && paperTrades.length > 0 ? (
          paperTrades.flatMap((trade) => {
            return trade.legs.map((leg, legIndex) => {
              let productDisplay = formatProductDisplay(
                leg.product,
                leg.relationshipType,
                leg.rightSide?.product
              );
              
              const displayReference = `${trade.tradeReference}${legIndex > 0 ? `-${String.fromCharCode(97 + legIndex)}` : '-a'}`;
              const isMultiLeg = trade.legs.length > 1;
              
              // Calculate the display price based on relationship type
              const displayPrice = calculateDisplayPrice(
                leg.relationshipType,
                leg.price,
                leg.rightSide?.price
              );
              
              return (
                <TableRow key={`${trade.id}-${leg.id}`}>
                  <TableCell>
                    <Link to={`/trades/paper/edit/${trade.id}`} className="text-primary hover:underline">
                      {displayReference}
                    </Link>
                  </TableCell>
                  <TableCell>{leg.broker || trade.broker}</TableCell>
                  <TableCell>{productDisplay}</TableCell>
                  <TableCell>{leg.period}</TableCell>
                  <TableCell className="text-right">{leg.quantity}</TableCell>
                  <TableCell className="text-right">{displayPrice}</TableCell>
                  <TableCell className="text-center">
                    <PaperTradeRowActions
                      tradeId={trade.id}
                      legId={leg.id}
                      isMultiLeg={isMultiLeg}
                      legReference={leg.legReference}
                      tradeReference={trade.tradeReference}
                    />
                  </TableCell>
                </TableRow>
              );
            });
          })
        ) : (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
              No paper trades found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default PaperTradeList;
````

## File: src/pages/trades/PhysicalTradeTable.tsx
````typescript
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PhysicalTrade } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import TradeTableRow from '@/components/trades/physical/TradeTableRow';
import TableLoadingState from '@/components/trades/TableLoadingState';
import TableErrorState from '@/components/trades/TableErrorState';

interface PhysicalTradeTableProps {
  trades: PhysicalTrade[];
  loading: boolean;
  error: Error | null;
  refetchTrades: () => void;
}

const PhysicalTradeTable = ({ trades, loading, error, refetchTrades }: PhysicalTradeTableProps) => {
  const navigate = useNavigate();

  const handleEditTrade = (tradeId: string) => {
    navigate(`/trades/edit/${tradeId}`);
  };

  if (loading) {
    return <TableLoadingState />;
  }
  
  if (error) {
    return (
      <TableErrorState
        error={error}
        onRetry={refetchTrades}
      />
    );
  }
  
  if (trades.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground mb-4">No trades found</p>
        <Link to="/trades/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Trade
          </Button>
        </Link>
      </div>
    );
  }
  
  const rows: JSX.Element[] = [];
  
  trades.forEach(trade => {
    const sortedLegs = [...trade.legs].sort((a, b) => {
      if (a.legReference === trade.tradeReference) return -1;
      if (b.legReference === trade.tradeReference) return 1;
      return a.legReference.localeCompare(b.legReference);
    });
    
    sortedLegs.forEach((leg, legIndex) => {
      rows.push(
        <TradeTableRow
          key={leg.id}
          trade={trade}
          leg={leg}
          legIndex={legIndex}
        />
      );
    });
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reference</TableHead>
            <TableHead>Buy/Sell</TableHead>
            <TableHead>Incoterm</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Counterparty</TableHead>
            <TableHead>Formula</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows}
        </TableBody>
      </Table>
    </div>
  );
};

export default PhysicalTradeTable;
````

## File: src/pages/trades/TradeDeletePage.tsx
````typescript
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { deletePhysicalTrade, deletePhysicalTradeLeg } from '@/utils/physicalTradeDeleteUtils';

const TradeDeletePage = () => {
  const navigate = useNavigate();
  const { id: tradeId, legId } = useParams<{ id: string, legId?: string }>();
  const [isDeleting, setIsDeleting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();
  
  // Handle the deletion process
  const handleDelete = async () => {
    if (!tradeId) return;
    
    try {
      setIsDeleting(true);
      setError(null);
      
      // Track progress for UI feedback
      const trackProgress = (progressValue: number) => {
        setProgress(progressValue);
      };
      
      let success = false;
      if (legId) {
        // Delete a specific leg
        success = await deletePhysicalTradeLeg(legId, tradeId, trackProgress);
        if (success) {
          toast.success(`Trade leg deleted successfully`);
        }
      } else {
        // Delete the entire trade
        success = await deletePhysicalTrade(tradeId, trackProgress);
        if (success) {
          toast.success(`Trade deleted successfully`);
        }
      }
      
      // Invalidate queries to refresh the trades list
      if (success) {
        await queryClient.invalidateQueries({ queryKey: ['trades'] });
        // Navigate back to trades page
        navigate('/trades');
      }
    } catch (err) {
      console.error('Error during deletion:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      toast.error("Deletion failed", {
        description: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Navigate back without deleting
  const handleCancel = () => {
    navigate('/trades');
  };
  
  return (
    <Layout>
      <Helmet>
        <title>Confirm Deletion | Trading Platform</title>
      </Helmet>
      
      <div className="container mx-auto py-6 max-w-3xl">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={handleCancel} 
            className="flex items-center"
            disabled={isDeleting}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Trades
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Confirm Deletion</CardTitle>
            <CardDescription>
              {legId ? 
                "You are about to delete a trade leg. This action cannot be undone." : 
                "You are about to delete a trade. This action cannot be undone."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            )}
            
            {isDeleting && (
              <div className="my-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                  <div 
                    className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-muted-foreground">Deletion in progress...</p>
              </div>
            )}
            
            <p className="text-base">
              Are you sure you want to {legId ? "delete this trade leg" : "delete this trade"}?
            </p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Confirm Delete
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default TradeDeletePage;
````

## File: src/pages/trades/TradeEditPage.tsx
````typescript
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import Layout from '@/components/Layout';
import PhysicalTradeForm from '@/components/trades/PhysicalTradeForm';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PhysicalTrade, BuySell, IncoTerm, Unit, PaymentTerm, CreditStatus, Product } from '@/types';
import { validateAndParsePricingFormula } from '@/utils/formulaUtils';
import { useQueryClient } from '@tanstack/react-query';
import { formatDateForStorage } from '@/utils/dateUtils';

const TradeEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{id: string}>();
  const [isLoading, setIsLoading] = useState(true);
  const [tradeData, setTradeData] = useState<PhysicalTrade | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchTradeData = async () => {
      if (!id) {
        navigate('/trades');
        return;
      }

      try {
        // Fetch parent trade data
        const { data: parentTrade, error: parentError } = await supabase
          .from('parent_trades')
          .select('*')
          .eq('id', id)
          .single();

        if (parentError) {
          throw new Error(`Error fetching parent trade: ${parentError.message}`);
        }

        // Only handle physical trades
        if (parentTrade.trade_type !== 'physical') {
          throw new Error("Only physical trades are supported");
        }

        // Fetch trade legs
        const { data: tradeLegs, error: legsError } = await supabase
          .from('trade_legs')
          .select('*')
          .eq('parent_trade_id', id)
          .order('created_at', { ascending: true });

        if (legsError) {
          throw new Error(`Error fetching trade legs: ${legsError.message}`);
        }

        // Map the database data to our application trade models
        if (parentTrade.trade_type === 'physical' && tradeLegs.length > 0) {
          const physicalTrade: PhysicalTrade = {
            id: parentTrade.id,
            tradeReference: parentTrade.trade_reference,
            tradeType: 'physical', 
            createdAt: new Date(parentTrade.created_at),
            updatedAt: new Date(parentTrade.updated_at),
            physicalType: (parentTrade.physical_type || 'spot') as 'spot' | 'term',
            counterparty: parentTrade.counterparty,
            buySell: tradeLegs[0].buy_sell as BuySell,
            product: tradeLegs[0].product as Product,
            sustainability: tradeLegs[0].sustainability || '',
            incoTerm: (tradeLegs[0].inco_term || 'FOB') as IncoTerm,
            quantity: tradeLegs[0].quantity,
            tolerance: tradeLegs[0].tolerance || 0,
            loadingPeriodStart: tradeLegs[0].loading_period_start ? new Date(tradeLegs[0].loading_period_start) : new Date(),
            loadingPeriodEnd: tradeLegs[0].loading_period_end ? new Date(tradeLegs[0].loading_period_end) : new Date(),
            pricingPeriodStart: tradeLegs[0].pricing_period_start ? new Date(tradeLegs[0].pricing_period_start) : new Date(),
            pricingPeriodEnd: tradeLegs[0].pricing_period_end ? new Date(tradeLegs[0].pricing_period_end) : new Date(),
            unit: (tradeLegs[0].unit || 'MT') as Unit,
            paymentTerm: (tradeLegs[0].payment_term || '30 days') as PaymentTerm,
            creditStatus: (tradeLegs[0].credit_status || 'pending') as CreditStatus,
            formula: validateAndParsePricingFormula(tradeLegs[0].pricing_formula),
            mtmFormula: validateAndParsePricingFormula(tradeLegs[0].mtm_formula),
            legs: tradeLegs.map(leg => ({
              id: leg.id,
              parentTradeId: leg.parent_trade_id,
              legReference: leg.leg_reference,
              buySell: leg.buy_sell as BuySell,
              product: leg.product as Product,
              sustainability: leg.sustainability || '',
              incoTerm: (leg.inco_term || 'FOB') as IncoTerm,
              quantity: leg.quantity,
              tolerance: leg.tolerance || 0,
              loadingPeriodStart: leg.loading_period_start ? new Date(leg.loading_period_start) : new Date(),
              loadingPeriodEnd: leg.loading_period_end ? new Date(leg.loading_period_end) : new Date(),
              pricingPeriodStart: leg.pricing_period_start ? new Date(leg.pricing_period_start) : new Date(),
              pricingPeriodEnd: leg.pricing_period_end ? new Date(leg.pricing_period_end) : new Date(),
              unit: (leg.unit || 'MT') as Unit,
              paymentTerm: (leg.payment_term || '30 days') as PaymentTerm,
              creditStatus: (leg.credit_status || 'pending') as CreditStatus,
              formula: validateAndParsePricingFormula(leg.pricing_formula),
              mtmFormula: validateAndParsePricingFormula(leg.mtm_formula)
            }))
          };
          setTradeData(physicalTrade);
        } else {
          throw new Error("Invalid trade data");
        }

      } catch (error: any) {
        console.error('Error fetching trade:', error);
        toast.error("Failed to load trade", {
          description: error.message || "Could not load trade details"
        });
        navigate('/trades');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTradeData();
  }, [id, navigate]);

  const handleSubmit = async (updatedTradeData: any) => {
    try {
      if (!id) return;

      // Update the parent trade
      const parentTradeUpdate = {
        trade_reference: updatedTradeData.tradeReference,
        physical_type: updatedTradeData.physicalType,
        counterparty: updatedTradeData.counterparty,
        updated_at: new Date().toISOString()
      };
      
      const { error: parentUpdateError } = await supabase
        .from('parent_trades')
        .update(parentTradeUpdate)
        .eq('id', id);
        
      if (parentUpdateError) {
        throw new Error(`Error updating parent trade: ${parentUpdateError.message}`);
      }

      // For physical trades, we need to update all legs
      for (const leg of updatedTradeData.legs) {
        const legData = {
          parent_trade_id: id,
          buy_sell: leg.buySell,
          product: leg.product,
          sustainability: leg.sustainability,
          inco_term: leg.incoTerm,
          quantity: leg.quantity,
          tolerance: leg.tolerance,
          loading_period_start: formatDateForStorage(leg.loadingPeriodStart),
          loading_period_end: formatDateForStorage(leg.loadingPeriodEnd),
          pricing_period_start: formatDateForStorage(leg.pricingPeriodStart),
          pricing_period_end: formatDateForStorage(leg.pricingPeriodEnd),
          unit: leg.unit,
          payment_term: leg.paymentTerm,
          credit_status: leg.creditStatus,
          pricing_formula: leg.formula,
          mtm_formula: leg.mtmFormula,
          updated_at: new Date().toISOString()
        };

        // Update the existing leg
        const { error: legUpdateError } = await supabase
          .from('trade_legs')
          .update(legData)
          .eq('id', leg.id);
          
        if (legUpdateError) {
          throw new Error(`Error updating trade leg: ${legUpdateError.message}`);
        }
      }

      // Force invalidate the trades query cache to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['trades'] });

      toast.success("Trade updated", {
        description: `Trade ${updatedTradeData.tradeReference} has been updated successfully`
      });

      // Navigate back to trades page with state to indicate successful update
      navigate('/trades', { state: { updated: true, tradeReference: updatedTradeData.tradeReference } });
    } catch (error: any) {
      console.error('Error updating trade:', error);
      toast.error("Failed to update trade", {
        description: error.message || "An error occurred while updating the trade"
      });
    }
  };

  const handleCancel = () => {
    navigate('/trades');
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading trade data...</p>
        </div>
      </Layout>
    );
  }

  if (!tradeData) {
    return (
      <Layout>
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight mb-4">Trade Not Found</h2>
          <p className="text-muted-foreground mb-6">The trade you're looking for could not be found.</p>
          <Button onClick={() => navigate('/trades')}>Back to Trades</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Trade</h1>
          <p className="text-muted-foreground">
            Edit trade {tradeData?.tradeReference}
          </p>
        </div>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Trade Details</CardTitle>
            <CardDescription>
              Update trade information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PhysicalTradeForm 
              tradeReference={tradeData?.tradeReference || ''}
              onSubmit={handleSubmit} 
              onCancel={handleCancel} 
              isEditMode={true}
              initialData={tradeData}
            />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default TradeEditPage;
````

## File: src/pages/trades/TradeEntryPage.tsx
````typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/Layout';
import PhysicalTradeForm from '@/components/trades/PhysicalTradeForm';
import PaperTradeForm from '@/components/trades/PaperTradeForm';
import { generateTradeReference } from '@/utils/tradeUtils';
import { useQueryClient } from '@tanstack/react-query';
import { TradeType } from '@/types';
import { usePaperTrades } from '@/hooks/usePaperTrades';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { formatDateForStorage } from '@/utils/dateUtils';

const TradeEntryPage = () => {
  const navigate = useNavigate();
  const tradeReference = generateTradeReference();
  const queryClient = useQueryClient();
  const [tradeType, setTradeType] = useState<TradeType>('physical');
  const { createPaperTrade } = usePaperTrades();
  
  const handlePhysicalSubmit = async (tradeData: any) => {
    try {
      // Extract parent trade data
      const parentTrade = {
        trade_reference: tradeData.tradeReference,
        trade_type: tradeData.tradeType,
        physical_type: tradeData.physicalType,
        counterparty: tradeData.counterparty,
      };
      
      // Insert parent trade
      const { data: parentTradeData, error: parentTradeError } = await supabase
        .from('parent_trades')
        .insert(parentTrade)
        .select('id')
        .single();
        
      if (parentTradeError) {
        throw new Error(`Error inserting parent trade: ${parentTradeError.message}`);
      }
      
      // Get the parent trade ID
      const parentTradeId = parentTradeData.id;
      
      // For physical trades, insert all legs
      const legs = tradeData.legs.map((leg: any) => ({
        leg_reference: leg.legReference,
        parent_trade_id: parentTradeId,
        buy_sell: leg.buySell,
        product: leg.product,
        sustainability: leg.sustainability,
        inco_term: leg.incoTerm,
        quantity: leg.quantity,
        tolerance: leg.tolerance,
        loading_period_start: formatDateForStorage(leg.loadingPeriodStart),
        loading_period_end: formatDateForStorage(leg.loadingPeriodEnd),
        pricing_period_start: formatDateForStorage(leg.pricingPeriodStart),
        pricing_period_end: formatDateForStorage(leg.pricingPeriodEnd),
        unit: leg.unit,
        payment_term: leg.paymentTerm,
        credit_status: leg.creditStatus,
        pricing_formula: leg.formula,
        mtm_formula: leg.mtmFormula,
      }));
      
      const { error: legsError } = await supabase
        .from('trade_legs')
        .insert(legs);
        
      if (legsError) {
        throw new Error(`Error inserting trade legs: ${legsError.message}`);
      }
      
      // Force invalidate the trades query cache
      queryClient.invalidateQueries({ queryKey: ['trades'] });

      toast.success('Trade created successfully', {
        description: `Trade reference: ${tradeData.tradeReference}`
      });
      
      navigate('/trades', { state: { created: true, tradeReference: tradeData.tradeReference } });
    } catch (error: any) {
      toast.error('Failed to create trade', {
        description: error.message
      });
      console.error('Error creating trade:', error);
    }
  };
  
  const handlePaperSubmit = async (tradeData: any) => {
    try {
      // Use the createPaperTrade from usePaperTrades hook
      createPaperTrade(tradeData, {
        onSuccess: () => {
          navigate('/trades', { state: { created: true, tradeReference: tradeData.tradeReference } });
        }
      });
    } catch (error: any) {
      toast.error('Failed to create paper trade', {
        description: error.message
      });
      console.error('Error creating paper trade:', error);
    }
  };

  const handleCancel = () => {
    navigate('/trades');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Trade</h1>
          <p className="text-muted-foreground">
            Create a new trade by filling out the form below
          </p>
        </div>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Trade Details</CardTitle>
            <CardDescription>
              Select trade type and enter details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue="physical"
              value={tradeType}
              onValueChange={(value) => setTradeType(value as TradeType)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="physical">Physical Trade</TabsTrigger>
                <TabsTrigger value="paper">Paper Trade</TabsTrigger>
              </TabsList>
              
              <TabsContent value="physical">
                <PhysicalTradeForm 
                  tradeReference={tradeReference} 
                  onSubmit={handlePhysicalSubmit} 
                  onCancel={handleCancel} 
                />
              </TabsContent>
              
              <TabsContent value="paper">
                <PaperTradeForm 
                  tradeReference={tradeReference} 
                  onSubmit={handlePaperSubmit} 
                  onCancel={handleCancel} 
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default TradeEntryPage;
````

## File: src/pages/trades/TradesPage.tsx
````typescript
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Filter, AlertCircle } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import our custom components
import PhysicalTradeTable from './PhysicalTradeTable';
import PaperTradeList from './PaperTradeList';

// Import isolated hooks
import { useTrades } from '@/hooks/useTrades';
import { usePaperTrades } from '@/hooks/usePaperTrades';
import { PhysicalTrade } from '@/types';

const TradesPage = () => {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<string>(tabParam === 'paper' ? 'paper' : 'physical');
  const [pageError, setPageError] = useState<string | null>(null);
  
  // Load physical trades
  const { 
    trades, 
    loading: physicalLoading, 
    error: physicalError, 
    refetchTrades
  } = useTrades();
  
  // Load paper trades
  const { 
    paperTrades, 
    isLoading: paperLoading, 
    error: paperError, 
    refetchPaperTrades
  } = usePaperTrades();
  
  const physicalTrades = trades.filter(trade => trade.tradeType === 'physical') as PhysicalTrade[];

  // Error handling across both trade types
  useEffect(() => {
    const combinedError = physicalError || paperError;
    if (combinedError) {
      setPageError(combinedError instanceof Error ? combinedError.message : 'Unknown error occurred');
    } else {
      setPageError(null);
    }
  }, [physicalError, paperError]);

  // Update active tab based on URL parameter
  useEffect(() => {
    if (tabParam === 'paper') {
      setActiveTab('paper');
    } else if (tabParam === 'physical') {
      setActiveTab('physical');
    }
  }, [tabParam]);

  const showErrorAlert = () => {
    if (!pageError) return null;
    
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {pageError}
          <div className="mt-2">
            <Button variant="outline" size="sm" onClick={() => {
              if (activeTab === 'physical') {
                refetchTrades();
              } else {
                refetchPaperTrades();
              }
            }}>
              Try Again
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  const renderPhysicalTradesTab = () => {
    return (
      <div className="bg-card rounded-md border shadow-sm">
        <div className="p-4 flex justify-between items-center border-b">
          <h2 className="font-semibold">Physical Trades</h2>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" /> Filter
          </Button>
        </div>
        
        <div className="pt-2">
          <PhysicalTradeTable 
            trades={physicalTrades}
            loading={physicalLoading}
            error={physicalError}
            refetchTrades={refetchTrades}
          />
        </div>
      </div>
    );
  };

  const renderPaperTradesTab = () => {
    return (
      <div className="bg-card rounded-md border shadow-sm">
        <div className="p-4 flex justify-between items-center border-b">
          <h2 className="font-semibold">Paper Trades</h2>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" /> Filter
          </Button>
        </div>
        
        <div className="pt-2">
          <PaperTradeList
            paperTrades={paperTrades}
            isLoading={paperLoading}
            error={paperError}
            refetchPaperTrades={refetchPaperTrades}
          />
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Trades</h1>
          <div className="flex items-center gap-2">
            <Link to="/trades/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New Trade
              </Button>
            </Link>
          </div>
        </div>

        {pageError && showErrorAlert()}

        {/* Tabs for Physical and Paper Trades */}
        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="physical">Physical Trades</TabsTrigger>
            <TabsTrigger value="paper">Paper Trades</TabsTrigger>
          </TabsList>
          
          <TabsContent value="physical">
            {renderPhysicalTradesTab()}
          </TabsContent>
          
          <TabsContent value="paper">
            {renderPaperTradesTab()}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default TradesPage;
````

## File: src/pages/Index.tsx
````typescript
import React from 'react';
import { FileText, TrendingUp, Package, Clock, AlertTriangle } from 'lucide-react';
import Layout from '@/components/Layout';
import DashboardCard from '@/components/DashboardCard';

const Index = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome to your Biodiesel Trading CTRM system.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            title="Trades"
            description="Manage physical and paper trades"
            icon={FileText}
            count={0}
            linkTo="/trades"
            linkText="View all trades"
          />
          <DashboardCard
            title="Open Operations"
            description="Schedule and manage movements"
            icon={Package}
            count={0}
            linkTo="/operations"
            linkText="View operations"
          />
          <DashboardCard
            title="Exposure"
            description="View current market exposure"
            icon={TrendingUp}
            count={0}
            linkTo="/exposure"
            linkText="View exposure report"
          />
          <DashboardCard
            title="Audit Log"
            description="Track all system changes"
            icon={Clock}
            count={0}
            linkTo="/audit"
            linkText="View audit logs"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="col-span-1">
            <h2 className="text-lg font-medium mb-4">Recent Trades</h2>
            <div className="border rounded-md p-6 flex flex-col items-center justify-center text-center h-[200px]">
              <p className="text-muted-foreground mb-2">No recent trades found</p>
              <a href="/trades/new" className="text-primary hover:underline text-sm">
                Create your first trade
              </a>
            </div>
          </div>
          <div className="col-span-1">
            <h2 className="text-lg font-medium mb-4">Alerts</h2>
            <div className="border rounded-md p-6 flex flex-col items-center justify-center text-center h-[200px]">
              <AlertTriangle className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No alerts to display</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
````

## File: src/pages/NotFound.tsx
````typescript
import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-2">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
````

## File: src/routes/PricingRoutes.tsx
````typescript
import React from 'react';
import { Route } from 'react-router-dom';
import PricingAdminPage from '@/pages/pricing/PricingAdminPage';

const PricingRoutes = () => {
  return (
    <Route path="/pricing">
      <Route path="admin" element={<PricingAdminPage />} />
    </Route>
  );
};

export default PricingRoutes;
````

## File: src/types/common.ts
````typescript
export type Instrument = string;
export type OperatorType = "+" | "-" | "*" | "/" | "%" | "()";

export interface DbParentTrade {
  id: string;
  trade_reference: string;
  trade_type: string;
  physical_type: string | null;
  counterparty: string;
  created_at: string;
  updated_at: string;
}

export interface DbTradeLeg {
  id: string;
  parent_trade_id: string;
  leg_reference: string;
  buy_sell: string;
  product: string;
  sustainability: string | null;
  inco_term: string | null;
  quantity: number;
  tolerance: number | null;
  loading_period_start: string | null;
  loading_period_end: string | null;
  pricing_period_start: string | null;
  pricing_period_end: string | null;
  unit: string | null;
  payment_term: string | null;
  credit_status: string | null;
  pricing_formula: any | null;
  created_at: string;
  updated_at: string;
  broker?: string;
  instrument?: string;
  price?: number;
  mtm_formula?: any | null;
}

// Base trade interface (parent trade)
export interface ParentTrade {
  id: string;
  tradeReference: string;
  tradeType: import('./index').TradeType;
  counterparty: string;
  createdAt: Date;
  updatedAt: Date;
}

// For backward compatibility
export interface Trade {
  id: string;
  tradeReference: string;
  tradeType: import('./index').TradeType;
  createdAt: Date;
  updatedAt: Date;
}

export interface Movement {
  id: string;
  tradeId: string;
  legId?: string;
  scheduledQuantity: number;
  nominatedDate?: Date;
  vesselName?: string;
  loadport?: string;
  inspector?: string;
  blDate?: Date;
  actualQuantity?: number;
  status: "scheduled" | "in-progress" | "completed";
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  entityType: "trade" | "movement";
  entityId: string;
  field: string;
  oldValue: string;
  newValue: string;
  userId: string;
}

export interface ExposureReportItem {
  month: string;
  grade: string;
  physical: number;
  pricing: number;
  paper: number;
  netExposure: number;
}
````

## File: src/types/index.ts
````typescript
// Re-export all types
export * from './common';
export * from './trade';
export * from './pricing';
export * from './physical';
export * from './paper';  // Export paper types

// Add TradeType here to resolve circular dependency
export type TradeType = "physical" | "paper";
````

## File: src/types/paper.ts
````typescript
import { BuySell, Product } from './trade';
import { PricingFormula } from './pricing';
import { ParentTrade, Trade } from './common';

// Paper trade parent
export interface PaperParentTrade extends ParentTrade {
  tradeType: "paper";
  broker: string;
}

// Paper trade right side
export interface PaperTradeRightSide {
  product: Product;
  quantity: number;
  period?: string;
  price?: number;
}

// Paper trade leg
export interface PaperTradeLeg {
  id: string;
  paperTradeId: string;
  legReference: string;
  buySell: BuySell;
  product: Product;
  quantity: number;
  period: string;
  price: number;
  broker: string;
  instrument: string;
  relationshipType: 'FP' | 'DIFF' | 'SPREAD';
  rightSide?: PaperTradeRightSide;
  // Using Record<string, any> for formula and mtmFormula to be compatible with JSON
  formula?: Record<string, any>;
  mtmFormula?: Record<string, any>;
  // Typed exposures field for better type safety
  exposures?: {
    physical?: Record<string, number>;
    pricing?: Record<string, number>;
    paper?: Record<string, number>;
  };
}

// Complete paper trade with parent and legs
export interface PaperTrade extends Trade {
  tradeType: "paper";
  broker: string;
  legs: PaperTradeLeg[];
}
````

## File: src/types/physical.ts
````typescript
import { BuySell, Product, IncoTerm, Unit, PaymentTerm, CreditStatus } from './trade';
import { PricingFormula } from './pricing';
import { ParentTrade, Trade } from './common';

export type PhysicalTradeType = "spot" | "term";

// Physical parent trade
export interface PhysicalParentTrade extends ParentTrade {
  tradeType: "physical";
  physicalType: PhysicalTradeType;
}

// Physical trade leg
export interface PhysicalTradeLeg {
  id: string;
  legReference: string;
  parentTradeId: string;
  buySell: BuySell;
  product: Product;
  sustainability: string;
  incoTerm: IncoTerm;
  quantity: number;
  tolerance: number;
  loadingPeriodStart: Date;
  loadingPeriodEnd: Date;
  pricingPeriodStart: Date;
  pricingPeriodEnd: Date;
  unit: Unit;
  paymentTerm: PaymentTerm;
  creditStatus: CreditStatus;
  formula?: PricingFormula;
  mtmFormula?: PricingFormula;
}

// For backward compatibility
export interface PhysicalTrade extends Trade {
  tradeType: "physical";
  physicalType: PhysicalTradeType;
  buySell: BuySell;
  counterparty: string;
  product: Product;
  sustainability: string;
  incoTerm: IncoTerm;
  quantity: number;
  tolerance: number;
  loadingPeriodStart: Date;
  loadingPeriodEnd: Date;
  pricingPeriodStart: Date;
  pricingPeriodEnd: Date;
  unit: Unit;
  paymentTerm: PaymentTerm;
  creditStatus: CreditStatus;
  formula?: PricingFormula;
  mtmFormula?: PricingFormula;
  legs: PhysicalTradeLeg[];
}
````

## File: src/types/pricing.ts
````typescript
import { Instrument, OperatorType } from './common';

export interface FormulaNode {
  id: string;
  type: "instrument" | "fixedValue" | "operator" | "group" | "percentage" | "openBracket" | "closeBracket";
  value: string;
  children?: FormulaNode[];
}

export interface FormulaToken {
  id: string;
  type: "instrument" | "fixedValue" | "operator" | "percentage" | "openBracket" | "closeBracket";
  value: string;
}

export interface ExposureResult {
  physical: Record<Instrument, number>;
  pricing: Record<Instrument, number>;
}

export interface MonthlyDistribution {
  [instrument: string]: {
    [monthCode: string]: number; // Month code format: "MMM-YY" (e.g., "Mar-24")
  };
}

export interface PricingFormula {
  tokens: FormulaToken[];
  exposures: ExposureResult;
  monthlyDistribution?: MonthlyDistribution;
}

// Utility type to handle potentially incomplete data from the database
export type PartialExposureResult = {
  physical?: Partial<Record<Instrument, number>>;
  pricing?: Partial<Record<Instrument, number>>;
};

export type PartialPricingFormula = {
  tokens: FormulaToken[];
  exposures?: PartialExposureResult;
  monthlyDistribution?: MonthlyDistribution; // Added this field to match PricingFormula
};

// Define FixedComponent type for formula analysis
export interface FixedComponent {
  value: number;
  displayValue: string;
}

// Enhanced price detail interfaces
export interface PriceDetail {
  instruments: Record<Instrument, { average: number; prices: { date: Date; price: number }[] }>;
  evaluatedPrice: number;
  fixedComponents?: FixedComponent[]; // Make this optional to maintain backward compatibility
}

export interface MTMPriceDetail {
  instruments: Record<Instrument, { price: number; date: Date | null }>;
  evaluatedPrice: number;
  fixedComponents?: FixedComponent[]; // Make this optional to maintain backward compatibility
}
````

## File: src/types/trade.ts
````typescript
import { TradeType } from './index';

export type BuySell = "buy" | "sell";
export type Product = "FAME0" | "RME" | "UCOME" | "UCOME-5" | "RME DC" | "LSGO" | "HVO";
export type DisplayProduct = string; // For displaying formatted product names
export type IncoTerm = "FOB" | "CIF" | "DES" | "DAP" | "FCA";
export type Unit = "MT" | "KG" | "L";
export type CreditStatus = "approved" | "pending" | "rejected";
export type PaymentTerm = "advance" | "30 days" | "60 days" | "90 days";
export type PaperRelationshipType = "FP" | "DIFF" | "SPREAD";

// Product relationship interface for the UI
export interface ProductRelationship {
  id: string;
  product: string;
  relationship_type: PaperRelationshipType;
  paired_product: string | null;
  default_opposite: string | null;
  created_at?: string;
}
````

## File: src/utils/dateParsingUtils.ts
````typescript
import { parse, isValid, format } from 'date-fns';

/**
 * Result of attempting to parse a date value
 */
export interface DateParsingResult {
  success: boolean;
  date: Date | null;
  error?: string;
}

/**
 * Parses a value from Excel into a JavaScript Date object
 * Handles multiple formats:
 * - Already a Date object
 * - Excel serial numbers
 * - ISO date strings (YYYY-MM-DD)
 * - UK format (DD/MM/YYYY)
 * - US format (MM/DD/YYYY)
 * - Text dates ("March 20, 2024")
 * 
 * @param value The value to parse
 * @returns Object containing success status and parsed date or error message
 */
export function parseExcelDate(value: any): DateParsingResult {
  // Case: empty or null value
  if (value === null || value === undefined || value === '') {
    return {
      success: false,
      date: null,
      error: 'Empty date value'
    };
  }

  // Case: Already a Date object
  if (value instanceof Date) {
    if (isNaN(value.getTime())) {
      return {
        success: false,
        date: null,
        error: 'Invalid Date object'
      };
    }
    return { success: true, date: value };
  }

  // Case: Excel serial number (Excel stores dates as days since 1900-01-01)
  if (typeof value === 'number' && !isNaN(value)) {
    // Excel to JS date conversion
    // Excel serial date 1 = 1900-01-01, but JS thinks it's 1899-12-31
    // There's also the leap year bug where Excel thinks 1900 was a leap year
    try {
      // For dates after Feb 28, 1900, we need to adjust for Excel's leap year bug
      const excelDate = value > 60 ? value - 1 : value;
      const msFromExcelEpoch = (excelDate - 25569) * 86400 * 1000;
      const date = new Date(msFromExcelEpoch);
      
      // Check if the resulting date is reasonable (between 1900 and 2100)
      const year = date.getFullYear();
      if (year >= 1900 && year <= 2100) {
        return { success: true, date };
      }
    } catch (e) {
      // Fall through to other parsing methods
    }
  }

  // Case: String formats
  if (typeof value === 'string') {
    // Try ISO format first (YYYY-MM-DD)
    try {
      const isoDate = new Date(value);
      if (!isNaN(isoDate.getTime())) {
        return { success: true, date: isoDate };
      }
    } catch (e) {
      // Continue to other formats
    }

    // Try common date formats
    const formats = [
      'yyyy-MM-dd',      // ISO: 2024-03-20
      'dd/MM/yyyy',      // UK: 20/03/2024
      'MM/dd/yyyy',      // US: 03/20/2024
      'dd-MM-yyyy',      // 20-03-2024
      'MM-dd-yyyy',      // 03-20-2024
      'dd.MM.yyyy',      // 20.03.2024
      'MM.dd.yyyy',      // 03.20.2024
      'MMMM d, yyyy',    // March 20, 2024
      'd MMMM yyyy',     // 20 March 2024
      'MMM d, yyyy',     // Mar 20, 2024
      'd MMM yyyy'       // 20 Mar 2024
    ];

    for (const dateFormat of formats) {
      try {
        const parsedDate = parse(value, dateFormat, new Date());
        if (isValid(parsedDate)) {
          return { success: true, date: parsedDate };
        }
      } catch (e) {
        // Try next format
      }
    }

    // Try to extract date components and build date
    // This handles many non-standard formats
    const dateRegex = /(\d{1,4})[\/\-\.\s](\d{1,2})[\/\-\.\s](\d{1,4})/;
    const match = value.match(dateRegex);
    
    if (match) {
      const [_, part1, part2, part3] = match;
      
      // Try to determine if it's MM/DD/YYYY or DD/MM/YYYY or YYYY/MM/DD
      let year, month, day;
      
      // If part1 is a 4-digit number, assume YYYY/MM/DD
      if (part1.length === 4 && parseInt(part1) >= 1900) {
        year = parseInt(part1);
        month = parseInt(part2);
        day = parseInt(part3);
      } 
      // If part3 is a 4-digit number, assume either MM/DD/YYYY or DD/MM/YYYY
      else if (part3.length === 4 && parseInt(part3) >= 1900) {
        year = parseInt(part3);
        
        // Guess MM/DD vs DD/MM based on values
        // If part1 > 12, it must be a day
        if (parseInt(part1) > 12) {
          day = parseInt(part1);
          month = parseInt(part2);
        } 
        // If part2 > 12, part1 must be a month
        else if (parseInt(part2) > 12) {
          month = parseInt(part1);
          day = parseInt(part2);
        }
        // Both could be either - default to MM/DD as it's common in Excel
        else {
          month = parseInt(part1);
          day = parseInt(part2);
        }
      }
      
      // Validate and create date
      if (year && month && day) {
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          const date = new Date(year, month - 1, day); // month is 0-indexed in JS
          if (!isNaN(date.getTime())) {
            return { success: true, date };
          }
        }
      }
    }
  }

  // If we get here, we couldn't parse the date
  return {
    success: false,
    date: null,
    error: 'Invalid date format. Supported formats include: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, Month D, YYYY'
  };
}

/**
 * Format a date as YYYY-MM-DD for database storage,
 * preserving the date exactly as it appears in the UI without timezone adjustments
 */
export function formatDateForStorage(date: Date): string {
  // Extract the year, month, and day using local date methods to prevent timezone shifts
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}
````

## File: src/utils/dateUtils.ts
````typescript
/**
 * Utility functions for date operations
 */

/**
 * Generates an array of month codes for the next N months starting from the current month
 * Format: MMM-YY (e.g., "Mar-24")
 * 
 * @param count Number of months to generate
 * @returns Array of month codes
 */
export function getNextMonths(count: number = 13): string[] {
  const months = [];
  const currentDate = new Date();
  
  // Start with current month
  for (let i = 0; i < count; i++) {
    const targetDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + i,
      1
    );
    
    // Format as MMM-YY (e.g., "Mar-24")
    const monthCode = targetDate.toLocaleDateString('en-US', { 
      month: 'short'
    });
    
    const yearCode = targetDate.getFullYear().toString().slice(2);
    months.push(`${monthCode}-${yearCode}`);
  }
  
  return months;
}

/**
 * Formats a date into a month code (MMM-YY)
 * 
 * @param date The date to format
 * @returns Formatted month code
 */
export function formatMonthCode(date: Date): string {
  const monthCode = date.toLocaleDateString('en-US', { month: 'short' });
  const yearCode = date.getFullYear().toString().slice(2);
  return `${monthCode}-${yearCode}`;
}

/**
 * Checks if a period code is valid and is in the future (or current month)
 * 
 * @param periodCode The period code to check
 * @returns True if period is valid and not in the past
 */
export function isValidFuturePeriod(periodCode: string): boolean {
  try {
    // Parse the period code (e.g., "Mar-24")
    const [month, yearShort] = periodCode.split('-');
    const year = 2000 + parseInt(yearShort);
    
    // Get the month number (0-11)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthIndex = monthNames.findIndex(m => m === month);
    
    if (monthIndex === -1) return false;
    
    // Create Date objects
    const periodDate = new Date(year, monthIndex, 1);
    const currentDate = new Date();
    const currentMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    
    // Check if the period is current month or future
    return periodDate >= currentMonth;
  } catch (e) {
    return false;
  }
}

/**
 * Format a date as YYYY-MM-DD for database storage,
 * preserving the date exactly as it appears in the UI without timezone adjustments
 * 
 * @param date The date to format
 * @returns Formatted date string in YYYY-MM-DD format
 */
export function formatDateForStorage(date: Date): string {
  // Extract the year, month, and day using local date methods to prevent timezone shifts
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Checks if a date is a business day (Monday-Friday)
 * @param date The date to check
 * @returns True if the date is a business day
 */
export function isBusinessDay(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6; // 0 = Sunday, 6 = Saturday
}

/**
 * Counts business days between two dates, inclusive
 * @param startDate Start date (inclusive)
 * @param endDate End date (inclusive)
 * @returns Number of business days
 */
export function countBusinessDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const currentDate = new Date(startDate);
  
  // Set to beginning of day
  currentDate.setHours(0, 0, 0, 0);
  
  // Create end date copy and set to end of day
  const endDateCopy = new Date(endDate);
  endDateCopy.setHours(23, 59, 59, 999);
  
  while (currentDate <= endDateCopy) {
    if (isBusinessDay(currentDate)) {
      count++;
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return count;
}

/**
 * Groups business days by month for a given date range
 * @param startDate Start date of the range (inclusive)
 * @param endDate End date of the range (inclusive)
 * @returns Object with month codes as keys and business day counts as values
 */
export function getBusinessDaysByMonth(startDate: Date, endDate: Date): Record<string, number> {
  const result: Record<string, number> = {};
  const currentDate = new Date(startDate);
  
  // Set to beginning of day
  currentDate.setHours(0, 0, 0, 0);
  
  // Create end date copy and set to end of day
  const endDateCopy = new Date(endDate);
  endDateCopy.setHours(23, 59, 59, 999);
  
  while (currentDate <= endDateCopy) {
    if (isBusinessDay(currentDate)) {
      const monthCode = formatMonthCode(currentDate);
      
      if (!result[monthCode]) {
        result[monthCode] = 0;
      }
      
      result[monthCode]++;
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return result;
}

/**
 * Rounds a number to the nearest integer while preserving the sign
 * @param value The number to round
 * @returns Rounded integer with preserved sign
 */
export function roundWithSign(value: number): number {
  return value >= 0 ? Math.round(value) : -Math.round(Math.abs(value));
}

/**
 * Splits a value proportionally across months based on business day distribution,
 * ensuring the total remains the same after rounding
 * @param value The value to distribute
 * @param businessDaysByMonth Business days per month
 * @returns Distribution of the value by month
 */
export function distributeValueByBusinessDays(
  value: number,
  businessDaysByMonth: Record<string, number>
): Record<string, number> {
  const totalBusinessDays = Object.values(businessDaysByMonth).reduce((sum, days) => sum + days, 0);
  
  if (totalBusinessDays === 0) {
    return {};
  }
  
  const distribution: Record<string, number> = {};
  let remainingValue = value;
  let processedMonths = 0;
  const totalMonths = Object.keys(businessDaysByMonth).length;
  
  // Sort months chronologically to ensure consistent distribution
  const sortedMonths = Object.keys(businessDaysByMonth).sort((a, b) => {
    const [monthA, yearA] = a.split('-');
    const [monthB, yearB] = b.split('-');
    return (parseInt(yearA) * 100 + getMonthIndex(monthA)) - (parseInt(yearB) * 100 + getMonthIndex(monthB));
  });
  
  for (const month of sortedMonths) {
    processedMonths++;
    const businessDays = businessDaysByMonth[month];
    const proportion = businessDays / totalBusinessDays;
    
    // For the last month, use the remaining value to ensure the total matches exactly
    if (processedMonths === totalMonths) {
      distribution[month] = remainingValue;
    } else {
      const monthValue = value * proportion;
      const roundedValue = roundWithSign(monthValue);
      distribution[month] = roundedValue;
      remainingValue -= roundedValue;
    }
  }
  
  return distribution;
}

/**
 * Helper function to get month index from month code
 * @param monthCode Three-letter month code (e.g., "Jan")
 * @returns Month index (0-11)
 */
function getMonthIndex(monthCode: string): number {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months.indexOf(monthCode);
}
````

## File: src/utils/formulaCalculation.ts
````typescript
import { FormulaToken, ExposureResult, Instrument, PricingFormula, MonthlyDistribution } from '@/types';
import { getBusinessDaysByMonth, distributeValueByBusinessDays } from '@/utils/dateUtils';

export const createEmptyExposureResult = (): ExposureResult => ({
  physical: {
    'Argus UCOME': 0,
    'Argus RME': 0,
    'Argus FAME0': 0,
    'Argus HVO': 0,
    'Platts LSGO': 0,
    'Platts Diesel': 0,
    'ICE GASOIL FUTURES': 0,
  },
  pricing: {
    'Argus UCOME': 0,
    'Argus RME': 0,
    'Argus FAME0': 0,
    'Argus HVO': 0,
    'Platts LSGO': 0,
    'Platts Diesel': 0,
    'ICE GASOIL FUTURES': 0,
  }
});

// Helper function to check if a token is an instrument
export const isInstrument = (token: FormulaToken): boolean => token.type === 'instrument';

// Helper function to check if a token is an operator
export const isOperator = (token: FormulaToken): boolean => token.type === 'operator';

// Helper function to check if a token is a fixed value
export const isFixedValue = (token: FormulaToken): boolean => token.type === 'fixedValue';

// Helper function to check if a token is a percentage
export const isPercentage = (token: FormulaToken): boolean => token.type === 'percentage';

// Helper function to check if a token is an open bracket
export const isOpenBracket = (token: FormulaToken): boolean => token.type === 'openBracket';

// Helper function to check if a token is a close bracket
export const isCloseBracket = (token: FormulaToken): boolean => token.type === 'closeBracket';

// Helper function to check if token is a value (instrument, fixed value, or percentage)
export const isValue = (token: FormulaToken): boolean => 
  isInstrument(token) || isFixedValue(token) || isPercentage(token);

// Enhanced function to determine if we can add a token type at the current position
// with simplified rules that only enforce basic mathematical validity
export const canAddTokenType = (tokens: FormulaToken[], type: FormulaToken['type']): boolean => {
  if (tokens.length === 0) {
    // First token can be instrument, fixed value, or open bracket
    return ['instrument', 'fixedValue', 'openBracket'].includes(type);
  }

  const lastToken = tokens[tokens.length - 1];
  
  switch (type) {
    case 'instrument':
    case 'fixedValue':
      // Can add value after operator or open bracket or another value (implicit multiplication)
      return true;
    
    case 'operator':
      // Cannot add an operator after another operator or an open bracket
      return !isOperator(lastToken) && !isOpenBracket(lastToken);
    
    case 'percentage':
      // Modified: Can add percentage after values, close brackets, OR OPERATORS
      return isInstrument(lastToken) || isFixedValue(lastToken) || 
             isCloseBracket(lastToken) || isOperator(lastToken);
    
    case 'openBracket':
      // Can add open bracket anytime except after a value or close bracket (would require * operator)
      return isOperator(lastToken) || isOpenBracket(lastToken);
    
    case 'closeBracket': {
      // Cannot add close bracket after operator or open bracket
      if (isOperator(lastToken) || isOpenBracket(lastToken)) {
        return false;
      }
      
      // Count open and close brackets to ensure we don't have too many close brackets
      let openCount = 0;
      let closeCount = 0;
      
      for (const token of tokens) {
        if (isOpenBracket(token)) openCount++;
        if (isCloseBracket(token)) closeCount++;
      }
      
      return openCount > closeCount;
    }
    
    default:
      return false;
  }
};

// Parse tokens to build an AST for proper evaluation
interface Node {
  type: string;
  value?: any;
  left?: Node;
  right?: Node;
  operator?: string;
  percentage?: boolean;
  percentageValue?: number;
}

// Simple tokenizer for formula parsing
const tokenizeFormula = (tokens: FormulaToken[]): FormulaToken[] => {
  // Insert multiplication operators for implicit multiplication (e.g., 2(3+4) -> 2*(3+4))
  const result: FormulaToken[] = [];
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const prevToken = i > 0 ? tokens[i - 1] : null;
    
    // Add implicit multiplication
    if (prevToken && 
        (isValue(prevToken) || isCloseBracket(prevToken)) && 
        (isValue(token) || isOpenBracket(token))) {
      // Add an implicit multiplication operator
      result.push({
        id: 'implicit-' + i,
        type: 'operator',
        value: '*'
      });
    }
    
    result.push(token);
  }
  
  return result;
};

// Parse formula tokens to build AST
// This is a simplified parser for demonstration - a real implementation would be more robust
const parseFormula = (tokens: FormulaToken[]): Node => {
  const processedTokens = tokenizeFormula(tokens);
  
  // Simple recursive descent parser
  let position = 0;
  
  // Parse expression with operator precedence
  const parseExpression = (): Node => {
    let left = parseTerm();
    
    while (position < processedTokens.length && 
          (processedTokens[position].type === 'operator' && 
           (processedTokens[position].value === '+' || processedTokens[position].value === '-'))) {
      const operator = processedTokens[position].value;
      position++;
      const right = parseTerm();
      left = { type: 'binary', operator, left, right };
    }
    
    return left;
  };
  
  // Parse term (*, /)
  const parseTerm = (): Node => {
    let left = parseFactor();
    
    while (position < processedTokens.length && 
          (processedTokens[position].type === 'operator' && 
           (processedTokens[position].value === '*' || processedTokens[position].value === '/'))) {
      const operator = processedTokens[position].value;
      position++;
      const right = parseFactor();
      left = { type: 'binary', operator, left, right };
    }
    
    return left;
  };
  
  // Parse factor (value, parenthesized expression)
  const parseFactor = (): Node => {
    if (position >= processedTokens.length) {
      return { type: 'value', value: 0 };
    }
    
    const token = processedTokens[position];
    
    if (isOpenBracket(token)) {
      position++; // Skip open bracket
      const node = parseExpression();
      
      if (position < processedTokens.length && isCloseBracket(processedTokens[position])) {
        position++; // Skip close bracket
      }
      
      // Check for percentage after parenthesis
      if (position < processedTokens.length && isPercentage(processedTokens[position])) {
        const percentValue = parseFloat(processedTokens[position].value);
        position++;
        return { 
          type: 'binary', 
          operator: '*', 
          left: node, 
          right: { type: 'value', value: percentValue / 100 } 
        };
      }
      
      return node;
    } else if (isInstrument(token)) {
      position++;
      const node: Node = { type: 'instrument', value: token.value };
      
      // Check for percentage after instrument
      if (position < processedTokens.length && isPercentage(processedTokens[position])) {
        const percentValue = parseFloat(processedTokens[position].value);
        position++;
        return { 
          type: 'binary', 
          operator: '*', 
          left: node, 
          right: { type: 'value', value: percentValue / 100 } 
        };
      }
      
      return node;
    } else if (isFixedValue(token)) {
      position++;
      const value = parseFloat(token.value);
      const node: Node = { type: 'value', value };
      
      // Check for percentage after fixed value
      if (position < processedTokens.length && isPercentage(processedTokens[position])) {
        const percentValue = parseFloat(processedTokens[position].value);
        position++;
        return { 
          type: 'binary', 
          operator: '*', 
          left: node, 
          right: { type: 'value', value: percentValue / 100 } 
        };
      }
      
      return node;
    } else if (isPercentage(token)) {
      position++;
      const value = parseFloat(token.value) / 100;
      return { type: 'value', value };
    } else if (isOperator(token) && (token.value === '+' || token.value === '-')) {
      // Unary plus or minus
      position++;
      const factor = parseFactor();
      return { type: 'unary', operator: token.value, right: factor };
    }
    
    // Skip unknown tokens
    position++;
    return { type: 'value', value: 0 };
  };
  
  const ast = parseExpression();
  return ast;
};

// Extract instruments from AST
const extractInstrumentsFromAST = (
  node: Node, 
  multiplier: number = 1
): Record<string, number> => {
  const instruments: Record<string, number> = {};
  
  if (!node) return instruments;
  
  if (node.type === 'instrument') {
    instruments[node.value as string] = multiplier;
  } else if (node.type === 'binary') {
    if (node.operator === '+') {
      const leftInstruments = extractInstrumentsFromAST(node.left, multiplier);
      const rightInstruments = extractInstrumentsFromAST(node.right, multiplier);
      
      // Merge instruments
      for (const [instrument, value] of Object.entries(leftInstruments)) {
        instruments[instrument] = (instruments[instrument] || 0) + value;
      }
      
      for (const [instrument, value] of Object.entries(rightInstruments)) {
        instruments[instrument] = (instruments[instrument] || 0) + value;
      }
    } else if (node.operator === '-') {
      const leftInstruments = extractInstrumentsFromAST(node.left, multiplier);
      const rightInstruments = extractInstrumentsFromAST(node.right, -multiplier);
      
      // Merge instruments
      for (const [instrument, value] of Object.entries(leftInstruments)) {
        instruments[instrument] = (instruments[instrument] || 0) + value;
      }
      
      for (const [instrument, value] of Object.entries(rightInstruments)) {
        instruments[instrument] = (instruments[instrument] || 0) + value;
      }
    } else if (node.operator === '*') {
      // When we multiply, we need to determine the multiplier first
      let newMultiplier = multiplier;
      
      // FIX: Corrected the type comparison condition
      // If right side is a simple value, use it as multiplier
      if (node.right.type === 'value' && node.left.type !== 'value') {
        const rightMultiplier = node.right.value;
        const leftInstruments = extractInstrumentsFromAST(node.left, multiplier * rightMultiplier);
        
        // Merge instruments
        for (const [instrument, value] of Object.entries(leftInstruments)) {
          instruments[instrument] = (instruments[instrument] || 0) + value;
        }
      } 
      // If left side is a simple value, use it as multiplier
      else if (node.left.type === 'value' && node.right.type !== 'value') {
        const leftMultiplier = node.left.value;
        const rightInstruments = extractInstrumentsFromAST(node.right, multiplier * leftMultiplier);
        
        // Merge instruments
        for (const [instrument, value] of Object.entries(rightInstruments)) {
          instruments[instrument] = (instruments[instrument] || 0) + value;
        }
      } else {
        // Complex multiplication - this is a simplification
        const leftInstruments = extractInstrumentsFromAST(node.left, multiplier);
        const rightInstruments = extractInstrumentsFromAST(node.right, multiplier);
        
        // In complex multiplication, we would need to do some weighted distribution
        // This is a simplified approach for demonstration
        for (const [instrument, value] of Object.entries(leftInstruments)) {
          instruments[instrument] = (instruments[instrument] || 0) + value;
        }
        
        for (const [instrument, value] of Object.entries(rightInstruments)) {
          instruments[instrument] = (instruments[instrument] || 0) + value;
        }
      }
    } else if (node.operator === '/') {
      // Division - simplification for demonstration
      if (node.right.type === 'value') {
        const divisor = node.right.value;
        if (divisor !== 0) {
          const leftInstruments = extractInstrumentsFromAST(node.left, multiplier / divisor);
          
          // Merge instruments
          for (const [instrument, value] of Object.entries(leftInstruments)) {
            instruments[instrument] = (instruments[instrument] || 0) + value;
          }
        }
      } else {
        // Complex division - simplification
        const leftInstruments = extractInstrumentsFromAST(node.left, multiplier);
        const rightInstruments = extractInstrumentsFromAST(node.right, -multiplier);
        
        // Merge instruments (simplification)
        for (const [instrument, value] of Object.entries(leftInstruments)) {
          instruments[instrument] = (instruments[instrument] || 0) + value;
        }
        
        for (const [instrument, value] of Object.entries(rightInstruments)) {
          instruments[instrument] = (instruments[instrument] || 0) + value;
        }
      }
    }
  } else if (node.type === 'unary') {
    if (node.operator === '-') {
      const rightInstruments = extractInstrumentsFromAST(node.right, -multiplier);
      
      // Merge instruments
      for (const [instrument, value] of Object.entries(rightInstruments)) {
        instruments[instrument] = (instruments[instrument] || 0) + value;
      }
    } else {
      const rightInstruments = extractInstrumentsFromAST(node.right, multiplier);
      
      // Merge instruments
      for (const [instrument, value] of Object.entries(rightInstruments)) {
        instruments[instrument] = (instruments[instrument] || 0) + value;
      }
    }
  }
  
  return instruments;
};

// Calculate exposures for a formula with proper parsing and exposure distribution
export const calculateExposures = (
  tokens: FormulaToken[],
  tradeQuantity: number,
  buySell: 'buy' | 'sell' = 'buy',
  selectedProduct?: string
): ExposureResult => {
  // We now separate the physical and pricing calculation
  return {
    // Calculate physical exposure based on the formula tokens
    // This is used when this function is called with MTM formula
    physical: calculatePhysicalExposure(tokens, tradeQuantity, buySell),
    // Calculate pricing exposure based on the formula tokens
    // This is used when this function is called with pricing formula
    pricing: calculatePricingExposure(tokens, tradeQuantity, buySell)
  };
};

// Calculate physical exposure from formula tokens
export const calculatePhysicalExposure = (
  tokens: FormulaToken[],
  tradeQuantity: number,
  buySell: 'buy' | 'sell' = 'buy'
): Record<Instrument, number> => {
  // Start with empty physical exposure
  const physicalExposure: Record<Instrument, number> = {
    'Argus UCOME': 0,
    'Argus RME': 0,
    'Argus FAME0': 0,
    'Argus HVO': 0,
    'Platts LSGO': 0,
    'Platts Diesel': 0,
    'ICE GASOIL FUTURES': 0,
  };
  
  if (!tokens.length || tradeQuantity === 0) {
    return physicalExposure;
  }
  
  try {
    const ast = parseFormula(tokens);
    const instrumentWeights = extractInstrumentsFromAST(ast);
    
    // Physical exposure sign depends on buy/sell direction
    // Buy is positive physical exposure, sell is negative physical exposure
    const physicalExposureSign = buySell === 'buy' ? 1 : -1;
    
    // Apply physical exposure based on formula weights
    for (const [instrument, weight] of Object.entries(instrumentWeights)) {
      if (instrument in physicalExposure) {
        // Apply the proportional exposure based on weight
        physicalExposure[instrument as Instrument] = physicalExposureSign * tradeQuantity * weight;
      }
    }
  } catch (error) {
    console.error('Error calculating physical exposures:', error);
  }
  
  return physicalExposure;
};

// Calculate pricing exposure from formula tokens
export const calculatePricingExposure = (
  tokens: FormulaToken[],
  tradeQuantity: number,
  buySell: 'buy' | 'sell' = 'buy'
): Record<Instrument, number> => {
  // Start with empty pricing exposure
  const pricingExposure: Record<Instrument, number> = {
    'Argus UCOME': 0,
    'Argus RME': 0,
    'Argus FAME0': 0,
    'Argus HVO': 0,
    'Platts LSGO': 0,
    'Platts Diesel': 0,
    'ICE GASOIL FUTURES': 0,
  };
  
  if (!tokens.length || tradeQuantity === 0) {
    return pricingExposure;
  }
  
  try {
    const ast = parseFormula(tokens);
    const instrumentWeights = extractInstrumentsFromAST(ast);
    
    // Pricing exposure sign is opposite of physical for buy, same for sell
    // Buy is negative pricing exposure, sell is positive pricing exposure
    const pricingExposureSign = buySell === 'buy' ? -1 : 1;
    
    // Apply pricing exposure with proper weights and signs
    for (const [instrument, weight] of Object.entries(instrumentWeights)) {
      if (instrument in pricingExposure) {
        // Apply the proportional exposure based on weight
        pricingExposure[instrument as Instrument] = pricingExposureSign * tradeQuantity * weight;
      }
    }
  } catch (error) {
    console.error('Error calculating pricing exposures:', error);
  }
  
  return pricingExposure;
};

// Convert formula to readable string
export const formulaToString = (tokens: FormulaToken[]): string => {
  return tokens.map(token => {
    if (token.type === 'percentage') {
      return `${token.value}%`;
    }
    return token.value;
  }).join(' ');
};

/**
 * Calculate the monthly distribution of pricing exposure
 * @param tokens The pricing formula tokens
 * @param quantity Trade quantity
 * @param buySell Buy or sell direction
 * @param pricingPeriodStart Start of pricing period
 * @param pricingPeriodEnd End of pricing period
 * @returns Monthly distribution object
 */
export const calculateMonthlyPricingDistribution = (
  tokens: FormulaToken[],
  quantity: number,
  buySell: 'buy' | 'sell',
  pricingPeriodStart: Date,
  pricingPeriodEnd: Date
): MonthlyDistribution => {
  // Get base pricing exposures
  const pricingExposure = calculatePricingExposure(tokens, quantity, buySell);
  
  // Get business days distribution by month
  const businessDaysByMonth = getBusinessDaysByMonth(pricingPeriodStart, pricingPeriodEnd);
  
  // Initialize result
  const monthlyDistribution: MonthlyDistribution = {};
  
  // For each instrument with non-zero exposure, distribute across months
  Object.entries(pricingExposure).forEach(([instrument, totalExposure]) => {
    if (totalExposure === 0) return;
    
    monthlyDistribution[instrument] = distributeValueByBusinessDays(totalExposure, businessDaysByMonth);
  });
  
  return monthlyDistribution;
};
````

## File: src/utils/formulaUtils.ts
````typescript
import { FormulaToken, Instrument, PricingFormula, ExposureResult, PartialPricingFormula } from '@/types';
import { createEmptyExposureResult, calculateExposures } from './formulaCalculation';

// Generate a unique ID for formula tokens
export const generateNodeId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

// Create a new instrument token
export const createInstrumentToken = (instrument: Instrument): FormulaToken => {
  return {
    id: generateNodeId(),
    type: 'instrument',
    value: instrument,
  };
};

// Create a new fixed value token
export const createFixedValueToken = (value: number): FormulaToken => {
  return {
    id: generateNodeId(),
    type: 'fixedValue',
    value: value.toString(),
  };
};

// Create a new percentage token
export const createPercentageToken = (value: number): FormulaToken => {
  return {
    id: generateNodeId(),
    type: 'percentage',
    value: value.toString(),
  };
};

// Create a new operator token
export const createOperatorToken = (operator: string): FormulaToken => {
  return {
    id: generateNodeId(),
    type: 'operator',
    value: operator,
  };
};

// Create a new open bracket token
export const createOpenBracketToken = (): FormulaToken => {
  return {
    id: generateNodeId(),
    type: 'openBracket',
    value: '(',
  };
};

// Create a new close bracket token
export const createCloseBracketToken = (): FormulaToken => {
  return {
    id: generateNodeId(),
    type: 'closeBracket',
    value: ')',
  };
};

// Create a new empty formula
export const createEmptyFormula = (): PricingFormula => {
  return {
    tokens: [],
    exposures: createEmptyExposureResult(),
  };
};

// Validate and parse a potential pricing formula from the database
export const validateAndParsePricingFormula = (rawFormula: any): PricingFormula => {
  // If null or undefined, return empty formula
  if (!rawFormula) {
    return createEmptyFormula();
  }
  
  // Check if the raw formula has tokens
  if (!rawFormula.tokens || !Array.isArray(rawFormula.tokens)) {
    console.warn('Invalid formula structure: missing or invalid tokens array');
    return createEmptyFormula();
  }
  
  // Check if all tokens have the required properties
  const validTokens = rawFormula.tokens.every((token: any) => 
    token && 
    typeof token.id === 'string' && 
    typeof token.type === 'string' && 
    typeof token.value === 'string'
  );
  
  if (!validTokens) {
    console.warn('Invalid formula structure: some tokens have invalid properties');
    return createEmptyFormula();
  }
  
  // Now we can safely cast to PartialPricingFormula
  const partialFormula: PartialPricingFormula = {
    tokens: rawFormula.tokens,
    exposures: rawFormula.exposures,
    monthlyDistribution: rawFormula.monthlyDistribution // Preserve monthly distribution
  };
  
  // Use ensureCompleteExposures to fill in any missing exposure data
  return ensureCompleteExposures(partialFormula);
};

// Ensure pricing formula has complete exposure structure
export const ensureCompleteExposures = (formula: PartialPricingFormula | undefined): PricingFormula => {
  if (!formula) {
    return createEmptyFormula();
  }
  
  // Create a complete default exposure structure
  const defaultExposures = createEmptyExposureResult();
  
  // If formula has no exposures property or it's incomplete, merge with defaults
  if (!formula.exposures) {
    return {
      ...formula,
      exposures: defaultExposures
    };
  }
  
  // Merge physical exposures, preserving existing values
  const mergedPhysical: Record<Instrument, number> = {
    ...defaultExposures.physical,
    ...(formula.exposures.physical || {})
  };
  
  // Merge pricing exposures, preserving existing values
  const mergedPricing: Record<Instrument, number> = {
    ...defaultExposures.pricing,
    ...(formula.exposures.pricing || {})
  };
  
  return {
    ...formula, // This preserves any additional properties like monthlyDistribution
    exposures: {
      physical: mergedPhysical,
      pricing: mergedPricing
    }
  };
};

// Convert formula to string representation with proper spacing
export const formulaToString = (tokens: FormulaToken[]): string => {
  return tokens.map(token => {
    if (token.type === 'percentage') {
      return `${token.value}%`;
    }
    return token.value;
  }).join(' ');
};

// Enhanced formula display with better formatting for UI
export const formulaToDisplayString = (tokens: FormulaToken[]): string => {
  if (!tokens || tokens.length === 0) {
    return 'No formula';
  }
  
  // Format the tokens with better spacing and symbols
  return tokens.map((token, index) => {
    switch (token.type) {
      case 'instrument':
        // Show full instrument name with prefix (removed the prefix stripping code)
        return token.value;
      case 'percentage':
        // Percentages are formatted with a % sign
        return `${token.value}%`;
      case 'fixedValue':
        // Fixed values are formatted as numbers
        return Number(token.value).toLocaleString('en-US', { 
          minimumFractionDigits: 0, 
          maximumFractionDigits: 2 
        });
      case 'operator':
        // Operators are formatted with spaces for better readability
        return ` ${token.value} `;
      case 'openBracket':
        // Open brackets are formatted with spaces after
        return '( ';
      case 'closeBracket':
        // Close brackets are formatted with spaces before
        return ' )';
      default:
        return token.value;
    }
  }).join('').replace(/\s{2,}/g, ' ').trim();
};
````

## File: src/utils/paperTradeDeleteUtils.ts
````typescript
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { delay } from './subscriptionUtils';

/**
 * Delete a paper trade and all its legs
 * @param tradeId ID of the paper trade to delete
 */
export const deletePaperTrade = async (tradeId: string): Promise<boolean> => {
  try {
    console.log(`Starting deletion process for paper trade: ${tradeId}`);
    
    // Step 1: Delete all legs for this trade
    const { error: legsError } = await supabase
      .from('paper_trade_legs')
      .delete()
      .eq('paper_trade_id', tradeId);
      
    if (legsError) {
      console.error('Error deleting paper trade legs:', legsError);
      throw legsError;
    }
    
    // Add a small delay between operations to avoid database race conditions
    await delay(300);
    
    // Step 2: Delete the paper trade
    const { error: tradeError } = await supabase
      .from('paper_trades')
      .delete()
      .eq('id', tradeId);
      
    if (tradeError) {
      console.error('Error deleting paper trade:', tradeError);
      throw tradeError;
    }
    
    console.log(`Successfully deleted paper trade: ${tradeId}`);
    toast.success("Paper trade deleted successfully");
    return true;
  } catch (error) {
    console.error('Error in deletePaperTrade:', error);
    toast.error("Paper trade deletion failed", {
      description: error instanceof Error ? error.message : 'Unknown error occurred'
    });
    throw error;
  }
};

/**
 * Delete a single leg from a paper trade
 * If it's the last leg, the entire trade will be deleted
 * @param legId ID of the leg to delete
 * @param parentTradeId ID of the parent paper trade
 */
export const deletePaperTradeLeg = async (legId: string, parentTradeId: string): Promise<boolean> => {
  try {
    console.log(`Starting deletion process for paper trade leg: ${legId} (parent: ${parentTradeId})`);
    
    // Step 1: Check how many legs this trade has
    const { data: legCount, error: countError } = await supabase
      .from('paper_trade_legs')
      .select('id', { count: 'exact' })
      .eq('paper_trade_id', parentTradeId);
      
    if (countError) {
      console.error('Error counting paper trade legs:', countError);
      throw countError;
    }
    
    const totalLegs = legCount?.length || 0;
    console.log(`Trade has ${totalLegs} legs in total`);
    
    // Step 2: Delete the specific leg
    const { error: legError } = await supabase
      .from('paper_trade_legs')
      .delete()
      .eq('id', legId);
      
    if (legError) {
      console.error('Error deleting paper trade leg:', legError);
      throw legError;
    }
    
    // Step 3: If this was the last leg, also delete the parent trade
    if (totalLegs <= 1) {
      console.log(`Deleting parent paper trade ${parentTradeId} as this was the last leg`);
      
      // Add a small delay to avoid database race conditions
      await delay(300);
      
      const { error: parentError } = await supabase
        .from('paper_trades')
        .delete()
        .eq('id', parentTradeId);
        
      if (parentError) {
        console.error('Error deleting parent paper trade:', parentError);
        throw parentError;
      }
      
      toast.success("Paper trade deleted successfully", {
        description: "Last leg was removed, so the entire trade was deleted"
      });
    } else {
      toast.success("Paper trade leg deleted successfully");
    }
    
    console.log(`Successfully deleted paper trade leg: ${legId}`);
    return true;
  } catch (error) {
    console.error('Error in deletePaperTradeLeg:', error);
    toast.error("Paper trade leg deletion failed", {
      description: error instanceof Error ? error.message : 'Unknown error occurred'
    });
    throw error;
  }
};
````

## File: src/utils/paperTradeSubscriptionUtils.ts
````typescript
import { supabase } from '@/integrations/supabase/client';

type ChannelRef = { [key: string]: any };

/**
 * Clean up paper trade subscriptions to avoid memory leaks
 */
export const cleanupPaperSubscriptions = (channelRefs: ChannelRef) => {
  console.log("[PAPER] Cleaning up paper trade subscriptions");
  Object.keys(channelRefs).forEach(key => {
    if (channelRefs[key]) {
      try {
        supabase.removeChannel(channelRefs[key]);
        channelRefs[key] = null;
      } catch (e) {
        console.error(`[PAPER] Error removing paper channel ${key}:`, e);
      }
    }
  });
};

/**
 * Utility function to create a controlled delay between operations
 */
export const paperDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Pause paper trade realtime subscriptions
 */
export const pausePaperSubscriptions = (channelRefs: ChannelRef) => {
  console.log("[PAPER] Pausing paper trade subscriptions");
  Object.keys(channelRefs).forEach(key => {
    if (channelRefs[key]) {
      try {
        channelRefs[key].isPaused = true;
        console.log(`[PAPER] Paused paper channel: ${key}`);
      } catch (e) {
        console.error(`[PAPER] Error pausing paper channel ${key}:`, e);
      }
    }
  });
};

/**
 * Resume paper trade realtime subscriptions
 */
export const resumePaperSubscriptions = (channelRefs: ChannelRef) => {
  console.log("[PAPER] Resuming paper trade subscriptions");
  Object.keys(channelRefs).forEach(key => {
    if (channelRefs[key]) {
      try {
        channelRefs[key].isPaused = false;
        console.log(`[PAPER] Resumed paper channel: ${key}`);
      } catch (e) {
        console.error(`[PAPER] Error resuming paper channel ${key}:`, e);
      }
    }
  });
};

/**
 * Setup paper trade realtime subscriptions
 */
export const setupPaperTradeSubscriptions = (
  realtimeChannelsRef: React.MutableRefObject<ChannelRef>,
  isProcessingRef: React.MutableRefObject<boolean>,
  debouncedRefetch: (fn: Function) => void,
  refetch: () => void
) => {
  cleanupPaperSubscriptions(realtimeChannelsRef.current);
  
  const paperTradesChannel = supabase
    .channel('paper_trades_isolated')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'paper_trades'
    }, (payload) => {
      if (realtimeChannelsRef.current.paperTradesChannel?.isPaused) {
        console.log('[PAPER] Subscription paused, skipping update for paper_trades');
        return;
      }
      
      if (!isProcessingRef.current) {
        console.log('[PAPER] Paper trades changed, debouncing refetch...', payload);
        debouncedRefetch(refetch);
      }
    })
    .subscribe();

  realtimeChannelsRef.current.paperTradesChannel = paperTradesChannel;

  const paperTradeLegsChannel = supabase
    .channel('paper_trade_legs_isolated')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'paper_trade_legs' 
    }, (payload) => {
      if (realtimeChannelsRef.current.paperTradeLegsChannel?.isPaused) {
        console.log('[PAPER] Subscription paused, skipping update for paper_trade_legs');
        return;
      }
      
      if (!isProcessingRef.current) {
        console.log('[PAPER] Paper trade legs changed, debouncing refetch...', payload);
        debouncedRefetch(refetch);
      }
    })
    .subscribe();

  realtimeChannelsRef.current.paperTradeLegsChannel = paperTradeLegsChannel;
  
  return () => {
    cleanupPaperSubscriptions(realtimeChannelsRef.current);
  };
};
````

## File: src/utils/paperTradeValidationUtils.ts
````typescript
/**
 * Utility functions for paper trade form validation
 */

import { toast } from "sonner";
import { PaperTradeLeg } from "@/types/paper";

/**
 * Validates that a required field has a value
 */
export const validateRequiredField = (
  value: string | number | undefined | null,
  fieldName: string
): boolean => {
  // Check for empty strings, undefined, null
  if (value === undefined || value === null || value === '') {
    toast.error(`${fieldName} required`, {
      description: `Please select or enter a value for ${fieldName}.`
    });
    return false;
  }
  
  // For number fields, verify they are valid numbers greater than zero
  if (typeof value === 'number' && isNaN(value)) {
    toast.error(`Invalid ${fieldName}`, {
      description: `${fieldName} must be a valid number.`
    });
    return false;
  }

  return true;
};

/**
 * Validates multiple fields at once and returns overall result
 */
export const validateFields = (validations: boolean[]): boolean => {
  return validations.every(isValid => isValid);
};

/**
 * Validates a complete paper trade leg
 */
export const validatePaperTradeLeg = (
  leg: Partial<PaperTradeLeg>,
  index: number
): boolean => {
  const legNumber = index + 1;
  
  // Common validations for all leg types
  const commonValidations = [
    validateRequiredField(leg.product, `Leg ${legNumber} - Product`),
    validateRequiredField(leg.buySell, `Leg ${legNumber} - Buy/Sell`),
    validateRequiredField(leg.quantity, `Leg ${legNumber} - Quantity`),
    validateRequiredField(leg.period, `Leg ${legNumber} - Period`)
  ];

  // For spreads and diffs that have right side, validate right side as well
  // Update validation to only check the period if it exists on the rightSide object
  const rightSideValidations = leg.rightSide ? [
    validateRequiredField(leg.rightSide.product, `Leg ${legNumber} - Right Side Product`),
    leg.rightSide.period !== undefined ? validateRequiredField(leg.rightSide.period, `Leg ${legNumber} - Right Side Period`) : true
  ] : [];

  return validateFields([...commonValidations, ...rightSideValidations]);
};

/**
 * Validates a complete paper trade form
 */
export const validatePaperTradeForm = (
  broker: string,
  legs: Partial<PaperTradeLeg>[]
): boolean => {
  if (!validateRequiredField(broker, 'Broker')) {
    return false;
  }
  
  if (!legs || legs.length === 0) {
    toast.error('Trade legs required', {
      description: 'Please add at least one trade leg'
    });
    return false;
  }
  
  // Validate each leg
  const legValidations = legs.map((leg, index) => validatePaperTradeLeg(leg, index));
  
  return legValidations.every(isValid => isValid);
};
````

## File: src/utils/physicalTradeDeleteUtils.ts
````typescript
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Delete a physical trade and all its legs with proper sequencing
 */
export const deletePhysicalTrade = async (
  tradeId: string,
  onProgress?: (progress: number) => void
): Promise<boolean> => {
  try {
    console.log(`Starting deletion process for physical trade: ${tradeId}`);
    onProgress?.(10);
    
    // Step 1: Delete all legs for this trade
    const { error: legsError } = await supabase
      .from('trade_legs')
      .delete()
      .eq('parent_trade_id', tradeId);
      
    if (legsError) {
      console.error('Error deleting trade legs:', legsError);
      throw legsError;
    }
    
    onProgress?.(50);
    
    // Step 2: Delete the parent trade
    const { error: parentError } = await supabase
      .from('parent_trades')
      .delete()
      .eq('id', tradeId)
      .eq('trade_type', 'physical');
      
    if (parentError) {
      console.error('Error deleting parent trade:', parentError);
      throw parentError;
    }
    
    onProgress?.(100);
    
    console.log(`Successfully deleted physical trade: ${tradeId}`);
    return true;
  } catch (error) {
    console.error('Error in deletePhysicalTrade:', error);
    toast.error("Physical trade deletion failed", {
      description: error instanceof Error ? error.message : 'Unknown error occurred'
    });
    return false;
  }
};

/**
 * Delete a single leg from a physical trade, handling the case where it's the last leg
 */
export const deletePhysicalTradeLeg = async (
  legId: string, 
  parentTradeId: string,
  onProgress?: (progress: number) => void
): Promise<boolean> => {
  try {
    console.log(`Starting deletion process for leg: ${legId} of trade: ${parentTradeId}`);
    onProgress?.(10);
    
    // First, check if this is the only leg for the parent trade
    const { data: legsCount, error: countError } = await supabase
      .from('trade_legs')
      .select('id', { count: 'exact' })
      .eq('parent_trade_id', parentTradeId);
    
    if (countError) {
      console.error('Error checking remaining legs:', countError);
      throw countError;
    }
    
    onProgress?.(30);
    
    const isLastLeg = legsCount?.length === 1;
    
    // If it's the last leg, delete both the leg and the parent trade
    if (isLastLeg) {
      console.log(`This is the last leg for trade ${parentTradeId}, deleting entire trade`);
      onProgress?.(40);
      return await deletePhysicalTrade(parentTradeId, (progress) => {
        // Scale progress to fit within our 40%-100% range
        onProgress?.(40 + (progress * 0.6));
      });
    }
    
    // Otherwise, just delete the leg
    const { error } = await supabase
      .from('trade_legs')
      .delete()
      .eq('id', legId);
    
    if (error) {
      console.error('Error deleting trade leg:', error);
      throw error;
    }
    
    onProgress?.(100);
    
    console.log(`Successfully deleted leg: ${legId}`);
    return true;
  } catch (error) {
    console.error('Error in deletePhysicalTradeLeg:', error);
    toast.error("Trade leg deletion failed", {
      description: error instanceof Error ? error.message : 'Unknown error occurred'
    });
    return false;
  }
};
````

## File: src/utils/physicalTradeSubscriptionUtils.ts
````typescript
import { supabase } from '@/integrations/supabase/client';

type ChannelRef = { [key: string]: any };

/**
 * Clean up physical trade subscriptions to avoid memory leaks
 */
export const cleanupPhysicalSubscriptions = (channelRefs: ChannelRef) => {
  console.log("[SUBSCRIPTION] Cleaning up physical trade subscriptions");
  
  if (!channelRefs) {
    console.log("[SUBSCRIPTION] No channel refs provided, skipping cleanup");
    return;
  }
  
  Object.keys(channelRefs).forEach(key => {
    if (channelRefs[key]) {
      try {
        supabase.removeChannel(channelRefs[key]);
        channelRefs[key] = null;
        console.log(`[SUBSCRIPTION] Removed channel: ${key}`);
      } catch (e) {
        console.error(`[SUBSCRIPTION] Error removing physical channel ${key}:`, e);
      }
    }
  });
};

/**
 * Setup physical trade realtime subscriptions
 */
export const setupPhysicalTradeSubscriptions = (
  realtimeChannelsRef: React.MutableRefObject<ChannelRef>,
  refetch: () => void
) => {
  if (!realtimeChannelsRef || !realtimeChannelsRef.current) {
    console.error("[SUBSCRIPTION] Invalid channel ref, cannot setup subscriptions");
    return () => {};
  }

  // Clean up any existing subscriptions first
  cleanupPhysicalSubscriptions(realtimeChannelsRef.current);
  
  try {
    const parentTradesChannel = supabase
      .channel('physical_parent_trades_isolated')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'parent_trades',
        filter: 'trade_type=eq.physical'
      }, (payload) => {
        console.log('[SUBSCRIPTION] Physical parent trades changed, triggering refetch...', payload);
        refetch();
      })
      .subscribe();
    
    realtimeChannelsRef.current.parentTradesChannel = parentTradesChannel;

    const tradeLegsChannel = supabase
      .channel('trade_legs_for_physical_isolated')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'trade_legs' 
      }, (payload) => {
        console.log('[SUBSCRIPTION] Trade legs changed, triggering refetch...', payload);
        refetch();
      })
      .subscribe();
    
    realtimeChannelsRef.current.tradeLegsChannel = tradeLegsChannel;
  } catch (error) {
    console.error("[SUBSCRIPTION] Error setting up subscriptions:", error);
  }
  
  return () => {
    cleanupPhysicalSubscriptions(realtimeChannelsRef.current);
  };
};
````

## File: src/utils/priceCalculationUtils.ts
````typescript
import { FormulaToken, Instrument, PricingFormula, FixedComponent, PriceDetail, MTMPriceDetail } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { formulaToDisplayString } from './formulaUtils';

// Pricing period types
export type PricingPeriodType = 'historical' | 'current' | 'forward';

// Function to determine pricing period type based on start and end dates
export const determinePricingPeriodType = (
  startDate: Date,
  endDate: Date
): PricingPeriodType => {
  const currentDate = new Date();
  
  // If both dates are in the past
  if (endDate < currentDate) {
    return 'historical';
  }
  
  // If both dates are in the future
  if (startDate > currentDate) {
    return 'forward';
  }
  
  // If the current date falls within the period
  return 'current';
};

// Function to fetch historical prices for a given instrument and date range
export const fetchHistoricalPrices = async (
  instrument: Instrument,
  startDate: Date,
  endDate: Date
): Promise<{ date: Date; price: number }[]> => {
  // Find the instrument_id based on the display_name
  const { data: instrumentData, error: instrumentError } = await supabase
    .from('pricing_instruments')
    .select('id')
    .eq('display_name', instrument)
    .single();

  if (instrumentError || !instrumentData) {
    console.error(`Error finding instrument ${instrument}:`, instrumentError);
    return [];
  }

  const instrumentId = instrumentData.id;

  const { data, error } = await supabase
    .from('historical_prices')
    .select('price_date, price')
    .eq('instrument_id', instrumentId)
    .gte('price_date', startDate.toISOString().split('T')[0])
    .lte('price_date', endDate.toISOString().split('T')[0])
    .order('price_date', { ascending: true });

  if (error) {
    console.error('Error fetching historical prices:', error);
    return [];
  }

  return data.map(item => ({
    date: new Date(item.price_date),
    price: item.price
  }));
};

// Function to fetch forward prices for a given instrument and date range
export const fetchForwardPrices = async (
  instrument: Instrument,
  startDate: Date,
  endDate: Date
): Promise<{ date: Date; price: number }[]> => {
  // Find the instrument_id based on the display_name
  const { data: instrumentData, error: instrumentError } = await supabase
    .from('pricing_instruments')
    .select('id')
    .eq('display_name', instrument)
    .single();

  if (instrumentError || !instrumentData) {
    console.error(`Error finding instrument ${instrument}:`, instrumentError);
    return [];
  }

  const instrumentId = instrumentData.id;

  const { data, error } = await supabase
    .from('forward_prices')
    .select('forward_month, price')
    .eq('instrument_id', instrumentId)
    .gte('forward_month', startDate.toISOString().split('T')[0])
    .lte('forward_month', endDate.toISOString().split('T')[0])
    .order('forward_month', { ascending: true });

  if (error) {
    console.error('Error fetching forward prices:', error);
    return [];
  }

  return data.map(item => ({
    date: new Date(item.forward_month),
    price: item.price
  }));
};

// New function to fetch the most recent price for a given instrument
export const fetchMostRecentPrice = async (
  instrument: Instrument
): Promise<{ date: Date; price: number } | null> => {
  // Find the instrument_id based on the display_name
  const { data: instrumentData, error: instrumentError } = await supabase
    .from('pricing_instruments')
    .select('id')
    .eq('display_name', instrument)
    .single();

  if (instrumentError || !instrumentData) {
    console.error(`Error finding instrument ${instrument}:`, instrumentError);
    return null;
  }

  const instrumentId = instrumentData.id;

  // Try to get the most recent historical price first
  const { data: histData, error: histError } = await supabase
    .from('historical_prices')
    .select('price_date, price')
    .eq('instrument_id', instrumentId)
    .order('price_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  // If no historical price is found, check forward prices
  if (!histData && !histError) {
    const { data: fwdData, error: fwdError } = await supabase
      .from('forward_prices')
      .select('forward_month, price')
      .eq('instrument_id', instrumentId)
      .order('forward_month', { ascending: true }) // Get the closest forward month
      .limit(1)
      .maybeSingle();

    if (fwdError || !fwdData) {
      console.error(`No recent price found for instrument ${instrument}`);
      return null;
    }

    return {
      date: new Date(fwdData.forward_month),
      price: fwdData.price
    };
  }

  if (histError) {
    console.error('Error fetching most recent price:', histError);
    return null;
  }

  if (histData) {
    return {
      date: new Date(histData.price_date),
      price: histData.price
    };
  }

  return null;
};

// Calculate average price for a collection of price points
export const calculateAveragePrice = (prices: { date: Date; price: number }[]): number => {
  if (prices.length === 0) return 0;
  const sum = prices.reduce((total, { price }) => total + price, 0);
  return sum / prices.length;
};

// Extract fixed components from formula tokens
const extractFixedComponents = (tokens: FormulaToken[]): FixedComponent[] => {
  const fixedComponents: FixedComponent[] = [];
  
  tokens.forEach((token, index) => {
    if (token.type === 'fixedValue') {
      // Check if this is part of an operation with the surrounding tokens
      const prevToken = index > 0 ? tokens[index - 1] : null;
      const nextToken = index < tokens.length - 1 ? tokens[index + 1] : null;
      
      // For display purposes, include the operator if it exists
      let displayValue = token.value;
      
      if (prevToken && prevToken.type === 'operator') {
        displayValue = `${prevToken.value}${token.value}`;
      } else if (nextToken && nextToken.type === 'operator') {
        // Only prefix with + if it's not already signed
        if (!displayValue.startsWith('-') && !displayValue.startsWith('+')) {
          displayValue = `+${displayValue}`;
        }
      }
      
      fixedComponents.push({
        value: parseFloat(token.value),
        displayValue
      });
    }
  });
  
  return fixedComponents;
};

// Parse and evaluate a formula token
const evaluateFormula = (
  tokens: FormulaToken[],
  instrumentPrices: Record<Instrument, number>
): number => {
  if (!tokens || tokens.length === 0) return 0;
  
  // Process tokens to handle implied multiplication, etc.
  let position = 0;
  
  // Parse expression with operator precedence (addition, subtraction)
  const parseExpression = (): number => {
    let left = parseTerm();
    
    while (position < tokens.length && 
          (tokens[position].type === 'operator' && 
           (tokens[position].value === '+' || tokens[position].value === '-'))) {
      const operator = tokens[position].value;
      position++;
      const right = parseTerm();
      
      if (operator === '+') {
        left += right;
      } else if (operator === '-') {
        left -= right;
      }
    }
    
    return left;
  };
  
  // Parse term (multiplication, division)
  const parseTerm = (): number => {
    let left = parseFactor();
    
    while (position < tokens.length && 
          (tokens[position].type === 'operator' && 
           (tokens[position].value === '*' || tokens[position].value === '/'))) {
      const operator = tokens[position].value;
      position++;
      const right = parseFactor();
      
      if (operator === '*') {
        left *= right;
      } else if (operator === '/') {
        if (right !== 0) {
          left /= right;
        } else {
          console.error('Division by zero in formula');
        }
      }
    }
    
    // Check for percentage after a term
    if (position < tokens.length && tokens[position].type === 'percentage') {
      const percentValue = parseFloat(tokens[position].value) / 100;
      left *= percentValue;
      position++;
    }
    
    return left;
  };
  
  // Parse factor (value, parenthesized expression)
  const parseFactor = (): number => {
    if (position >= tokens.length) {
      return 0;
    }
    
    const token = tokens[position];
    
    if (token.type === 'openBracket') {
      position++; // Skip open bracket
      const value = parseExpression();
      
      if (position < tokens.length && tokens[position].type === 'closeBracket') {
        position++; // Skip close bracket
      }
      
      // Check for percentage after parenthesis
      if (position < tokens.length && tokens[position].type === 'percentage') {
        const percentValue = parseFloat(tokens[position].value) / 100;
        position++;
        return value * percentValue;
      }
      
      return value;
    } else if (token.type === 'instrument') {
      position++;
      const instrumentValue = instrumentPrices[token.value as Instrument] || 0;
      
      // Check for percentage after instrument
      if (position < tokens.length && tokens[position].type === 'percentage') {
        const percentValue = parseFloat(tokens[position].value) / 100;
        position++;
        return instrumentValue * percentValue;
      }
      
      return instrumentValue;
    } else if (token.type === 'fixedValue') {
      position++;
      const value = parseFloat(token.value);
      
      // Check for percentage after fixed value
      if (position < tokens.length && tokens[position].type === 'percentage') {
        const percentValue = parseFloat(tokens[position].value) / 100;
        position++;
        return value * percentValue;
      }
      
      return value;
    } else if (token.type === 'percentage') {
      position++;
      return parseFloat(token.value) / 100;
    } else if (token.type === 'operator' && (token.value === '+' || token.value === '-')) {
      // Unary plus or minus
      position++;
      const factor = parseFactor();
      return token.value === '-' ? -factor : factor;
    }
    
    // Skip unknown tokens
    position++;
    return 0;
  };
  
  const result = parseExpression();
  return result;
};

// Apply formula to calculate the final price
export const applyPricingFormula = (
  formula: PricingFormula, 
  instrumentPrices: Record<Instrument, number>
): number => {
  if (!formula || !formula.tokens || formula.tokens.length === 0) return 0;
  
  try {
    return evaluateFormula(formula.tokens, instrumentPrices);
  } catch (error) {
    console.error('Error evaluating formula:', error);
    return 0;
  }
};

// Calculate trade leg price based on its formula and date range
export const calculateTradeLegPrice = async (
  formula: PricingFormula,
  startDate: Date,
  endDate: Date
): Promise<{
  price: number;
  periodType: PricingPeriodType;
  priceDetails: PriceDetail;
}> => {
  if (!formula || !formula.tokens || formula.tokens.length === 0) {
    return {
      price: 0,
      periodType: 'historical',
      priceDetails: {
        instruments: {},
        evaluatedPrice: 0
      }
    };
  }
  
  const periodType = determinePricingPeriodType(startDate, endDate);
  const instrumentPrices: Record<Instrument, number> = {
    'Argus UCOME': 0,
    'Argus RME': 0,
    'Argus FAME0': 0,
    'Platts LSGO': 0,
    'Platts diesel': 0,
  };
  
  const priceDetails: Record<Instrument, { average: number; prices: { date: Date; price: number }[] }> = {
    'Argus UCOME': { average: 0, prices: [] },
    'Argus RME': { average: 0, prices: [] },
    'Argus FAME0': { average: 0, prices: [] },
    'Platts LSGO': { average: 0, prices: [] },
    'Platts diesel': { average: 0, prices: [] },
  };

  // Extract fixed components from the formula
  const fixedComponents = extractFixedComponents(formula.tokens);

  // Track which instruments are used in the formula for exposure calculation
  const usedInstruments = new Set<Instrument>();
  let hasInstrument = false;

  // Collect price data for each instrument in the formula
  for (const token of formula.tokens) {
    if (token.type === 'instrument') {
      hasInstrument = true;
      const instrument = token.value as Instrument;
      usedInstruments.add(instrument);
      let prices: { date: Date; price: number }[] = [];
      
      // Fetch appropriate prices based on period type
      if (periodType === 'historical' || periodType === 'current') {
        prices = await fetchHistoricalPrices(instrument, startDate, endDate);
      } else {
        prices = await fetchForwardPrices(instrument, startDate, endDate);
      }
      
      const average = calculateAveragePrice(prices);
      
      instrumentPrices[instrument] = average;
      priceDetails[instrument] = { average, prices };
    }
  }
  
  // If there are no instruments but there are fixed values, create a default date range
  if (!hasInstrument && fixedComponents.length > 0) {
    // Create a synthetic price series covering the pricing period
    const syntheticDates: Date[] = [];
    const currentDate = new Date(startDate);
    
    // Generate dates covering the pricing period
    while (currentDate <= endDate) {
      syntheticDates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Use the first instrument as a placeholder
    const placeholderInstrument = 'Argus UCOME' as Instrument;
    usedInstruments.add(placeholderInstrument);
    
    // Create synthetic price points with value 0
    const syntheticPrices = syntheticDates.map(date => ({ 
      date, 
      price: 0 
    }));
    
    priceDetails[placeholderInstrument] = { 
      average: 0, 
      prices: syntheticPrices
    };
  }
  
  // Apply the formula to calculate the final price
  const finalPrice = applyPricingFormula(formula, instrumentPrices);
  
  // Only include instruments that were used in the formula
  const filteredInstruments = Object.fromEntries(
    Object.entries(priceDetails)
      .filter(([instrument]) => usedInstruments.has(instrument as Instrument))
  ) as Record<Instrument, { average: number; prices: { date: Date; price: number }[] }>;
  
  const fixedComponentsArray = extractFixedComponents(formula.tokens);
  
  return {
    price: finalPrice,
    periodType,
    priceDetails: {
      instruments: filteredInstruments,
      evaluatedPrice: finalPrice,
      ...(fixedComponentsArray.length > 0 ? { fixedComponents: fixedComponentsArray } : {})
    }
  };
};

// Calculate MTM price using most recent prices
export const calculateMTMPrice = async (
  formula: PricingFormula,
): Promise<{
  price: number;
  priceDetails: MTMPriceDetail;
}> => {
  if (!formula || !formula.tokens || formula.tokens.length === 0) {
    return {
      price: 0,
      priceDetails: {
        instruments: {},
        evaluatedPrice: 0
      }
    };
  }
  
  const instrumentPrices: Record<Instrument, number> = {
    'Argus UCOME': 0,
    'Argus RME': 0,
    'Argus FAME0': 0,
    'Platts LSGO': 0,
    'Platts diesel': 0,
  };
  
  const priceDetails: Record<Instrument, { price: number; date: Date | null }> = {
    'Argus UCOME': { price: 0, date: null },
    'Argus RME': { price: 0, date: null },
    'Argus FAME0': { price: 0, date: null },
    'Platts LSGO': { price: 0, date: null },
    'Platts diesel': { price: 0, date: null },
  };

  // Extract fixed components from the formula
  const fixedComponents = extractFixedComponents(formula.tokens);

  // Track which instruments are used in the formula
  const usedInstruments = new Set<Instrument>();
  let hasInstrument = false;

  // Collect most recent price data for each instrument in the formula
  for (const token of formula.tokens) {
    if (token.type === 'instrument') {
      hasInstrument = true;
      const instrument = token.value as Instrument;
      usedInstruments.add(instrument);
      
      // Fetch most recent price for this instrument
      const recentPrice = await fetchMostRecentPrice(instrument);
      
      if (recentPrice) {
        instrumentPrices[instrument] = recentPrice.price;
        priceDetails[instrument] = { price: recentPrice.price, date: recentPrice.date };
      } else {
        // If no price found, leave as 0
        instrumentPrices[instrument] = 0;
        priceDetails[instrument] = { price: 0, date: null };
      }
    }
  }
  
  // If there are no instruments but there are fixed values, create a default display entry
  if (!hasInstrument && fixedComponents.length > 0) {
    // Use today's date
    const today = new Date();
    
    // Use the first instrument as a placeholder
    const placeholderInstrument = 'Argus UCOME' as Instrument;
    usedInstruments.add(placeholderInstrument);
    
    priceDetails[placeholderInstrument] = { 
      price: 0, 
      date: today
    };
  }
  
  // Apply the formula to calculate the final price
  const finalPrice = applyPricingFormula(formula, instrumentPrices);
  
  // Filter the instruments to only those used in the formula
  const filteredInstruments = Object.fromEntries(
    Object.entries(priceDetails)
      .filter(([instrument]) => usedInstruments.has(instrument as Instrument))
  ) as Record<Instrument, { price: number; date: Date | null }>;
  
  const fixedComponentsArray = extractFixedComponents(formula.tokens);
  
  return {
    price: finalPrice,
    priceDetails: {
      instruments: filteredInstruments,
      evaluatedPrice: finalPrice,
      ...(fixedComponentsArray.length > 0 ? { fixedComponents: fixedComponentsArray } : {})
    }
  };
};

// Calculate MTM value based on trade price and MTM price
export const calculateMTMValue = (
  tradePrice: number,
  mtmPrice: number,
  quantity: number,
  buySell: 'buy' | 'sell'
): number => {
  // The new MTM calculation: (tradePrice - mtmPrice) * quantity * buySellFactor
  const buySellFactor = buySell.toLowerCase() === 'buy' ? -1 : 1;
  
  return (tradePrice - mtmPrice) * quantity * buySellFactor;
};

// Update a trade leg's price in the database
export const updateTradeLegPrice = async (
  legId: string, 
  price: number,
  mtmPrice?: number
): Promise<boolean> => {
  const updates: any = { 
    calculated_price: price,
    last_calculation_date: new Date().toISOString()
  };
  
  // If MTM price is provided, update that too
  if (mtmPrice !== undefined) {
    updates.mtm_calculated_price = mtmPrice;
    updates.mtm_last_calculation_date = new Date().toISOString();
  }
  
  const { error } = await supabase
    .from('trade_legs')
    .update(updates)
    .eq('id', legId);
  
  if (error) {
    console.error('Error updating trade leg price:', error);
    return false;
  }
  
  return true;
};

// Calculate exposure for a trade with the given formula and quantity
export const calculateExposure = (
  formula: PricingFormula,
  quantity: number,
  buySell: 'buy' | 'sell'
): Record<Instrument, number> => {
  const exposure: Record<Instrument, number> = {
    'Argus UCOME': 0,
    'Argus RME': 0,
    'Argus FAME0': 0,
    'Platts LSGO': 0,
    'Platts diesel': 0,
  };
  
  if (!formula || !formula.tokens) return exposure;
  
  // Direction multiplier: buy = -1 (we are exposed to price increases)
  // sell = 1 (we are exposed to price decreases)
  const directionMultiplier = buySell.toLowerCase() === 'buy' ? -1 : 1;
  
  // For each instrument in the formula, calculate exposure
  formula.tokens.forEach(token => {
    if (token.type === 'instrument') {
      const instrument = token.value as Instrument;
      // Simple exposure calculation: quantity * direction
      exposure[instrument] = quantity * directionMultiplier;
    }
  });
  
  return exposure;
};
````

## File: src/utils/productMapping.ts
````typescript
/**
 * Maps product codes to their canonical display names for exposure reporting
 */
export const mapProductToCanonical = (product: string): string => {
  switch (product) {
    case 'UCOME':
      return 'Argus UCOME';
    case 'FAME0':
      return 'Argus FAME0';
    case 'RME':
      return 'Argus RME';
    case 'LSGO':
    case 'Platts LSGO':
      return 'Platts LSGO';
    case 'HVO':
    case 'HVO_FP':
      return 'Argus HVO';
    case 'GASOIL':
    case 'GASOIL_FP':
      return 'ICE GASOIL FUTURES';
    case 'diesel':
    case 'Platts diesel':
    case 'Platts Diesel': // Add this case to ensure consistency
      return 'Platts Diesel'; // Changed to capital D for consistency
    default:
      return product;
  }
};

/**
 * Strips prefix from product name for display purposes
 */
export const stripProductPrefix = (product: string): string => {
  if (!product) return '';
  
  // Remove common prefixes
  return product
    .replace('Argus ', '')
    .replace('Platts ', '')
    .replace('ICE ', '');
};

/**
 * Formats product names for exposure table display
 * Converts full canonical names to simplified display names
 */
export const formatExposureTableProduct = (product: string): string => {
  if (!product) return '';
  
  // Special case for GASOIL
  if (product === 'ICE GASOIL FUTURES') {
    return 'ICE GASOIL';
  }
  
  // For other products, strip prefixes and keep base name
  const simplified = stripProductPrefix(product);
  
  // Special case for Diesel (capitalize D)
  if (simplified.toLowerCase() === 'diesel') {
    return 'Diesel';
  }
  
  return simplified;
};

/**
 * Returns display name for a product based on type
 */
export const formatProductDisplay = (
  product: string, 
  relationshipType: string,
  oppositeProduct?: string | null
): string => {
  if (!product) return '';
  
  const cleanProduct = stripProductPrefix(product);
  
  if (relationshipType === 'FP') {
    return `${cleanProduct} FP`;
  }
  
  if (relationshipType === 'DIFF' && oppositeProduct) {
    return `${cleanProduct} DIFF`;
  }
  
  if (relationshipType === 'SPREAD' && oppositeProduct) {
    const cleanOppositeProduct = stripProductPrefix(oppositeProduct);
    return `${cleanProduct}/${cleanOppositeProduct}`;
  }
  
  return cleanProduct;
};

/**
 * Parse a paper trade instrument name to determine the products involved
 */
export const parsePaperInstrument = (
  instrument: string
): { baseProduct: string; oppositeProduct: string | null; relationshipType: 'FP' | 'DIFF' | 'SPREAD' } => {
  if (!instrument) {
    return { baseProduct: '', oppositeProduct: null, relationshipType: 'FP' };
  }
  
  // Check for DIFF relationship
  if (instrument.includes('DIFF')) {
    // For DIFFs, the format is usually "{product} DIFF"
    const baseProduct = instrument.replace(' DIFF', '');
    // DIFFs are typically against LSGO
    const oppositeProduct = 'LSGO';
    
    return {
      baseProduct: mapProductToCanonical(baseProduct),
      oppositeProduct: mapProductToCanonical(oppositeProduct),
      relationshipType: 'DIFF'
    };
  }
  
  // Check for SPREAD relationship
  if (instrument.includes('SPREAD') || instrument.includes('-')) {
    // For SPREADs, the format is usually "{product1}-{product2} SPREAD" or just "{product1}-{product2}"
    const products = instrument
      .replace(' SPREAD', '')
      .split(/[-\/]/)  // Split on either hyphen or forward slash
      .map(p => p.trim());
    
    if (products.length >= 2) {
      return {
        baseProduct: mapProductToCanonical(products[0]),
        oppositeProduct: mapProductToCanonical(products[1]),
        relationshipType: 'SPREAD'
      };
    }
  }
  
  // Default to FP, extract the product name
  let baseProduct = instrument.replace(' FP', '');
  
  return {
    baseProduct: mapProductToCanonical(baseProduct),
    oppositeProduct: null,
    relationshipType: 'FP'
  };
};

/**
 * Calculate the display price for a paper trade based on relationship type
 * For FP trades: returns the original price
 * For DIFF/SPREAD trades: returns the absolute difference between left and right side prices
 */
export const calculateDisplayPrice = (
  relationshipType: 'FP' | 'DIFF' | 'SPREAD',
  leftPrice: number,
  rightSidePrice?: number | null
): number => {
  if (relationshipType === 'FP' || !rightSidePrice) {
    return leftPrice;
  }
  
  // For DIFF and SPREAD, return absolute difference
  return Math.abs(leftPrice - rightSidePrice);
};

/**
 * Returns true if the product is a pricing instrument that should be included
 * in the exposure table
 */
export const isPricingInstrument = (product: string): boolean => {
  // These are the only products that should appear in the exposure table
  const pricingInstruments = [
    'ICE GASOIL FUTURES',
    'Platts LSGO',
    'Platts Diesel',
    'Argus UCOME',
    'Argus FAME0',
    'Argus RME',
    'Argus HVO'
  ];
  
  return pricingInstruments.includes(product);
};

/**
 * Check if the product should have a special background color in the exposure table
 */
export const shouldUseSpecialBackground = (product: string): boolean => {
  const specialBackgroundProducts = [
    'ICE GASOIL FUTURES',
    'Platts LSGO',
    'Platts Diesel',
  ];
  
  return specialBackgroundProducts.includes(product);
};

/**
 * Returns the appropriate background color class for a product in the exposure table
 * Used for styling the header cells in the exposure column
 */
export const getExposureProductBackgroundClass = (
  product: string, 
  isTotal: boolean = false,
  isPricingInstrumentTotal: boolean = false
): string => {
  if (isTotal) {
    return 'bg-gray-500'; // Total Row background - keep gray
  }
  
  if (isPricingInstrumentTotal) {
    return 'bg-purple-300'; // Changed to light purple for pricing instrument total
  }
  
  // Light purple background for specific pricing instruments
  if (shouldUseSpecialBackground(product)) {
    return 'bg-purple-300'; // Changed to light purple (#D6BCFA equivalent in Tailwind)
  }
  
  // Default background for biodiesel products
  return 'bg-green-600';
};
````

## File: src/utils/subscriptionUtils.ts
````typescript
import { supabase } from '@/integrations/supabase/client';

/**
 * Clean up all subscriptions to avoid memory leaks and ensure proper resource management
 * @param channelRefs Record containing channel references to be cleaned up
 */
export const cleanupSubscriptions = (channelRefs: Record<string, any>) => {
  console.log("Cleaning up all subscriptions");
  Object.keys(channelRefs).forEach(key => {
    if (channelRefs[key]) {
      try {
        supabase.removeChannel(channelRefs[key]);
        channelRefs[key] = null;
      } catch (e) {
        console.error(`Error removing channel ${key}:`, e);
      }
    }
  });
};

/**
 * Utility function to create a controlled delay between operations
 * @param ms Milliseconds to delay
 */
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Pause realtime subscriptions without removing them completely
 * This prevents the costly cycle of removing and recreating subscriptions
 * @param channelRefs Record containing channel references to be paused
 */
export const pauseSubscriptions = (channelRefs: Record<string, any>) => {
  console.log("Pausing realtime subscriptions");
  Object.keys(channelRefs).forEach(key => {
    if (channelRefs[key]) {
      try {
        // Set a flag that we can check in message handlers
        channelRefs[key].isPaused = true;
        console.log(`Paused channel: ${key}`);
      } catch (e) {
        console.error(`Error pausing channel ${key}:`, e);
      }
    }
  });
};

/**
 * Resume realtime subscriptions that were previously paused
 * @param channelRefs Record containing channel references to be resumed
 */
export const resumeSubscriptions = (channelRefs: Record<string, any>) => {
  console.log("Resuming realtime subscriptions");
  Object.keys(channelRefs).forEach(key => {
    if (channelRefs[key]) {
      try {
        // Remove the paused flag so handlers will process messages again
        channelRefs[key].isPaused = false;
        console.log(`Resumed channel: ${key}`);
      } catch (e) {
        console.error(`Error resuming channel ${key}:`, e);
      }
    }
  });
};
````

## File: src/utils/tradeUtils.ts
````typescript
// Generate a unique trade reference
export const generateTradeReference = (): string => {
  // Format: YYMMDD-XXXXX where XXXXX is a random 5-digit number
  const date = new Date();
  const year = date.getFullYear().toString().slice(2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(10000 + Math.random() * 90000);
  
  return `${year}${month}${day}-${random}`;
};

// Generate a leg reference from a trade reference
export const generateLegReference = (tradeReference: string, legNumber: number): string => {
  const suffix = String.fromCharCode(97 + legNumber); // 0 -> 'a', 1 -> 'b', etc.
  return `${tradeReference}-${suffix}`;
};

// Format a leg reference for display
export const formatLegReference = (tradeReference: string, legReference: string): string => {
  // If the leg reference already contains the trade reference, just return the leg reference
  if (legReference && legReference.startsWith(tradeReference)) {
    return legReference;
  }
  
  // Otherwise, if there's a suffix in the leg reference, append it to the trade reference
  if (legReference && legReference.includes('-')) {
    const suffix = legReference.split('-').pop();
    return `${tradeReference}-${suffix}`;
  }
  
  // Fallback: just return the trade reference
  return tradeReference;
};

// Format product display name based on relationship type (for Trades table UI)
export const formatProductDisplay = (
  product: string,
  relationshipType: string,
  rightSideProduct?: string
): string => {
  if (!product) return '';
  
  switch (relationshipType) {
    case 'FP':
      return `${product} FP`;
    case 'DIFF':
      if (rightSideProduct) {
        return `${product}/${rightSideProduct}`;
      }
      return `${product}/LSGO`;
    case 'SPREAD':
      if (rightSideProduct) {
        return `${product}/${rightSideProduct}`;
      }
      return `${product} SPREAD`;
    default:
      return product;
  }
};

// Format MTM formula display (for MTM calculations and formula display)
export const formatMTMDisplay = (
  product: string,
  relationshipType: string,
  rightSideProduct?: string
): string => {
  if (!product) return '';
  
  switch (relationshipType) {
    case 'FP':
      return `${product} FP`;
    case 'DIFF':
      return `${product} DIFF`;
    case 'SPREAD':
      if (rightSideProduct) {
        return `${product}-${rightSideProduct}`;
      }
      return `${product}`;
    default:
      return product;
  }
};

// Calculate open quantity for a trade
export const calculateOpenQuantity = (
  quantity: number, 
  tolerance: number,
  scheduledQuantity: number
): number => {
  const maxQuantity = quantity * (1 + tolerance / 100);
  return Math.max(0, maxQuantity - scheduledQuantity);
};

// Format a date to a standard display format
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Updated to exclude Paper column when calculating netExposure
export const calculateNetExposure = (
  physical: number,
  pricing: number
): number => {
  return physical + pricing;
};

// Generate instrument name from product and relationship type (for database storage)
export const generateInstrumentName = (
  product: string,
  relationshipType: string,
  rightSideProduct?: string
): string => {
  switch (relationshipType) {
    case 'FP':
      return `${product} FP`;
    case 'DIFF':
      return `${product} DIFF`;
    case 'SPREAD':
      if (rightSideProduct) {
        return `${product}-${rightSideProduct} SPREAD`;
      }
      return `${product} SPREAD`;
    default:
      return product;
  }
};

// Function to check if a product is a pricing instrument
export const isPricingInstrument = (product: string): boolean => {
  const pricingInstruments = ['ICE GASOIL FUTURES', 'Platts LSGO', 'Platts Diesel'];
  return pricingInstruments.includes(product);
};
````

## File: src/utils/validationUtils.ts
````typescript
/**
 * Utility functions for form validation
 */

import { toast } from "sonner";

/**
 * Validates that a date range is valid (start date is before or equal to end date)
 */
export const validateDateRange = (
  startDate: Date | null | undefined,
  endDate: Date | null | undefined,
  rangeName: string
): boolean => {
  if (!startDate || !endDate) {
    toast.error(`${rangeName} missing`, {
      description: `Please select both start and end dates for ${rangeName}.`
    });
    return false;
  }

  if (startDate > endDate) { // Changed from >= to > to allow equal dates
    toast.error(`Invalid ${rangeName}`, {
      description: `${rangeName} end date must not be before start date.`
    });
    return false;
  }

  return true;
};

/**
 * Validates that a required field has a value
 */
export const validateRequiredField = (
  value: string | number | undefined | null,
  fieldName: string
): boolean => {
  // Check for empty strings, undefined, null, or zero values
  if (value === undefined || value === null || value === '') {
    toast.error(`${fieldName} required`, {
      description: `Please select or enter a value for ${fieldName}.`
    });
    return false;
  }
  
  // Allow zero for price fields but not for other numeric fields
  if (typeof value === 'number' && value < 0) {
    toast.error(`Invalid ${fieldName}`, {
      description: `${fieldName} must be zero or greater.`
    });
    return false;
  }

  return true;
};

/**
 * Validates a form with multiple fields at once and returns overall result
 */
export const validateFields = (validations: boolean[]): boolean => {
  return validations.every(isValid => isValid);
};
````

## File: src/App.css
````css
#root {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.react:hover {
  filter: drop-shadow(0 0 2em #61dafbaa);
}

@keyframes logo-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: no-preference) {
  a:nth-of-type(2) .logo {
    animation: logo-spin infinite 20s linear;
  }
}

.card {
  padding: 2em;
}

.read-the-docs {
  color: #888;
}
````

## File: src/App.tsx
````typescript
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import TradesPage from "./pages/trades/TradesPage";
import TradeEntryPage from "./pages/trades/TradeEntryPage";
import TradeEditPage from "./pages/trades/TradeEditPage";
import TradeDeletePage from "./pages/trades/TradeDeletePage";
import PaperTradeEditPage from "./pages/trades/PaperTradeEditPage";
import PaperTradeDeletePage from "./pages/trades/PaperTradeDeletePage";
import OperationsPage from "./pages/operations/OperationsPage";
import ExposurePage from "./pages/risk/ExposurePage";
import AuditLogPage from "./pages/audit/AuditLogPage";
import ProfilePage from "./pages/profile/ProfilePage";
import PricingAdminPage from "./pages/pricing/PricingAdminPage";
import MTMPage from "./pages/risk/MTMPage";
import PNLPage from "./pages/risk/PNLPage";
import PricesPage from "./pages/risk/PricesPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            
            {/* Trade Routes */}
            <Route path="/trades" element={<TradesPage />} />
            <Route path="/trades/new" element={<TradeEntryPage />} />
            
            {/* Physical Trade Routes */}
            <Route path="/trades/edit/:id" element={<TradeEditPage />} />
            <Route path="/trades/:id" element={<TradeEditPage />} />
            <Route path="/trades/delete/:id" element={<TradeDeletePage />} />
            <Route path="/trades/delete/:id/leg/:legId" element={<TradeDeletePage />} />
            
            {/* Paper Trade Routes */}
            <Route path="/trades/paper/edit/:id" element={<PaperTradeEditPage />} />
            <Route path="/trades/paper/delete/:id" element={<PaperTradeDeletePage />} />
            <Route path="/trades/paper/delete/:id/leg/:legId" element={<PaperTradeDeletePage />} />
            
            {/* Operations Routes */}
            <Route path="/operations" element={<OperationsPage />} />
            <Route path="/operations/:id" element={<NotFound />} />
            
            {/* Risk Routes */}
            <Route path="/risk/mtm" element={<MTMPage />} />
            <Route path="/risk/pnl" element={<PNLPage />} />
            <Route path="/risk/exposure" element={<ExposurePage />} />
            <Route path="/risk/prices" element={<PricesPage />} />
            
            {/* Pricing Routes - Admin Section */}
            <Route path="/pricing/admin" element={<PricingAdminPage />} />
            
            {/* Audit Log Routes */}
            <Route path="/audit" element={<AuditLogPage />} />
            
            {/* Profile and Settings */}
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<NotFound />} />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
````

## File: src/index.css
````css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;

    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;

    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;

    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;

    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;

    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;

    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;

    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;

    --radius: 0.5rem;

    --sidebar-background: 0 0% 98%;

    --sidebar-foreground: 240 5.3% 26.1%;

    --sidebar-primary: 240 5.9% 10%;

    --sidebar-primary-foreground: 0 0% 98%;

    --sidebar-accent: 240 4.8% 95.9%;

    --sidebar-accent-foreground: 240 5.9% 10%;

    --sidebar-border: 220 13% 91%;

    --sidebar-ring: 217.2 91.2% 59.8%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;

    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;

    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;

    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;

    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;

    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;

    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;

    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;

    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
    --sidebar-background: 240 5.9% 10%;
    --sidebar-foreground: 240 4.8% 95.9%;
    --sidebar-primary: 224.3 76.3% 48%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 240 3.7% 15.9%;
    --sidebar-accent-foreground: 240 4.8% 95.9%;
    --sidebar-border: 240 3.7% 15.9%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }
}

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
  }
}
````

## File: src/main.tsx
````typescript
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);
````

## File: src/vite-env.d.ts
````typescript
/// <reference types="vite/client" />
````

## File: supabase/config.toml
````toml
project_id = "btwnoflfuiucxzqfqvgk"
````

## File: .gitignore
````
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
````

## File: components.json
````json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
````

## File: database_backup_2103.sql
````sql
-- DATABASE STRUCTURE BACKUP (March 21st, 2024)
-- This file contains the SQL commands to recreate the database schema
-- It can be used to restore the database structure if needed

-- Step 1: Create reference data tables

-- Counterparties table
CREATE TABLE IF NOT EXISTS public.counterparties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Credit status options
CREATE TABLE IF NOT EXISTS public.credit_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Incoterms table
CREATE TABLE IF NOT EXISTS public.inco_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Payment terms table
CREATE TABLE IF NOT EXISTS public.payment_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Sustainability options table
CREATE TABLE IF NOT EXISTS public.sustainability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Brokers table
CREATE TABLE IF NOT EXISTS public.brokers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Step 2: Create pricing related tables

-- Pricing instruments table
CREATE TABLE IF NOT EXISTS public.pricing_instruments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_code TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Historical prices table
CREATE TABLE IF NOT EXISTS public.historical_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_id UUID NOT NULL REFERENCES pricing_instruments(id),
  price_date DATE NOT NULL,
  price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Forward prices table
CREATE TABLE IF NOT EXISTS public.forward_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_id UUID NOT NULL REFERENCES pricing_instruments(id),
  forward_month DATE NOT NULL,
  price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 3: Create paper trading related tables

-- Paper trade products table
CREATE TABLE IF NOT EXISTS public.paper_trade_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code TEXT NOT NULL,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL,
  base_product TEXT,
  paired_product TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Product relationships table
CREATE TABLE IF NOT EXISTS public.product_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  paired_product TEXT,
  default_opposite TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Trading periods table
CREATE TABLE IF NOT EXISTS public.trading_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_code TEXT NOT NULL,
  period_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Step 4: Create main trading tables

-- Parent trades table
CREATE TABLE IF NOT EXISTS public.parent_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_reference TEXT NOT NULL,
  trade_type TEXT NOT NULL,
  physical_type TEXT,
  counterparty TEXT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trade legs table
CREATE TABLE IF NOT EXISTS public.trade_legs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_trade_id UUID NOT NULL REFERENCES parent_trades(id) ON DELETE CASCADE,
  leg_reference TEXT NOT NULL,
  buy_sell TEXT NOT NULL,
  product TEXT NOT NULL,
  sustainability TEXT,
  inco_term TEXT,
  quantity NUMERIC NOT NULL,
  tolerance NUMERIC,
  loading_period_start DATE,
  loading_period_end DATE,
  pricing_period_start DATE,
  pricing_period_end DATE,
  unit TEXT,
  payment_term TEXT,
  credit_status TEXT,
  pricing_formula JSONB,
  broker TEXT,
  instrument TEXT,
  price NUMERIC,
  calculated_price NUMERIC,
  last_calculation_date TIMESTAMP WITH TIME ZONE,
  mtm_formula JSONB,
  mtm_calculated_price NUMERIC,
  mtm_last_calculation_date TIMESTAMP WITH TIME ZONE,
  trading_period TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 5: Enable realtime functionality
-- Run these commands to enable real-time on the main tables
ALTER PUBLICATION supabase_realtime ADD TABLE parent_trades, trade_legs;
ALTER TABLE parent_trades REPLICA IDENTITY FULL;
ALTER TABLE trade_legs REPLICA IDENTITY FULL;

-- Step 6: Add documentation comments
COMMENT ON TABLE parent_trades IS 'Stores the main trade information';
COMMENT ON TABLE trade_legs IS 'Stores individual legs of trades';
COMMENT ON TABLE pricing_instruments IS 'Stores pricing instruments available for formulas';
COMMENT ON TABLE historical_prices IS 'Historical price data for instruments';
COMMENT ON TABLE forward_prices IS 'Forward price curves for instruments';
COMMENT ON TABLE paper_trade_products IS 'Products specific to paper trading';
COMMENT ON TABLE product_relationships IS 'Defines relationships between products for paper trading';
COMMENT ON TABLE trading_periods IS 'Trading periods for paper trades';
````

## File: db_backup_1303.sql
````sql
-- DATABASE SCHEMA BACKUP (March 13th)
-- This file contains the SQL commands to recreate the database schema as of 13/03/2024
-- It can be used to restore the database structure if needed

-- Counterparties table
CREATE TABLE IF NOT EXISTS public.counterparties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Credit status options
CREATE TABLE IF NOT EXISTS public.credit_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Forward prices table
CREATE TABLE IF NOT EXISTS public.forward_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_id UUID NOT NULL REFERENCES pricing_instruments(id),
  forward_month DATE NOT NULL,
  price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Historical prices table
CREATE TABLE IF NOT EXISTS public.historical_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_id UUID NOT NULL REFERENCES pricing_instruments(id),
  price_date DATE NOT NULL,
  price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Incoterms table
CREATE TABLE IF NOT EXISTS public.inco_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Parent trades table
CREATE TABLE IF NOT EXISTS public.parent_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_reference TEXT NOT NULL,
  trade_type TEXT NOT NULL,
  physical_type TEXT,
  counterparty TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Payment terms table
CREATE TABLE IF NOT EXISTS public.payment_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Pricing instruments table
CREATE TABLE IF NOT EXISTS public.pricing_instruments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_code TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Sustainability options table
CREATE TABLE IF NOT EXISTS public.sustainability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Trade legs table
CREATE TABLE IF NOT EXISTS public.trade_legs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_trade_id UUID NOT NULL REFERENCES parent_trades(id),
  leg_reference TEXT NOT NULL,
  buy_sell TEXT NOT NULL,
  product TEXT NOT NULL,
  sustainability TEXT,
  inco_term TEXT,
  quantity NUMERIC NOT NULL,
  tolerance NUMERIC,
  loading_period_start DATE,
  loading_period_end DATE,
  pricing_period_start DATE,
  pricing_period_end DATE,
  unit TEXT,
  payment_term TEXT,
  credit_status TEXT,
  pricing_formula JSONB,
  broker TEXT,
  instrument TEXT,
  price NUMERIC,
  calculated_price NUMERIC,
  last_calculation_date TIMESTAMP WITH TIME ZONE,
  mtm_formula JSONB,
  mtm_calculated_price NUMERIC,
  mtm_last_calculation_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create comment for documentation
COMMENT ON TABLE parent_trades IS 'Stores the main trade information';
COMMENT ON TABLE trade_legs IS 'Stores individual legs of trades';
COMMENT ON TABLE pricing_instruments IS 'Stores pricing instruments available for formulas';
COMMENT ON TABLE historical_prices IS 'Historical price data for instruments';
COMMENT ON TABLE forward_prices IS 'Forward price curves for instruments';
````

## File: eslint.config.js
````javascript
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",
    },
  }
);
````

## File: index.html
````html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>biodiesel-trader-pro</title>
    <meta name="description" content="Lovable Generated Project" />
    <meta name="author" content="Lovable" />
    <meta property="og:image" content="/og-image.png" />
  </head>

  <body>
    <div id="root"></div>
    <!-- IMPORTANT: DO NOT REMOVE THIS SCRIPT TAG OR THIS VERY COMMENT! -->
    <script src="https://cdn.gpteng.co/gptengineer.js" type="module"></script>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
````

## File: package.json
````json
{
  "name": "vite_react_shadcn_ts",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:dev": "vite build --mode development",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.9.0",
    "@radix-ui/react-accordion": "^1.2.0",
    "@radix-ui/react-alert-dialog": "^1.1.1",
    "@radix-ui/react-aspect-ratio": "^1.1.0",
    "@radix-ui/react-avatar": "^1.1.0",
    "@radix-ui/react-checkbox": "^1.1.1",
    "@radix-ui/react-collapsible": "^1.1.0",
    "@radix-ui/react-context-menu": "^2.2.1",
    "@radix-ui/react-dialog": "^1.1.2",
    "@radix-ui/react-dropdown-menu": "^2.1.1",
    "@radix-ui/react-hover-card": "^1.1.1",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-menubar": "^1.1.1",
    "@radix-ui/react-navigation-menu": "^1.2.0",
    "@radix-ui/react-popover": "^1.1.1",
    "@radix-ui/react-progress": "^1.1.0",
    "@radix-ui/react-radio-group": "^1.2.0",
    "@radix-ui/react-scroll-area": "^1.1.0",
    "@radix-ui/react-select": "^2.1.1",
    "@radix-ui/react-separator": "^1.1.0",
    "@radix-ui/react-slider": "^1.2.0",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-switch": "^1.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-toast": "^1.2.1",
    "@radix-ui/react-toggle": "^1.1.0",
    "@radix-ui/react-toggle-group": "^1.1.0",
    "@radix-ui/react-tooltip": "^1.1.4",
    "@supabase/supabase-js": "^2.49.1",
    "@tanstack/react-query": "^5.56.2",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.0.0",
    "date-fns": "^3.6.0",
    "embla-carousel-react": "^8.3.0",
    "input-otp": "^1.2.4",
    "lucide-react": "^0.462.0",
    "next-themes": "^0.3.0",
    "react": "^18.3.1",
    "react-day-picker": "^8.10.1",
    "react-dom": "^18.3.1",
    "react-helmet-async": "^2.0.5",
    "react-hook-form": "^7.53.0",
    "react-resizable-panels": "^2.1.3",
    "react-router-dom": "^6.26.2",
    "recharts": "^2.12.7",
    "sonner": "^1.5.0",
    "tailwind-merge": "^2.5.2",
    "tailwindcss-animate": "^1.0.7",
    "vaul": "^0.9.3",
    "xlsx": "^0.18.5",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@eslint/js": "^9.9.0",
    "@tailwindcss/typography": "^0.5.15",
    "@types/node": "^22.5.5",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react-swc": "^3.5.0",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.9.0",
    "eslint-plugin-react-hooks": "^5.1.0-rc.0",
    "eslint-plugin-react-refresh": "^0.4.9",
    "globals": "^15.9.0",
    "lovable-tagger": "^1.1.7",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.11",
    "typescript": "^5.5.3",
    "typescript-eslint": "^8.0.1",
    "vite": "^5.4.1"
  }
}
````

## File: PAPER_TRADE_IMPLEMENTATION_PLAN.md
````markdown
# Paper Trade Implementation Plan

This document outlines the comprehensive plan for implementing the paper trade system, including database structure, UI components, and business logic.

## 1. Database Structure Updates

### A. Brokers Management
```sql
CREATE TABLE public.brokers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT true
);

-- Initial broker
INSERT INTO public.brokers (name) VALUES ('Marex');
```

### B. Product Relationships
```sql
CREATE TABLE public.product_relationships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product TEXT NOT NULL,
    relationship_type TEXT NOT NULL CHECK (relationship_type IN ('DIFF', 'SPREAD', 'FP')),
    paired_product TEXT,
    default_opposite TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Initial relationships
INSERT INTO public.product_relationships 
(product, relationship_type, paired_product, default_opposite) VALUES
-- FP (Fixed Price) products - single sided
('UCOME FP', 'FP', NULL, NULL),
('RME FP', 'FP', NULL, NULL), 
('FAME0 FP', 'FP', NULL, NULL),

-- DIFF products - paired with LSGO
('UCOME DIFF', 'DIFF', 'UCOME', 'LSGO'),
('RME DIFF', 'DIFF', 'RME', 'LSGO'),
('FAME0 DIFF', 'DIFF', 'FAME0', 'LSGO'),

-- SPREAD products - paired products
('RME-FAME', 'SPREAD', 'RME', 'FAME0'),
('UCOME-FAME', 'SPREAD', 'UCOME', 'FAME0'),
('UCOME-RME', 'SPREAD', 'UCOME', 'RME');
```

## 2. Core Components

### Page Structure
```typescript
interface PaperTradePage {
  // Trade Details Section
  header: {
    comment: string;
    broker: string;
  }
  
  // Trade Table Section
  tradeTable: {
    rows: TradeLeg[];
    mtmFormula: FormulaConfig[];
  }
  
  // Exposure Table Section
  exposureTable: {
    months: string[];
    products: string[];
    exposures: Record<string, Record<string, number>>;
  }
}
```

### Layout Blueprint
```
NEW TRADE - PAPER                                [Cancel] [Create Trade]
------------------------------------------------
Comment: [Text Input]
Broker:  [Marex ▼] [+ Add Broker]

Trade Table:
-----------
LEFT SIDE                         RIGHT SIDE                        MTM
[+]                             
Product  Qty   Period  Price     Product  Qty   Period  Price    Formula   Period
[Dynamic Rows with + button on left side only]

Exposure Table:
--------------
[Fixed Headers: UCOME, FAME0, RME, HVO, LSGO, ICE GASOIL FUTURES]
[12 Month Rows with real-time position updates]
```

## 3. Business Logic

### A. Trade Table Logic

#### Row Addition Rules
- Each row represents a trade leg that needs to be logged in the database
- Plus (+) button exists only on the LEFT SIDE
- When user selects a product on LEFT SIDE, the RIGHT SIDE product is auto-determined
- Only 9 specific products should be available in the dropdown: UCOME FP, RME FP, FAME0 FP, UCOME DIFF, RME DIFF, FAME0 DIFF, RME-FAME, UCOME-FAME, UCOME-RME

#### Product Relationship Rules
1. **Fixed Price (FP) Products**:
   - When selecting UCOME FP, RME FP, or FAME0 FP:
   - LEFT SIDE: Contains the selected product
   - RIGHT SIDE: Completely empty (no product, quantity, period, or price)
   - This is a single-sided trade

2. **Differential (DIFF) Products**:
   - When selecting UCOME DIFF, RME DIFF, or FAME0 DIFF:
   - LEFT SIDE: Automatically populated with base product (UCOME, RME, or FAME0)
   - RIGHT SIDE: Automatically populated with LSGO
   - Quantities are opposite (if LEFT is +1000, RIGHT is -1000)
   - Periods are the same for both sides

3. **Spread Products**:
   - When selecting RME-FAME, UCOME-FAME, or UCOME-RME:
   - LEFT SIDE: First product in the name (RME, UCOME)
   - RIGHT SIDE: Second product in the name (FAME0, RME)
   - Quantities are opposite (if LEFT is +1000, RIGHT is -1000)
   - Periods are the same for both sides

#### Auto-Population Flow
1. User clicks "+" on LEFT SIDE
2. User selects product from dropdown (limited to the 9 products)
3. Based on product type:
   - For FP products (e.g., UCOME FP):
     * LEFT SIDE product = UCOME FP
     * RIGHT SIDE remains completely empty
   - For DIFF products (e.g., UCOME DIFF):
     * LEFT SIDE product = UCOME
     * RIGHT SIDE product = LSGO
   - For SPREAD products (e.g., RME-FAME):
     * LEFT SIDE product = RME
     * RIGHT SIDE product = FAME0
4. User inputs on LEFT:
   - Quantity (e.g., +1000)
   - Period (e.g., Apr-25)
   - Price (e.g., 500)
5. System automatically sets on RIGHT (except for FP products):
   - Quantity = opposite of LEFT (-1000)
   - Period = same as LEFT (Apr-25)
   - Price field remains empty for user input
6. MTM formula is automatically set based on the selected product

#### Product Rules
```typescript
const productRules = {
  'FP': {
    // For fixed price products
    singleSided: true,
    // No right side product
  },
  'DIFF': {
    // For diff products like UCOME diff
    leftProduct: function(product) {
      // Extract base product from relationship
      return getPairedProduct(product); // e.g., 'UCOME'
    },
    rightProduct: function(product) {
      // Get default opposite from relationship
      return getDefaultOpposite(product); // Always 'LSGO' for DIFF
    },
    quantityBehavior: 'opposite'
  },
  'SPREAD': {
    // For spread products like RME-FAME
    leftProduct: function(product) {
      // Extract first product from relationship
      return getPairedProduct(product); // e.g., 'RME'
    },
    rightProduct: function(product) {
      // Extract second product from relationship
      return getDefaultOpposite(product); // e.g., 'FAME0'
    },
    quantityBehavior: 'opposite'
  }
};
```

### B. Exposure Table Implementation

#### Structure
```typescript
interface ExposureRow {
  month: string;
  UCOME: number;
  FAME0: number;
  RME: number;
  HVO: number;
  LSGO: number;
  ICE_GASOIL_FUTURES: number;
}
```

#### Update Triggers
- New row addition
- Product changes
- Quantity modifications
- Period adjustments
- Row deletions

#### Calculation Rules
- Buy positions: Add positive quantity
- Sell positions: Add negative quantity
- Group by month
- Only populate relevant columns
- Real-time updates

### C. MTM Formula Rules

The MTM formula is now product-dependent:
- For Product FP (Fixed Price): MTM = Product FP
- For Product DIFF (e.g., UCOME DIFF): MTM = Product DIFF
- For Spread products (e.g., RME-FAME): MTM = Product spread name (e.g., "RME-FAME")

This means the formula is automatically determined by the product selection.

### D. Validation Rules

#### Comment
- Required field
- Non-empty string

#### Broker
- Required selection
- Must be active broker

#### Trade Rows
- Valid product selections
- Non-zero quantities
- Valid period selections
- Price validation when required

#### Exposure
- Balanced positions for spreads
- Valid product relationships
- Period alignment

## 4. UI Components

### A. Trade Table Component
```typescript
interface TradeTableProps {
  rows: TradeLeg[];
  onAddRow: () => void;
  onUpdateLeftSide: (index: number, updates: Partial<TradeLeg>) => void;
  onUpdateRightSide: (index: number, updates: Partial<TradeLeg>) => void;
  onRemoveRow: (index: number) => void;
}
```

### B. Exposure Table Component
```typescript
interface ExposureTableProps {
  data: ExposureRow[];
  highlightedProduct?: string;
  onExposureClick?: (month: string, product: string) => void;
}
```

### C. Broker Management Component
```typescript
interface BrokerManagementProps {
  brokers: Broker[];
  selectedBrokerId: string;
  onSelectBroker: (id: string) => void;
  onAddBroker: (name: string) => void;
}
```

## 5. State Management

```typescript
interface PageState {
  comment: string;
  brokerId: string;
  trades: {
    rows: TradeLeg[];
  };
  exposures: ExposureRow[];
  validation: ValidationState;
  isDirty: boolean;
}
```

## 6. Data Flow

```
User Input → Validation → Database
    ↓
Trade Table Updates
    ↓
Auto-population Rules
    ↓
Exposure Calculation
    ↓
Real-time UI Updates
```

## 7. Error Handling

- Form validation errors
- Auto-population failures
- Calculation errors
- Database errors
- Network issues

## 8. Performance Optimizations

- Memoized calculations
- Batched updates
- Virtual scrolling for large datasets
- Debounced real-time updates

## 9. Integration Points

### A. With Existing Trade System
- Leverage existing types
- Match data structures
- Use established validation patterns

### B. With Pricing Engine
- Ensure formula compatibility
- Connect to price calculation flows
- Support MTM formula integration

## 10. Testing Strategy

### A. Unit Tests
- Component rendering
- Business logic validation
- Calculation accuracy

### B. Integration Tests
- Trade creation flow
- Database interactions
- State management

### C. Test Data
- Create sample dataset with at least 90 days of historical prices
- Include weekends and holidays to test date handling
- Test with multiple instruments (UCOME, RME, FAME0, LSGO, diesel)
- Create sample forward curves for at least 6 months

## 11. Status Tracking

- **Database Setup**: Not Started
- **Core Components**: Not Started
- **Trade Table Logic**: Not Started
- **Exposure Table Implementation**: Not Started
- **UI Component Development**: Not Started
- **State Management**: Not Started
- **Integration**: Not Started
- **Testing**: Not Started

## 12. Considerations

1. **Performance**: For large trade histories, optimize calculations
2. **Fallbacks**: Define logic for incomplete data
3. **Permissions**: Determine who can create vs. who can only view trades
4. **Validation**: No invalid trades - comprehensive validation approach

## 13. Next Steps

1. Review plan with stakeholders
2. Prioritize components for development
3. Create database structure
4. Implement core UI components
5. Develop business logic and integration points
6. Test thoroughly
7. Document usage for end users
````

## File: postcss.config.js
````javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
````

## File: proration_pricing_exposure.md
````markdown
# Implementation Plan: Prorated Pricing Exposure for Physical Trades

This document outlines the detailed implementation plan for enhancing the physical trade system to support prorated pricing exposure calculations across multiple months based on business days.

## Overview

The current system assigns all pricing exposure to a single month based on the loading period start date. The enhanced system will distribute pricing exposure across months covered by the pricing period, proportionally based on the number of business days in each month.

## Core Requirements

1. Physical exposure will remain based solely on the loading period start date and will not be prorated.
2. Pricing exposure will be prorated across months based on business days within the pricing period.
3. Monthly distribution data will be pre-calculated and stored within the trade data structure.
4. Rounding will preserve the sign of the exposure values.
5. **The layout of the exposure table MUST NOT be changed in any way.**
6. **All existing functionality must be preserved without any regression.**

## Implementation Steps

### Step 1: Create Business Day Calculation Utilities

Add new utility functions to handle business day calculations in `src/utils/dateUtils.ts`:

```typescript
/**
 * Checks if a date is a business day (Monday-Friday)
 * @param date The date to check
 * @returns True if the date is a business day
 */
export function isBusinessDay(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6; // 0 = Sunday, 6 = Saturday
}

/**
 * Counts business days between two dates, inclusive
 * @param startDate Start date (inclusive)
 * @param endDate End date (inclusive)
 * @returns Number of business days
 */
export function countBusinessDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const currentDate = new Date(startDate);
  
  // Set to beginning of day
  currentDate.setHours(0, 0, 0, 0);
  
  // Create end date copy and set to end of day
  const endDateCopy = new Date(endDate);
  endDateCopy.setHours(23, 59, 59, 999);
  
  while (currentDate <= endDateCopy) {
    if (isBusinessDay(currentDate)) {
      count++;
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return count;
}

/**
 * Groups business days by month for a given date range
 * @param startDate Start date of the range (inclusive)
 * @param endDate End date of the range (inclusive)
 * @returns Object with month codes as keys and business day counts as values
 */
export function getBusinessDaysByMonth(startDate: Date, endDate: Date): Record<string, number> {
  const result: Record<string, number> = {};
  const currentDate = new Date(startDate);
  
  // Set to beginning of day
  currentDate.setHours(0, 0, 0, 0);
  
  // Create end date copy and set to end of day
  const endDateCopy = new Date(endDate);
  endDateCopy.setHours(23, 59, 59, 999);
  
  while (currentDate <= endDateCopy) {
    if (isBusinessDay(currentDate)) {
      const monthCode = formatMonthCode(currentDate);
      
      if (!result[monthCode]) {
        result[monthCode] = 0;
      }
      
      result[monthCode]++;
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return result;
}

/**
 * Rounds a number to the nearest integer while preserving the sign
 * @param value The number to round
 * @returns Rounded integer with preserved sign
 */
export function roundWithSign(value: number): number {
  return value >= 0 ? Math.round(value) : -Math.round(Math.abs(value));
}

/**
 * Splits a value proportionally across months based on business day distribution,
 * ensuring the total remains the same after rounding
 * @param value The value to distribute
 * @param businessDaysByMonth Business days per month
 * @returns Distribution of the value by month
 */
export function distributeValueByBusinessDays(
  value: number,
  businessDaysByMonth: Record<string, number>
): Record<string, number> {
  const totalBusinessDays = Object.values(businessDaysByMonth).reduce((sum, days) => sum + days, 0);
  
  if (totalBusinessDays === 0) {
    return {};
  }
  
  const distribution: Record<string, number> = {};
  let remainingValue = value;
  let processedMonths = 0;
  const totalMonths = Object.keys(businessDaysByMonth).length;
  
  // Sort months chronologically to ensure consistent distribution
  const sortedMonths = Object.keys(businessDaysByMonth).sort((a, b) => {
    const [monthA, yearA] = a.split('-');
    const [monthB, yearB] = b.split('-');
    return (parseInt(yearA) * 100 + getMonthIndex(monthA)) - (parseInt(yearB) * 100 + getMonthIndex(monthB));
  });
  
  for (const month of sortedMonths) {
    processedMonths++;
    const businessDays = businessDaysByMonth[month];
    const proportion = businessDays / totalBusinessDays;
    
    // For the last month, use the remaining value to ensure the total matches exactly
    if (processedMonths === totalMonths) {
      distribution[month] = remainingValue;
    } else {
      const monthValue = value * proportion;
      const roundedValue = roundWithSign(monthValue);
      distribution[month] = roundedValue;
      remainingValue -= roundedValue;
    }
  }
  
  return distribution;
}

/**
 * Helper function to get month index from month code
 * @param monthCode Three-letter month code (e.g., "Jan")
 * @returns Month index (0-11)
 */
function getMonthIndex(monthCode: string): number {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months.indexOf(monthCode);
}
```

### Step 2: Update Type Definitions

Update the PricingFormula type in `src/types/pricing.ts` to include monthly distribution:

```typescript
export interface MonthlyDistribution {
  [instrument: string]: {
    [monthCode: string]: number; // Month code format: "MMM-YY" (e.g., "Mar-24")
  };
}

export interface PricingFormula {
  tokens: FormulaToken[];
  exposures: ExposureResult;
  monthlyDistribution?: MonthlyDistribution; // Added this field
}
```

### Step 3: Create Monthly Distribution Generation Function

Add a function in `src/utils/formulaCalculation.ts` to generate the monthly distribution:

```typescript
/**
 * Calculate the monthly distribution of pricing exposure
 * @param formula The pricing formula
 * @param quantity Trade quantity
 * @param buySell Buy or sell direction
 * @param pricingPeriodStart Start of pricing period
 * @param pricingPeriodEnd End of pricing period
 * @returns Monthly distribution object
 */
export function calculateMonthlyPricingDistribution(
  formula: FormulaToken[],
  quantity: number,
  buySell: BuySell,
  pricingPeriodStart: Date,
  pricingPeriodEnd: Date
): MonthlyDistribution {
  // Get base pricing exposures
  const basePricingExposures = calculatePricingExposure(formula, quantity, buySell);
  
  // Get business days distribution by month
  const businessDaysByMonth = getBusinessDaysByMonth(pricingPeriodStart, pricingPeriodEnd);
  
  // Initialize result
  const monthlyDistribution: MonthlyDistribution = {};
  
  // For each instrument with non-zero exposure, distribute across months
  Object.entries(basePricingExposures).forEach(([instrument, totalExposure]) => {
    if (totalExposure === 0) return;
    
    monthlyDistribution[instrument] = distributeValueByBusinessDays(totalExposure, businessDaysByMonth);
  });
  
  return monthlyDistribution;
}
```

### Step 4: Update Physical Trade Form Component

Modify `src/components/trades/PhysicalTradeForm.tsx` to calculate and store monthly distribution:

1. Import the new function:
   ```typescript
   import { calculateMonthlyPricingDistribution } from '@/utils/formulaCalculation';
   ```

2. Update the formula change handler to calculate monthly distribution:
   ```typescript
   const handleFormulaChange = (formula: PricingFormula, legIndex: number) => {
     const newLegs = [...legs];
     
     // Store the formula
     newLegs[legIndex].formula = formula;
     
     // Calculate monthly distribution if we have valid pricing period dates
     if (newLegs[legIndex].pricingPeriodStart && newLegs[legIndex].pricingPeriodEnd) {
       const monthlyDistribution = calculateMonthlyPricingDistribution(
         formula.tokens,
         newLegs[legIndex].quantity || 0,
         newLegs[legIndex].buySell,
         newLegs[legIndex].pricingPeriodStart,
         newLegs[legIndex].pricingPeriodEnd
       );
       
       // Add monthly distribution to formula
       newLegs[legIndex].formula.monthlyDistribution = monthlyDistribution;
     }
     
     setLegs(newLegs);
   };
   ```

3. Also update the pricing period date change handlers to recalculate distribution:
   ```typescript
   const updateLeg = (index: number, field: keyof LegFormState, value: string | Date | number | PricingFormula | undefined) => {
     const newLegs = [...legs];
     
     // Set the field value
     if (field === 'formula' || field === 'mtmFormula') {
       (newLegs[index] as any)[field] = value as PricingFormula;
     } else if (
       field === 'loadingPeriodStart' || 
       field === 'loadingPeriodEnd' || 
       field === 'pricingPeriodStart' || 
       field === 'pricingPeriodEnd'
     ) {
       (newLegs[index] as any)[field] = value as Date;
       
       // If pricing period dates changed, recalculate monthly distribution
       if (field === 'pricingPeriodStart' || field === 'pricingPeriodEnd') {
         const leg = newLegs[index];
         
         if (leg.formula && leg.pricingPeriodStart && leg.pricingPeriodEnd) {
           const monthlyDistribution = calculateMonthlyPricingDistribution(
             leg.formula.tokens,
             leg.quantity || 0,
             leg.buySell,
             leg.pricingPeriodStart,
             leg.pricingPeriodEnd
           );
           
           // Update monthly distribution
           leg.formula = {
             ...leg.formula,
             monthlyDistribution
           };
         }
       }
     } else if (field === 'buySell') {
       (newLegs[index] as any)[field] = value as BuySell;
       
       // Recalculate monthly distribution when buySell changes
       const leg = newLegs[index];
       if (leg.formula && leg.pricingPeriodStart && leg.pricingPeriodEnd) {
         const monthlyDistribution = calculateMonthlyPricingDistribution(
           leg.formula.tokens,
           leg.quantity || 0,
           value as BuySell,
           leg.pricingPeriodStart,
           leg.pricingPeriodEnd
         );
         
         // Update monthly distribution
         leg.formula = {
           ...leg.formula,
           monthlyDistribution
         };
       }
     } else if (field === 'quantity') {
       (newLegs[index] as any)[field] = Number(value);
       
       // Recalculate monthly distribution when quantity changes
       const leg = newLegs[index];
       if (leg.formula && leg.pricingPeriodStart && leg.pricingPeriodEnd) {
         const monthlyDistribution = calculateMonthlyPricingDistribution(
           leg.formula.tokens,
           Number(value) || 0,
           leg.buySell,
           leg.pricingPeriodStart,
           leg.pricingPeriodEnd
         );
         
         // Update monthly distribution
         leg.formula = {
           ...leg.formula,
           monthlyDistribution
         };
       }
     } else {
       (newLegs[index] as any)[field] = value;
     }
     
     setLegs(newLegs);
   };
   ```

### Step 5: Update Exposure Page to Use Monthly Distribution Data

Modify the exposure calculation in `src/pages/risk/ExposurePage.tsx` to use the pre-calculated monthly distribution:

```typescript
// Helper function to get the month code for a trade leg
const getMonthCodeForTrade = (trade: PhysicalTrade | PhysicalTradeLeg): string => {
  const date = trade.loadingPeriodStart;
  return formatMonthCode(date);
};

// Process physical trades for exposure calculation
const processPhysicalTrades = (trades: PhysicalTrade[], selectedPeriod: string): ExposureData => {
  const exposureData: ExposureData = initializeExposureData();
  
  trades.forEach((trade) => {
    trade.legs.forEach((leg) => {
      // Process physical exposure - based on loading period start date
      const loadingMonthCode = getMonthCodeForTrade(leg);
      
      if (loadingMonthCode === selectedPeriod) {
        const physicalExposure = leg.formula?.exposures?.physical || {};
        
        // Add physical exposure to the selected period
        Object.entries(physicalExposure).forEach(([product, amount]) => {
          if (amount !== 0) {
            exposureData.physical[product] = (exposureData.physical[product] || 0) + amount;
          }
        });
      }
      
      // Process pricing exposure - use monthly distribution if available
      if (leg.formula?.monthlyDistribution) {
        // Use pre-calculated monthly distribution
        Object.entries(leg.formula.monthlyDistribution).forEach(([instrument, monthlyValues]) => {
          if (monthlyValues[selectedPeriod]) {
            exposureData.pricing[instrument] = (exposureData.pricing[instrument] || 0) + monthlyValues[selectedPeriod];
          }
        });
      } else {
        // Fallback to old method if monthly distribution is not available
        const pricingMonthCode = getMonthCodeForTrade(leg);
        
        if (pricingMonthCode === selectedPeriod) {
          const pricingExposure = leg.formula?.exposures?.pricing || {};
          
          Object.entries(pricingExposure).forEach(([product, amount]) => {
            if (amount !== 0) {
              exposureData.pricing[product] = (exposureData.pricing[product] || 0) + amount;
            }
          });
        }
      }
    });
  });
  
  return exposureData;
};
```

## Testing Plan

1. **Unit Tests**
   - Test the new business day calculation utilities
   - Test the distribution calculation with various date ranges
   - Test the rounding with sign preservation

2. **Integration Tests**
   - Create trades with pricing periods spanning multiple months
   - Verify that physical exposure is assigned to the month of loading start date
   - Verify that pricing exposure is distributed across months based on business days
   - Check rounding behavior and ensure total exposure matches before/after distribution

3. **Edge Cases**
   - Test when pricing period has no business days
   - Test when pricing period spans many months
   - Test with very small quantities where rounding could cause issues
   - Test when pricing period start/end dates are on weekends

## Implementation Verification Checklist

- [ ] Business day calculation functions are accurate
- [ ] Monthly distribution is calculated correctly
- [ ] Types are properly updated and used
- [ ] Physical trade form updates distribution when required fields change
- [ ] Exposure page correctly uses the monthly distribution data
- [ ] All edge cases have been addressed
- [ ] Performance remains acceptable
- [ ] **No changes have been made to the exposure table layout**
- [ ] **All existing hooks and files are correctly imported**
- [ ] **All syntax has been double-checked for errors**
- [ ] **No existing functionality has been broken**

## Example Trade Scenario

1. **Trade Details**:
   - Buy 1000 MT of UCOME
   - Loading period: March 28, 2024
   - Pricing period: March 20, 2024 - April 15, 2024
   - Pricing formula: Platts Diesel + 500
   - MTM formula: Argus UCOME

2. **Business Days Analysis**:
   - March 2024: 8 business days (March 20-29, excluding weekends)
   - April 2024: 14 business days (April 1-15, excluding weekends)
   - Total: 22 business days

3. **Expected Monthly Distribution**:
   - Physical exposure:
     - Mar-24: +1000 MT UCOME (based on loading date)
   - Pricing exposure:
     - Mar-24: -364 MT Diesel (8/22 * -1000, rounded)
     - Apr-24: -636 MT Diesel (14/22 * -1000, rounded)

4. **Verification**:
   - Total physical exposure remains 1000 MT
   - Total pricing exposure remains -1000 MT
   - Physical exposure is in loading month only
   - Pricing exposure is distributed based on business days
````

## File: README.md
````markdown
# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/e0114225-e7c6-4062-b99e-aefedfd7923d

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/e0114225-e7c6-4062-b99e-aefedfd7923d) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/e0114225-e7c6-4062-b99e-aefedfd7923d) and click on Share -> Publish.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)
````

## File: Supabase schema 2103.md
````markdown
# Supabase Database Schema Documentation (21 March)

This document serves as a comprehensive backup of the Supabase database schema as of March 21. It contains detailed information about each table, its columns, relationships, and how they connect to the application code. This can be used to recreate the database from scratch if needed.

## Core Tables

### `parent_trades`

The parent table for all trades in the system. Each trade has a parent record and one or more legs.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| trade_reference | TEXT | No | None | Unique reference code for the trade |
| trade_type | TEXT | No | None | Type of trade ('physical' or 'paper') |
| physical_type | TEXT | Yes | None | For physical trades: 'spot' or 'term' |
| counterparty | TEXT | No | None | The counterparty for this trade |
| comment | TEXT | Yes | None | Optional comments about the trade |
| created_at | TIMESTAMP WITH TIME ZONE | No | now() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | No | now() | Last update timestamp |

**Realtime Configuration:**
- REPLICA IDENTITY: FULL
- Added to supabase_realtime publication

**Code Relations:**
- Mapped to `ParentTrade` and `Trade` interfaces in `src/types/common.ts`
- Used in `fetchTrades()` in `src/hooks/useTrades.ts`
- Physical trades use physical_type field, while paper trades leave it null

### `trade_legs`

Contains the individual legs for each trade. Every parent_trade has at least one trade_leg.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| parent_trade_id | UUID | No | None | Foreign key to parent_trades.id |
| leg_reference | TEXT | No | None | Reference code for this leg |
| buy_sell | TEXT | No | None | 'buy' or 'sell' |
| product | TEXT | No | None | Product being traded |
| sustainability | TEXT | Yes | None | Sustainability certification |
| inco_term | TEXT | Yes | None | Incoterm for physical deliveries |
| quantity | NUMERIC | No | None | Quantity being traded |
| tolerance | NUMERIC | Yes | None | Allowed tolerance percentage |
| loading_period_start | DATE | Yes | None | Start of loading period for physical |
| loading_period_end | DATE | Yes | None | End of loading period for physical |
| pricing_period_start | DATE | Yes | None | Start of pricing period |
| pricing_period_end | DATE | Yes | None | End of pricing period |
| unit | TEXT | Yes | None | Unit of measurement (MT, KG, L) |
| payment_term | TEXT | Yes | None | Payment terms |
| credit_status | TEXT | Yes | None | Credit approval status |
| pricing_formula | JSONB | Yes | None | Formula for pricing calculations |
| broker | TEXT | Yes | None | Broker for paper trades |
| instrument | TEXT | Yes | None | Instrument for paper trades |
| price | NUMERIC | Yes | None | Fixed price (for paper trades) |
| calculated_price | NUMERIC | Yes | None | Calculated price from formula |
| last_calculation_date | TIMESTAMP WITH TIME ZONE | Yes | None | When price was last calculated |
| mtm_formula | JSONB | Yes | None | Mark-to-market formula |
| mtm_calculated_price | NUMERIC | Yes | None | Mark-to-market calculated price |
| mtm_last_calculation_date | TIMESTAMP WITH TIME ZONE | Yes | None | When MTM was last calculated |
| created_at | TIMESTAMP WITH TIME ZONE | No | now() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | No | now() | Last update timestamp |
| trading_period | TEXT | Yes | None | Trading period for paper trades |

**Realtime Configuration:**
- REPLICA IDENTITY: FULL
- Added to supabase_realtime publication

**Code Relations:**
- Physical legs map to `PhysicalTradeLeg` interface in `src/types/physical.ts`
- Paper legs map to `PaperTradeLeg` interface in `src/types/trade.ts`
- Foreign key relationship to parent_trades
- Used in both physical and paper trade forms

**Database Constraints:**
- Foreign key to parent_trades(id) with CASCADE delete

## Reference Data Tables

### `products`

Reference data for products that can be traded.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| created_at | TIMESTAMP WITH TIME ZONE | No | timezone('utc'::text, now()) | Creation timestamp |
| name | TEXT | No | None | Product name |

**Code Relations:**
- Used for product dropdown selections in trade forms
- Maps to `Product` type in `src/types/trade.ts`

### `counterparties`

List of trading counterparties.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| created_at | TIMESTAMP WITH TIME ZONE | No | timezone('utc'::text, now()) | Creation timestamp |
| name | TEXT | No | None | Counterparty name |

**Code Relations:**
- Used for counterparty dropdown selections in trade forms

### `inco_terms`

International Commercial Terms for physical deliveries.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| created_at | TIMESTAMP WITH TIME ZONE | No | timezone('utc'::text, now()) | Creation timestamp |
| name | TEXT | No | None | Incoterm name (FOB, CIF, etc.) |

**Code Relations:**
- Maps to `IncoTerm` type in `src/types/trade.ts`
- Used in physical trade forms

### `payment_terms`

Available payment terms for trades.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| created_at | TIMESTAMP WITH TIME ZONE | No | timezone('utc'::text, now()) | Creation timestamp |
| name | TEXT | No | None | Payment term description |

**Code Relations:**
- Maps to `PaymentTerm` type in `src/types/trade.ts`
- Used in physical trade forms

### `sustainability`

Sustainability certification options for products.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| created_at | TIMESTAMP WITH TIME ZONE | No | timezone('utc'::text, now()) | Creation timestamp |
| name | TEXT | No | None | Sustainability certification name |

**Code Relations:**
- Used for sustainability dropdown selections in physical trade forms

### `credit_status`

Available credit approval status options.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| created_at | TIMESTAMP WITH TIME ZONE | No | timezone('utc'::text, now()) | Creation timestamp |
| name | TEXT | No | None | Credit status name |

**Code Relations:**
- Maps to `CreditStatus` type in `src/types/trade.ts`
- Used in physical trade forms

### `brokers`

List of brokers for paper trades.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| created_at | TIMESTAMP WITH TIME ZONE | Yes | now() | Creation timestamp |
| is_active | BOOLEAN | Yes | true | Whether broker is active |
| name | TEXT | No | None | Broker name |

**Code Relations:**
- Used for broker dropdown selections in paper trade forms

## Paper Trading Tables

### `paper_trade_products`

Products specific to paper trading.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| created_at | TIMESTAMP WITH TIME ZONE | Yes | now() | Creation timestamp |
| is_active | BOOLEAN | Yes | true | Whether product is active |
| product_code | TEXT | No | None | Product code |
| display_name | TEXT | No | None | Display name |
| category | TEXT | No | None | Product category |
| base_product | TEXT | Yes | None | Base product reference |
| paired_product | TEXT | Yes | None | Paired product for spreads |

**Code Relations:**
- Used in paper trade forms for product selection

### `product_relationships`

Defines relationships between products for paper trading.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| created_at | TIMESTAMP WITH TIME ZONE | Yes | now() | Creation timestamp |
| product | TEXT | No | None | Product code |
| relationship_type | TEXT | No | None | Type of relationship (FP, DIFF, SPREAD) |
| paired_product | TEXT | Yes | None | Related product |
| default_opposite | TEXT | Yes | None | Default opposite for diffs |

**Code Relations:**
- Maps to `ProductRelationship` interface in `src/types/trade.ts`
- Used to construct paper trade formulas

### `trading_periods`

Trading periods for paper trades.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| start_date | DATE | No | None | Period start date |
| end_date | DATE | No | None | Period end date |
| created_at | TIMESTAMP WITH TIME ZONE | Yes | now() | Creation timestamp |
| is_active | BOOLEAN | Yes | true | Whether period is active |
| period_code | TEXT | No | None | Period code (e.g., 'JUN23') |
| period_type | TEXT | No | None | Period type |

**Code Relations:**
- Used for period selection in paper trades

## Pricing Tables

### `pricing_instruments`

Instruments used for pricing calculations.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| is_active | BOOLEAN | Yes | true | Whether instrument is active |
| created_at | TIMESTAMP WITH TIME ZONE | No | now() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | No | now() | Last update timestamp |
| instrument_code | TEXT | No | None | Instrument code |
| display_name | TEXT | No | None | Display name |
| description | TEXT | Yes | None | Description |
| category | TEXT | Yes | None | Category |

**Code Relations:**
- Used in pricing formula construction
- Referenced in formula tokens

### `historical_prices`

Historical price data for instruments.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| instrument_id | UUID | No | None | Foreign key to pricing_instruments |
| price_date | DATE | No | None | Date of price |
| price | NUMERIC | No | None | Price value |
| created_at | TIMESTAMP WITH TIME ZONE | No | now() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | No | now() | Last update timestamp |

**Code Relations:**
- Used for historical price displays and calculations
- Referenced by MTM calculations

### `forward_prices`

Forward curve prices for instruments.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| instrument_id | UUID | No | None | Foreign key to pricing_instruments |
| forward_month | DATE | No | None | Forward month |
| price | NUMERIC | No | None | Price value |
| created_at | TIMESTAMP WITH TIME ZONE | No | now() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | No | now() | Last update timestamp |
| id | UUID | No | gen_random_uuid() | Primary key |

**Code Relations:**
- Used for forward curve displays and calculations
- Referenced by pricing formulas

## Database-Code Relationship

### Interface Mapping

The database tables map to TypeScript interfaces in the application code:

1. `parent_trades` + `trade_legs` → `PhysicalTrade` in `src/types/physical.ts` and `PaperTrade` in `src/types/trade.ts`
2. `trade_legs` (physical) → `PhysicalTradeLeg` in `src/types/physical.ts`
3. `trade_legs` (paper) → `PaperTradeLeg` in `src/types/trade.ts`
4. `pricing_formula` + `mtm_formula` fields → `PricingFormula` in `src/types/pricing.ts`

### Data Access Layer

The main hooks that access the database include:

1. `useTrades` in `src/hooks/useTrades.ts` - Handles physical trades
2. `usePaperTrades` in `src/hooks/usePaperTrades.ts` - Handles paper trades
3. `useHistoricalPrices` in `src/hooks/useHistoricalPrices.ts` - Manages price data
4. `useReferenceData` in `src/hooks/useReferenceData.ts` - Fetches reference data

### Realtime Subscription

The database uses Supabase's realtime functionality to keep the UI in sync with database changes:

```typescript
// Example from useTrades.ts
const parentTradesChannel = supabase
  .channel('physical_parent_trades')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'parent_trades',
    filter: 'trade_type=eq.physical'
  }, () => {
    debouncedRefetch(refetch);
  })
  .subscribe();
```

Both `parent_trades` and `trade_legs` tables have REPLICA IDENTITY set to FULL to ensure complete row data is available in change events.

## Database Recreation Instructions

To recreate this database structure from scratch:

1. Create the reference data tables first (products, counterparties, etc.)
2. Create the main trade tables (parent_trades, trade_legs)
3. Create the pricing and paper trading specific tables
4. Add the realtime configuration to tables that need it

The SQL to create the core trade tables:

```sql
-- Step 1: Create the parent_trades table
CREATE TABLE IF NOT EXISTS public.parent_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_reference TEXT NOT NULL,
  trade_type TEXT NOT NULL,
  physical_type TEXT,
  counterparty TEXT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 2: Create the trade_legs table
CREATE TABLE IF NOT EXISTS public.trade_legs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_trade_id UUID NOT NULL REFERENCES parent_trades(id) ON DELETE CASCADE,
  leg_reference TEXT NOT NULL,
  buy_sell TEXT NOT NULL,
  product TEXT NOT NULL,
  sustainability TEXT,
  inco_term TEXT,
  quantity NUMERIC NOT NULL,
  tolerance NUMERIC,
  loading_period_start DATE,
  loading_period_end DATE,
  pricing_period_start DATE,
  pricing_period_end DATE,
  unit TEXT,
  payment_term TEXT,
  credit_status TEXT,
  pricing_formula JSONB,
  broker TEXT,
  instrument TEXT,
  price NUMERIC,
  calculated_price NUMERIC,
  last_calculation_date TIMESTAMP WITH TIME ZONE,
  mtm_formula JSONB,
  mtm_calculated_price NUMERIC,
  mtm_last_calculation_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  trading_period TEXT
);

-- Step 3: Enable realtime functionality
ALTER PUBLICATION supabase_realtime ADD TABLE parent_trades, trade_legs;
ALTER TABLE parent_trades REPLICA IDENTITY FULL;
ALTER TABLE trade_legs REPLICA IDENTITY FULL;
```
````

## File: system-architecture.md
````markdown
# CTRM System Architecture Document

## 1. Architecture Overview

### 1.1 Architecture Pattern: Modular Monolith

The CTRM system follows a modular monolith architecture, which combines the simplicity of monolithic deployment with the organizational benefits of modular design. This approach is ideal for this system because:

- It maintains data consistency across the tightly coupled trade lifecycle
- It simplifies development and deployment
- It allows for clear module boundaries while enabling efficient data access
- It supports future decomposition into microservices if needed

### 1.2 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      CTRM Application                            │
│                                                                 │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐    │
│  │   Trade   │  │ Operations│  │  Finance  │  │ Reporting │    │
│  │  Module   │  │  Module   │  │  Module   │  │  Module   │    │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘    │
│        │              │              │              │           │
│        └──────────────┼──────────────┼──────────────┘           │
│                       │              │                          │
│  ┌───────────────────────────────────────────────────┐         │
│  │               Core Services                        │         │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐      │         │
│  │  │ API Client│  │ Auth      │  │ Events    │      │         │
│  │  └───────────┘  └───────────┘  └───────────┘      │         │
│  └───────────────────────────────────────────────────┘         │
│                       │              │                          │
│  ┌───────────────────────────────────────────────────┐         │
│  │               UI Components                        │         │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐      │         │
│  │  │ Layout    │  │ Forms     │  │ Tables    │      │         │
│  │  └───────────┘  └───────────┘  └───────────┘      │         │
│  └───────────────────────────────────────────────────┘         │
│                       │                                         │
└───────────────────────┼─────────────────────────────────────────┘
                        │
┌───────────────────────┼─────────────────────────────────────────┐
│                    Supabase                                     │
│  ┌───────────────────────────────────────────────────┐         │
│  │              PostgreSQL Database                   │         │
│  └───────────────────────────────────────────────────┘         │
│  ┌───────────────────────────────────────────────────┐         │
│  │                  Auth                              │         │
│  └───────────────────────────────────────────────────┘         │
│  ┌───────────────────────────────────────────────────┐         │
│  │                  Storage                           │         │
│  └───────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Module Structure and Responsibilities

### 2.1 Business Domain Modules

#### 2.1.1 Trade Module

**Responsibility**: Manage the creation, editing, and viewing of trade data.

**Key Components**:
- Physical Trade Form
- Paper Trade Form
- Trade Detail View
- Pricing Formula Builder
- MTM Formula Selection

**Services**:
- TradeService: CRUD operations for trades
- PricingFormulaService: Create and evaluate pricing formulas
- TradeValidationService: Validate trade data

#### 2.1.2 Operations Module

**Responsibility**: Manage the scheduling and execution of trade movements.

**Key Components**:
- Movement Scheduling Form
- Movement Detail Form
- Open Trades List
- Movement Calendar View
- Movement Status Tracking

**Services**:
- MovementService: CRUD operations for movements
- ScheduleValidationService: Validate scheduling against open quantity
- ActualizationService: Process actualized movements

#### 2.1.3 Finance Module

**Responsibility**: Manage invoices, payments, and financial settlements.

**Key Components**:
- Invoice Generation Form
- Payment Tracking View
- Financial Status Dashboard
- Credit/Debit Note Generation

**Services**:
- InvoiceService: Generate and manage invoices
- PaymentService: Track and process payments
- SettlementService: Calculate final settlements

#### 2.1.4 Reporting Module

**Responsibility**: Generate exposure, MTM, and other reports.

**Key Components**:
- Exposure Report View
- MTM Report View
- Position Dashboard
- P&L Report View

**Services**:
- ExposureService: Calculate exposure positions
- MTMService: Calculate mark-to-market valuations
- ReportGenerationService: Generate standardized reports

#### 2.1.5 Admin Module

**Responsibility**: Manage reference data and system settings.

**Key Components**:
- Counterparty Management
- Product Management
- Pricing Instrument Management
- User Management
- Historical Price Management

**Services**:
- ReferenceDataService: Manage reference data entities
- UserManagementService: Manage user accounts
- PriceManagementService: Manage historical and forward prices

### 2.2 Core Services

#### 2.2.1 API Service

**Responsibility**: Handle communication with the Supabase backend.

**Key Components**:
- SupabaseClient: Wrapper around Supabase client
- QueryClient: React Query client configuration
- APIHooks: Custom hooks for data fetching

#### 2.2.2 Authentication Service

**Responsibility**: Manage user authentication and authorization.

**Key Components**:
- AuthProvider: Context provider for authentication state
- AuthGuard: Component to protect routes
- LoginForm: User authentication interface

#### 2.2.3 Event Service

**Responsibility**: Manage internal application events.

**Key Components**:
- EventBus: Publish-subscribe mechanism for cross-module communication
- EventHandlers: Module-specific event handlers
- EventLogger: Log all events for debugging

## 3. Database Schema

### 3.1 Core Trade Tables

#### parent_trades
- id (UUID, PK)
- trade_reference (TEXT)
- trade_type (TEXT) - 'physical' or 'paper'
- physical_type (TEXT) - 'spot' or 'term'
- counterparty (TEXT)
- comment (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

#### trade_legs
- id (UUID, PK)
- parent_trade_id (UUID, FK to parent_trades)
- leg_reference (TEXT)
- buy_sell (TEXT) - 'buy' or 'sell'
- product (TEXT)
- sustainability (TEXT)
- inco_term (TEXT)
- quantity (NUMERIC)
- tolerance (NUMERIC)
- loading_period_start (DATE)
- loading_period_end (DATE)
- pricing_period_start (DATE)
- pricing_period_end (DATE)
- unit (TEXT)
- payment_term (TEXT)
- credit_status (TEXT)
- pricing_formula (JSONB)
- broker (TEXT)
- instrument (TEXT)
- price (NUMERIC)
- calculated_price (NUMERIC)
- last_calculation_date (TIMESTAMP)
- mtm_formula (JSONB)
- mtm_calculated_price (NUMERIC)
- mtm_last_calculation_date (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- trading_period (TEXT)

### 3.2 Operations Tables

#### movements (New)
- id (UUID, PK)
- trade_leg_id (UUID, FK to trade_legs)
- movement_reference (TEXT)
- status (TEXT) - 'scheduled', 'nominated', 'loading', 'completed'
- nominated_date (DATE)
- nomination_valid_date (DATE)
- cash_flow_date (DATE)
- vessel_name (TEXT)
- loadport (TEXT)
- disport (TEXT)
- inspector (TEXT)
- bl_date (DATE)
- bl_quantity (NUMERIC)
- actualized (BOOLEAN)
- actualized_date (DATE)
- actualized_quantity (NUMERIC)
- comments (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### 3.3 Finance Tables

#### invoices (New)
- id (UUID, PK)
- movement_id (UUID, FK to movements)
- invoice_reference (TEXT)
- invoice_type (TEXT) - 'prepayment', 'final', 'credit', 'debit'
- invoice_date (DATE)
- due_date (DATE)
- amount (NUMERIC)
- currency (TEXT)
- status (TEXT) - 'draft', 'issued', 'paid'
- calculated_price (NUMERIC)
- quantity (NUMERIC)
- vat_rate (NUMERIC)
- vat_amount (NUMERIC)
- total_amount (NUMERIC)
- comments (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

#### payments (New)
- id (UUID, PK)
- invoice_id (UUID, FK to invoices)
- payment_reference (TEXT)
- payment_date (DATE)
- amount (NUMERIC)
- currency (TEXT)
- payment_method (TEXT)
- comments (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### 3.4 Reference Data Tables

#### products
- id (UUID, PK)
- name (TEXT)
- created_at (TIMESTAMP)

#### counterparties (Enhanced)
- id (UUID, PK)
- name (TEXT)
- vat_number (TEXT) (New)
- bank_details (JSONB) (New)
- contact_details (JSONB) (New)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

#### inco_terms
- id (UUID, PK)
- name (TEXT)
- created_at (TIMESTAMP)

#### payment_terms
- id (UUID, PK)
- name (TEXT)
- created_at (TIMESTAMP)

#### sustainability
- id (UUID, PK)
- name (TEXT)
- created_at (TIMESTAMP)

#### credit_status
- id (UUID, PK)
- name (TEXT)
- created_at (TIMESTAMP)

#### pricing_instruments
- id (UUID, PK)
- instrument_code (TEXT)
- display_name (TEXT)
- description (TEXT)
- category (TEXT)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

#### historical_prices
- id (UUID, PK)
- instrument_id (UUID, FK to pricing_instruments)
- price_date (DATE)
- price (NUMERIC)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

#### forward_prices
- id (UUID, PK)
- instrument_id (UUID, FK to pricing_instruments)
- forward_month (DATE)
- price (NUMERIC)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### 3.5 Audit Tables

#### audit_logs (New)
- id (UUID, PK)
- table_name (TEXT)
- record_id (UUID)
- operation (TEXT) - 'INSERT', 'UPDATE', 'DELETE'
- old_data (JSONB)
- new_data (JSONB)
- user_id (UUID)
- timestamp (TIMESTAMP)

## 4. State Management

### 4.1 Server State Management

The application uses React Query for all server state management:

1. **QueryClient Configuration**:
   - Default stale time: 5 minutes
   - Cache time: 30 minutes
   - Retry logic for failed queries
   - Global error handling

2. **Query Structure**:
   - Queries organized by domain (trades, operations, finance)
   - Common patterns for pagination, filtering, and sorting
   - Consistent error handling

3. **Mutation Patterns**:
   - Optimistic updates for improved UX
   - Automatic refetching of affected queries
   - Error handling with rollback capability

### 4.2 Client State Management

For client-only state that doesn't need to be persisted to the server:

1. **React Context**:
   - AuthContext: Authentication state
   - UIContext: Global UI state (theme, sidebar state)
   - NotificationContext: Application notifications

2. **Form State**:
   - React Hook Form for all forms
   - Zod schemas for validation
   - Form state isolated to form components

3. **URL State**:
   - Use URL parameters for filterable/searchable views
   - Maintain state in URL for shareable links
   - React Router for navigation state

## 5. UI Component Organization

### 5.1 Component Hierarchy

1. **Layout Components**:
   - AppLayout: Main application layout with navigation
   - DashboardLayout: Layout for dashboard pages
   - FormLayout: Layout for form pages
   - ReportLayout: Layout for report pages

2. **Page Components**:
   - One component per route/page
   - Compose from smaller components
   - Handle data fetching via hooks
   - Minimal business logic

3. **Feature Components**:
   - Domain-specific components
   - Composed of UI components
   - May contain business logic
   - Typically correspond to a specific feature

4. **UI Components**:
   - Small, reusable components
   - No business logic
   - Styling via Tailwind CSS
   - Based on shadcn/ui library

### 5.2 UI Component Guidelines

1. **Composition**:
   - Prefer composition over inheritance
   - Use children props for flexible components
   - Create higher-order components for common patterns

2. **Props**:
   - Use detailed TypeScript interfaces for props
   - Provide sensible defaults
   - Validate required props

3. **Styling**:
   - Use Tailwind CSS for all styling
   - Create consistent spacing and sizing
   - Follow design system guidelines

4. **Accessibility**:
   - Ensure proper ARIA attributes
   - Support keyboard navigation
   - Maintain sufficient color contrast

## 6. API Design

### 6.1 Supabase Integration

The application uses Supabase for data storage and authentication:

1. **Client Setup**:
   ```typescript
   import { createClient } from '@supabase/supabase-js';

   export const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL,
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
   );
   ```

2. **Data Access Patterns**:
   - Use RLS (Row Level Security) for authorization
   - Use Supabase realtime for live updates
   - Wrap Supabase calls in service functions

3. **Authentication**:
   - Use Supabase Auth for user management
   - Implement session persistence
   - Create protected routes

### 6.2 Service Layer

Each module has its own service layer that abstracts Supabase calls:

1. **Service Structure**:
   ```typescript
   // Example Trade Service
   export const TradeService = {
     async getTrades(filters?: TradeFilters): Promise<Trade[]> {
       let query = supabase
         .from('parent_trades')
         .select(`
           *,
           trade_legs(*)
         `)
         .eq('trade_type', 'physical');
         
       // Apply filters
       if (filters?.counterparty) {
         query = query.eq('counterparty', filters.counterparty);
       }
       
       const { data, error } = await query;
       if (error) throw error;
       return transformTrades(data);
     },
     
     async createTrade(trade: TradeCreateInput): Promise<Trade> {
       // Implementation
     },
     
     // Other methods
   };
   ```

2. **Error Handling**:
   - Consistent error objects
   - Error categorization (network, validation, server)
   - Detailed error messages

3. **Data Transformation**:
   - Transform database records to frontend models
   - Handle nested relationships
   - Apply business rules

## 7. File and Folder Structure

```
src/
├── modules/              # Business domain modules
│   ├── trade/            # Trade module
│   │   ├── components/   # Trade-specific components
│   │   │   ├── PhysicalTradeForm.tsx
│   │   │   ├── PaperTradeForm.tsx
│   │   │   ├── TradeList.tsx
│   │   │   ├── PricingFormulaBuilder.tsx
│   │   │   └── ...
│   │   ├── hooks/        # Trade-specific hooks
│   │   │   ├── useTrades.ts
│   │   │   ├── usePricingFormula.ts
│   │   │   └── ...
│   │   ├── services/     # Trade-specific services
│   │   │   ├── tradeService.ts
│   │   │   ├── formulaService.ts
│   │   │   └── ...
│   │   ├── utils/        # Trade-specific utilities
│   │   │   ├── tradeValidation.ts
│   │   │   ├── referenceGenerator.ts
│   │   │   └── ...
│   │   ├── types/        # Trade-specific types
│   │   │   ├── trade.ts
│   │   │   ├── formula.ts
│   │   │   └── ...
│   │   └── pages/        # Trade pages
│   │       ├── TradesPage.tsx
│   │       ├── CreateTradePage.tsx
│   │       ├── EditTradePage.tsx
│   │       └── ...
│   ├── operations/       # Operations module (similar structure)
│   ├── finance/          # Finance module (similar structure)
│   ├── reporting/        # Reporting module (similar structure)
│   └── admin/            # Admin module (similar structure)
├── core/                 # Shared core functionality
│   ├── api/              # API client and base services
│   │   ├── supabase.ts
│   │   ├── queryClient.ts
│   │   └── ...
│   ├── components/       # Shared UI components
│   │   ├── layout/
│   │   ├── forms/
│   │   ├── tables/
│   │   ├── feedback/
│   │   └── ...
│   ├── hooks/            # Shared custom hooks
│   │   ├── useAuth.ts
│   │   ├── useNotification.ts
│   │   └── ...
│   ├── utils/            # Shared utilities
│   │   ├── date.ts
│   │   ├── number.ts
│   │   ├── validation.ts
│   │   └── ...
│   └── types/            # Shared type definitions
│       ├── common.ts
│       ├── supabase.ts
│       └── ...
├── lib/                  # Third-party library wrappers
│   ├── shadcn/
│   └── ...
├── providers/            # Context providers
│   ├── AuthProvider.tsx
│   ├── NotificationProvider.tsx
│   └── ...
├── routes/               # Application routing
│   ├── routes.ts
│   ├── ProtectedRoute.tsx
│   └── ...
├── styles/               # Global styles
│   ├── globals.css
│   └── ...
├── App.tsx               # Application entry point
├── index.tsx             # Root render
└── vite-env.d.ts         # Vite type definitions
```

## 8. Cross-Cutting Concerns

### 8.1 Error Handling

1. **Error Boundaries**:
   - React error boundaries at module levels
   - Fallback UI for errors
   - Error reporting to logging service

2. **API Error Handling**:
   - Consistent error response format
   - Error categorization
   - Retry logic for transient errors

3. **Form Validation Errors**:
   - Client-side validation with Zod
   - Field-level error messages
   - Form-level error summaries

### 8.2 Logging

1. **Client-Side Logging**:
   - Log levels (debug, info, warn, error)
   - Contextual information
   - Error stack traces

2. **API Logging**:
   - Request/response logging
   - Performance metrics
   - Error details

3. **Audit Logging**:
   - Record all data modifications
   - Include user information
   - Maintain before/after state

### 8.3 Authentication and Authorization

1. **Authentication**:
   - Supabase Auth for identity management
   - Session persistence
   - Remember me functionality

2. **Authorization**:
   - Row Level Security in Supabase
   - Role-based access control (future)
   - Frontend route protection

### 8.4 Internationalization (Future)

1. **Translation Framework**:
   - i18next for string management
   - Locale selection
   - Right-to-left support

2. **Localized Formats**:
   - Date formatting
   - Number formatting
   - Currency formatting

## 9. Performance Considerations

### 9.1 Data Loading

1. **Query Optimization**:
   - Select only required fields
   - Use efficient joins
   - Implement pagination

2. **Caching Strategy**:
   - React Query caching
   - Stale-while-revalidate pattern
   - Prefetching for common navigation paths

3. **Loading States**:
   - Skeleton loaders
   - Progressive loading
   - Background data refreshing

### 9.2 Rendering Optimization

1. **Component Optimization**:
   - Memoization for expensive components
   - Virtual scrolling for large lists
   - Code splitting for large components

2. **Bundle Optimization**:
   - Dynamic imports
   - Tree shaking
   - Dependency optimization

## 10. Testing Strategy

### 10.1 Test Types

1. **Unit Tests**:
   - Test individual functions and components
   - Focus on business logic
   - Use Jest for test runner

2. **Integration Tests**:
   - Test module interactions
   - Test API integration
   - Use Testing Library for component testing

3. **End-to-End Tests**:
   - Test complete user flows
   - Simulate real user interactions
   - Use Cypress for E2E testing

### 10.2 Test Coverage

1. **Critical Paths**:
   - Trade creation and editing
   - Movement scheduling
   - Exposure calculations
   - Invoice generation

2. **Edge Cases**:
   - Error handling
   - Boundary conditions
   - Concurrent operations

## 11. Development Workflow

### 11.1 Feature Development Process

1. **Feature Definition**:
   - Clear requirements
   - Acceptance criteria
   - Technical design

2. **Implementation**:
   - Begin with data model
   - Implement services
   - Create UI components
   - Connect to services

3. **Testing**:
   - Write tests for business logic
   - Test UI components
   - End-to-end testing

4. **Review**:
   - Code review
   - Design review
   - Performance review

### 11.2 Code Quality

1. **Linting and Formatting**:
   - ESLint for code quality
   - Prettier for formatting
   - TypeScript strict mode

2. **Code Reviews**:
   - Focus on maintainability
   - Check for edge cases
   - Ensure test coverage

3. **Documentation**:
   - Code comments for complex logic
   - API documentation
   - Component documentation

## 12. Deployment and DevOps

### 12.1 Environments

1. **Development**:
   - Local development
   - Development database
   - Feature branches

2. **Staging**:
   - Production-like environment
   - Test data
   - Pre-release testing

3. **Production**:
   - Live environment
   - Real data
   - Monitoring and alerts

### 12.2 CI/CD

1. **Continuous Integration**:
   - Automated tests
   - Linting and type checking
   - Build verification

2. **Continuous Deployment**:
   - Automated deployment
   - Deployment verification
   - Rollback capability

## 13. Security Considerations

### 13.1 Data Security

1. **Authentication**:
   - Secure password policies
   - Multi-factor authentication (future)
   - Session management

2. **Authorization**:
   - Row Level Security
   - Principle of least privilege
   - Regular access reviews

3. **Data Protection**:
   - Data encryption at rest
   - Secure API communication
   - Sensitive data handling

### 13.2 Application Security

1. **Input Validation**:
   - Validate all inputs
   - Sanitize user input
   - Prevent injection attacks

2. **OWASP Top 10**:
   - Protection against common vulnerabilities
   - Regular security reviews
   - Security testing

## 14. Extensibility

### 14.1 Module Extension

1. **Adding New Features**:
   - Create in appropriate module
   - Follow existing patterns
   - Maintain separation of concerns

2. **Extending Existing Features**:
   - Identify extension points
   - Maintain backward compatibility
   - Update documentation

### 14.2 Third-Party Integration

1. **Integration Patterns**:
   - Adapter pattern for external services
   - Consistent error handling
   - Retry and fallback strategies

2. **API Gateways**:
   - Centralized integration point
   - Authentication and authorization
   - Rate limiting and caching

## 15. Conclusion

This architecture document provides a comprehensive blueprint for implementing the CTRM system as a modular monolith. It defines clear boundaries between modules while maintaining the ability to efficiently share data across the application.

By following this architecture, the development team can create a maintainable, extensible system that meets the complex requirements of the biodiesel trading workflow while setting the foundation for future growth and potential decomposition into microservices if needed.
````

## File: tailwind.config.ts
````typescript
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	safelist: [
		'text-green-600',
		'text-red-600',
		'text-white',
		'text-black',
		'text-muted-foreground',
		'bg-orange-800',
		'bg-green-800',
		'bg-blue-800',
		'bg-green-600',
		'bg-gray-100',
		'bg-gray-200',
		'bg-gray-300',
		'bg-gray-700',
		'bg-white',
		'bg-[#1A1F2C]',
		'bg-gray-500',
		'border-r-[1px]',
		'border-l-[1px]',
		'border-[1px]',
		'border-[2px]',
		'border-[3px]',
		'border-black',
		'border-gray-300',
		'font-bold',
		'text-xs',
		'text-sm',
		'text-lg',
		'text-xl',
		'text-2xl',
		'text-3xl'
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
````

## File: tsconfig.app.json
````json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitAny": false,
    "noFallthroughCasesInSwitch": false,

    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
````

## File: tsconfig.json
````json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "noImplicitAny": false,
    "noUnusedParameters": false,
    "skipLibCheck": true,
    "allowJs": true,
    "noUnusedLocals": false,
    "strictNullChecks": false
  }
}
````

## File: tsconfig.node.json
````json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,

    /* Linting */
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["vite.config.ts"]
}
````

## File: updated-prd.md
````markdown
# Commodity Trading and Risk Management (CTRM) System
# Project Requirements Document (PRD)

## 1. Executive Summary

The CTRM system is a highly integrated solution that tracks biodiesel trades from creation through execution, financial settlement, and exposure reporting. Based on analysis of real-world trade examples, a modular monolith architecture is the most appropriate approach for this system at this stage, as it provides:

1. **Data consistency** across tightly integrated workflows
2. **Simplified development** with faster iterations
3. **Cohesive domain model** that maintains relationships between trades, operations, and finance
4. **Efficient transaction processing** without the overhead of cross-service communication
5. **Easier maintenance** for a likely smaller team

The system requires real-time tracking of trade entries, operational movements, financial settlements, and exposure calculations - all domains that have significant interdependencies.

## 2. Project Overview

This project involves building a custom Commodity Trading and Risk Management (CTRM) system for a biodiesel trading team that handles the entire trade lifecycle. The system will track both physical and paper deals from entry through execution and financial settlement, with real-time exposure and MTM calculations.

### Key Objectives

- Create an intuitive interface for entering detailed trade information
- Track the complete lifecycle of trades from entry to settlement
- Provide real-time exposure and MTM reporting
- Support complex pricing formulas and calculations
- Manage movement scheduling and actualization
- Generate financial documents and track settlements
- Maintain a complete audit trail of all changes

## 3. Core Modules

### 3.1 Trade Entry Module

**Physical Trade Entry:**
- Counterparty, trade type (spot/term), buy/sell
- Product, sustainability certification, INCO terms
- Quantity, tolerance, units
- Loading period, pricing period
- Payment terms, credit status
- Pricing formula builder with support for complex formulas
- MTM formula selection

**Paper Trade Entry:**
- Instrument selection, pricing period
- Fixed price, broker
- Trading period

### 3.2 Operations Module

**Trade Movement Management:**
- List of all open trades with calculated open quantity
- Movement scheduling within open quantity constraints
- Movement detail capture:
  - Nomination details (date, valid date)
  - Vessel/barge information
  - Loadport and disport
  - Inspector details
  - BL date and quantity
  - Actualization status
  - Comments

### 3.3 Finance Module

**Invoice Management:**
- Prepayment invoice generation for applicable trades
- Final invoice calculation after actualization
- Payment status tracking
- Credit/debit notes for quantity/price adjustments
- VAT and tax calculations
- Link to counterparty details (VAT numbers, bank details)

### 3.4 Exposure & MTM Reporting

**Exposure Reporting:**
- Month-by-month, instrument-by-instrument breakdown
- Physical position (buy/sell)
- Pricing position based on formulas
- Paper position adjustments
- Net exposure calculation

**MTM Valuation:**
- Calculate MTM based on current market prices vs. formula
- Support for both actualized and non-actualized trades
- Historical MTM tracking

### 3.5 Administration Module

**Reference Data Management:**
- Counterparty management with banking and tax details
- Product and pricing instrument management
- Historical and forward price management
- User management (future)

## 4. Data Model (Key Entities)

Based on the Supabase schema and trade examples, the core entity relationships are:

1. **Trade Hierarchy**
   - Parent Trades (master record)
   - Trade Legs (specific details)
   - Movements (operational executions)
   - Financial Transactions (invoices, payments)

2. **Reference Data**
   - Counterparties (with extended financial details)
   - Products
   - Pricing Instruments
   - Price History (historical & forward prices)

3. **Calculation Models**
   - Pricing Formulas
   - MTM Formulas
   - Exposure Calculations

## 5. Architecture Approach

### 5.1 Modular Monolith Architecture

The recommended architecture is a modular monolith with the following characteristics:

- **Single Deployable Unit:** The entire application deployed as one unit
- **Well-Defined Module Boundaries:** Clear interfaces between modules
- **Domain-Driven Design:** Organize code around business domains
- **Shared Database:** Single database with schema separation by module
- **Event-Based Communication:** Use internal events for cross-module updates

### 5.2 Technology Stack

- **Frontend:** React with TypeScript and shadcn-ui (as per README)
- **Backend:** Node.js RESTful API
- **Database:** PostgreSQL via Supabase (as per existing schema)
- **State Management:** React Query for server state, Context API for UI state
- **Form Handling:** React Hook Form with Zod validation
- **Styling:** Tailwind CSS

## 6. Project Structure

```
src/
├── modules/              # Organized by business domain
│   ├── trade/            # Trade entry and management
│   │   ├── components/   # UI components specific to trades
│   │   ├── hooks/        # Trade-related data hooks
│   │   ├── services/     # Trade API services
│   │   ├── utils/        # Trade-specific utilities
│   │   └── types/        # Trade type definitions
│   ├── operations/       # Operations and movement management
│   ├── finance/          # Finance and invoice management
│   ├── exposure/         # Exposure and MTM reporting
│   └── admin/            # Reference data management
├── core/                 # Shared core functionality
│   ├── api/              # API client and base services
│   ├── components/       # Shared UI components
│   ├── hooks/            # Shared custom hooks
│   ├── utils/            # Shared utilities
│   └── types/            # Shared type definitions
├── lib/                  # Third-party library wrappers
├── providers/            # Context providers
├── routes/               # Application routing
└── App.tsx               # Application entry point
```

## 7. Development Roadmap

### Phase 1 (MVP): Core Trade Management (2-3 Months)
- Trade entry (physical and paper)
- Basic operations module
- Simple exposure reporting
- Reference data management

### Phase 2: Financial Integration (2 Months)
- Finance module implementation
- Invoice generation
- Payment tracking
- Integration with operations module

### Phase 3: Advanced Reporting (1-2 Months)
- Enhanced MTM calculations
- Improved exposure reporting
- Historical performance tracking
- Dashboard visualizations

### Phase 4: Operational Enhancements (2 Months)
- Demurrage calculations
- Storage tracking
- Mass balance functionality
- Secondary costs

### Phase 5: Extended Features (Ongoing)
- Multi-user role management
- Workflow approvals
- Advanced analytics
- External system integrations

## 8. Rules for Implementation

### 8.1 Code Organization Rules

1. **Module-First Structure**
   - Always create new files within the appropriate module directory
   - Never place domain-specific code in the core directory
   - Ensure each module has clean boundaries with clearly defined interfaces

2. **Type Safety**
   - Use TypeScript with strict mode enabled for all new code
   - Define comprehensive interfaces for all data models before implementation
   - Use discriminated unions for different variants of related types (e.g., PhysicalTrade vs PaperTrade)

3. **Component Design**
   - Create small, focused components with single responsibilities
   - Implement reusable components in the core/components directory
   - Use composition over inheritance for component flexibility

4. **State Management**
   - Use React Query for all server state and API calls
   - Implement optimistic updates for better user experience
   - Use Context API only for truly global state
   - Keep form state local using React Hook Form

### 8.2 Dependency Management Rules

1. **Library Selection**
   - Do not add new dependencies without explicit approval
   - Always check if functionality can be built with existing libraries
   - Use the shadcn/ui component library for UI elements
   - Maximize use of the built-in browser and React APIs

2. **External Services**
   - Always wrap Supabase API calls in service abstractions
   - Implement retry logic for network operations
   - Use environment variables for all external service configurations

3. **Dependency Injection**
   - Create service abstractions that can be easily mocked for testing
   - Inject dependencies via props or context rather than importing directly

### 8.3 Quality Assurance Rules

1. **Validation**
   - Implement Zod schemas for all form inputs
   - Validate API inputs at the entry point of each endpoint
   - Add database constraints to enforce data integrity

2. **Error Handling**
   - Implement comprehensive error handling for all async operations
   - Create user-friendly error messages for all possible error states
   - Log detailed error information for debugging

3. **Code Style**
   - Follow consistent naming conventions across the codebase
   - Use prettier for code formatting
   - Follow eslint rules to maintain code quality

### 8.4 Feature Implementation Process

1. **Data Model First**
   - Start by defining or updating the database schema
   - Create corresponding TypeScript interfaces
   - Validate the data model with sample data

2. **Service Layer**
   - Implement API services and data access functions
   - Create utility functions for business logic
   - Test service functions with sample data

3. **UI Components**
   - Build from the bottom up (small components first)
   - Implement form validation
   - Create consistent UI patterns across features

4. **Integration**
   - Connect UI to services
   - Implement error handling and loading states
   - Test the full feature flow

## 9. In-Scope vs. Out-of-Scope

### In-Scope

- Complete trade entry with physical and paper deals
- Operations module with movement management
- Finance module with invoice generation
- Exposure and MTM reporting
- Reference data management
- Audit logging

### Out-of-Scope

- External system integrations (accounting, ERP)
- Multiple user roles (initially)
- Mobile application
- Real-time pricing feeds
- Custom reporting tools
- Automated compliance checks

## 10. Success Criteria

1. **Functional Completeness**: System covers the entire trade lifecycle
2. **Data Accuracy**: MTM and exposure calculations match manual calculations
3. **Performance**: Pages load within 2 seconds, calculations complete within 5 seconds
4. **Usability**: Users can complete common tasks without training
5. **Reliability**: System maintains data integrity and availability

## 11. Implementation Considerations

### Database Strategy

- Use Supabase's row-level security for future multi-user support
- Implement optimistic concurrency control for collaborative editing
- Set up database triggers for audit logging
- Use foreign key constraints to maintain data integrity

### State Management

- Use React Query for server state with appropriate caching strategies
- Implement optimistic updates for better UX
- Use Context API for global UI state (current user, theme, etc.)

### API Design

- RESTful API design with consistent patterns
- Pagination for list endpoints
- Filtering and sorting capabilities
- Proper error handling and status codes

## 12. Real-World Trade Lifecycle Example

To illustrate the complete trade lifecycle that the system needs to support:

### Trade Creation
- User enters a physical deal to sell 5kt UCOME to Clover Energy Ltd
- Details include: Sustainability: UCOME (Argus), Price: FAME+250, Loading: 1-31 Jan, Pricing: 1-15 Jan, MTM formula: Argus UCOME, Credit Status: Prepay

### Exposure Reporting
- System shows -5kt JAN UCOME (physical) and +5kt JAN FAME (pricing) in the exposure report
- This reflects that we're selling 5kt of UCOME (hence negative physical position) but pricing it against FAME (hence positive pricing position)

### MTM Calculation
- If FAME averages $1200/mt during pricing period, trade price is $1450/mt
- If current UCOME price is $1600/mt, MTM would be ($1600-$1450) * 5000 = $750,000

### Movement Management
- When Clover nominates on January 10th, ops creates a movement
- Movement details include: nominated date, vessel name, loadport, inspector, etc.

### Financial Processing
- As this is a prepay trade, finance generates a prepay invoice based on formula
- After loading completes, ops enters BL date and quantity
- After pricing period, finance generates final invoice based on actual quantity and final price

This lifecycle demonstrates the integrated nature of the system, where trade entry, operations, finance, and reporting all work together to track the complete lifecycle of a trade.
````

## File: vite.config.ts
````typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
````
