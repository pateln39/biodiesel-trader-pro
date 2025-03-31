
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExposureRow, ExposureData, PHYSICAL_COLUMN_ORDER, PRICING_COLUMN_ORDER } from '@/utils/exposureUtils';
import { cn } from '@/lib/utils';

interface ExposureTableProps {
  data: ExposureData;
}

const ExposureTable: React.FC<ExposureTableProps> = ({ data }) => {
  if (!data.rows.length) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No exposure data available.
      </div>
    );
  }
  
  const renderValue = (value: number | string) => {
    if (typeof value === 'number') {
      const formattedValue = Math.abs(value) < 0.01 ? '0' : value.toFixed(2);
      return (
        <span className={cn(
          'font-mono',
          value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : ''
        )}>
          {formattedValue}
        </span>
      );
    }
    return value;
  };

  // Determine which columns to show based on the data
  const physicalColumnsToShow = PHYSICAL_COLUMN_ORDER.filter(col => 
    data.rows.some(row => typeof row[col] === 'number' && row[col] !== 0) || 
    typeof data.summary[col] === 'number' && data.summary[col] !== 0
  );
  
  const pricingColumnsToShow = PRICING_COLUMN_ORDER.filter(col => 
    data.rows.some(row => typeof row[col] === 'number' && row[col] !== 0) || 
    typeof data.summary[col] === 'number' && data.summary[col] !== 0
  );
  
  // Calculate column spans
  const physicalColSpan = physicalColumnsToShow.length + 1; // +1 for Total column
  const pricingColSpan = pricingColumnsToShow.length + 1; // +1 for Total column

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/30">
          <TableHead rowSpan={2}>Month</TableHead>
          <TableHead colSpan={physicalColSpan} className="text-center border-r">Physical</TableHead>
          <TableHead colSpan={pricingColSpan} className="text-center border-r">Pricing</TableHead>
          <TableHead rowSpan={2}>Net</TableHead>
        </TableRow>
        <TableRow className="bg-muted/30">
          {/* Physical product columns */}
          {physicalColumnsToShow.map(col => (
            <TableHead key={`physical-${col}`}>{col}</TableHead>
          ))}
          <TableHead className="border-r">Total physical</TableHead>
          
          {/* Pricing instrument columns */}
          {pricingColumnsToShow.map(col => (
            <TableHead key={`pricing-${col}`}>{col}</TableHead>
          ))}
          <TableHead className="border-r">Total pricing</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.rows.map((row, index) => (
          <TableRow key={index} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
            <TableCell className="font-medium">{row.month}</TableCell>
            
            {/* Physical columns */}
            {physicalColumnsToShow.map(col => (
              <TableCell key={`row-${index}-physical-${col}`} className="text-right">
                {typeof row[col] === 'number' ? renderValue(row[col]) : '0'}
              </TableCell>
            ))}
            <TableCell className="text-right border-r font-medium">
              {renderValue(row['Total physical'])}
            </TableCell>
            
            {/* Pricing columns */}
            {pricingColumnsToShow.map(col => (
              <TableCell key={`row-${index}-pricing-${col}`} className="text-right">
                {typeof row[col] === 'number' ? renderValue(row[col]) : '0'}
              </TableCell>
            ))}
            <TableCell className="text-right border-r font-medium">
              {renderValue(row['Total pricing instrument'])}
            </TableCell>
            
            {/* Net column */}
            <TableCell className="text-right font-medium">
              {renderValue(row['Net exposure'])}
            </TableCell>
          </TableRow>
        ))}
        
        {/* Summary row */}
        <TableRow className="bg-muted/40">
          <TableCell className="font-semibold">{data.summary.month}</TableCell>
          
          {/* Physical summary */}
          {physicalColumnsToShow.map(col => (
            <TableCell key={`summary-physical-${col}`} className="text-right font-semibold">
              {typeof data.summary[col] === 'number' ? renderValue(data.summary[col]) : '0'}
            </TableCell>
          ))}
          <TableCell className="text-right border-r font-semibold">
            {renderValue(data.summary['Total physical'])}
          </TableCell>
          
          {/* Pricing summary */}
          {pricingColumnsToShow.map(col => (
            <TableCell key={`summary-pricing-${col}`} className="text-right font-semibold">
              {typeof data.summary[col] === 'number' ? renderValue(data.summary[col]) : '0'}
            </TableCell>
          ))}
          <TableCell className="text-right border-r font-semibold">
            {renderValue(data.summary['Total pricing instrument'])}
          </TableCell>
          
          {/* Net summary */}
          <TableCell className="text-right font-semibold">
            {renderValue(data.summary['Net exposure'])}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};

export default ExposureTable;
