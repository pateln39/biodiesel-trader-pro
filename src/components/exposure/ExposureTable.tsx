import React from 'react';
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
import { format } from 'date-fns';
import { CalendarIcon, MoreHorizontalIcon } from 'lucide-react';

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
  dateRange
}) => {
  const shouldShowBiodieselTotal = true;
  const shouldShowPricingInstrumentTotal = true;
  const shouldShowTotalRow = true;

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
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-blue-500" />
            <Badge variant="outline" className="bg-blue-500 text-white mb-0">
              Date Filter: {dateRange.from.toLocaleDateString()} to {(dateRange.to || dateRange.from).toLocaleDateString()}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Physical exposures include full months covered by date range. Pricing & paper exposures are filtered by exact dates.
            </span>
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
