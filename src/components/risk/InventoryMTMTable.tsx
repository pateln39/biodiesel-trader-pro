
import React from 'react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { PRODUCT_COLORS } from '@/hooks/useInventoryState';
import { useInventoryMTM } from '@/hooks/useInventoryMTM';

const TANK_HEADERS = ['UCOME', 'RME', 'FAME0', 'HVO', 'RME DC', 'UCOME-5'];

const InventoryMTMTable = () => {
  const { 
    isLoading, 
    months,
    calculateCellValue, 
    calculateRowTotal, 
    calculateColumnTotal, 
    calculateGrandTotal 
  } = useInventoryMTM();

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              colSpan={TANK_HEADERS.length + 1} 
              className="h-16 px-4 text-center align-middle font-medium"
            >
              Tanks
            </TableHead>
          </TableRow>
          <TableRow>
            <TableHead className="h-16 px-4 text-left align-middle border-r border-white">
              Month
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
              {TANK_HEADERS.map((header) => {
                const { value, color } = calculateCellValue(month, header);
                return (
                  <TableCell 
                    key={`${month}-${header}`} 
                    className="px-4 text-center align-middle"
                  >
                    <span className={color}>
                      {value}
                    </span>
                  </TableCell>
                );
              })}
              <TableCell className="px-4 text-center align-middle font-medium border-l border-white">
                <span className={calculateRowTotal(month).color}>
                  {calculateRowTotal(month).value}
                </span>
              </TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell 
              colSpan={TANK_HEADERS.length + 2} 
              className="border-t border-white"
            />
          </TableRow>
          <TableRow className="bg-muted/50 h-16">
            <TableCell className="px-4 align-middle font-medium border-r border-white">
              Total
            </TableCell>
            {TANK_HEADERS.map((header) => {
              const { value, color } = calculateColumnTotal(header);
              return (
                <TableCell 
                  key={`total-${header}`} 
                  className="px-4 text-center align-middle font-medium"
                >
                  <span className={color}>
                    {value}
                  </span>
                </TableCell>
              );
            })}
            <TableCell className="px-4 text-center align-middle font-medium border-l border-white">
              <span className={calculateGrandTotal().color}>
                {calculateGrandTotal().value}
              </span>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};

export default InventoryMTMTable;
