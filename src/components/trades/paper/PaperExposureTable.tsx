
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface ExposureRow {
  month: string;
  UCOME: number;
  FAME0: number;
  RME: number;
  HVO: number;
  LSGO: number;
  ICE_GASOIL_FUTURES: number;
}

interface PaperExposureTableProps {
  data: ExposureRow[];
  highlightedProduct?: string;
}

const PaperExposureTable: React.FC<PaperExposureTableProps> = ({ 
  data, 
  highlightedProduct 
}) => {
  const getValueColorClass = (value: number): string => {
    if (value > 0) return 'text-green-400';
    if (value < 0) return 'text-red-400';
    return 'text-gray-500';
  };

  const formatValue = (value: number): string => {
    if (value === 0) return "-";
    return `${value >= 0 ? '+' : ''}${value.toLocaleString()}`;
  };

  const getCellClass = (product: string, isHighlighted: boolean) => {
    let className = getValueColorClass(0) + ' text-right';
    
    if (isHighlighted) {
      className += ' bg-brand-navy/50';
    }
    
    return className;
  };

  // Generate some sample data if there's no data provided
  const sampleData: ExposureRow[] = data.length > 0 ? data : Array.from({ length: 6 }, (_, i) => {
    const now = new Date();
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const month = `${date.toLocaleString('default', { month: 'short' })}-${date.getFullYear().toString().slice(2)}`;
    
    return {
      month,
      UCOME: 0,
      FAME0: 0,
      RME: 0,
      HVO: 0,
      LSGO: 0,
      ICE_GASOIL_FUTURES: 0
    };
  });

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[800px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Month</TableHead>
            <TableHead className="text-right">UCOME</TableHead>
            <TableHead className="text-right">FAME0</TableHead>
            <TableHead className="text-right">RME</TableHead>
            <TableHead className="text-right">HVO</TableHead>
            <TableHead className="text-right">LSGO</TableHead>
            <TableHead className="text-right">ICE GASOIL FUTURES</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sampleData.map((row) => (
            <TableRow key={row.month}>
              <TableCell className="font-medium">{row.month}</TableCell>
              <TableCell className={getCellClass('UCOME', highlightedProduct === 'UCOME')}>
                {formatValue(row.UCOME)}
              </TableCell>
              <TableCell className={getCellClass('FAME0', highlightedProduct === 'FAME0')}>
                {formatValue(row.FAME0)}
              </TableCell>
              <TableCell className={getCellClass('RME', highlightedProduct === 'RME')}>
                {formatValue(row.RME)}
              </TableCell>
              <TableCell className={getCellClass('HVO', highlightedProduct === 'HVO')}>
                {formatValue(row.HVO)}
              </TableCell>
              <TableCell className={getCellClass('LSGO', highlightedProduct === 'LSGO')}>
                {formatValue(row.LSGO)}
              </TableCell>
              <TableCell className={getCellClass('ICE_GASOIL_FUTURES', highlightedProduct === 'ICE_GASOIL_FUTURES')}>
                {formatValue(row.ICE_GASOIL_FUTURES)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PaperExposureTable;
