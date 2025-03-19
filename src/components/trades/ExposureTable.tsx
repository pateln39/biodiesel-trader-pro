
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export interface ExposureRow {
  month: string;
  UCOME: number;
  FAME0: number;
  RME: number;
  HVO: number;
  LSGO: number;
  ICE_GASOIL_FUTURES: number;
}

interface ExposureTableProps {
  exposures: ExposureRow[];
  highlightedProduct?: string;
}

const ExposureTable: React.FC<ExposureTableProps> = ({
  exposures,
  highlightedProduct
}) => {
  // Helper function to format cell values
  const formatCellValue = (value: number) => {
    if (value === 0) return '-';
    return value.toFixed(2);
  };
  
  // Helper function to determine cell styling
  const getCellClass = (value: number, product: string) => {
    if (value === 0) return 'text-gray-400';
    
    let classes = value > 0 ? 'text-green-600' : 'text-red-600';
    
    if (highlightedProduct && product === highlightedProduct) {
      classes += ' font-bold';
    }
    
    return classes;
  };
  
  if (exposures.length === 0) {
    return (
      <div className="border rounded-md p-4 text-center text-muted-foreground">
        No exposure data available. Add trade legs to see exposure calculations.
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[120px]">Month</TableHead>
            <TableHead>UCOME</TableHead>
            <TableHead>FAME0</TableHead>
            <TableHead>RME</TableHead>
            <TableHead>HVO</TableHead>
            <TableHead>LSGO</TableHead>
            <TableHead>ICE GASOIL</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {exposures.map((row) => (
            <TableRow key={row.month}>
              <TableCell className="font-medium">{row.month}</TableCell>
              <TableCell className={getCellClass(row.UCOME, 'UCOME')}>
                {formatCellValue(row.UCOME)}
              </TableCell>
              <TableCell className={getCellClass(row.FAME0, 'FAME0')}>
                {formatCellValue(row.FAME0)}
              </TableCell>
              <TableCell className={getCellClass(row.RME, 'RME')}>
                {formatCellValue(row.RME)}
              </TableCell>
              <TableCell className={getCellClass(row.HVO, 'HVO')}>
                {formatCellValue(row.HVO)}
              </TableCell>
              <TableCell className={getCellClass(row.LSGO, 'LSGO')}>
                {formatCellValue(row.LSGO)}
              </TableCell>
              <TableCell className={getCellClass(row.ICE_GASOIL_FUTURES, 'ICE_GASOIL_FUTURES')}>
                {formatCellValue(row.ICE_GASOIL_FUTURES)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ExposureTable;
