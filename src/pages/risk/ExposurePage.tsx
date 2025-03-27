
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
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Calendar, Loader } from 'lucide-react';

// Helper function for number formatting
const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
};

const ExposurePage: React.FC = () => {
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });

  const { 
    filteredExposures, 
    isLoading, 
    error, 
    startDate,
    endDate 
  } = useFilteredExposures({
    startDate: dateRange.start,
    endDate: dateRange.end
  });

  // Derive values from the filteredExposures object
  const isDateRangeActive = dateRange.start !== null && dateRange.end !== null;

  // Extract instruments and create monthLabels
  const instruments = useMemo(() => {
    const physicalInstruments = Object.keys(filteredExposures.physical || {});
    const pricingInstruments = Object.keys(filteredExposures.pricing || {});
    return [...new Set([...physicalInstruments, ...pricingInstruments])];
  }, [filteredExposures]);

  // Create a simplified representation of monthly data for all instruments
  // This is a placeholder - in a real implementation, we would need to
  // adapt this to show actual monthly data from the filtered exposures
  const exposureData = useMemo(() => {
    // Create month labels (for now, just using 3 months as example)
    const currentDate = new Date();
    const monthLabels = ['Jan-23', 'Feb-23', 'Mar-23', 'Apr-23', 'May-23', 'Jun-23'];
    
    return monthLabels.map(monthLabel => {
      const monthData: Record<string, any> = { month: monthLabel };
      
      // For each instrument, add either the real exposure or 0
      instruments.forEach(instrument => {
        // In a real implementation, we'd determine if this month has exposure
        // based on the date range filter. For now, just showing values
        // from filteredExposures if they exist
        const hasExposure = isDateRangeActive && 
          (filteredExposures.physical[instrument] || 
           filteredExposures.pricing[instrument]);
        
        // Assign the exposure value if it exists, otherwise 0
        monthData[instrument] = hasExposure ? 
          (filteredExposures.physical[instrument] || filteredExposures.pricing[instrument] || 0) : 0;
      });
      
      return monthData;
    });
  }, [filteredExposures, instruments, isDateRangeActive]);

  // Calculate totals by instrument
  const totalsByInstrument = useMemo(() => {
    const totals: Record<string, number> = {};
    
    instruments.forEach(instrument => {
      const physicalValue = filteredExposures.physical[instrument] || 0;
      const pricingValue = filteredExposures.pricing[instrument] || 0;
      totals[instrument] = physicalValue + pricingValue;
    });
    
    return totals;
  }, [filteredExposures, instruments]);

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
            
            <DateRangeFilter 
              onFilterChange={handleDateRangeChange} 
              initialStartDate={startDate}
              initialEndDate={endDate}
            />
            
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
                    {instruments.map((instrument) => (
                      <TableHead key={instrument}>{instrument}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                
                <TableBody>
                  {exposureData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{row.month}</TableCell>
                      {instruments.map((instrument) => (
                        <TableCell key={instrument} className={row[instrument] === 0 ? "text-muted-foreground" : ""}>
                          {formatNumber(row[instrument] || 0)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  
                  {/* Total row */}
                  <TableRow className="bg-muted/50 font-medium">
                    <TableCell>Total</TableCell>
                    {instruments.map((instrument) => (
                      <TableCell key={instrument}>
                        {formatNumber(totalsByInstrument[instrument] || 0)}
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
