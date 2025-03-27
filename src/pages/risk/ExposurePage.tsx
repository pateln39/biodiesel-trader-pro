
import React, { useState, useMemo } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DateRangeFilter from '@/components/risk/DateRangeFilter';
import { useFilteredExposures } from '@/hooks/useFilteredExposures';
import { formatNumber } from '@/utils/exposureUtils';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Calendar, Loader } from 'lucide-react';

const ExposurePage: React.FC = () => {
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });

  const { 
    exposures, 
    isLoading, 
    error, 
    totalsByInstrument, 
    monthLabels,
    isDateRangeActive 
  } = useFilteredExposures(dateRange);

  // Transform the filtered exposures data to maintain the monthly grid structure
  const exposureData = useMemo(() => {
    if (!exposures || !monthLabels) return [];

    // If no date range filter is active, return the original data structure
    if (!isDateRangeActive) {
      return monthLabels.map((monthLabel) => ({
        month: monthLabel,
        ...exposures[monthLabel],
      }));
    }

    // When date range filter is active, create a complete grid with all months
    // but only show values for months that fall within the filtered range
    return monthLabels.map((monthLabel) => {
      const monthData = exposures[monthLabel] || {};
      
      // If this month doesn't exist in filtered exposures, show zeros for all instruments
      if (!exposures[monthLabel] && isDateRangeActive) {
        const zeroExposures: Record<string, number> = {};
        
        // Create zero entries for all instruments in the totals
        Object.keys(totalsByInstrument || {}).forEach((instrument) => {
          zeroExposures[instrument] = 0;
        });
        
        return {
          month: monthLabel,
          ...zeroExposures,
        };
      }
      
      return {
        month: monthLabel,
        ...monthData,
      };
    });
  }, [exposures, monthLabels, totalsByInstrument, isDateRangeActive]);

  // Handler for date range changes
  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    setDateRange({ start, end });
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading exposure data...</span>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load exposure data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Exposure Reporting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-sm font-medium">Filter by Date Range</h3>
            </div>
            
            <DateRangeFilter onDateRangeChange={handleDateRangeChange} />
            
            {isDateRangeActive && (
              <Badge variant="outline" className="bg-primary/10">
                Date filter active: {dateRange.start?.toLocaleDateString()} - {dateRange.end?.toLocaleDateString()}
              </Badge>
            )}
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Month</TableHead>
                    {Object.keys(totalsByInstrument || {}).map((instrument) => (
                      <TableHead key={instrument}>{instrument}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                
                <TableBody>
                  {exposureData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{row.month}</TableCell>
                      {Object.keys(totalsByInstrument || {}).map((instrument) => (
                        <TableCell key={instrument} className={row[instrument] === 0 ? "text-muted-foreground" : ""}>
                          {formatNumber(row[instrument] || 0)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  
                  {/* Total row */}
                  <TableRow className="bg-muted/50 font-medium">
                    <TableCell>Total</TableCell>
                    {Object.entries(totalsByInstrument || {}).map(([instrument, total]) => (
                      <TableCell key={instrument}>
                        {formatNumber(total)}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExposurePage;
