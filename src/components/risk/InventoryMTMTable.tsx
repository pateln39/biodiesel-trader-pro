
import React from 'react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { getNextMonths } from '@/utils/dateUtils';

const TANK_HEADERS = ['UCOME', 'RME', 'FAME0', 'HVO', 'RME DC', 'UCOME-5'];

const InventoryMTMTable = () => {
  // Get months (2 months prior, current month, and 3 months ahead)
  const currentDate = new Date();
  const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, 1);
  const months = getNextMonths(6).slice(0, 6);

  // Calculate row totals (currently all zero)
  const calculateRowTotal = () => "-";

  // Calculate column totals (currently all zero)
  const calculateColumnTotal = () => "-";

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Month
            </TableHead>
            <TableHead 
              colSpan={TANK_HEADERS.length} 
              className="h-12 px-4 text-center align-middle font-medium"
            >
              Tanks
            </TableHead>
            <TableHead className="h-12 px-4 text-center align-middle font-medium">
              Total
            </TableHead>
          </TableRow>
          <TableRow>
            <TableHead className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              {/* Empty cell for Month column */}
            </TableHead>
            {TANK_HEADERS.map((header) => (
              <TableHead 
                key={header}
                className="h-12 px-4 text-center align-middle font-medium bg-green-600 text-white"
              >
                {header}
              </TableHead>
            ))}
            <TableHead className="h-12 px-4 text-center align-middle font-medium bg-gray-500 text-white">
              Total
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {months.map((month) => (
            <TableRow key={month}>
              <TableCell className="px-4 align-middle">
                {month}
              </TableCell>
              {TANK_HEADERS.map((header) => (
                <TableCell 
                  key={`${month}-${header}`} 
                  className="px-4 text-center align-middle"
                >
                  -
                </TableCell>
              ))}
              <TableCell className="px-4 text-center align-middle font-medium">
                {calculateRowTotal()}
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="bg-muted/50">
            <TableCell className="px-4 align-middle font-medium">
              Total
            </TableCell>
            {TANK_HEADERS.map((header) => (
              <TableCell 
                key={`total-${header}`} 
                className="px-4 text-center align-middle font-medium"
              >
                {calculateColumnTotal()}
              </TableCell>
            ))}
            <TableCell className="px-4 text-center align-middle font-medium">
              {calculateColumnTotal()}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};

export default InventoryMTMTable;
