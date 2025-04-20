
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
    <div className="rounded-md border-[3px] border-brand-lime/80 bg-gradient-to-br from-brand-navy/75 via-brand-navy/60 to-brand-lime/25 shadow-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              colSpan={TANK_HEADERS.length + 1} 
              className="h-16 px-4 text-center align-middle font-medium bg-gradient-to-r from-brand-navy/90 to-brand-navy/70"
            >
              Tanks
            </TableHead>
          </TableRow>
          <TableRow className="bg-gradient-to-r from-brand-navy/80 to-brand-navy/60">
            <TableHead className="h-16 px-4 text-left align-middle border-r border-white/10">
              Month
            </TableHead>
            {TANK_HEADERS.map((header) => (
              <TableHead 
                key={header}
                className={`h-16 px-4 text-center align-middle font-medium text-white ${PRODUCT_COLORS[header]} border-r border-white/10`}
              >
                {header}
              </TableHead>
            ))}
            <TableHead className="h-16 px-4 text-center align-middle font-medium bg-gray-500/50 text-white">
              Total
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {months.map((month) => (
            <TableRow key={month} className="h-16 hover:bg-brand-navy/80 transition-colors duration-200">
              <TableCell className="px-4 align-middle border-r border-white/10">
                {month}
              </TableCell>
              {TANK_HEADERS.map((header) => {
                const { value, color } = calculateCellValue(month, header);
                return (
                  <TableCell 
                    key={`${month}-${header}`} 
                    className="px-4 text-center align-middle border-r border-white/10"
                  >
                    <span className={color}>
                      {value}
                    </span>
                  </TableCell>
                );
              })}
              <TableCell className="px-4 text-center align-middle font-medium bg-gradient-to-r from-brand-navy/90 to-brand-navy/70">
                <span className={calculateRowTotal(month).color}>
                  {calculateRowTotal(month).value}
                </span>
              </TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell 
              colSpan={TANK_HEADERS.length + 2} 
              className="border-t border-white/10"
            />
          </TableRow>
          <TableRow className="bg-gradient-to-r from-brand-navy/90 to-brand-navy/70 h-16">
            <TableCell className="px-4 align-middle font-medium border-r border-white/10">
              Total
            </TableCell>
            {TANK_HEADERS.map((header) => {
              const { value, color } = calculateColumnTotal(header);
              return (
                <TableCell 
                  key={`total-${header}`} 
                  className="px-4 text-center align-middle font-medium border-r border-white/10"
                >
                  <span className={color}>
                    {value}
                  </span>
                </TableCell>
              );
            })}
            <TableCell className="px-4 text-center align-middle font-medium">
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
