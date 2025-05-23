
import React, { useEffect } from 'react';
import { Table } from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { MonthlyExposure, GrandTotals, GroupTotals } from '@/types/exposure';
import ExposureTableHeader from './ExposureTableHeader';
import ExposureTableBody from './ExposureTableBody';
import ExposureTableFooter from './ExposureTableFooter';
import TableLoadingState from '@/components/trades/TableLoadingState';
import TableErrorState from '@/components/trades/TableErrorState';
import { Badge } from '@/components/ui/badge';
import { DateRange } from 'react-day-picker';
import { CalendarIcon, InfoIcon, Calendar } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ExposureTableProps {
  exposureData: MonthlyExposure[];
  orderedVisibleCategories: string[];
  filteredProducts: string[];
  grandTotals: GrandTotals;
  groupGrandTotals: GroupTotals;
  BIODIESEL_PRODUCTS: string[];
  isLoadingData: boolean;
  error: Error | null;
  refetch: () => void;
  dateRangeEnabled?: boolean;
  dateRange?: DateRange;
  selectedMonth?: string | null;
}

const ExposureTable: React.FC<ExposureTableProps> = ({
  exposureData,
  orderedVisibleCategories,
  filteredProducts,
  grandTotals,
  groupGrandTotals,
  BIODIESEL_PRODUCTS,
  isLoadingData,
  error,
  refetch,
  dateRangeEnabled,
  dateRange,
  selectedMonth
}) => {
  const shouldShowBiodieselTotal = true;
  const shouldShowPricingInstrumentTotal = true;
  const shouldShowTotalRow = true;

  // Log when table data changes to help with debugging
  useEffect(() => {
    if (dateRangeEnabled) {
      console.log('[EXPOSURE TABLE] Rendering with date range filter:', 
        dateRange?.from?.toLocaleDateString(), 'to', 
        dateRange?.to?.toLocaleDateString());
      console.log('[EXPOSURE TABLE] Filtered exposure data count:', exposureData.length);
    } else if (selectedMonth) {
      console.log('[EXPOSURE TABLE] Rendering with month filter:', selectedMonth);
      console.log('[EXPOSURE TABLE] Filtered exposure data count:', exposureData.length);
    }
  }, [dateRangeEnabled, dateRange, selectedMonth, exposureData]);

  if (isLoadingData) {
    return (
      <Card>
        <CardContent className="pt-4">
          <TableLoadingState />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-4">
          <TableErrorState error={error} onRetry={refetch} />
        </CardContent>
      </Card>
    );
  }

  if (exposureData.length === 0 || filteredProducts.length === 0) {
    return (
      <Card>
        <CardContent className="pt-4">
          <div className="flex justify-center items-center h-40">
            <p className="text-muted-foreground">No exposure data found.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {dateRangeEnabled && dateRange?.from && (
        <div className="p-2 bg-blue-500/20 border-b border-blue-500/30">
          <div className="flex flex-wrap items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-blue-500" />
            <Badge variant="outline" className="bg-blue-500 text-white mb-0">
              Date Filter: {dateRange.from.toLocaleDateString()} to {(dateRange.to || dateRange.from).toLocaleDateString()}
            </Badge>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center cursor-help">
                    <InfoIcon className="h-4 w-4 text-blue-500 mr-1" />
                    <span className="text-xs text-muted-foreground">How filtering works</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p className="text-sm mb-1 font-medium">Date filter behavior:</p>
                  <ul className="text-xs list-disc pl-4 space-y-1">
                    <li>Physical exposures show entire months that overlap with the date range</li>
                    <li>All pricing & paper exposures (including EFP) use daily distributions when available</li>
                    <li>Monthly data is included when a month falls within the date range</li>
                    <li>EFP exposures are distributed across business days like other instruments</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}
      
      {!dateRangeEnabled && selectedMonth && (
        <div className="p-2 bg-green-500/20 border-b border-green-500/30">
          <div className="flex flex-wrap items-center gap-2">
            <Calendar className="h-4 w-4 text-green-500" />
            <Badge variant="outline" className="bg-green-500 text-white mb-0">
              Month Filter: {selectedMonth}
            </Badge>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center cursor-help">
                    <InfoIcon className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-xs text-muted-foreground">Month filtering</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">Showing exposure data for the selected month only</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}
      
      <CardContent className="p-0 overflow-auto">
        <ScrollArea className="w-full" orientation="horizontal">
          <div className="min-w-[1800px]" style={{
            width: "max-content",
            minWidth: "100%"
          }}>
            <Table className="border-collapse">
              <ExposureTableHeader 
                orderedVisibleCategories={orderedVisibleCategories}
                filteredProducts={filteredProducts}
                shouldShowBiodieselTotal={shouldShowBiodieselTotal}
                shouldShowPricingInstrumentTotal={shouldShowPricingInstrumentTotal}
                shouldShowTotalRow={shouldShowTotalRow}
              />
              
              <ExposureTableBody 
                exposureData={exposureData}
                orderedVisibleCategories={orderedVisibleCategories}
                filteredProducts={filteredProducts}
                BIODIESEL_PRODUCTS={BIODIESEL_PRODUCTS}
                shouldShowBiodieselTotal={shouldShowBiodieselTotal}
                shouldShowPricingInstrumentTotal={shouldShowPricingInstrumentTotal}
                shouldShowTotalRow={shouldShowTotalRow}
                dateRangeEnabled={dateRangeEnabled}
              />
              
              <ExposureTableFooter
                grandTotals={grandTotals}
                groupGrandTotals={groupGrandTotals}
                orderedVisibleCategories={orderedVisibleCategories}
                filteredProducts={filteredProducts}
                shouldShowBiodieselTotal={shouldShowBiodieselTotal}
                shouldShowPricingInstrumentTotal={shouldShowPricingInstrumentTotal}
                shouldShowTotalRow={shouldShowTotalRow}
              />
            </Table>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ExposureTable;
