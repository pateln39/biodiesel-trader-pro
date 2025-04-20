
import React from 'react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { getNextMonths } from '@/utils/dateUtils';
import { PRODUCT_COLORS } from '@/hooks/useInventoryState';

const TANK_HEADERS = ['UCOME', 'RME', 'FAME0', 'HVO', 'RME DC', 'UCOME-5'];

const InventoryMTMTable = () => {
  // Get months (1 month prior, current month, and 4 months ahead)
  const currentDate = new Date('2025-04-20'); // Using the current date from the context
  const months = getNextMonths(6)
    .slice(0, 6) // Get 6 months total
    .map(month => month); // This will give us Mar-25 to Aug-25

  // Calculate row totals (currently all zero)
  const calculateRowTotal = () => "-";

  // Calculate column totals (currently all zero)
  const calculateColumnTotal = () => "-";

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="h-16 px-4 text-left align-middle font-medium text-muted-foreground border-r border-white">
              Month
            </TableHead>
            <TableHead 
              colSpan={TANK_HEADERS.length} 
              className="h-16 px-4 text-center align-middle font-medium"
            >
              Tanks
            </TableHead>
            <TableHead className="h-16 px-4 text-center align-middle font-medium border-l border-white">
              {/* Empty cell - removed "Total" text */}
            </TableHead>
          </TableRow>
          <TableRow>
            <TableHead className="h-16 px-4 text-center align-middle border-r border-white">
              {/* Month header moved here */}
            </TableHead>
            {TANK_HEADERS.map((header) => (
              <TableHead 
                key={header}
                className={`h-16 px-4 text-center align-middle font-medium text-white ${PRODUCT_COLORS[header]}`}
              >
                {header}
              </TableHead>
            ))}
            <TableHead className="h-16 px-4 text-center align-middle font-medium bg-gray-500 text-white border-l border-white">
              Total
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {months.map((month) => (
            <TableRow key={month} className="h-16">
              <TableCell className="px-4 align-middle border-r border-white">
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
              <TableCell className="px-4 text-center align-middle font-medium border-l border-white">
                {calculateRowTotal()}
              </TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell 
              colSpan={TANK_HEADERS.length + 2} 
              className="border-t border-white"
            >
              {/* Border separator for totals row */}
            </TableCell>
          </TableRow>
          <TableRow className="bg-muted/50 h-16">
            <TableCell className="px-4 align-middle font-medium border-r border-white">
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
            <TableCell className="px-4 text-center align-middle font-medium border-l border-white">
              {calculateColumnTotal()}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};

export default InventoryMTMTable;
