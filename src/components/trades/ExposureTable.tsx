
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
  onExposureClick?: (month: string, product: string) => void;
}

const ExposureTable: React.FC<ExposureTableProps> = ({ 
  exposures,
  highlightedProduct,
  onExposureClick
}) => {
  // Helper to format cell values
  const formatValue = (value: number | undefined): string => {
    if (value === undefined || value === 0) return '-';
    return value.toFixed(2);
  };
  
  // Helper to determine if a cell should be highlighted
  const isHighlighted = (product: string): boolean => {
    return product === highlightedProduct;
  };
  
  // Helper to determine cell styling based on value and highlight status
  const getCellClass = (value: number, product: string): string => {
    const baseClass = "text-right font-mono";
    
    if (value === 0) return `${baseClass} text-gray-400`;
    
    const colorClass = value > 0 
      ? "text-green-600" 
      : "text-red-600";
      
    const highlightClass = isHighlighted(product)
      ? "font-bold bg-yellow-50"
      : "";
      
    return `${baseClass} ${colorClass} ${highlightClass}`;
  };
  
  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[120px]">Month</TableHead>
            <TableHead className="text-right">UCOME</TableHead>
            <TableHead className="text-right">FAME0</TableHead>
            <TableHead className="text-right">RME</TableHead>
            <TableHead className="text-right">HVO</TableHead>
            <TableHead className="text-right">LSGO</TableHead>
            <TableHead className="text-right">ICE GASOIL</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {exposures.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                No exposure data available. Add trade legs to see exposure.
              </TableCell>
            </TableRow>
          ) : (
            exposures.map((row) => (
              <TableRow key={row.month}>
                <TableCell className="font-medium">{row.month}</TableCell>
                
                <TableCell 
                  className={getCellClass(row.UCOME, 'UCOME')}
                  onClick={() => onExposureClick?.(row.month, 'UCOME')}
                >
                  {formatValue(row.UCOME)}
                </TableCell>
                
                <TableCell 
                  className={getCellClass(row.FAME0, 'FAME0')}
                  onClick={() => onExposureClick?.(row.month, 'FAME0')}
                >
                  {formatValue(row.FAME0)}
                </TableCell>
                
                <TableCell 
                  className={getCellClass(row.RME, 'RME')}
                  onClick={() => onExposureClick?.(row.month, 'RME')}
                >
                  {formatValue(row.RME)}
                </TableCell>
                
                <TableCell 
                  className={getCellClass(row.HVO, 'HVO')}
                  onClick={() => onExposureClick?.(row.month, 'HVO')}
                >
                  {formatValue(row.HVO)}
                </TableCell>
                
                <TableCell 
                  className={getCellClass(row.LSGO, 'LSGO')}
                  onClick={() => onExposureClick?.(row.month, 'LSGO')}
                >
                  {formatValue(row.LSGO)}
                </TableCell>
                
                <TableCell 
                  className={getCellClass(row.ICE_GASOIL_FUTURES, 'ICE_GASOIL_FUTURES')}
                  onClick={() => onExposureClick?.(row.month, 'ICE_GASOIL_FUTURES')}
                >
                  {formatValue(row.ICE_GASOIL_FUTURES)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ExposureTable;
