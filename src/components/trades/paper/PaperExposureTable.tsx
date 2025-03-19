
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface PaperExposureTableProps {
  exposures: Record<string, Record<string, number>>;
}

export const PaperExposureTable: React.FC<PaperExposureTableProps> = ({ exposures }) => {
  // Define months and products for the table
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const products = ["UCOME", "FAME0", "RME", "HVO", "LSGO", "ICE GASOIL FUTURES"];
  
  // Format number with thousands separator
  const formatNumber = (value: number): string => {
    return Math.round(value).toLocaleString('en-US');
  };
  
  // Get cell color based on value
  const getCellColor = (value: number): string => {
    if (value === 0) return '';
    return value > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700';
  };
  
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Month</TableHead>
            {products.map((product) => (
              <TableHead key={product}>{product}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {months.map((month) => (
            <TableRow key={month}>
              <TableCell className="font-medium">{month}</TableCell>
              {products.map((product) => {
                const value = exposures[month]?.[product] || 0;
                return (
                  <TableCell key={`${month}-${product}`} className={getCellColor(value)}>
                    {value !== 0 ? formatNumber(value) : '-'}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
