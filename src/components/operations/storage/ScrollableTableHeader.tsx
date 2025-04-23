
import React from 'react';
import { TableHead, TableRow } from '@/components/ui/table';
import { TruncatedCell } from './TruncatedCell';
import { SUMMARY_COLUMN_WIDTHS, TABLE_HEADER_LABELS } from '@/constants/StorageConstants';
import { Tank } from '@/hooks/useTanks';

interface ScrollableTableHeaderProps {
  tanks: Tank[];
}

/**
 * Component for the scrollable part of the table header
 */
const ScrollableTableHeader: React.FC<ScrollableTableHeaderProps> = ({ tanks }) => {
  return (
    <TableRow className="bg-muted/50 border-b border-white/10 h-10">
      {/* Tank columns */}
      {tanks.map((tank) => (
        <React.Fragment key={tank.id}>
          <TableHead className="text-center text-[10px]">
            <TruncatedCell
              text="Movement (MT)"
              width={65}
              className="text-[10px] text-center mx-auto"
            />
          </TableHead>
          <TableHead className="text-center text-[10px]">
            <TruncatedCell
              text="Movement (M³)"
              width={65}
              className="text-[10px] text-center mx-auto"
            />
          </TableHead>
          <TableHead className="text-center text-[10px] bg-brand-navy border-r border-white/30">
            Balance
          </TableHead>
        </React.Fragment>
      ))}
      
      {/* Summary column headers */}
      {Object.entries(SUMMARY_COLUMN_WIDTHS).map(([key, width]) => (
        <TableHead 
          key={`summary-header-${key}`}
          className={`text-center text-[10px] ${
            key === 'currentUllage' || key === 'difference' ? "border-r border-white/30" : ""
          }`}
          style={{ width: `${width}px` }}
        >
          <TruncatedCell
            text={TABLE_HEADER_LABELS[key as keyof typeof TABLE_HEADER_LABELS]}
            width={width - 8}
            className="text-[10px] text-center mx-auto"
          />
        </TableHead>
      ))}
    </TableRow>
  );
};

export default ScrollableTableHeader;
