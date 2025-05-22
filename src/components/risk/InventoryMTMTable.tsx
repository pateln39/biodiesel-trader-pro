
import React from 'react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { useInventoryMTM } from '@/hooks/useInventoryMTM';
import ProductToken from '@/components/operations/storage/ProductToken';
import { Skeleton } from '@/components/ui/skeleton';

const InventoryMTMTable = () => {
  const { 
    isLoading, 
    months,
    productHeaders,
    calculateCellValue, 
    calculateRowTotal, 
    calculateColumnTotal, 
    calculateGrandTotal 
  } = useInventoryMTM();

  if (isLoading) {
    return <Skeleton className="w-full h-[400px]" />;
  }

  return (
    <div className="rounded-md border-[3px] border-brand-lime/80 bg-gradient-to-br from-brand-navy/75 via-brand-navy/60 to-brand-lime/25 shadow-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              colSpan={productHeaders.length + 1} 
              className="h-16 px-4 text-center align-middle font-medium bg-gradient-to-r from-brand-navy/90 to-brand-navy/70"
            >
              Tanks
            </TableHead>
          </TableRow>
          <TableRow className="bg-gradient-to-r from-brand-navy/80 to-brand-navy/60">
            <TableHead className="h-16 px-4 text-left align-middle border-r border-white/10">
              Month
            </TableHead>
            {productHeaders.map((product) => (
              <TableHead 
                key={product}
                className="h-16 px-4 text-center align-middle font-medium text-white border-r border-white/10"
              >
                <ProductToken product={product} value={product} showTooltip={false} />
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
              {productHeaders.map((product) => {
                const { value, color } = calculateCellValue(month, product);
                return (
                  <TableCell 
                    key={`${month}-${product}`} 
                    className="px-4 text-center align-middle border-r border-white/10"
                  >
                    <span className={color}>
                      {value}
                    </span>
                  </TableCell>
                );
              })}
              <TableCell className="px-4 text-center align-middle font-medium">
                <span className={calculateRowTotal(month).color}>
                  {calculateRowTotal(month).value}
                </span>
              </TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell 
              colSpan={productHeaders.length + 2} 
              className="border-t border-white/10"
            />
          </TableRow>
          <TableRow className="bg-gradient-to-r from-brand-navy/90 to-brand-navy/70 h-16">
            <TableCell className="px-4 align-middle font-medium border-r border-white/10">
              Total
            </TableCell>
            {productHeaders.map((product) => {
              const { value, color } = calculateColumnTotal(product);
              return (
                <TableCell 
                  key={`total-${product}`} 
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
