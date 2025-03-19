
import React, { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PaperTradeRow } from '@/types/paper';
import { format } from 'date-fns';

interface PaperExposureTableProps {
  rows: PaperTradeRow[];
}

export const PaperExposureTable: React.FC<PaperExposureTableProps> = ({ rows }) => {
  // Define months and products for the table
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const products = ["UCOME", "FAME0", "RME", "HVO", "LSGO", "ICE GASOIL FUTURES"];
  
  // Calculate exposures from rows
  const exposures = useMemo(() => {
    // Initialize exposures object with zero values
    const initialExposures: Record<string, Record<string, number>> = {};
    months.forEach(month => {
      initialExposures[month] = {};
      products.forEach(product => {
        initialExposures[month][product] = 0;
      });
    });
    
    // Process each row
    rows.forEach(row => {
      // Process Leg A if exists
      if (row.legA) {
        const startMonth = format(new Date(row.legA.pricingPeriodStart), 'MMM');
        const product = row.legA.product;
        
        // Only process if the product is in our defined list
        if (products.includes(product)) {
          const monthKey = startMonth.slice(0, 3);
          const quantity = row.legA.quantity;
          const sign = row.legA.buySell === 'buy' ? 1 : -1;
          
          // Add to existing exposure
          if (initialExposures[monthKey] && initialExposures[monthKey][product] !== undefined) {
            initialExposures[monthKey][product] += quantity * sign;
          }
        }
      }
      
      // Process Leg B if exists
      if (row.legB) {
        const startMonth = format(new Date(row.legB.pricingPeriodStart), 'MMM');
        const product = row.legB.product;
        
        // Only process if the product is in our defined list
        if (products.includes(product)) {
          const monthKey = startMonth.slice(0, 3);
          const quantity = row.legB.quantity;
          const sign = row.legB.buySell === 'buy' ? 1 : -1;
          
          // Add to existing exposure
          if (initialExposures[monthKey] && initialExposures[monthKey][product] !== undefined) {
            initialExposures[monthKey][product] += quantity * sign;
          }
        }
      }
    });
    
    return initialExposures;
  }, [rows]);
  
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

export default PaperExposureTable;
