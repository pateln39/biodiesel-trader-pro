
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFilteredExposures } from '@/hooks/useFilteredExposures';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DateRangeFilter } from '@/components/risk/DateRangeFilter';
import { startOfMonth, endOfMonth } from 'date-fns';

// Local helper function to format numbers with commas and sign
const formatNumber = (num: number): string => {
  const sign = num > 0 ? '+' : '';
  return `${sign}${num.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
};

const ExposurePage: React.FC = () => {
  const currentDate = new Date();
  const initialStartDate = startOfMonth(currentDate);
  const initialEndDate = endOfMonth(currentDate);
  
  const {
    filteredExposures,
    isLoading,
    error,
    updateDateRange,
    startDate,
    endDate,
    refetchTrades
  } = useFilteredExposures({ 
    startDate: initialStartDate, 
    endDate: initialEndDate 
  });

  // Extract instruments from filtered exposures
  const instruments = useMemo(() => {
    const physicalInstruments = Object.keys(filteredExposures.physical || {});
    const pricingInstruments = Object.keys(filteredExposures.pricing || {});
    return [...new Set([...physicalInstruments, ...pricingInstruments])].sort();
  }, [filteredExposures]);

  // Generate month labels (this would typically come from your existing code)
  // For demo purposes, we're generating 6 months starting from 3 months ago
  const monthLabels = useMemo(() => {
    const months = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    for (let i = -3; i <= 2; i++) {
      let monthIndex = currentMonth + i;
      let year = currentYear;
      
      if (monthIndex < 0) {
        monthIndex += 12;
        year -= 1;
      } else if (monthIndex > 11) {
        monthIndex -= 12;
        year += 1;
      }
      
      const yearSuffix = year.toString().slice(-2);
      const monthLabel = `${monthNames[monthIndex]}-${yearSuffix}`;
      months.push(monthLabel);
    }
    
    return months;
  }, []);

  // Function to handle date range changes
  const handleDateRangeChange = (newStartDate: Date, newEndDate: Date) => {
    updateDateRange(newStartDate, newEndDate);
  };

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Exposure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-red-500">Error loading exposures: {error.message}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Exposure</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Date Range Filter Component */}
          <DateRangeFilter 
            startDate={startDate} 
            endDate={endDate} 
            onDateRangeChange={handleDateRangeChange} 
          />
          
          {isLoading ? (
            <div className="text-center py-8">Loading exposures...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background z-10">Month</TableHead>
                    {instruments.map((instrument) => (
                      <TableHead key={instrument}>{instrument}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Month rows */}
                  {monthLabels.map((month) => (
                    <TableRow key={month}>
                      <TableCell className="sticky left-0 bg-background font-medium">
                        {month}
                      </TableCell>
                      {instruments.map((instrument) => {
                        // Get physical and pricing exposures
                        const physicalExposure = filteredExposures.physical[instrument] || 0;
                        const pricingExposure = filteredExposures.pricing[instrument] || 0;
                        
                        // For now, we'll display the same value for each month
                        // This would be replaced with actual monthly distribution in a real implementation
                        return (
                          <TableCell key={`${month}-${instrument}`}>
                            {formatNumber(physicalExposure)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                  
                  {/* Total row */}
                  <TableRow className="font-bold">
                    <TableCell className="sticky left-0 bg-background">Total</TableCell>
                    {instruments.map((instrument) => {
                      const physicalTotal = filteredExposures.physical[instrument] || 0;
                      return (
                        <TableCell key={`total-${instrument}`}>
                          {formatNumber(physicalTotal)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExposurePage;
