
import React, { useMemo } from 'react';
import { useFilteredExposures } from '@/hooks/useFilteredExposures';
import { format } from 'date-fns';
import DashboardCard from '@/components/DashboardCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw } from 'lucide-react';

// Define columns for the exposure table
const columns = [
  { header: 'Argus UCOME', accessorKey: 'Argus UCOME' },
  { header: 'Argus RME', accessorKey: 'Argus RME' },
  { header: 'Argus FAME0', accessorKey: 'Argus FAME0' },
  { header: 'Argus HVO', accessorKey: 'Argus HVO' },
  { header: 'Platts LSGO', accessorKey: 'Platts LSGO' },
  { header: 'Platts Diesel', accessorKey: 'Platts Diesel' },
  { header: 'ICE GASOIL FUTURES', accessorKey: 'ICE GASOIL FUTURES' },
];

export default function ExposurePage() {
  const { filteredExposures, isLoading, error, refetchTrades } = useFilteredExposures();
  const { toast } = useToast();
  
  // Format the filtered exposures into a format the exposure table can use
  const exposureData = useMemo(() => {
    // If we're loading or there's an error, return empty data
    if (isLoading || error) {
      return [];
    }
    
    // Safety check: If filteredExposures is undefined or physical/pricing are missing, return empty array
    if (!filteredExposures || !filteredExposures.physical || !filteredExposures.pricing) {
      console.warn('Missing expected data structure in filteredExposures:', filteredExposures);
      return [];
    }
    
    // Get the current month and format it
    const currentDate = new Date();
    const monthStr = format(currentDate, 'MMM-yy');
    
    // Create the exposure data structure
    return [
      {
        month: monthStr,
        total: {},
        ...Object.entries(filteredExposures.physical).reduce((acc, [instrument, value]) => {
          // Only include non-zero values
          if (value !== 0) {
            acc[instrument] = value;
            // Keep track of the total for this instrument
            if (!acc.total[instrument]) acc.total[instrument] = 0;
            acc.total[instrument] += value;
          }
          return acc;
        }, {} as Record<string, number>),
        ...Object.entries(filteredExposures.pricing).reduce((acc, [instrument, value]) => {
          // Only include non-zero values
          if (value !== 0) {
            acc[instrument] = value;
            // Keep track of the total for this instrument
            if (!acc.total[instrument]) acc.total[instrument] = 0;
            acc.total[instrument] += value;
          }
          return acc;
        }, {} as Record<string, number>)
      }
    ];
  }, [filteredExposures, isLoading, error]);

  // If there's an error, show a toast
  React.useEffect(() => {
    if (error) {
      toast({
        title: 'Error loading exposures',
        description: 'There was an error loading the exposure data. Please try again.',
        variant: 'destructive'
      });
    }
  }, [error, toast]);

  const refreshData = () => {
    refetchTrades();
    toast({
      title: 'Refreshing data',
      description: 'Fetching the latest exposure data'
    });
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Exposure Reporting</h1>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <RefreshCw className="animate-spin h-6 w-6 mr-2" />
          <span>Loading exposures...</span>
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Current Month Exposures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Month</TableHead>
                    {columns.map((column) => (
                      <TableHead key={column.accessorKey} className="min-w-[120px]">
                        {column.header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exposureData.map((row, i) => (
                    <TableRow key={`row-${i}`}>
                      <TableCell className="font-medium">{row.month}</TableCell>
                      {columns.map((column) => {
                        const value = row[column.accessorKey] || 0;
                        const isNegative = value < 0;
                        return (
                          <TableCell 
                            key={`${i}-${column.accessorKey}`}
                            className={`text-right ${isNegative ? 'text-red-600' : value > 0 ? 'text-green-600' : ''}`}
                          >
                            {value !== 0 ? Math.round(value).toLocaleString() : '-'}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
